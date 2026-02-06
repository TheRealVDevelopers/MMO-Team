import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { DailyUpdate } from '../types';

interface UseDailyUpdatesReturn {
    updates: DailyUpdate[];
    loading: boolean;
    error: string | null;
    addUpdate: (update: Omit<DailyUpdate, 'id' | 'createdAt'>) => Promise<void>;
}

export function useDailyUpdates(projectId: string): UseDailyUpdatesReturn {
    const [updates, setUpdates] = useState<DailyUpdate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!projectId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        // Query daily updates for this project, ordered by date descending
        const updatesRef = collection(db, 'projects', projectId, 'dailyUpdates');
        const q = query(updatesRef, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const fetchedUpdates: DailyUpdate[] = snapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        projectId: data.projectId || projectId,
                        date: data.date,
                        workDescription: data.workDescription || '',
                        weather: data.weather || 'Sunny',
                        manpowerCount: data.manpowerCount || 0,
                        photos: data.photos || [],
                        createdBy: data.createdBy || '',
                        createdAt: data.createdAt instanceof Timestamp
                            ? data.createdAt.toDate()
                            : new Date(data.createdAt),
                        completionPercent: data.completionPercent || 0,
                        blocker: data.blocker || ''
                    };
                });
                setUpdates(fetchedUpdates);
                setLoading(false);
            },
            (err) => {
                console.error('Error fetching daily updates:', err);
                setError('Failed to load daily updates');
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [projectId]);

    const addUpdate = async (update: Omit<DailyUpdate, 'id' | 'createdAt'>) => {
        try {
            const updatesRef = collection(db, 'projects', projectId, 'dailyUpdates');
            await addDoc(updatesRef, {
                ...update,
                projectId,
                createdAt: serverTimestamp()
            });
            console.log('Daily update added successfully');
        } catch (err) {
            console.error('Error adding daily update:', err);
            throw err;
        }
    };

    return { updates, loading, error, addUpdate };
}

export default useDailyUpdates;
