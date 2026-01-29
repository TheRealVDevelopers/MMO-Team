import { db } from '../firebase';
import {
    collection,
    query,
    where,
    getDocs,
    doc,
    updateDoc,
    Timestamp,
    onSnapshot
} from 'firebase/firestore';
import { Task, TaskStatus, User, UserRole } from '../types';
import { createNotification } from './liveDataService';

/**
 * Calculates the performance flag for a user based on their tasks
 */
export const calculateUserPerformance = (tasks: Task[]): {
    flag: 'green' | 'yellow' | 'red';
    reason: string;
    metrics: {
        activeTaskCount: number;
        overdueTaskCount: number;
        upcomingDeadlineCount: number;
    }
} => {
    const now = new Date();
    const currentHour = now.getHours();

    // Filter tasks for TODAY only (since rules are about "today's tasks")
    const todayStr = now.toISOString().split('T')[0];
    const todaysTasks = tasks.filter(t => t.date === todayStr);
    const pendingTasks = todaysTasks.filter(t => t.status !== TaskStatus.COMPLETED);

    // Legacy metrics calculation (still useful for UI)
    const overdueTasks = tasks.filter(t => {
        if (t.status === TaskStatus.COMPLETED) return false;
        if (!t.dueAt) return false;
        const dueAt = t.dueAt instanceof Date ? t.dueAt : (t.dueAt as any).toDate?.() || new Date(t.dueAt);
        return dueAt < now;
    });

    let flag: 'green' | 'yellow' | 'red' = 'green';
    let reason = 'Green Flag: On Track';

    // Proximity Tasks (Due within 1 hour)
    const upcomingTasks = pendingTasks.filter(t => {
        if (!t.dueAt) return false;
        const dueAt = t.dueAt instanceof Date ? t.dueAt : (t.dueAt as any).toDate?.() || new Date(t.dueAt);
        const timeDiff = dueAt.getTime() - now.getTime();
        return timeDiff > 0 && timeDiff <= 60 * 60 * 1000; // 0 to 60 minutes
    });

    // 1. Overdue = RED FLAG (Highest Priority)
    if (overdueTasks.length > 0) {
        flag = 'red';
        reason = `Red Flag: ${overdueTasks.length} tasks overdue`;
    }
    // 2. 6:00 PM (18:00) Rule -> RED FLAG
    else if (currentHour >= 18 && pendingTasks.length > 0) {
        flag = 'red';
        reason = `Red Flag: ${pendingTasks.length} tasks incomplete after 6 PM`;
    }
    // 3. Deadline < 1 Hour -> YELLOW FLAG
    else if (upcomingTasks.length > 0) {
        flag = 'yellow';
        reason = `Yellow Flag: ${upcomingTasks.length} tasks due in <1 hr`;
    }
    // 4. 4:00 PM (16:00) Rule -> YELLOW FLAG
    else if (currentHour >= 16 && pendingTasks.length > 0) {
        flag = 'yellow';
        reason = `Yellow Flag: ${pendingTasks.length} tasks pending (4 PM Warning)`;
    }

    return {
        flag,
        reason,
        metrics: {
            activeTaskCount: pendingTasks.length,
            overdueTaskCount: overdueTasks.length,
            upcomingDeadlineCount: 0
        }
    };
};

/**
 * Monitors real-time task changes for a specific user and automatically updates their performance flag
 * This creates a live listener that triggers performance recalculation on any task change
 */
export const monitorUserPerformance = (userId: string, onUpdate?: (flag: 'green' | 'yellow' | 'red', reason: string) => void): (() => void) => {
    if (!db) {
        console.log('monitorUserPerformance: db is null (demo mode)');
        return () => {};
    }

    const tasksRef = collection(db, 'myDayTasks');
    const q = query(tasksRef, where('userId', '==', userId));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
        const tasks: Task[] = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            tasks.push({
                ...data,
                id: doc.id,
                dueAt: data.dueAt?.toDate ? data.dueAt.toDate() : (data.dueAt ? new Date(data.dueAt) : undefined)
            } as Task);
        });

        // Calculate performance in real-time
        const { flag, reason, metrics } = calculateUserPerformance(tasks);

        // Update user document
        try {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
                performanceFlag: flag,
                flagReason: reason,
                activeTaskCount: metrics.activeTaskCount,
                overdueTaskCount: metrics.overdueTaskCount,
                upcomingDeadlineCount: metrics.upcomingDeadlineCount,
                flagUpdatedAt: new Date()
            });

            // Call callback if provided
            if (onUpdate) {
                onUpdate(flag, reason);
            }

            console.log(`Real-time performance update for user ${userId}: ${flag} - ${reason}`);
        } catch (error) {
            console.error(`Error updating real-time performance for user ${userId}:`, error);
        }
    }, (error) => {
        console.error(`Error monitoring performance for user ${userId}:`, error);
    });

    return unsubscribe;
};

/**
 * Sets up real-time performance monitoring for all active users
 * Returns cleanup function to unsubscribe all listeners
 */
export const monitorAllUsersPerformance = async (): Promise<(() => void)> => {
    if (!db) {
        console.log('monitorAllUsersPerformance: db is null (demo mode)');
        return () => {};
    }

    try {
        const usersRef = collection(db, 'users');
        const snapshot = await getDocs(usersRef);

        const unsubscribers: (() => void)[] = [];

        snapshot.forEach((userDoc) => {
            const unsubscribe = monitorUserPerformance(userDoc.id);
            unsubscribers.push(unsubscribe);
        });

        console.log(`Real-time performance monitoring started for ${unsubscribers.length} users`);

        // Return combined cleanup function
        return () => {
            unsubscribers.forEach(unsub => unsub());
            console.log('All performance monitors stopped');
        };
    } catch (error) {
        console.error('Error setting up global performance monitoring:', error);
        return () => {};
    }
};
export const updateUserPerformanceFlag = async (userId: string) => {
    try {
        if (!db) {
            console.log("Skipping updateUserPerformanceFlag because db is null (demo mode).");
            return { flag: 'green', reason: 'Demo Mode: All systems online' };
        }
        // 1. Fetch all tasks for this user
        const tasksRef = collection(db, 'myDayTasks');
        const q = query(tasksRef, where('userId', '==', userId));
        const snapshot = await getDocs(q);

        const tasks: Task[] = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            tasks.push({
                ...data,
                id: doc.id,
                // Ensure dueAt is a Date
                dueAt: data.dueAt?.toDate ? data.dueAt.toDate() : (data.dueAt ? new Date(data.dueAt) : undefined)
            } as Task);
        });

        // 2. Calculate performance
        const { flag, reason, metrics } = calculateUserPerformance(tasks);

        // 3. Get current user data to check for changes
        const userRef = doc(db, 'staffUsers', userId);
        const userSnap = await getDocs(query(collection(db, 'staffUsers'), where('__name__', '==', userId)));
        const userData = userSnap.docs[0]?.data() as User;

        // 4. Update user document
        await updateDoc(userRef, {
            performanceFlag: flag,
            flagReason: reason,
            activeTaskCount: metrics.activeTaskCount,
            overdueTaskCount: metrics.overdueTaskCount,
            upcomingDeadlineCount: metrics.upcomingDeadlineCount,
            flagUpdatedAt: new Date()
        });

        // 5. Escalation: Notify if flag turned RED
        if (flag === 'red' && userData?.performanceFlag !== 'red') {
            await notifyManagersOfEscalation(userData?.name || 'A team member', reason, userId);
        }

        return { flag, reason };
    } catch (error) {
        console.error(`Error updating performance for user ${userId}:`, error);
        throw error;
    }
};

/**
 * Notifies all managers and super admins about a performance escalation
 */
const notifyManagersOfEscalation = async (userName: string, reason: string, userId: string) => {
    try {
        if (!db) {
            console.log("Skipping notifyManagersOfEscalation because db is null (demo mode).");
            return;
        }
        const usersRef = collection(db, 'staffUsers');
        const q = query(usersRef, where('role', 'in', [UserRole.MANAGER, UserRole.SUPER_ADMIN]));
        const snapshot = await getDocs(q);

        const notifications = [];
        for (const managerDoc of snapshot.docs) {
            notifications.push(createNotification({
                title: 'Performance Escalation',
                message: `ALERT: ${userName} has been flagged RED: ${reason}`,
                user_id: managerDoc.id,
                entity_type: 'system',
                entity_id: userId,
                type: 'error'
            }));
        }
        await Promise.all(notifications);
        console.log(`Managers notified about ${userName}'s escalation`);
    } catch (error) {
        console.error('Error notifying managers:', error);
    }
};

/**
 * Runs a global update for all users (Maintenance)
 */
export const updateAllUsersPerformance = async () => {
    try {
        if (!db) {
            console.log("Skipping updateAllUsersPerformance because db is null (demo mode).");
            return;
        }
        const usersRef = collection(db, 'staffUsers');
        const snapshot = await getDocs(usersRef);

        const updates = [];
        for (const userDoc of snapshot.docs) {
            updates.push(updateUserPerformanceFlag(userDoc.id));
        }

        await Promise.all(updates);
        console.log('Global performance update completed');
    } catch (error) {
        console.error('Error in global performance update:', error);
    }
};
