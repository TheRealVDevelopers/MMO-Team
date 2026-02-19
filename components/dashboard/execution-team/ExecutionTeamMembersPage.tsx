import React, { useMemo, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useUsers } from '../../../hooks/useUsers';
import { useTeamTasks } from '../../../hooks/useTeamTasks';
import { useStaffPerformance } from '../../../hooks/useStaffPerformance';
import { StaffUser, UserRole, TaskStatus } from '../../../types';
import { ContentCard, cn } from '../shared/DashboardUI';
import { UsersIcon, UserCircleIcon, ClockIcon, BoltIcon } from '@heroicons/react/24/outline';
import TeamMemberDetailView from '../super-admin/TeamMemberDetailView';

const ALLOWED_ROLES: UserRole[] = [
  UserRole.EXECUTION_TEAM,
  UserRole.DRAWING_TEAM,
  UserRole.SITE_ENGINEER,
];

const ExecutionTeamMembersPage: React.FC = () => {
  const { currentUser } = useAuth();

  if (!currentUser || !(currentUser as any).isExecutionManager) {
    return null;
  }

  const { users, loading } = useUsers({
    organizationId: currentUser.organizationId,
  });

  const { tasks } = useTeamTasks();
  const { staff: performanceStaff } = useStaffPerformance();

  const [selectedMember, setSelectedMember] = useState<StaffUser | null>(null);

  const teamMembers = useMemo(
    () => users.filter((u) => ALLOWED_ROLES.includes(u.role)),
    [users]
  );

  const getOnlineStatus = (userId: string) => {
    const perfUser = performanceStaff.find((u) => u.id === userId);
    const status = (perfUser as any)?.attendanceStatus;
    if (status === 'CLOCKED_IN') return 'Present';
    if (status === 'ON_BREAK') return 'On Break';
    if (status === 'CLOCKED_OUT') return 'Clocked Out';
    return 'Absent';
  };

  const getOnlineColor = (label: string) => {
    switch (label) {
      case 'Present':
        return 'bg-emerald-100 text-emerald-700';
      case 'On Break':
        return 'bg-amber-100 text-amber-700';
      case 'Clocked Out':
        return 'bg-slate-100 text-slate-600';
      default:
        return 'bg-slate-100 text-slate-500';
    }
  };

  const getActiveTaskCount = (userId: string) =>
    tasks.filter(
      (t) =>
        t.assignedTo === userId &&
        t.status !== TaskStatus.COMPLETED
    ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <UsersIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-serif font-bold text-text-primary tracking-tight">
              Execution Team Members
            </h2>
            <p className="text-xs text-text-tertiary">
              Live view of Execution, Site Engineer and Drawing team workload.
            </p>
          </div>
        </div>
      </div>

      <ContentCard>
        {loading ? (
          <div className="py-10 text-center text-text-secondary text-sm">
            Loading team members...
          </div>
        ) : teamMembers.length === 0 ? (
          <div className="py-10 text-center text-text-secondary text-sm">
            No team members found for this organization.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {teamMembers.map((member) => {
              const statusLabel = getOnlineStatus(member.id);
              const activeTasks = getActiveTaskCount(member.id);

              return (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => setSelectedMember(member)}
                  className="text-left group"
                >
                  <div className="h-full bg-subtle-background/40 border border-border/60 rounded-2xl p-4 hover:border-primary/40 hover:bg-subtle-background transition-all flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      {member.avatar ? (
                        <img
                          src={member.avatar}
                          alt={member.name}
                          className="w-10 h-10 rounded-2xl object-cover border border-border"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                          <UserCircleIcon className="w-6 h-6" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-text-primary truncate">
                          {member.name}
                        </p>
                        <p className="text-[11px] font-black uppercase tracking-widest text-text-tertiary">
                          {member.role}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-1">
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest',
                          getOnlineColor(statusLabel)
                        )}
                      >
                        {statusLabel}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-text-secondary">
                        <ClockIcon className="w-3.5 h-3.5" />
                        {activeTasks} active task{activeTasks === 1 ? '' : 's'}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[11px] text-text-tertiary">
                      <span className="flex items-center gap-1">
                        <BoltIcon className="w-3.5 h-3.5 text-primary" />
                        View detail
                      </span>
                      {member.region && (
                        <span className="uppercase tracking-widest font-black">
                          {member.region}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </ContentCard>

      {selectedMember && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setSelectedMember(null)}
        >
          <div
            className="max-w-5xl w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <TeamMemberDetailView user={selectedMember as any} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ExecutionTeamMembersPage;

