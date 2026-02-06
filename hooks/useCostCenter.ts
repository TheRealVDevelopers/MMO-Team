import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, updateDoc, serverTimestamp, Timestamp, collection, addDoc, query, orderBy, deleteDoc, increment, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export interface CostCenterItem {
    id: string;
    name: string;
    allocatedAmount: number;
    spentAmount: number;
}

export interface Transaction {
    id: string;
    type: 'credit' | 'debit';
    category: string; // Relates to Cost Center Name
    amount: number;
    description: string;
    date: Date;
    status: 'pending' | 'approved' | 'rejected';
    addedBy: {
        uid: string;
        name: string;
        role: string;
    };
    approvedBy?: {
        uid: string;
        name: string;
        timestamp: Date;
    };
}

export interface ProjectBudget {
    caseId: string; // Changed from projectId
    projectId?: string; // Kept for backward compatibility
    totalBudget: number;
    costCenters: CostCenterItem[];
    receivedAmount: number; // Total Inflow
    spentAmount: number; // Total Outflow (Approved Only)
    pendingAmount: number; // Total Pending Outflow
    updatedAt?: Date;
}

// CASE-CENTRIC: Changed from projects to cases
export function useCostCenter(caseId?: string) {
    const [budget, setBudget] = useState<ProjectBudget | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 1. Fetch Budget & Cost Centers
    useEffect(() => {
        if (!caseId) {
            setBudget(null);
            setTransactions([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        // CASE-CENTRIC: Changed from projects/{projectId}/financials/budget
        // to cases/{caseId}/expenses/budget
        const budgetRef = doc(db, 'cases', caseId, 'expenses', 'budget');

        const unsubBudget = onSnapshot(budgetRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setBudget({
                    ...data,
                    caseId: caseId,
                    projectId: caseId, // Keep for backward compatibility
                    costCenters: data.costCenters || [],
                    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
                } as ProjectBudget);
            } else {
                // Initialize default structure if missing
                setBudget({
                    caseId,
                    projectId: caseId,
                    totalBudget: 0,
                    costCenters: [],
                    receivedAmount: 0,
                    spentAmount: 0,
                    pendingAmount: 0
                });
            }
        });

        // 2. Fetch Transactions (Real-time Log)
        // CASE-CENTRIC: Changed path to cases/{caseId}/expenses/budget/transactions
        const transRef = collection(db, 'cases', caseId, 'expenses', 'budget', 'transactions');
        const q = query(transRef, orderBy('date', 'desc'));

        const unsubTrans = onSnapshot(q, (snapshot) => {
            const fetchedTrans: Transaction[] = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    date: data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date),
                    approvedBy: data.approvedBy ? {
                        ...data.approvedBy,
                        timestamp: data.approvedBy.timestamp instanceof Timestamp ? data.approvedBy.timestamp.toDate() : new Date()
                    } : undefined
                } as Transaction;
            });
            setTransactions(fetchedTrans);
            setLoading(false);
        });

        return () => {
            unsubBudget();
            unsubTrans();
        };
    }, [caseId]);

    // Actions

    const saveBudget = async (budgetData: Partial<ProjectBudget>) => {
        if (!caseId) return;
        // CASE-CENTRIC: Changed path to cases/{caseId}/expenses/budget
        const budgetRef = doc(db, 'cases', caseId, 'expenses', 'budget');

        await setDoc(budgetRef, {
            ...budgetData,
            updatedAt: serverTimestamp()
        }, { merge: true });

        // Sync to Case Document for high-level dashboard view
        if (budgetData.totalBudget) {
            const caseRef = doc(db, 'cases', caseId);
            await updateDoc(caseRef, {
                'budget.totalBudget': budgetData.totalBudget,
                'budget.defined': true
            });
        }
    };

    const addCostCenter = async (name: string, allocatedAmount: number) => {
        if (!caseId || !budget) return;
        const newCenters = [...budget.costCenters, { id: Date.now().toString(), name, allocatedAmount, spentAmount: 0 }];
        await saveBudget({ costCenters: newCenters });
    };

    const removeCostCenter = async (id: string) => {
        if (!caseId || !budget) return;
        const newCenters = budget.costCenters.filter(cc => cc.id !== id);
        await saveBudget({ costCenters: newCenters });
    };

    const addTransaction = async (transaction: Omit<Transaction, 'id' | 'status' | 'approvedBy'>, userRole: string) => {
        if (!caseId) return;

        // Auto-approve if Accounts Team, else Pending
        const status = userRole === 'ACCOUNTS_TEAM' || userRole === 'SUPER_ADMIN' ? 'approved' : 'pending';

        // CASE-CENTRIC: Changed path to cases/{caseId}/expenses/budget/transactions
        const transRef = collection(db, 'cases', caseId, 'expenses', 'budget', 'transactions');

        await addDoc(transRef, {
            ...transaction,
            status,
            date: Timestamp.fromDate(transaction.date)
        });

        // Use a cloud function or manual trigger to update totals, 
        // BUT for now, if approved immediately, update locally.
        if (status === 'approved') {
            await updateTotals(caseId, transaction.type, transaction.amount, transaction.category);
        } else {
            await updatePendingTotal(caseId, transaction.amount);
        }
    };

    const approveTransaction = async (transaction: Transaction, approver: { uid: string, name: string }) => {
        if (!caseId) return;
        // CASE-CENTRIC: Changed path to cases/{caseId}/expenses/budget/transactions
        const transRef = doc(db, 'cases', caseId, 'expenses', 'budget', 'transactions', transaction.id);

        await updateDoc(transRef, {
            status: 'approved',
            approvedBy: {
                ...approver,
                timestamp: serverTimestamp()
            }
        });

        // Update totals
        await updateTotals(caseId, transaction.type, transaction.amount, transaction.category);
        // Decrease pending
        await updatePendingTotal(caseId, -transaction.amount);
    };

    const rejectTransaction = async (transaction: Transaction, approver: { uid: string, name: string }) => {
        if (!caseId) return;
        // CASE-CENTRIC: Changed path to cases/{caseId}/expenses/budget/transactions
        const transRef = doc(db, 'cases', caseId, 'expenses', 'budget', 'transactions', transaction.id);

        await updateDoc(transRef, {
            status: 'rejected',
            approvedBy: {
                ...approver,
                timestamp: serverTimestamp() // Rejected time
            }
        });

        // Decrease pending only
        await updatePendingTotal(caseId, -transaction.amount);
    };

    // Helper: Update main budget doc totals
    const updateTotals = async (cId: string, type: 'credit' | 'debit', amount: number, category: string) => {
        // CASE-CENTRIC: Changed path to cases/{caseId}/expenses/budget
        const budgetRef = doc(db, 'cases', cId, 'expenses', 'budget');

        // 1. Update Top-level aggregates (Inflow/Outflow)
        const updates: any = {};
        if (type === 'credit') {
            updates.receivedAmount = increment(amount);
        } else {
            updates.spentAmount = increment(amount);

            // Also sync to Case Document for high-level dashboard
            const caseRef = doc(db, 'cases', cId);
            updateDoc(caseRef, { 'budget.spent': increment(amount) }).catch(console.error);
        }

        // 2. Update specific Cost Center 'spentAmount' if debit
        if (type === 'debit') {
            try {
                // We must read the doc to find the index of the cost center
                // Firestore doesn't support updating array element by query yet easily for list of objects
                const snap = await getDoc(budgetRef);
                if (snap.exists()) {
                    const data = snap.data() as ProjectBudget;
                    const costCenters = data.costCenters || [];
                    const updatedCenters = costCenters.map(cc => {
                        if (cc.name === category) {
                            return { ...cc, spentAmount: (cc.spentAmount || 0) + amount };
                        }
                        return cc;
                    });
                    updates.costCenters = updatedCenters;
                }
            } catch (e) {
                console.error("Error updating cost center split:", e);
            }
        }

        await updateDoc(budgetRef, updates);
    };

    const updatePendingTotal = async (cId: string, amount: number) => {
        // CASE-CENTRIC: Changed path to cases/{caseId}/expenses/budget
        const budgetRef = doc(db, 'cases', cId, 'expenses', 'budget');
        await updateDoc(budgetRef, {
            pendingAmount: increment(amount)
        });
    };

    return {
        budget,
        transactions,
        loading,
        error,
        saveBudget,
        addCostCenter,
        removeCostCenter,
        addTransaction,
        approveTransaction,
        rejectTransaction
    };
}
