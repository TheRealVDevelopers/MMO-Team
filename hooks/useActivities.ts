import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { FIRESTORE_COLLECTIONS } from '../constants';

export interface CaseActivity {
  id: string;
  caseId: string;
  type: 'status_change' | 'note' | 'file_upload' | 'reminder' | 'task_created' | 'other';
  action: string; // Description of the action
  userId: string;
  userName: string;
  timestamp: Date;
  notes?: string;
  metadata?: Record<string, any>; // For additional data (attachments, old/new values, etc.)
}

export const useActivities = (caseId?: string) => {
  const [activities, setActivities] = useState<CaseActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!db || !caseId) {
      setLoading(false);
      return;
    }

    try {
      const activitiesRef = collection(
        db,
        FIRESTORE_COLLECTIONS.CASES,
        caseId,
        FIRESTORE_COLLECTIONS.ACTIVITIES
      );

      const q = query(activitiesRef, orderBy('timestamp', 'desc'));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const activitiesData = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              ...data,
              id: doc.id,
              timestamp: data.timestamp instanceof Timestamp 
                ? data.timestamp.toDate() 
                : new Date(data.timestamp),
            } as CaseActivity;
          });
          setActivities(activitiesData);
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error('Error fetching activities:', err);
          setError(err.message);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err: any) {
      console.error('Error setting up activities listener:', err);
      setError(err.message);
      setLoading(false);
    }
  }, [caseId]);

  const addActivity = useCallback(
    async (activity: Omit<CaseActivity, 'id' | 'timestamp' | 'caseId'>) => {
      if (!db || !caseId) {
        throw new Error('Database or case not initialized');
      }

      try {
        const activitiesRef = collection(
          db,
          FIRESTORE_COLLECTIONS.CASES,
          caseId,
          FIRESTORE_COLLECTIONS.ACTIVITIES
        );

        const newActivity = {
          ...activity,
          caseId,
          timestamp: serverTimestamp(),
        };

        const docRef = await addDoc(activitiesRef, newActivity);
        return docRef.id;
      } catch (err: any) {
        console.error('Error adding activity:', err);
        throw err;
      }
    },
    [caseId]
  );

  return {
    activities,
    loading,
    error,
    addActivity,
  };
};

// Standalone function for logging activities without subscription
export const logActivity = async (
  caseId: string,
  activity: Omit<CaseActivity, 'id' | 'timestamp' | 'caseId'>
) => {
  if (!db) {
    throw new Error('Database not initialized');
  }

  try {
    const activitiesRef = collection(
      db,
      FIRESTORE_COLLECTIONS.CASES,
      caseId,
      FIRESTORE_COLLECTIONS.ACTIVITIES
    );

    const newActivity = {
      ...activity,
      caseId,
      timestamp: serverTimestamp(),
    };

    await addDoc(activitiesRef, newActivity);
  } catch (err: any) {
    console.error('Error logging activity:', err);
    throw err;
  }
};
