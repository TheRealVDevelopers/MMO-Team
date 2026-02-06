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

      // Option 1: Get tasks for a specific case
      if (options.caseId && options.organizationId) {
        const tasksRef = collection(
          db,
          FIRESTORE_COLLECTIONS.ORGANIZATIONS,
          options.organizationId,
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
      if (!db || !options.organizationId || !taskData.caseId) {
        throw new Error('Database, organization, or case not initialized');
      }

      try {
        const tasksRef = collection(
          db,
          FIRESTORE_COLLECTIONS.ORGANIZATIONS,
          options.organizationId,
          FIRESTORE_COLLECTIONS.CASES,
          taskData.caseId,
          FIRESTORE_COLLECTIONS.TASKS
        );

        const newTask: Omit<CaseTask, 'id'> = {
          ...taskData,
          status: TaskStatus.PENDING,
          createdAt: new Date(),
        };

        const docRef = await addDoc(tasksRef, {
          ...newTask,
          createdAt: serverTimestamp(),
        });

        // Create activity log
        await logActivity(options.organizationId, taskData.caseId, `Task created: ${taskData.type}`, taskData.assignedBy);

        // Send notification to assigned user
        await sendNotification(
          taskData.assignedTo,
          'New Task Assigned',
          `You have been assigned a ${taskData.type} task`,
          'info'
        );

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
      if (!db || !options.organizationId) throw new Error('Database or organization not initialized');

      try {
        const taskRef = doc(
          db,
          FIRESTORE_COLLECTIONS.ORGANIZATIONS,
          options.organizationId,
          FIRESTORE_COLLECTIONS.CASES,
          caseId,
          FIRESTORE_COLLECTIONS.TASKS,
          taskId
        );

        await updateDoc(taskRef, {
          status: TaskStatus.STARTED,
          startedAt: serverTimestamp(),
        });

        await logActivity(options.organizationId, caseId, 'Task started', 'system');
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
      if (!db || !options.organizationId) throw new Error('Database or organization not initialized');

      try {
        const taskRef = doc(
          db,
          FIRESTORE_COLLECTIONS.ORGANIZATIONS,
          options.organizationId,
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

        await logActivity(options.organizationId, caseId, 'Task completed', 'system');

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
      if (!db || !options.organizationId) throw new Error('Database or organization not initialized');

      try {
        const taskRef = doc(
          db,
          FIRESTORE_COLLECTIONS.ORGANIZATIONS,
          options.organizationId,
          FIRESTORE_COLLECTIONS.CASES,
          caseId,
          FIRESTORE_COLLECTIONS.TASKS,
          taskId
        );

        await updateDoc(taskRef, {
          status: TaskStatus.ACKNOWLEDGED,
          acknowledgedAt: serverTimestamp(),
        });

        await logActivity(options.organizationId, caseId, 'Task acknowledged', 'system');
      } catch (err: any) {
        console.error('Error acknowledging task:', err);
        throw err;
      }
    },
    [options.organizationId]
  );

  // Helper: Log activity
  const logActivity = async (orgId: string, caseId: string, action: string, userId: string) => {
    if (!db) return;

    try {
      const activitiesRef = collection(
        db,
        FIRESTORE_COLLECTIONS.ORGANIZATIONS,
        orgId,
        FIRESTORE_COLLECTIONS.CASES,
        caseId,
        FIRESTORE_COLLECTIONS.ACTIVITIES
      );

      await addDoc(activitiesRef, {
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
