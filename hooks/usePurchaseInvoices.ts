/**
 * Accounts Team — Purchase Invoices (GR IN)
 * Path: organizations/{orgId}/purchaseInvoices
 * Every create is transactional: invoice doc + ledger (DEBIT EXPENSE, CREDIT PAYABLE) + case.costCenter update.
 */

import { useState, useEffect } from 'react';
import { db } from '../firebase';
import {
  collection,
  doc,
  query,
  orderBy,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  increment,
  Timestamp,
} from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { FIRESTORE_COLLECTIONS } from '../constants';

export interface PurchaseInvoice {
  id: string;
  organizationId: string;
  caseId?: string;
  vendorName: string;
  invoiceNumber: string;
  amount: number;
  issueDate: Date;
  dueDate?: Date;
  status: string;
  createdAt?: Date;
}

export interface CreatePurchaseInvoiceInput {
  caseId?: string;
  vendorName: string;
  invoiceNumber: string;
  amount: number;
  issueDate: Date;
  dueDate?: Date;
}

export function usePurchaseInvoices(organizationId: string | undefined) {
  const { currentUser } = useAuth();
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!organizationId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, FIRESTORE_COLLECTIONS.ORGANIZATIONS, organizationId, FIRESTORE_COLLECTIONS.PURCHASE_INVOICES),
      orderBy('issueDate', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setInvoices(
          snapshot.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              ...data,
              issueDate: data.issueDate?.toDate?.() ?? new Date(),
              dueDate: data.dueDate?.toDate?.() ?? undefined,
              createdAt: data.createdAt?.toDate?.() ?? undefined,
            } as PurchaseInvoice;
          })
        );
        setLoading(false);
      },
      (err) => {
        console.error('usePurchaseInvoices error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [organizationId]);

  const createPurchaseInvoice = async (input: CreatePurchaseInvoiceInput): Promise<string> => {
    if (!organizationId) throw new Error('Organization ID required');
    if (!currentUser) throw new Error('Unauthorized');

    let invoiceId: string = '';
    await runTransaction(db, async (transaction) => {
      const invoiceRef = doc(
        collection(db, FIRESTORE_COLLECTIONS.ORGANIZATIONS, organizationId, FIRESTORE_COLLECTIONS.PURCHASE_INVOICES)
      );
      invoiceId = invoiceRef.id;

      transaction.set(invoiceRef, {
        organizationId,
        caseId: input.caseId ?? null,
        vendorName: input.vendorName,
        invoiceNumber: input.invoiceNumber,
        amount: input.amount,
        issueDate: Timestamp.fromDate(input.issueDate),
        dueDate: input.dueDate ? Timestamp.fromDate(input.dueDate) : null,
        status: 'Pending Approval',
        createdAt: serverTimestamp(),
      });

      const ledgerCol = collection(
        db,
        FIRESTORE_COLLECTIONS.ORGANIZATIONS,
        organizationId,
        FIRESTORE_COLLECTIONS.GENERAL_LEDGER
      );

      transaction.set(doc(ledgerCol), {
        transactionId: invoiceRef.id,
        date: serverTimestamp(),
        type: 'DEBIT',
        amount: input.amount,
        description: `Purchase: ${input.invoiceNumber} - ${input.vendorName}`,
        category: 'EXPENSE',
        sourceType: 'PURCHASE',
        sourceId: invoiceRef.id,
        caseId: input.caseId ?? undefined,
        createdBy: currentUser.id,
        createdAt: serverTimestamp(),
      });

      transaction.set(doc(ledgerCol), {
        transactionId: invoiceRef.id,
        date: serverTimestamp(),
        type: 'CREDIT',
        amount: input.amount,
        description: `Payable: ${input.invoiceNumber}`,
        category: 'PAYABLE',
        sourceType: 'PURCHASE',
        sourceId: invoiceRef.id,
        caseId: input.caseId ?? undefined,
        createdBy: currentUser.id,
        createdAt: serverTimestamp(),
      });

      if (input.caseId) {
        const caseRef = doc(db, FIRESTORE_COLLECTIONS.CASES, input.caseId);
        const caseSnap = await transaction.get(caseRef);
        if (caseSnap.exists()) {
          const d = caseSnap.data();
          const cost = d.costCenter ?? { totalBudget: 0, spentAmount: 0, remainingAmount: 0 };
          const newSpent = (cost.spentAmount ?? 0) + input.amount;
          const remaining = (cost.totalBudget ?? 0) - newSpent;
          transaction.update(caseRef, {
            'costCenter.spentAmount': newSpent,
            'costCenter.remainingAmount': remaining,
            updatedAt: serverTimestamp(),
          });
        }
      }
    });
    return invoiceId;
  };

  return { invoices, loading, error, createPurchaseInvoice };
}
