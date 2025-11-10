import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, addDoc, updateDoc, doc, Timestamp, orderBy } from 'firebase/firestore';
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
    };
};

export const useInvoices = () => {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        setLoading(true);
        setError(null);
        const q = query(collection(db, 'invoices'), orderBy('issueDate', 'desc'));
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
    }, []);

    return { invoices, loading, error };
};

export const addInvoice = async (invoiceData: Omit<Invoice, 'id'>) => {
    await addDoc(collection(db, 'invoices'), invoiceData);
};

export const updateInvoice = async (invoiceId: string, updatedData: Partial<Invoice>) => {
    const invoiceRef = doc(db, 'invoices', invoiceId);
    await updateDoc(invoiceRef, updatedData);
};
