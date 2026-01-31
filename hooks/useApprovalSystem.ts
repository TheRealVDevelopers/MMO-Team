import { useState, useEffect } from 'react';
import { format } from 'date-fns';
// Hook for managing approvals
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { ApprovalRequest, ApprovalRequestType, ApprovalStatus, UserRole, LeadPipelineStatus, ActivityStatus, ProjectStatus, ExecutionStage } from '../types';
import { USERS, formatCurrencyINR } from '../constants';
import { createNotification, logActivity } from '../services/liveDataService';

export const useApprovals = () => {
  const [loading, setLoading] = useState(false);

  const submitRequest = async (requestData: Omit<ApprovalRequest, 'id' | 'requestedAt' | 'status'>) => {
    setLoading(true);
    try {
      const requestId = await createApprovalRequest(requestData);

      // Notify Sales Managers (Sarah Manager and others with the role)
      const salesManagers = USERS.filter(u => u.role === UserRole.SALES_GENERAL_MANAGER);
      for (const manager of salesManagers) {
        await createNotification({
          title: 'New Service Request',
          message: `Strategic Alert: ${requestData.requesterName} has raised a "${requestData.requestType}" request for ${requestData.title.split('for ')[1] || 'client'}.`,
          user_id: manager.id,
          entity_type: 'system',
          entity_id: requestId,
          type: 'info'
        });
      }

      return requestId;
    } finally {
      setLoading(false);
    }
  };

  return { submitRequest, loading };
};

// Get all approval requests (for Admin)
export const useApprovalRequests = (filterStatus?: ApprovalStatus) => {
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let q = query(
      collection(db, 'approvalRequests'),
      orderBy('requestedAt', 'desc')
    );

    if (filterStatus) {
      q = query(
        collection(db, 'approvalRequests'),
        where('status', '==', filterStatus),
        orderBy('requestedAt', 'desc')
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const approvalRequests: ApprovalRequest[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        approvalRequests.push({
          id: doc.id,
          requestType: data.requestType,
          requesterId: data.requesterId,
          requesterName: data.requesterName,
          requesterRole: data.requesterRole,
          title: data.title,
          description: data.description,
          startDate: data.startDate && (data.startDate as any).toDate ? (data.startDate as Timestamp).toDate() : undefined,
          endDate: data.endDate && (data.endDate as any).toDate ? (data.endDate as Timestamp).toDate() : undefined,
          duration: data.duration,
          status: data.status,
          requestedAt: data.requestedAt && (data.requestedAt as any).toDate ? (data.requestedAt as Timestamp).toDate() : new Date(),
          reviewedAt: data.reviewedAt && (data.reviewedAt as any).toDate ? (data.reviewedAt as Timestamp).toDate() : undefined,
          reviewedBy: data.reviewedBy,
          reviewerName: data.reviewerName,
          reviewerComments: data.reviewerComments,
          attachments: data.attachments || [],
          priority: data.priority || 'Medium',
          contextId: data.contextId,
          clientName: data.clientName,
          targetRole: data.targetRole,
          assigneeId: data.assigneeId,
          // Staff registration specific fields
          email: data.email,
          password: data.password,
          phone: data.phone,
          region: data.region,
          requestedRole: data.requestedRole,
        });
      });
      setRequests(approvalRequests);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [filterStatus]);

  return { requests, loading };
};

// Get approval requests for specific user
export const useMyApprovalRequests = (userId: string) => {
  const [myRequests, setMyRequests] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'approvalRequests'),
      where('requesterId', '==', userId),
      orderBy('requestedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const approvalRequests: ApprovalRequest[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        approvalRequests.push({
          id: doc.id,
          requestType: data.requestType,
          requesterId: data.requesterId,
          requesterName: data.requesterName,
          requesterRole: data.requesterRole,
          title: data.title,
          description: data.description,
          startDate: data.startDate && (data.startDate as any).toDate ? (data.startDate as Timestamp).toDate() : undefined,
          endDate: data.endDate && (data.endDate as any).toDate ? (data.endDate as Timestamp).toDate() : undefined,
          duration: data.duration,
          status: data.status,
          requestedAt: data.requestedAt && (data.requestedAt as any).toDate ? (data.requestedAt as Timestamp).toDate() : new Date(),
          reviewedAt: data.reviewedAt && (data.reviewedAt as any).toDate ? (data.reviewedAt as Timestamp).toDate() : undefined,
          reviewedBy: data.reviewedBy,
          reviewerName: data.reviewerName,
          reviewerComments: data.reviewerComments,
          attachments: data.attachments || [],
          priority: data.priority || 'Medium',
          contextId: data.contextId,
          clientName: data.clientName,
          targetRole: data.targetRole,
          assigneeId: data.assigneeId,
          // Staff registration specific fields
          email: data.email,
          password: data.password,
          phone: data.phone,
          region: data.region,
          requestedRole: data.requestedRole,
        });
      });
      setMyRequests(approvalRequests);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return { myRequests, loading };
};

// Get approval requests assigned to specific user
export const useAssignedApprovalRequests = (userId: string) => {
  const [assignedRequests, setAssignedRequests] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'approvalRequests'),
      where('assigneeId', '==', userId),
      orderBy('requestedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const approvalRequests: ApprovalRequest[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        approvalRequests.push({
          id: doc.id,
          requestType: data.requestType,
          requesterId: data.requesterId,
          requesterName: data.requesterName,
          requesterRole: data.requesterRole,
          title: data.title,
          description: data.description,
          startDate: data.startDate && (data.startDate as any).toDate ? (data.startDate as Timestamp).toDate() : undefined,
          endDate: data.endDate && (data.endDate as any).toDate ? (data.endDate as Timestamp).toDate() : undefined,
          duration: data.duration,
          status: data.status,
          requestedAt: data.requestedAt && (data.requestedAt as any).toDate ? (data.requestedAt as Timestamp).toDate() : new Date(),
          reviewedAt: data.reviewedAt && (data.reviewedAt as any).toDate ? (data.reviewedAt as Timestamp).toDate() : undefined,
          reviewedBy: data.reviewedBy,
          reviewerName: data.reviewerName,
          reviewerComments: data.reviewerComments,
          attachments: data.attachments || [],
          priority: data.priority || 'Medium',
          contextId: data.contextId,
          clientName: data.clientName,
          targetRole: data.targetRole,
          assigneeId: data.assigneeId,
          stages: data.stages || [], // Include stages
          // Staff registration specific fields
          email: data.email,
          password: data.password,
          phone: data.phone,
          region: data.region,
          requestedRole: data.requestedRole,
        });
      });
      setAssignedRequests(approvalRequests);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return { assignedRequests, loading };
};

// Get pending approvals count (for notifications)
export const usePendingApprovalsCount = () => {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'approvalRequests'),
      where('status', '==', ApprovalStatus.PENDING)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCount(snapshot.size);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { count, loading };
};

// Create new approval request
export const createApprovalRequest = async (
  requestData: Omit<ApprovalRequest, 'id' | 'requestedAt' | 'status'>
) => {
  try {
    // Filter out undefined values to prevent Firebase errors
    const cleanedData = Object.fromEntries(
      Object.entries(requestData).filter(([_, v]) => v !== undefined)
    );

    const docRef = await addDoc(collection(db, 'approvalRequests'), {
      ...cleanedData,
      status: ApprovalStatus.PENDING,
      requestedAt: serverTimestamp(),
      startDate: requestData.startDate ? Timestamp.fromDate(requestData.startDate) : null,
      endDate: requestData.endDate ? Timestamp.fromDate(requestData.endDate) : null,
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating approval request:', error);
    throw error;
  }
};

// Approve request
export const approveRequest = async (
  requestId: string,
  reviewerId: string,
  reviewerName: string,
  assigneeId?: string,
  comments?: string,
  deadline?: Date,
  stages?: ExecutionStage[]
) => {
  try {
    const requestRef = doc(db, 'approvalRequests', requestId);

    // Fetch the request to get requesterId and context
    const requestSnap = await getDoc(requestRef);
    if (!requestSnap.exists()) return;
    const data = requestSnap.data() as ApprovalRequest;

    // Handle Staff Registration Approval - Create Account
    if (data.requestType === ApprovalRequestType.STAFF_REGISTRATION) {
      try {
        // Import the account creation function
        const { createStaffAccountFromApproval } = await import('../services/authService');
        
        // Use the assigned role (from admin) or fallback to requested role
        const finalRole = (data.assigneeId && data.targetRole) ? data.targetRole : (data.requestedRole || UserRole.SALES_TEAM_MEMBER);
        
        // Create the actual Firebase Auth account
        const userId = await createStaffAccountFromApproval(
          data.email!,
          data.password!,
          data.requesterName,
          finalRole,
          data.phone!,
          data.region
        );

        // Update the request with the new user ID
        await updateDoc(requestRef, {
          status: ApprovalStatus.APPROVED,
          reviewedAt: serverTimestamp(),
          reviewedBy: reviewerId,
          reviewerName: reviewerName,
          reviewerComments: comments || 'Staff registration approved. Account created successfully.',
          requesterId: userId, // Update with the actual created user ID
          assigneeId: null // Not applicable for staff registration
        });

        // Notify the new user (they can now login)
        await createNotification({
          title: 'Account Approved',
          message: `Welcome to Make My Office! Your staff account has been approved. You can now login with your email (${data.email}) and assigned role: ${finalRole}.`,
          user_id: userId,
          entity_type: 'system',
          entity_id: requestId,
          type: 'success'
        });

        console.log(`Staff account created and approved for: ${data.requesterName}`);
        return;
      } catch (error) {
        console.error('Error creating staff account from approval:', error);
        throw new Error('Failed to create staff account. Please try again.');
      }
    }

    const assignee = USERS.find(u => u.id === assigneeId);
    const assigneeName = assignee ? assignee.name : 'Team Member';
    const assigneeRole = assignee ? assignee.role : 'Specialist';

    // For Execution Requests, we don't mark as APPROVED yet, we go to AWAITING_EXECUTION_ACCEPTANCE
    // This allows the "Negotiation" phase with the worker.
    // UNLESS it's already in NEGOTIATION status and we are approving the changes, then we might accept it.
    // But per requirements: "once the manager or the admin approve... complete request would go to the execution team member"

    let newStatus = ApprovalStatus.APPROVED;
    if (data.requestType === ApprovalRequestType.EXECUTION_TOKEN) {
      // logic:
      // PENDING -> AWAITING_EXECUTION_ACCEPTANCE (Admin approves)
      // NEGOTIATION -> AWAITING_EXECUTION_ACCEPTANCE (Admin approves changes)
      // AWAITING_EXECUTION_ACCEPTANCE -> APPROVED (Execution Team accepts)

      if (data.status === ApprovalStatus.PENDING || data.status === 'Negotiation') {
        newStatus = ApprovalStatus.AWAITING_EXECUTION_ACCEPTANCE;
      }
    }

    // update request status
    await updateDoc(requestRef, {
      status: newStatus,
      reviewedAt: serverTimestamp(),
      reviewedBy: reviewerId,
      reviewerName: reviewerName,
      reviewerComments: comments || '',
      assigneeId: assigneeId || null,
      stages: stages || data.stages || []
    });

    // 1. Notify Requester (Sales Member)
    await createNotification({
      title: 'Work Request Approved',
      message: `Strategic Update: Your request for "${data.title}" has been approved. ${assigneeName} (${assigneeRole}) has been allotted to this task. Please coordinate with the client.`,
      user_id: data.requesterId,
      entity_type: 'system',
      entity_id: requestId,
      type: 'success'
    });

    // 3. Pre-fetch Context info for task and status updates
    let contextType: 'lead' | 'project' | undefined;
    let leadSnap: any;
    let projectSnap: any;
    let leadRef: any;
    let projectRef: any;

    if (data.contextId) {
      leadRef = doc(db, 'leads', data.contextId);
      leadSnap = await getDoc(leadRef);
      if (leadSnap.exists()) {
        contextType = 'lead';
      } else {
        projectRef = doc(db, 'projects', data.contextId);
        projectSnap = await getDoc(projectRef);
        if (projectSnap.exists()) {
          contextType = 'project';
        } else {
          // Fallback based on request type if not found in Firestore (e.g. demo data)
          const isLeadRequest = [
            ApprovalRequestType.SITE_VISIT,
            ApprovalRequestType.SITE_VISIT_TOKEN,
            ApprovalRequestType.RESCHEDULE_SITE_VISIT
          ].includes(data.requestType);

          const isProjectRequest = [
            ApprovalRequestType.START_DRAWING,
            ApprovalRequestType.DESIGN_CHANGE,
            ApprovalRequestType.DRAWING_REVISIONS,
            ApprovalRequestType.QUOTATION_APPROVAL,
            ApprovalRequestType.QUOTATION_TOKEN
          ].includes(data.requestType);

          if (isLeadRequest) contextType = 'lead';
          else if (isProjectRequest) contextType = 'project';
        }
      }
    }

    // 2. If assigned, create a task (existing logic simplified since we have data)
    if (assigneeId) {
      const { addTask } = await import('./useMyDayTasks');

      // If comments were edited/provided, use them. Otherwise fallback to original description.
      const taskDescription = comments || data.description;

      // Primary task for the request
      await addTask({
        title: data.title,
        description: `Strategic Assignment for ${data.requestType}.\n\nInstructions: ${taskDescription}`,
        userId: assigneeId,
        status: 'Pending' as any,
        priority: data.priority,
        deadline: deadline ? deadline.toISOString() : (data.endDate ? (data.endDate as any).toDate().toISOString() : undefined),
        date: deadline ? deadline.toISOString().split('T')[0] : (data.endDate ? (data.endDate as any).toDate().toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
        timeSpent: 0,
        isPaused: false,
        createdAt: new Date(),
        createdBy: reviewerId,
        createdByName: reviewerName,
        // Linkage
        contextId: data.contextId,
        contextType: contextType,
        requesterId: data.requesterId
      }, reviewerId);

      // Automated Task Creation for Execution Stages
      if (newStatus === ApprovalStatus.APPROVED && data.requestType === ApprovalRequestType.EXECUTION_TOKEN && stages) {
        for (const stage of stages) {
          await addTask({
            title: `[Project Stage] ${stage.name} - ${data.title}`,
            description: `Automated Execution Stage Task: ${stage.name}.\nProject: ${data.title}`,
            userId: assigneeId,
            status: 'Pending' as any,
            priority: data.priority || 'High',
            deadline: stage.deadline ? (stage.deadline instanceof Date ? stage.deadline.toISOString() : new Date(stage.deadline).toISOString()) : undefined,
            date: stage.deadline ? (stage.deadline instanceof Date ? stage.deadline.toISOString().split('T')[0] : new Date(stage.deadline).toISOString().split('T')[0]) : new Date().toISOString().split('T')[0],
            timeSpent: 0,
            isPaused: false,
            createdAt: new Date(),
            createdBy: reviewerId,
            createdByName: reviewerName,
            contextId: data.contextId,
            contextType: 'project',
            requesterId: data.requesterId
          }, reviewerId);
        }
      }
    }

    // 4. Update Lead/Project if contextId exists
    if (data.contextId && contextType) {
      if (contextType === 'lead' && leadSnap && leadSnap.exists()) {
        const leadData = leadSnap.data();
        const scheduledTime = deadline ? format(deadline, 'PPP p') : (data.endDate ? format((data.endDate as any).toDate(), 'PPP p') : 'TBD');

        let updates: any = {
          history: [
            ...(leadData.history || []),
            {
              action: 'Authorization Initiated',
              user: reviewerName,
              timestamp: new Date(),
              notes: `${data.requestType} authorized for ${assigneeName} (${assigneeRole}). Scheduled: ${scheduledTime}.${comments ? ` Note: ${comments}` : ''}`
            }
          ]
        };

        // Auto-Status Updates & Task List
        if (data.requestType === ApprovalRequestType.SITE_VISIT || data.requestType === ApprovalRequestType.SITE_VISIT_TOKEN) {
          updates.status = LeadPipelineStatus.SITE_VISIT_SCHEDULED;
          if (!updates.tasks) updates.tasks = leadData.tasks || {};
          if (!updates.tasks.siteVisits) updates.tasks.siteVisits = [];
          updates.tasks.siteVisits.push(`${assigneeName} - Assigned ${new Date().toLocaleDateString()}`);

          // Automatic Project Conversion
          try {
            const projectsRef = collection(db, 'projects');
            // Check if already converted
            if (!leadData.isConverted) {
              const projectData: any = {
                id: leadData.id, // Keep same ID for easy linkage or generate new
                clientName: leadData.clientName,
                projectName: leadData.projectName,
                status: ProjectStatus.AWAITING_DESIGN,
                budget: leadData.value || 0,
                priority: leadData.priority,
                clientAddress: '',
                clientContact: {
                  name: leadData.clientName,
                  phone: leadData.clientMobile || ''
                },
                assignedTeam: {
                  salespersonId: leadData.assignedTo,
                },
                progress: 0,
                milestones: [],
                startDate: serverTimestamp(),
                endDate: leadData.deadline ? leadData.deadline : null,
                is_demo: false,
                sourceLeadId: leadData.id,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
              };

              // Use setDoc to map lead ID to project ID for predictability
              await setDoc(doc(db, 'projects', leadData.id), projectData);
              updates.isConverted = true;
              updates.convertedProjectId = leadData.id;
              console.log(`Lead ${leadData.id} converted to Project ${leadData.id}`);
            }
          } catch (projError) {
            console.error('Error creating project during conversion:', projError);
          }
        }
        else if (data.requestType === ApprovalRequestType.RESCHEDULE_SITE_VISIT) {
          updates.status = LeadPipelineStatus.SITE_VISIT_RESCHEDULED;
        } else if (data.requestType === ApprovalRequestType.START_DRAWING) {
          updates.status = LeadPipelineStatus.DRAWING_IN_PROGRESS;
          if (!updates.tasks) updates.tasks = leadData.tasks || {};
          if (!updates.tasks.drawingRequests) updates.tasks.drawingRequests = [];
          updates.tasks.drawingRequests.push(`${assigneeName} - Drawing Started ${new Date().toLocaleDateString()}`);
        } else if (data.requestType === ApprovalRequestType.DESIGN_CHANGE || data.requestType === ApprovalRequestType.DESIGN_TOKEN || data.requestType === ApprovalRequestType.DRAWING_REVISIONS) {
          updates.status = LeadPipelineStatus.DRAWING_REVISIONS;
          if (!updates.tasks) updates.tasks = leadData.tasks || {};
          if (!updates.tasks.drawingRequests) updates.tasks.drawingRequests = [];
          updates.tasks.drawingRequests.push(`${assigneeName} - Revision Assigned ${new Date().toLocaleDateString()}`);
        } else if (data.requestType === ApprovalRequestType.REQUEST_FOR_QUOTATION || data.requestType === ApprovalRequestType.QUOTATION_TOKEN) {
          updates.status = LeadPipelineStatus.WAITING_FOR_QUOTATION;
        } else if (data.requestType === ApprovalRequestType.MODIFICATION || data.requestType === ApprovalRequestType.EXECUTION_TOKEN) {
          updates.status = LeadPipelineStatus.IN_EXECUTION;
        } else if (data.requestType === ApprovalRequestType.NEGOTIATION) {
          updates.status = LeadPipelineStatus.NEGOTIATION;
        } else if (data.requestType === ApprovalRequestType.PROCUREMENT_TOKEN) {
          updates.status = LeadPipelineStatus.IN_PROCUREMENT;
        }

        await updateDoc(leadRef, updates);

        // Also log to global activity registry
        await logActivity({
          description: `STRATEGIC OVERRIDE: ${data.requestType} authorized by Admin for ${assigneeName}. Project timeline advanced.`,
          team: data.targetRole || UserRole.SUPER_ADMIN,
          userId: reviewerId,
          status: ActivityStatus.DONE,
          projectId: data.contextId
        });
      } else if (contextType === 'project' && projectSnap && projectSnap.exists()) {
        const projectData = projectSnap.data();
        const scheduledTime = deadline ? format(deadline, 'PPP p') : (data.endDate ? format((data.endDate as any).toDate(), 'PPP p') : 'TBD');

        let projectUpdates: any = {
          communication: [
            ...(projectData.communication || []),
            {
              id: Date.now().toString(),
              user: 'System Authorization',
              avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
              message: `🚀 ACTIVITY INITIATED: ${data.requestType} approved by ${reviewerName}. Specialist ${assigneeName} (${assigneeRole}) is allotted for ${scheduledTime}.`,
              timestamp: new Date()
            }
          ],
          history: [
            ...(projectData.history || []),
            {
              action: 'Authorization Initiated',
              user: reviewerName,
              timestamp: new Date(),
              notes: `${data.requestType} approved for ${assigneeName}.`
            }
          ]
        };

        // Auto-Status Updates for Project
        if (data.requestType === ApprovalRequestType.START_DRAWING) {
          projectUpdates.status = ProjectStatus.DESIGN_IN_PROGRESS;
        } else if (data.requestType === ApprovalRequestType.DESIGN_CHANGE || data.requestType === ApprovalRequestType.DRAWING_REVISIONS) {
          projectUpdates.status = ProjectStatus.REVISIONS_IN_PROGRESS;
        } else if (data.requestType === ApprovalRequestType.REQUEST_FOR_QUOTATION || data.requestType === ApprovalRequestType.QUOTATION_TOKEN) {
          projectUpdates.status = ProjectStatus.AWAITING_QUOTATION;
        } else if (data.requestType === ApprovalRequestType.RESCHEDULE_SITE_VISIT) {
          projectUpdates.status = ProjectStatus.SITE_VISIT_RESCHEDULED;
        } else if (data.requestType === ApprovalRequestType.NEGOTIATION) {
          projectUpdates.status = ProjectStatus.NEGOTIATING;
        } else if (data.requestType === ApprovalRequestType.EXECUTION_TOKEN) {
          projectUpdates.status = ProjectStatus.IN_EXECUTION;
          // If we have stages, we might want to save them to the project, but usually that happens on Worker Acceptance.
          // For now, we only update status here if it's a direct approval (fallback).
          // If it's AWAITING_EXECUTION_ACCEPTANCE, we might not update project status yet?
          // Actually, let's keep it IN_EXECUTION to show movement, or creates a new status "Waiting for Worker"?
          // Keeping IN_EXECUTION is fine for high level.
        } else if (data.requestType === ApprovalRequestType.PROCUREMENT_TOKEN) {
          projectUpdates.status = ProjectStatus.PROCUREMENT;
        } else if (data.requestType === ApprovalRequestType.QUOTATION_APPROVAL) {
          projectUpdates.status = ProjectStatus.QUOTATION_SENT;
          // Log specific activity for Sales Team notification
          projectUpdates.communication = [
            ...(projectData.communication || []),
            {
              id: Date.now().toString(),
              user: 'System Authorization',
              avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
              message: `✅ QUOTATION APPROVED: The quotation for ${formatCurrencyINR(projectData.budget)} has been approved by ${reviewerName}. Sales Team, please inform the client.`,
              timestamp: new Date()
            }
          ];
        }

        if (projectRef) {
          const projectUpdatePayload = {
            ...projectUpdates,
            ...(data.requestType === ApprovalRequestType.EXECUTION_TOKEN && stages ? { stages: stages } : {})
          };
          await updateDoc(projectRef, projectUpdatePayload);
        }

        // Also log to global activity registry
        await logActivity({
          description: `ACTIVITY INITIATED: ${data.requestType} approved for ${assigneeName}.`,
          team: data.targetRole || UserRole.SUPER_ADMIN,
          userId: reviewerId,
          status: ActivityStatus.DONE,
          projectId: data.contextId
        });
      }
    }
  } catch (error) {
    console.error('Error approving request:', error);
    throw error;
  }
};

// Reject request
export const rejectRequest = async (
  requestId: string,
  reviewerId: string,
  reviewerName: string,
  comments: string
) => {
  try {
    const requestRef = doc(db, 'approvalRequests', requestId);

    // Fetch request to get requesterId and title
    const requestSnap = await getDoc(requestRef);
    if (!requestSnap.exists()) return;
    const data = requestSnap.data() as ApprovalRequest;

    await updateDoc(requestRef, {
      status: ApprovalStatus.REJECTED,
      reviewedAt: serverTimestamp(),
      reviewedBy: reviewerId,
      reviewerName: reviewerName,
      reviewerComments: comments,
    });

    // Notify Requester
    await createNotification({
      title: 'Work Request Rejected',
      message: `Strategic Notice: Your request "${data.title}" has been declined. Reason: ${comments}`,
      user_id: data.requesterId,
      entity_type: 'system',
      entity_id: requestId,
      type: 'error'
    });
  } catch (error) {
    console.error('Error rejecting request:', error);
    throw error;
  }
};

// Negotiate request (Execution Team proposes changes)
export const negotiateRequest = async (
  requestId: string,
  reviewerId: string,
  reviewerName: string,
  stages: ExecutionStage[],
  comments: string
) => {
  try {
    const requestRef = doc(db, 'approvalRequests', requestId);

    // Fetch request to get requesterId
    const requestSnap = await getDoc(requestRef);
    if (!requestSnap.exists()) return;
    const data = requestSnap.data() as ApprovalRequest;

    await updateDoc(requestRef, {
      status: 'Negotiation', // Or ApprovalStatus.NEGOTIATION depending on enum match
      reviewedAt: serverTimestamp(),
      reviewedBy: reviewerId,
      reviewerName: reviewerName,
      reviewerComments: comments,
      stages: stages // Update stages with proposed changes
    });

    // Notify Requester (Sales or Admin)
    await createNotification({
      title: 'Execution Protocol Negotiation',
      message: `Strategic Alert: Execution Team has proposed changes to "${data.title}". Review needed. Notes: ${comments}`,
      user_id: data.requesterId,
      entity_type: 'system',
      entity_id: requestId,
      type: 'warning'
    });

  } catch (error) {
    console.error('Error negotiating request:', error);
    throw error;
  }
};

// Get statistics
export const getApprovalStats = (requests: ApprovalRequest[]) => {
  const pending = requests.filter(r => r.status === ApprovalStatus.PENDING).length;
  const approved = requests.filter(r => r.status === ApprovalStatus.APPROVED).length;
  const rejected = requests.filter(r => r.status === ApprovalStatus.REJECTED).length;

  const byType = requests.reduce((acc, request) => {
    acc[request.requestType] = (acc[request.requestType] || 0) + 1;
    return acc;
  }, {} as Record<ApprovalRequestType, number>);

  return {
    total: requests.length,
    pending,
    approved,
    rejected,
    byType,
  };
};
