import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, collectionGroup, Timestamp, doc, serverTimestamp, runTransaction } from 'firebase/firestore';
import { TimeEntry, User, CaseTask } from '../types';
import { useAuth } from '../context/AuthContext';
import { FIRESTORE_COLLECTIONS, DEFAULT_ORGANIZATION_ID } from '../constants';

export interface SalaryData {
    user: User;
    activeHours: number;
    breakHours: number;
    idleHours: number; // Duration not covered by activities
    taskHours: number;
    distanceKm: number;
    estimatedSalary: number;
    caseAllocations: Record<string, number>; // caseId -> hours
    status: 'Pending' | 'Generated';
}

export const useSalarySystem = (selectedMonth: string) => {
    const { currentUser } = useAuth();
    const [salaryData, setSalaryData] = useState<SalaryData[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const orgId = currentUser?.organizationId || DEFAULT_ORGANIZATION_ID;

    useEffect(() => {
        if (!orgId || !selectedMonth) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                // 1. Define Date Range for Month
                const [year, month] = selectedMonth.split('-').map(Number);
                const startDate = new Date(year, month - 1, 1);
                const endDate = new Date(year, month, 0, 23, 59, 59);

                // 2. Fetch Users (all staff - try org filter first, fall back to all)
                let usersSnap = await getDocs(query(collection(db, FIRESTORE_COLLECTIONS.STAFF_USERS), where('organizationId', '==', orgId)));
                
                // If no users found with org filter, fetch ALL staff users
                if (usersSnap.empty) {
                    console.log('[useSalarySystem] No users found with org filter, fetching ALL staff users');
                    usersSnap = await getDocs(collection(db, FIRESTORE_COLLECTIONS.STAFF_USERS));
                }
                
                const users = usersSnap.docs.map(d => ({ id: d.id, ...d.data() } as User));
                console.log(`[useSalarySystem] Found ${users.length} staff users`);

                // 3. Fetch Time Entries (try org filter first, fall back to date filter only)
                let timeSnap = await getDocs(query(
                    collection(db, 'timeEntries'),
                    where('organizationId', '==', orgId),
                    where('dateKey', '>=', selectedMonth + '-01'),
                    where('dateKey', '<=', selectedMonth + '-31')
                ));
                
                // If no time entries with org filter, try without org filter
                if (timeSnap.empty) {
                    console.log('[useSalarySystem] No time entries found with org filter, trying date filter only');
                    timeSnap = await getDocs(query(
                        collection(db, 'timeEntries'),
                        where('dateKey', '>=', selectedMonth + '-01'),
                        where('dateKey', '<=', selectedMonth + '-31')
                    ));
                }
                
                const timeEntries = timeSnap.docs.map(d => d.data() as TimeEntry);
                console.log(`[useSalarySystem] Found ${timeEntries.length} time entries for ${selectedMonth}`);

                // 4. Fetch Completed Tasks (for Distance)
                const taskQuery = query(
                    collectionGroup(db, 'tasks'),
                    where('completedAt', '>=', Timestamp.fromDate(startDate)),
                    where('completedAt', '<=', Timestamp.fromDate(endDate))
                );
                const taskSnap = await getDocs(taskQuery);
                const tasks = taskSnap.docs.map(d => d.data() as CaseTask);

                // Helper to safe convert Firestore Timestamp or Date
                const getDate = (d: any): Date => d?.toDate ? d.toDate() : new Date(d);

                // 5. Aggregate Data Per User
                const calculatedData: SalaryData[] = users.map(user => {
                    const userEntries = timeEntries.filter(te => te.userId === user.id);
                    const userTasks = tasks.filter(t => t.assignedTo === user.id);

                    let totalActiveSeconds = 0;
                    let totalBreakSeconds = 0;
                    let totalTaskSeconds = 0;
                    const caseSeconds: Record<string, number> = {};

                    userEntries.forEach(entry => {
                        if (!entry.clockOut) return; // Skip currently active or incomplete

                        const start = getDate(entry.clockIn);
                        const end = getDate(entry.clockOut);
                        const duration = (end.getTime() - start.getTime()) / 1000;

                        // Breaks
                        let breakDuration = 0;
                        if (entry.breaks) {
                            entry.breaks.forEach(b => {
                                if (b.endTime) {
                                    const bStart = getDate(b.startTime);
                                    const bEnd = getDate(b.endTime);
                                    breakDuration += (bEnd.getTime() - bStart.getTime()) / 1000;
                                }
                            });
                        }

                        // Activities (Task/Case Time)
                        let activityDuration = 0;
                        if (entry.activities) {
                            entry.activities.forEach(a => {
                                if (a.endTime) {
                                    const aStart = getDate(a.startTime);
                                    const aEnd = getDate(a.endTime);
                                    const aDur = (aEnd.getTime() - aStart.getTime()) / 1000;
                                    activityDuration += aDur;

                                    if (a.caseId) {
                                        caseSeconds[a.caseId] = (caseSeconds[a.caseId] || 0) + aDur;
                                    }
                                }
                            });
                        }

                        totalActiveSeconds += (duration - breakDuration);
                        totalBreakSeconds += breakDuration;
                        totalTaskSeconds += activityDuration;
                    });

                    // Distance
                    const distanceKm = userTasks.reduce((sum, t) => sum + (t.kmTravelled || 0), 0);

                    // Hours
                    const activeHours = totalActiveSeconds / 3600;
                    const breakHours = totalBreakSeconds / 3600;
                    const taskHours = totalTaskSeconds / 3600;
                    const idleHours = Math.max(0, activeHours - taskHours); // If task tracking used

                    // Case Allocations (Hours)
                    const caseAllocations: Record<string, number> = {};
                    Object.entries(caseSeconds).forEach(([cId, secs]) => {
                        caseAllocations[cId] = secs / 3600;
                    });

                    // Estimated Salary (Placeholder logic: 200/hr + 10/km)
                    // TODO: Retrieve actual salary config from User profile
                    const hourlyRate = 200;
                    const kmRate = 10;
                    const estimatedSalary = (activeHours * hourlyRate) + (distanceKm * kmRate);

                    return {
                        user,
                        activeHours,
                        breakHours,
                        idleHours,
                        taskHours,
                        distanceKm,
                        estimatedSalary,
                        caseAllocations,
                        status: 'Pending'
                    };
                });

                setSalaryData(calculatedData);
            } catch (err: any) {
                console.error("Error calculating salary:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [orgId, selectedMonth]);

    /** Options from UI: expense reimbursement, travel reimbursement, total payable (base + expense + travel) */
    const generatePayroll = async (
        data: SalaryData,
        options?: { expenseReimbursement?: number; travelReimbursement?: number; totalPayable?: number }
    ) => {
        if (!currentUser || !orgId) return;

        const totalPayable = options?.totalPayable ?? data.estimatedSalary;
        const expenseReimbursement = options?.expenseReimbursement ?? 0;
        const travelReimbursement = options?.travelReimbursement ?? (data.distanceKm * 10);
        const baseSalary = totalPayable - expenseReimbursement - travelReimbursement;

        const salaryRunId = `${orgId}-${selectedMonth}-${Date.now()}`;
        const ledgerId = `${selectedMonth}-${data.user.id}`;

        await runTransaction(db, async (transaction) => {
            const ledgerRef = doc(db, FIRESTORE_COLLECTIONS.ORGANIZATIONS, orgId, FIRESTORE_COLLECTIONS.SALARY_LEDGER, ledgerId);

            transaction.set(ledgerRef, {
                id: ledgerId,
                salaryRunId,
                userId: data.user.id,
                month: selectedMonth,
                activeHours: data.activeHours,
                idleHours: data.idleHours,
                breakHours: data.breakHours,
                taskHours: data.taskHours,
                distanceKm: data.distanceKm,
                distanceReimbursement: travelReimbursement,
                expenseReimbursement,
                baseSalary,
                incentives: 0,
                deductions: 0,
                totalSalary: totalPayable,
                generatedAt: serverTimestamp(),
                status: 'DRAFT',
            });

            if (totalPayable > 0) {
                const ledgerCol = collection(db, FIRESTORE_COLLECTIONS.ORGANIZATIONS, orgId, FIRESTORE_COLLECTIONS.GENERAL_LEDGER);
                const activeHoursSafe = data.activeHours > 0 ? data.activeHours : 1;
                const caseAmounts: { caseId: string; amount: number }[] = [];

                Object.entries(data.caseAllocations).forEach(([caseId, hours]) => {
                    const ratio = hours / activeHoursSafe;
                    const amount = Number((totalPayable * ratio).toFixed(2));
                    caseAmounts.push({ caseId, amount });
                    transaction.set(doc(ledgerCol), {
                        transactionId: ledgerId,
                        salaryRunId,
                        date: serverTimestamp(),
                        type: 'DEBIT',
                        amount,
                        description: `Salary Allocation: ${data.user.name} for ${selectedMonth}`,
                        category: 'EXPENSE',
                        sourceType: 'SALARY',
                        sourceId: ledgerId,
                        caseId,
                        createdBy: currentUser.id,
                        createdAt: serverTimestamp(),
                    });
                });

                const allocatedTotal = caseAmounts.reduce((sum, c) => sum + c.amount, 0);
                const remaining = totalPayable - allocatedTotal;
                if (remaining > 0.01) {
                    transaction.set(doc(ledgerCol), {
                        transactionId: ledgerId,
                        salaryRunId,
                        date: serverTimestamp(),
                        type: 'DEBIT',
                        amount: Number(remaining.toFixed(2)),
                        description: `Salary Overhead (Idle/Unallocated): ${data.user.name}`,
                        category: 'EXPENSE',
                        sourceType: 'SALARY',
                        sourceId: ledgerId,
                        createdBy: currentUser.id,
                        createdAt: serverTimestamp(),
                    });
                }

                // Update each case's costCenter.spentAmount so Project P&L reflects salary spend
                for (const { caseId, amount } of caseAmounts) {
                    const caseRef = doc(db, FIRESTORE_COLLECTIONS.CASES, caseId);
                    const caseSnap = await transaction.get(caseRef);
                    if (!caseSnap.exists()) continue;
                    const caseData = caseSnap.data();
                    const cc = caseData.costCenter || {};
                    const received = cc.receivedAmount ?? 0;
                    const currentSpent = cc.spentAmount ?? 0;
                    const newSpent = currentSpent + amount;
                    const newRemaining = received - newSpent;
                    transaction.update(caseRef, {
                        costCenter: {
                            ...cc,
                            spentAmount: newSpent,
                            remainingAmount: newRemaining,
                        },
                        updatedAt: serverTimestamp(),
                    });
                }
            }
        });
    };

    return { salaryData, loading, error, generatePayroll };
};
