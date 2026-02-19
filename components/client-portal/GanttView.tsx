/**
 * Gantt V2: execution phases, today marker, payment milestone icons, planned vs actual, delayed in red.
 */

import React, { useMemo } from 'react';
import { BanknotesIcon } from '@heroicons/react/24/outline';
import type { JourneyStage } from './types';
import type { PaymentMilestone } from './types';
import { formatDate } from '../../constants';

interface GanttViewProps {
  stages: JourneyStage[];
  paymentMilestones?: PaymentMilestone[];
  isDark?: boolean;
}

const GanttView: React.FC<GanttViewProps> = ({ stages, paymentMilestones = [], isDark }) => {
  const { minDate, maxDate, todayPercent } = useMemo(() => {
    const withDates = stages.filter((s) => s.startDate && s.expectedEndDate);
    const now = new Date();
    if (withDates.length === 0) {
      const future = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const min = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
      const range = future.getTime() - min.getTime();
      const todayP = ((now.getTime() - min.getTime()) / range) * 100;
      return { minDate: min, maxDate: future, todayPercent: Math.max(0, Math.min(100, todayP)) };
    }
    const min = new Date(Math.min(...withDates.map((s) => new Date(s.startDate!).getTime())));
    const max = new Date(Math.max(...withDates.map((s) => new Date(s.expectedEndDate!).getTime())));
    const range = max.getTime() - min.getTime();
    const todayP = range > 0 ? ((now.getTime() - min.getTime()) / range) * 100 : 0;
    return { minDate: min, maxDate: max, todayPercent: Math.max(0, Math.min(100, todayP)) };
  }, [stages]);

  const getLeftPercent = (d: Date) => {
    const range = maxDate.getTime() - minDate.getTime();
    if (range <= 0) return 0;
    const t = (new Date(d).getTime() - minDate.getTime()) / range;
    return Math.max(0, Math.min(100, t * 100));
  };
  const getWidthPercent = (start: Date, end: Date) => {
    const range = maxDate.getTime() - minDate.getTime();
    if (range <= 0) return 10;
    const w = (new Date(end).getTime() - new Date(start).getTime()) / range;
    return Math.max(2, Math.min(100, w * 100));
  };

  const executionStages = stages.filter((s) => s.startDate && s.expectedEndDate);
  if (executionStages.length === 0) {
    return (
      <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
        No phase dates yet. Execution plan phases will appear here once approved.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <div className="min-w-[400px] space-y-3">
          {executionStages.map((s, idx) => {
            const start = new Date(s.startDate!);
            const end = new Date(s.expectedEndDate!);
            const left = getLeftPercent(start);
            const width = getWidthPercent(start, end);
            const isDone = s.status === 'completed';
            const isCurrent = s.status === 'in-progress';
            const isDelayed = s.expectedEndDate && new Date() > new Date(s.expectedEndDate) && !isDone;
            const actualEnd = s.actualEndDate ? getLeftPercent(new Date(s.actualEndDate)) + getWidthPercent(start, new Date(s.actualEndDate)) : null;
            const barClass = isDone
              ? 'bg-emerald-500'
              : isDelayed
                ? 'bg-red-500'
                : isCurrent
                  ? 'bg-blue-500'
                  : 'bg-slate-300 dark:bg-slate-600';
            return (
              <div key={s.id} className="flex items-center gap-4">
                <div className="w-36 flex-shrink-0">
                  <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{s.name}</p>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {formatDate(start)} – {formatDate(end)}
                  </p>
                </div>
                <div className="flex-1 h-9 bg-slate-100 dark:bg-slate-800 rounded-lg relative overflow-visible">
                  <div
                    className={`absolute h-full rounded-lg transition-all duration-500 ${barClass}`}
                    style={{ left: `${left}%`, width: `${width}%` }}
                  />
                  {actualEnd != null && !isDone && (
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-slate-900 dark:bg-white opacity-50"
                      style={{ left: `${actualEnd}%` }}
                      title="Actual progress"
                    />
                  )}
                  {idx === 0 && (
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-10 shadow-sm"
                      style={{ left: `${todayPercent}%` }}
                      title="Today"
                    />
                  )}
                </div>
                <span
                  className={`text-xs font-medium w-20 flex-shrink-0 ${
                    isDone ? 'text-emerald-600 dark:text-emerald-400' : isDelayed ? 'text-red-600' : isCurrent ? 'text-blue-600' : isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}
                >
                  {isDone ? 'Done' : isDelayed ? 'Delayed' : isCurrent ? 'In progress' : 'Upcoming'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      {paymentMilestones.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200 dark:border-amber-500/20">
          <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Payments on timeline</span>
          {paymentMilestones.map((pm) => {
            if (!pm.dueDate) return null;
            const pct = getLeftPercent(pm.dueDate);
            return (
              <span
                key={pm.id}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
                  pm.isPaid ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                }`}
                title={`${pm.stageName} ${pm.dueDate ? formatDate(pm.dueDate) : ''}`}
              >
                <BanknotesIcon className="w-3.5 h-3.5" /> {pm.stageName}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GanttView;
