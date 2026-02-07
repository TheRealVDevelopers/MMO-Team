import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { FIRESTORE_COLLECTIONS } from '../constants';
import * as XLSX from 'xlsx';

// ========================================
// SESSION TYPES
// ========================================

export type SessionType = 'LOGIN' | 'TASK' | 'BREAK' | 'IDLE' | 'UNTRACKED';

export interface DerivedSession {
  userId: string;
  userName: string;
  role: string;
  organizationName: string;
  
  caseId?: string;
  caseName?: string;
  
  taskId?: string;
  taskName?: string;
  taskType?: string;
  
  date: string;
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  
  sessionType: SessionType;
}

// ========================================
// HELPER FUNCTIONS
// ========================================

const safeDate = (val: any): Date | null => {
  if (!val) return null;
  if (val instanceof Date) return val;
  if (typeof val.toDate === 'function') return val.toDate();
  if (val.seconds) return new Date(val.seconds * 1000);
  return new Date(val);
};

const formatDateForExcel = (date: Date): string => {
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

const formatTimeForExcel = (date: Date): string => {
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

const calculateDuration = (start: Date, end: Date): number => {
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
};

// ========================================
// SESSION DERIVATION
// ========================================

interface TimeEntryData {
  id: string;
  userId: string;
  userName?: string;
  date: string;
  clockIn?: any;
  clockOut?: any;
  breaks?: Array<{
    id: string;
    startTime: any;
    endTime?: any;
    durationMinutes?: number;
  }>;
  activities?: Array<{
    id: string;
    name: string;
    startTime: any;
    endTime?: any;
    durationMinutes?: number;
    tags?: string[];
    caseId?: string;
    caseName?: string;
    taskType?: string;
  }>;
  status?: string;
}

interface UserData {
  id: string;
  name: string;
  role: string;
  organizationId?: string;
  organizationName?: string;
}

export const deriveSessionsFromTimeEntry = (
  entry: TimeEntryData,
  userData: UserData,
  organizationName: string = 'N/A'
): DerivedSession[] => {
  const sessions: DerivedSession[] = [];
  
  const clockIn = safeDate(entry.clockIn);
  const clockOut = safeDate(entry.clockOut);
  
  if (!clockIn) return sessions;
  
  const endTime = clockOut || new Date();
  
  // Collect all events with timestamps
  interface TimeEvent {
    time: Date;
    type: 'CLOCK_IN' | 'CLOCK_OUT' | 'BREAK_START' | 'BREAK_END' | 'TASK_START' | 'TASK_END';
    data?: any;
  }
  
  const events: TimeEvent[] = [];
  
  // Add clock in/out
  events.push({ time: clockIn, type: 'CLOCK_IN' });
  if (clockOut) {
    events.push({ time: clockOut, type: 'CLOCK_OUT' });
  }
  
  // Add breaks
  (entry.breaks || []).forEach(b => {
    const start = safeDate(b.startTime);
    const end = safeDate(b.endTime);
    if (start) events.push({ time: start, type: 'BREAK_START', data: b });
    if (end) events.push({ time: end, type: 'BREAK_END', data: b });
  });
  
  // Add activities (tasks)
  (entry.activities || []).forEach(a => {
    const start = safeDate(a.startTime);
    const end = safeDate(a.endTime);
    if (start) events.push({ time: start, type: 'TASK_START', data: a });
    if (end) events.push({ time: end, type: 'TASK_END', data: a });
  });
  
  // Sort events by time
  events.sort((a, b) => a.time.getTime() - b.time.getTime());
  
  // Process breaks into sessions
  (entry.breaks || []).forEach(b => {
    const start = safeDate(b.startTime);
    const end = safeDate(b.endTime) || endTime;
    if (start && end > start) {
      sessions.push({
        userId: entry.userId,
        userName: userData.name || entry.userName || 'Unknown',
        role: userData.role || 'N/A',
        organizationName,
        date: entry.date,
        startTime: start,
        endTime: end,
        durationMinutes: calculateDuration(start, end),
        sessionType: 'BREAK'
      });
    }
  });
  
  // Process activities into task sessions
  (entry.activities || []).forEach(a => {
    const start = safeDate(a.startTime);
    const end = safeDate(a.endTime) || endTime;
    if (start && end > start) {
      sessions.push({
        userId: entry.userId,
        userName: userData.name || entry.userName || 'Unknown',
        role: userData.role || 'N/A',
        organizationName,
        caseId: a.caseId,
        caseName: a.caseName,
        taskId: a.id,
        taskName: a.name,
        taskType: a.taskType || (a.tags?.[0] || 'task'),
        date: entry.date,
        startTime: start,
        endTime: end,
        durationMinutes: calculateDuration(start, end),
        sessionType: 'TASK'
      });
    }
  });
  
  // Add LOGIN session (full work day)
  if (clockIn && clockOut) {
    sessions.push({
      userId: entry.userId,
      userName: userData.name || entry.userName || 'Unknown',
      role: userData.role || 'N/A',
      organizationName,
      date: entry.date,
      startTime: clockIn,
      endTime: clockOut,
      durationMinutes: calculateDuration(clockIn, clockOut),
      sessionType: 'LOGIN'
    });
  }
  
  // Sort sessions by start time
  sessions.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  
  return sessions;
};

// Insert UNTRACKED gaps
export const insertUntrackedGaps = (
  sessions: DerivedSession[],
  userData: UserData,
  organizationName: string,
  date: string,
  clockIn: Date,
  clockOut: Date
): DerivedSession[] => {
  const GAP_THRESHOLD_MINUTES = 15;
  const result: DerivedSession[] = [];
  
  // Filter out LOGIN sessions for gap analysis (only task/break sessions)
  const workSessions = sessions
    .filter(s => s.sessionType === 'TASK' || s.sessionType === 'BREAK')
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  
  let lastEndTime = clockIn;
  
  for (const session of workSessions) {
    const gapMinutes = calculateDuration(lastEndTime, session.startTime);
    
    if (gapMinutes > GAP_THRESHOLD_MINUTES) {
      result.push({
        userId: userData.id,
        userName: userData.name,
        role: userData.role,
        organizationName,
        date,
        startTime: lastEndTime,
        endTime: session.startTime,
        durationMinutes: gapMinutes,
        sessionType: 'UNTRACKED'
      });
    }
    
    result.push(session);
    
    if (session.endTime > lastEndTime) {
      lastEndTime = session.endTime;
    }
  }
  
  // Check gap at end of day
  if (clockOut) {
    const finalGap = calculateDuration(lastEndTime, clockOut);
    if (finalGap > GAP_THRESHOLD_MINUTES && workSessions.length > 0) {
      result.push({
        userId: userData.id,
        userName: userData.name,
        role: userData.role,
        organizationName,
        date,
        startTime: lastEndTime,
        endTime: clockOut,
        durationMinutes: finalGap,
        sessionType: 'UNTRACKED'
      });
    }
  }
  
  // Add LOGIN session back
  const loginSession = sessions.find(s => s.sessionType === 'LOGIN');
  if (loginSession) {
    result.unshift(loginSession);
  }
  
  return result.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
};

// ========================================
// DATA FETCHING
// ========================================

const fetchUserData = async (userIds: string[]): Promise<Map<string, UserData>> => {
  const userMap = new Map<string, UserData>();
  
  if (userIds.length === 0) return userMap;
  
  // Fetch in batches of 10 (Firestore limit)
  const batches: string[][] = [];
  for (let i = 0; i < userIds.length; i += 10) {
    batches.push(userIds.slice(i, i + 10));
  }
  
  for (const batch of batches) {
    const q = query(
      collection(db, FIRESTORE_COLLECTIONS.STAFF_USERS),
      where('__name__', 'in', batch)
    );
    const snapshot = await getDocs(q);
    snapshot.forEach(doc => {
      const data = doc.data();
      userMap.set(doc.id, {
        id: doc.id,
        name: data.name || 'Unknown',
        role: data.role || 'N/A',
        organizationId: data.organizationId,
        organizationName: data.organizationName
      });
    });
  }
  
  return userMap;
};

const fetchOrganizationNames = async (orgIds: string[]): Promise<Map<string, string>> => {
  const orgMap = new Map<string, string>();
  const uniqueOrgIds = [...new Set(orgIds.filter(Boolean))];
  
  if (uniqueOrgIds.length === 0) return orgMap;
  
  const batches: string[][] = [];
  for (let i = 0; i < uniqueOrgIds.length; i += 10) {
    batches.push(uniqueOrgIds.slice(i, i + 10));
  }
  
  for (const batch of batches) {
    const q = query(
      collection(db, FIRESTORE_COLLECTIONS.ORGANIZATIONS),
      where('__name__', 'in', batch)
    );
    const snapshot = await getDocs(q);
    snapshot.forEach(doc => {
      const data = doc.data();
      orgMap.set(doc.id, data.name || 'Unknown Org');
    });
  }
  
  return orgMap;
};

const fetchTimeEntries = async (
  startDate: string,
  endDate: string,
  userId?: string,
  organizationId?: string
): Promise<TimeEntryData[]> => {
  let q;
  
  if (userId) {
    q = query(
      collection(db, FIRESTORE_COLLECTIONS.TIME_ENTRIES),
      where('userId', '==', userId),
      where('date', '>=', startDate),
      where('date', '<=', endDate)
    );
  } else {
    q = query(
      collection(db, FIRESTORE_COLLECTIONS.TIME_ENTRIES),
      where('date', '>=', startDate),
      where('date', '<=', endDate)
    );
  }
  
  const snapshot = await getDocs(q);
  const entries: TimeEntryData[] = [];
  
  snapshot.forEach(doc => {
    const data = doc.data() as Record<string, any>;
    entries.push({
      id: doc.id,
      ...data
    } as TimeEntryData);
  });
  
  // Filter by organization if needed (post-query)
  if (organizationId) {
    const userIds = [...new Set(entries.map(e => e.userId))];
    const userData = await fetchUserData(userIds);
    return entries.filter(e => {
      const user = userData.get(e.userId);
      return user?.organizationId === organizationId;
    });
  }
  
  return entries;
};

// ========================================
// EXCEL GENERATION
// ========================================

const sessionsToExcelRows = (sessions: DerivedSession[]): any[] => {
  return sessions.map(s => ({
    'Date': formatDateForExcel(s.startTime),
    'User Name': s.userName,
    'Role': s.role,
    'Organization': s.organizationName,
    'Case': s.caseName || '-',
    'Task': s.taskName || '-',
    'Task Type': s.taskType || '-',
    'Start Time': formatTimeForExcel(s.startTime),
    'End Time': formatTimeForExcel(s.endTime),
    'Duration (Minutes)': s.durationMinutes,
    'Session Type': s.sessionType
  }));
};

const generateExcel = (rows: any[], filename: string): void => {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  
  // Set column widths
  worksheet['!cols'] = [
    { wch: 12 }, // Date
    { wch: 20 }, // User Name
    { wch: 15 }, // Role
    { wch: 20 }, // Organization
    { wch: 25 }, // Case
    { wch: 30 }, // Task
    { wch: 15 }, // Task Type
    { wch: 12 }, // Start Time
    { wch: 12 }, // End Time
    { wch: 18 }, // Duration
    { wch: 15 }, // Session Type
  ];
  
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Timesheet');
  
  // Trigger download
  XLSX.writeFile(workbook, filename);
};

// ========================================
// EXPORT FUNCTIONS
// ========================================

export const exportUserTimesheet = async (
  userId: string,
  userName: string,
  startDate: string,
  endDate: string
): Promise<void> => {
  const entries = await fetchTimeEntries(startDate, endDate, userId);
  
  if (entries.length === 0) {
    alert('No time entries found for this user in the selected date range.');
    return;
  }
  
  const userData = await fetchUserData([userId]);
  const user = userData.get(userId) || {
    id: userId,
    name: userName,
    role: 'N/A'
  };
  
  const orgIds = [...userData.values()].map(u => u.organizationId).filter(Boolean) as string[];
  const orgNames = await fetchOrganizationNames(orgIds);
  const orgName = user.organizationId ? orgNames.get(user.organizationId) || 'N/A' : 'N/A';
  
  let allSessions: DerivedSession[] = [];
  
  for (const entry of entries) {
    const sessions = deriveSessionsFromTimeEntry(entry, user, orgName);
    
    // Insert untracked gaps
    const clockIn = safeDate(entry.clockIn);
    const clockOut = safeDate(entry.clockOut);
    
    if (clockIn && clockOut) {
      const withGaps = insertUntrackedGaps(sessions, user, orgName, entry.date, clockIn, clockOut);
      allSessions = allSessions.concat(withGaps);
    } else {
      allSessions = allSessions.concat(sessions);
    }
  }
  
  const rows = sessionsToExcelRows(allSessions);
  const sanitizedName = userName.replace(/[^a-zA-Z0-9]/g, '_');
  generateExcel(rows, `Timesheet_${sanitizedName}_${startDate}_to_${endDate}.xlsx`);
};

export const exportCaseTimesheet = async (
  caseId: string,
  caseName: string,
  startDate: string,
  endDate: string
): Promise<void> => {
  // Fetch all time entries in date range
  const allEntries = await fetchTimeEntries(startDate, endDate);
  
  // Filter entries that have activities for this case
  const relevantEntries = allEntries.filter(entry =>
    (entry.activities || []).some(a => a.caseId === caseId)
  );
  
  if (relevantEntries.length === 0) {
    alert('No time entries found for this project in the selected date range.');
    return;
  }
  
  const userIds = [...new Set(relevantEntries.map(e => e.userId))];
  const userData = await fetchUserData(userIds);
  const orgIds = [...userData.values()].map(u => u.organizationId).filter(Boolean) as string[];
  const orgNames = await fetchOrganizationNames(orgIds);
  
  let allSessions: DerivedSession[] = [];
  
  for (const entry of relevantEntries) {
    const user = userData.get(entry.userId) || {
      id: entry.userId,
      name: entry.userName || 'Unknown',
      role: 'N/A'
    };
    const orgName = user.organizationId ? orgNames.get(user.organizationId) || 'N/A' : 'N/A';
    
    const sessions = deriveSessionsFromTimeEntry(entry, user, orgName);
    
    // Filter only sessions for this case
    const caseSessions = sessions.filter(s => s.caseId === caseId);
    allSessions = allSessions.concat(caseSessions);
  }
  
  const rows = sessionsToExcelRows(allSessions);
  const sanitizedName = caseName.replace(/[^a-zA-Z0-9]/g, '_');
  generateExcel(rows, `Timesheet_Project_${sanitizedName}_${startDate}_to_${endDate}.xlsx`);
};

export const exportOrganizationTimesheet = async (
  organizationId: string,
  organizationName: string,
  startDate: string,
  endDate: string
): Promise<void> => {
  const entries = await fetchTimeEntries(startDate, endDate, undefined, organizationId);
  
  if (entries.length === 0) {
    alert('No time entries found for this organization in the selected date range.');
    return;
  }
  
  const userIds = [...new Set(entries.map(e => e.userId))];
  const userData = await fetchUserData(userIds);
  
  let allSessions: DerivedSession[] = [];
  
  for (const entry of entries) {
    const user = userData.get(entry.userId) || {
      id: entry.userId,
      name: entry.userName || 'Unknown',
      role: 'N/A'
    };
    
    const sessions = deriveSessionsFromTimeEntry(entry, user, organizationName);
    
    const clockIn = safeDate(entry.clockIn);
    const clockOut = safeDate(entry.clockOut);
    
    if (clockIn && clockOut) {
      const withGaps = insertUntrackedGaps(sessions, user, organizationName, entry.date, clockIn, clockOut);
      allSessions = allSessions.concat(withGaps);
    } else {
      allSessions = allSessions.concat(sessions);
    }
  }
  
  const rows = sessionsToExcelRows(allSessions);
  const sanitizedName = organizationName.replace(/[^a-zA-Z0-9]/g, '_');
  generateExcel(rows, `Timesheet_Org_${sanitizedName}_${startDate}_to_${endDate}.xlsx`);
};

export const exportRawTimeEntries = async (
  startDate: string,
  endDate: string
): Promise<void> => {
  const entries = await fetchTimeEntries(startDate, endDate);
  
  if (entries.length === 0) {
    alert('No time entries found in the selected date range.');
    return;
  }
  
  const userIds = [...new Set(entries.map(e => e.userId))];
  const userData = await fetchUserData(userIds);
  const orgIds = [...userData.values()].map(u => u.organizationId).filter(Boolean) as string[];
  const orgNames = await fetchOrganizationNames(orgIds);
  
  let allSessions: DerivedSession[] = [];
  
  for (const entry of entries) {
    const user = userData.get(entry.userId) || {
      id: entry.userId,
      name: entry.userName || 'Unknown',
      role: 'N/A'
    };
    const orgName = user.organizationId ? orgNames.get(user.organizationId) || 'N/A' : 'N/A';
    
    const sessions = deriveSessionsFromTimeEntry(entry, user, orgName);
    
    const clockIn = safeDate(entry.clockIn);
    const clockOut = safeDate(entry.clockOut);
    
    if (clockIn && clockOut) {
      const withGaps = insertUntrackedGaps(sessions, user, orgName, entry.date, clockIn, clockOut);
      allSessions = allSessions.concat(withGaps);
    } else {
      allSessions = allSessions.concat(sessions);
    }
  }
  
  const rows = sessionsToExcelRows(allSessions);
  generateExcel(rows, `Timesheet_All_${startDate}_to_${endDate}.xlsx`);
};

// ========================================
// SUMMARY EXPORT (Aggregated by User)
// ========================================

export const exportTimesheetSummary = async (
  startDate: string,
  endDate: string,
  organizationId?: string
): Promise<void> => {
  const entries = await fetchTimeEntries(startDate, endDate, undefined, organizationId);
  
  if (entries.length === 0) {
    alert('No time entries found in the selected date range.');
    return;
  }
  
  const userIds = [...new Set(entries.map(e => e.userId))];
  const userData = await fetchUserData(userIds);
  const orgIds = [...userData.values()].map(u => u.organizationId).filter(Boolean) as string[];
  const orgNames = await fetchOrganizationNames(orgIds);
  
  // Aggregate by user
  const userSummary = new Map<string, {
    userName: string;
    role: string;
    organization: string;
    totalLoginMinutes: number;
    totalTaskMinutes: number;
    totalBreakMinutes: number;
    totalUntrackedMinutes: number;
    daysWorked: number;
  }>();
  
  for (const entry of entries) {
    const user = userData.get(entry.userId) || {
      id: entry.userId,
      name: entry.userName || 'Unknown',
      role: 'N/A'
    };
    const orgName = user.organizationId ? orgNames.get(user.organizationId) || 'N/A' : 'N/A';
    
    const sessions = deriveSessionsFromTimeEntry(entry, user, orgName);
    
    const clockIn = safeDate(entry.clockIn);
    const clockOut = safeDate(entry.clockOut);
    
    let processedSessions = sessions;
    if (clockIn && clockOut) {
      processedSessions = insertUntrackedGaps(sessions, user, orgName, entry.date, clockIn, clockOut);
    }
    
    if (!userSummary.has(entry.userId)) {
      userSummary.set(entry.userId, {
        userName: user.name,
        role: user.role,
        organization: orgName,
        totalLoginMinutes: 0,
        totalTaskMinutes: 0,
        totalBreakMinutes: 0,
        totalUntrackedMinutes: 0,
        daysWorked: 0
      });
    }
    
    const summary = userSummary.get(entry.userId)!;
    summary.daysWorked++;
    
    for (const session of processedSessions) {
      switch (session.sessionType) {
        case 'LOGIN':
          summary.totalLoginMinutes += session.durationMinutes;
          break;
        case 'TASK':
          summary.totalTaskMinutes += session.durationMinutes;
          break;
        case 'BREAK':
          summary.totalBreakMinutes += session.durationMinutes;
          break;
        case 'UNTRACKED':
          summary.totalUntrackedMinutes += session.durationMinutes;
          break;
      }
    }
  }
  
  const summaryRows = Array.from(userSummary.values()).map(s => ({
    'User Name': s.userName,
    'Role': s.role,
    'Organization': s.organization,
    'Days Worked': s.daysWorked,
    'Total Login (Hours)': (s.totalLoginMinutes / 60).toFixed(2),
    'Active Task Time (Hours)': (s.totalTaskMinutes / 60).toFixed(2),
    'Break Time (Hours)': (s.totalBreakMinutes / 60).toFixed(2),
    'Untracked Time (Hours)': (s.totalUntrackedMinutes / 60).toFixed(2),
    'Productivity %': s.totalLoginMinutes > 0 
      ? ((s.totalTaskMinutes / s.totalLoginMinutes) * 100).toFixed(1) 
      : '0.0'
  }));
  
  const worksheet = XLSX.utils.json_to_sheet(summaryRows);
  worksheet['!cols'] = [
    { wch: 20 }, { wch: 15 }, { wch: 20 }, { wch: 12 },
    { wch: 18 }, { wch: 22 }, { wch: 18 }, { wch: 22 }, { wch: 15 }
  ];
  
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Summary');
  
  XLSX.writeFile(workbook, `Timesheet_Summary_${startDate}_to_${endDate}.xlsx`);
};

// ========================================
// TIME ANALYTICS EXPORT
// ========================================

export interface TimeAnalyticsRow {
  'User Name': string;
  'Role': string;
  'Organization': string;
  'Period': string;
  'Total Days Worked': number;
  'Total Logged Hours': string;
  'Total Active Hours': string;
  'Total Break Hours': string;
  'Total Idle Hours': string;
  'Avg Daily Hours': string;
  'Productivity %': string;
  'Active Sessions': number;
  'Break Sessions': number;
  'Task Sessions': number;
}

export const exportTimeAnalytics = async (
  startDate: string,
  endDate: string,
  organizationId?: string
): Promise<void> => {
  const entries = await fetchTimeEntries(startDate, endDate, undefined, organizationId);
  
  if (entries.length === 0) {
    alert('No time entries found in the selected date range.');
    return;
  }
  
  const userIds = [...new Set(entries.map(e => e.userId))];
  const userData = await fetchUserData(userIds);
  const orgIds = [...userData.values()].map(u => u.organizationId).filter(Boolean) as string[];
  const orgNames = await fetchOrganizationNames(orgIds);
  
  // Group entries by user
  const userEntries = new Map<string, TimeEntryData[]>();
  for (const entry of entries) {
    if (!userEntries.has(entry.userId)) {
      userEntries.set(entry.userId, []);
    }
    userEntries.get(entry.userId)!.push(entry);
  }
  
  const analyticsRows: TimeAnalyticsRow[] = [];
  
  for (const [userId, userEntriesList] of userEntries) {
    const user = userData.get(userId) || {
      id: userId,
      name: 'Unknown',
      role: 'N/A'
    };
    const orgName = user.organizationId ? orgNames.get(user.organizationId) || 'N/A' : 'N/A';
    
    let totalLoggedMinutes = 0;
    let totalActiveMinutes = 0;
    let totalBreakMinutes = 0;
    let activeSessions = 0;
    let breakSessions = 0;
    let taskSessions = 0;
    const daysWorked = new Set(userEntriesList.map(e => e.date)).size;
    
    for (const entry of userEntriesList) {
      const clockIn = safeDate(entry.clockIn);
      const clockOut = safeDate(entry.clockOut);
      
      if (clockIn) {
        const sessionEnd = clockOut || new Date();
        totalLoggedMinutes += calculateDuration(clockIn, sessionEnd);
      }
      
      // Count sessions
      (entry.activities || []).forEach(a => {
        const start = safeDate(a.startTime);
        const end = safeDate(a.endTime);
        if (start && end && end > start) {
          totalActiveMinutes += calculateDuration(start, end);
          taskSessions++;
        }
      });
      
      (entry.breaks || []).forEach(b => {
        const start = safeDate(b.startTime);
        const end = safeDate(b.endTime);
        if (start && end && end > start) {
          totalBreakMinutes += calculateDuration(start, end);
          breakSessions++;
        }
      });
      
      if (clockIn && clockOut) {
        activeSessions++;
      }
    }
    
    const totalLoggedHours = totalLoggedMinutes / 60;
    const totalActiveHours = totalActiveMinutes / 60;
    const totalBreakHours = totalBreakMinutes / 60;
    const totalIdleHours = Math.max(0, totalLoggedHours - totalActiveHours - totalBreakHours);
    const avgDailyHours = daysWorked > 0 ? totalLoggedHours / daysWorked : 0;
    const productivity = totalLoggedHours > 0 ? (totalActiveHours / totalLoggedHours) * 100 : 0;
    
    analyticsRows.push({
      'User Name': user.name,
      'Role': user.role,
      'Organization': orgName,
      'Period': `${startDate} to ${endDate}`,
      'Total Days Worked': daysWorked,
      'Total Logged Hours': totalLoggedHours.toFixed(2),
      'Total Active Hours': totalActiveHours.toFixed(2),
      'Total Break Hours': totalBreakHours.toFixed(2),
      'Total Idle Hours': totalIdleHours.toFixed(2),
      'Avg Daily Hours': avgDailyHours.toFixed(2),
      'Productivity %': productivity.toFixed(1),
      'Active Sessions': activeSessions,
      'Break Sessions': breakSessions,
      'Task Sessions': taskSessions
    });
  }
  
  const worksheet = XLSX.utils.json_to_sheet(analyticsRows);
  worksheet['!cols'] = [
    { wch: 20 }, { wch: 15 }, { wch: 20 }, { wch: 25 },
    { wch: 15 }, { wch: 18 }, { wch: 18 }, { wch: 18 },
    { wch: 18 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
    { wch: 15 }, { wch: 15 }
  ];
  
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Time Analytics');
  
  XLSX.writeFile(workbook, `Time_Analytics_${startDate}_to_${endDate}.xlsx`);
};

// ========================================
// TIME AUDITING EXPORT
// ========================================

export interface TimeAuditRow {
  'Date': string;
  'User Name': string;
  'Clock In': string;
  'Clock Out': string;
  'Expected Hours': number;
  'Actual Hours': string;
  'Variance': string;
  'Status': string;
  'Break Count': number;
  'Total Break Minutes': number;
  'Activity Count': number;
  'Compliance Status': string;
  'Notes': string;
}

export const exportTimeAudit = async (
  startDate: string,
  endDate: string,
  organizationId?: string,
  expectedDailyHours: number = 8
): Promise<void> => {
  const entries = await fetchTimeEntries(startDate, endDate, undefined, organizationId);
  
  if (entries.length === 0) {
    alert('No time entries found in the selected date range.');
    return;
  }
  
  const userIds = [...new Set(entries.map(e => e.userId))];
  const userData = await fetchUserData(userIds);
  const orgIds = [...userData.values()].map(u => u.organizationId).filter(Boolean) as string[];
  const orgNames = await fetchOrganizationNames(orgIds);
  
  const auditRows: TimeAuditRow[] = [];
  
  for (const entry of entries) {
    const user = userData.get(entry.userId) || {
      id: entry.userId,
      name: entry.userName || 'Unknown',
      role: 'N/A'
    };
    
    const clockIn = safeDate(entry.clockIn);
    const clockOut = safeDate(entry.clockOut);
    
    if (!clockIn) continue;
    
    const sessionEnd = clockOut || new Date();
    const actualMinutes = calculateDuration(clockIn, sessionEnd);
    const actualHours = actualMinutes / 60;
    const expectedMinutes = expectedDailyHours * 60;
    const varianceMinutes = actualMinutes - expectedMinutes;
    const varianceHours = varianceMinutes / 60;
    
    // Determine status
    let status = 'Complete';
    if (!clockOut) {
      status = 'In Progress';
    } else if (actualHours < expectedDailyHours * 0.5) {
      status = 'Incomplete';
    } else if (actualHours < expectedDailyHours * 0.875) {
      status = 'Partial';
    }
    
    // Calculate break time
    let totalBreakMinutes = 0;
    let breakCount = 0;
    (entry.breaks || []).forEach(b => {
      const start = safeDate(b.startTime);
      const end = safeDate(b.endTime);
      if (start && end && end > start) {
        totalBreakMinutes += calculateDuration(start, end);
        breakCount++;
      }
    });
    
    // Activity count
    const activityCount = (entry.activities || []).length;
    
    // Compliance check
    let complianceStatus = 'Compliant';
    let notes = '';
    
    if (!clockOut) {
      complianceStatus = 'Pending';
      notes = 'Not clocked out';
    } else if (actualHours > 12) {
      complianceStatus = 'Review Required';
      notes = 'Excessive hours logged';
    } else if (actualHours < 4) {
      complianceStatus = 'Review Required';
      notes = 'Insufficient hours logged';
    } else if (breakCount === 0 && actualHours > 6) {
      complianceStatus = 'Non-Compliant';
      notes = 'No break taken for long shift';
    } else if (totalBreakMinutes > 120) {
      complianceStatus = 'Review Required';
      notes = 'Excessive break time';
    } else if (activityCount === 0 && actualHours > 2) {
      complianceStatus = 'Review Required';
      notes = 'No task activities recorded';
    }
    
    auditRows.push({
      'Date': entry.date,
      'User Name': user.name,
      'Clock In': formatTimeForExcel(clockIn),
      'Clock Out': clockOut ? formatTimeForExcel(clockOut) : '-',
      'Expected Hours': expectedDailyHours,
      'Actual Hours': actualHours.toFixed(2),
      'Variance': (varianceHours >= 0 ? '+' : '') + varianceHours.toFixed(2),
      'Status': status,
      'Break Count': breakCount,
      'Total Break Minutes': totalBreakMinutes,
      'Activity Count': activityCount,
      'Compliance Status': complianceStatus,
      'Notes': notes
    });
  }
  
  // Sort by date then user
  auditRows.sort((a, b) => {
    const dateCompare = a['Date'].localeCompare(b['Date']);
    if (dateCompare !== 0) return dateCompare;
    return a['User Name'].localeCompare(b['User Name']);
  });
  
  const worksheet = XLSX.utils.json_to_sheet(auditRows);
  worksheet['!cols'] = [
    { wch: 12 }, { wch: 20 }, { wch: 12 }, { wch: 12 },
    { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 12 },
    { wch: 12 }, { wch: 18 }, { wch: 15 }, { wch: 18 }, { wch: 30 }
  ];
  
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Time Audit');
  
  XLSX.writeFile(workbook, `Time_Audit_${startDate}_to_${endDate}.xlsx`);
};

// ========================================
// TIME DISCREPANCY REPORT
// ========================================

export interface DiscrepancyRow {
  'Date': string;
  'User Name': string;
  'Issue Type': string;
  'Severity': string;
  'Details': string;
  'Recommended Action': string;
}

export const exportTimeDiscrepancyReport = async (
  startDate: string,
  endDate: string,
  organizationId?: string
): Promise<void> => {
  const entries = await fetchTimeEntries(startDate, endDate, undefined, organizationId);
  
  if (entries.length === 0) {
    alert('No time entries found in the selected date range.');
    return;
  }
  
  const userIds = [...new Set(entries.map(e => e.userId))];
  const userData = await fetchUserData(userIds);
  
  const discrepancies: DiscrepancyRow[] = [];
  
  for (const entry of entries) {
    const user = userData.get(entry.userId) || {
      id: entry.userId,
      name: entry.userName || 'Unknown',
      role: 'N/A'
    };
    
    const clockIn = safeDate(entry.clockIn);
    const clockOut = safeDate(entry.clockOut);
    
    if (!clockIn) continue;
    
    const sessionEnd = clockOut || new Date();
    const totalMinutes = calculateDuration(clockIn, sessionEnd);
    const totalHours = totalMinutes / 60;
    
    // Check for various discrepancies
    
    // 1. Missing clock out
    if (!clockOut) {
      const hoursSinceClockIn = (new Date().getTime() - clockIn.getTime()) / (1000 * 60 * 60);
      if (hoursSinceClockIn > 16) {
        discrepancies.push({
          'Date': entry.date,
          'User Name': user.name,
          'Issue Type': 'Missing Clock Out',
          'Severity': 'High',
          'Details': `Clocked in at ${formatTimeForExcel(clockIn)} but never clocked out. ${hoursSinceClockIn.toFixed(1)} hours elapsed.`,
          'Recommended Action': 'Contact employee to confirm actual end time and update record.'
        });
      }
    }
    
    // 2. Excessive hours
    if (totalHours > 14) {
      discrepancies.push({
        'Date': entry.date,
        'User Name': user.name,
        'Issue Type': 'Excessive Hours',
        'Severity': 'High',
        'Details': `Logged ${totalHours.toFixed(1)} hours in a single day.`,
        'Recommended Action': 'Verify overtime authorization and check for data entry errors.'
      });
    }
    
    // 3. Very short shift
    if (totalHours < 2 && clockOut) {
      discrepancies.push({
        'Date': entry.date,
        'User Name': user.name,
        'Issue Type': 'Short Shift',
        'Severity': 'Medium',
        'Details': `Only ${totalHours.toFixed(1)} hours logged.`,
        'Recommended Action': 'Verify if this was a partial day or data entry error.'
      });
    }
    
    // 4. No activities recorded
    const activityCount = (entry.activities || []).length;
    if (activityCount === 0 && totalHours > 3) {
      discrepancies.push({
        'Date': entry.date,
        'User Name': user.name,
        'Issue Type': 'No Task Activities',
        'Severity': 'Medium',
        'Details': `${totalHours.toFixed(1)} hours logged but no task activities recorded.`,
        'Recommended Action': 'Employee should be reminded to log task activities during work hours.'
      });
    }
    
    // 5. Excessive breaks
    let totalBreakMinutes = 0;
    (entry.breaks || []).forEach(b => {
      const start = safeDate(b.startTime);
      const end = safeDate(b.endTime);
      if (start && end && end > start) {
        totalBreakMinutes += calculateDuration(start, end);
      }
    });
    
    if (totalBreakMinutes > 120) {
      discrepancies.push({
        'Date': entry.date,
        'User Name': user.name,
        'Issue Type': 'Excessive Break Time',
        'Severity': 'Medium',
        'Details': `Total break time: ${(totalBreakMinutes / 60).toFixed(1)} hours.`,
        'Recommended Action': 'Review break policy compliance with employee.'
      });
    }
    
    // 6. Late clock in (after 10 AM)
    const clockInHour = clockIn.getHours();
    if (clockInHour >= 10 && clockInHour < 14) {
      discrepancies.push({
        'Date': entry.date,
        'User Name': user.name,
        'Issue Type': 'Late Clock In',
        'Severity': 'Low',
        'Details': `Clocked in at ${formatTimeForExcel(clockIn)}.`,
        'Recommended Action': 'Verify if this was approved late arrival.'
      });
    }
    
    // 7. Very early clock in (before 6 AM)
    if (clockInHour < 6) {
      discrepancies.push({
        'Date': entry.date,
        'User Name': user.name,
        'Issue Type': 'Early Clock In',
        'Severity': 'Low',
        'Details': `Clocked in at ${formatTimeForExcel(clockIn)}.`,
        'Recommended Action': 'Verify if early start was authorized.'
      });
    }
  }
  
  if (discrepancies.length === 0) {
    alert('No discrepancies found in the selected date range. All time entries appear compliant.');
    return;
  }
  
  // Sort by severity then date
  const severityOrder = { 'High': 0, 'Medium': 1, 'Low': 2 };
  discrepancies.sort((a, b) => {
    const sevCompare = severityOrder[a['Severity'] as keyof typeof severityOrder] - severityOrder[b['Severity'] as keyof typeof severityOrder];
    if (sevCompare !== 0) return sevCompare;
    return a['Date'].localeCompare(b['Date']);
  });
  
  const worksheet = XLSX.utils.json_to_sheet(discrepancies);
  worksheet['!cols'] = [
    { wch: 12 }, { wch: 20 }, { wch: 20 }, { wch: 10 },
    { wch: 50 }, { wch: 50 }
  ];
  
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Discrepancies');
  
  XLSX.writeFile(workbook, `Time_Discrepancy_Report_${startDate}_to_${endDate}.xlsx`);
};

// ========================================
// PAYMENT PROCESSING EXPORT
// ========================================

export interface PaymentProcessingRow {
  'User ID': string;
  'User Name': string;
  'Role': string;
  'Organization': string;
  'Period': string;
  'Total Hours': string;
  'Regular Hours': string;
  'Overtime Hours': string;
  'Hourly Rate': string;
  'Regular Pay': string;
  'Overtime Pay': string;
  'Total Pay': string;
  'Status': string;
}

export const exportPaymentProcessing = async (
  startDate: string,
  endDate: string,
  organizationId?: string,
  hourlyRates?: Map<string, number>, // userId -> rate
  overtimeThreshold: number = 8 // hours per day before overtime
): Promise<void> => {
  const entries = await fetchTimeEntries(startDate, endDate, undefined, organizationId);
  
  if (entries.length === 0) {
    alert('No time entries found in the selected date range.');
    return;
  }
  
  const userIds = [...new Set(entries.map(e => e.userId))];
  const userData = await fetchUserData(userIds);
  const orgIds = [...userData.values()].map(u => u.organizationId).filter(Boolean) as string[];
  const orgNames = await fetchOrganizationNames(orgIds);
  
  // Group entries by user
  const userEntries = new Map<string, TimeEntryData[]>();
  for (const entry of entries) {
    if (!userEntries.has(entry.userId)) {
      userEntries.set(entry.userId, []);
    }
    userEntries.get(entry.userId)!.push(entry);
  }
  
  const paymentRows: PaymentProcessingRow[] = [];
  
  for (const [userId, userEntriesList] of userEntries) {
    const user = userData.get(userId) || {
      id: userId,
      name: 'Unknown',
      role: 'N/A'
    };
    const orgName = user.organizationId ? orgNames.get(user.organizationId) || 'N/A' : 'N/A';
    
    let totalHours = 0;
    let regularHours = 0;
    let overtimeHours = 0;
    
    for (const entry of userEntriesList) {
      const clockIn = safeDate(entry.clockIn);
      const clockOut = safeDate(entry.clockOut);
      
      if (!clockIn || !clockOut) continue;
      
      const entryHours = calculateDuration(clockIn, clockOut) / 60;
      totalHours += entryHours;
      
      // Calculate regular vs overtime per day
      if (entryHours <= overtimeThreshold) {
        regularHours += entryHours;
      } else {
        regularHours += overtimeThreshold;
        overtimeHours += (entryHours - overtimeThreshold);
      }
    }
    
    const rate = hourlyRates?.get(userId) || 0;
    const regularPay = regularHours * rate;
    const overtimePay = overtimeHours * (rate * 1.5); // 1.5x overtime
    const totalPay = regularPay + overtimePay;
    
    // Determine status - check if any entry is incomplete
    let status = 'Pending';
    if (totalHours === 0) {
      status = 'No Data';
    } else if (userEntriesList.some(e => !e.clockOut)) {
      status = 'Incomplete';
    }
    
    paymentRows.push({
      'User ID': userId,
      'User Name': user.name,
      'Role': user.role,
      'Organization': orgName,
      'Period': `${startDate} to ${endDate}`,
      'Total Hours': totalHours.toFixed(2),
      'Regular Hours': regularHours.toFixed(2),
      'Overtime Hours': overtimeHours.toFixed(2),
      'Hourly Rate': rate > 0 ? rate.toFixed(2) : 'N/A',
      'Regular Pay': rate > 0 ? regularPay.toFixed(2) : 'N/A',
      'Overtime Pay': rate > 0 ? overtimePay.toFixed(2) : 'N/A',
      'Total Pay': rate > 0 ? totalPay.toFixed(2) : 'N/A',
      'Status': status
    });
  }
  
  // Sort by organization then user
  paymentRows.sort((a, b) => {
    const orgCompare = a['Organization'].localeCompare(b['Organization']);
    if (orgCompare !== 0) return orgCompare;
    return a['User Name'].localeCompare(b['User Name']);
  });
  
  const worksheet = XLSX.utils.json_to_sheet(paymentRows);
  worksheet['!cols'] = [
    { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 20 }, { wch: 25 },
    { wch: 12 }, { wch: 14 }, { wch: 16 }, { wch: 12 }, { wch: 12 },
    { wch: 14 }, { wch: 12 }, { wch: 12 }
  ];
  
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Payment Processing');
  
  XLSX.writeFile(workbook, `Payment_Processing_${startDate}_to_${endDate}.xlsx`);
};
