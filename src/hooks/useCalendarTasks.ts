import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, where, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';

export interface CalendarTask {
    id: string;
    title: string;
    completed: boolean;
    time?: string;
    isRecurring?: boolean;
    type: 'meeting' | 'task' | 'reminder';
    date: string; // Format: 'yyyy-MM-dd'
    userId?: string; // Optional: for user-specific tasks
}

/**
 * Hook to manage calendar tasks with Firebase persistence
 * @param userId - Optional user ID to filter tasks by user
 */
export const useCalendarTasks = (userId?: string) => {
    const [tasks, setTasks] = useState<Record<string, CalendarTask[]>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        // If database is not available (demo mode), use localStorage fallback
        if (!db) {
            console.warn('Database not initialized. Using localStorage for calendar tasks.');
            const savedTasks = localStorage.getItem('calendar-tasks');
            if (savedTasks) {
                try {
                    setTasks(JSON.parse(savedTasks));
                } catch (e) {
                    console.error('Failed to parse saved tasks:', e);
                }
            }
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        const tasksRef = collection(db, 'calendarTasks');
        let q = userId 
            ? query(tasksRef, where('userId', '==', userId))
            : query(tasksRef);

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const tasksData: Record<string, CalendarTask[]> = {};
            
            snapshot.forEach((docSnap) => {
                const data = docSnap.data();
                const task: CalendarTask = {
                    id: docSnap.id,
                    title: data.title,
                    completed: data.completed || false,
                    time: data.time,
                    isRecurring: data.isRecurring,
                    type: data.type || 'task',
                    date: data.date,
                    userId: data.userId
                };

                if (!tasksData[task.date]) {
                    tasksData[task.date] = [];
                }
                tasksData[task.date].push(task);
            });

            setTasks(tasksData);
            setLoading(false);
        }, (err) => {
            console.error('Error fetching calendar tasks:', err);
            setError(err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userId]);

    const addTask = async (task: Omit<CalendarTask, 'id'>) => {
        try {
            if (!db) {
                // Fallback to localStorage
                const newTask: CalendarTask = { ...task, id: Date.now().toString() };
                setTasks(prev => {
                    const updated = {
                        ...prev,
                        [task.date]: [...(prev[task.date] || []), newTask]
                    };
                    localStorage.setItem('calendar-tasks', JSON.stringify(updated));
                    return updated;
                });
                return newTask.id;
            }

            const tasksRef = collection(db, 'calendarTasks');
            const docRef = await addDoc(tasksRef, {
                ...task,
                created_at: serverTimestamp()
            });
            return docRef.id;
        } catch (error) {
            console.error('Error adding calendar task:', error);
            throw error;
        }
    };

    const updateTask = async (taskId: string, updates: Partial<CalendarTask>) => {
        try {
            if (!db) {
                // Fallback to localStorage
                setTasks(prev => {
                    const updated = { ...prev };
                    Object.keys(updated).forEach(date => {
                        updated[date] = updated[date].map(t => 
                            t.id === taskId ? { ...t, ...updates } : t
                        );
                    });
                    localStorage.setItem('calendar-tasks', JSON.stringify(updated));
                    return updated;
                });
                return;
            }

            const taskRef = doc(db, 'calendarTasks', taskId);
            await updateDoc(taskRef, updates);
        } catch (error) {
            console.error('Error updating calendar task:', error);
            throw error;
        }
    };

    const deleteTask = async (taskId: string) => {
        try {
            if (!db) {
                // Fallback to localStorage
                setTasks(prev => {
                    const updated = { ...prev };
                    Object.keys(updated).forEach(date => {
                        updated[date] = updated[date].filter(t => t.id !== taskId);
                        if (updated[date].length === 0) {
                            delete updated[date];
                        }
                    });
                    localStorage.setItem('calendar-tasks', JSON.stringify(updated));
                    return updated;
                });
                return;
            }

            const taskRef = doc(db, 'calendarTasks', taskId);
            await deleteDoc(taskRef);
        } catch (error) {
            console.error('Error deleting calendar task:', error);
            throw error;
        }
    };

    const toggleTask = async (taskId: string) => {
        const task = Object.values(tasks)
            .flat()
            .find(t => t.id === taskId);
        
        if (task) {
            await updateTask(taskId, { completed: !task.completed });
        }
    };

    return {
        tasks,
        loading,
        error,
        addTask,
        updateTask,
        deleteTask,
        toggleTask
    };
};
