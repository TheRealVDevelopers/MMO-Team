import { useState, useEffect } from 'react';
import { db } from '../firebase';
import {
  collection,
  collectionGroup,
  query,
  where,
  orderBy,
  onSnapshot,
  runTransaction,
  doc,
  serverTimestamp
} from 'firebase/firestore';
import { ApprovalRequest, UserRole, CaseStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { FIRESTORE_COLLECTIONS } from '../constants';

export const useApprovals = (role?: UserRole) => {
  const { currentUser } = useAuth();
  const [pendingApprovals, setPendingApprovals] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Listen for Pending Approvals (Collection Group)
  useEffect(() => {
    if (!role) {
      setLoading(false);
      return;
    }

    const q = query(
      collectionGroup(db, FIRESTORE_COLLECTIONS.APPROVALS),
      where('status', '==', 'pending'),
      where('assignedToRole', '==', role),
      orderBy('requestedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ApprovalRequest[];

      setPendingApprovals(items);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [role]);

  // 2. Approve Request (Transactional)
  const approveRequest = async (request: ApprovalRequest, notes?: string) => {
    if (!currentUser) throw new Error("Unauthorized");

    await runTransaction(db, async (transaction) => {
      const caseRef = doc(db, FIRESTORE_COLLECTIONS.CASES, request.caseId);
      const approvalRef = doc(db, FIRESTORE_COLLECTIONS.CASES, request.caseId, FIRESTORE_COLLECTIONS.APPROVALS, request.id);

      const caseDoc = await transaction.get(caseRef);
      if (!caseDoc.exists()) throw new Error("Case not found");
      const caseData = caseDoc.data();

      // Common Updates: Resolve Approval
      transaction.update(approvalRef, {
        status: 'resolved',
        resolvedBy: currentUser.id,
        resolvedAt: serverTimestamp(),
        notes: notes || ''
      });

      // Type-Specific Logic
      switch (request.type) {

        // ==========================================================
        // PAYMENT VERIFICATION
        // ==========================================================
        case 'PAYMENT': {
          if (!request.payload.paymentId || !request.payload.amount) throw new Error("Invalid Payload");

          const paymentRef = doc(db, FIRESTORE_COLLECTIONS.CASES, request.caseId, FIRESTORE_COLLECTIONS.PAYMENTS, request.payload.paymentId);

          // 1. Mark Payment Verified
          transaction.update(paymentRef, {
            verified: true,
            verifiedBy: currentUser.id,
            verifiedAt: serverTimestamp()
          });

          // 2. Update Case Financials & Status
          const currentAdvance = caseData.financial?.advanceAmount || 0;
          transaction.update(caseRef, {
            'financial.advanceAmount': currentAdvance + request.payload.amount,
            'financial.paymentVerified': true,
            'status': CaseStatus.WAITING_FOR_PLANNING, // STRICT STATE TRANSITION
            'workflow.paymentVerified': true // Helper flag
          });

          // 3. Create Immutable Ledger Entry (General Ledger)
          const orgId = caseData.organizationId;
          const ledgerCollection = collection(db, FIRESTORE_COLLECTIONS.ORGANIZATIONS, orgId, FIRESTORE_COLLECTIONS.GENERAL_LEDGER);
          const ledgerEntryRef = doc(ledgerCollection);

          transaction.set(ledgerEntryRef, {
            transactionId: request.payload.paymentId,
            date: serverTimestamp(),
            type: 'CREDIT',
            amount: request.payload.amount,
            description: `Payment Verification: ${request.caseId}`,
            category: 'REVENUE',
            sourceType: 'PAYMENT',
            sourceId: request.payload.paymentId,
            caseId: request.caseId,
            createdBy: currentUser.id,
            createdAt: serverTimestamp()
          });

          break;
        }

        // ==========================================================
        // EXPENSE APPROVAL (If needed)
        // ==========================================================
        case 'EXPENSE': {
          // Logic for expenses if they require approval
          // ...
          break;
        }
      }
    });
  };

  // 3. Reject Request
  const rejectRequest = async (request: ApprovalRequest, reason: string) => {
    if (!currentUser) throw new Error("Unauthorized");

    // Simple update (No transaction needed unless reverting other states, but usually safe)
    const approvalRef = doc(db, FIRESTORE_COLLECTIONS.CASES, request.caseId, FIRESTORE_COLLECTIONS.APPROVALS, request.id);
    const paymentRef = request.payload.paymentId ? doc(db, FIRESTORE_COLLECTIONS.CASES, request.caseId, FIRESTORE_COLLECTIONS.PAYMENTS, request.payload.paymentId) : null;

    await runTransaction(db, async (transaction) => {
      transaction.update(approvalRef, {
        status: 'rejected',
        resolvedBy: currentUser.id,
        resolvedAt: serverTimestamp(),
        rejectionReason: reason
      });

      if (paymentRef && request.type === 'PAYMENT') {
        transaction.update(paymentRef, {
          verified: false,
          notes: `Rejected: ${reason}`
        });
      }
    });
  };

  return {
    pendingApprovals,
    loading,
    approveRequest,
    rejectRequest
  };
};
