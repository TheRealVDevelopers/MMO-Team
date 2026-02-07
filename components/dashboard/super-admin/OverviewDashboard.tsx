import React, { useState, useMemo } from 'react';
import {
    BanknotesIcon,
    PresentationChartLineIcon,
    UserGroupIcon,
    ExclamationTriangleIcon,
    RectangleStackIcon,
    CalendarIcon,
    CreditCardIcon,
    ClockIcon,
    CheckCircleIcon,
    PauseCircleIcon
} from '@heroicons/react/24/outline';
import { formatLargeNumberINR } from '../../../constants';
import { useProjects } from '../../../hooks/useProjects';
import { useUsers } from '../../../hooks/useUsers';
import { useLeads } from '../../../hooks/useLeads';
import { useDashboardStats } from '../../../hooks/useDashboardStats';
import { ActivityStatus, ProjectStatus, PaymentStatus, Project } from '../../../types';
import { ContentCard, StatCard, SectionHeader, staggerContainer, cn } from '../shared/DashboardUI';
import { motion } from 'framer-motion';
import { migrateAllToCases } from '../../../scripts/migrateToCases';

// New Components
import OngoingProjectsCard from './OngoingProjectsCard';
import AttendanceStatsCard from './AttendanceStatsCard';
import DashboardCalendar from './DashboardCalendar';
import PerformanceFlagSummary from './PerformanceFlagSummary';
import { usePerformanceMonitor } from '../../../hooks/usePerformanceMonitor';
import FinanceOverview from './FinanceOverview';
import { useTeamTimeEntries } from '../../../hooks/useTimeTracking';


import ProjectDetailModal from '../admin/ProjectDetailModal';
import FunnelDetailModal from '../admin/FunnelDetailModal';

const AlertCard: React.FC<{ title: string; count: number; items: string[]; type?: 'error' | 'warning' | 'primary'; onClick?: () => void }> = ({ title, count, items, type = 'error', onClick }) => (
    <ContentCard
        className={cn(
            "border-l-4 transition-all hover:shadow-md",
            type === 'error' ? "border-error" : type === 'warning' ? "border-accent" : "border-primary",
            onClick ? "cursor-pointer active:scale-[0.99]" : ""
        )}
        onClick={onClick}
    >
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
                <div className={cn(
                    "p-2.5 rounded-xl bg-opacity-10",
                    type === 'error' ? "bg-error text-error" : type === 'warning' ? "bg-accent text-accent" : "bg-primary text-primary"
                )}>
                    {type === 'error' || type === 'warning' ? <ExclamationTriangleIcon className="w-5 h-5" /> : <CreditCardIcon className="w-5 h-5" />}
                </div>
                <h3 className="text-lg font-serif font-bold text-text-primary tracking-tight">{title}</h3>
            </div>
            <span className={cn(
                "px-3 py-1 rounded-full text-xs font-black",
                type === 'error' ? "bg-error/10 text-error" : type === 'warning' ? "bg-accent/10 text-accent" : "bg-primary/10 text-primary"
            )}>{count}</span>
        </div>
        {items.length > 0 ? (
            <ul className="space-y-4">
                {items.slice(0, 3).map((item, index) => (
                    <motion.li
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start gap-3 text-sm group cursor-default"
                    >
                        <span className={cn(
                            "w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 transition-transform group-hover:scale-150",
                            type === 'error' ? "bg-error" : type === 'warning' ? "bg-accent" : "bg-primary"
                        )}></span>
                        <span className="text-text-secondary font-medium group-hover:text-text-primary transition-colors">{item}</span>
                    </motion.li>
                ))}
                {items.length > 3 && (
                    <li className="text-[10px] text-text-tertiary font-black uppercase tracking-widest pl-4.5 pt-2">
                        + {items.length - 3} more critical items
                    </li>
                )}
            </ul>
        ) : (
            <p className="text-sm text-text-tertiary italic py-4 text-center">Protocol synchronized. No pending alerts.</p>
        )}
    </ContentCard>
);

interface OverviewDashboardProps {
    setCurrentPage: (page: string) => void;
    onNavigateToMember?: (userId: string, tab?: 'history', date?: string) => void;
}

const OverviewDashboard: React.FC<OverviewDashboardProps> = ({ setCurrentPage, onNavigateToMember }) => {
    // Activate Background Performance Monitoring
    usePerformanceMonitor();

    // Modal States
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

    // Funnel/Lead Modal State
    const [isFunnelModalOpen, setIsFunnelModalOpen] = useState(false);
    const [funnelStage, setFunnelStage] = useState('All Active Opportunities');

    // Team Time Tracking State
    const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'custom'>('month');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');

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

    const { entries: teamEntries } = useTeamTimeEntries(getDateRangeBounds.startDate, getDateRangeBounds.endDate);

    const teamMetrics = useMemo(() => {
        let totalLoggedMins = 0;
        let totalActiveMins = 0;
        let totalBreakMins = 0;

        const now = new Date();
        const todayStr = now.toLocaleDateString('en-CA');

        teamEntries.forEach(entry => {
            const isToday = entry.date === todayStr;

            if (entry.clockIn) {
                const clockIn = entry.clockIn instanceof Date ? entry.clockIn : new Date(entry.clockIn);
                const clockOut = entry.clockOut
                    ? (entry.clockOut instanceof Date ? entry.clockOut : new Date(entry.clockOut))
                    : (isToday ? now : clockIn);

                if (clockOut > clockIn) {
                    totalLoggedMins += (clockOut.getTime() - clockIn.getTime()) / (1000 * 60);
                }
            }

            (entry.activities || []).forEach(a => {
                if (a.startTime) {
                    const start = a.startTime instanceof Date ? a.startTime : new Date(a.startTime);
                    const end = a.endTime
                        ? (a.endTime instanceof Date ? a.endTime : new Date(a.endTime))
                        : (isToday ? now : start);

                    if (end > start) {
                        totalActiveMins += (end.getTime() - start.getTime()) / (1000 * 60);
                    }
                }
            });

            (entry.breaks || []).forEach(b => {
                if (b.startTime) {
                    const start = b.startTime instanceof Date ? b.startTime : new Date(b.startTime);
                    const end = b.endTime
                        ? (b.endTime instanceof Date ? b.endTime : new Date(b.endTime))
                        : (isToday ? now : start);

                    if (end > start) {
                        totalBreakMins += (end.getTime() - start.getTime()) / (1000 * 60);
                    }
                }
            });
        });

        const loggedHours = (totalLoggedMins / 60).toFixed(1);
        const activeHours = (totalActiveMins / 60).toFixed(1);
        const idleHours = Math.max(0, (totalLoggedMins - totalActiveMins - totalBreakMins) / 60).toFixed(1);

        return { loggedHours, activeHours, idleHours };
    }, [teamEntries]);
    const [funnelLeads, setFunnelLeads] = useState<Project[]>([]);

    // KPI Calculations
    const { projects } = useProjects();
    const { users } = useUsers();
    const { leads } = useLeads();
    const { stats, loading: statsLoading } = useDashboardStats(); // Admin-wide stats

    // KPI Calculations
    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => 
        p.status !== ProjectStatus.COMPLETED && 
        p.status !== ProjectStatus.REJECTED && 
        p.status !== ProjectStatus.ON_HOLD
    ).length;

    const totalLeads = leads.length;
    const conversionRate = stats.conversionRate.toFixed(1);

    const teamMembers = users.length;
    const totalRevenue = projects.filter(p => p.status === ProjectStatus.COMPLETED || p.status === ProjectStatus.APPROVED).reduce((sum, p) => sum + p.budget, 0);

    // Outstanding Payments Calculation (Placeholder until Finance Hook Integration)
    const unpaidInvoices: any[] = [];
    // const outstandingTotal -> Moved to FinanceOverview

    // Alert Calculations (Placeholder until Alerts Hook Integration)
    const pendingApprovals: any[] = [];

    // Handlers
    const handleProjectSelect = (project: Project) => {
        setSelectedProject(project);
        setIsProjectModalOpen(true);
    };

    const handleFunnelClick = () => {
        // Filter leads (mocked here by taking 'NEW' or 'ASSIGNED' projects as leads)
        // In real app, this would be leads from LEADS constant or API
        // Filter leads (mocked here by taking 'NEW' or 'ASSIGNED' projects as leads)
        // In real app, this would be leads from LEADS constant or API
        const leadsList = projects.filter(p => p.status === ProjectStatus.AWAITING_DESIGN || p.status === ProjectStatus.PENDING_REVIEW); // Keeping logic but using real projects
        // Ideally use 'leads' from useLeads, but for compatibility with funnel modal expecting 'Project[]', we might need mapping?
        // Let's assume FunnelModal accepts Project[] as per original code.
        setFunnelLeads(leadsList);

        setFunnelStage("Active Pipeline");
        setIsFunnelModalOpen(true);
    };

    return (
        <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="space-y-8"
        >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-6">
                    {/* ... existing content ... */}
                    <SectionHeader
                        title="Executive Overview"
                        subtitle="Synergized command center for MMO project operations."
                        actions={
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={async () => {
                                        if (confirm('🔄 Run Migration?\n\nThis will migrate all leads and projects to the unified cases collection.\n\nExisting data will NOT be deleted.\n\nThis is REQUIRED before saving quotations.\n\nContinue?')) {
                                            try {
                                                console.log('🚀 Starting migration...');
                                                const result = await migrateAllToCases();
                                                if (result.success) {
                                                    alert(`✅ Migration Completed Successfully!\n\nMigrated:\n• ${result.migratedLeads} leads\n• ${result.migratedProjects} projects\n\nTotal: ${result.migratedLeads + result.migratedProjects} cases in unified collection\n\n✅ You can now save quotations and use all features!`);
                                                    window.location.reload();
                                                } else {
                                                    alert('⚠️ Migration completed with warnings. Check console.');
                                                }
                                            } catch (error) {
                                                console.error('Migration error:', error);
                                                alert('❌ Migration Failed\n\nError: ' + (error as Error).message + '\n\nPlease check browser console for details.');
                                            }
                                        }
                                    }}
                                    className="px-6 py-3 bg-gradient-to-r from-primary to-primary/80 text-white rounded-lg hover:shadow-lg hover:scale-105 transition-all font-bold text-sm flex items-center gap-2 border-2 border-primary/30"
                                >
                                    🔄 Migrate to Cases
                                    <span className="text-xs font-normal opacity-90 bg-white/20 px-2 py-0.5 rounded">(Required)</span>
                                </button>
                                <div className="flex items-center gap-2 bg-surface px-4 py-2 rounded-2xl border border-border shadow-sm">
                                    <CalendarIcon className="w-4 h-4 text-text-tertiary" />
                                    <span className="text-xs font-black uppercase tracking-[0.15em] text-text-secondary">January 2026</span>
                                </div>
                            </div>
                        }
                    />

                    {/* Primary Calendar View - Moved to Top */}
                    <DashboardCalendar />

                    {/* Team Time Tracking Analysis */}
                    <section className="mt-8">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                                    <ClockIcon className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-serif font-bold text-text-primary tracking-tight">Team Operational Velocity</h3>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-text-tertiary">Real-time engagement metrics</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-1 bg-subtle-background p-1 rounded-xl border border-border/40">
                                {(['today', 'week', 'month', 'custom'] as const).map((range) => (
                                    <button
                                        key={range}
                                        onClick={() => setDateRange(range)}
                                        className={cn(
                                            "px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
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
                                className="flex gap-4 mb-6 p-4 bg-surface border border-border/40 rounded-2xl"
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

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <StatCard
                                title="Team Logged Hours"
                                value={teamMetrics.loggedHours}
                                icon={<ClockIcon className="w-6 h-6" />}
                                color="primary"
                            />
                            <StatCard
                                title="Task Execution Time"
                                value={teamMetrics.activeHours}
                                icon={<CheckCircleIcon className="w-6 h-6" />}
                                color="accent"
                            />
                            <StatCard
                                title="Idle Analysis"
                                value={teamMetrics.idleHours}
                                icon={<PauseCircleIcon className="w-6 h-6" />}
                                color="secondary"
                            />
                        </div>
                    </section>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* ... existing stats cards ... */}
                        <StatCard
                            title="Enterprise Projects"
                            value={totalProjects}
                            icon={<RectangleStackIcon className="w-6 h-6" />}
                            trend={{ value: stats.projectsTrend, positive: stats.projectsTrendPositive }}
                            color="primary"
                            className="cursor-pointer"
                            onClick={() => setCurrentPage('projects')}
                        />
                        <StatCard
                            title="Conversion Yield"
                            value={`${conversionRate}%`}
                            icon={<PresentationChartLineIcon className="w-6 h-6" />}
                            trend={{ value: stats.conversionTrend, positive: stats.conversionTrendPositive }}
                            color="secondary"
                            className="cursor-pointer"
                            onClick={handleFunnelClick}
                        />
                        <StatCard
                            title="Global Talent"
                            value={teamMembers}
                            icon={<UserGroupIcon className="w-6 h-6" />}
                            trend={{ value: stats.leadsTrend, positive: stats.leadsTrendPositive }}
                            color="accent"
                            className="cursor-pointer"
                            onClick={() => setCurrentPage('team')}
                        />
                        <StatCard
                            title="Fiscal Velocity (YTD)"
                            value={formatLargeNumberINR(totalRevenue)}
                            icon={<BanknotesIcon className="w-6 h-6" />}
                            trend={{ value: stats.revenueTrend, positive: stats.revenueTrendPositive }}
                            color="purple"
                            className="cursor-pointer"
                            onClick={() => setCurrentPage('finance')}
                        />
                    </div>

                    <OngoingProjectsCard onProjectSelect={handleProjectSelect} />
                </div>

                {/* Right Sidebar */}
                <div className="lg:col-span-1 space-y-8">
                    <AttendanceStatsCard onViewMember={onNavigateToMember} />

                    {/* ... existing sidebar content ... */}

                    {/* Performance Flag System */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 px-1">
                            <span className="w-2 h-4 bg-primary rounded-full"></span>
                            <h3 className="text-sm font-black uppercase tracking-widest text-text-secondary">Workforce Velocity</h3>
                        </div>
                        <PerformanceFlagSummary />
                    </div>

                    <AlertCard
                        title="Strategic Approvals"
                        count={pendingApprovals.length}
                        items={pendingApprovals.map(a => a.description)}
                        type="warning"
                    />
                    <AlertCard
                        title="Outstanding Payments"
                        count={unpaidInvoices.length}
                        items={unpaidInvoices.map(i => `${i.projectName}: ${formatLargeNumberINR(i.total - i.paidAmount)}`)}
                        type="error"
                    />
                </div>
            </div>

            {/* Modals */}
            <ProjectDetailModal
                isOpen={isProjectModalOpen}
                onClose={() => setIsProjectModalOpen(false)}
                project={selectedProject}
            />

            <FunnelDetailModal
                isOpen={isFunnelModalOpen}
                onClose={() => setIsFunnelModalOpen(false)}
                leadStage={funnelStage}
                leads={funnelLeads}
            />

        </motion.div>
    );
};

export default OverviewDashboard;
