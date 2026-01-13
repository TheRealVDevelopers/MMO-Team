import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, where, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy, Timestamp } from 'firebase/firestore';
import { Task, TaskStatus } from '../types';
import { createNotification, logActivity } from '../services/liveDataService';
import { updateUserPerformanceFlag } from '../services/performanceService';
import { UserRole, ActivityStatus } from '../types';

// Firestore Task Type
type FirestoreTask = Omit<Task, 'id' | 'date'> & {
    date: string; // Stored as string YYYY-MM-DD
    created_at?: Timestamp;
};

export const useMyDayTasks = (userId?: string) => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!userId) {
            setTasks([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        // Fetch tasks assigned TO this user
        const tasksRef = collection(db, 'myDayTasks');
        // Fix: Querying by userId (assigned user). 
        // We'll sort by priority or date client-side if needed to avoid complex indexes for now, 
        // or add simple index on userId. A simple where('userId', '==', userId) is safe.
        const q = query(tasksRef, where('userId', '==', userId));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const tasksData: Task[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data() as FirestoreTask;
                // Add id
                tasksData.push({
                    ...data,
                    id: doc.id,
                } as Task);
            });

            // Client side sorting: Pending Acceptance first, then incomplete, then date
            tasksData.sort((a, b) => {
                // Logic: 
                // 1. Pending Acceptance top
                // 2. Incomplete top
                // 3. Priority (High > Medium > Low)

                // For simplicity, just sort by creation if available or just basic
                return 0;
            });

            setTasks(tasksData);
            setLoading(false);
        }, (err) => {
            console.error('Error fetching tasks:', err);
            setError(err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userId]);

    return { tasks, loading, error };
};

export const addTask = async (taskData: Omit<Task, 'id'>, createdBy: string) => {
    try {
        const tasksRef = collection(db, 'myDayTasks');
        const docRef = await addDoc(tasksRef, {
            ...taskData,
            dueAt: taskData.deadline ? new Date(taskData.deadline) : null,
            createdBy,
            created_at: serverTimestamp(),
            createdAt: new Date(),
        });

        // Trigger performance update
        await updateUserPerformanceFlag(taskData.userId);

        // Notify if assigned to someone else
        if (taskData.userId !== createdBy) {
            await createNotification({
                title: 'New Task Assigned',
                message: `You have been assigned a new task: "${taskData.title}"`,
                user_id: taskData.userId,
                entity_type: 'task',
                entity_id: docRef.id,
                type: 'info'
            });
        }

        return docRef.id;
    } catch (error) {
        console.error('Error adding task:', error);
        throw error;
    }
};

export const updateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
        const taskRef = doc(db, 'myDayTasks', taskId);

        // Prepare updates
        const finalUpdates = { ...updates };
        if (updates.status === TaskStatus.COMPLETED) {
            finalUpdates.completedAt = new Date();
        }
        if (updates.deadline) {
            finalUpdates.dueAt = new Date(updates.deadline);
        }

        await updateDoc(taskRef, finalUpdates);

        // Logic for Task Completion (Notifications & Logging)
        if (updates.status === TaskStatus.COMPLETED) {
            const { getDoc } = await import('firebase/firestore');
            const taskSnap = await getDoc(taskRef);
            if (taskSnap.exists()) {
                const taskData = taskSnap.data() as Task;

                // 1. Notify the requester (Sales Member)
                if (taskData.requesterId) {
                    await createNotification({
                        title: 'Mission Task Completed',
                        message: `Strategic Update: The task "${taskData.title}" has been completed by the specialist. You can now update the client.`,
                        user_id: taskData.requesterId,
                        entity_type: 'task',
                        entity_id: taskId,
                        type: 'success'
                    });
                }

                // 2. Log to Lead/Project History
                if (taskData.contextId && taskData.contextType) {
                    const contextRef = doc(db, taskData.contextType === 'lead' ? 'leads' : 'projects', taskData.contextId);
                    const contextSnap = await getDoc(contextRef);
                    if (contextSnap.exists()) {
                        const contextData = contextSnap.data();
                        await updateDoc(contextRef, {
                            history: [
                                ...(contextData.history || []),
                                {
                                    action: 'Mission Task Completed',
                                    user: 'Specialist System',
                                    timestamp: new Date(),
                                    notes: `Task "${taskData.title}" completed. Audit trail updated.`
                                }
                            ]
                        });
                    }

                    // 3. Log to Global Activity Registry
                    await logActivity({
                        description: `MISSION COMPLETE: Task "${taskData.title}" finished. Registry synchronized.`,
                        team: UserRole.SUPER_ADMIN, // Logged as system/admin event
                        userId: taskData.userId,
                        status: ActivityStatus.DONE,
                        projectId: taskData.contextId
                    });
                }
            }
        }

        // Get task to know whose flag to update
        const { getDoc } = await import('firebase/firestore');
        const taskSnap = await getDoc(taskRef);
        if (taskSnap.exists()) {
            const userId = taskSnap.data().userId;
            await updateUserPerformanceFlag(userId);
        }
    } catch (error) {
        console.error('Error updating task:', error);
        throw error;
    }
};

export const deleteTask = async (taskId: string) => {
    try {
        const taskRef = doc(db, 'myDayTasks', taskId);
        await deleteDoc(taskRef);
    } catch (error) {
        console.error('Error deleting task:', error);
        throw error;
    }
};
