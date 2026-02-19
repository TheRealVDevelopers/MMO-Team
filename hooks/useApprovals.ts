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
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { ApprovalRequest, UserRole, CaseStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { FIRESTORE_COLLECTIONS } from '../constants';

export const useApprovals = (role?: UserRole) => {
  const { currentUser } = useAuth();
  const [pendingApprovals, setPendingApprovals] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Listen for Pending Approvals (Collection Group); MUST filter by organizationId (never undefined)
  useEffect(() => {
    if (!role || !currentUser?.organizationId) {
      setLoading(false);
      return;
    }
    const orgId =
      typeof currentUser.organizationId === 'string' && currentUser.organizationId.trim()
        ? currentUser.organizationId.trim()
        : '';
    if (!orgId) {
      setLoading(false);
      return;
    }
    const q = query(
      collectionGroup(db, FIRESTORE_COLLECTIONS.APPROVALS),
      where('status', '==', 'pending'),
      where('assignedToRole', '==', role),
      where('organizationId', '==', orgId),
      orderBy('requestedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          requestedAt: data.requestedAt?.toDate?.() ?? new Date(),
        } as ApprovalRequest;
      });

      setPendingApprovals(items);
      setLoading(false);
    }, (err) => {
      console.error('useApprovals snapshot error:', err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [role, currentUser?.organizationId]);

  // 2. Approve Request (Transactional). Use payloadSnapshot only (immutable at request time).
  const approveRequest = async (request: ApprovalRequest, notes?: string) => {
    if (!currentUser) throw new Error("Unauthorized");

    const snap = request.payloadSnapshot ?? request.payload;

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

      // Type-Specific Logic (use payloadSnapshot only)
      switch (request.type) {

        // ==========================================================
        // PAYMENT VERIFICATION
        // ==========================================================
        case 'PAYMENT': {
          if (!snap.paymentId || snap.amount == null) throw new Error("Invalid Payload (use payloadSnapshot)");

          const paymentRef = doc(db, FIRESTORE_COLLECTIONS.CASES, request.caseId, FIRESTORE_COLLECTIONS.PAYMENTS, snap.paymentId);

          // 1. Mark Payment Verified
          transaction.update(paymentRef, {
            verified: true,
            verifiedBy: currentUser.id,
            verifiedAt: serverTimestamp()
          });

          // 2. Update Case Financials & Status
          const currentAdvance = caseData.financial?.advanceAmount || 0;
          transaction.update(caseRef, {
            'financial.advanceAmount': currentAdvance + snap.amount,
            'financial.paymentVerified': true,
            'status': CaseStatus.WAITING_FOR_PLANNING, // STRICT STATE TRANSITION
            'workflow.paymentVerified': true // Helper flag
          });

          // 3. Append Immutable Ledger Entry (CREDIT REVENUE per convention)
          const orgId = caseData.organizationId;
          const ledgerCollection = collection(db, FIRESTORE_COLLECTIONS.ORGANIZATIONS, orgId, FIRESTORE_COLLECTIONS.GENERAL_LEDGER);
          const ledgerEntryRef = doc(ledgerCollection);

          transaction.set(ledgerEntryRef, {
            transactionId: snap.paymentId,
            date: serverTimestamp(),
            type: 'CREDIT',
            amount: snap.amount,
            description: `Payment Verification: ${request.caseId}`,
            category: 'REVENUE',
            sourceType: 'PAYMENT',
            sourceId: snap.paymentId,
            caseId: request.caseId,
            createdBy: currentUser.id,
            createdAt: serverTimestamp()
          });

          break;
        }

        // ==========================================================
        // EXPENSE APPROVAL
        // ==========================================================
        case 'EXPENSE': {
          const amount = snap.amount ?? 0;
          if (amount <= 0) throw new Error("Invalid expense amount (payloadSnapshot)");

          const expensesCol = collection(db, FIRESTORE_COLLECTIONS.CASES, request.caseId, FIRESTORE_COLLECTIONS.EXPENSES);
          const expenseRef = snap.expenseId
            ? doc(db, FIRESTORE_COLLECTIONS.CASES, request.caseId, FIRESTORE_COLLECTIONS.EXPENSES, snap.expenseId)
            : doc(expensesCol);
          const expenseId = expenseRef.id;

          transaction.set(expenseRef, {
            caseId: request.caseId,
            amount,
            description: snap.notes ?? `Expense ${expenseId}`,
            category: 'misc',
            date: serverTimestamp(),
            status: 'Approved',
            approvedBy: currentUser.id,
            approvedAt: serverTimestamp(),
            requestedBy: request.requestedBy,
          }, { merge: true });

          const cost = caseData.costCenter ?? { totalBudget: 0, spentAmount: 0, remainingAmount: 0 };
          const newSpent = (cost.spentAmount ?? 0) + amount;
          const remaining = (cost.totalBudget ?? 0) - newSpent;
          transaction.update(caseRef, {
            'costCenter.spentAmount': newSpent,
            'costCenter.remainingAmount': remaining,
            updatedAt: serverTimestamp(),
          });

          const orgId = caseData.organizationId;
          const ledgerCol = collection(db, FIRESTORE_COLLECTIONS.ORGANIZATIONS, orgId, FIRESTORE_COLLECTIONS.GENERAL_LEDGER);
          transaction.set(doc(ledgerCol), {
            transactionId: expenseId,
            date: serverTimestamp(),
            type: 'DEBIT',
            amount,
            description: `Expense: ${request.caseId} - ${snap.notes ?? 'Approved'}`,
            category: 'EXPENSE',
            sourceType: 'EXPENSE',
            sourceId: expenseId,
            caseId: request.caseId,
            createdBy: currentUser.id,
            createdAt: serverTimestamp(),
          });
          transaction.set(doc(ledgerCol), {
            transactionId: expenseId,
            date: serverTimestamp(),
            type: 'CREDIT',
            amount,
            description: `Payable/Cash: expense ${expenseId}`,
            category: 'PAYABLE',
            sourceType: 'EXPENSE',
            sourceId: expenseId,
            caseId: request.caseId,
            createdBy: currentUser.id,
            createdAt: serverTimestamp(),
          });
          break;
        }

        // ==========================================================
        // BUDGET APPROVAL
        // ==========================================================
        case 'BUDGET': {
          const totalBudget = snap.amount ?? 0;
          const cost = caseData.costCenter ?? { totalBudget: 0, spentAmount: 0, remainingAmount: 0 };
          const spent = cost.spentAmount ?? 0;
          const remaining = totalBudget - spent;
          transaction.update(caseRef, {
            'costCenter.totalBudget': totalBudget,
            'costCenter.remainingAmount': remaining,
            updatedAt: serverTimestamp(),
          });
          break;
        }

        case 'MATERIAL':
          // Resolve only; no financial side effects
          break;
      }
    });
  };

  // 3. Reject Request
  const rejectRequest = async (request: ApprovalRequest, reason: string) => {
    if (!currentUser) throw new Error("Unauthorized");

    // Simple update (No transaction needed unless reverting other states, but usually safe)
    const approvalRef = doc(db, FIRESTORE_COLLECTIONS.CASES, request.caseId, FIRESTORE_COLLECTIONS.APPROVALS, request.id);
    const snap = request.payloadSnapshot ?? request.payload;
    const paymentRef = snap?.paymentId ? doc(db, FIRESTORE_COLLECTIONS.CASES, request.caseId, FIRESTORE_COLLECTIONS.PAYMENTS, snap.paymentId) : null;

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
