import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  serverTimestamp,
  Timestamp,
  collectionGroup,
  getDocs,
} from 'firebase/firestore';
import { db } from '../firebase';
import { CaseTask, TaskType, TaskStatus } from '../types';
import { FIRESTORE_COLLECTIONS } from '../constants';

interface UseCaseTasksOptions {
  organizationId?: string;
  caseId?: string;
  assignedTo?: string; // Filter by assigned user (for "My Day" view)
  status?: TaskStatus | TaskStatus[];
  type?: TaskType;
}

export const useCaseTasks = (options: UseCaseTasksOptions = {}) => {
  const [tasks, setTasks] = useState<CaseTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Real-time listener for tasks
  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }

    try {
      let q;

      // Option 1: Get tasks for a specific case (FLAT STRUCTURE)
      if (options.caseId) {
        const tasksRef = collection(
          db,
          FIRESTORE_COLLECTIONS.CASES,
          options.caseId,
          FIRESTORE_COLLECTIONS.TASKS
        );
        q = query(tasksRef, orderBy('createdAt', 'desc'));
      }
      // Option 2: Get tasks for a specific user (My Day view)
      else if (options.assignedTo) {
        // Use collection group query to get tasks across all cases
        const tasksGroupRef = collectionGroup(db, FIRESTORE_COLLECTIONS.TASKS);
        q = query(
          tasksGroupRef,
          where('assignedTo', '==', options.assignedTo),
          orderBy('createdAt', 'desc')
        );
      }
      // Option 3: No specific filter - don't set up listener
      else {
        setLoading(false);
        return;
      }

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          let tasksData = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              ...data,
              id: doc.id,
              createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
              startedAt: data.startedAt instanceof Timestamp ? data.startedAt.toDate() : data.startedAt ? new Date(data.startedAt) : undefined,
              completedAt: data.completedAt instanceof Timestamp ? data.completedAt.toDate() : data.completedAt ? new Date(data.completedAt) : undefined,
              acknowledgedAt: data.acknowledgedAt instanceof Timestamp ? data.acknowledgedAt.toDate() : data.acknowledgedAt ? new Date(data.acknowledgedAt) : undefined,
            } as CaseTask;
          });

          // Client-side filtering for status
          if (options.status) {
            const statuses = Array.isArray(options.status) ? options.status : [options.status];
            tasksData = tasksData.filter((t) => statuses.includes(t.status));
          }

          // Client-side filtering for type
          if (options.type) {
            tasksData = tasksData.filter((t) => t.type === options.type);
          }

          setTasks(tasksData);
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error('Error fetching tasks:', err);
          setError(err.message);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err: any) {
      console.error('Error setting up tasks listener:', err);
      setError(err.message);
      setLoading(false);
    }
  }, [options.organizationId, options.caseId, options.assignedTo, options.type, JSON.stringify(options.status)]);

  // Create new task
  const createTask = useCallback(
    async (taskData: Omit<CaseTask, 'id' | 'createdAt'>) => {
      if (!db || !taskData.caseId) {
        throw new Error('Database or case not initialized');
      }

      try {
        // FLAT STRUCTURE: cases/{caseId}/tasks
        const tasksRef = collection(
          db,
          FIRESTORE_COLLECTIONS.CASES,
          taskData.caseId,
          FIRESTORE_COLLECTIONS.TASKS
        );

        const newTask: Omit<CaseTask, 'id'> = {
          ...taskData,
          status: TaskStatus.PENDING,
          createdAt: new Date(),
        };

        // Remove undefined fields to prevent Firestore errors
        const cleanTask = Object.fromEntries(
          Object.entries(newTask).filter(([_, v]) => v !== undefined)
        );

        const docRef = await addDoc(tasksRef, {
          ...cleanTask,
          createdAt: serverTimestamp(),
        });

        // Create activity log
        await logActivity(taskData.caseId, `Task created: ${taskData.type}`, taskData.assignedBy);

        // Send notification to assigned user (only if assignedTo is specified)
        if (taskData.assignedTo && taskData.assignedTo.trim()) {
          await sendNotification(
            taskData.assignedTo,
            'New Task Assigned',
            `You have been assigned a ${taskData.type} task`,
            'info'
          );
        }

        return docRef.id;
      } catch (err: any) {
        console.error('Error creating task:', err);
        throw err;
      }
    },
    [options.organizationId]
  );

  // Start task
  const startTask = useCallback(
    async (taskId: string, caseId: string) => {
      if (!db) throw new Error('Database not initialized');

      try {
        // FLAT STRUCTURE: cases/{caseId}/tasks/{taskId}
        const taskRef = doc(
          db,
          FIRESTORE_COLLECTIONS.CASES,
          caseId,
          FIRESTORE_COLLECTIONS.TASKS,
          taskId
        );

        await updateDoc(taskRef, {
          status: TaskStatus.STARTED,
          startedAt: serverTimestamp(),
        });

        await logActivity(caseId, 'Task started', 'system');
      } catch (err: any) {
        console.error('Error starting task:', err);
        throw err;
      }
    },
    [options.organizationId]
  );

  // Complete task
  const completeTask = useCallback(
    async (taskId: string, caseId: string, kmTravelled?: number) => {
      if (!db) throw new Error('Database not initialized');

      try {
        // FLAT STRUCTURE: cases/{caseId}/tasks/{taskId}
        const taskRef = doc(
          db,
          FIRESTORE_COLLECTIONS.CASES,
          caseId,
          FIRESTORE_COLLECTIONS.TASKS,
          taskId
        );

        await updateDoc(taskRef, {
          status: TaskStatus.COMPLETED,
          completedAt: serverTimestamp(),
          ...(kmTravelled && { kmTravelled }),
        });

        await logActivity(caseId, 'Task completed', 'system');

        // Send notification to task creator
        const task = tasks.find((t) => t.id === taskId);
        if (task) {
          await sendNotification(
            task.assignedBy,
            'Task Completed',
            `${task.type} task has been completed`,
            'success'
          );
        }
      } catch (err: any) {
        console.error('Error completing task:', err);
        throw err;
      }
    },
    [options.organizationId, tasks]
  );

  // Acknowledge task
  const acknowledgeTask = useCallback(
    async (taskId: string, caseId: string) => {
      if (!db) throw new Error('Database not initialized');

      try {
        // FLAT STRUCTURE: cases/{caseId}/tasks/{taskId}
        const taskRef = doc(
          db,
          FIRESTORE_COLLECTIONS.CASES,
          caseId,
          FIRESTORE_COLLECTIONS.TASKS,
          taskId
        );

        await updateDoc(taskRef, {
          status: TaskStatus.ACKNOWLEDGED,
          acknowledgedAt: serverTimestamp(),
        });

        await logActivity(caseId, 'Task acknowledged', 'system');
      } catch (err: any) {
        console.error('Error acknowledging task:', err);
        throw err;
      }
    },
    [options.organizationId]
  );

  // Helper: Log activity (FLAT STRUCTURE)
  const logActivity = async (caseId: string, action: string, userId: string) => {
    if (!db) return;

    try {
      // FLAT STRUCTURE: cases/{caseId}/activities
      const activitiesRef = collection(
        db,
        FIRESTORE_COLLECTIONS.CASES,
        caseId,
        FIRESTORE_COLLECTIONS.ACTIVITIES
      );

      await addDoc(activitiesRef, {
        caseId,
        action,
        by: userId,
        timestamp: serverTimestamp(),
      });
    } catch (err) {
      console.error('Error logging activity:', err);
    }
  };

  // Helper: Send notification
  const sendNotification = async (userId: string, title: string, message: string, type: 'info' | 'success' | 'warning' | 'error') => {
    if (!db) return;
    
    // Validate userId before attempting to create notification
    if (!userId || !userId.trim()) {
      console.warn('Cannot send notification: userId is empty');
      return;
    }

    try {
      const notificationsRef = collection(
        db,
        FIRESTORE_COLLECTIONS.STAFF_USERS,
        userId,
        FIRESTORE_COLLECTIONS.NOTIFICATIONS
      );

      await addDoc(notificationsRef, {
        userId,
        title,
        message,
        type,
        read: false,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('Error sending notification:', err);
    }
  };

  return {
    tasks,
    loading,
    error,
    createTask,
    startTask,
    completeTask,
    acknowledgeTask,
  };
};

// Extended task with case display info (same shape as Work Queue)
export interface TaskWithCase extends CaseTask {
  projectName?: string;
  clientName?: string;
}

/**
 * Hook: tasks assigned to a user with case details (projectName, clientName).
 * Single source of truth for both Work Queue and My Day Execution Stream.
 */
export const useAssignedTasksWithCases = (userId: string | undefined) => {
  const [tasks, setTasks] = useState<TaskWithCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!db || !userId) {
      setLoading(false);
      return;
    }

    const q = query(
      collectionGroup(db, FIRESTORE_COLLECTIONS.TASKS),
      where('assignedTo', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const tasksData: TaskWithCase[] = [];
        const caseIds = new Set<string>();

        for (const taskDoc of snapshot.docs) {
          const data = taskDoc.data();
          // Path: cases/{caseId}/tasks/{taskId}
          const pathParts = taskDoc.ref.path.split('/');
          const caseId = pathParts[1] ?? data.caseId;
          if (caseId) caseIds.add(caseId);

          const task: TaskWithCase = {
            ...data,
            id: taskDoc.id,
            caseId: caseId || data.caseId,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
            startedAt: data.startedAt instanceof Timestamp ? data.startedAt.toDate() : data.startedAt ? new Date(data.startedAt) : undefined,
            completedAt: data.completedAt instanceof Timestamp ? data.completedAt.toDate() : data.completedAt ? new Date(data.completedAt) : undefined,
            deadline: data.deadline instanceof Timestamp ? data.deadline.toDate() : data.deadline ? new Date(data.deadline) : undefined,
          } as TaskWithCase;
          tasksData.push(task);
        }

        // Batch fetch case details for projectName, clientName
        const caseMap: Record<string, { title?: string; clientName?: string }> = {};
        await Promise.all(
          Array.from(caseIds).map(async (cid) => {
            try {
              const caseSnap = await getDoc(doc(db, FIRESTORE_COLLECTIONS.CASES, cid));
              if (caseSnap.exists()) {
                const d = caseSnap.data();
                caseMap[cid] = { title: d.title, clientName: d.clientName };
              }
            } catch (_) {}
          })
        );

        tasksData.forEach((t) => {
          const c = caseMap[t.caseId];
          if (c) {
            t.projectName = c.title;
            t.clientName = c.clientName;
          }
        });

        setTasks(tasksData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching assigned tasks:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  return { tasks, loading, error };
};
