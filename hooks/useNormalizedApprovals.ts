/**
 * useNormalizedApprovals - Unified Approvals
 * Normalizes all approval types into a single shape for the Approvals page.
 * Covers: quotations (pending audit), AND case approvals (PAYMENT, EXPENSE, BUDGET, MATERIAL).
 */
import { useState, useEffect } from 'react';
import {
  collectionGroup,
  query,
  where,
  onSnapshot,
  getDoc,
  doc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { FIRESTORE_COLLECTIONS } from '../constants';
import { Case } from '../types';

export interface NormalizedApprovalItem {
  id: string;
  type: 'quotation' | 'boq' | 'drawing' | 'invoice' | 'procurement' | 'payment' | 'expense' | 'budget' | 'material';
  caseId: string;
  caseName: string;
  submittedBy: string;
  submittedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
  documentUrl?: string;
  sourceRef: { path: string; id: string };
  metadata?: Record<string, unknown>;
}

export function useNormalizedApprovals() {
  const [quotationItems, setQuotationItems] = useState<NormalizedApprovalItem[]>([]);
  const [approvalItems, setApprovalItems] = useState<NormalizedApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingApprovals, setLoadingApprovals] = useState(true);

  useEffect(() => {
    if (!db) {
      setLoading(false);
      setLoadingApprovals(false);
      return;
    }

    // ─── 1. Pending quotations (covers procurement submissions) ───
    const quotQuery = query(
      collectionGroup(db, FIRESTORE_COLLECTIONS.QUOTATIONS),
      where('auditStatus', '==', 'pending')
    );

    const unsubQuot = onSnapshot(quotQuery, async (snapshot) => {
      const all: NormalizedApprovalItem[] = [];

      for (const d of snapshot.docs) {
        const data = d.data();
        let caseName = 'Unknown';
        try {
          const caseSnap = await getDoc(doc(db, FIRESTORE_COLLECTIONS.CASES, data.caseId));
          if (caseSnap.exists()) {
            caseName = (caseSnap.data() as Case).title || caseName;
          }
        } catch {
          // ignore
        }
        all.push({
          id: d.id,
          type: 'quotation',
          caseId: data.caseId,
          caseName,
          submittedBy: data.createdBy || '—',
          submittedAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
          status: data.auditStatus === 'pending' ? 'pending' : data.auditStatus === 'approved' ? 'approved' : 'rejected',
          documentUrl: data.pdfUrl,
          sourceRef: { path: `cases/${data.caseId}/quotations`, id: d.id },
          metadata: { grandTotal: data.grandTotal, boqId: data.boqId },
        });
      }

      setQuotationItems(
        all
          .filter((i) => i.status === 'pending')
          .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime())
      );
      setLoading(false);
    });

    // ─── 2. Pending case approvals (PAYMENT, EXPENSE, BUDGET, MATERIAL) ───
    const approvalsQuery = query(
      collectionGroup(db, FIRESTORE_COLLECTIONS.APPROVALS),
      where('status', '==', 'pending')
    );

    const unsubApprovals = onSnapshot(approvalsQuery, async (snapshot) => {
      const all: NormalizedApprovalItem[] = [];

      for (const d of snapshot.docs) {
        const data = d.data();
        const caseId = data.caseId;
        if (!caseId) continue;

        let caseName = 'Unknown';
        try {
          const caseSnap = await getDoc(doc(db, FIRESTORE_COLLECTIONS.CASES, caseId));
          if (caseSnap.exists()) {
            caseName = (caseSnap.data() as Case).title || (caseSnap.data() as Case).clientName || caseName;
          }
        } catch {
          // ignore
        }

        // Map approval type to normalized type
        const rawType = (data.type || '').toUpperCase();
        let normalizedType: NormalizedApprovalItem['type'] = 'expense';
        if (rawType === 'PAYMENT') normalizedType = 'payment';
        else if (rawType === 'EXPENSE') normalizedType = 'expense';
        else if (rawType === 'BUDGET') normalizedType = 'budget';
        else if (rawType === 'MATERIAL') normalizedType = 'material';

        const payload = data.payloadSnapshot || data.payload || {};

        all.push({
          id: d.id,
          type: normalizedType,
          caseId,
          caseName,
          submittedBy: data.requestedBy || data.requesterId || '—',
          submittedAt: data.requestedAt instanceof Timestamp
            ? data.requestedAt.toDate()
            : data.createdAt instanceof Timestamp
              ? data.createdAt.toDate()
              : new Date(),
          status: 'pending',
          sourceRef: { path: `cases/${caseId}/approvals`, id: d.id },
          metadata: {
            approvalType: data.type,
            amount: payload.amount,
            paymentId: payload.paymentId,
            expenseId: payload.expenseId,
            notes: payload.notes,
            assignedToRole: data.assignedToRole,
            organizationId: data.organizationId,
          },
        });
      }

      setApprovalItems(
        all.sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime())
      );
      setLoadingApprovals(false);
    });

    return () => {
      unsubQuot();
      unsubApprovals();
    };
  }, []);

  // Merge both sources
  const items = [...quotationItems, ...approvalItems].sort(
    (a, b) => b.submittedAt.getTime() - a.submittedAt.getTime()
  );

  return { items, loading: loading || loadingApprovals };
}
