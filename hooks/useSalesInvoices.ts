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
  updateDoc,
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
  invoiceNumber?: string; // Optional - auto-generated if not provided
  clientName: string;
  amount: number;
  taxAmount?: number;
  totalAmount: number;
  issueDate: Date;
  dueDate?: Date;
  paymentId?: string; // PHASE 3: Link to received payment
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

    // Generate invoice number if not provided
    const invoiceNumber = input.invoiceNumber || `INV-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Date.now().toString().slice(-4)}`;

    await runTransaction(db, async (transaction) => {
      // PHASE 4: Read case first to get existing costCenter data
      const caseRef = doc(db, FIRESTORE_COLLECTIONS.CASES, input.caseId);
      const caseSnap = await transaction.get(caseRef);
      const caseData = caseSnap.data() || {};
      const existingCostCenter = caseData.costCenter || null;

      const invoiceRef = doc(
        collection(db, FIRESTORE_COLLECTIONS.ORGANIZATIONS, organizationId, FIRESTORE_COLLECTIONS.SALES_INVOICES)
      );

      transaction.set(invoiceRef, {
        organizationId,
        caseId: input.caseId,
        invoiceNumber: invoiceNumber,
        clientName: input.clientName,
        amount: input.amount,
        taxAmount: input.taxAmount ?? 0,
        totalAmount: input.totalAmount,
        issueDate: Timestamp.fromDate(input.issueDate),
        dueDate: input.dueDate ? Timestamp.fromDate(input.dueDate) : null,
        status: 'pending',
        createdAt: serverTimestamp(),
        paymentId: input.paymentId || null, // PHASE 3: Link to received payment
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
        description: `Sales Invoice ${invoiceNumber}: ${input.clientName}`,
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
        description: `Accounts Receivable: ${invoiceNumber}`,
        category: 'ACCOUNTS_RECEIVABLE',
        sourceType: 'SALES',
        sourceId: invoiceRef.id,
        caseId: input.caseId,
        createdBy: currentUser.id,
        createdAt: serverTimestamp(),
      });

      // =====================================
      // PHASE 4: COST CENTER AUTOMATION
      // =====================================
      let costCenterUpdate: any;
      
      if (!existingCostCenter) {
        // Initialize costCenter if it doesn't exist
        costCenterUpdate = {
          totalProjectValue: 0,
          receivedAmount: input.totalAmount,
          spentAmount: 0,
          remainingAmount: input.totalAmount,
          lastInvoiceId: invoiceRef.id,
          updatedAt: serverTimestamp(),
        };
      } else {
        // Update existing costCenter
        const newReceivedAmount = (existingCostCenter.receivedAmount || 0) + input.totalAmount;
        const spentAmount = existingCostCenter.spentAmount || 0;
        costCenterUpdate = {
          receivedAmount: newReceivedAmount,
          remainingAmount: newReceivedAmount - spentAmount,
          lastInvoiceId: invoiceRef.id,
          updatedAt: serverTimestamp(),
        };
      }

      // Update case with costCenter and financial data
      transaction.update(caseRef, {
        'costCenter': existingCostCenter 
          ? { ...existingCostCenter, ...costCenterUpdate }
          : costCenterUpdate,
        'financial.totalInvoiced': increment(input.totalAmount),
        updatedAt: serverTimestamp(),
      });
    });
  };

  const updateSalesInvoiceStatus = async (
    invoiceId: string,
    updates: { status?: 'pending' | 'paid' | 'overdue'; paidAmount?: number }
  ) => {
    if (!organizationId) throw new Error('Organization ID required');
    const invoiceRef = doc(
      db,
      FIRESTORE_COLLECTIONS.ORGANIZATIONS,
      organizationId,
      FIRESTORE_COLLECTIONS.SALES_INVOICES,
      invoiceId
    );
    const payload: Record<string, unknown> = {
      updatedAt: serverTimestamp(),
    };
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.paidAmount !== undefined) payload.paidAmount = updates.paidAmount;
    await updateDoc(invoiceRef, payload);
  };

  return { invoices, loading, error, createSalesInvoice, updateSalesInvoiceStatus };
}
