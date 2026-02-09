import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, where, Timestamp } from 'firebase/firestore';
import { GeneralLedgerEntry } from '../types';
import { useAuth } from '../context/AuthContext';
import { FIRESTORE_COLLECTIONS } from '../constants';

export const useGeneralLedger = (filters?: { startDate?: Date; endDate?: Date; category?: string; caseId?: string }) => {
    const { currentUser } = useAuth();
    const [entries, setEntries] = useState<GeneralLedgerEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!currentUser?.organizationId) {
            setLoading(false);
            return;
        }

        setLoading(true);

        let constraints: any[] = [
            orderBy('date', 'desc')
        ];

        if (filters?.startDate) {
            constraints.push(where('date', '>=', Timestamp.fromDate(filters.startDate)));
        }
        if (filters?.endDate) {
            constraints.push(where('date', '<=', Timestamp.fromDate(filters.endDate)));
        }
        if (filters?.category) {
            constraints.push(where('category', '==', filters.category));
        }
        if (filters?.caseId) {
            constraints.push(where('caseId', '==', filters.caseId));
        }

        // Note: Compound queries with range filters + inequality on different fields require indexes.
        // Simplifying: Client-side filtering for category if date range is used might be needed if index is missing.
        // For now, assuming date is primary filter.

        const q = query(
            collection(db, FIRESTORE_COLLECTIONS.ORGANIZATIONS, currentUser.organizationId, FIRESTORE_COLLECTIONS.GENERAL_LEDGER),
            orderBy('date', 'desc') // Start with basic ordering
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            let data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                date: doc.data().date?.toDate(),
                createdAt: doc.data().createdAt?.toDate()
            })) as GeneralLedgerEntry[];

            // Client-side filtering to avoid complex index requirements during dev
            if (filters?.startDate) {
                data = data.filter(e => e.date >= filters.startDate!);
            }
            if (filters?.endDate) {
                data = data.filter(e => e.date <= filters.endDate!);
            }
            if (filters?.category) {
                data = data.filter(e => e.category === filters.category);
            }
            if (filters?.caseId) {
                data = data.filter(e => e.caseId === filters.caseId);
            }

            setEntries(data);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching ledger:", err);
            setError("Failed to load general ledger");
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser?.organizationId, filters?.startDate, filters?.endDate, filters?.category, filters?.caseId]);

    const stats = {
        totalRevenue: entries.filter(e => e.type === 'CREDIT' && e.category === 'REVENUE').reduce((sum, e) => sum + e.amount, 0),
        totalExpenses: entries.filter(e => e.type === 'DEBIT' && e.category === 'EXPENSE').reduce((sum, e) => sum + e.amount, 0),
        netProfit: 0 // calculated below
    };
    stats.netProfit = stats.totalRevenue - stats.totalExpenses;

    return { entries, stats, loading, error };
};
