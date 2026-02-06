import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { Task, UserRole } from '../types';

export const useTeamTasks = (role?: UserRole) => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!db) {
            setLoading(false);
            return;
        }
        const tasksRef = collection(db, 'myDayTasks');
        let q = query(tasksRef, orderBy('created_at', 'desc'));

        if (role) {
            // This assumes we have a team/role field in tasks, if not, we might need to filter client-side
            // based on matching userId's role. For now, let's fetch all and the component can filter.
            // Or if we have a specific 'team' field:
            // q = query(tasksRef, where('team', '==', role), orderBy('created_at', 'desc'));
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const tasksData: Task[] = [];
            snapshot.forEach((doc) => {
                const task = { id: doc.id, ...doc.data() } as Task;

                // User Requirement: "If any of the team member adds a task by themselves, that should be reflected to them only. That should not be reflected to the general manager or the admin"
                // Filtering out self-assigned tasks from the team view
                if (task.userId !== task.createdBy) {
                    tasksData.push(task);
                }
            });
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
