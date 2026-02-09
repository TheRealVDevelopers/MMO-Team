import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { FIRESTORE_COLLECTIONS } from '../constants';
import { TimeEntry, TimeTrackingStatus } from '../types';

// ========================================
// DERIVED TIME ANALYTICS
// Single Source of Truth for ALL time metrics
// ========================================

export interface TimeAnalytics {
  // Days
  totalDaysWorked: number;
  
  // Hours (computed from seconds)
  totalActiveHours: number;
  totalIdleHours: number;
  totalBreakHours: number;
  totalLoggedHours: number;
  avgDailyHours: number;
  
  // Productivity
  productivityPercentage: number;
  
  // Status
  currentStatus: TimeTrackingStatus | null;
  clockedInAt: Date | null;
  
  // Raw data (for detailed views)
  entries: TimeEntry[];
  loading: boolean;
}

// Helper: Safe date conversion from Firestore
const safeDate = (val: any): Date | null => {
  if (!val) return null;
  if (val instanceof Date) return val;
  if (typeof val.toDate === 'function') return val.toDate();
  if (val.seconds) return new Date(val.seconds * 1000);
  return new Date(val);
};

// Helper: Calculate duration in seconds between two dates
const durationInSeconds = (start: Date, end: Date): number => {
  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / 1000));
};

// Helper: Get start and end of month
const getMonthBounds = (year: number, month: number) => {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
  return {
    startDateKey: start.toISOString().split('T')[0],
    endDateKey: end.toISOString().split('T')[0]
  };
};

// Optional date range override (YYYY-MM-DD). When set, overrides year/month.
export interface TimeAnalyticsDateRange {
  startDateKey: string;
  endDateKey: string;
}

// ========================================
// CORE HOOK: useTimeAnalytics
// Returns computed metrics from timeEntries
// ========================================

export const useTimeAnalytics = (
  userId?: string,
  organizationId?: string,
  year?: number,
  month?: number,
  dateRange?: TimeAnalyticsDateRange
): TimeAnalytics => {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Use explicit date range if provided; otherwise current month
  const targetYear = year ?? new Date().getFullYear();
  const targetMonth = month ?? new Date().getMonth();
  const monthBounds = getMonthBounds(targetYear, targetMonth);
  const startDateKey = dateRange?.startDateKey ?? monthBounds.startDateKey;
  const endDateKey = dateRange?.endDateKey ?? monthBounds.endDateKey;

  useEffect(() => {
    setLoading(true);
    
    let q;
    const entriesRef = collection(db, FIRESTORE_COLLECTIONS.TIME_ENTRIES);
    
    if (userId) {
      // Query for specific user
      q = query(
        entriesRef,
        where('userId', '==', userId),
        where('dateKey', '>=', startDateKey),
        where('dateKey', '<=', endDateKey)
      );
    } else if (organizationId) {
      // Query for organization (all users)
      q = query(
        entriesRef,
        where('organizationId', '==', organizationId),
        where('dateKey', '>=', startDateKey),
        where('dateKey', '<=', endDateKey)
      );
    } else {
      // No filters - return empty (require at least userId or orgId)
      setEntries([]);
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedEntries: TimeEntry[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        
        fetchedEntries.push({
          id: doc.id,
          userId: data.userId,
          userName: data.userName || 'Unknown',
          organizationId: data.organizationId,
          dateKey: data.dateKey,
          clockIn: safeDate(data.clockIn) || new Date(),
          clockOut: safeDate(data.clockOut) || undefined,
          breaks: (data.breaks || []).map((b: any) => ({
            id: b.id,
            startTime: safeDate(b.startTime) || new Date(),
            endTime: safeDate(b.endTime) || undefined
          })),
          activities: (data.activities || []).map((a: any) => ({
            id: a.id,
            name: a.name,
            startTime: safeDate(a.startTime) || new Date(),
            endTime: safeDate(a.endTime) || undefined,
            tags: a.tags || [],
            caseId: a.caseId,
            taskId: a.taskId
          })),
          status: data.status || TimeTrackingStatus.CLOCKED_OUT,
          createdAt: safeDate(data.createdAt) || new Date(),
          updatedAt: safeDate(data.updatedAt),
          currentTaskId: data.currentTaskId,
          currentCaseId: data.currentCaseId
        });
      });
      
      setEntries(fetchedEntries);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching time entries:', error);
      setEntries([]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId, organizationId, startDateKey, endDateKey]);

  // ========================================
  // DERIVED METRICS (Computed, Not Stored)
  // ========================================
  
  const analytics = useMemo((): TimeAnalytics => {
    // Default: All ZEROS (fresh start)
    if (entries.length === 0) {
      return {
        totalDaysWorked: 0,
        totalActiveHours: 0,
        totalIdleHours: 0,
        totalBreakHours: 0,
        totalLoggedHours: 0,
        avgDailyHours: 0,
        productivityPercentage: 0,
        currentStatus: null,
        clockedInAt: null,
        entries: [],
        loading
      };
    }

    let totalActiveSeconds = 0;
    let totalBreakSeconds = 0;
    let totalLoggedSeconds = 0;
    let daysWithActivity = 0;
    
    let currentStatus: TimeTrackingStatus | null = null;
    let clockedInAt: Date | null = null;

    for (const entry of entries) {
      const clockIn = entry.clockIn;
      const clockOut = entry.clockOut;
      
      // Calculate logged time (clock in to clock out, or now if still clocked in)
      const sessionEnd = clockOut || new Date();
      const loggedSeconds = durationInSeconds(clockIn, sessionEnd);
      totalLoggedSeconds += loggedSeconds;
      
      // Calculate break time
      let entryBreakSeconds = 0;
      for (const breakItem of entry.breaks) {
        if (breakItem.endTime) {
          entryBreakSeconds += durationInSeconds(breakItem.startTime, breakItem.endTime);
        } else if (!clockOut) {
          // Ongoing break
          entryBreakSeconds += durationInSeconds(breakItem.startTime, new Date());
        }
      }
      totalBreakSeconds += entryBreakSeconds;
      
      // Calculate active time from activities
      let entryActiveSeconds = 0;
      for (const activity of entry.activities) {
        if (activity.endTime) {
          entryActiveSeconds += durationInSeconds(activity.startTime, activity.endTime);
        } else if (!clockOut) {
          // Ongoing activity
          entryActiveSeconds += durationInSeconds(activity.startTime, new Date());
        }
      }
      totalActiveSeconds += entryActiveSeconds;
      
      // Count days with any activity
      if (entry.activities.length > 0 || loggedSeconds > 300) { // > 5 minutes
        daysWithActivity++;
      }
      
      // Track current status (most recent entry)
      if (!clockOut) {
        currentStatus = entry.status;
        clockedInAt = clockIn;
      }
    }

    // Calculate idle time (logged - active - break)
    const totalIdleSeconds = Math.max(0, totalLoggedSeconds - totalActiveSeconds - totalBreakSeconds);
    
    // Convert to hours
    const totalActiveHours = parseFloat((totalActiveSeconds / 3600).toFixed(2));
    const totalIdleHours = parseFloat((totalIdleSeconds / 3600).toFixed(2));
    const totalBreakHours = parseFloat((totalBreakSeconds / 3600).toFixed(2));
    const totalLoggedHours = parseFloat((totalLoggedSeconds / 3600).toFixed(2));
    
    // Average daily hours
    const avgDailyHours = daysWithActivity > 0 
      ? parseFloat((totalLoggedHours / daysWithActivity).toFixed(2))
      : 0;
    
    // Productivity percentage (active / logged * 100)
    const productivityPercentage = totalLoggedSeconds > 0
      ? parseFloat(((totalActiveSeconds / totalLoggedSeconds) * 100).toFixed(1))
      : 0;

    return {
      totalDaysWorked: daysWithActivity,
      totalActiveHours,
      totalIdleHours,
      totalBreakHours,
      totalLoggedHours,
      avgDailyHours,
      productivityPercentage,
      currentStatus,
      clockedInAt,
      entries,
      loading
    };
  }, [entries, loading]);

  return analytics;
};

// ========================================
// TEAM ANALYTICS (For managers/admins)
// ========================================

export interface TeamTimeAnalytics {
  users: Array<{
    userId: string;
    userName: string;
    totalDaysWorked: number;
    totalActiveHours: number;
    totalLoggedHours: number;
    productivityPercentage: number;
    currentStatus: TimeTrackingStatus | null;
  }>;
  teamTotals: {
    totalDaysWorked: number;
    totalActiveHours: number;
    totalBreakHours: number;
    totalLoggedHours: number;
    avgProductivity: number;
    activeUsers: number;
  };
  loading: boolean;
}

export const useTeamTimeAnalytics = (
  organizationId: string,
  year?: number,
  month?: number
): TeamTimeAnalytics => {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const targetYear = year ?? new Date().getFullYear();
  const targetMonth = month ?? new Date().getMonth();
  const { startDateKey, endDateKey } = getMonthBounds(targetYear, targetMonth);

  useEffect(() => {
    if (!organizationId) {
      setEntries([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    const q = query(
      collection(db, FIRESTORE_COLLECTIONS.TIME_ENTRIES),
      where('organizationId', '==', organizationId),
      where('dateKey', '>=', startDateKey),
      where('dateKey', '<=', endDateKey)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedEntries: TimeEntry[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        fetchedEntries.push({
          id: doc.id,
          userId: data.userId,
          userName: data.userName || 'Unknown',
          organizationId: data.organizationId,
          dateKey: data.dateKey,
          clockIn: safeDate(data.clockIn) || new Date(),
          clockOut: safeDate(data.clockOut) || undefined,
          breaks: (data.breaks || []).map((b: any) => ({
            id: b.id,
            startTime: safeDate(b.startTime) || new Date(),
            endTime: safeDate(b.endTime) || undefined
          })),
          activities: (data.activities || []).map((a: any) => ({
            id: a.id,
            name: a.name,
            startTime: safeDate(a.startTime) || new Date(),
            endTime: safeDate(a.endTime) || undefined,
            tags: a.tags || [],
            caseId: a.caseId,
            taskId: a.taskId
          })),
          status: data.status || TimeTrackingStatus.CLOCKED_OUT,
          createdAt: safeDate(data.createdAt) || new Date(),
          updatedAt: safeDate(data.updatedAt),
          currentTaskId: data.currentTaskId,
          currentCaseId: data.currentCaseId
        });
      });
      
      setEntries(fetchedEntries);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching team time entries:', error);
      setEntries([]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [organizationId, startDateKey, endDateKey]);

  const analytics = useMemo((): TeamTimeAnalytics => {
    if (entries.length === 0) {
      return {
        users: [],
        teamTotals: {
          totalDaysWorked: 0,
          totalActiveHours: 0,
          totalBreakHours: 0,
          totalLoggedHours: 0,
          avgProductivity: 0,
          activeUsers: 0
        },
        loading
      };
    }

    // Group by user
    const userMap = new Map<string, {
      userId: string;
      userName: string;
      entries: TimeEntry[];
    }>();

    for (const entry of entries) {
      if (!userMap.has(entry.userId)) {
        userMap.set(entry.userId, {
          userId: entry.userId,
          userName: entry.userName,
          entries: []
        });
      }
      userMap.get(entry.userId)!.entries.push(entry);
    }

    // Calculate per-user metrics
    const users: TeamTimeAnalytics['users'] = [];
    let teamTotalDays = 0;
    let teamTotalActiveSeconds = 0;
    let teamTotalBreakSeconds = 0;
    let teamTotalLoggedSeconds = 0;
    let activeUsersCount = 0;

    for (const [userId, userData] of userMap) {
      let userActiveSeconds = 0;
      let userBreakSeconds = 0;
      let userLoggedSeconds = 0;
      let userDays = 0;
      let currentStatus: TimeTrackingStatus | null = null;

      for (const entry of userData.entries) {
        const clockIn = entry.clockIn;
        const clockOut = entry.clockOut;
        const sessionEnd = clockOut || new Date();
        
        userLoggedSeconds += durationInSeconds(clockIn, sessionEnd);
        
        // Calculate break time
        for (const breakItem of entry.breaks) {
          if (breakItem.endTime) {
            userBreakSeconds += durationInSeconds(breakItem.startTime, breakItem.endTime);
          } else if (!clockOut) {
            userBreakSeconds += durationInSeconds(breakItem.startTime, new Date());
          }
        }
        
        // Calculate active time from activities
        for (const activity of entry.activities) {
          if (activity.endTime) {
            userActiveSeconds += durationInSeconds(activity.startTime, activity.endTime);
          } else if (!clockOut) {
            userActiveSeconds += durationInSeconds(activity.startTime, new Date());
          }
        }
        
        if (entry.activities.length > 0 || durationInSeconds(clockIn, sessionEnd) > 300) {
          userDays++;
        }
        
        if (!clockOut) {
          currentStatus = entry.status;
        }
      }

      const userLoggedHours = userLoggedSeconds / 3600;
      const userActiveHours = userActiveSeconds / 3600;
      const productivity = userLoggedSeconds > 0 
        ? parseFloat(((userActiveSeconds / userLoggedSeconds) * 100).toFixed(1))
        : 0;

      users.push({
        userId,
        userName: userData.userName,
        totalDaysWorked: userDays,
        totalActiveHours: parseFloat(userActiveHours.toFixed(2)),
        totalLoggedHours: parseFloat(userLoggedHours.toFixed(2)),
        productivityPercentage: productivity,
        currentStatus
      });

      teamTotalDays += userDays;
      teamTotalActiveSeconds += userActiveSeconds;
      teamTotalBreakSeconds += userBreakSeconds;
      teamTotalLoggedSeconds += userLoggedSeconds;
      if (currentStatus === TimeTrackingStatus.CLOCKED_IN) {
        activeUsersCount++;
      }
    }

    return {
      users: users.sort((a, b) => b.totalLoggedHours - a.totalLoggedHours),
      teamTotals: {
        totalDaysWorked: teamTotalDays,
        totalActiveHours: parseFloat((teamTotalActiveSeconds / 3600).toFixed(2)),
        totalBreakHours: parseFloat((teamTotalBreakSeconds / 3600).toFixed(2)),
        totalLoggedHours: parseFloat((teamTotalLoggedSeconds / 3600).toFixed(2)),
        avgProductivity: teamTotalLoggedSeconds > 0
          ? parseFloat(((teamTotalActiveSeconds / teamTotalLoggedSeconds) * 100).toFixed(1))
          : 0,
        activeUsers: activeUsersCount
      },
      loading
    };
  }, [entries, loading]);

  return analytics;
};

// ========================================
// UTILITY FUNCTIONS
// ========================================

export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

export const formatHours = (hours: number): string => {
  const h = Math.floor(hours);
  const m = Math.floor((hours - h) * 60);
  
  if (h > 0) {
    return `${h}h ${m}m`;
  }
  return `${m}m`;
};
