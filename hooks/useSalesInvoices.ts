/**
 * Accounts Team — Sales Invoices (GR OUT)
 * Path: organizations/{orgId}/salesInvoices
 * Every create is transactional: invoice doc + ledger entries (CREDIT REVENUE, DEBIT ACCOUNTS_RECEIVABLE) + case update.
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

export interface SalesInvoice {
  id: string;
  organizationId: string;
  caseId: string;
  invoiceNumber: string;
  clientName: string;
  amount: number;
  taxAmount?: number;
  totalAmount: number;
  issueDate: Date;
  dueDate?: Date;
  status: 'pending' | 'paid' | 'overdue';
  createdAt?: Date;
}

export interface CreateSalesInvoiceInput {
  caseId: string;
  invoiceNumber: string;
  clientName: string;
  amount: number;
  taxAmount?: number;
  totalAmount: number;
  issueDate: Date;
  dueDate?: Date;
}

export function useSalesInvoices(organizationId: string | undefined) {
  const { currentUser } = useAuth();
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!organizationId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, FIRESTORE_COLLECTIONS.ORGANIZATIONS, organizationId, FIRESTORE_COLLECTIONS.SALES_INVOICES),
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
            } as SalesInvoice;
          })
        );
        setLoading(false);
      },
      (err) => {
        console.error('useSalesInvoices error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [organizationId]);

  const createSalesInvoice = async (input: CreateSalesInvoiceInput) => {
    if (!organizationId) throw new Error('Organization ID required');
    if (!currentUser) throw new Error('Unauthorized');

    await runTransaction(db, async (transaction) => {
      const invoiceRef = doc(
        collection(db, FIRESTORE_COLLECTIONS.ORGANIZATIONS, organizationId, FIRESTORE_COLLECTIONS.SALES_INVOICES)
      );

      transaction.set(invoiceRef, {
        organizationId,
        caseId: input.caseId,
        invoiceNumber: input.invoiceNumber,
        clientName: input.clientName,
        amount: input.amount,
        taxAmount: input.taxAmount ?? 0,
        totalAmount: input.totalAmount,
        issueDate: Timestamp.fromDate(input.issueDate),
        dueDate: input.dueDate ? Timestamp.fromDate(input.dueDate) : null,
        status: 'pending',
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
        type: 'CREDIT',
        amount: input.totalAmount,
        description: `Sales Invoice ${input.invoiceNumber}: ${input.clientName}`,
        category: 'REVENUE',
        sourceType: 'SALES',
        sourceId: invoiceRef.id,
        caseId: input.caseId,
        createdBy: currentUser.id,
        createdAt: serverTimestamp(),
      });

      transaction.set(doc(ledgerCol), {
        transactionId: invoiceRef.id,
        date: serverTimestamp(),
        type: 'DEBIT',
        amount: input.totalAmount,
        description: `Accounts Receivable: ${input.invoiceNumber}`,
        category: 'ACCOUNTS_RECEIVABLE',
        sourceType: 'SALES',
        sourceId: invoiceRef.id,
        caseId: input.caseId,
        createdBy: currentUser.id,
        createdAt: serverTimestamp(),
      });

      const caseRef = doc(db, FIRESTORE_COLLECTIONS.CASES, input.caseId);
      transaction.update(caseRef, {
        'financial.totalInvoiced': increment(input.totalAmount),
        updatedAt: serverTimestamp(),
      });
    });
  };

  return { invoices, loading, error, createSalesInvoice };
}
