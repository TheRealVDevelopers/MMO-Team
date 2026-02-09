/**
 * Accounts — Salary Ledger (read-only for Overview).
 * Salary Payable = sum of unpaid salaryLedger entries only.
 */

import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { FIRESTORE_COLLECTIONS } from '../constants';

export function useSalaryLedger(organizationId: string | undefined) {
  const [salaryPayable, setSalaryPayable] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!organizationId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, FIRESTORE_COLLECTIONS.ORGANIZATIONS, organizationId, FIRESTORE_COLLECTIONS.SALARY_LEDGER),
      orderBy('month', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const unpaid = snapshot.docs
        .filter((d) => d.data().status !== 'PAID')
        .reduce((sum, d) => sum + (Number(d.data().totalSalary) || 0), 0);
      setSalaryPayable(unpaid);
      setLoading(false);
    }, (err) => {
      console.error('useSalaryLedger error:', err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [organizationId]);

  return { salaryPayable, loading };
}
