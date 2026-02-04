import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, Timestamp, updateDoc, doc, where } from 'firebase/firestore';
import { db } from '../firebase';
import { ExecutionTask } from '../types';

interface UseExecutionTasksReturn {
    tasks: ExecutionTask[];
    loading: boolean;
    error: string | null;
    addTask: (task: Omit<ExecutionTask, 'id' | 'createdAt'>) => Promise<void>;
    updateTaskStatus: (taskId: string, status: ExecutionTask['status']) => Promise<void>;
    updateTask: (taskId: string, updates: Partial<ExecutionTask>) => Promise<void>;
}

export function useExecutionTasks(projectId?: string): UseExecutionTasksReturn {
    const [tasks, setTasks] = useState<ExecutionTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        setError(null);

        let q;
        const tasksRef = collection(db, 'executionTasks');

        if (projectId) {
            q = query(tasksRef, where('projectId', '==', projectId), orderBy('createdAt', 'desc'));
        } else {
            // Fetch all tasks if no projectId (for manager view)
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
    }, [projectId]);

    const addTask = async (task: Omit<ExecutionTask, 'id' | 'createdAt'>) => {
        try {
            const tasksRef = collection(db, 'executionTasks');
            await addDoc(tasksRef, {
                ...task,
                is_demo: false,
                createdAt: serverTimestamp()
            });
            console.log('Task added successfully');
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
