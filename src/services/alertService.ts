import { db } from '../firebase';
import { collection, addDoc, query, where, getDocs, updateDoc, doc, setDoc, getDoc } from 'firebase/firestore';
import { CriticalAlert } from '../hooks/useCriticalAlerts';
import { StoredRedFlag } from '../types';

export const alertService = {
    /**
     * Logs critical alerts (Red Flags) to the database.
     * Only logs alerts that haven't been logged yet for the specific task and type.
     */
    logRedFlags: async (alerts: CriticalAlert[]) => {
        if (!db) return;

        // Filter only critical alerts (Red Flags)
        const criticalAlerts = alerts.filter(a => a.severity === 'critical');

        for (const alert of criticalAlerts) {
            try {
                if (!alert.taskId || !alert.type) {
                    console.warn('[alertService] Skipping red flag log due to missing taskId or type', alert);
                    continue;
                }

                // Check if this specific red flag has already been logged
                const redFlagsRef = collection(db, 'redFlags');

                const q = query(
                    redFlagsRef,
                    where('taskId', '==', alert.taskId),
                    where('type', '==', alert.type),
                    where('resolved', '==', false) // Only check active ones
                );

                const snapshot = await getDocs(q);

                if (snapshot.empty) {
                    // Not found, create new record
                    const newRedFlag: Omit<StoredRedFlag, 'id'> = {
                        taskId: alert.taskId || 'unknown',
                        taskTitle: alert.title || 'Unknown Task',
                        userId: alert.userId || 'unknown',
                        userName: alert.userName || 'Unknown User',
                        deadline: alert.deadline || new Date(),
                        triggeredAt: new Date(),
                        hoursOverdue: alert.hoursOverdue || 0,
                        resolved: false,
                        severity: 'critical',
                        type: alert.type
                    };

                    await addDoc(redFlagsRef, newRedFlag);
                    console.log(`[Red Flag Logged] ${alert.title}`);
                }
            } catch (error) {
                console.error('Error logging red flag:', error);
            }
        }
    },

    /**
     * Dismisses (deletes/resolves) an alert.
     * If it's a stored Red Flag, marks it as resolved.
     * If it's a transient alert, we might want to store a "dismissed" record (optional, based on requirement).
     * For now, we'll implement marking Stored Red Flags as resolved.
     */
    dismissAlert: async (alert: CriticalAlert, userId: string) => {
        if (!alert.taskId || !alert.type) return;

        const redFlagsRef = collection(db, 'redFlags');
        const q = query(
            redFlagsRef,
            where('taskId', '==', alert.taskId),
            where('type', '==', alert.type),
            where('resolved', '==', false)
        );

        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            // Resolve existing DB entry
            snapshot.forEach(async (docSnap) => {
                const docRef = doc(db, 'redFlags', docSnap.id);
                await updateDoc(docRef, {
                    resolved: true,
                    resolvedAt: new Date(),
                    resolvedBy: userId
                });
            });
        } else {
            // If it wasn't in DB (maybe it wasn't critical enough or sync delay), 
            // we should probably store a "Dismissed" status so it doesn't show up again.
            // For now, let's store it as a "Resolved Red Flag" immediately so it's ignored.
            const newDismissedFlag: Omit<StoredRedFlag, 'id'> = {
                taskId: alert.taskId || 'unknown',
                taskTitle: alert.title || 'Unknown Task',
                userId: alert.userId || 'unknown',
                userName: alert.userName || 'Unknown User',
                deadline: alert.deadline || new Date(),
                triggeredAt: new Date(),
                hoursOverdue: alert.hoursOverdue || 0,
                resolved: true, // Immediately resolved/dismissed
                resolvedAt: new Date(),
                resolvedBy: userId,
                severity: alert.severity,
                type: alert.type
            };
            await addDoc(redFlagsRef, newDismissedFlag);
        }
    },

    /**
     * Fetches the set of resolved (dismissed) task IDs to filter them out of the UI.
     */
    getDismissedAlerts: async (): Promise<Set<string>> => {
        const redFlagsRef = collection(db, 'redFlags');
        const q = query(redFlagsRef, where('resolved', '==', true));
        const snapshot = await getDocs(q);

        const dismissedIds = new Set<string>();
        snapshot.forEach(doc => {
            const data = doc.data() as StoredRedFlag;
            // We assume we want to ignore this specific TYPE of alert for this TASK
            // So we can generate a key: `${data.taskId}-${data.type}`
            dismissedIds.add(`${data.taskId}-${data.type}`);
        });
        return dismissedIds;
    },

    /**
     * Real-time listener version of getDismissedAlerts could be added here if needed,
     * but for now we'll just fetch once or on refresh.
     */
};
