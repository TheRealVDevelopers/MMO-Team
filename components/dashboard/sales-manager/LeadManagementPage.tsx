import React, { useState, useMemo } from 'react';
import { USERS, formatDateTime, formatLargeNumberINR } from '../../../constants';
import { Lead, LeadPipelineStatus, UserRole } from '../../../types';
import { useSearchParams } from 'react-router-dom';
import {
    FunnelIcon,
    BanknotesIcon,
    ChartBarIcon,
    CalendarIcon,
    MagnifyingGlassIcon,
    AdjustmentsHorizontalIcon,
    ChevronRightIcon
} from '@heroicons/react/24/outline';
import { StatCard, ContentCard, cn, staggerContainer } from '../shared/DashboardUI';
import { motion, AnimatePresence } from 'framer-motion';
import LeadDetailModal from '../../shared/LeadDetailModal';
import { updateLead } from '../../../hooks/useLeads';

const salesTeam = USERS.filter(u => u.role === UserRole.SALES_TEAM_MEMBER);

const LeadStatusPill: React.FC<{ status: LeadPipelineStatus }> = ({ status }) => {
    const variants: Record<string, string> = {
        [LeadPipelineStatus.NEW_NOT_CONTACTED]: 'bg-error/10 text-error',
        [LeadPipelineStatus.CONTACTED_CALL_DONE]: 'bg-accent/10 text-accent',
        [LeadPipelineStatus.SITE_VISIT_SCHEDULED]: 'bg-purple/10 text-purple',
        [LeadPipelineStatus.SITE_VISIT_RESCHEDULED]: 'bg-orange-500/10 text-orange-500',
        [LeadPipelineStatus.WAITING_FOR_DRAWING]: 'bg-kurchi-gold-400/10 text-kurchi-gold-600',
        [LeadPipelineStatus.DRAWING_IN_PROGRESS]: 'bg-blue-500/10 text-blue-500',
        [LeadPipelineStatus.DRAWING_REVISIONS]: 'bg-indigo-500/10 text-indigo-500',
        [LeadPipelineStatus.WAITING_FOR_QUOTATION]: 'bg-teal-500/10 text-teal-500',
        [LeadPipelineStatus.QUOTATION_SENT]: 'bg-primary/10 text-primary',
        [LeadPipelineStatus.NEGOTIATION]: 'bg-amber-500/10 text-amber-500',
        [LeadPipelineStatus.IN_PROCUREMENT]: 'bg-purple/10 text-purple',
        [LeadPipelineStatus.IN_EXECUTION]: 'bg-accent/10 text-accent',
        [LeadPipelineStatus.WON]: 'bg-green-500/10 text-green-500',
        [LeadPipelineStatus.LOST]: 'bg-text-secondary/10 text-text-secondary',
    };
    return (
        <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter", variants[status] || 'bg-subtle-background text-text-tertiary')}>
            {status}
        </span>
    );
};

const PriorityPill: React.FC<{ priority: 'High' | 'Medium' | 'Low' }> = ({ priority }) => {
    const variants: Record<string, string> = {
        High: 'bg-error/10 text-error',
        Medium: 'bg-accent/10 text-accent',
        Low: 'bg-text-secondary/10 text-text-secondary',
    };
    return (
        <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter", variants[priority])}>
            {priority}
        </span>
    );
};

interface LeadManagementPageProps {
    leads: Lead[];
}

const LeadManagementPage: React.FC<LeadManagementPageProps> = ({ leads }) => {
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [filter, setFilter] = useState<{ status: LeadPipelineStatus | 'all', rep: string | 'all' }>({ status: 'all', rep: 'all' });
    const [searchTerm, setSearchTerm] = useState('');
    const [searchParams, setSearchParams] = useSearchParams();

    // Handle deep linking from notifications
    React.useEffect(() => {
        const leadId = searchParams.get('openLead');
        if (leadId && leads.length > 0) {
            const lead = leads.find(l => l.id === leadId);
            if (lead) {
                setSelectedLead(lead);
                // Clear param after opening
                const newParams = new URLSearchParams(searchParams);
                newParams.delete('openLead');
                setSearchParams(newParams, { replace: true });
            }
        }
    }, [searchParams, leads, setSearchParams]);

    const filteredLeads = useMemo(() => {
        const lowercasedSearchTerm = searchTerm.toLowerCase();
        return leads.filter(lead =>
            (filter.status === 'all' || lead.status === filter.status) &&
            (filter.rep === 'all' || lead.assignedTo === filter.rep) &&
            (lead.clientName.toLowerCase().includes(lowercasedSearchTerm) ||
                lead.projectName.toLowerCase().includes(lowercasedSearchTerm))
        );
    }, [filter, leads, searchTerm]);

    const handleLeadUpdate = async (updatedLead: Lead) => {
        await updateLead(updatedLead.id, updatedLead);
        setSelectedLead(updatedLead);
    };

    const { pipelineCounts, totalLeads, conversionRate, pipelineValue } = useMemo(() => {
        const counts = leads.reduce((acc, lead) => {
            acc[lead.status] = (acc[lead.status] || 0) + 1;
            return acc;
        }, {} as Record<LeadPipelineStatus, number>);

        const total = leads.length;
        const won = counts[LeadPipelineStatus.WON] || 0;
        const conversion = total > 0 ? (won / total) * 100 : 0;
        const value = leads.reduce((sum, l) => ![LeadPipelineStatus.WON, LeadPipelineStatus.LOST].includes(l.status) ? sum + l.value : sum, 0);

        return {
            pipelineCounts: counts,
            totalLeads: total,
            conversionRate: conversion,
            pipelineValue: value,
        };
    }, [leads]);

    const funnelStages = [
        { status: LeadPipelineStatus.NEW_NOT_CONTACTED, color: 'bg-error' },
        { status: LeadPipelineStatus.CONTACTED_CALL_DONE, color: 'bg-accent' },
        { status: LeadPipelineStatus.SITE_VISIT_SCHEDULED, color: 'bg-purple' },
        { status: LeadPipelineStatus.QUOTATION_SENT, color: 'bg-primary' },
        { status: LeadPipelineStatus.NEGOTIATION, color: 'bg-secondary' },
        { status: LeadPipelineStatus.WON, color: 'bg-green-500' },
    ];

    const maxLeadsInStage = Math.max(...funnelStages.map(stage => pipelineCounts[stage.status] || 0), 1);

    return (
        <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-8"
        >
            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Registry" value={totalLeads.toString()} icon={<FunnelIcon className="w-6 h-6" />} color="primary" />
                <StatCard title="Win Ratio" value={`${conversionRate.toFixed(1)}%`} icon={<ChartBarIcon className="w-6 h-6" />} color="purple" />
                <StatCard title="Pipeline Net" value={formatLargeNumberINR(pipelineValue)} icon={<BanknotesIcon className="w-6 h-6" />} color="secondary" />
                <StatCard
                    title="Won (Month)"
                    value={(leads.filter(l => {
                        const startOfMonth = new Date();
                        startOfMonth.setDate(1);
                        startOfMonth.setHours(0, 0, 0, 0);
                        return l.status === LeadPipelineStatus.WON && l.inquiryDate >= startOfMonth;
                    })).length.toString()}
                    icon={<CalendarIcon className="w-6 h-6" />}
                    color="accent"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Funnel Widget */}
                <ContentCard className="lg:col-span-2">
                    <h3 className="text-xl font-serif font-bold text-text-primary mb-8">Sales Velocity</h3>
                    <div className="space-y-6">
                        {funnelStages.map((stage) => {
                            const count = pipelineCounts[stage.status] || 0;
                            const widthPercentage = maxLeadsInStage > 0 ? (count / maxLeadsInStage) * 100 : 0;

                            return (
                                <div key={stage.status} className="space-y-2">
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-text-secondary">
                                        <span>{stage.status}</span>
                                        <span className="text-text-primary">{count}</span>
                                    </div>
                                    <div className="bg-subtle-background rounded-full h-2 w-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${widthPercentage}%` }}
                                            transition={{ duration: 1, ease: "easeOut" }}
                                            className={cn("h-full rounded-full transition-all duration-500", stage.color)}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </ContentCard>

                {/* Table Widget */}
                <ContentCard className="lg:col-span-3">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
                        <div className="relative flex-grow w-full max-w-md">
                            <MagnifyingGlassIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary/50" />
                            <input
                                type="text"
                                placeholder="Search leads..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-6 py-3 bg-background border border-border rounded-2xl text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                            />
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <select
                                value={filter.status}
                                onChange={e => setFilter(f => ({ ...f, status: e.target.value as any }))}
                                className="bg-background border border-border rounded-xl py-2 px-3 text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                            >
                                <option value="all">Statuses</option>
                                {Object.values(LeadPipelineStatus).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <select
                                value={filter.rep}
                                onChange={e => setFilter(f => ({ ...f, rep: e.target.value }))}
                                className="bg-background border border-border rounded-xl py-2 px-3 text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                            >
                                <option value="all">Reps</option>
                                {salesTeam.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border">
                                    <th className="px-4 py-4 text-left text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">Lead Information</th>
                                    <th className="px-4 py-4 text-left text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">Assignment</th>
                                    <th className="px-4 py-4 text-left text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">Status</th>
                                    <th className="px-4 py-4 text-right text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                <AnimatePresence mode="popLayout">
                                    {filteredLeads.map(lead => (
                                        <motion.tr
                                            layout
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            key={lead.id}
                                            onClick={() => setSelectedLead(lead)}
                                            className="group cursor-pointer hover:bg-primary/5 transition-colors"
                                        >
                                            <td className="px-4 py-5">
                                                <p className="text-sm font-bold text-text-primary group-hover:text-primary transition-colors">{lead.clientName}</p>
                                                <p className="text-[10px] text-text-secondary uppercase tracking-widest">{lead.projectName}</p>
                                            </td>
                                            <td className="px-4 py-5">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-lg bg-subtle-background flex items-center justify-center text-[10px] font-bold">
                                                        {USERS.find(u => u.id === lead.assignedTo)?.name.charAt(0)}
                                                    </div>
                                                    <span className="text-xs text-text-primary">{USERS.find(u => u.id === lead.assignedTo)?.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-5">
                                                <LeadStatusPill status={lead.status} />
                                            </td>
                                            <td className="px-4 py-5 text-right">
                                                <ChevronRightIcon className="w-4 h-4 text-text-secondary/30 group-hover:text-primary transition-all group-hover:translate-x-1" />
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                </ContentCard>
            </div>

            {selectedLead && (
                <LeadDetailModal
                    lead={selectedLead}
                    isOpen={!!selectedLead}
                    onClose={() => setSelectedLead(null)}
                    onUpdate={handleLeadUpdate}
                />
            )}
        </motion.div>
    );
};

export default LeadManagementPage;
