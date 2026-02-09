/**
 * List cases that have at least one approved quotation (for Vendor Bidding page)
 */
import { useState, useEffect } from 'react';
import {
  collectionGroup,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { FIRESTORE_COLLECTIONS } from '../constants';
import type { CaseQuotation, Case } from '../types';

export interface CaseWithApprovedQuotation {
  caseId: string;
  caseTitle: string;
  clientName?: string;
  organizationId?: string;
  quotations: (CaseQuotation & { id: string })[];
}

function toQuotation(id: string, data: any): CaseQuotation & { id: string } {
  return {
    id,
    caseId: data.caseId ?? '',
    boqId: data.boqId ?? '',
    items: data.items ?? [],
    subtotal: data.subtotal ?? 0,
    taxRate: data.taxRate ?? 0,
    taxAmount: data.taxAmount ?? 0,
    discount: data.discount ?? 0,
    discountAmount: data.discountAmount ?? 0,
    grandTotal: data.grandTotal ?? 0,
    notes: data.notes,
    createdBy: data.createdBy ?? '',
    createdAt: data.createdAt?.toDate?.() ?? data.createdAt,
    pdfUrl: data.pdfUrl,
    auditStatus: data.auditStatus ?? 'pending',
    auditedBy: data.auditedBy,
    auditedAt: data.auditedAt?.toDate?.() ?? data.auditedAt,
  };
}

export function useApprovedQuotationsForBidding() {
  const [casesWithQuotations, setCasesWithQuotations] = useState<CaseWithApprovedQuotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const q = query(
      collectionGroup(db, FIRESTORE_COLLECTIONS.QUOTATIONS),
      where('auditStatus', '==', 'approved')
    );
    const unsub = onSnapshot(
      q,
      async (snap) => {
        const byCase = new Map<string, (CaseQuotation & { id: string })[]>();
        for (const d of snap.docs) {
          const caseId = (d.data() as any).caseId;
          if (!caseId) continue;
          const list = byCase.get(caseId) ?? [];
          list.push(toQuotation(d.id, d.data()));
          byCase.set(caseId, list);
        }
        const caseIds = Array.from(byCase.keys());
        const result: CaseWithApprovedQuotation[] = [];
        for (const caseId of caseIds) {
          const caseRef = doc(db, FIRESTORE_COLLECTIONS.CASES, caseId);
          const caseSnap = await getDoc(caseRef);
          const quotations = byCase.get(caseId) ?? [];
          const caseData = caseSnap.exists() ? (caseSnap.data() as Case) : null;
          result.push({
            caseId,
            caseTitle: caseData?.title ?? caseId,
            clientName: caseData?.clientName,
            organizationId: caseData?.organizationId,
            quotations,
          });
        }
        setCasesWithQuotations(result);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  return { casesWithQuotations, loading, error };
}

export default useApprovedQuotationsForBidding;
