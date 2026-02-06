import { db } from '../firebase';
import { collection, addDoc, updateDoc, doc, Timestamp, runTransaction, serverTimestamp, increment, setDoc, query, where, getDocs } from 'firebase/firestore';
import { Invoice, Expense, PaymentStatus } from '../types';

// Define Transaction Interface internally if not in types (or import if it exists)
export interface FinancialTransaction {
    id?: string;
    projectId?: string;
    type: 'INFLOW' | 'OUTFLOW';
    amount: number;
    category: string; // 'Sales Invoice', 'Expense', 'Material Purchase', 'Salary'
    referenceId: string; // Invoice ID, Request ID, etc.
    description: string;
    date: Date;
    status: 'Completed' | 'Pending';
    createdAt: any;
}

/**
 * Records an INFLOW (Money coming in, e.g., Sales Invoice Paid)
 * Updates Project: INCREMENT totalCollected, DECREMENT pendingPayments (if tracked)
 */
export const recordInflow = async (projectId: string, amount: number, referenceId: string, description: string) => {
    if (!projectId) return;

    try {
        await runTransaction(db, async (transaction) => {
            const projectRef = doc(db, 'projects', projectId);

            // 1. Log Transaction
            const transactionRef = doc(collection(db, 'transactions'));
            transaction.set(transactionRef, {
                projectId,
                type: 'INFLOW',
                amount,
                category: 'Sales Invoice',
                referenceId,
                description,
                date: new Date(),
                status: 'Completed',
                createdAt: serverTimestamp()
            });

            // 2. Update Project Financials
            // We assume the project doc has 'totalCollected' field. If not, we might need to create it.
            transaction.update(projectRef, {
                totalCollected: increment(amount),
                updatedAt: serverTimestamp()
            });
        });
        console.log(`Inflow recorded for Project ${projectId}: +${amount}`);
    } catch (error) {
        console.error("Error recording inflow:", error);
        throw error;
    }
};

/**
 * Records a pending invoice creation
 */
export const recordInvoiceCreation = async (invoiceId: string, projectId: string, amount: number, invoiceNumber: string) => {
    try {
        const transactionRef = doc(collection(db, 'transactions'));
        await setDoc(transactionRef, {
            projectId,
            type: 'INFLOW',
            amount,
            category: 'Sales Invoice',
            referenceId: invoiceId,
            description: `Invoice ${invoiceNumber} Created`,
            date: new Date(),
            status: 'Pending',
            createdAt: serverTimestamp()
        });
        console.log(`Pending transaction created for Invoice ${invoiceNumber}`);
    } catch (error) {
        console.error("Error recording invoice creation:", error);
    }
}

/**
 * Records an OUTFLOW (Money going out, e.g., Expenses, Vendor Bills)
 * Updates Project: INCREMENT totalExpenses
 */
export const recordOutflow = async (projectId: string, amount: number, category: string, referenceId: string, description: string) => {
    if (!projectId) return;

    try {
        await runTransaction(db, async (transaction) => {
            const projectRef = doc(db, 'projects', projectId);

            // 1. Log Transaction
            const transactionRef = doc(collection(db, 'transactions'));
            transaction.set(transactionRef, {
                projectId,
                type: 'OUTFLOW',
                amount,
                category,
                referenceId,
                description,
                date: new Date(),
                status: 'Completed',
                createdAt: serverTimestamp()
            });

            // 2. Update Project Financials
            transaction.update(projectRef, {
                totalExpenses: increment(amount),
                // Optionally update budgetRemaining if it's a field, or calculate it on read
                // budgetRemaining: increment(-amount), 
                updatedAt: serverTimestamp()
            });
        });
        console.log(`Outflow recorded for Project ${projectId}: -${amount}`);
    } catch (error) {
        console.error("Error recording outflow:", error);
        throw error;
    }
};

/**
 * Marks an invoice as PAID and triggers the Inflow recording
 */
export const markInvoiceAsPaid = async (invoiceId: string, projectId: string, amount: number) => {
    try {
        // 1. Update Invoice Status
        await updateDoc(doc(db, 'invoices', invoiceId), {
            status: PaymentStatus.PAID,
            paidAmount: amount,
            updatedAt: serverTimestamp()
        });

        // 2. Find and Update Transaction (or create if missing)
        const q = query(collection(db, 'transactions'), where('referenceId', '==', invoiceId));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const transactionDoc = querySnapshot.docs[0];
            await updateDoc(transactionDoc.ref, {
                status: 'Completed',
                paidAt: serverTimestamp()
            });

            // Update Project Balance
            await updateDoc(doc(db, 'projects', projectId), {
                totalCollected: increment(amount),
                updatedAt: serverTimestamp()
            });
        } else {
            // Fallback: Create new if not found
            await recordInflow(projectId, amount, invoiceId, `Invoice ${invoiceId} Paid`);
        }

    } catch (error) {
        console.error("Error marking invoice as paid:", error);
        throw error;
    }
};
