import React, { useState, useMemo } from 'react';
import { USERS, LEADS, formatDateTime } from '../../../constants';
import { SiteVisit, SiteVisitStatus } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import {
    PlusIcon,
    CalendarIcon,
    UserIcon,
    ChatBubbleBottomCenterTextIcon,
    FunnelIcon,
    ChevronRightIcon
} from '@heroicons/react/24/outline';
import AssignVisitModal from './AssignVisitModal';
import { ContentCard, cn, staggerContainer } from '../shared/DashboardUI';
import { motion, AnimatePresence } from 'framer-motion';

const VisitStatusPill: React.FC<{ status: SiteVisitStatus }> = ({ status }) => {
    const config = {
        [SiteVisitStatus.SCHEDULED]: { color: 'text-primary bg-primary/10', label: 'Scheduled' },
        [SiteVisitStatus.COMPLETED]: { color: 'text-accent bg-accent/10', label: 'In Review' },
        [SiteVisitStatus.REPORT_SUBMITTED]: { color: 'text-secondary bg-secondary/10', label: 'Dispatched' },
    }[status];

    return (
        <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider", config.color)}>
            {config.label}
        </span>
    );
};

const SiteVisitTasksPage: React.FC<{ setCurrentPage: (page: string) => void; siteVisits: SiteVisit[]; onScheduleVisit: (visitData: Omit<SiteVisit, 'id' | 'status'>) => void; }> = ({ siteVisits, onScheduleVisit }) => {
    const { currentUser } = useAuth();
    const [isModalOpen, setModalOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState<SiteVisitStatus | 'all'>('all');

    const myVisits = useMemo(() => {
        if (!currentUser) return [];
        return siteVisits.filter(visit =>
            visit.requesterId === currentUser.id &&
            (statusFilter === 'all' || visit.status === statusFilter)
        );
    }, [currentUser, statusFilter, siteVisits]);

    const myLeads = useMemo(() => {
        if (!currentUser) return [];
        return LEADS.filter(lead => lead.assignedTo === currentUser.id);
    }, [currentUser]);

    if (!currentUser) return null;

    return (
        <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-8"
        >
            <div className="flex justify-end items-center mb-6">
                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                            <FunnelIcon className="w-4 h-4 text-text-secondary group-hover:text-primary transition-colors" />
                        </div>
                        <select
                            id="status-filter"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            className="pl-10 pr-8 py-2.5 bg-background border border-border rounded-xl text-xs font-bold text-text-primary focus:ring-1 focus:ring-primary focus:border-primary transition-all appearance-none cursor-pointer outline-none min-w-[160px]"
                        >
                            <option value="all">Synchronize All</option>
                            {Object.values(SiteVisitStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <button
                        onClick={() => setModalOpen(true)}
                        className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary/90 transition-all shadow-sm"
                    >
                        <PlusIcon className="w-4 h-4" />
                        Init Visit
                    </button>
                </div>
            </div>

            <ContentCard className="p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-subtle-background/50 border-b border-border">
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-text-secondary">Inspection Project</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-text-secondary">Field Officer</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-text-secondary">Schedule</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-text-secondary">Status</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-text-secondary">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                            <AnimatePresence mode="popLayout">
                                {myVisits.map(visit => (
                                    <motion.tr
                                        layout
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        key={visit.id}
                                        className="group hover:bg-primary/[0.02] cursor-pointer transition-all"
                                    >
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-subtle-background rounded-lg border border-border group-hover:border-primary/20 transition-all">
                                                    <CalendarIcon className="w-4 h-4 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-text-primary group-hover:text-primary transition-colors">{visit.projectName}</p>
                                                    <p className="text-[10px] text-text-secondary uppercase tracking-tighter mt-0.5">{visit.clientName}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2 text-xs font-medium text-text-primary">
                                                <UserIcon className="w-3 h-3 text-text-secondary/40" />
                                                {USERS.find(u => u.id === visit.assigneeId)?.name || 'N/A'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="text-xs text-text-secondary font-medium uppercase tracking-tight">
                                                {formatDateTime(visit.date)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <VisitStatusPill status={visit.status} />
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <button className="p-2 text-text-secondary hover:text-primary hover:bg-primary/10 rounded-lg transition-all">
                                                <ChevronRightIcon className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
                {myVisits.length === 0 && (
                    <div className="text-center py-20 bg-surface">
                        <div className="w-16 h-16 bg-subtle-background rounded-2xl flex items-center justify-center mx-auto mb-4 border border-border">
                            <ChatBubbleBottomCenterTextIcon className="w-8 h-8 text-text-secondary/20" />
                        </div>
                        <p className="text-sm text-text-secondary font-medium uppercase tracking-widest">No visit logs recorded in stream</p>
                    </div>
                )}
            </ContentCard>

            <AssignVisitModal
                isOpen={isModalOpen}
                onClose={() => setModalOpen(false)}
                leads={myLeads}
                requesterId={currentUser.id}
                onSchedule={onScheduleVisit}
            />
        </motion.div>
    );
};

export default SiteVisitTasksPage;
