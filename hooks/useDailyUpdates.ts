import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { FIRESTORE_COLLECTIONS } from '../constants';

export interface DailyUpdateRecord {
  id: string;
  caseId: string;
  date: Date | string;
  workDescription: string;
  manpowerCount: number;
  photos: string[];
  createdBy: string;
  createdAt: Date;
  completionPercent?: number;
  weather?: string;
  blocker?: string;
}

interface UseDailyUpdatesReturn {
  updates: DailyUpdateRecord[];
  loading: boolean;
  error: string | null;
  addUpdate: (update: Omit<DailyUpdateRecord, 'id' | 'createdAt'>) => Promise<void>;
}

/** Daily updates: cases/{caseId}/dailyUpdates only. No activities. */
export function useDailyUpdates(caseId: string): UseDailyUpdatesReturn {
  const [updates, setUpdates] = useState<DailyUpdateRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!db || !caseId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const ref = collection(db, FIRESTORE_COLLECTIONS.CASES, caseId, FIRESTORE_COLLECTIONS.DAILY_UPDATES);
    const q = query(ref, orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setUpdates(
          snapshot.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              caseId,
              date: data.date?.toDate?.() ?? data.date,
              workDescription: data.workDescription ?? '',
              manpowerCount: data.manpowerCount ?? 0,
              photos: data.photos ?? [],
              createdBy: data.createdBy ?? '',
              createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
              completionPercent: data.completionPercent,
              weather: data.weather,
              blocker: data.blocker,
            } as DailyUpdateRecord;
          })
        );
        setLoading(false);
      },
      (err) => {
        console.error('useDailyUpdates:', err);
        setError('Failed to load daily updates');
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [caseId]);

  const addUpdate = async (update: Omit<DailyUpdateRecord, 'id' | 'createdAt'>) => {
    if (!db || !caseId) throw new Error('Missing db or caseId');
    const ref = collection(db, FIRESTORE_COLLECTIONS.CASES, caseId, FIRESTORE_COLLECTIONS.DAILY_UPDATES);
    await addDoc(ref, {
      caseId,
      date: update.date instanceof Date ? update.date : new Date(update.date),
      workDescription: update.workDescription,
      manpowerCount: update.manpowerCount ?? 0,
      photos: update.photos ?? [],
      createdBy: update.createdBy,
      createdAt: serverTimestamp(),
      ...(update.completionPercent != null && { completionPercent: update.completionPercent }),
      ...(update.weather && { weather: update.weather }),
      ...(update.blocker && { blocker: update.blocker }),
    });
  };

  return { updates, loading, error, addUpdate };
}

export default useDailyUpdates;
