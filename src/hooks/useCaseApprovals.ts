import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
  getDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';
import { Case, CaseStatus, TaskType, TaskStatus, UserRole } from '../types';
import { FIRESTORE_COLLECTIONS } from '../constants';
import { ApprovalWorkflowService } from '../services/approvalWorkflowService';
import { workflowAutomation } from '../services/workflowAutomation';

interface CaseApprovalRequest {
  id: string;
  caseId: string;
  type: 'SITE_VISIT' | 'DRAWING' | 'BOQ' | 'QUOTATION' | 'PAYMENT' | 'EXECUTION';
  stageName: string;
  requestedBy: string;
  requestedByName: string;
  status: 'PENDING' | 'ASSIGNED' | 'ONGOING' | 'COMPLETED' | 'ACKNOWLEDGED' | 'APPROVED' | 'REJECTED';
  requiredRoles: UserRole[];
  approvedBy: Array<{
    userId: string;
    userName: string;
    role: UserRole;
    timestamp: any;
    comments: string;
  }>;
  rejectedBy: Array<{
    userId: string;
    userName: string;
    role: UserRole;
    timestamp: any;
    reason: string;
  }>;
  comments: Array<{
    userId: string;
    userName: string;
    role: UserRole;
    timestamp: any;
    text: string;
  }>;
  assignedTo?: string;
  startedAt?: any;
  completedAt?: any;
  acknowledgedAt?: any;
  createdAt: any;
  updatedAt: any;
  organizationId: string;
}

interface UseCaseApprovalsOptions {
  organizationId: string;
  currentUserRole: UserRole;
  userId: string;
}

interface UseCaseApprovalsReturn {
  approvals: CaseApprovalRequest[];
  loading: boolean;
  error: string | null;
  approveRequest: (approvalId: string, comments?: string) => Promise<void>;
  rejectRequest: (approvalId: string, reason: string) => Promise<void>;
  startRequest: (approvalId: string) => Promise<void>;
  completeRequest: (approvalId: string) => Promise<void>;
  acknowledgeRequest: (approvalId: string) => Promise<void>;
  loadCaseDetails: (caseId: string) => Promise<Case | null>;
}

/**
 * Hook for managing case approval requests
 * Used by Admin/Managers to approve/reject workflow stages
 */
export const useCaseApprovals = (options: UseCaseApprovalsOptions): UseCaseApprovalsReturn => {
  const [approvals, setApprovals] = useState<CaseApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Real-time listener for approval requests
  useEffect(() => {
    if (!db || !options.organizationId || !options.currentUserRole) {
      setLoading(false);
      return;
    }

    // Only listen if user is authorized to see requests
    const authorizedRoles = [UserRole.SUPER_ADMIN, UserRole.SALES_MANAGER, UserRole.MANAGER];
    if (!authorizedRoles.includes(options.currentUserRole)) {
      setLoading(false);
      return;
    }

    setLoading(true);
    
    console.log('[useCaseApprovals] Setting up listener for:', {
      currentUserRole: options.currentUserRole,
      organizationId: options.organizationId,
      userId: options.userId
    });

    try {
      const approvalsRef = collection(
        db,
        'approvals'
      );
      
      // Query for approvals in various active states
      const q = query(
        approvalsRef,
        where('status', 'in', ['PENDING', 'ASSIGNED', 'ONGOING', 'COMPLETED']),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const approvalList: CaseApprovalRequest[] = [];
          console.log(`[useCaseApprovals] Found ${snapshot.size} approval documents`);
          
          snapshot.forEach((doc) => {
            const data = doc.data();
            console.log('[useCaseApprovals] Approval data:', {
              id: doc.id,
              caseId: data.caseId,
              type: data.type,
              status: data.status
            });
            
            approvalList.push({
              id: doc.id,
              ...data
            } as CaseApprovalRequest);
          });
      
          console.log('[useCaseApprovals] Final approvals:', approvalList);
          setApprovals(approvalList);
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error('[useCaseApprovals] Error listening to approvals:', err);
          setError('Failed to load approvals');
          setLoading(false);
        }
      );

      return () => unsubscribe();
      
    } catch (err: any) {
      console.error('[useCaseApprovals] Error setting up listener:', err);
      setError(err.message || 'Failed to initialize approvals');
      setLoading(false);
    }
  }, [options.organizationId, options.currentUserRole, options.userId]);

  // Approve an approval request
  const approveRequest = useCallback(async (approvalId: string, comments?: string) => {
    if (!db) throw new Error('Database not initialized');
    
    try {
      console.log('[useCaseApprovals] Approving request:', approvalId);
      
      // Use the approval workflow service
      await ApprovalWorkflowService.approveStage(
        approvalId,
        options.userId,
        'Admin User', // This should come from user context
        options.currentUserRole,
        comments
      );
      
      console.log('[useCaseApprovals] Approval granted successfully');
      
    } catch (err: any) {
      console.error('[useCaseApprovals] Error approving request:', err);
      throw err;
    }
  }, [options.userId, options.currentUserRole]);

  // Start an approval request (assign to user)
  const startRequest = useCallback(async (approvalId: string) => {
    if (!db) throw new Error('Database not initialized');
    
    try {
      console.log('[useCaseApprovals] Starting request:', approvalId);
      
      const approvalRef = doc(db, 'approvals', approvalId);
      await updateDoc(approvalRef, {
        status: 'ASSIGNED',
        assignedTo: options.userId,
        startedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('[useCaseApprovals] Request started successfully');
      
    } catch (err: any) {
      console.error('[useCaseApprovals] Error starting request:', err);
      throw err;
    }
  }, [options.userId]);

  // Complete an approval request
  const completeRequest = useCallback(async (approvalId: string) => {
    if (!db) throw new Error('Database not initialized');
    
    try {
      console.log('[useCaseApprovals] Completing request:', approvalId);
      
      const approvalRef = doc(db, 'approvals', approvalId);
      await updateDoc(approvalRef, {
        status: 'COMPLETED',
        completedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('[useCaseApprovals] Request completed successfully');
      
    } catch (err: any) {
      console.error('[useCaseApprovals] Error completing request:', err);
      throw err;
    }
  }, []);

  // Acknowledge a completed approval request
  const acknowledgeRequest = useCallback(async (approvalId: string) => {
    if (!db) throw new Error('Database not initialized');
    
    try {
      console.log('[useCaseApprovals] Acknowledging request:', approvalId);
      
      const approvalRef = doc(db, 'approvals', approvalId);
      await updateDoc(approvalRef, {
        status: 'ACKNOWLEDGED',
        acknowledgedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('[useCaseApprovals] Request acknowledged successfully');
      
    } catch (err: any) {
      console.error('[useCaseApprovals] Error acknowledging request:', err);
      throw err;
    }
  }, []);

  // Reject an approval request
  const rejectRequest = useCallback(async (approvalId: string, reason: string) => {
    if (!db) throw new Error('Database not initialized');
    
    try {
      console.log('[useCaseApprovals] Rejecting request:', approvalId);
      
      // Use the approval workflow service
      await ApprovalWorkflowService.rejectStage(
        approvalId,
        options.userId,
        'Admin User', // This should come from user context
        options.currentUserRole,
        reason
      );
      
      console.log('[useCaseApprovals] Request rejected successfully');
      
    } catch (err: any) {
      console.error('[useCaseApprovals] Error rejecting request:', err);
      throw err;
    }
  }, [options.userId, options.currentUserRole]);

  // Load case details for a specific approval
  const loadCaseDetails = useCallback(async (caseId: string): Promise<Case | null> => {
    if (!db || !options.organizationId) return null;
    
    try {
      const caseRef = doc(
        db,
        FIRESTORE_COLLECTIONS.ORGANIZATIONS,
        options.organizationId,
        FIRESTORE_COLLECTIONS.CASES,
        caseId
      );
      
      const caseSnap = await getDoc(caseRef);
      if (caseSnap.exists()) {
        const data = caseSnap.data();
        return {
          ...data,
          id: caseSnap.id,
          createdAt: data.createdAt?.toDate?.() || data.createdAt || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || data.updatedAt || undefined,
        } as Case;
      }
      return null;
    } catch (err: any) {
      console.error('[useCaseApprovals] Error loading case details:', err);
      return null;
    }
  }, [options.organizationId]);

  return {
    approvals,
    loading,
    error,
    approveRequest,
    rejectRequest,
    startRequest,
    completeRequest,
    acknowledgeRequest,
    loadCaseDetails
  };
};