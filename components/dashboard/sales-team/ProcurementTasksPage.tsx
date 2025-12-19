import React from 'react';
import { USERS, formatDate } from '../../../constants';
import { ProcurementRequest, ProcurementRequestStatus } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import {
    ArchiveBoxIcon,
    ArrowLeftIcon,
    ClockIcon,
    CheckCircleIcon,
    UserIcon,
    CalendarIcon,
    ShoppingBagIcon
} from '@heroicons/react/24/outline';
import {
    ContentCard,
    cn,
    staggerContainer
} from '../shared/DashboardUI';
import { motion } from 'framer-motion';

const getStatusConfig = (status: ProcurementRequestStatus) => {
    switch (status) {
        case ProcurementRequestStatus.REQUESTED:
            return { color: 'text-blue-500 bg-blue-500/10 border-blue-500/20', icon: ClockIcon };
        case ProcurementRequestStatus.IN_PROGRESS:
            return { color: 'text-amber-500 bg-amber-500/10 border-amber-500/20', icon: ClockIcon };
        case ProcurementRequestStatus.COMPLETED:
            return { color: 'text-green-500 bg-green-500/10 border-green-500/20', icon: CheckCircleIcon };
        default:
            return { color: 'text-gray-500 bg-gray-500/10 border-gray-500/20', icon: ClockIcon };
    }
};

const ProcurementStatusPill: React.FC<{ status: ProcurementRequestStatus }> = ({ status }) => {
    const config = getStatusConfig(status);
    const Icon = config.icon;

    return (
        <span className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
            config.color
        )}>
            <Icon className="w-3.5 h-3.5" />
            {status}
        </span>
    );
};

const ProcurementTasksPage: React.FC<{ setCurrentPage: (page: string) => void, procurementRequests: ProcurementRequest[] }> = ({ setCurrentPage, procurementRequests }) => {
    const { currentUser } = useAuth();
    const myRequests = procurementRequests.filter(v => v.requesterId === currentUser?.id);

    return (
        <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="space-y-6"
        >
            <ContentCard
                title="Procurement Requests"
                subtitle="Track and manage material procurement for your projects"
                icon={ShoppingBagIcon}
            >
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border/40">
                        <thead>
                            <tr className="bg-subtle-background/50">
                                <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Project</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Assigned To</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Materials</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40 bg-transparent">
                            {myRequests.map((req, index) => (
                                <motion.tr
                                    key={req.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="group hover:bg-subtle-background/30 transition-colors"
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                                <ArchiveBoxIcon className="w-4 h-4" />
                                            </div>
                                            <span className="text-sm font-semibold text-text-primary group-hover:text-primary transition-colors">
                                                {req.projectName}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <UserIcon className="w-4 h-4 text-text-tertiary" />
                                            <span className="text-sm text-text-secondary font-medium">
                                                {USERS.find(u => u.id === req.assigneeId)?.name || 'Unassigned'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2 text-text-tertiary">
                                            <CalendarIcon className="w-4 h-4" />
                                            <span className="text-sm font-medium">{formatDate(req.requestDate)}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <ProcurementStatusPill status={req.status} />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="max-w-xs truncate text-sm text-text-secondary italic">
                                            {req.materials}
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                            {myRequests.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="text-center py-12">
                                        <div className="flex flex-col items-center gap-2 text-text-tertiary">
                                            <ShoppingBagIcon className="w-12 h-12 opacity-20" />
                                            <p className="text-sm font-medium">No procurement tasks found</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </ContentCard>
        </motion.div>
    );
};

export default ProcurementTasksPage;
