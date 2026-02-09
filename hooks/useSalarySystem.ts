import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, collectionGroup, Timestamp, doc, serverTimestamp, runTransaction } from 'firebase/firestore';
import { TimeEntry, User, UserRole, SalaryLedgerEntry, CaseTask, GeneralLedgerEntry } from '../types';
import { useAuth } from '../context/AuthContext';
import { FIRESTORE_COLLECTIONS } from '../constants';

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

    useEffect(() => {
        if (!currentUser?.organizationId || !selectedMonth) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                // 1. Define Date Range for Month
                const [year, month] = selectedMonth.split('-').map(Number);
                const startDate = new Date(year, month - 1, 1);
                const endDate = new Date(year, month, 0, 23, 59, 59);

                // 2. Fetch Users
                const usersRef = collection(db, 'staffUsers'); // Assuming collection name
                // Actually types says Path: staffUsers/{userId}. 
                // In hooks/useUsers.ts it uses 'staffUsers' or 'users'? 
                // useUsers.ts uses collection(db, 'users') usually. I should check.
                // Step 649 (SalaryPage) used useUsers().
                // I will use 'users' collection for now, matching useUsers.ts standard.
                const usersSnap = await getDocs(query(collection(db, 'users'), where('organizationId', '==', currentUser.organizationId)));
                const users = usersSnap.docs.map(d => ({ id: d.id, ...d.data() } as User));

                // 3. Fetch Time Entries
                const timeQuery = query(
                    collection(db, 'timeEntries'),
                    where('organizationId', '==', currentUser.organizationId),
                    where('dateKey', '>=', selectedMonth + '-01'),
                    where('dateKey', '<=', selectedMonth + '-31')
                );
                // Note: String comparison on dateKey "YYYY-MM-DD" works for "YYYY-MM" filtering roughly.
                const timeSnap = await getDocs(timeQuery);
                const timeEntries = timeSnap.docs.map(d => d.data() as TimeEntry);

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
    }, [currentUser?.organizationId, selectedMonth]);

    const generatePayroll = async (data: SalaryData) => {
        if (!currentUser?.organizationId) return;

        const salaryRunId = `${currentUser.organizationId}-${selectedMonth}-${Date.now()}`;
        const ledgerId = `${selectedMonth}-${data.user.id}`;

        await runTransaction(db, async (transaction) => {
            const ledgerRef = doc(db, FIRESTORE_COLLECTIONS.ORGANIZATIONS, currentUser.organizationId, FIRESTORE_COLLECTIONS.SALARY_LEDGER, ledgerId);

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
                distanceReimbursement: data.distanceKm * 10,
                baseSalary: data.estimatedSalary - (data.distanceKm * 10),
                incentives: 0,
                deductions: 0,
                totalSalary: data.estimatedSalary,
                generatedAt: serverTimestamp(),
                status: 'DRAFT',
            });

            if (data.estimatedSalary > 0) {
                const ledgerCol = collection(db, FIRESTORE_COLLECTIONS.ORGANIZATIONS, currentUser.organizationId, FIRESTORE_COLLECTIONS.GENERAL_LEDGER);

                Object.entries(data.caseAllocations).forEach(([caseId, hours]) => {
                    const ratio = hours / data.activeHours;
                    const amount = data.estimatedSalary * ratio;
                    transaction.set(doc(ledgerCol), {
                        transactionId: ledgerId,
                        salaryRunId,
                        date: serverTimestamp(),
                        type: 'DEBIT',
                        amount: Number(amount.toFixed(2)),
                        description: `Salary Allocation: ${data.user.name} for ${selectedMonth}`,
                        category: 'EXPENSE',
                        sourceType: 'SALARY',
                        sourceId: ledgerId,
                        caseId,
                        createdBy: currentUser.id,
                        createdAt: serverTimestamp(),
                    });
                });

                const allocatedAmount = Object.values(data.caseAllocations).reduce((sum, hours) => sum + ((hours / data.activeHours) * data.estimatedSalary), 0);
                const remaining = data.estimatedSalary - allocatedAmount;
                if (remaining > 1) {
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
            }
        });
    };

    return { salaryData, loading, error, generatePayroll };
};
