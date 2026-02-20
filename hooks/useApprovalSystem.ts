/**
 * APPROVAL SYSTEM - Writes to cases/{caseId}/approvals
 * For case-related approvals, writes to subcollection.
 * For general HR approvals, writes to approvalRequests collection.
 */

import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot, updateDoc, doc, arrayUnion, Timestamp } from 'firebase/firestore';
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

  // Sync to case.approvals array for Single Source of Truth
  if (data.caseId) {
    const caseRef = doc(db, FIRESTORE_COLLECTIONS.CASES, data.caseId);
    try {
      await updateDoc(caseRef, {
        approvals: arrayUnion({
          id: docRef.id,
          ...data,
          status: 'pending',
          createdAt: Timestamp.now(), // Use Timestamp for consistency
        })
      });
    } catch (e) {
      console.error('Failed to sync approval to case array:', e);
    }
  }

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

  // Sync array
  if (caseId) {
    await syncApprovalStatusInCase(caseId, requestId, 'approved', userId);
  }
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

  // Sync array
  if (caseId) {
    await syncApprovalStatusInCase(caseId, requestId, 'rejected', userId);
  }
};

// Helper to update array item
async function syncApprovalStatusInCase(caseId: string, requestId: string, status: 'approved' | 'rejected', userId?: string) {
  const { getDoc } = await import('firebase/firestore'); // Dynamic import to avoid circular dep issues if any, or just use existing
  const caseRef = doc(db, FIRESTORE_COLLECTIONS.CASES, caseId);
  try {
    const snap = await getDoc(caseRef);
    if (snap.exists()) {
      const data = snap.data();
      const approvals = data.approvals || [];
      const idx = approvals.findIndex((a: any) => a.id === requestId);
      if (idx > -1) {
        const updated = [...approvals];
        updated[idx] = {
          ...updated[idx],
          status,
          respondedBy: userId || 'system',
          respondedAt: Timestamp.now()
        };
        await updateDoc(caseRef, { approvals: updated });
      }
    }
  } catch (e) {
    console.error('Failed to sync approval status to array:', e);
  }
}

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
