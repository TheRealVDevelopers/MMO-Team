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
  serverTimestamp,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { ApprovalRequest, ApprovalRequestType, ApprovalStatus, UserRole, LeadPipelineStatus, ActivityStatus, ProjectStatus } from '../types';
import { USERS } from '../constants';
import { createNotification, logActivity } from '../services/liveDataService';

export const useApprovals = () => {
  const [loading, setLoading] = useState(false);

  const submitRequest = async (requestData: Omit<ApprovalRequest, 'id' | 'requestedAt' | 'status'>) => {
    setLoading(true);
    try {
      await createApprovalRequest(requestData);
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
          targetRole: data.targetRole,
          assigneeId: data.assigneeId,
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
          targetRole: data.targetRole,
          assigneeId: data.assigneeId,
        });
      });
      setMyRequests(approvalRequests);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return { myRequests, loading };
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
    const docRef = await addDoc(collection(db, 'approvalRequests'), {
      ...requestData,
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
  deadline?: Date
) => {
  try {
    const requestRef = doc(db, 'approvalRequests', requestId);

    // Fetch the request to get requesterId and context
    const requestSnap = await getDoc(requestRef);
    if (!requestSnap.exists()) return;
    const data = requestSnap.data() as ApprovalRequest;

    const assignee = USERS.find(u => u.id === assigneeId);
    const assigneeName = assignee ? assignee.name : 'Team Member';
    const assigneeRole = assignee ? assignee.role : 'Specialist';

    // update request status
    await updateDoc(requestRef, {
      status: ApprovalStatus.APPROVED,
      reviewedAt: serverTimestamp(),
      reviewedBy: reviewerId,
      reviewerName: reviewerName,
      reviewerComments: comments || '',
      assigneeId: assigneeId || null,
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
        }
      }
    }

    // 2. If assigned, create a task (existing logic simplified since we have data)
    if (assigneeId) {
      const { addTask } = await import('./useMyDayTasks');

      // If comments were edited/provided, use them. Otherwise fallback to original description.
      const taskDescription = comments || data.description;

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
    }

    // 4. Update Lead/Project if contextId exists
    if (data.contextId) {
      if (contextType === 'lead') {
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
        } else if (data.requestType === ApprovalRequestType.RESCHEDULE_SITE_VISIT) {
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
        } else if (data.requestType === ApprovalRequestType.MODIFICATION) {
          updates.status = LeadPipelineStatus.IN_EXECUTION;
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
      } else if (contextType === 'project') {
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
        }

        await updateDoc(projectRef, projectUpdates);

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
