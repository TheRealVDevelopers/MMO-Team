/**
 * APPROVAL SYSTEM - Writes to cases/{caseId}/approvals
 * For case-related approvals, writes to subcollection.
 * For general HR approvals, writes to approvalRequests collection.
 */

import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { FIRESTORE_COLLECTIONS } from '../constants';
import { useState, useEffect } from 'react';

interface ApprovalRequestData {
  requestType: string;
  requesterId: string;
  requesterName: string;
  requesterRole?: string;
  title: string;
  description: string;
  startDate?: Date;
  endDate?: Date;
  duration?: string;
  priority?: 'High' | 'Medium' | 'Low';
  caseId?: string;
  targetRole?: string;
  attachments?: string[];
}

interface ApprovalRequest extends ApprovalRequestData {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  respondedAt?: Date;
  respondedBy?: string;
}

export const createApprovalRequest = async (data: ApprovalRequestData): Promise<string> => {
  if (!db) throw new Error('Database not initialized');

  // If caseId is provided, write to case's approvals subcollection
  const collectionRef = data.caseId
    ? collection(db, FIRESTORE_COLLECTIONS.CASES, data.caseId, 'approvals')
    : collection(db, 'approvalRequests');

  const docRef = await addDoc(collectionRef, {
    ...data,
    status: 'pending',
    createdAt: serverTimestamp(),
  });

  console.log(`✅ Approval request created: ${docRef.id}`);
  return docRef.id;
};

export const useApprovalRequests = (caseId?: string) => {
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }

    const collectionRef = caseId
      ? collection(db, FIRESTORE_COLLECTIONS.CASES, caseId, 'approvals')
      : collection(db, 'approvalRequests');

    const q = query(collectionRef, where('status', '==', 'pending'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedRequests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      })) as ApprovalRequest[];
      setRequests(fetchedRequests);
      setLoading(false);
    }, (err) => {
      console.error('Error fetching approvals:', err);
      setError(err.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [caseId]);

  return { requests, loading, error };
};

export const approveRequest = async (requestId: string, caseId?: string, userId?: string): Promise<void> => {
  if (!db) throw new Error('Database not initialized');

  const docRef = caseId
    ? doc(db, FIRESTORE_COLLECTIONS.CASES, caseId, 'approvals', requestId)
    : doc(db, 'approvalRequests', requestId);

  await updateDoc(docRef, {
    status: 'approved',
    respondedAt: serverTimestamp(),
    respondedBy: userId || 'system',
  });
};

export const rejectRequest = async (requestId: string, caseId?: string, userId?: string, reason?: string): Promise<void> => {
  if (!db) throw new Error('Database not initialized');

  const docRef = caseId
    ? doc(db, FIRESTORE_COLLECTIONS.CASES, caseId, 'approvals', requestId)
    : doc(db, 'approvalRequests', requestId);

  await updateDoc(docRef, {
    status: 'rejected',
    respondedAt: serverTimestamp(),
    respondedBy: userId || 'system',
    rejectionReason: reason,
  });
};

// Legacy compatibility exports
export const useMyApprovalRequests = () => ({
  requests: [],
  loading: false,
});

export const useTargetedApprovalRequests = () => ({
  requests: [],
  loading: false,
});

export const useAssignedApprovalRequests = () => ({
  requests: [],
  loading: false,
});

export const useApprovals = () => ({
  submitRequest: createApprovalRequest,
});

export const completeRequest = async () => {
  console.warn('completeRequest is deprecated');
};

export const startRequest = async () => {
  console.warn('startRequest is deprecated');
};

export const getApprovalStats = () => ({
  pending: 0,
  approved: 0,
  rejected: 0,
});

export const acknowledgeRequest = async () => {
  console.warn('acknowledgeRequest is deprecated');
};
