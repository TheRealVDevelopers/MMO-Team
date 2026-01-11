import React, { useState } from 'react';
import { useStaffPerformance } from '../../../hooks/useStaffPerformance';
import { ContentCard, cn } from '../shared/DashboardUI';
import {
    CheckCircleIcon,
    ExclamationCircleIcon,
    ExclamationTriangleIcon,
    ChevronRightIcon,
    UserIcon,
    BriefcaseIcon,
    ClockIcon,
    FlagIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { User, UserRole } from '../../../types';

/**
 * Detailed modal showing users in a specific performance flag zone
 */
const FlagZoneDetailModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    zone: 'green' | 'yellow' | 'red';
    users: User[];
}> = ({ isOpen, onClose, zone, users }) => {
    if (!isOpen) return null;

    const zoneConfig = {
        green: { icon: <CheckCircleIcon className="w-8 h-8 text-secondary" />, title: 'Optimal Performance (Green)', color: 'text-secondary', bg: 'bg-secondary/10' },
        yellow: { icon: <ExclamationTriangleIcon className="w-8 h-8 text-accent" />, title: 'At-Risk Performance (Yellow)', color: 'text-accent', bg: 'bg-accent/10' },
        red: { icon: <ExclamationCircleIcon className="w-8 h-8 text-error" />, title: 'Failing Performance (Red)', color: 'text-error', bg: 'bg-error/10' }
    }[zone];

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-surface rounded-3xl w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl border border-border"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className={cn("p-8 flex items-center justify-between border-b border-border shadow-sm", zoneConfig.bg)}>
                        <div className="flex items-center gap-4">
                            {zoneConfig.icon}
                            <div>
                                <h3 className={cn("text-2xl font-serif font-bold", zoneConfig.color)}>{zoneConfig.title}</h3>
                                <p className="text-text-secondary text-sm">{users.length} team members currently in this threshold</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-background rounded-xl transition-colors">
                            <ChevronRightIcon className="w-6 h-6 text-text-secondary rotate-90" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-background/50">
                        {users.length > 0 ? (
                            users.map((user) => (
                                <motion.div
                                    key={user.id}
                                    layout
                                    className="bg-surface p-6 rounded-2xl border border-border shadow-sm hover:shadow-md transition-all group"
                                >
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                <img src={user.avatar} alt={user.name} className="w-14 h-14 rounded-2xl object-cover ring-2 ring-border group-hover:ring-primary/30 transition-all" />
                                                <div className={cn(
                                                    "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-surface",
                                                    zone === 'green' ? 'bg-secondary' : zone === 'yellow' ? 'bg-accent' : 'bg-error'
                                                )} />
                                            </div>
                                            <div>
                                                <h4 className="text-lg font-bold text-text-primary">{user.name}</h4>
                                                <p className="text-xs font-black uppercase tracking-widest text-text-tertiary">{user.role}</p>
                                            </div>
                                        </div>

                                        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="p-2 bg-subtle-background rounded-xl">
                                                <p className="text-[10px] font-black uppercase tracking-tighter text-text-tertiary mb-1">Active Tasks</p>
                                                <p className="text-sm font-bold text-text-primary flex items-center gap-1">
                                                    <BriefcaseIcon className="w-3.5 h-3.5 text-primary" />
                                                    {user.activeTaskCount || 0}
                                                </p>
                                            </div>
                                            <div className="p-2 bg-subtle-background rounded-xl">
                                                <p className="text-[10px] font-black uppercase tracking-tighter text-text-tertiary mb-1">Overdue</p>
                                                <p className={cn("text-sm font-bold flex items-center gap-1", (user.overdueTaskCount || 0) > 0 ? "text-error" : "text-text-primary")}>
                                                    <ExclamationCircleIcon className="w-3.5 h-3.5" />
                                                    {user.overdueTaskCount || 0}
                                                </p>
                                            </div>
                                            <div className="p-2 bg-subtle-background rounded-xl">
                                                <p className="text-[10px] font-black uppercase tracking-tighter text-text-tertiary mb-1">Upcoming</p>
                                                <p className="text-sm font-bold text-text-primary flex items-center gap-1">
                                                    <ClockIcon className="w-3.5 h-3.5 text-accent" />
                                                    {user.upcomingDeadlineCount || 0}
                                                </p>
                                            </div>
                                            <div className="p-2 bg-subtle-background rounded-xl">
                                                <p className="text-[10px] font-black uppercase tracking-tighter text-text-tertiary mb-1">Latest Update</p>
                                                <p className="text-[10px] font-medium text-text-secondary">
                                                    {user.flagUpdatedAt ? new Date(user.flagUpdatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="md:w-1/4">
                                            <div className={cn(
                                                "p-3 rounded-xl border flex items-start gap-2",
                                                zone === 'green' ? 'bg-secondary/5 border-secondary/10' : zone === 'yellow' ? 'bg-accent/5 border-accent/10' : 'bg-error/5 border-error/10'
                                            )}>
                                                <FlagIcon className={cn("w-4 h-4 mt-0.5", zoneConfig.color)} />
                                                <p className="text-xs font-semibold leading-tight text-text-secondary italic">
                                                    {user.flagReason || 'Synchronizing metrics...'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="text-center py-20 bg-surface rounded-3xl border border-dashed border-border">
                                <UserIcon className="w-16 h-16 text-text-tertiary mx-auto mb-4 opacity-20" />
                                <p className="text-text-secondary font-medium uppercase tracking-widest italic">No personnel in this threshold</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

/**
 * Performance Summary counters for the Admin Dashboard
 */
const PerformanceFlagSummary: React.FC = () => {
    const { staff, performanceStats, loading } = useStaffPerformance();
    const [selectedZone, setSelectedZone] = useState<'green' | 'yellow' | 'red' | null>(null);

    const cards = [
        {
            id: 'green',
            title: 'Green Flag',
            count: performanceStats.green,
            color: 'text-secondary',
            bg: 'bg-secondary/10',
            borderColor: 'border-secondary',
            icon: <CheckCircleIcon className="w-6 h-6" />,
            description: 'On track for today'
        },
        {
            id: 'yellow',
            title: 'Yellow Flag',
            count: performanceStats.yellow,
            color: 'text-accent',
            bg: 'bg-accent/10',
            borderColor: 'border-accent',
            icon: <ExclamationTriangleIcon className="w-6 h-6" />,
            description: 'Pending tasks (4 PM Warning)'
        },
        {
            id: 'red',
            title: 'Red Flag',
            count: performanceStats.red,
            color: 'text-error',
            bg: 'bg-error/10',
            borderColor: 'border-error',
            icon: <ExclamationCircleIcon className="w-6 h-6" />,
            description: 'Incomplete tasks (6 PM Audit)'
        }
    ];

    if (loading && staff.length === 0) {
        return (
            <div className="grid grid-cols-3 gap-6 animate-pulse">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-32 bg-subtle-background rounded-3xl border border-border" />
                ))}
            </div>
        );
    }

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {cards.map((card) => (
                    <motion.button
                        key={card.id}
                        whileHover={{ y: -4, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedZone(card.id as any)}
                        className={cn(
                            "relative overflow-hidden p-6 rounded-3xl border text-left transition-all shadow-sm hover:shadow-xl",
                            card.bg,
                            card.borderColor,
                            "border-2"
                        )}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className={cn("p-2.5 rounded-xl bg-surface shadow-sm", card.color)}>
                                {card.icon}
                            </div>
                            <span className={cn("text-4xl font-black tracking-tighter", card.color)}>
                                {card.count}
                            </span>
                        </div>
                        <div>
                            <h4 className={cn("text-lg font-serif font-bold tracking-tight", card.color)}>{card.title}</h4>
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-tertiary mt-1 opacity-70">{card.description}</p>
                        </div>

                        <div className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 opacity-10">
                            {card.icon}
                        </div>
                    </motion.button>
                ))}
            </div>

            <FlagZoneDetailModal
                isOpen={!!selectedZone}
                onClose={() => setSelectedZone(null)}
                zone={selectedZone!}
                users={staff.filter(u => u.performanceFlag === selectedZone)}
            />
        </>
    );
};

export default PerformanceFlagSummary;
