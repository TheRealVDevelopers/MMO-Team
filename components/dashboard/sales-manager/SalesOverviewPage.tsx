import React, { useState, useMemo } from 'react';
import { USERS, formatCurrencyINR } from '../../../constants';
import { Lead, LeadPipelineStatus, UserRole, TaskStatus, User } from '../../../types';
import {
    UsersIcon,
    PresentationChartLineIcon,
    TrophyIcon,
    BanknotesIcon,
    ExclamationTriangleIcon,
    ArrowUpRightIcon,
    FunnelIcon,
    ClockIcon,
    CheckCircleIcon,
    PauseCircleIcon
} from '@heroicons/react/24/outline';
import { StatCard, ContentCard, cn, staggerContainer } from '../shared/DashboardUI';
import { motion } from 'framer-motion';
import PipelineDetailModal from './PipelineDetailModal';
import DashboardCalendar from '../super-admin/DashboardCalendar';
import type { CalendarTask } from '../super-admin/DashboardCalendar';
import { useTeamTasks } from '../../../hooks/useTeamTasks';
import { updateLead } from '../../../hooks/useLeads';
import LeadDetailModal from '../../shared/LeadDetailModal';
import { useDashboardStats } from '../../../hooks/useDashboardStats';
import { useTeamTimeAnalytics } from '../../../hooks/useTimeAnalytics';

const pipelineOrder = Object.values(LeadPipelineStatus);

const SalesOverviewPage: React.FC<{ setCurrentPage: (page: string) => void; leads: Lead[]; users: User[] }> = ({ setCurrentPage, leads, users }) => {
    const salesTeam = useMemo(() => users.filter(u => u.role === UserRole.SALES_TEAM_MEMBER), [users]);
    const { tasks: teamTasks, loading: tasksLoading } = useTeamTasks();
    const { stats, loading: statsLoading } = useDashboardStats(); // Team-wide stats
    // --- STATE ---
    const [selectedStage, setSelectedStage] = useState<string>('');
    const [isPipelineModalOpen, setIsPipelineModalOpen] = useState(false);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);

    // Sales Team Time Tracking State
    const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'custom'>('month');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');

    const salesTeamUserIds = useMemo(() => salesTeam.map(u => u.id), [salesTeam]);

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

    // Use unified time analytics hook - SINGLE SOURCE OF TRUTH
    // Note: useTeamTimeAnalytics filters by organization, not by userIds
    // For sales team specific metrics, we'd need to enhance the hook or filter results
    const { teamTotals, users: teamUsers, loading: timeAnalyticsLoading } = useTeamTimeAnalytics(
      salesTeam[0]?.organizationId,
      new Date().getFullYear(),
      new Date().getMonth()
    );
    
    // Filter to sales team users only
    const salesTeamMetrics = useMemo(() => {
      const salesUserEntries = teamUsers.filter(u => salesTeamUserIds.includes(u.userId));
      
      const totals = salesUserEntries.reduce((acc, user) => ({
        totalLoggedHours: acc.totalLoggedHours + user.totalLoggedHours,
        totalActiveHours: acc.totalActiveHours + user.totalActiveHours,
      }), { totalLoggedHours: 0, totalActiveHours: 0 });
      
      const loggedHours = timeAnalyticsLoading ? '0.0' : totals.totalLoggedHours.toFixed(1);
      const activeHours = timeAnalyticsLoading ? '0.0' : totals.totalActiveHours.toFixed(1);
      const idleHours = timeAnalyticsLoading ? '0.0' : Math.max(0, totals.totalLoggedHours - totals.totalActiveHours).toFixed(1);
      
      return { loggedHours, activeHours, idleHours };
    }, [teamUsers, salesTeamUserIds, timeAnalyticsLoading]);

    // --- LIVE DATA CALCULATIONS ---
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const leadsThisMonth = leads.filter(l => l.inquiryDate >= startOfMonth);
    const totalLeads = leadsThisMonth.length;
    const projectsWon = stats.projectsWon;
    const totalRevenue = stats.totalRevenue;
    const conversionRate = stats.conversionRate.toFixed(1);

    const pipelineCounts = leads.reduce((acc, lead) => {
        acc[lead.status] = (acc[lead.status] || 0) + 1;
        return acc;
    }, {} as Record<LeadPipelineStatus, number>);

    // Alert if lead is NEW and older than 24h
    const urgentAlerts = leads.filter(l =>
        l.status === LeadPipelineStatus.NEW_NOT_CONTACTED &&
        (new Date().getTime() - l.inquiryDate.getTime()) > 24 * 60 * 60 * 1000
    );

    // --- CALENDAR DATA PREP ---
    const calendarTasks = useMemo(() => {
        const salesUserIds = salesTeam.map(u => u.id);
        const mappedTasks: Record<string, CalendarTask[]> = {};

        teamTasks.filter(t => salesUserIds.includes(t.userId)).forEach(task => {
            const dateStr = typeof task.date === 'string' ? task.date : new Date(task.date).toISOString().split('T')[0];
            if (!mappedTasks[dateStr]) {
                mappedTasks[dateStr] = [];
            }
            mappedTasks[dateStr].push({
                id: task.id,
                title: `${users.find(u => u.id === task.userId)?.name.split(' ')[0] || 'Unknown'}: ${task.title}`,
                completed: task.status === TaskStatus.COMPLETED,
                type: 'task',
                date: dateStr,
                time: 'All Day' // Mock time for now
            });
        });
        return mappedTasks;
    }, [teamTasks]);

    const handleStageClick = (stage: string) => {
        setSelectedStage(stage);
        setIsPipelineModalOpen(true);
    };

    const handleLeadClick = (lead: Lead) => {
        setSelectedLead(lead);
        setIsLeadModalOpen(true);
    };

    const getStageLeads = () => leads.filter(l => l.status === selectedStage);

    return (
        <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-8"
        >
            {/* Sales Team Time Tracking Analysis */}
            <section className="bg-surface p-6 rounded-3xl border border-border/40 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                            <ClockIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-serif font-bold text-text-primary tracking-tight">Sales Team Operational Velocity</h3>
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-tertiary">Real-time engagement metrics for sales representatives</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1 bg-subtle-background p-1 rounded-xl border border-border/40 self-end md:self-auto">
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
                        className="flex gap-4 mb-8 p-4 bg-subtle-background border border-border/20 rounded-2xl"
                    >
                        <div className="flex-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-tertiary mb-1 block">Start Date</label>
                            <input
                                type="date"
                                value={customStartDate}
                                onChange={(e) => setCustomStartDate(e.target.value)}
                                className="w-full px-4 py-2 rounded-xl border border-border/40 bg-white text-xs font-bold focus:border-primary/40 focus:ring-0 transition-colors"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-tertiary mb-1 block">End Date</label>
                            <input
                                type="date"
                                value={customEndDate}
                                onChange={(e) => setCustomEndDate(e.target.value)}
                                className="w-full px-4 py-2 rounded-xl border border-border/40 bg-white text-xs font-bold focus:border-primary/40 focus:ring-0 transition-colors"
                            />
                        </div>
                    </motion.div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-subtle-background p-6 rounded-2xl border border-border/20 group hover:border-primary/20 transition-all">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                <ClockIcon className="w-5 h-5" />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-tertiary">Logged Hours</p>
                        </div>
                        <p className="text-3xl font-serif font-black text-text-primary tracking-tight">{salesTeamMetrics.loggedHours}<span className="text-sm font-sans font-medium text-text-tertiary ml-2">hrs</span></p>
                    </div>

                    <div className="bg-subtle-background p-6 rounded-2xl border border-border/20 group hover:border-accent/20 transition-all">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                                <CheckCircleIcon className="w-5 h-5" />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-tertiary">Sales Activity Time</p>
                        </div>
                        <p className="text-3xl font-serif font-black text-text-primary tracking-tight">{salesTeamMetrics.activeHours}<span className="text-sm font-sans font-medium text-text-tertiary ml-2">hrs</span></p>
                    </div>

                    <div className="bg-subtle-background p-6 rounded-2xl border border-border/20 group hover:border-secondary/20 transition-all">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary group-hover:scale-110 transition-transform">
                                <PauseCircleIcon className="w-5 h-5" />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-tertiary">Idle Analysis</p>
                        </div>
                        <p className="text-3xl font-serif font-black text-text-primary tracking-tight">{salesTeamMetrics.idleHours}<span className="text-sm font-sans font-medium text-text-tertiary ml-2">hrs</span></p>
                    </div>
                </div>
            </section>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="New Leads (Month)"
                    value={totalLeads.toString()}
                    icon={<FunnelIcon className="w-6 h-6" />}
                    color="primary"
                    trend={{ value: stats.leadsTrend, positive: stats.leadsTrendPositive }}
                    className="cursor-pointer"
                />
                <StatCard
                    title="Conversion Rate"
                    value={`${conversionRate}%`}
                    icon={<PresentationChartLineIcon className="w-6 h-6" />}
                    color="purple"
                    trend={{ value: stats.conversionTrend, positive: stats.conversionTrendPositive }}
                />
                <StatCard
                    title="Projects Won (Month)"
                    value={projectsWon.toString()}
                    icon={<TrophyIcon className="w-6 h-6" />}
                    color="accent"
                    trend={{ value: stats.projectsTrend, positive: stats.projectsTrendPositive }}
                />
                <StatCard
                    title="Revenue (Month)"
                    value={formatCurrencyINR(totalRevenue)}
                    icon={<BanknotesIcon className="w-6 h-6" />}
                    color="secondary"
                    trend={{ value: stats.revenueTrend, positive: stats.revenueTrendPositive }}
                />
            </div>

            {/* Team Schedule / Calendar */}
            <div className="grid grid-cols-1 mb-8">
                <DashboardCalendar initialTasks={calendarTasks} className="bg-surface shadow-none border border-border" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sales Pipeline Visualization */}
                <ContentCard className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-serif font-bold text-text-primary">Sales Pipeline</h3>
                            <p className="text-sm text-text-secondary font-light">Lead distribution across all stages</p>
                        </div>
                        <button
                            onClick={() => setCurrentPage('leads')}
                            className="p-2 hover:bg-subtle-background rounded-full transition-colors text-primary"
                        >
                            <ArrowUpRightIcon className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-6">
                        {pipelineOrder.map(status => {
                            const count = pipelineCounts[status] || 0;
                            const percentage = leads.length > 0 ? (count / leads.length) * 100 : 0;
                            return (
                                <div
                                    key={status}
                                    onClick={() => handleStageClick(status)}
                                    className="group cursor-pointer"
                                >
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary group-hover:text-primary transition-colors">{status}</span>
                                        <span className="text-xs font-bold text-text-primary group-hover:scale-110 transition-transform">{count}</span>
                                    </div>
                                    <div className="w-full bg-subtle-background rounded-full h-1.5 overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${percentage}%` }}
                                            transition={{ duration: 1, ease: "easeOut" }}
                                            className="bg-primary h-full rounded-full group-hover:bg-primary-hover transition-colors"
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </ContentCard>

                <div className="space-y-6">
                    {/* Top Performers */}
                    <ContentCard>
                        <h3 className="text-lg font-serif font-bold text-text-primary mb-6">Top Performers</h3>
                        <div className="space-y-5">
                            {salesTeam.slice(0, 4).map((member) => {
                                const wonCount = leads.filter(l => l.assignedTo === member.id && l.status === LeadPipelineStatus.WON).length;
                                return (
                                    <div key={member.id} className="flex items-center justify-between group">
                                        <div className="flex items-center space-x-3">
                                            <div className="relative">
                                                <img src={member.avatar} alt={member.name} className="w-10 h-10 rounded-2xl object-cover ring-2 ring-transparent group-hover:ring-primary/20 transition-all" />
                                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-surface rounded-full" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-text-primary">{member.name}</p>
                                                <p className="text-[10px] uppercase tracking-widest text-text-secondary">Sales Professional</p>
                                            </div>
                                        </div>
                                        <div className="bg-primary/5 px-3 py-1 rounded-full">
                                            <span className="text-[10px] font-black text-primary uppercase tracking-tighter">{wonCount} Won</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </ContentCard>

                    {/* Urgent Alerts Widget */}
                    <ContentCard className="border-l-4 border-l-error">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                                <ExclamationTriangleIcon className="w-5 h-5 text-error" />
                                Urgent Alerts
                            </h3>
                            <span className="bg-error/10 text-error text-[10px] font-black px-2 py-0.5 rounded-full uppercase">{urgentAlerts.length}</span>
                        </div>
                        {urgentAlerts.length > 0 ? (
                            <div className="space-y-4">
                                {urgentAlerts.slice(0, 3).map(alert => (
                                    <div key={alert.id} className="p-3 bg-error/5 border border-error/10 rounded-2xl group hover:border-error/30 transition-all cursor-pointer">
                                        <p className="text-sm font-bold text-text-primary">{alert.clientName}</p>
                                        <p className="text-[10px] text-text-secondary mt-1">Stagnant for &gt; 24h</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-4">
                                <p className="text-sm text-text-secondary italic">All leads are currently up to date.</p>
                            </div>
                        )}
                    </ContentCard>
                </div>
            </div>


            {/* Pipeline Modal */}
            <PipelineDetailModal
                isOpen={isPipelineModalOpen}
                onClose={() => setIsPipelineModalOpen(false)}
                stage={selectedStage}
                leads={getStageLeads()}
                onLeadClick={handleLeadClick}
            />

            <LeadDetailModal
                isOpen={isLeadModalOpen}
                onClose={() => setIsLeadModalOpen(false)}
                caseItem={selectedLead as any}
                onUpdate={async (updatedLead) => {
                    await updateLead(updatedLead.id, updatedLead as any);
                }}
            />
        </motion.div>
    );
};

export default SalesOverviewPage;
