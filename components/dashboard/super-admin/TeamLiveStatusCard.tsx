import React, { useMemo } from 'react';
import { USERS, TASKS } from '../../../constants';
import { UserRole, TaskStatus } from '../../../types';
import { UsersIcon } from '@heroicons/react/24/outline';
import { ContentCard, cn } from '../shared/DashboardUI';
import { motion } from 'framer-motion';

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

    const teamStats = useMemo(() => {
        const usersByRole: Record<string, string[]> = {};
        for (const user of USERS) {
            if (!usersByRole[user.role]) {
                usersByRole[user.role] = [];
            }
            usersByRole[user.role].push(user.id);
        }

        const stats: { team: UserRole, completed: number, inProgress: number, pending: number, members: number }[] = [];

        for (const role of teamOrder) {
            const userIds = usersByRole[role] || [];
            if (userIds.length > 0) {
                const teamTasks = TASKS.filter(task => userIds.includes(task.userId));
                const completed = teamTasks.filter(t => t.status === TaskStatus.COMPLETED).length;
                const inProgress = teamTasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
                const pending = teamTasks.filter(t => t.status === TaskStatus.PENDING).length;

                stats.push({
                    team: role,
                    completed,
                    inProgress,
                    pending,
                    members: userIds.length
                });
            }
        }
        return stats;

    }, []);

    return (
        <ContentCard>
            <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <UsersIcon className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-xl font-serif font-bold text-text-primary tracking-tight">Deployment Pulse</h3>
                    <p className="text-xs text-text-tertiary">Real-time engagement across departments</p>
                </div>
            </div>

            <div className="space-y-8">
                {teamStats.map((stat, idx) => {
                    const total = stat.completed + stat.inProgress + stat.pending;
                    const compPerc = total > 0 ? (stat.completed / total) * 100 : 0;
                    const progPerc = total > 0 ? (stat.inProgress / total) * 100 : 0;
                    const pendPerc = total > 0 ? (stat.pending / total) * 100 : 0;

                    return (
                        <motion.div
                            key={stat.team}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                        >
                            <div className="flex justify-between items-end mb-3">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-text-tertiary mb-1">Squad</p>
                                    <p className="text-sm font-bold text-text-primary">{stat.team}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-text-tertiary mb-1">Strength</p>
                                    <p className="text-sm font-bold text-primary">{stat.members} <span className="text-[10px] text-text-tertiary font-medium">Headcount</span></p>
                                </div>
                            </div>

                            <div className="relative">
                                <div className="w-full bg-border/20 rounded-full h-2.5 flex overflow-hidden shadow-inner">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${compPerc}%` }}
                                        className="bg-secondary"
                                    />
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progPerc}%` }}
                                        className="bg-accent"
                                    />
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${pendPerc}%` }}
                                        className="bg-error"
                                    />
                                </div>

                                <div className="flex items-center gap-4 mt-3">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-secondary" />
                                        <span className="text-[10px] font-black uppercase tracking-tighter text-text-secondary">{stat.completed} Synchronized</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-accent" />
                                        <span className="text-[10px] font-black uppercase tracking-tighter text-text-secondary">{stat.inProgress} Active</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-error" />
                                        <span className="text-[10px] font-black uppercase tracking-tighter text-text-secondary">{stat.pending} Latency</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </ContentCard>
    );
};

export default TeamLiveStatusCard;