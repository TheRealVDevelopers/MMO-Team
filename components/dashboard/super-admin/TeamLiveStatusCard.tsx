import React from 'react';
import { UserRole } from '../../../types';
import { UsersIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { ContentCard, cn } from '../shared/DashboardUI';
import { motion } from 'framer-motion';
import { useStaffPerformance } from '../../../hooks/useStaffPerformance';

const teamOrder: UserRole[] = [
    UserRole.SALES_TEAM_MEMBER,
    UserRole.SITE_ENGINEER,
    UserRole.DRAWING_TEAM,
    UserRole.QUOTATION_TEAM,
    UserRole.PROCUREMENT_TEAM,
    UserRole.EXECUTION_TEAM,
    UserRole.ACCOUNTS_TEAM,
];

const TeamLiveStatusCard: React.FC = () => {
    const { staff } = useStaffPerformance();

    // Group staff by role
    const groupedStaff = React.useMemo(() => {
        const groups: Partial<Record<UserRole, { total: number; active: number; redFlag: number }>> = {};

        staff.forEach(user => {
            if (!groups[user.role]) {
                groups[user.role] = { total: 0, active: 0, redFlag: 0 };
            }
            if (groups[user.role]) {
                groups[user.role]!.total++;
                // Active if not red flagged (simplification for "Pulse")
                if (user.performanceFlag !== 'red') {
                    groups[user.role]!.active++;
                }
                if (user.performanceFlag === 'red') {
                    groups[user.role]!.redFlag++;
                }
            }
        });
        return groups;
    }, [staff]);

    return (
        <ContentCard>
            <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <UsersIcon className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-xl font-serif font-bold text-text-primary tracking-tight">Deployment Pulse</h3>
                    <p className="text-xs text-text-tertiary">Real-time workforce availability</p>
                </div>
            </div>

            <div className="space-y-6">
                {teamOrder.map((role, idx) => {
                    const stats = groupedStaff[role] || { total: 0, active: 0, redFlag: 0 };
                    if (stats.total === 0) return null;

                    const activePercentage = stats.total > 0 ? (stats.active / stats.total) * 100 : 0;

                    return (
                        <motion.div
                            key={role}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="bg-background rounded-xl p-4 border border-border"
                        >
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="text-sm font-bold text-text-primary">{role}</h4>
                                <span className={cn(
                                    "px-2 py-0.5 rounded-full text-[10px] font-black uppercase",
                                    activePercentage === 100 ? "bg-emerald-500/10 text-emerald-500" : "bg-text-secondary/10 text-text-secondary"
                                )}>
                                    {stats.active}/{stats.total} Active
                                </span>
                            </div>

                            {/* Status Bar */}
                            <div className="flex gap-1 h-1.5 w-full rounded-full overflow-hidden bg-border/30">
                                {Array.from({ length: stats.total }).map((_, i) => (
                                    <div
                                        key={i}
                                        className={cn(
                                            "flex-1 rounded-full",
                                            i < stats.active ? "bg-emerald-500" : "bg-error"
                                        )}
                                    />
                                ))}
                            </div>

                            <div className="flex items-center gap-4 mt-3 text-[10px] font-medium text-text-tertiary">
                                <span className="flex items-center gap-1.5">
                                    <CheckCircleIcon className="w-3 h-3 text-emerald-500" />
                                    {stats.active} Online
                                </span>
                                {stats.redFlag > 0 && (
                                    <span className="flex items-center gap-1.5 text-error">
                                        <ClockIcon className="w-3 h-3" />
                                        {stats.redFlag} Delayed
                                    </span>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </ContentCard>
    );
};

export default TeamLiveStatusCard;