import React from 'react';
import { USERS, formatDate, formatCurrencyINR } from '../../../constants';
import { QuotationRequest, QuotationRequestStatus } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import {
    BanknotesIcon,
    UserIcon,
    CalendarDaysIcon,
    ChevronRightIcon,
    InboxStackIcon
} from '@heroicons/react/24/outline';
import { ContentCard, cn, staggerContainer } from '../shared/DashboardUI';
import { motion, AnimatePresence } from 'framer-motion';

const QuotationStatusPill: React.FC<{ status: QuotationRequestStatus }> = ({ status }) => {
    const config = {
        [QuotationRequestStatus.REQUESTED]: { color: 'text-primary bg-primary/10', label: 'Requested' },
        [QuotationRequestStatus.IN_PROGRESS]: { color: 'text-accent bg-accent/10', label: 'Drafting Quote' },
        [QuotationRequestStatus.COMPLETED]: { color: 'text-secondary bg-secondary/10', label: 'Proposal Dispatched' },
    }[status];

    return (
        <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider", config.color)}>
            {config.label}
        </span>
    );
};

const QuotationTasksPage: React.FC<{ setCurrentPage: (page: string) => void, quotationRequests: QuotationRequest[] }> = ({ quotationRequests }) => {
    const { currentUser } = useAuth();
    const myRequests = quotationRequests.filter(v => v.requesterId === currentUser?.id);

    return (
        <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-8"
        >
            <ContentCard className="p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-subtle-background/50 border-b border-border">
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-text-secondary">Proposal Project</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-text-secondary">Assigned Estimator</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-text-secondary">Sent Date</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-text-secondary">Status</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-text-secondary">Project Value</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-text-secondary">Flow</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                            <AnimatePresence mode="popLayout">
                                {myRequests.map(req => (
                                    <motion.tr
                                        layout
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        key={req.id}
                                        className="group hover:bg-primary/[0.02] cursor-pointer transition-all"
                                    >
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-subtle-background rounded-lg border border-border group-hover:border-primary/20 transition-all">
                                                    <BanknotesIcon className="w-4 h-4 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-text-primary group-hover:text-primary transition-colors">{req.projectName}</p>
                                                    <p className="text-[10px] text-text-secondary uppercase tracking-tighter mt-0.5">{req.clientName}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2 text-xs font-medium text-text-primary">
                                                <UserIcon className="w-3 h-3 text-text-secondary/40" />
                                                {USERS.find(u => u.id === req.assigneeId)?.name || 'Estimation Team'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2 text-xs text-text-secondary font-medium">
                                                <CalendarDaysIcon className="w-3 h-3 text-text-secondary/30" />
                                                {formatDate(req.requestDate)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <QuotationStatusPill status={req.status} />
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="text-sm font-black text-text-primary">
                                                {req.quotedAmount ? formatCurrencyINR(req.quotedAmount) : 'Pending Valuation'}
                                            </div>
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
                {myRequests.length === 0 && (
                    <div className="text-center py-20 bg-surface">
                        <div className="w-16 h-16 bg-subtle-background rounded-2xl flex items-center justify-center mx-auto mb-4 border border-border">
                            <InboxStackIcon className="w-8 h-8 text-text-secondary/20" />
                        </div>
                        <p className="text-sm text-text-secondary font-medium uppercase tracking-widest">No active quotation streams found</p>
                    </div>
                )}
            </ContentCard>
        </motion.div>
    );
};

export default QuotationTasksPage;
