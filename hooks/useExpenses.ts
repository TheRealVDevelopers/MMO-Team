import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, updateDoc, doc, Timestamp, orderBy } from 'firebase/firestore';
import { Expense } from '../types';

type FirestoreExpense = Omit<Expense, 'date'> & {
    date: Timestamp;
};

const fromFirestore = (docData: FirestoreExpense, id: string): Expense => ({
    ...docData,
    id,
    date: docData.date.toDate(),
});

export const useExpenses = () => {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        setLoading(true);
        setError(null);
        const q = query(collection(db, 'expenses'), orderBy('date', 'desc'));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const data: Expense[] = [];
            querySnapshot.forEach((doc) => {
                data.push(fromFirestore(doc.data() as FirestoreExpense, doc.id));
            });
            setExpenses(data);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching expenses:", err);
            setError(err);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    return { expenses, loading, error };
};

export const updateExpense = async (expenseId: string, updatedData: Partial<Expense>) => {
    const expenseRef = doc(db, 'expenses', expenseId);
    await updateDoc(expenseRef, updatedData);
};
