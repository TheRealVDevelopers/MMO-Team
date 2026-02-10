/**
 * Payments (pay-ins) for a case: cases/{caseId}/payments
 * Used to show transaction history alongside General Ledger on Cost Center / Project Ledger view.
 */
import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { FIRESTORE_COLLECTIONS } from '../constants';

export interface CasePaymentRecord {
  id: string;
  caseId: string;
  amount: number;
  verifiedAmount?: number;
  paymentMethod: string;
  utr?: string | null;
  verified: boolean;
  status: string;
  createdAt: Date;
  verifiedAt?: Date;
  createdByName?: string;
  description?: string | null;
}

export function useCasePayments(caseId: string | undefined) {
  const [payments, setPayments] = useState<CasePaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db || !caseId) {
      setLoading(false);
      return;
    }

    const paymentsRef = collection(
      db,
      FIRESTORE_COLLECTIONS.CASES,
      caseId,
      FIRESTORE_COLLECTIONS.PAYMENTS
    );
    const q = query(paymentsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: CasePaymentRecord[] = snapshot.docs.map((d) => {
          const data = d.data();
          const createdAt = data.createdAt?.toDate?.() ?? (data.createdAt ? new Date((data.createdAt as any).seconds * 1000) : new Date());
          const verifiedAt = data.verifiedAt?.toDate?.();
          return {
            id: d.id,
            caseId,
            amount: data.amount ?? 0,
            verifiedAmount: data.verifiedAmount,
            paymentMethod: data.paymentMethod ?? data.method ?? 'UPI',
            utr: data.utr ?? data.reference ?? null,
            verified: data.verified ?? false,
            status: (data.status ?? 'PENDING').toString(),
            createdAt,
            verifiedAt,
            createdByName: data.createdByName ?? data.submittedByName,
            description: data.description ?? data.reference ?? null,
          } as CasePaymentRecord;
        });
        setPayments(list);
        setLoading(false);
      },
      (err) => {
        console.error('useCasePayments:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [caseId]);

  return { payments, loading };
}
