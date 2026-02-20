import { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { FIRESTORE_COLLECTIONS } from '../constants';
import { v4 as uuidv4 } from 'uuid';

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

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

/** 
 * Daily updates hook.
 * MIGRATED: Now reads from/writes to 'dailyLogs' array in cases/{caseId}.
 */
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

    const docRef = doc(db, FIRESTORE_COLLECTIONS.CASES, caseId);
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const logs = (data.dailyLogs || []).map((log: any) => ({
            id: log.id,
            caseId,
            date: log.date instanceof Timestamp ? log.date.toDate() : new Date(log.date),
            workDescription: log.workDescription,
            manpowerCount: log.manpowerCount,
            photos: log.photos || [],
            createdBy: log.createdBy,
            createdAt: log.createdAt instanceof Timestamp ? log.createdAt.toDate() : new Date(log.createdAt || Date.now()),
            completionPercent: log.completionPercent,
            weather: log.weather,
            blocker: log.blocker
          } as DailyUpdateRecord));

          // Sort by date desc
          logs.sort((a: DailyUpdateRecord, b: DailyUpdateRecord) => new Date(b.date).getTime() - new Date(a.date).getTime());

          setUpdates(logs);
        } else {
          setUpdates([]);
        }
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
    const docRef = doc(db, FIRESTORE_COLLECTIONS.CASES, caseId);

    const newUpdate = {
      id: generateId(),
      date: update.date instanceof Date ? update.date : new Date(update.date),
      workDescription: update.workDescription,
      manpowerCount: update.manpowerCount ?? 0,
      photos: update.photos ?? [],
      createdBy: update.createdBy,
      createdAt: Timestamp.now(),
      ...(update.completionPercent != null && { completionPercent: update.completionPercent }),
      ...(update.weather && { weather: update.weather }),
      ...(update.blocker && { blocker: update.blocker }),
    };

    await updateDoc(docRef, {
      dailyLogs: arrayUnion(newUpdate)
    });
  };

  return { updates, loading, error, addUpdate };
}

export default useDailyUpdates;
