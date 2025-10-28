
import React, { useMemo } from 'react';
import Card from '../../shared/Card';
import { USERS, TASKS } from '../../../constants';
import { UserRole, TaskStatus } from '../../../types';
import { UsersIcon } from '../../icons/IconComponents';

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
            if(userIds.length > 0) {
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
        <Card>
            <h3 className="text-lg font-bold flex items-center mb-4">
                <UsersIcon className="w-6 h-6 mr-2" />
                Team Live Status
            </h3>
            <div className="space-y-4">
                {teamStats.map(stat => (
                    <div key={stat.team}>
                        <div className="flex justify-between items-center mb-1">
                            <p className="text-sm font-bold text-text-primary">{stat.team} ({stat.members} members)</p>
                             <div className="flex space-x-2 text-xs font-semibold">
                                <span className="text-secondary">🟢 {stat.completed}</span>
                                <span className="text-accent">🟡 {stat.inProgress}</span>
                                <span className="text-error">🔴 {stat.pending}</span>
                            </div>
                        </div>
                        <div className="w-full bg-border rounded-full h-3 flex overflow-hidden">
                            <div className="bg-secondary" style={{ width: `${(stat.completed / (stat.completed + stat.inProgress + stat.pending)) * 100}%`}}></div>
                            <div className="bg-accent" style={{ width: `${(stat.inProgress / (stat.completed + stat.inProgress + stat.pending)) * 100}%`}}></div>
                            <div className="bg-error" style={{ width: `${(stat.pending / (stat.completed + stat.inProgress + stat.pending)) * 100}%`}}></div>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
};

export default TeamLiveStatusCard;