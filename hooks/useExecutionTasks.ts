import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, Timestamp, updateDoc, doc, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { ExecutionTask, UserRole } from '../types';
import { createNotification } from './useNotifications';

interface UseExecutionTasksReturn {
    tasks: ExecutionTask[];
    loading: boolean;
    error: string | null;
    addTask: (task: Omit<ExecutionTask, 'id' | 'createdAt'>) => Promise<void>;
    updateTaskStatus: (taskId: string, status: ExecutionTask['status']) => Promise<void>;
    updateTask: (taskId: string, updates: Partial<ExecutionTask>) => Promise<void>;
}

export function useExecutionTasks(projectId?: string, userId?: string): UseExecutionTasksReturn {
    const [tasks, setTasks] = useState<ExecutionTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        setError(null);

        let q;
        const tasksRef = collection(db, 'executionTasks');

        if (projectId) {
            // Filter by project - client-side sort
            q = query(tasksRef, where('projectId', '==', projectId));
        } else if (userId) {
            // Filter by user - client-side sort
            console.log('[useExecutionTasks] Fetching tasks for user:', userId);
            q = query(tasksRef, where('assignedTo', '==', userId));
        } else {
            // Fetch all tasks if no filters (for manager view)
            q = query(tasksRef, orderBy('createdAt', 'desc'));
        }

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const fetchedTasks: ExecutionTask[] = snapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        projectId: data.projectId,
                        projectName: data.projectName,
                        assignedTo: data.assignedTo,
                        assigneeName: data.assigneeName,
                        missionType: data.missionType,
                        instructions: data.instructions,
                        deadline: data.deadline,
                        status: data.status,
                        createdAt: data.createdAt instanceof Timestamp
                            ? data.createdAt.toDate()
                            : new Date(data.createdAt),
                        ...data
                    } as ExecutionTask;
                });
                console.log('[useExecutionTasks] Tasks fetched:', fetchedTasks.length, 'for user:', userId || 'ALL');

                // Sort client-side to ensure consistent ordering regardless of query index availability
                fetchedTasks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

                setTasks(fetchedTasks);
                setLoading(false);
            },
            (err) => {
                console.error('Error fetching execution tasks:', err);
                setError('Failed to load tasks');
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [projectId, userId]);

    const addTask = async (task: Omit<ExecutionTask, 'id' | 'createdAt'>) => {
        try {
            const tasksRef = collection(db, 'executionTasks');
            const docRef = await addDoc(tasksRef, {
                ...task,
                is_demo: false,
                createdAt: serverTimestamp()
            });
            console.log('Task added successfully');

            // Notify all admins and sales managers about the new task
            const usersRef = collection(db, 'users');
            const usersSnapshot = await getDocs(usersRef);

            const adminAndManagerIds: string[] = [];
            usersSnapshot.forEach(doc => {
                const userData = doc.data();
                if (userData.role === UserRole.SUPER_ADMIN ||
                    userData.role === UserRole.SALES_GENERAL_MANAGER ||
                    userData.role === 'admin' ||
                    userData.role === 'Admin') {
                    adminAndManagerIds.push(doc.id);
                }
            });

            // Send notification to each admin/manager
            for (const userId of adminAndManagerIds) {
                await createNotification({
                    user_id: userId,
                    title: 'New Task Request from Execution Team',
                    message: `Execution Team assigned a ${task.missionType} task: "${task.instructions}" to ${task.assigneeName} for ${task.projectName}`,
                    type: 'task',
                    context_id: docRef.id,
                    context_type: 'executionTask'
                });
            }

            console.log(`Notified ${adminAndManagerIds.length} admins/managers about new task`);
        } catch (err) {
            console.error('Error adding task:', err);
            throw err;
        }
    };

    const updateTaskStatus = async (taskId: string, status: ExecutionTask['status']) => {
        try {
            const taskRef = doc(db, 'executionTasks', taskId);
            await updateDoc(taskRef, { status });
            console.log('Task status updated');
        } catch (err) {
            console.error('Error updating task status:', err);
            throw err;
        }
    };

    const updateTask = async (taskId: string, updates: Partial<ExecutionTask>) => {
        try {
            const taskRef = doc(db, 'executionTasks', taskId);
            await updateDoc(taskRef, updates);
        } catch (err) {
            console.error('Error updating task:', err);
            throw err;
        }
    };

    return { tasks, loading, error, addTask, updateTaskStatus, updateTask };
}

export default useExecutionTasks;
