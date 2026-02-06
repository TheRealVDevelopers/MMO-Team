import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, collectionGroup, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { CaseTask, UserRole, TaskStatus } from '../types';
import { FIRESTORE_COLLECTIONS } from '../constants';

/**
 * useTeamTasks - Fetches tasks from cases/{caseId}/tasks collection
 * Now uses collectionGroup to query across all cases
 * @param role - Optional role filter for team-specific tasks
 */
export const useTeamTasks = (role?: UserRole) => {
    const [tasks, setTasks] = useState<CaseTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!db) {
            setLoading(false);
            return;
        }

        // Use collectionGroup to query tasks across all cases
        // Note: collectionGroup queries with orderBy require a composite index
        // For now, we'll query without orderBy and sort client-side
        const tasksQuery = query(
            collectionGroup(db, FIRESTORE_COLLECTIONS.TASKS)
        );

        const unsubscribe = onSnapshot(tasksQuery, (snapshot) => {
            const tasksData: CaseTask[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                const task: CaseTask = {
                    id: doc.id,
                    caseId: data.caseId,
                    type: data.type,
                    assignedTo: data.assignedTo,
                    assignedBy: data.assignedBy,
                    status: data.status,
                    createdAt: data.createdAt?.toDate() || new Date(),
                    startedAt: data.startedAt?.toDate(),
                    completedAt: data.completedAt?.toDate(),
                    acknowledgedAt: data.acknowledgedAt?.toDate(),
                    deadline: data.deadline?.toDate(),
                    kmTravelled: data.kmTravelled,
                    notes: data.notes,
                };

                // Filter: exclude self-assigned tasks (user's own tasks should only be visible to them)
                // Include task if assignedTo !== assignedBy (assigned by someone else)
                if (task.assignedTo !== task.assignedBy) {
                    tasksData.push(task);
                }
            });

            // Client-side sorting by createdAt descending
            tasksData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

            setTasks(tasksData);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching team tasks:", err);
            setError(err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [role]);

    return { tasks, loading, error };
};
