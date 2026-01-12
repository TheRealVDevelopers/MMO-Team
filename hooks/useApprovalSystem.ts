import { useState, useEffect } from 'react';
// Hook for managing approvals
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { ApprovalRequest, ApprovalRequestType, ApprovalStatus, UserRole } from '../types';

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

    // update request status
    await updateDoc(requestRef, {
      status: ApprovalStatus.APPROVED,
      reviewedAt: serverTimestamp(),
      reviewedBy: reviewerId,
      reviewerName: reviewerName,
      reviewerComments: comments || '',
      assigneeId: assigneeId || null,
    });

    // If assigned, create a task
    if (assigneeId) {
      // We need to fetch the request to get title/desc
      const { getDoc } = await import('firebase/firestore');
      const requestSnap = await getDoc(requestRef);

      if (requestSnap.exists()) {
        const data = requestSnap.data() as ApprovalRequest;
        const { addTask } = await import('./useMyDayTasks'); // Dynamic import to avoid circular dependency issues

        await addTask({
          title: data.title,
          description: `Request Approved. \n\nContext: ${data.description}\n\nInstructions: ${comments || 'None'}`,
          userId: assigneeId, // Assignee
          status: 'Pending' as any, // TaskStatus.PENDING
          priority: data.priority,
          deadline: deadline ? deadline.toISOString() : (data.endDate ? (data.endDate as any).toDate().toISOString() : undefined),
          date: new Date().toISOString().split('T')[0],
          timeSpent: 0,
          isPaused: false,
          createdAt: new Date(),
        }, reviewerId);
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
    await updateDoc(requestRef, {
      status: ApprovalStatus.REJECTED,
      reviewedAt: serverTimestamp(),
      reviewedBy: reviewerId,
      reviewerName: reviewerName,
      reviewerComments: comments,
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
