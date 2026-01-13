
import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { Activity } from '../types';

type FirestoreActivity = Omit<Activity, 'timestamp'> & {
    timestamp: Timestamp;
};

const fromFirestore = (docData: FirestoreActivity, id: string): Activity => {
    return {
        ...docData,
        id,
        timestamp: docData.timestamp.toDate(),
    };
};

export const useActivities = (projectId?: string) => {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        setLoading(true);
        setError(null);

        let q = query(
            collection(db, 'activities'),
            orderBy('timestamp', 'desc')
        );

        if (projectId) {
            q = query(
                collection(db, 'activities'),
                where('projectId', '==', projectId),
                orderBy('timestamp', 'desc')
            );
        }

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const activitiesData: Activity[] = [];
            querySnapshot.forEach((doc) => {
                activitiesData.push(fromFirestore(doc.data() as FirestoreActivity, doc.id));
            });
            setActivities(activitiesData);
            setLoading(false);
        }, (err) => {
            console.error("Firestore activities access failed:", err);
            setError(err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [projectId]);

    return { activities, loading, error };
};
