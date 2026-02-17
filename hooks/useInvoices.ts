import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, addDoc, updateDoc, doc, deleteDoc, Timestamp, orderBy, where } from 'firebase/firestore';
import { Invoice } from '../types';

type FirestoreInvoice = Omit<Invoice, 'issueDate' | 'dueDate'> & {
    issueDate: Timestamp;
    dueDate: Timestamp;
};

const fromFirestore = (docData: FirestoreInvoice, id: string): Invoice => {
    return {
        ...docData,
        id,
        issueDate: docData.issueDate.toDate(),
        dueDate: docData.dueDate.toDate(),
    } as Invoice;
};

export const useInvoices = (projectId?: string) => {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        setLoading(true);
        setError(null);
        let q = query(collection(db, 'invoices'), orderBy('issueDate', 'desc'));

        if (projectId) {
            // Note: This might require a composite index on firestore
            q = query(collection(db, 'invoices'), where('projectId', '==', projectId), orderBy('issueDate', 'desc'));
        }

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const data: Invoice[] = [];
            querySnapshot.forEach((doc) => {
                data.push(fromFirestore(doc.data() as FirestoreInvoice, doc.id));
            });
            setInvoices(data);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching invoices:", err);
            setError(err);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [projectId]);

    return { invoices, loading, error };
};

export const addInvoice = async (invoiceData: Omit<Invoice, 'id'>) => {
    // Import dynamically to avoid circular dependencies
    const { recordInvoiceCreation } = await import('../services/financeService');

    const invoiceWithDefaults = {
        ...invoiceData,
        visibleToClient: false,
        approvalStatus: 'pending'
    };

    const docRef = await addDoc(collection(db, 'invoices'), invoiceWithDefaults);

    if (invoiceData.projectId || invoiceData.caseId) {
        await recordInvoiceCreation(
            docRef.id,
            (invoiceData.projectId || invoiceData.caseId) as string,
            invoiceData.totalAmount || invoiceData.amount,
            invoiceData.invoiceNumber || 'Unknown'
        );
    }
};

// Helper to ensure defaults
const prepareInvoiceData = (data: Omit<Invoice, 'id'>) => ({
    ...data,
    visibleToClient: false,
    approvalStatus: 'pending' as const
});

export const updateInvoice = async (invoiceId: string, updatedData: Partial<Invoice>) => {
    const invoiceRef = doc(db, 'invoices', invoiceId);
    await updateDoc(invoiceRef, updatedData);
};

export const updateInvoiceStatus = async (invoiceId: string, projectId: string, amount: number, status: any) => {
    // Import dynamically to avoid circular dependencies if any, or standard import
    const { markInvoiceAsPaid } = await import('../services/financeService');
    if (status === 'Paid') {
        await markInvoiceAsPaid(invoiceId, projectId, amount);
    } else {
        await updateInvoice(invoiceId, { status });
    }
};

export const deleteInvoice = async (invoiceId: string) => {
    await deleteDoc(doc(db, 'invoices', invoiceId));
};
