import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, updateDoc, doc, Timestamp, orderBy, addDoc } from 'firebase/firestore';
import { VendorBill } from '../types';

type FirestoreVendorBill = Omit<VendorBill, 'issueDate' | 'dueDate'> & {
    issueDate: Timestamp;
    dueDate: Timestamp;
};

const fromFirestore = (docData: FirestoreVendorBill, id: string): VendorBill => ({
    ...docData,
    id,
    issueDate: docData.issueDate.toDate(),
    dueDate: docData.dueDate.toDate(),
});

export const useVendorBills = () => {
    const [vendorBills, setVendorBills] = useState<VendorBill[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        setLoading(true);
        setError(null);
        const q = query(collection(db, 'vendorBills'), orderBy('dueDate', 'desc'));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const data: VendorBill[] = [];
            querySnapshot.forEach((doc) => {
                data.push(fromFirestore(doc.data() as FirestoreVendorBill, doc.id));
            });
            setVendorBills(data);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching vendor bills:", err);
            setError(err);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    return { vendorBills, loading, error };
};

export const addVendorBill = async (billData: Omit<VendorBill, 'id'>) => {
    try {
        await addDoc(collection(db, 'vendorBills'), {
            ...billData,
            issueDate: Timestamp.fromDate(billData.issueDate),
            dueDate: Timestamp.fromDate(billData.dueDate)
        });
    } catch (error) {
        console.error("Error adding vendor bill:", error);
        throw error;
    }
};

export const updateVendorBill = async (billId: string, updatedData: Partial<VendorBill>) => {
    try {
        const billRef = doc(db, 'vendorBills', billId);
        await updateDoc(billRef, updatedData);
    } catch (error) {
        console.error("Error updating vendor bill:", error);
        throw error;
    }
};
