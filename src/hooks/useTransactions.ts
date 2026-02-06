import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';

export interface FinancialTransaction {
    id: string;
    projectId: string;
    type: 'INFLOW' | 'OUTFLOW';
    amount: number;
    category: string;
    referenceId: string;
    description: string;
    date: Date;
    status: 'Completed' | 'Pending';
    createdAt: any;
    paidAt?: any;
}

export const useTransactions = (projectId: string) => {
    const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!projectId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        const q = query(
            collection(db, 'transactions'),
            where('projectId', '==', projectId),
            orderBy('date', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data: FinancialTransaction[] = [];
            snapshot.forEach((doc) => {
                const d = doc.data();
                data.push({
                    id: doc.id,
                    ...d,
                    date: d.date?.toDate() || new Date(),
                    createdAt: d.createdAt?.toDate(),
                    paidAt: d.paidAt?.toDate(),
                } as FinancialTransaction);
            });
            setTransactions(data);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching transactions:", err);
            setError(err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [projectId]);

    return { transactions, loading, error };
};
