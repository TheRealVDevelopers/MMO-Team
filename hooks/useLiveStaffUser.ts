import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { FIRESTORE_COLLECTIONS } from '../constants';

export interface LiveStaffUserSnapshot {
  currentTask: string | null;
  attendanceStatus: string | null;
  isOnline?: boolean;
  lastUpdateTimestamp?: Date | null;
  loading: boolean;
}

/**
 * Real-time subscription to a staff user's document for current task and attendance.
 * Use in team member detail view so "Currently on task" and status stay in sync.
 */
export function useLiveStaffUser(userId: string | undefined): LiveStaffUserSnapshot {
  const [currentTask, setCurrentTask] = useState<string | null>(null);
  const [attendanceStatus, setAttendanceStatus] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean | undefined>(undefined);
  const [lastUpdateTimestamp, setLastUpdateTimestamp] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db || !userId) {
      setLoading(false);
      return;
    }

    const userRef = doc(db, FIRESTORE_COLLECTIONS.STAFF_USERS, userId);
    const unsubscribe = onSnapshot(
      userRef,
      (snap) => {
        if (!snap.exists()) {
          setCurrentTask(null);
          setAttendanceStatus(null);
          setLoading(false);
          return;
        }
        const data = snap.data();
        setCurrentTask(data?.currentTask ?? null);
        setAttendanceStatus(data?.attendanceStatus ?? null);
        setIsOnline(data?.isOnline);
        const ts = data?.lastUpdateTimestamp;
        setLastUpdateTimestamp(ts?.toDate ? ts.toDate() : ts ? new Date(ts) : null);
        setLoading(false);
      },
      (err) => {
        console.error('[useLiveStaffUser] Error:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  return { currentTask, attendanceStatus, isOnline, lastUpdateTimestamp, loading };
}
