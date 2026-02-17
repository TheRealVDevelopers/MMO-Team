import React, { useState, useMemo, useEffect } from 'react';
import { User, UserRole, LeadPipelineStatus, ActivityStatus, ProjectStatus } from '../../../types';
import { formatCurrencyINR, formatDateTime } from '../../../constants';
import { useProjects } from '../../../hooks/useProjects';
import { useLeads } from '../../../hooks/useLeads';
import {
    PresentationChartBarIcon,
    CheckCircleIcon,
    DocumentCheckIcon,
    FunnelIcon,
    UserCircleIcon,
    CalendarIcon,
    PhoneIcon,
    ArrowTrendingUpIcon,
    ClockIcon,
    BriefcaseIcon,
    MapPinIcon,
    ArrowDownTrayIcon,
    PauseCircleIcon
} from '@heroicons/react/24/outline';
import AttendanceCalendar from './AttendanceCalendar';
import { ContentCard, cn, staggerContainer } from '../shared/DashboardUI';
import { motion, AnimatePresence } from 'framer-motion';
import { useTeamTasks } from '../../../hooks/useTeamTasks';
import { TaskStatus, Attendance, AttendanceStatus, TimeTrackingStatus } from '../../../types';
import { useTimeAnalytics } from '../../../hooks/useTimeAnalytics';
import { useLiveStaffUser } from '../../../hooks/useLiveStaffUser';
import DailyDeploymentTimeline from './DailyDeploymentTimeline';
import ExportDeploymentReportModal from '../shared/ExportDeploymentReportModal'; // Import Modal // Import Timeline Component

const TabButton: React.FC<{
    icon: React.ElementType;
    label: string;
    isActive: boolean;
    onClick: () => void;
}> = ({ icon: Icon, label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={cn(
            "flex items-center gap-2 px-6 py-4 text-xs font-black uppercase tracking-widest transition-all relative",
            isActive
                ? "text-primary"
                : "text-text-tertiary hover:text-text-primary"
        )}
    >
        <Icon className="w-4 h-4" />
        <span>{label}</span>
        {isActive && (
            <motion.div
                layoutId="activeTabUnderline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
            />
        )}
    </button>
);

const UserMetric: React.FC<{ title: string; value: string | number; icon: React.ElementType }> = ({ title, value, icon: Icon }) => (
    <div className="bg-subtle-background p-4 rounded-2xl border border-border/40 group hover:border-primary/20 transition-all">
        <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <Icon className="w-4 h-4" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-text-tertiary">{title}</p>
        </div>
        <p className="text-xl font-serif font-black text-text-primary tracking-tight">{value}</p>
    </div>
);


const TeamMemberDetailView: React.FC<{ user: User; initialTab?: 'history'; initialDate?: string }> = ({ user, initialTab, initialDate }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'attendance'>(initialTab || 'overview');
    const [selectedDate, setSelectedDate] = useState<string>(initialDate || new Date().toLocaleDateString('en-CA'));
    const [isExportOpen, setIsExportOpen] = useState(false); // Export State

    // Sync state with props
    useEffect(() => {
        if (initialTab) {
            setActiveTab(initialTab);
        }
    }, [initialTab]);

    useEffect(() => {
        if (initialDate) {
            setSelectedDate(initialDate);
        }
    }, [initialDate]);

    // Date range filter state
    const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'custom'>('month');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');

    const { tasks, loading } = useTeamTasks(undefined, user.id);
    const { projects } = useProjects();
    const { leads } = useLeads();
    const liveUser = useLiveStaffUser(user.id);

    const userTasks = useMemo(() =>
        tasks.filter(t => t.assignedTo === user.id),
        [tasks, user.id]);

    const userActivities = useMemo(() =>
        [...userTasks].sort((a, b) => {
            const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
            const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
            return dateB.getTime() - dateA.getTime();
        }),
        [userTasks]);

    const currentActiveTask = useMemo(() =>
        userTasks.find(t => t.status === TaskStatus.IN_PROGRESS || t.status === TaskStatus.STARTED) || userActivities[0],
        [userTasks, userActivities]);

    const userKPIs = useMemo(() => {
        if (user.role === UserRole.SALES_TEAM_MEMBER) {
            const memberLeads = leads.filter(l => l.assignedTo === user.id);
            const wonLeads = memberLeads.filter(l => l.status === LeadPipelineStatus.WON).length;
            const conversionRate = memberLeads.length > 0 ? (wonLeads / memberLeads.length) * 100 : 0;
            const revenue = memberLeads.filter(l => l.status === LeadPipelineStatus.WON).reduce((sum, l) => sum + l.value, 0);
            return [
                { title: 'Leads Pipeline', value: memberLeads.length, icon: FunnelIcon },
                { title: 'Yield Rate', value: `${conversionRate.toFixed(1)}%`, icon: PresentationChartBarIcon },
                { title: 'Revenue Flow', value: formatCurrencyINR(revenue), icon: ArrowTrendingUpIcon },
            ];
        }
        if (user.role === UserRole.DRAWING_TEAM) {
            // Fallback heuristic for Drawing Team KPIs:
            // Use projects where this user is the projectHeadId OR
            // appears in a generic assignedTo/assignedDrawing field.
            const memberProjects = projects.filter((p: any) =>
                p.projectHeadId === user.id ||
                p.assignedTo === user.id ||
                p.assignedDrawing === user.id
            );
            const completed = memberProjects.filter((p: any) => p.status === ProjectStatus.COMPLETED).length;
            return [
                { title: 'Project Load', value: memberProjects.length, icon: DocumentCheckIcon },
                { title: 'Design Release', value: completed, icon: CheckCircleIcon },
                { title: 'Velocity', value: memberProjects.length > 0 ? 'Live' : '—', icon: ClockIcon },
            ];
        }
        return [];
    }, [user.id, user.role, leads, projects]);

    // Date range bounds calculation
    const getDateRangeBounds = useMemo(() => {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        let startDate: string;
        let endDate: string = now.toLocaleDateString('en-CA');

        switch (dateRange) {
            case 'today':
                startDate = startOfToday.toLocaleDateString('en-CA');
                break;
            case 'week':
                const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                startDate = lastWeek.toLocaleDateString('en-CA');
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1).toLocaleDateString('en-CA');
                break;
            case 'custom':
                startDate = customStartDate || now.toLocaleDateString('en-CA');
                endDate = customEndDate || now.toLocaleDateString('en-CA');
                break;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1).toLocaleDateString('en-CA');
        }

        return { startDate, endDate };
    }, [dateRange, customStartDate, customEndDate]);

    // Date range for analytics: include selected date so Deployment History tab has data
    const analyticsDateRange = useMemo(() => {
        const { startDate, endDate } = getDateRangeBounds;
        const start = startDate < selectedDate ? startDate : selectedDate;
        const end = endDate > selectedDate ? endDate : selectedDate;
        return { startDateKey: start, endDateKey: end };
    }, [dateRange, customStartDate, customEndDate, selectedDate]);

    // Use unified time analytics hook with date range so metrics and deployment history reflect filter
    const { 
      totalDaysWorked,
      totalActiveHours,
      totalIdleHours,
      totalBreakHours,
      totalLoggedHours,
      avgDailyHours,
      entries: timeEntries,
      loading: timeAnalyticsLoading
    } = useTimeAnalytics(user.id, user.organizationId, undefined, undefined, analyticsDateRange);

    // Calculate time tracking metrics from unified hook
    const timeMetrics = useMemo(() => {
        return {
            loggedHours: timeAnalyticsLoading ? '0.0' : totalLoggedHours.toFixed(1),
            activeHours: timeAnalyticsLoading ? '0.0' : totalActiveHours.toFixed(1),
            idleHours: timeAnalyticsLoading ? '0.0' : totalIdleHours.toFixed(1),
            breakHours: timeAnalyticsLoading ? '0.0' : totalBreakHours.toFixed(1),
            avgDailyHours: timeAnalyticsLoading ? '0.0' : avgDailyHours.toFixed(1),
            totalDays: timeAnalyticsLoading ? 0 : totalDaysWorked,
        };
    }, [totalLoggedHours, totalActiveHours, totalIdleHours, totalBreakHours, avgDailyHours, totalDaysWorked, timeAnalyticsLoading]);

    // Find entry for selected date in History tab
    const selectedDateEntry = useMemo(() => {
        return timeEntries.find(e => e.dateKey === selectedDate);
    }, [timeEntries, selectedDate]);

    const attendanceForMonth: Attendance[] = useMemo(() => {
        return timeEntries.map(entry => {
            let status = AttendanceStatus.ABSENT;
            
            // Calculate logged hours dynamically
            const clockIn = entry.clockIn;
            const clockOut = entry.clockOut;
            const loggedHours = clockOut 
                ? (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60)
                : (new Date().getTime() - clockIn.getTime()) / (1000 * 60 * 60);

            // Determine status based on time
            if (loggedHours >= 8) {
                status = AttendanceStatus.PRESENT;
            } else if (loggedHours >= 4) {
                status = AttendanceStatus.HALF_DAY;
            } else if (entry.status === TimeTrackingStatus.CLOCKED_IN || entry.status === TimeTrackingStatus.ON_BREAK) {
                status = AttendanceStatus.PRESENT; // Currently working
            } else if (entry.clockIn) {
                status = AttendanceStatus.HALF_DAY; // Clocked in but less than 4 hours (and clocked out)
            }

            // Format times (handle Date or Timestamp objects safely)
            const formatTime = (timeVal: any) => {
                if (!timeVal) return undefined;
                const d = typeof timeVal.toDate === 'function' ? timeVal.toDate() : new Date(timeVal);
                return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
            };

            return {
                date: new Date(entry.dateKey), // entry.dateKey is YYYY-MM-DD string
                status,
                clockIn: formatTime(entry.clockIn),
                clockOut: formatTime(entry.clockOut)
            };
        });
    }, [timeEntries]);


    return (
        <ContentCard className="h-full flex flex-col !p-0 overflow-hidden">
            {/* Header */}
            <div className="p-8 pb-6 border-b border-border/40 bg-subtle-background/30">
                <div className="flex items-center gap-6">
                    <div className="relative">
                        <img className="w-20 h-20 rounded-3xl object-cover ring-4 ring-surface" src={user.avatar} alt={user.name} />
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-secondary flex items-center justify-center text-white border-2 border-surface">
                            <CheckCircleIcon className="w-3.5 h-3.5" />
                        </div>
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-2xl font-serif font-black text-text-primary tracking-tight">{user.name}</h3>
                            <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20">
                                {user.role}
                            </span>
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setIsExportOpen(true)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface text-text-secondary hover:text-primary hover:border-primary transition-all text-[10px] font-bold uppercase tracking-widest"
                            >
                                <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                                Export Report
                            </button>
                            <div className="flex items-center gap-1.5 text-text-tertiary">
                                <PhoneIcon className="w-3.5 h-3.5" />
                                <span className="text-xs font-semibold">{user.phone}</span>
                            </div>
                            {user.region && (
                                <div className="flex items-center gap-1.5 text-text-tertiary">
                                    <MapPinIcon className="w-3.5 h-3.5" />
                                    <span className="text-xs font-semibold">{user.region}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-1.5 text-text-tertiary">
                                <ClockIcon className="w-3.5 h-3.5" />
                                <span className="text-xs font-semibold italic">Active profile</span>
                            </div>
                        </div>
                        {/* Current Assignment / Currently on task - live from Firestore, then task list */}
                        {(liveUser.currentTask || user.currentTask || (currentActiveTask && (currentActiveTask as any).title)) && (
                            <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded-xl">
                                <BriefcaseIcon className="w-4 h-4 text-primary flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">Currently on task</p>
                                    <p className="text-xs font-semibold text-text-primary truncate">
                                        {liveUser.currentTask || user.currentTask || (currentActiveTask as any)?.title || '—'}
                                    </p>
                                </div>
                                {liveUser.attendanceStatus && (
                                    <span className="text-[10px] font-bold uppercase text-primary/70 border-l border-primary/20 pl-2">
                                        {liveUser.attendanceStatus.replace('_', ' ')}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-surface border-b border-border/40 px-4">
                <nav className="flex space-x-2">
                    <TabButton label="Tactical View" icon={UserCircleIcon} isActive={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
                    <TabButton label="Deployment History" icon={ClockIcon} isActive={activeTab === 'history'} onClick={() => setActiveTab('history')} />
                    <TabButton label="Attendance" icon={CalendarIcon} isActive={activeTab === 'attendance'} onClick={() => setActiveTab('attendance')} />
                </nav>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <AnimatePresence mode="wait">
                    {activeTab === 'overview' && (
                        <motion.div
                            key="overview"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-8"
                        >
                            <section>
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex items-center gap-2">
                                        <ClockIcon className="w-4 h-4 text-primary" />
                                        <h4 className="text-sm font-black uppercase tracking-widest text-text-primary">Time Tracking Analysis</h4>
                                    </div>

                                    {/* Date Range Filter */}
                                    <div className="flex items-center gap-1 bg-subtle-background p-1 rounded-xl border border-border/40">
                                        {(['today', 'week', 'month', 'custom'] as const).map((range) => (
                                            <button
                                                key={range}
                                                onClick={() => setDateRange(range)}
                                                className={cn(
                                                    "px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
                                                    dateRange === range
                                                        ? "bg-primary text-white shadow-lg shadow-primary/20"
                                                        : "text-text-tertiary hover:text-text-primary hover:bg-primary/5"
                                                )}
                                            >
                                                {range === 'week' ? '7 Days' : range}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {dateRange === 'custom' && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        className="flex gap-4 mb-4 p-4 bg-surface border border-border/40 rounded-2xl"
                                    >
                                        <div className="flex-1">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-text-tertiary mb-1 block">Start Date</label>
                                            <input
                                                type="date"
                                                value={customStartDate}
                                                onChange={(e) => setCustomStartDate(e.target.value)}
                                                className="w-full px-4 py-2 rounded-xl border border-border/40 bg-subtle-background text-xs font-bold focus:border-primary/40 focus:ring-0 transition-colors"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-text-tertiary mb-1 block">End Date</label>
                                            <input
                                                type="date"
                                                value={customEndDate}
                                                onChange={(e) => setCustomEndDate(e.target.value)}
                                                className="w-full px-4 py-2 rounded-xl border border-border/40 bg-subtle-background text-xs font-bold focus:border-primary/40 focus:ring-0 transition-colors"
                                            />
                                        </div>
                                    </motion.div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <UserMetric title="Total Break Time" value={`${timeMetrics.breakHours}h`} icon={PauseCircleIcon} />
                                    <UserMetric title="Total Tasks Completed" value={userTasks.filter(t => t.status === TaskStatus.COMPLETED || t.status === TaskStatus.ACKNOWLEDGED).length} icon={DocumentCheckIcon} />
                                </div>
                            </section>

                            <section>
                                <div className="flex items-center gap-2 mb-4">
                                    <BriefcaseIcon className="w-4 h-4 text-primary" />
                                    <h4 className="text-sm font-black uppercase tracking-widest text-text-primary">Performance Vectors</h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {userKPIs.map(kpi => <UserMetric key={kpi.title} icon={kpi.icon} title={kpi.title} value={kpi.value} />)}
                                </div>
                            </section>

                            <section>
                                <div className="flex items-center gap-2 mb-4">
                                    <ClockIcon className="w-4 h-4 text-accent" />
                                    <h4 className="text-sm font-black uppercase tracking-widest text-text-primary">Operational Focus</h4>
                                </div>
                                <div className="p-6 bg-accent/5 border border-accent/20 rounded-2xl relative overflow-hidden group">
                                    <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
                                        <BriefcaseIcon className="w-32 h-32" />
                                    </div>
                                    <div className="relative z-10 space-y-3">
                                        {currentActiveTask ? (
                                            <>
                                                <div className="flex items-center justify-between">
                                                    <span className={cn(
                                                        "px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest border",
                                                        currentActiveTask.status === TaskStatus.IN_PROGRESS ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                                                            currentActiveTask.status === TaskStatus.COMPLETED ? "bg-blue-500/10 text-blue-600 border-blue-500/20" :
                                                                "bg-primary/10 text-primary border-primary/20"
                                                    )}>
                                                        {currentActiveTask.status}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-text-tertiary">
                                                        {currentActiveTask.createdAt && `Created ${formatDateTime(currentActiveTask.createdAt)}`}
                                                    </span>
                                                </div>

                                                <h3 className="text-lg font-serif font-bold text-text-primary leading-tight">
                                                    {(currentActiveTask as any).title || currentActiveTask.type || currentActiveTask.notes || 'Task'}
                                                </h3>

                                                {((currentActiveTask as any).description || currentActiveTask.notes) && (
                                                    <p className="text-sm text-text-secondary line-clamp-2">
                                                        {(currentActiveTask as any).description || currentActiveTask.notes}
                                                    </p>
                                                )}
                                            </>
                                        ) : (
                                            <p className="text-base font-serif italic text-text-primary leading-relaxed">
                                                No active tasks found
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </section>
                        </motion.div>
                    )}

                    {activeTab === 'history' && (
                        <motion.div
                            key="history"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            {/* Date Picker Header */}
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-sm font-black uppercase tracking-widest text-text-primary flex items-center gap-2">
                                    <ClockIcon className="w-4 h-4 text-primary" />
                                    Daily Timeline
                                </h4>
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="bg-surface border border-border rounded-lg px-3 py-1.5 text-sm font-medium text-text-primary focus:ring-2 focus:ring-primary/20 outline-none"
                                />
                            </div>

                            {/* Timeline Component */}
                            <div className="bg-subtle-background/30 rounded-2xl border border-border/40 p-4 min-h-[400px]">
                                {selectedDateEntry ? (
                                    <DailyDeploymentTimeline timeEntry={selectedDateEntry} />
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
                                        <div className="w-16 h-16 rounded-full bg-surface border-2 border-dashed border-border mb-4 flex items-center justify-center">
                                            <ClockIcon className="w-8 h-8 text-text-tertiary" />
                                        </div>
                                        <p className="text-text-primary font-bold">No Activity Recorded</p>
                                        <p className="text-xs text-text-tertiary mt-1">
                                            {new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Historical Tasks Summary (Keeping existing list as secondary view) */}
                            <div className="pt-6 border-t border-border/40">
                                <h5 className="text-xs font-bold text-text-tertiary uppercase tracking-wider mb-4">Task Completion Log</h5>
                                <div className="space-y-4 relative">
                                    <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border/40" />
                                    {userActivities.length > 0 ? (
                                        userActivities.slice(0, 5).map((activity, idx) => (
                                            <div key={activity.id} className="relative pl-10">
                                                <div className={cn(
                                                    "absolute left-0 top-1.5 w-8 h-8 rounded-xl border-4 border-surface shadow-sm flex items-center justify-center",
                                                    activity.status === TaskStatus.COMPLETED ? "bg-secondary text-white" : "bg-accent/20 text-accent"
                                                )}>
                                                    <CheckCircleIcon className="w-4 h-4" />
                                                </div>
                                                <div className="bg-subtle-background/40 p-4 rounded-2xl border border-border/20 group hover:border-primary/20 transition-all">
                                                    <div className="flex justify-between items-start gap-4">
                                                        <div>
                                                            <p className="text-sm font-semibold text-text-primary leading-snug">{(activity as any).title || activity.type || 'Task'}</p>
                                                            {((activity as any).description || activity.notes) && <p className="text-xs text-text-tertiary mt-1 line-clamp-1">{(activity as any).description || activity.notes}</p>}
                                                        </div>
                                                        <span className="text-[10px] font-black uppercase tracking-tighter text-text-tertiary whitespace-nowrap">
                                                            {activity.createdAt && formatDateTime(activity.createdAt)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-4 text-text-tertiary text-xs">
                                            No historical tasks recorded.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'attendance' && (
                        <motion.div
                            key="attendance"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            <AttendanceCalendar
                                attendanceData={attendanceForMonth}
                                onDateClick={(date) => {
                                    setSelectedDate(date);
                                    setActiveTab('history');
                                }}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Export Modal */}
            <ExportDeploymentReportModal
                isOpen={isExportOpen}
                onClose={() => setIsExportOpen(false)}
                users={[user]}
            />
        </ContentCard>
    );
};

export default TeamMemberDetailView;