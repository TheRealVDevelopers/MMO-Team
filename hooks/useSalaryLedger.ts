/**
 * Accounts — Salary Ledger.
 * salaryPayable = sum of unpaid entries; entries = list for edit UI.
 */

import { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, where, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { FIRESTORE_COLLECTIONS } from '../constants';

export interface SalaryLedgerEntry {
  id: string;
  userId: string;
  month: string;
  userName?: string;
  baseSalary: number;
  distanceReimbursement: number;
  expenseReimbursement: number;
  incentives: number;
  deductions: number;
  totalSalary: number;
  status: string;
  activeHours?: number;
  idleHours?: number;
  breakHours?: number;
  taskHours?: number;
  distanceKm?: number;
  generatedAt?: Date;
  updatedAt?: Date;
}

function safeDate(v: unknown): Date | undefined {
  if (!v) return undefined;
  if (v instanceof Date) return v;
  if (typeof (v as any).toDate === 'function') return (v as any).toDate();
  return undefined;
}

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

/** List salary ledger entries (optionally filter by month) for edit UI */
export function useSalaryLedgerEntries(organizationId: string | undefined, month?: string) {
  const [entries, setEntries] = useState<SalaryLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!organizationId) {
      setEntries([]);
      setLoading(false);
      return;
    }

    const col = collection(db, FIRESTORE_COLLECTIONS.ORGANIZATIONS, organizationId, FIRESTORE_COLLECTIONS.SALARY_LEDGER);
    const q = month
      ? query(col, where('month', '==', month))
      : query(col, orderBy('month', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: SalaryLedgerEntry[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          userId: data.userId,
          month: data.month,
          userName: data.userName,
          baseSalary: Number(data.baseSalary) || 0,
          distanceReimbursement: Number(data.distanceReimbursement) || 0,
          expenseReimbursement: Number(data.expenseReimbursement) || 0,
          incentives: Number(data.incentives) || 0,
          deductions: Number(data.deductions) || 0,
          totalSalary: Number(data.totalSalary) || 0,
          status: data.status || 'DRAFT',
          activeHours: data.activeHours,
          idleHours: data.idleHours,
          breakHours: data.breakHours,
          taskHours: data.taskHours,
          distanceKm: data.distanceKm,
          generatedAt: safeDate(data.generatedAt),
          updatedAt: safeDate(data.updatedAt),
        };
      });
      if (month) list.sort((a, b) => (a.userId || '').localeCompare(b.userId || ''));
      setEntries(list);
      setLoading(false);
    }, (err) => {
      console.error('useSalaryLedgerEntries error:', err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [organizationId, month]);

  return { entries, loading };
}

/** Update a salary ledger entry (accountant edit) */
export async function updateSalaryLedgerEntry(
  organizationId: string,
  ledgerId: string,
  updates: Partial<{
    baseSalary: number;
    distanceReimbursement: number;
    expenseReimbursement: number;
    incentives: number;
    deductions: number;
    totalSalary: number;
    status: string;
  }>
): Promise<void> {
  if (!db) throw new Error('Database not initialized');
  const ref = doc(db, FIRESTORE_COLLECTIONS.ORGANIZATIONS, organizationId, FIRESTORE_COLLECTIONS.SALARY_LEDGER, ledgerId);
  const clean: Record<string, unknown> = { ...updates, updatedAt: serverTimestamp() };
  Object.keys(clean).forEach((k) => clean[k] === undefined && delete clean[k]);
  await updateDoc(ref, clean);
}
