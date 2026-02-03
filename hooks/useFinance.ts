
import { useState, useEffect } from 'react';
import {
    collection,
    onSnapshot,
    query,
    where,
    orderBy,
    addDoc,
    updateDoc,
    doc,
    runTransaction,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import {
    Transaction,
    CostCenter,
    SalaryRecord,
    TransactionType,
    TransactionCategory
} from '../types';

export const useFinance = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
    const [salaries, setSalaries] = useState<SalaryRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!db) return;

        setLoading(true);

        // Subscribe to Transactions
        const qTransactions = query(
            collection(db, 'transactions'),
            orderBy('date', 'desc')
        );

        const unsubscribeTransactions = onSnapshot(qTransactions, (snapshot) => {
            const fetched = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                date: doc.data().date instanceof Timestamp ? doc.data().date.toDate() : new Date(doc.data().date)
            })) as Transaction[];
            setTransactions(fetched);
        }, (err) => {
            console.error("Error fetching transactions:", err);
            setError("Failed to load transactions");
        });

        // Subscribe to Cost Centers
        const qCostCenters = query(collection(db, 'costCenters'));
        const unsubscribeCostCenters = onSnapshot(qCostCenters, (snapshot) => {
            const fetched = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                lastUpdated: doc.data().lastUpdated instanceof Timestamp ? doc.data().lastUpdated.toDate() : new Date(doc.data().lastUpdated)
            })) as CostCenter[];
            setCostCenters(fetched);
        }, (err) => {
            console.error("Error fetching cost centers:", err);
        });

        // Subscribe to Salary Records
        const qSalaries = query(collection(db, 'salaryRecords'));
        const unsubscribeSalaries = onSnapshot(qSalaries, (snapshot) => {
            const fetched = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as SalaryRecord[];
            setSalaries(fetched);
        });

        setLoading(false);

        return () => {
            unsubscribeTransactions();
            unsubscribeCostCenters();
            unsubscribeSalaries();
        };
    }, []);

    const addTransaction = async (transaction: Omit<Transaction, 'id' | 'status'> & { status?: string }) => {
        try {
            await runTransaction(db, async (firestoreTx) => {
                // 1. Create Transaction
                const newTxRef = doc(collection(db, 'transactions'));
                const newTxData = {
                    ...transaction,
                    status: transaction.status || 'COMPLETED',
                    date: transaction.date || serverTimestamp(),
                };
                firestoreTx.set(newTxRef, newTxData);

                // 2. Update Cost Center
                const costCenterRef = doc(db, 'costCenters', transaction.projectId);
                const costCenterDoc = await firestoreTx.get(costCenterRef);

                if (!costCenterDoc.exists()) {
                    // Initialize if missing
                    firestoreTx.set(costCenterRef, {
                        projectId: transaction.projectId,
                        totalBudget: 0,
                        totalPayIn: transaction.type === 'PAY_IN' ? transaction.amount : 0,
                        totalPayOut: transaction.type === 'PAY_OUT' ? transaction.amount : 0,
                        remainingBudget: transaction.type === 'PAY_IN' ? transaction.amount : -transaction.amount,
                        profit: 0,
                        status: 'Active',
                        lastUpdated: serverTimestamp()
                    });
                } else {
                    const data = costCenterDoc.data() as CostCenter;
                    let newPayIn = data.totalPayIn;
                    let newPayOut = data.totalPayOut;

                    if (transaction.type === 'PAY_IN') {
                        newPayIn += transaction.amount;
                    } else if (transaction.type === 'PAY_OUT') {
                        newPayOut += transaction.amount;
                    }

                    const newRemaining = data.totalBudget - newPayOut; // Or logic based on PayIn - PayOut? 
                    // Usually budget is Estimated Cost. 
                    // Available Funds = TotalPayIn - TotalPayOut.
                    // User said: "Pay In also creates project balance". "That amount increases project available budget."

                    // Let's assume Available Balance = PayIn - PayOut for now?
                    // Or User meant Budget = Contract Amount?
                    // Flow: Client pays advance -> Pay In. 

                    firestoreTx.update(costCenterRef, {
                        totalPayIn: newPayIn,
                        totalPayOut: newPayOut,
                        remainingBudget: newPayIn - newPayOut, // Balance logic
                        lastUpdated: serverTimestamp()
                    });
                }
            });
            return true;
        } catch (e) {
            console.error("Transaction failed:", e);
            throw e;
        }
    };

    return {
        transactions,
        costCenters,
        salaries,
        loading,
        error,
        addTransaction
    };
};
