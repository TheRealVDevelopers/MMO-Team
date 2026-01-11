import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, where, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy, Timestamp } from 'firebase/firestore';
import { Task, TaskStatus } from '../types';
import { createNotification } from '../services/liveDataService';
import { updateUserPerformanceFlag } from '../services/performanceService';

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
