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
import { TimeEntry, TimeTrackingStatus, BreakEntry, CurrentTimeStatus } from '../types';

// Get current user's time status for today
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

    const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local time
    const q = query(
      collection(db, 'timeEntries'),
      where('userId', '==', userId),
      where('date', '==', today)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        const data = doc.data() as TimeEntry;

        let currentStatus: TimeTrackingStatus = TimeTrackingStatus.CLOCKED_OUT;
        let currentBreakStartTime: Date | undefined;

        if (!data.clockOut) {
          // Still clocked in
          const activeBreak = data.breaks?.find(b => !b.endTime);
          if (activeBreak) {
            currentStatus = TimeTrackingStatus.ON_BREAK;
            currentBreakStartTime = (activeBreak.startTime as any).toDate();
          } else {
            currentStatus = TimeTrackingStatus.CLOCKED_IN;
          }
        }

        let clockInTime: Date;
        if (data.clockIn && typeof (data.clockIn as any).toDate === 'function') {
          clockInTime = (data.clockIn as any).toDate();
        } else {
          // Fallback if seconds exists or just now
          const seconds = (data.clockIn as any)?.seconds;
          clockInTime = seconds ? new Date(seconds * 1000) : new Date();
        }

        setStatus({
          userId,
          status: currentStatus,
          currentEntryId: doc.id,
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
          userName: data.userName,
          clockIn: (data.clockIn as Timestamp).toDate(),
          clockOut: data.clockOut ? (data.clockOut as Timestamp).toDate() : undefined,
          breaks: data.breaks?.map((b: any) => ({
            id: b.id,
            startTime: b.startTime && typeof b.startTime.toDate === 'function' ? b.startTime.toDate() : new Date(b.startTime?.seconds * 1000 || Date.now()),
            endTime: b.endTime ? (typeof b.endTime.toDate === 'function' ? b.endTime.toDate() : new Date(b.endTime.seconds * 1000)) : undefined,
            durationMinutes: b.durationMinutes,
          })) || [],
          activities: data.activities?.map((a: any) => ({
            id: a.id,
            name: a.name,
            startTime: a.startTime && typeof a.startTime.toDate === 'function' ? a.startTime.toDate() : new Date(a.startTime?.seconds * 1000 || Date.now()),
            endTime: a.endTime ? (typeof a.endTime.toDate === 'function' ? a.endTime.toDate() : new Date(a.endTime.seconds * 1000)) : undefined,
            durationMinutes: a.durationMinutes,
            tags: a.tags
          })) || [],
          totalWorkHours: data.totalWorkHours,
          totalBreakMinutes: data.totalBreakMinutes,
          date: data.date,
          status: data.status,
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
          userName: data.userName,
          clockIn: data.clockIn && typeof (data.clockIn as any).toDate === 'function' ? (data.clockIn as any).toDate() : (data.clockIn ? new Date((data.clockIn as any).seconds * 1000) : undefined),
          clockOut: data.clockOut && typeof (data.clockOut as any).toDate === 'function' ? (data.clockOut as any).toDate() : (data.clockOut ? new Date((data.clockOut as any).seconds * 1000) : undefined),
          breaks: data.breaks?.map((b: any) => ({
            id: b.id,
            startTime: b.startTime && typeof b.startTime.toDate === 'function' ? b.startTime.toDate() : new Date(b.startTime?.seconds * 1000 || Date.now()),
            endTime: b.endTime ? (typeof b.endTime.toDate === 'function' ? b.endTime.toDate() : new Date(b.endTime.seconds * 1000)) : undefined,
            durationMinutes: b.durationMinutes,
          })) || [],
          activities: data.activities?.map((a: any) => ({
            id: a.id,
            name: a.name,
            startTime: a.startTime && typeof a.startTime.toDate === 'function' ? a.startTime.toDate() : new Date(a.startTime?.seconds * 1000 || Date.now()),
            endTime: a.endTime ? (typeof a.endTime.toDate === 'function' ? a.endTime.toDate() : new Date(a.endTime.seconds * 1000)) : undefined,
            durationMinutes: a.durationMinutes,
            tags: a.tags
          })) || [],
          totalWorkHours: data.totalWorkHours,
          totalBreakMinutes: data.totalBreakMinutes,
          date: data.date,
          status: data.status,
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
export const clockIn = async (userId: string, userName: string) => {
  try {
    const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local time

    // Check if already clocked in today
    const q = query(
      collection(db, 'timeEntries'),
      where('userId', '==', userId),
      where('date', '==', today)
    );
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      throw new Error('Already clocked in today');
    }

    const timeEntry = {
      userId,
      userName,
      clockIn: serverTimestamp(),
      date: today,
      breaks: [],
      activities: [],
      status: TimeTrackingStatus.CLOCKED_IN,
    };

    const docRef = await addDoc(collection(db, 'timeEntries'), timeEntry);

    // SYNC: Update User Status
    const userRef = doc(db, 'staffUsers', userId);
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

// Calculate total hours for a period
export const calculateTotalHours = (entries: TimeEntry[]) => {
  return entries.reduce((total, entry) => {
    return total + (entry.totalWorkHours || 0);
  }, 0);
};

// Format duration (minutes to hours:minutes)
export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

// Get time tracking summary
export const getTimeTrackingSummary = (entries: TimeEntry[]) => {
  const totalWorkHours = calculateTotalHours(entries);
  const totalBreakMinutes = entries.reduce((total, entry) => {
    return total + (entry.totalBreakMinutes || 0);
  }, 0);

  const totalDays = entries.filter(e => e.clockOut).length;
  const averageHoursPerDay = totalDays > 0 ? totalWorkHours / totalDays : 0;

  return {
    totalWorkHours: parseFloat(totalWorkHours.toFixed(2)),
    totalBreakMinutes,
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
