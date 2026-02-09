/**
 * Accounts Team — Expenses
 * Listing: org-wide from generalLedger (category === 'EXPENSE'); case detail from cases/{caseId}/expenses.
 * Creation: via Approval flow; on approve, transaction creates expense doc + costCenter + ledger.
 */

import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { FIRESTORE_COLLECTIONS } from '../constants';

export interface ExpenseLedgerItem {
  id: string;
  caseId?: string;
  amount: number;
  description: string;
  date: Date;
  sourceId: string;
}

/** Org-wide expense list from generalLedger (no per-case subcollection scan). */
export function useExpensesForOrg(organizationId: string | undefined) {
  const [items, setItems] = useState<ExpenseLedgerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!organizationId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, FIRESTORE_COLLECTIONS.ORGANIZATIONS, organizationId, FIRESTORE_COLLECTIONS.GENERAL_LEDGER),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const expenseEntries = snapshot.docs
          .map((d) => {
            const data = d.data();
            if (data.category !== 'EXPENSE') return null;
            return {
              id: d.id,
              caseId: data.caseId,
              amount: data.amount ?? 0,
              description: data.description ?? '',
              date: data.date?.toDate?.() ?? new Date(),
              sourceId: data.sourceId ?? d.id,
            } as ExpenseLedgerItem;
          })
          .filter(Boolean) as ExpenseLedgerItem[];
        setItems(expenseEntries);
        setLoading(false);
      },
      (err) => {
        console.error('useExpensesForOrg error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [organizationId]);

  return { expenses: items, loading, error };
}

export interface CaseExpenseDoc {
  id: string;
  caseId: string;
  amount: number;
  category: string;
  description: string;
  date: Date;
  status: string;
  requestedBy?: string;
  approvedBy?: string;
}

/** Single case expenses (for case detail view). */
export function useCaseExpenses(caseId: string | undefined) {
  const [expenses, setExpenses] = useState<CaseExpenseDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!caseId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, FIRESTORE_COLLECTIONS.CASES, caseId, FIRESTORE_COLLECTIONS.EXPENSES),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setExpenses(
          snapshot.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              caseId,
              ...data,
              date: data.date?.toDate?.() ?? new Date(),
            } as CaseExpenseDoc;
          })
        );
        setLoading(false);
      },
      (err) => {
        console.error('useCaseExpenses error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [caseId]);

  return { expenses, loading, error };
}
