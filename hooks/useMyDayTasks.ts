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

        // If database is not available (demo mode), return empty
        if (!db) {
            console.warn('Database not initialized. Tasks will not persist.');
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

    const addTaskWrapper = async (taskData: Omit<Task, 'id'>) => {
        return addTask(taskData, userId || 'system');
    };

    return { tasks, loading, error, addTask: addTaskWrapper };
};

export const addTask = async (taskData: Omit<Task, 'id'>, createdBy: string) => {
    try {
        const tasksRef = collection(db, 'myDayTasks');

        // Clean data of undefined values which Firestore doesn't support
        const cleanData = Object.entries({
            ...taskData,
            dueAt: taskData.deadline ? new Date(taskData.deadline) : null,
            createdBy,
            created_at: serverTimestamp(),
            createdAt: new Date(),
        }).reduce((acc, [key, value]) => {
            if (value !== undefined) acc[key] = value;
            return acc;
        }, {} as any);

        const docRef = await addDoc(tasksRef, cleanData);

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
        if (updates.status === TaskStatus.ONGOING && !updates.startedAt) {
            finalUpdates.startedAt = new Date();
        }
        if (updates.status === TaskStatus.ACKNOWLEDGED && !updates.acknowledgedAt) {
            finalUpdates.acknowledgedAt = new Date();
        }
        if (updates.deadline) {
            finalUpdates.dueAt = new Date(updates.deadline);
        }

        await updateDoc(taskRef, finalUpdates);

        // Logic for Task Completion (Notifications & Logging)
        if (updates.status === TaskStatus.COMPLETED) {
            try {
                const { getDoc } = await import('firebase/firestore');
                const taskSnap = await getDoc(taskRef);
                if (taskSnap.exists()) {
                    const taskData = taskSnap.data() as Task;

                    // Get case data if task is linked to a case
                    let caseData: any = null;
                    if (taskData.caseId) {
                        const caseRef = doc(db, 'cases', taskData.caseId);
                        const caseSnap = await getDoc(caseRef);
                        if (caseSnap.exists()) {
                            caseData = caseSnap.data();
                        }
                    }

                    // 1. Notify the task creator (createdBy) - MANDATORY
                    if (taskData.createdBy && taskData.createdBy !== taskData.userId) {
                        await createNotification({
                            title: 'Task Completed',
                            message: `Task "${taskData.title}" has been completed${caseData ? ` for ${caseData.projectName}` : ''} by ${taskData.assignedToName || 'team member'}`,
                            user_id: taskData.createdBy,
                            entity_type: taskData.caseId ? 'project' : 'task',
                            entity_id: taskData.caseId || taskId,
                            type: 'success'
                        }).catch(e => console.error("Creator notification failed", e));
                    }

                    // 2. Notify the project head - MANDATORY if project exists
                    if (caseData && caseData.projectHead && caseData.projectHead !== taskData.userId && caseData.projectHead !== taskData.createdBy) {
                        await createNotification({
                            title: `${taskData.taskType || 'Task'} Completed`,
                            message: `${taskData.taskType || 'Task'} completed for ${caseData.projectName || 'project'}: "${taskData.title}"`,
                            user_id: caseData.projectHead,
                            entity_type: 'project',
                            entity_id: taskData.caseId!,
                            type: 'success'
                        }).catch(e => console.error("Project head notification failed", e));
                    }

                    // 3. Notify additional users from notifyOnComplete array
                    if (taskData.notifyOnComplete && taskData.notifyOnComplete.length > 0) {
                        for (const userId of taskData.notifyOnComplete) {
                            if (userId !== taskData.userId && userId !== taskData.createdBy && userId !== caseData?.projectHead) {
                                await createNotification({
                                    title: 'Task Update',
                                    message: `Task "${taskData.title}" has been completed`,
                                    user_id: userId,
                                    entity_type: taskData.caseId ? 'project' : 'task',
                                    entity_id: taskData.caseId || taskId,
                                    type: 'info'
                                }).catch(e => console.error("Additional notification failed", e));
                            }
                        }
                    }

                    // 4. Notify the requester (Sales Member) - Legacy support
                    if (taskData.requesterId && taskData.requesterId !== taskData.userId && taskData.requesterId !== taskData.createdBy) {
                        await createNotification({
                            title: 'Mission Task Completed',
                            message: `Strategic Update: The task "${taskData.title}" has been completed by the specialist. You can now update the client.`,
                            user_id: taskData.requesterId,
                            entity_type: 'task',
                            entity_id: taskId,
                            type: 'success'
                        }).catch(e => console.error("Notification failed", e));
                    }

                    // 5. Log to Case History (unified architecture)
                    if (taskData.caseId) {
                        const caseRef = doc(db, 'cases', taskData.caseId);
                        const caseSnap = await getDoc(caseRef);
                        if (caseSnap.exists()) {
                            const caseData = caseSnap.data();
                            await updateDoc(caseRef, {
                                history: [
                                    ...(caseData.history || []),
                                    {
                                        action: `${taskData.taskType || 'Task'} Completed`,
                                        user: taskData.assignedToName || 'Team Member',
                                        timestamp: new Date(),
                                        notes: `Task "${taskData.title}" completed${taskData.relatedDocumentId ? ` (Related: ${taskData.relatedDocumentId})` : ''}`
                                    }
                                ],
                                updatedAt: new Date()
                            }).catch(e => console.error("Case history log failed", e));
                        }
                    }

                    // 6. Log to Lead/Project History (Legacy support)
                    else if (taskData.contextId && taskData.contextType) {
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
                            }).catch(e => console.error("History log failed", e));
                        }

                        // 7. Log to Global Activity Registry
                        await logActivity({
                            description: `MISSION COMPLETE: Task "${taskData.title}" finished. Registry synchronized.`,
                            team: UserRole.SUPER_ADMIN,
                            userId: taskData.userId,
                            status: ActivityStatus.DONE,
                            projectId: taskData.contextId
                        }).catch(e => console.error("Activity log failed", e));
                    }
                }
            } catch (err) {
                console.error("Side effect error in task completion:", err);
            }
        }

        // Get task to know whose flag to update
        try {
            const { getDoc } = await import('firebase/firestore');
            const taskSnap = await getDoc(taskRef);
            if (taskSnap.exists()) {
                const userId = taskSnap.data().userId;
                await updateUserPerformanceFlag(userId);
            }
        } catch (err) {
            console.error("Performance flag update failed:", err);
        }
    } catch (error) {
        console.error('Error updating task:', error);
        throw error;
    }
};

export const startTask = async (taskId: string) => {
    try {
        const taskRef = doc(db, 'myDayTasks', taskId);
        await updateDoc(taskRef, {
            status: TaskStatus.IN_PROGRESS,
            startedAt: new Date(),
        });
        // Log start activity if needed
    } catch (error) {
        console.error('Error starting task:', error);
        throw error;
    }
};

export const completeTask = async (taskId: string) => {
    try {
        const taskRef = doc(db, 'myDayTasks', taskId);

        // Use updateTask to handle all side effects (notifications, history, etc.)
        await updateTask(taskId, {
            status: TaskStatus.COMPLETED,
            completedAt: new Date()
        });
    } catch (error) {
        console.error('Error completing task:', error);
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
