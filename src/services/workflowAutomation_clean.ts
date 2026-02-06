/**
 * Workflow Automation Service
 * 
 * Handles automatic task creation and status transitions for the complete case lifecycle:
 * Lead → Site Visit → Drawing → BOQ → Quotation → Payment → Execution → Completion
 */

import {
  collection,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  getDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  Case,
  CaseTask,
  CaseStatus,
  TaskType,
  TaskStatus,
  CaseWorkflow,
  UserRole,
} from '../types';
import { FIRESTORE_COLLECTIONS } from '../constants';
import { ApprovalWorkflowService } from './approvalWorkflowService';

// ========================================
// WORKFLOW TRIGGER FUNCTIONS
// ========================================

/**
 * Trigger: Case created (Lead)
 * Action: No auto-task yet - waits for manual assignment
 */
export const onCaseCreated = async (
  organizationId: string,
  caseId: string,
  createdBy: string
) => {
  // Log activity only
  await logActivity(organizationId, caseId, 'Case created', createdBy);
};

/**
 * Trigger: Lead assigned to sales person
 * Action: Create site visit task for site engineer
 */
export const onLeadAssigned = async (
  organizationId: string,
  caseId: string,
  assignedTo: string,
  assignedBy: string
) => {
  try {
    // Get case data to determine if site engineer is assigned
    const caseRef = doc(
      db!,
      FIRESTORE_COLLECTIONS.ORGANIZATIONS,
      organizationId,
      FIRESTORE_COLLECTIONS.CASES,
      caseId
    );
    const caseSnap = await getDoc(caseRef);
    const caseData = caseSnap.data() as Case;

    // Check if there's a site engineer to assign
    // For now, we'll require manual site visit scheduling
    await logActivity(organizationId, caseId, `Lead assigned to ${assignedTo}`, assignedBy);
    
    // Send notification to assigned sales person
    await sendNotification(
      assignedTo,
      'New Lead Assigned',
      `You have been assigned a new lead: ${caseData.title}`,
      'info',
      `/cases/${caseId}`
    );
  } catch (err) {
    console.error('Error on lead assigned:', err);
  }
};

/**
 * Trigger: Site visit task requested/created
 * Action: Notify site engineer
 */
export const onSiteVisitTaskCreated = async (
  organizationId: string,
  caseId: string,
  taskId: string,
  engineerId: string,
  createdBy: string
) => {
  try {
    await logActivity(organizationId, caseId, 'Site visit task created', createdBy);
    
    await sendNotification(
      engineerId,
      'Site Visit Task Assigned',
      'You have been assigned a new site visit',
      'info',
      `/cases/${caseId}/tasks/${taskId}`
    );
  } catch (err) {
    console.error('Error on site visit task created:', err);
  }
};

/**
 * Trigger: Site visit task completed
 * Action: Auto-create drawing task + update case workflow
 */
export const onSiteVisitCompleted = async (
  organizationId: string,
  caseId: string,
  taskId: string,
  completedBy: string
) => {
  if (!db) return;

  try {
    // Update case workflow
    const caseRef = doc(
      db,
      FIRESTORE_COLLECTIONS.ORGANIZATIONS,
      organizationId,
      FIRESTORE_COLLECTIONS.CASES,
      caseId
    );
    
    await updateDoc(caseRef, {
      status: CaseStatus.DRAWING,
      'workflow.siteVisitDone': true,
      'workflow.currentStage': CaseStatus.DRAWING,
      updatedAt: serverTimestamp(),
    });

    // Get case data to find drawing team assignment
    const caseSnap = await getDoc(caseRef);
    const caseData = caseSnap.data() as Case;

    // INITIATE APPROVAL for Drawing stage
    await ApprovalWorkflowService.initiateApproval(
      caseId,
      'DRAWING',
      completedBy,
      caseData.createdBy || 'System'
    );

    await logActivity(organizationId, caseId, 'Site visit completed - Drawing approval initiated', completedBy);
  } catch (err) {
    console.error('Error on site visit completed:', err);
  }
};

/**
 * Trigger: Drawing uploaded
 * Action: Auto-create BOQ task (mandatory) + update workflow
 */
export const onDrawingUploaded = async (
  organizationId: string,
  caseId: string,
  uploadedBy: string
) => {
  if (!db) return;

  try {
    // Update case workflow
    const caseRef = doc(
      db,
      FIRESTORE_COLLECTIONS.ORGANIZATIONS,
      organizationId,
      FIRESTORE_COLLECTIONS.CASES,
      caseId
    );
    
    await updateDoc(caseRef, {
      status: CaseStatus.BOQ,
      'workflow.drawingDone': true,
      'workflow.currentStage': CaseStatus.BOQ,
      updatedAt: serverTimestamp(),
    });

    // Get case data
    const caseSnap = await getDoc(caseRef);
    const caseData = caseSnap.data() as Case;

    // Create BOQ task - must be completed within 4 hours
    const tasksRef = collection(
      db,
      FIRESTORE_COLLECTIONS.ORGANIZATIONS,
      organizationId,
      FIRESTORE_COLLECTIONS.CASES,
      caseId,
      FIRESTORE_COLLECTIONS.TASKS
    );

    const boqTask: Omit<CaseTask, 'id'> = {
      caseId,
      type: TaskType.BOQ,
      assignedTo: uploadedBy, // Assign to drawing team member who uploaded
      assignedBy: caseData.createdBy,
      status: TaskStatus.PENDING,
      createdAt: new Date(),
      notes: 'BOQ must be completed within 4 hours of drawing upload',
    };

    await addDoc(tasksRef, {
      ...boqTask,
      createdAt: serverTimestamp(),
    });

    await logActivity(organizationId, caseId, 'Drawing uploaded - BOQ task created', uploadedBy);
    
    await sendNotification(
      uploadedBy,
      'BOQ Required',
      `Please complete BOQ for ${caseData.title} within 4 hours`,
      'warning',
      `/cases/${caseId}`
    );
  } catch (err) {
    console.error('Error on drawing uploaded:', err);
  }
};

/**
 * Trigger: BOQ submitted
 * Action: Auto-create quotation task + update workflow
 */
export const onBOQSubmitted = async (
  organizationId: string,
  caseId: string,
  submittedBy: string
) => {
  if (!db) return;

  try {
    // Update case workflow
    const caseRef = doc(
      db,
      FIRESTORE_COLLECTIONS.ORGANIZATIONS,
      organizationId,
      FIRESTORE_COLLECTIONS.CASES,
      caseId
    );
    
    await updateDoc(caseRef, {
      status: CaseStatus.QUOTATION,
      'workflow.boqDone': true,
      'workflow.currentStage': CaseStatus.QUOTATION,
      updatedAt: serverTimestamp(),
    });

    // Get case data
    const caseSnap = await getDoc(caseRef);
    const caseData = caseSnap.data() as Case;

    // Create quotation task for quotation team
    const tasksRef = collection(
      db,
      FIRESTORE_COLLECTIONS.ORGANIZATIONS,
      organizationId,
      FIRESTORE_COLLECTIONS.CASES,
      caseId,
      FIRESTORE_COLLECTIONS.TASKS
    );

    const quotationTask: Omit<CaseTask, 'id'> = {
      caseId,
      type: TaskType.QUOTATION,
      assignedTo: caseData.createdBy, // Temporarily assign to creator - should be quotation team
      assignedBy: submittedBy,
      status: TaskStatus.PENDING,
      createdAt: new Date(),
      notes: 'Create quotation from BOQ',
    };

    await addDoc(tasksRef, {
      ...quotationTask,
      createdAt: serverTimestamp(),
    });

    await logActivity(organizationId, caseId, 'BOQ submitted - Quotation task created', submittedBy);
    
    await sendNotification(
      caseData.createdBy,
      'BOQ Submitted',
      `BOQ submitted for ${caseData.title}. Quotation task created.`,
      'success',
      `/cases/${caseId}`
    );
  } catch (err) {
    console.error('Error on BOQ submitted:', err);
  }
};

/**
 * Trigger: Quotation approved by admin
 * Action: Update workflow + notify sales
 */
export const onQuotationApproved = async (
  organizationId: string,
  caseId: string,
  approvedBy: string
) => {
  if (!db) return;

  try {
    // Update case workflow
    const caseRef = doc(
      db,
      FIRESTORE_COLLECTIONS.ORGANIZATIONS,
      organizationId,
      FIRESTORE_COLLECTIONS.CASES,
      caseId
    );
    
    await updateDoc(caseRef, {
      'workflow.quotationDone': true,
      updatedAt: serverTimestamp(),
    });

    // Get case data
    const caseSnap = await getDoc(caseRef);
    const caseData = caseSnap.data() as Case;

    await logActivity(organizationId, caseId, 'Quotation approved', approvedBy);
    
    // Notify sales person
    if (caseData.assignedSales) {
      await sendNotification(
        caseData.assignedSales,
        'Quotation Approved',
        `Quotation approved for ${caseData.title}. Ready to send to client.`,
        'success',
        `/cases/${caseId}`
      );
    }
  } catch (err) {
    console.error('Error on quotation approved:', err);
  }
};

/**
 * Trigger: Payment verified by accounts
 * Action: Convert to project + create execution task
 */
export const onPaymentVerified = async (
  organizationId: string,
  caseId: string,
  verifiedBy: string
) => {
  if (!db) return;

  try {
    // Update case to project
    const caseRef = doc(
      db,
      FIRESTORE_COLLECTIONS.ORGANIZATIONS,
      organizationId,
      FIRESTORE_COLLECTIONS.CASES,
      caseId
    );
    
    await updateDoc(caseRef, {
      isProject: true,
      status: CaseStatus.EXECUTION,
      'workflow.paymentVerified': true,
      'workflow.currentStage': CaseStatus.EXECUTION,
      updatedAt: serverTimestamp(),
    });

    // Get case data
    const caseSnap = await getDoc(caseRef);
    const caseData = caseSnap.data() as Case;

    await logActivity(organizationId, caseId, 'Payment verified - Converted to project', verifiedBy);
    
    // Notify all stakeholders
    const notifyUsers = [
      caseData.createdBy,
      caseData.assignedSales,
      caseData.projectHead,
    ].filter(Boolean);

    for (const userId of notifyUsers as string[]) {
      await sendNotification(
        userId,
        'Project Activated',
        `${caseData.title} has been converted to an active project`,
        'success',
        `/cases/${caseId}`
      );
    }
  } catch (err) {
    console.error('Error on payment verified:', err);
  }
};

/**
 * Trigger: Execution approved
 * Action: Update workflow + notify execution team
 */
export const onExecutionApproved = async (
  organizationId: string,
  caseId: string,
  approvedBy: string
) => {
  if (!db) return;

  try {
    // Update case workflow
    const caseRef = doc(
      db,
      FIRESTORE_COLLECTIONS.ORGANIZATIONS,
      organizationId,
      FIRESTORE_COLLECTIONS.CASES,
      caseId
    );
    
    await updateDoc(caseRef, {
      'workflow.executionApproved': true,
      updatedAt: serverTimestamp(),
    });

    await logActivity(organizationId, caseId, 'Execution plan approved - Project active', approvedBy);
  } catch (err) {
    console.error('Error on execution approved:', err);
  }
};

/**
 * Trigger: JMS signed
 * Action: Mark project as completed
 */
export const onJMSSigned = async (
  organizationId: string,
  caseId: string,
  signedBy: string
) => {
  if (!db) return;

  try {
    // Update case status to completed
    const caseRef = doc(
      db,
      FIRESTORE_COLLECTIONS.ORGANIZATIONS,
      organizationId,
      FIRESTORE_COLLECTIONS.CASES,
      caseId
    );
    
    await updateDoc(caseRef, {
      status: CaseStatus.COMPLETED,
      'workflow.currentStage': CaseStatus.COMPLETED,
      'closure.jmsSigned': true,
      'closure.jmsSignedAt': serverTimestamp(),
      'closure.completedAt': serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Get case data
    const caseSnap = await getDoc(caseRef);
    const caseData = caseSnap.data() as Case;

    await logActivity(organizationId, caseId, 'JMS signed - Project completed', signedBy);
    
    // Notify all stakeholders
    const notifyUsers = [
      caseData.createdBy,
      caseData.assignedSales,
      caseData.projectHead,
    ].filter(Boolean);

    for (const userId of notifyUsers as string[]) {
      await sendNotification(
        userId,
        'Project Completed',
        `${caseData.title} has been successfully completed!`,
        'success',
        `/cases/${caseId}`
      );
    }
  } catch (err) {
    console.error('Error on JMS signed:', err);
  }
};

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Log activity to case activity subcollection
 */
const logActivity = async (
  organizationId: string,
  caseId: string,
  action: string,
  userId: string
) => {
  if (!db) return;

  try {
    const activitiesRef = collection(
      db,
      FIRESTORE_COLLECTIONS.ORGANIZATIONS,
      organizationId,
      FIRESTORE_COLLECTIONS.CASES,
      caseId,
      FIRESTORE_COLLECTIONS.ACTIVITIES
    );

    await addDoc(activitiesRef, {
      action,
      by: userId,
      timestamp: serverTimestamp(),
    });
  } catch (err) {
    console.error('Error logging activity:', err);
  }
};

/**
 * Send notification to user
 */
const sendNotification = async (
  userId: string,
  title: string,
  message: string,
  type: 'info' | 'success' | 'warning' | 'error',
  actionUrl?: string
) => {
  if (!db) return;

  try {
    const notificationsRef = collection(
      db,
      FIRESTORE_COLLECTIONS.STAFF_USERS,
      userId,
      FIRESTORE_COLLECTIONS.NOTIFICATIONS
    );

    await addDoc(notificationsRef, {
      userId,
      title,
      message,
      type,
      read: false,
      createdAt: serverTimestamp(),
      ...(actionUrl && { actionUrl }),
    });
  } catch (err) {
    console.error('Error sending notification:', err);
  }
}