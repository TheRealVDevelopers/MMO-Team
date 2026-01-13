import React from 'react';
import { LEADS, USERS, formatLargeNumberINR, formatDateTime } from '../../../constants';
import { LeadPipelineStatus, UserRole } from '../../../types';
import {
    BanknotesIcon,
    PresentationChartLineIcon,
    PhoneIcon,
    FunnelIcon,
    ArrowLeftIcon,
    ChevronRightIcon,
    ClockIcon,
    CalendarIcon,
    MagnifyingGlassIcon,
    AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';
import { ContentCard, StatCard, cn, staggerContainer } from '../shared/DashboardUI';
import { motion, AnimatePresence } from 'framer-motion';
import { useLeads, updateLead } from '../../../hooks/useLeads';
import LeadDetailModal from '../../shared/LeadDetailModal';

const getStatusConfig = (status: LeadPipelineStatus) => {
    switch (status) {
        case LeadPipelineStatus.NEW_NOT_CONTACTED: return { color: 'text-error bg-error/10 border-error/20', label: 'Primary Inflow' };
        case LeadPipelineStatus.CONTACTED_CALL_DONE: return { color: 'text-amber-500 bg-amber-500/10 border-amber-500/20', label: 'Contacted' };
        case LeadPipelineStatus.SITE_VISIT_SCHEDULED: return { color: 'text-purple-500 bg-purple-500/10 border-purple-500/20', label: 'Inspected' };
        case LeadPipelineStatus.WAITING_FOR_DRAWING: return { color: 'text-slate-500 bg-slate-500/10 border-slate-500/20', label: 'Awaiting Design' };
        case LeadPipelineStatus.QUOTATION_SENT: return { color: 'text-primary bg-primary/10 border-primary/20', label: 'Negotiating' };
        case LeadPipelineStatus.NEGOTIATION: return { color: 'text-amber-500 bg-amber-500/10 border-amber-500/20', label: 'In Flux' };
        case LeadPipelineStatus.WON: return { color: 'text-green-500 bg-green-500/10 border-green-500/20', label: 'Converted' };
        case LeadPipelineStatus.LOST: return { color: 'text-slate-500 bg-slate-500/10 border-slate-500/20', label: 'Yield Lost' };
        default: return { color: 'text-primary bg-primary/10 border-primary/20', label: status };
    }
};


const LeadsManagementPage: React.FC<{ setCurrentPage: (page: string) => void }> = ({ setCurrentPage }) => {
    const { leads, loading } = useLeads();
    const [selectedLead, setSelectedLead] = React.useState<any>(null);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [statusFilter, setStatusFilter] = React.useState<LeadPipelineStatus | 'all'>('all');
    const [repFilter, setRepFilter] = React.useState<string | 'all'>('all');

    const pipelineCounts = leads.reduce((acc, lead) => {
        acc[lead.status] = (acc[lead.status] || 0) + 1;
        return acc;
    }, {} as Record<LeadPipelineStatus, number>);

    const totalLeads = leads.length;
    const wonLeads = pipelineCounts[LeadPipelineStatus.WON] || 0;
    const conversionRate = totalLeads > 0 ? (wonLeads / totalLeads) * 100 : 0;
    const totalValue = leads.reduce((sum, l) => sum + l.value, 0);

    const filteredLeads = React.useMemo(() => {
        return leads.filter(lead => {
            const matchesSearch = lead.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                lead.projectName.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
            const matchesRep = repFilter === 'all' || lead.assignedTo === repFilter;
            return matchesSearch && matchesStatus && matchesRep;
        });
    }, [leads, searchTerm, statusFilter, repFilter]);

    const salesTeam = USERS.filter(u => u.role === UserRole.SALES_TEAM_MEMBER || u.role === UserRole.SALES_GENERAL_MANAGER);

    const handleLeadUpdate = async (updatedLead: any) => {
        await updateLead(updatedLead.id, updatedLead);
        setSelectedLead(updatedLead);
    };

    const funnelStages = [
        { status: LeadPipelineStatus.NEW_NOT_CONTACTED, color: 'bg-error' },
        { status: LeadPipelineStatus.CONTACTED_CALL_DONE, color: 'bg-accent' },
        { status: LeadPipelineStatus.SITE_VISIT_SCHEDULED, color: 'bg-purple' },
        { status: LeadPipelineStatus.QUOTATION_SENT, color: 'bg-primary' },
        { status: LeadPipelineStatus.NEGOTIATION, color: 'bg-accent' },
        { status: LeadPipelineStatus.WON, color: 'bg-secondary' },
    ];

    const maxLeadsInStage = Math.max(...funnelStages.map(stage => pipelineCounts[stage.status] || 0), 1);

    return (
        <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="space-y-10"
        >
            <div className="flex items-center gap-4">
                <button
                    onClick={() => setCurrentPage('overview')}
                    className="group p-3 rounded-2xl border border-border bg-surface hover:bg-subtle-background hover:scale-105 transition-all text-text-tertiary shadow-sm"
                >
                    <ArrowLeftIcon className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                </button>
                <div className="h-6 w-px bg-border/40 mx-2" />
                <div>
                    <h2 className="text-3xl font-serif font-black text-text-primary tracking-tight">Lead Intel Hub</h2>
                    <p className="text-text-tertiary text-sm font-medium mt-1">Real-time funnel analytics and client conversion flow.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-8">
                    <ContentCard className="h-full shadow-xl">
                        <div className="flex items-center justify-between mb-8 pb-4 border-b border-border/40">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                    <FunnelIcon className="w-5 h-5" />
                                </div>
                                <h3 className="text-xl font-serif font-bold text-text-primary tracking-tight">Conversion Funnel</h3>
                            </div>
                            <span className="text-[10px] font-black tracking-widest text-text-tertiary uppercase italic">Units Distribution</span>
                        </div>

                        <div className="space-y-6">
                            {funnelStages.map((stage, idx) => {
                                const count = pipelineCounts[stage.status] || 0;
                                const widthPercentage = maxLeadsInStage > 0 ? (count / maxLeadsInStage) * 100 : 0;

                                return (
                                    <motion.div
                                        key={stage.status}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="flex items-center gap-6"
                                    >
                                        <div className="w-40 text-right">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-text-tertiary mb-0.5 whitespace-nowrap overflow-hidden text-ellipsis">{stage.status}</p>
                                        </div>
                                        <div className="flex-1 flex items-center gap-4">
                                            <div className="flex-1 bg-subtle-background/50 rounded-2xl h-8 overflow-hidden border border-border/20 shadow-inner group">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${widthPercentage}%` }}
                                                    transition={{ duration: 1, delay: idx * 0.1 }}
                                                    className={cn(stage.color, "h-full rounded-2xl flex items-center justify-end px-3 transition-transform group-hover:scale-[1.01]")}
                                                >
                                                    {widthPercentage > 15 && (
                                                        <span className="font-black text-[10px] text-white tracking-widest drop-shadow-sm">{count}</span>
                                                    )}
                                                </motion.div>
                                            </div>
                                            {widthPercentage <= 15 && (
                                                <span className="font-black text-[10px] text-text-primary tracking-widest">{count}</span>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </ContentCard>
                </div>

                <div className="lg:col-span-4 space-y-6">
                    <StatCard
                        title="Registry Total"
                        value={totalLeads}
                        icon={<PhoneIcon className="w-6 h-6" />}
                        color="primary"
                        trend={{ value: '12%', positive: true }}
                    />
                    <StatCard
                        title="Success Yield"
                        value={`${conversionRate.toFixed(1)}%`}
                        icon={<PresentationChartLineIcon className="w-6 h-6" />}
                        color="secondary"
                        trend={{ value: '5%', positive: true }}
                    />
                    <StatCard
                        title="Fiscal Depth"
                        value={formatLargeNumberINR(totalValue)}
                        icon={<BanknotesIcon className="w-6 h-6" />}
                        color="purple"
                        trend={{ value: '18%', positive: true }}
                    />
                </div>
            </div>

            <ContentCard className="!p-0 overflow-hidden shadow-2xl">
                <div className="p-8 border-b border-border/40 bg-subtle-background/30 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <ClockIcon className="w-5 h-5 text-accent" />
                        <h3 className="text-xl font-serif font-bold text-text-primary tracking-tight">Lead Registry</h3>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                        <div className="relative flex-grow md:w-64">
                            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                            <input
                                type="text"
                                placeholder="Search leads..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-11 pr-4 py-2 bg-surface border border-border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            className="px-4 py-2 bg-surface border border-border rounded-xl text-xs font-black uppercase tracking-widest outline-none"
                        >
                            <option value="all">Statuses</option>
                            {Object.values(LeadPipelineStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <select
                            value={repFilter}
                            onChange={(e) => setRepFilter(e.target.value)}
                            className="px-4 py-2 bg-surface border border-border rounded-xl text-xs font-black uppercase tracking-widest outline-none"
                        >
                            <option value="all">Strategists</option>
                            {salesTeam.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                    <table className="min-w-full">
                        <thead className="bg-surface border-b border-border/20">
                            <tr>
                                <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-text-tertiary">Stakeholder / Unit</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-text-tertiary">Strategist</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-text-tertiary">Mission State</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-text-tertiary">Initialization</th>
                                <th className="px-8 py-5 text-center text-[10px] font-black uppercase tracking-widest text-text-tertiary">intel</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/20 bg-surface">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-12 text-center text-text-tertiary animate-pulse font-black uppercase tracking-[0.2em]">Syncing Intelligence Stream...</td>
                                </tr>
                            ) : filteredLeads.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-12 text-center text-text-tertiary italic">No leads found matching criteria.</td>
                                </tr>
                            ) : filteredLeads.map((lead, idx) => {
                                const config = getStatusConfig(lead.status);
                                return (
                                    <motion.tr
                                        key={lead.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.03 }}
                                        onClick={() => setSelectedLead(lead)}
                                        className="group hover:bg-subtle-background/20 cursor-pointer transition-colors"
                                    >
                                        <td className="px-8 py-6">
                                            <p className="text-sm font-black text-text-primary group-hover:text-primary transition-colors mb-0.5">{lead.clientName}</p>
                                            <p className="text-[10px] font-black uppercase tracking-tighter text-text-tertiary">{lead.projectName}</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary border border-primary/20">
                                                    {USERS.find(u => u.id === lead.assignedTo)?.name.charAt(0)}
                                                </div>
                                                <span className="text-xs font-semibold text-text-secondary">{USERS.find(u => u.id === lead.assignedTo)?.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm", config.color)}>
                                                {config.label}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-xs font-bold text-text-tertiary tabular-nums">
                                            {formatDateTime(lead.inquiryDate)}
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <div className="w-8 h-8 rounded-xl bg-subtle-background flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all shadow-sm mx-auto">
                                                <ChevronRightIcon className="w-4 h-4" />
                                            </div>
                                        </td>
                                    </motion.tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </ContentCard>

            {selectedLead && (
                <LeadDetailModal
                    isOpen={!!selectedLead}
                    onClose={() => setSelectedLead(null)}
                    lead={selectedLead}
                    onUpdate={handleLeadUpdate}
                />
            )}
        </motion.div>
    );
};

export default LeadsManagementPage;