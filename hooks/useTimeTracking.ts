import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  orderBy,
  Timestamp,
  getDocs
} from 'firebase/firestore';
import { db } from '../firebase';
import { FIRESTORE_COLLECTIONS } from '../constants';
import { TimeEntry, TimeTrackingStatus, BreakEntry, TimeActivity } from '../types';

// ========================================
// CURRENT STATUS HOOK
// ========================================

export interface CurrentTimeStatus {
  userId: string;
  status: TimeTrackingStatus;
  currentEntryId?: string;
  clockInTime?: Date;
  currentBreakStartTime?: Date;
}

export const useCurrentTimeStatus = (userId: string) => {
  const [status, setStatus] = useState<CurrentTimeStatus>({
    userId,
    status: TimeTrackingStatus.CLOCKED_OUT,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const today = new Date().toLocaleDateString('en-CA');
    const q = query(
      collection(db, FIRESTORE_COLLECTIONS.TIME_ENTRIES),
      where('userId', '==', userId),
      where('dateKey', '==', today)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const docSnap = snapshot.docs[0];
        const data = docSnap.data();

        let currentStatus: TimeTrackingStatus = TimeTrackingStatus.CLOCKED_OUT;
        let currentBreakStartTime: Date | undefined;

        if (!data.clockOut) {
          const activeBreak = data.breaks?.find((b: any) => !b.endTime);
          if (activeBreak) {
            currentStatus = TimeTrackingStatus.ON_BREAK;
            currentBreakStartTime = activeBreak.startTime?.toDate?.() || new Date(activeBreak.startTime?.seconds * 1000);
          } else {
            currentStatus = TimeTrackingStatus.CLOCKED_IN;
          }
        }

        const clockInTime = data.clockIn?.toDate?.() || new Date(data.clockIn?.seconds * 1000) || new Date();

        setStatus({
          userId,
          status: currentStatus,
          currentEntryId: docSnap.id,
          clockInTime,
          currentBreakStartTime,
        });
      } else {
        setStatus({
          userId,
          status: TimeTrackingStatus.CLOCKED_OUT,
        });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return { status, loading };
};

// Get time entries for a user (with date range)
export const useTimeEntries = (userId: string, startDate?: string, endDate?: string) => {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    let q;

    // Optimization: If asking for a single day, use equality to avoid composite index requirements
    if (startDate && endDate && startDate === endDate) {
      q = query(
        collection(db, 'timeEntries'),
        where('userId', '==', userId),
        where('date', '==', startDate)
      );
    } else {
      // Fallback for ranges (requires index)
      q = query(
        collection(db, 'timeEntries'),
        where('userId', '==', userId),
        orderBy('date', 'desc')
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const timeEntries: TimeEntry[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        timeEntries.push({
          id: doc.id,
          userId: data.userId,
          userName: data.userName || 'Unknown',
          organizationId: data.organizationId,
          dateKey: data.dateKey || data.date,
          clockIn: (data.clockIn as Timestamp).toDate(),
          clockOut: data.clockOut ? (data.clockOut as Timestamp).toDate() : undefined,
          breaks: data.breaks?.map((b: any) => ({
            id: b.id,
            startTime: b.startTime && typeof b.startTime.toDate === 'function' ? b.startTime.toDate() : new Date(b.startTime?.seconds * 1000 || Date.now()),
            endTime: b.endTime ? (typeof b.endTime.toDate === 'function' ? b.endTime.toDate() : new Date(b.endTime.seconds * 1000)) : undefined,
          })) || [],
          activities: data.activities?.map((a: any) => ({
            id: a.id,
            name: a.name,
            startTime: a.startTime && typeof a.startTime.toDate === 'function' ? a.startTime.toDate() : new Date(a.startTime?.seconds * 1000 || Date.now()),
            endTime: a.endTime ? (typeof a.endTime.toDate === 'function' ? a.endTime.toDate() : new Date(a.endTime.seconds * 1000)) : undefined,
            tags: a.tags || [],
            caseId: a.caseId,
            taskId: a.taskId
          })) || [],
          status: data.status,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.(),
          currentTaskId: data.currentTaskId,
          currentCaseId: data.currentCaseId
        });
      });
      setEntries(timeEntries);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId, startDate, endDate]);

  return { entries, loading };
};

// Get time entries for multiple users or whole team (with date range)
export const useTeamTimeEntries = (startDate?: string, endDate?: string, userIds?: string[]) => {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let q;

    // Fetch by date range for all users
    const entriesRef = collection(db, 'timeEntries');

    if (startDate && endDate) {
      if (startDate === endDate) {
        q = query(entriesRef, where('date', '==', startDate));
      } else {
        q = query(
          entriesRef,
          where('date', '>=', startDate),
          where('date', '<=', endDate)
        );
      }
    } else {
      q = query(entriesRef, orderBy('date', 'desc'));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let timeEntries: TimeEntry[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();

        // Filter by userIds if provided
        if (userIds && !userIds.includes(data.userId)) return;

        timeEntries.push({
          id: doc.id,
          userId: data.userId,
          userName: data.userName || 'Unknown',
          organizationId: data.organizationId,
          dateKey: data.dateKey || data.date,
          clockIn: data.clockIn && typeof (data.clockIn as any).toDate === 'function' ? (data.clockIn as any).toDate() : (data.clockIn ? new Date((data.clockIn as any).seconds * 1000) : new Date()),
          clockOut: data.clockOut && typeof (data.clockOut as any).toDate === 'function' ? (data.clockOut as any).toDate() : (data.clockOut ? new Date((data.clockOut as any).seconds * 1000) : undefined),
          breaks: data.breaks?.map((b: any) => ({
            id: b.id,
            startTime: b.startTime && typeof b.startTime.toDate === 'function' ? b.startTime.toDate() : new Date(b.startTime?.seconds * 1000 || Date.now()),
            endTime: b.endTime ? (typeof b.endTime.toDate === 'function' ? b.endTime.toDate() : new Date(b.endTime.seconds * 1000)) : undefined,
          })) || [],
          activities: data.activities?.map((a: any) => ({
            id: a.id,
            name: a.name,
            startTime: a.startTime && typeof a.startTime.toDate === 'function' ? a.startTime.toDate() : new Date(a.startTime?.seconds * 1000 || Date.now()),
            endTime: a.endTime ? (typeof a.endTime.toDate === 'function' ? a.endTime.toDate() : new Date(a.endTime.seconds * 1000)) : undefined,
            tags: a.tags || [],
            caseId: a.caseId,
            taskId: a.taskId
          })) || [],
          status: data.status,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.(),
          currentTaskId: data.currentTaskId,
          currentCaseId: data.currentCaseId
        });
      });
      setEntries(timeEntries);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [startDate, endDate, JSON.stringify(userIds)]);

  return { entries, loading };
};

// Clock In
export const clockIn = async (userId: string, userName: string, organizationId?: string) => {
  try {
    const today = new Date().toLocaleDateString('en-CA');

    // Check if already clocked in today
    const q = query(
      collection(db, FIRESTORE_COLLECTIONS.TIME_ENTRIES),
      where('userId', '==', userId),
      where('dateKey', '==', today)
    );
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      throw new Error('Already clocked in today');
    }

    // If organizationId not provided, try to fetch from user
    let orgId = organizationId;
    if (!orgId) {
      const { getDoc } = await import('firebase/firestore');
      const userRef = doc(db, FIRESTORE_COLLECTIONS.STAFF_USERS, userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        orgId = userSnap.data().organizationId;
      }
    }

    const timeEntry = {
      userId,
      userName: userName || 'Unknown',
      organizationId: orgId || 'unknown',
      dateKey: today,
      clockIn: serverTimestamp(),
      breaks: [],
      activities: [],
      status: TimeTrackingStatus.CLOCKED_IN,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, FIRESTORE_COLLECTIONS.TIME_ENTRIES), timeEntry);

    // SYNC: Update User Status
    const userRef = doc(db, FIRESTORE_COLLECTIONS.STAFF_USERS, userId);
    await updateDoc(userRef, {
      attendanceStatus: 'CLOCKED_IN',
      isOnline: true,
      lastUpdateTimestamp: serverTimestamp()
    });

    return docRef.id;
  } catch (error) {
    console.error('Error clocking in:', error);
    throw error;
  }
};

// Clock Out
export const clockOut = async (entryId: string) => {
  try {
    const entryRef = doc(db, 'timeEntries', entryId);

    // Get current entry data using getDoc
    const { getDoc } = await import('firebase/firestore');
    const docSnapshot = await getDoc(entryRef);

    if (!docSnapshot.exists()) {
      throw new Error('Time entry not found');
    }

    const data = docSnapshot.data();
    const userId = data.userId; // Get userId from entry
    const clockInTime = (data.clockIn as Timestamp).toDate();
    const clockOutTime = new Date();

    // Calculate total work hours
    const totalMs = clockOutTime.getTime() - clockInTime.getTime();
    const totalBreakMs = (data.breaks || []).reduce((acc: number, b: any) => {
      if (b.endTime) {
        return acc + (b.endTime.toDate().getTime() - b.startTime.toDate().getTime());
      }
      return acc;
    }, 0);

    const totalWorkMs = totalMs - totalBreakMs;
    const totalWorkHours = totalWorkMs / (1000 * 60 * 60);
    const totalBreakMinutes = totalBreakMs / (1000 * 60);

    await updateDoc(entryRef, {
      clockOut: serverTimestamp(),
      totalWorkHours: parseFloat(totalWorkHours.toFixed(2)),
      totalBreakMinutes: Math.round(totalBreakMinutes),
      status: TimeTrackingStatus.CLOCKED_OUT,
    });

    // SYNC: Update User Status
    if (userId) {
      const userRef = doc(db, 'staffUsers', userId);
      await updateDoc(userRef, {
        attendanceStatus: 'CLOCKED_OUT',
        isOnline: false,
        lastUpdateTimestamp: serverTimestamp(),
        currentTask: '', // Clear current task
        currentTaskDetails: null
      });
    }

  } catch (error) {
    console.error('Error clocking out:', error);
    throw error;
  }
};

// Start Break
export const startBreak = async (entryId: string) => {
  try {
    const entryRef = doc(db, 'timeEntries', entryId);

    const { getDoc } = await import('firebase/firestore');
    const docSnapshot = await getDoc(entryRef);

    if (!docSnapshot.exists()) {
      throw new Error('Time entry not found');
    }

    const data = docSnapshot.data();
    const userId = data.userId;
    const breaks = data.breaks || [];

    // Check if already on break
    const activeBreak = breaks.find((b: any) => !b.endTime);
    if (activeBreak) {
      throw new Error('Already on break');
    }

    breaks.push({
      id: `break-${Date.now()}`,
      startTime: new Date(),
    });

    await updateDoc(entryRef, {
      breaks,
      status: TimeTrackingStatus.ON_BREAK,
    });

    // SYNC: Update User Status
    if (userId) {
      const userRef = doc(db, 'staffUsers', userId);
      await updateDoc(userRef, {
        attendanceStatus: 'ON_BREAK',
        currentTask: 'On Break',
        lastUpdateTimestamp: serverTimestamp()
      });
    }

  } catch (error) {
    console.error('Error starting break:', error);
    throw error;
  }
};

// End Break
export const endBreak = async (entryId: string) => {
  try {
    const entryRef = doc(db, 'timeEntries', entryId);

    const { getDoc } = await import('firebase/firestore');
    const docSnapshot = await getDoc(entryRef);

    if (!docSnapshot.exists()) {
      throw new Error('Time entry not found');
    }

    const data = docSnapshot.data();
    const userId = data.userId;
    const breaks = data.breaks || [];

    // Find active break
    const activeBreakIndex = breaks.findIndex((b: any) => !b.endTime);
    if (activeBreakIndex === -1) {
      throw new Error('No active break found');
    }

    const activeBreak = breaks[activeBreakIndex];
    const startTime = (activeBreak.startTime as Timestamp).toDate();
    const endTime = new Date();
    const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));

    breaks[activeBreakIndex] = {
      ...activeBreak,
      endTime: new Date(),
      durationMinutes,
    };

    await updateDoc(entryRef, {
      breaks,
      status: TimeTrackingStatus.CLOCKED_IN,
    });

    // SYNC: Update User Status
    if (userId) {
      const userRef = doc(db, 'staffUsers', userId);
      await updateDoc(userRef, {
        attendanceStatus: 'CLOCKED_IN', // Back to work
        currentTask: 'Available', // Or retain previous? Defaulting to Available
        lastUpdateTimestamp: serverTimestamp()
      });
    }

  } catch (error) {
    console.error('Error ending break:', error);
    throw error;
  }
};

// ========================================
// DEPRECATED: Use useTimeAnalytics hook instead
// These functions are kept for backward compatibility
// but should NOT be used for new code
// ========================================

/**
 * @deprecated Use useTimeAnalytics hook instead
 * Calculates total logged hours from entries (dynamically computed)
 */
export const calculateTotalHours = (entries: TimeEntry[]) => {
  return entries.reduce((total, entry) => {
    if (!entry.clockIn) return total;
    const end = entry.clockOut || new Date();
    const hours = (end.getTime() - entry.clockIn.getTime()) / (1000 * 60 * 60);
    return total + hours;
  }, 0);
};

/**
 * Format duration in minutes to hours:minutes string
 */
export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = Math.floor(minutes % 60);
  return `${hours}h ${mins}m`;
};

/**
 * @deprecated Use useTimeAnalytics hook instead
 * Get time tracking summary (dynamically computed)
 */
export const getTimeTrackingSummary = (entries: TimeEntry[]) => {
  const totalWorkHours = calculateTotalHours(entries);
  
  // Calculate break time dynamically
  let totalBreakMinutes = 0;
  for (const entry of entries) {
    for (const breakItem of entry.breaks) {
      if (breakItem.endTime) {
        totalBreakMinutes += (breakItem.endTime.getTime() - breakItem.startTime.getTime()) / (1000 * 60);
      }
    }
  }

  const totalDays = entries.filter(e => e.clockOut).length;
  const averageHoursPerDay = totalDays > 0 ? totalWorkHours / totalDays : 0;

  return {
    totalWorkHours: parseFloat(totalWorkHours.toFixed(2)),
    totalBreakMinutes: Math.floor(totalBreakMinutes),
    totalDays,
    averageHoursPerDay: parseFloat(averageHoursPerDay.toFixed(2)),
  };
};

// Add an activity to today's time entry (for task tracking in timeline)
export const addActivity = async (userId: string, userName: string, activityName: string, isComplete: boolean = false) => {
  try {
    const today = new Date().toLocaleDateString('en-CA');

    // Find today's time entry
    const q = query(
      collection(db, 'timeEntries'),
      where('userId', '==', userId),
      where('date', '==', today)
    );
    const snapshot = await getDocs(q);

    let entryId: string;
    let activities: any[] = [];

    if (snapshot.empty) {
      // Auto clock-in if not clocked in yet (starting first task starts the day)
      const newEntry = {
        userId,
        userName,
        clockIn: serverTimestamp(),
        date: today,
        breaks: [],
        activities: [],
        status: TimeTrackingStatus.CLOCKED_IN,
      };
      const docRef = await addDoc(collection(db, 'timeEntries'), newEntry);
      entryId = docRef.id;

      // SYNC: Update User Status for Auto Clock-in
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        attendanceStatus: 'CLOCKED_IN',
        isOnline: true,
        lastUpdateTimestamp: serverTimestamp()
      });

      console.log('Auto clocked in for', userName);
    } else {
      entryId = snapshot.docs[0].id;
      activities = snapshot.docs[0].data().activities || [];
    }

    // If marking complete, find the active activity and update it
    if (isComplete) {
      const activeIndex = activities.findIndex((a: any) => a.name === activityName && !a.endTime);
      if (activeIndex !== -1) {
        activities[activeIndex] = {
          ...activities[activeIndex],
          endTime: new Date(),
        };
      }

      // SYNC: Status when complete
      const userRef = doc(db, 'staffUsers', userId);
      await updateDoc(userRef, {
        currentTask: 'Available', // Or 'Task Completed'
        currentTaskDetails: null,
        lastUpdateTimestamp: serverTimestamp()
      });

    } else {
      // Add new activity (task started)
      activities.push({
        id: `activity-${Date.now()}`,
        name: activityName,
        startTime: new Date(),
        tags: ['task'],
      });

      // SYNC: Status when started
      const userRef = doc(db, 'staffUsers', userId);
      await updateDoc(userRef, {
        currentTask: activityName,
        currentTaskDetails: {
          title: activityName,
          status: 'In Progress',
          type: 'Desk Work', // Detailed type can be passed if needed
          startTime: new Date()
        },
        lastUpdateTimestamp: serverTimestamp()
      });
    }

    const entryRef = doc(db, 'timeEntries', entryId);
    await updateDoc(entryRef, { activities });

    console.log(isComplete ? `Activity completed: ${activityName}` : `Activity started: ${activityName}`);
    return entryId;
  } catch (error) {
    console.error('Error adding activity:', error);
    throw error;
  }
};
