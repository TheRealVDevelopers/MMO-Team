/**
 * useNormalizedApprovals - Unified Approvals
 * Normalizes all approval types into a single shape for the Approvals page.
 * No type-specific UI branching at page level.
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
  type: 'quotation' | 'boq' | 'drawing' | 'invoice' | 'procurement';
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
  const [items, setItems] = useState<NormalizedApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }

    const normalized: NormalizedApprovalItem[] = [];

    // 1. Pending quotations (covers procurement submissions)
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

      setItems(
        all
          .filter((i) => i.status === 'pending')
          .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime())
      );
      setLoading(false);
    });

    return () => unsubQuot();
  }, []);

  return { items, loading };
}
