import { db } from '../firebase';
import { doc, updateDoc, arrayUnion, serverTimestamp, getDoc, Timestamp } from 'firebase/firestore';
import { Case, Task, ApprovalRequest, ApprovalStatus, UserRole } from '../types';
import { logActivity } from '../utils/activityLogger';

/**
 * Semi-Automated Approval Workflow Service
 * Implements mandatory human approval at each stage with feedback loops
 */

interface WorkflowStage {
  name: string;
  requiredApprovals: UserRole[];
  autoActions: string[]; // Actions that happen automatically after approval
}

const WORKFLOW_STAGES: Record<string, WorkflowStage> = {
  SITE_VISIT: {
    name: 'Site Visit',
    requiredApprovals: [UserRole.SITE_ENGINEER, UserRole.SALES_TEAM_MEMBER],
    autoActions: ['Create Drawing Task']
  },
  DRAWING: {
    name: 'Drawing',
    requiredApprovals: [UserRole.DRAWING_TEAM, UserRole.SITE_ENGINEER],
    autoActions: ['Create BOQ Task']
  },
  BOQ: {
    name: 'BOQ',
    requiredApprovals: [UserRole.QUOTATION_TEAM, UserRole.SITE_ENGINEER],
    autoActions: ['Create Quotation Task']
  },
  QUOTATION: {
    name: 'Quotation',
    requiredApprovals: [UserRole.SALES_TEAM_MEMBER, UserRole.SUPER_ADMIN],
    autoActions: ['Send to Client for Approval']
  },
  PAYMENT: {
    name: 'Payment Collection',
    requiredApprovals: [UserRole.ACCOUNTS_TEAM, UserRole.SUPER_ADMIN],
    autoActions: ['Convert to Project']
  },
  EXECUTION: {
    name: 'Execution',
    requiredApprovals: [UserRole.EXECUTION_TEAM, UserRole.SITE_ENGINEER],
    autoActions: ['Project Monitoring']
  }
};

export class ApprovalWorkflowService {

  /**
   * Initiates a new approval request for a workflow stage
   */
  static async initiateApproval(
    caseId: string,
    stage: string,
    requesterId: string,
    requesterName: string
  ): Promise<void> {
    const stageConfig = WORKFLOW_STAGES[stage];
    if (!stageConfig) {
      throw new Error(`Invalid workflow stage: ${stage}`);
    }

    // Create approval request document
    const approvalRef = doc(db, 'approvals', `${caseId}_${stage}_${Date.now()}`);

    const approvalRequest: Omit<ApprovalRequest, 'id'> = {
      caseId,
      stage,
      stageName: stageConfig.name,
      status: ApprovalStatus.PENDING,
      requesterId,
      requesterName,
      requiredRoles: stageConfig.requiredApprovals,
      approvedBy: [],
      rejectedBy: [],
      comments: [],
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any
    };

    await updateDoc(approvalRef, approvalRequest as any);

    // Log activity
    await logActivity({
      type: 'APPROVAL_INITIATED',
      caseId,
      description: `Approval initiated for ${stageConfig.name}`,
      metadata: {
        stage,
        requiredRoles: stageConfig.requiredApprovals
      }
    });

    // Sync to case.approvals array
    try {
      const caseRef = doc(db, 'cases', caseId);
      await updateDoc(caseRef, {
        approvals: arrayUnion({
          id: approvalRef.id,
          ...approvalRequest,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        })
      });
    } catch (e) {
      console.error('Failed to sync workflow approval to case array', e);
    }
  }

  /**
   * Approves a workflow stage
   */
  static async approveStage(
    approvalId: string,
    approverId: string,
    approverName: string,
    approverRole: UserRole,
    comments?: string
  ): Promise<void> {
    const approvalRef = doc(db, 'approvals', approvalId);
    const approvalSnap = await getDoc(approvalRef);

    if (!approvalSnap.exists()) {
      throw new Error('Approval request not found');
    }

    const approval = approvalSnap.data() as ApprovalRequest;

    // Check if user has required role
    if (!approval.requiredRoles.includes(approverRole)) {
      throw new Error('User not authorized to approve this stage');
    }

    // Check if already approved by this role
    if (approval.approvedBy.some(a => a.role === approverRole)) {
      throw new Error('Stage already approved by this role');
    }

    // Update approval
    const updatedApprovedBy = [
      ...approval.approvedBy,
      {
        userId: approverId,
        userName: approverName,
        role: approverRole,
        timestamp: serverTimestamp() as any,
        comments: comments || ''
      }
    ];

    const isFullyApproved = updatedApprovedBy.length >= approval.requiredRoles.length;
    const newStatus = isFullyApproved ? ApprovalStatus.APPROVED : ApprovalStatus.PENDING;

    await updateDoc(approvalRef, {
      approvedBy: updatedApprovedBy,
      status: newStatus,
      updatedAt: serverTimestamp()
    });

    // Log activity
    await logActivity({
      type: 'APPROVAL_GRANTED',
      caseId: approval.caseId,
      description: `${approverName} approved ${approval.stageName}`,
      metadata: {
        approvalId,
        approverRole,
        comments
      }
    });

    // If fully approved, trigger next stage
    if (isFullyApproved) {
      await this.triggerNextStage(approval);
    }

    // Sync array status
    await this.syncArrayStatus(approval.caseId, approvalId, newStatus, approverName);
  }

  /**
   * Rejects a workflow stage
   */
  static async rejectStage(
    approvalId: string,
    rejectorId: string,
    rejectorName: string,
    rejectorRole: UserRole,
    reason: string
  ): Promise<void> {
    const approvalRef = doc(db, 'approvals', approvalId);
    const approvalSnap = await getDoc(approvalRef);

    if (!approvalSnap.exists()) {
      throw new Error('Approval request not found');
    }

    const approval = approvalSnap.data() as ApprovalRequest;

    // Check authorization
    if (!approval.requiredRoles.includes(rejectorRole)) {
      throw new Error('User not authorized to reject this stage');
    }

    await updateDoc(approvalRef, {
      status: ApprovalStatus.REJECTED,
      rejectedBy: arrayUnion({
        userId: rejectorId,
        userName: rejectorName,
        role: rejectorRole,
        timestamp: serverTimestamp() as any,
        reason
      }),
      updatedAt: serverTimestamp()
    });

    // Log activity
    await logActivity({
      type: 'APPROVAL_REJECTED',
      caseId: approval.caseId,
      description: `${rejectorName} rejected ${approval.stageName}`,
      metadata: {
        approvalId,
        rejectorRole,
        reason
      }
    });

    // Sync array status
    await this.syncArrayStatus(approval.caseId, approvalId, ApprovalStatus.REJECTED, rejectorName);
  }

  private static async syncArrayStatus(caseId: string, approvalId: string, status: string, by: string) {
    const caseRef = doc(db, 'cases', caseId);
    try {
      const snap = await getDoc(caseRef);
      if (snap.exists()) {
        const data = snap.data();
        const approvals = data.approvals || [];
        const idx = approvals.findIndex((a: any) => a.id === approvalId);
        if (idx > -1) {
          const updated = [...approvals];
          updated[idx] = {
            ...updated[idx],
            status,
            updatedAt: Timestamp.now(),
            [status === ApprovalStatus.REJECTED ? 'rejectedBy' : 'approvedBy']: arrayUnion({ name: by, timestamp: Timestamp.now() }) // Simplification
          };
          await updateDoc(caseRef, { approvals: updated });
        }
      }
    } catch (e) {
      console.error('Failed to sync workflow status to array', e);
    }
  }

  /**
   * Triggers next workflow stage after approval
   */
  private static async triggerNextStage(approval: ApprovalRequest): Promise<void> {
    const stageConfig = WORKFLOW_STAGES[approval.stage];
    if (!stageConfig) return;

    // Execute auto-actions
    for (const action of stageConfig.autoActions) {
      await this.executeAutoAction(approval.caseId, action, approval.stage);
    }

    // Log completion
    await logActivity({
      type: 'STAGE_COMPLETED',
      caseId: approval.caseId,
      description: `${approval.stageName} completed and approved`,
      metadata: {
        stage: approval.stage,
        autoActions: stageConfig.autoActions
      }
    });
  }

  /**
   * Executes automatic actions after stage approval
   */
  private static async executeAutoAction(
    caseId: string,
    action: string,
    completedStage: string
  ): Promise<void> {
    switch (action) {
      case 'Create Drawing Task':
        await this.createTask(caseId, 'Drawing', 'Create detailed drawings');
        break;
      case 'Create BOQ Task':
        await this.createTask(caseId, 'BOQ Preparation', 'Prepare Bill of Quantities');
        break;
      case 'Create Quotation Task':
        await this.createTask(caseId, 'Quotation', 'Prepare client quotation');
        break;
      case 'Send to Client for Approval':
        await this.updateCaseStatus(caseId, 'QUOTATION_SENT');
        break;
      case 'Convert to Project':
        await this.convertToProject(caseId);
        break;
      case 'Project Monitoring':
        await this.createTask(caseId, 'Project Monitoring', 'Monitor project progress');
        break;
    }
  }

  /**
   * Creates a new task in the system
   */
  private static async createTask(
    caseId: string,
    title: string,
    description: string
  ): Promise<void> {
    // Implementation depends on your task system
    console.log(`Creating task: ${title} for case ${caseId}`);
    // TODO: Implement actual task creation
  }

  /**
   * Updates case status
   */
  private static async updateCaseStatus(caseId: string, status: string): Promise<void> {
    const caseRef = doc(db, 'cases', caseId);
    await updateDoc(caseRef, {
      status,
      updatedAt: serverTimestamp()
    });
  }

  /**
   * Converts case to project after payment approval
   * HARD RULE: Only converts if payment has been verified by accountant
   */
  private static async convertToProject(caseId: string): Promise<void> {
    const caseRef = doc(db, 'cases', caseId);
    const caseSnap = await getDoc(caseRef);

    if (!caseSnap.exists()) {
      throw new Error(`Case ${caseId} not found`);
    }

    const caseData = caseSnap.data();

    // HARD RULE: No project before payment verification
    if (!caseData.financial?.paymentVerified) {
      throw new Error('BLOCKED: Cannot convert to project - payment not verified by accountant');
    }

    // HARD RULE: Must be in WAITING_FOR_PLANNING status
    if (caseData.status !== 'waiting_for_planning') {
      throw new Error(`BLOCKED: Cannot convert to project - invalid status: ${caseData.status}. Must be WAITING_FOR_PLANNING.`);
    }

    await updateDoc(caseRef, {
      isProject: true,
      projectStartDate: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }

  /**
   * Gets pending approvals for a user based on their role
   */
  static async getPendingApprovals(userRole: UserRole): Promise<ApprovalRequest[]> {
    // This would typically be a Firestore query
    // For now returning empty array - implement based on your data structure
    return [];
  }

  /**
   * Gets approval history for a case
   */
  static async getApprovalHistory(caseId: string): Promise<ApprovalRequest[]> {
    // Query approvals collection for specific case
    return [];
  }
}

// Export singleton instance
export const approvalWorkflow = new ApprovalWorkflowService();
