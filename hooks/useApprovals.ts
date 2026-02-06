import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { ApprovalRequest, ApprovalStatus, UserRole } from '../types';
import { ApprovalWorkflowService } from '../services/approvalWorkflowService';

/**
 * Hook for managing approval requests
 */
export const useApprovals = (currentUserRole: UserRole | null, userId: string) => {
  const [pendingApprovals, setPendingApprovals] = useState<ApprovalRequest[]>([]);
  const [myApprovals, setMyApprovals] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Listen for pending approvals (for current user's role)
  useEffect(() => {
    if (!currentUserRole) {
      setLoading(false);
      return;
    }

    setLoading(true);
    
    // Query for approvals pending this user's role
    const q = query(
      collection(db, 'approvals'),
      where('requiredRoles', 'array-contains', currentUserRole),
      where('status', '==', ApprovalStatus.PENDING),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const approvals: ApprovalRequest[] = [];
        snapshot.forEach((doc) => {
          approvals.push({ id: doc.id, ...doc.data() } as ApprovalRequest);
        });
        setPendingApprovals(approvals);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching approvals:', err);
        setError('Failed to load approvals');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUserRole]);

  // Listen for approvals initiated by current user
  useEffect(() => {
    if (!userId) {
      return;
    }

    const q = query(
      collection(db, 'approvals'),
      where('requesterId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const approvals: ApprovalRequest[] = [];
      snapshot.forEach((doc) => {
        approvals.push({ id: doc.id, ...doc.data() } as ApprovalRequest);
      });
      setMyApprovals(approvals);
    });

    return () => unsubscribe();
  }, [userId]);

  /**
   * Approve a workflow stage
   */
  const approveStage = async (
    approvalId: string,
    approverName: string,
    comments?: string
  ): Promise<void> => {
    if (!currentUserRole) {
      throw new Error('User role not found');
    }

    try {
      await ApprovalWorkflowService.approveStage(
        approvalId,
        userId,
        approverName,
        currentUserRole,
        comments
      );
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  /**
   * Reject a workflow stage
   */
  const rejectStage = async (
    approvalId: string,
    rejectorName: string,
    reason: string
  ): Promise<void> => {
    if (!currentUserRole) {
      throw new Error('User role not found');
    }

    try {
      await ApprovalWorkflowService.rejectStage(
        approvalId,
        userId,
        rejectorName,
        currentUserRole,
        reason
      );
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  /**
   * Get approval details by ID
   */
  const getApprovalById = async (approvalId: string): Promise<ApprovalRequest | null> => {
    try {
      const docSnap = await getDoc(doc(db, 'approvals', approvalId));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as ApprovalRequest;
      }
      return null;
    } catch (err) {
      console.error('Error fetching approval:', err);
      return null;
    }
  };

  return {
    pendingApprovals,
    myApprovals,
    loading,
    error,
    approveStage,
    rejectStage,
    getApprovalById
  };
};

/**
 * Hook for initiating approvals
 */
export const useApprovalInitiator = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Initiate approval for a workflow stage
   */
  const initiateApproval = async (
    caseId: string,
    stage: string,
    requesterId: string,
    requesterName: string
  ): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      await ApprovalWorkflowService.initiateApproval(caseId, stage, requesterId, requesterName);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    initiateApproval,
    loading,
    error
  };
};
