/**
 * Aggregates cost center data from sales invoices and general ledger
 * so Project P&L / cost center page reflects actual revenue and spend per project.
 */
import { useState, useEffect, useMemo } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { FIRESTORE_COLLECTIONS, DEFAULT_ORGANIZATION_ID } from '../constants';
import { useAuth } from '../context/AuthContext';

export interface CostCenterByCase {
  receivedAmount: number;
  spentAmount: number;
}

export function useProjectCostCenterData(organizationId: string | undefined) {
  const { currentUser } = useAuth();
  const orgId = organizationId || currentUser?.organizationId || DEFAULT_ORGANIZATION_ID;

  const [salesInvoices, setSalesInvoices] = useState<{ caseId: string; totalAmount: number }[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<{ caseId: string | null; type: string; amount: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db || !orgId) {
      setLoading(false);
      return;
    }

    const invoicesRef = collection(
      db,
      FIRESTORE_COLLECTIONS.ORGANIZATIONS,
      orgId,
      FIRESTORE_COLLECTIONS.SALES_INVOICES
    );
    const ledgerRef = collection(
      db,
      FIRESTORE_COLLECTIONS.ORGANIZATIONS,
      orgId,
      FIRESTORE_COLLECTIONS.GENERAL_LEDGER
    );

    const unsubInvoices = onSnapshot(query(invoicesRef, orderBy('issueDate', 'desc')), (snap) => {
      setSalesInvoices(
        snap.docs.map((d) => {
          const data = d.data();
          return {
            caseId: data.caseId || '',
            totalAmount: Number(data.totalAmount) || 0,
          };
        })
      );
    });

    const unsubLedger = onSnapshot(query(ledgerRef, orderBy('date', 'desc')), (snap) => {
      setLedgerEntries(
        snap.docs.map((d) => {
          const data = d.data();
          return {
            caseId: data.caseId || null,
            type: data.type || '',
            amount: Number(data.amount) || 0,
          };
        })
      );
    });

    setLoading(false);

    return () => {
      unsubInvoices();
      unsubLedger();
    };
  }, [orgId]);

  const byCaseId = useMemo(() => {
    const map: Record<string, CostCenterByCase> = {};

    salesInvoices.forEach(({ caseId, totalAmount }) => {
      if (!caseId) return;
      if (!map[caseId]) map[caseId] = { receivedAmount: 0, spentAmount: 0 };
      map[caseId].receivedAmount += totalAmount;
    });

    ledgerEntries.forEach(({ caseId, type, amount }) => {
      if (type !== 'DEBIT') return;
      const key = caseId || '__unallocated__';
      if (!map[key]) map[key] = { receivedAmount: 0, spentAmount: 0 };
      map[key].spentAmount += amount;
    });

    return map;
  }, [salesInvoices, ledgerEntries]);

  return { byCaseId, loading };
}
