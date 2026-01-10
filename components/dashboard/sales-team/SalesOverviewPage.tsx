import React from 'react';
import { formatCurrencyINR, formatDateTime } from '../../../constants';
import { LeadPipelineStatus, SiteVisit } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { useLeads } from '../../../hooks/useLeads';
import {
    ChevronRightIcon,
    ClockIcon,
    UsersIcon,
    PresentationChartLineIcon,
    TrophyIcon,
    BanknotesIcon,
    CalendarIcon,
    BoltIcon,
    CheckCircleIcon
} from '@heroicons/react/24/outline';
import { ContentCard, StatCard, staggerContainer, cn } from '../shared/DashboardUI';
import { motion } from 'framer-motion';

const SalesOverviewPage: React.FC<{ setCurrentPage: (page: string) => void, siteVisits: SiteVisit[] }> = ({ setCurrentPage, siteVisits }) => {
    const { currentUser } = useAuth();
    const { leads, loading } = useLeads();

    if (!currentUser) return null;

    const myLeads = leads.filter(l => l.assignedTo === currentUser.id);
    const leadsThisMonth = myLeads.filter(l => l.inquiryDate > new Date(new Date().setDate(1)));
    const activeLeads = myLeads.filter(l => ![LeadPipelineStatus.WON, LeadPipelineStatus.LOST].includes(l.status)).length;
    const projectsWon = leadsThisMonth.filter(l => l.status === LeadPipelineStatus.WON).length;
    const totalRevenue = leadsThisMonth.filter(l => l.status === LeadPipelineStatus.WON).reduce((sum, l) => sum + l.value, 0);
    const conversionRate = leadsThisMonth.length > 0 ? ((projectsWon / leadsThisMonth.length) * 100).toFixed(1) : '0';

    const todaysFollowUps = myLeads.filter(l => l.status === LeadPipelineStatus.CONTACTED_CALL_DONE || l.status === LeadPipelineStatus.NEW_NOT_CONTACTED);
    const recentActivities = myLeads.flatMap(l => l.history).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 5);

    const mySiteVisits = siteVisits.filter(v => v.requesterId === currentUser?.id);
    const upcomingVisits = mySiteVisits.filter(v => v.date >= new Date()).sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 3);

    return (
        <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="space-y-8"
        >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Active Registry"
                    value={activeLeads}
                    icon={<UsersIcon className="w-6 h-6" />}
                    color="primary"
                    trend={{ value: '12%', positive: true }}
                />
                <StatCard
                    title="Conversion Rate"
                    value={`${conversionRate}%`}
                    icon={<PresentationChartLineIcon className="w-6 h-6" />}
                    color="secondary"
                    trend={{ value: '5%', positive: true }}
                />
                <StatCard
                    title="Successes"
                    value={projectsWon}
                    icon={<TrophyIcon className="w-6 h-6" />}
                    color="accent"
                    trend={{ value: '2', positive: true }}
                />
                <StatCard
                    title="Projected Revenue"
                    value={formatCurrencyINR(totalRevenue)}
                    icon={<BanknotesIcon className="w-6 h-6" />}
                    color="purple"
                    trend={{ value: '18%', positive: true }}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <ContentCard className="h-full">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-xl font-serif font-bold text-text-primary">Priority Objectives</h3>
                                <p className="text-sm text-text-secondary">Immediate actions required for your registry</p>
                            </div>
                            <BoltIcon className="w-6 h-6 text-accent animate-pulse" />
                        </div>

                        <div className="space-y-1">
                            {todaysFollowUps.length > 0 ? (
                                todaysFollowUps.map((lead) => (
                                    <motion.div
                                        key={lead.id}
                                        whileHover={{ x: 4 }}
                                        className="flex items-center p-4 rounded-2xl hover:bg-subtle-background transition-all group cursor-pointer border border-transparent hover:border-border/40"
                                        onClick={() => setCurrentPage('leads')}
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center text-text-tertiary group-hover:border-primary/30 group-hover:text-primary transition-all">
                                            <UsersIcon className="w-5 h-5" />
                                        </div>
                                        <div className="ml-4 flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-text-primary truncate">{lead.clientName}</p>
                                            <p className="text-xs text-text-tertiary truncate">{lead.projectName}</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className={cn(
                                                "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                                                lead.status === LeadPipelineStatus.NEW_NOT_CONTACTED
                                                    ? 'bg-error/10 text-error border border-error/20'
                                                    : 'bg-accent/10 text-accent border border-accent/20'
                                            )}>
                                                {lead.status === LeadPipelineStatus.NEW_NOT_CONTACTED ? 'Immediate' : 'Follow Up'}
                                            </span>
                                            <ChevronRightIcon className="w-4 h-4 text-text-tertiary group-hover:text-primary transition-colors" />
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-subtle-background rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CheckCircleIcon className="w-8 h-8 text-text-tertiary opacity-20" />
                                    </div>
                                    <p className="text-sm font-medium text-text-secondary">All objectives are currently synchronized.</p>
                                </div>
                            )}
                        </div>
                    </ContentCard>
                </div>

                <div className="space-y-8">
                    <ContentCard>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                <CalendarIcon className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-serif font-bold text-text-primary">Upcoming Visits</h3>
                        </div>

                        <div className="space-y-4">
                            {upcomingVisits.length > 0 ? (
                                upcomingVisits.map(visit => (
                                    <div key={visit.id} className="relative pl-4 border-l-2 border-primary/20 hover:border-primary transition-colors py-1">
                                        <p className="text-sm font-semibold text-text-primary">{visit.projectName}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <ClockIcon className="w-3.5 h-3.5 text-text-tertiary" />
                                            <span className="text-xs font-medium text-text-tertiary italic">{formatDateTime(visit.date)}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-text-tertiary italic">No inspections currently scheduled.</p>
                            )}
                        </div>
                    </ContentCard>

                    <ContentCard>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
                                <ClockIcon className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-serif font-bold text-text-primary">Recent Pulse</h3>
                        </div>

                        <div className="space-y-6 relative">
                            <div className="absolute left-1.5 top-2 bottom-2 w-px bg-border/40" />
                            {recentActivities.map((activity, idx) => (
                                <div key={idx} className="relative pl-6">
                                    <div className="absolute left-0 top-1.5 w-3 h-3 rounded-full border-2 border-surface bg-border ring-1 ring-border/20" />
                                    <p className="text-xs font-medium text-text-primary leading-snug">
                                        {activity.action}
                                    </p>
                                    <p className="text-[10px] text-text-tertiary mt-0.5">
                                        {formatDateTime(activity.timestamp)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </ContentCard>
                </div>
            </div>
        </motion.div>
    );
};

export default SalesOverviewPage;
