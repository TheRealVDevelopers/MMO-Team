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

// CASE-CENTRIC: Changed from projects/{projectId}/dailyUpdates to cases/{caseId}/activities
// Daily updates are now stored as activities with type='daily_update'
export function useDailyUpdates(caseId: string): UseDailyUpdatesReturn {
    const [updates, setUpdates] = useState<DailyUpdate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!caseId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        // CASE-CENTRIC: Query activities for this case, filtered by type='daily_update'
        const activitiesRef = collection(db, 'cases', caseId, 'activities');
        const q = query(
            activitiesRef, 
            where('type', '==', 'daily_update'),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const fetchedUpdates: DailyUpdate[] = snapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        projectId: caseId, // Keep projectId for backward compatibility
                        caseId: caseId, // Add explicit caseId
                        date: data.date,
                        description: data.workDescription || data.description || '', // Map workDescription to description
                        addedBy: data.createdBy || data.addedBy || '', // Map createdBy to addedBy
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
    }, [caseId]);

    const addUpdate = async (update: Omit<DailyUpdate, 'id' | 'createdAt'>) => {
        try {
            // CASE-CENTRIC: Add to cases/{caseId}/activities with type='daily_update'
            const activitiesRef = collection(db, 'cases', caseId, 'activities');
            await addDoc(activitiesRef, {
                ...update,
                caseId: caseId,
                projectId: caseId, // Keep for backward compatibility
                type: 'daily_update', // Mark as daily update activity
                createdAt: serverTimestamp()
            });
            console.log('Daily update added successfully to case:', caseId);
        } catch (err) {
            console.error('Error adding daily update:', err);
            throw err;
        }
    };

    return { updates, loading, error, addUpdate };
}

export default useDailyUpdates;
