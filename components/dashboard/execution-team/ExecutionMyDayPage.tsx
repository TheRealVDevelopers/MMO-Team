import React, { useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useTimeEntries, getTimeTrackingSummary, formatDuration } from '../../../hooks/useTimeTracking';
import { useAssignedTasksWithCases } from '../../../hooks/useCaseTasks';
import { TaskStatus, TaskType } from '../../../types';
import TimeTimeline from '../shared/TimeTimeline';
import TimeTrackingSummary from '../TimeTrackingSummary';
import TaskCard from '../shared/TaskCard';
import { ContentCard, cn, staggerContainer } from '../shared/DashboardUI';
import { ClockIcon, CheckCircleIcon, BoltIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

const ExecutionMyDayPage: React.FC = () => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return null;
  }

  const todayStr = new Date().toLocaleDateString('en-CA');
  const { entries: todayEntries } = useTimeEntries(currentUser.id, todayStr, todayStr);
  const todayEntry = todayEntries.find(
    (e) => (e as any).dateKey === todayStr || (e as any).date === todayStr
  );

  const summary = useMemo(
    () => (todayEntry ? getTimeTrackingSummary([todayEntry as any]) : null),
    [todayEntry]
  );

  const { tasks: assignedTasks, loading: tasksLoading } = useAssignedTasksWithCases(currentUser.id);

  const activeExecutionTasks = useMemo(
    () =>
      (assignedTasks || []).filter(
        (t) =>
          (t.type === TaskType.EXECUTION_TASK ||
            t.type === TaskType.EXECUTION ||
            t.type === TaskType.SITE_VISIT) &&
          t.status !== TaskStatus.COMPLETED
      ),
    [assignedTasks]
  );

  const completedTodayCount = useMemo(() => {
    if (!assignedTasks) return 0;
    return assignedTasks.filter((t) => {
      if (t.status !== TaskStatus.COMPLETED || !t.completedAt) return false;
      const d = t.completedAt instanceof Date ? t.completedAt : new Date(t.completedAt as any);
      return d.toLocaleDateString('en-CA') === todayStr;
    }).length;
  }, [assignedTasks, todayStr]);

  const unifiedTasks = useMemo(
    () =>
      activeExecutionTasks.map((t) => ({
        id: `exec-${t.id}`,
        originalId: t.id,
        caseId: t.caseId,
        title: t.projectName
          ? `[${t.type}] ${t.projectName}`
          : t.clientName
          ? `[${t.type}] ${t.clientName}`
          : `[${t.type}] ${t.caseId}`,
        assignedTo: t.assignedTo,
        userId: t.assignedTo,
        status: t.status === TaskStatus.STARTED ? TaskStatus.IN_PROGRESS : t.status,
        timeSpent: 0,
        priority: 'Medium',
        priorityOrder: 0,
        deadline: t.deadline,
        isPaused: false,
        date: todayStr,
        description: t.notes,
        createdAt: t.createdAt,
        createdBy: t.assignedBy,
        createdByName: '',
        startedAt: t.startedAt,
      })),
    [activeExecutionTasks, todayStr]
  );

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-8"
    >
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-2">
            Execution
          </div>
          <h2 className="text-2xl lg:text-3xl font-serif font-bold text-text-primary tracking-tight">
            My Day
          </h2>
          <p className="text-text-secondary text-sm mt-1">
            Attendance + live execution tasks for {currentUser.name}.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6">
          <TimeTimeline timeEntry={todayEntry as any} />

          {summary && (
            <ContentCard>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <ClockIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-text-primary">
                    Today&apos;s Time Summary
                  </h3>
                  <p className="text-[11px] text-text-tertiary">
                    Active vs break time for this shift.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-subtle-background/60 border border-border/50 rounded-2xl p-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-text-tertiary mb-1">
                    Active Time
                  </p>
                  <p className="text-lg font-serif font-bold text-text-primary">
                    {summary.totalWorkHours.toFixed(2)} h
                  </p>
                </div>
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 mb-1">
                    Break Time
                  </p>
                  <p className="text-lg font-serif font-bold text-amber-800">
                    {formatDuration(summary.totalBreakMinutes)}
                  </p>
                </div>
              </div>
            </ContentCard>
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          <TimeTrackingSummary userId={currentUser.id} />

          <ContentCard>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 pb-4 border-b border-border/40">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <BoltIcon className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-serif font-bold text-text-primary tracking-tight">
                    Active Tasks
                  </h3>
                </div>
                <p className="text-xs text-text-tertiary">
                  Tasks from live execution cases assigned to you (not completed).
                </p>
              </div>
              <div className="flex flex-col items-end text-xs">
                <span className="text-text-tertiary font-semibold uppercase tracking-widest">
                  Completed Today
                </span>
                <span className="text-2xl font-black text-secondary leading-none">
                  {completedTodayCount}
                </span>
              </div>
            </div>

            {tasksLoading ? (
              <div className="py-10 text-center text-text-secondary text-sm">
                Loading your execution tasks...
              </div>
            ) : unifiedTasks.length > 0 ? (
              <div className="space-y-4">
                {unifiedTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task as any}
                    onUpdateStatus={() => {}}
                    readOnly
                  />
                ))}
              </div>
            ) : (
              <div className="py-10 text-center text-text-secondary text-sm">
                No active execution tasks assigned to you.
              </div>
            )}
          </ContentCard>
        </div>
      </div>
    </motion.div>
  );
};

export default ExecutionMyDayPage;

