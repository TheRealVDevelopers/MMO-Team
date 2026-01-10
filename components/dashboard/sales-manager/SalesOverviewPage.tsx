import React from 'react';
import { USERS, formatCurrencyINR } from '../../../constants';
import { Lead, LeadPipelineStatus, UserRole } from '../../../types';
import {
    UsersIcon,
    PresentationChartLineIcon,
    TrophyIcon,
    BanknotesIcon,
    ExclamationTriangleIcon,
    ArrowUpRightIcon,
    FunnelIcon
} from '@heroicons/react/24/outline';
import { StatCard, ContentCard, cn, staggerContainer } from '../shared/DashboardUI';
import { motion } from 'framer-motion';

const salesTeam = USERS.filter(u => u.role === UserRole.SALES_TEAM_MEMBER);
const pipelineOrder = Object.values(LeadPipelineStatus);

const SalesOverviewPage: React.FC<{ setCurrentPage: (page: string) => void; leads: Lead[] }> = ({ setCurrentPage, leads }) => {
    // --- LIVE DATA CALCULATIONS ---
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const leadsThisMonth = leads.filter(l => l.inquiryDate >= startOfMonth);
    const totalLeads = leadsThisMonth.length;
    const projectsWon = leadsThisMonth.filter(l => l.status === LeadPipelineStatus.WON).length;
    const totalRevenue = leadsThisMonth.filter(l => l.status === LeadPipelineStatus.WON).reduce((sum, l) => sum + (l.value || 0), 0);
    const conversionRate = totalLeads > 0 ? ((projectsWon / totalLeads) * 100).toFixed(1) : '0';

    const pipelineCounts = leads.reduce((acc, lead) => {
        acc[lead.status] = (acc[lead.status] || 0) + 1;
        return acc;
    }, {} as Record<LeadPipelineStatus, number>);

    // Alert if lead is NEW and older than 24h
    const urgentAlerts = leads.filter(l =>
        l.status === LeadPipelineStatus.NEW_NOT_CONTACTED &&
        (new Date().getTime() - l.inquiryDate.getTime()) > 24 * 60 * 60 * 1000
    );

    return (
        <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-8"
        >
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="New Leads (Month)"
                    value={totalLeads.toString()}
                    icon={<FunnelIcon className="w-6 h-6" />}
                    color="primary"
                    trend={{ value: '12%', positive: true }}
                    className="cursor-pointer"
                />
                <StatCard
                    title="Conversion Rate"
                    value={`${conversionRate}%`}
                    icon={<PresentationChartLineIcon className="w-6 h-6" />}
                    color="purple"
                    trend={{ value: '2.4%', positive: true }}
                />
                <StatCard
                    title="Projects Won (Month)"
                    value={projectsWon.toString()}
                    icon={<TrophyIcon className="w-6 h-6" />}
                    color="accent"
                    trend={{ value: '5%', positive: true }}
                />
                <StatCard
                    title="Revenue (Month)"
                    value={formatCurrencyINR(totalRevenue)}
                    icon={<BanknotesIcon className="w-6 h-6" />}
                    color="secondary"
                    trend={{ value: '8.2%', positive: true }}
                />
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
                                <div key={status} className="group cursor-pointer">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary group-hover:text-primary transition-colors">{status}</span>
                                        <span className="text-xs font-bold text-text-primary">{count}</span>
                                    </div>
                                    <div className="w-full bg-subtle-background rounded-full h-1.5 overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${percentage}%` }}
                                            transition={{ duration: 1, ease: "easeOut" }}
                                            className="bg-primary h-full rounded-full"
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
        </motion.div>
    );
};

export default SalesOverviewPage;
