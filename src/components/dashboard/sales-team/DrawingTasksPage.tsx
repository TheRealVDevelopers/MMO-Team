import React from 'react';
import { USERS, formatDate } from '../../../constants';
import { DrawingRequest, DrawingRequestStatus } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import {
    PencilSquareIcon,
    UserIcon,
    CalendarDaysIcon,
    ChevronRightIcon,
    InboxIcon
} from '@heroicons/react/24/outline';
import { ContentCard, cn, staggerContainer } from '../shared/DashboardUI';
import { motion, AnimatePresence } from 'framer-motion';

const DrawingStatusPill: React.FC<{ status: DrawingRequestStatus }> = ({ status }) => {
    const config = {
        [DrawingRequestStatus.REQUESTED]: { color: 'text-primary bg-primary/10', label: 'Requested' },
        [DrawingRequestStatus.IN_PROGRESS]: { color: 'text-accent bg-accent/10', label: 'Design In-Progress' },
        [DrawingRequestStatus.COMPLETED]: { color: 'text-secondary bg-secondary/10', label: 'Blueprint Finalized' },
    }[status];

    return (
        <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider", config.color)}>
            {config.label}
        </span>
    );
};

const DrawingTasksPage: React.FC<{ setCurrentPage: (page: string) => void, drawingRequests: DrawingRequest[] }> = ({ drawingRequests }) => {
    const { currentUser } = useAuth();
    const myRequests = drawingRequests.filter(v => v.requesterId === currentUser?.id);

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
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-text-secondary">Project Blueprint</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-text-secondary">Assigned Architect</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-text-secondary">Initiation Date</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-text-secondary">Lifecycle Status</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-text-secondary">Track</th>
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
                                                    <PencilSquareIcon className="w-4 h-4 text-primary" />
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
                                                {USERS.find(u => u.id === req.assigneeId)?.name || 'Team Undefined'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2 text-xs text-text-secondary font-medium">
                                                <CalendarDaysIcon className="w-3 h-3 text-text-secondary/30" />
                                                {formatDate(req.requestDate)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <DrawingStatusPill status={req.status} />
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
                            <InboxIcon className="w-8 h-8 text-text-secondary/20" />
                        </div>
                        <p className="text-sm text-text-secondary font-medium uppercase tracking-widest">Architectural queue is currently vacant</p>
                    </div>
                )}
            </ContentCard>
        </motion.div>
    );
};

export default DrawingTasksPage;
