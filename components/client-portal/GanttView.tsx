/**
 * Gantt V3: premium execution timeline.
 * Time axis, grid lines, today marker, milestone icons, and high-fidelity bars.
 */

import React, { useMemo } from 'react';
import { BanknotesIcon, CalendarIcon } from '@heroicons/react/24/outline';
import type { JourneyStage, PaymentMilestone } from './types';
import { formatDate } from '../../constants';

interface GanttViewProps {
  stages: JourneyStage[];
  paymentMilestones?: PaymentMilestone[];
  isDark?: boolean;
}

const GanttView: React.FC<GanttViewProps> = ({ stages, paymentMilestones = [], isDark }) => {
  const { minDate, maxDate, todayPercent, durationDays, months } = useMemo(() => {
    const withDates = stages.filter((s) => s.startDate && s.expectedEndDate);
    const now = new Date();

    let min: Date, max: Date;

    if (withDates.length === 0) {
      min = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
      max = new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000);
    } else {
      min = new Date(Math.min(...withDates.map((s) => new Date(s.startDate!).getTime())));
      max = new Date(Math.max(...withDates.map((s) => new Date(s.expectedEndDate!).getTime())));

      // Add padding
      min = new Date(min.getTime() - 3 * 24 * 60 * 60 * 1000);
      max = new Date(max.getTime() + 7 * 24 * 60 * 60 * 1000);
    }

    const range = max.getTime() - min.getTime();
    const todayP = range > 0 ? ((now.getTime() - min.getTime()) / range) * 100 : 0;
    const dur = range / (24 * 60 * 60 * 1000);

    // Calculate months for the header
    const m = [];
    let current = new Date(min);
    while (current <= max) {
      const monthLabel = current.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      const nextMonth = new Date(current.getFullYear(), current.getMonth() + 1, 1);
      const daysInMonth = Math.min((nextMonth.getTime() - current.getTime()) / (24 * 60 * 60 * 1000), (max.getTime() - current.getTime()) / (24 * 60 * 60 * 1000));
      m.push({
        label: monthLabel,
        width: (daysInMonth / dur) * 100,
      });
      current = nextMonth;
    }

    return {
      minDate: min,
      maxDate: max,
      todayPercent: Math.max(0, Math.min(100, todayP)),
      durationDays: dur,
      months: m
    };
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
    return Math.max(1, Math.min(100, w * 100));
  };

  const executionStages = stages.filter((s) => s.startDate && s.expectedEndDate);
  const textPrimary = isDark ? 'text-white' : 'text-[#111111]';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-500';
  const gridColor = isDark ? 'border-white/[0.05]' : 'border-slate-100';

  if (executionStages.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center p-12 text-center ${textMuted}`}>
        <CalendarIcon className="w-12 h-12 mb-4 opacity-20" />
        <p className="text-sm">No phase dates yet. Your project execution schedule will appear here soon.</p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
      {/* Time Header */}
      <div className={`flex border-b ${gridColor}`}>
        <div className="w-48 flex-shrink-0 border-r border-border p-3 font-bold text-xs uppercase tracking-wider bg-slate-50/50 dark:bg-white/5">
          Work Phase
        </div>
        <div className="flex-1 relative h-10 flex">
          {months.map((m, i) => (
            <div
              key={i}
              className={`h-full flex items-center justify-center text-[10px] font-bold uppercase tracking-widest border-r ${gridColor} last:border-r-0`}
              style={{ width: `${m.width}%` }}
            >
              {m.label}
            </div>
          ))}
        </div>
      </div>

      {/* Grid Overlay */}
      <div className="absolute inset-0 pointer-events-none mt-10 ml-48 flex">
        {Array.from({ length: Math.ceil(durationDays / 7) }).map((_, i) => (
          <div
            key={i}
            className={`h-full border-r ${gridColor}`}
            style={{ width: `${(7 / durationDays) * 100}%` }}
          />
        ))}
        {/* Today line */}
        <div
          className="absolute top-0 bottom-0 w-[2px] bg-red-500 z-30 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
          style={{ left: `${todayPercent}%` }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-red-500 text-white text-[8px] font-black rounded-b uppercase tracking-tighter">
            Today
          </div>
        </div>
      </div>

      {/* Rows */}
      <div className="min-w-[600px]">
        {executionStages.map((s, idx) => {
          const start = new Date(s.startDate!);
          const end = new Date(s.expectedEndDate!);
          const left = getLeftPercent(start);
          const width = getWidthPercent(start, end);

          const isDone = s.status === 'completed';
          const isCurrent = s.status === 'in-progress';
          const isDelayed = s.expectedEndDate && new Date() > new Date(s.expectedEndDate) && !isDone;

          const barGradient = isDone
            ? 'from-emerald-400 to-emerald-600'
            : isDelayed
              ? 'from-red-400 to-red-600'
              : isCurrent
                ? 'from-blue-400 to-blue-600 shadow-[0_4px_12px_rgba(37,99,235,0.3)]'
                : 'from-slate-300 to-slate-400 dark:from-slate-600 dark:to-slate-700';

          return (
            <div
              key={s.id}
              className={`flex items-stretch border-b ${gridColor} last:border-b-0 group hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors`}
            >
              {/* Stage Info */}
              <div className="w-48 flex-shrink-0 border-r border-border p-3 flex flex-col justify-center">
                <p className={`text-xs font-bold leading-tight ${textPrimary} group-hover:text-primary transition-colors`}>{s.name}</p>
                <div className="flex items-center gap-1 mt-1">
                  <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded uppercase ${isDone ? 'bg-emerald-500/10 text-emerald-600' :
                      isDelayed ? 'bg-red-500/10 text-red-600' :
                        isCurrent ? 'bg-blue-500/10 text-blue-600' :
                          'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}>
                    {isDone ? 'Done' : isDelayed ? 'Delayed' : isCurrent ? 'Active' : 'Queued'}
                  </span>
                </div>
              </div>

              {/* Bar Column */}
              <div className="flex-1 h-14 relative flex items-center px-0">
                <div
                  className={`absolute h-7 rounded-lg bg-gradient-to-r flex items-center px-3 z-20 group-hover:scale-[1.02] transition-all duration-300 ${barGradient}`}
                  style={{ left: `${left}%`, width: `${width}%` }}
                >
                  {width > 15 && (
                    <span className="text-[9px] font-black text-white uppercase tracking-wider truncate">
                      {Math.round(width)}% Complete
                    </span>
                  )}

                  {/* Tooltip on hover */}
                  <div className="absolute top-0 left-0 w-full h-full group/bar">
                    <div className="invisible group-hover/bar:visible absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] py-1 px-2 rounded shadow-xl whitespace-nowrap z-50">
                      {formatDate(start)} — {formatDate(end)}
                    </div>
                  </div>
                </div>

                {/* Milestones in context */}
                {paymentMilestones.filter(pm => pm.stageId === s.id).map(pm => {
                  const pmPct = getLeftPercent(pm.dueDate || end);
                  return (
                    <div
                      key={pm.id}
                      className="absolute top-1/2 -translate-y-1/2 z-40 group/pm"
                      style={{ left: `${pmPct}%` }}
                    >
                      <div className={`p-1.5 rounded-full shadow-lg border-2 border-white dark:border-slate-800 transition-transform hover:scale-125 ${pm.isPaid ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                        }`}>
                        <BanknotesIcon className="w-3 h-3" />
                      </div>
                      <div className="invisible group-hover/pm:visible absolute -top-8 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 text-text-primary px-2 py-1 rounded shadow-xl border border-border text-[9px] font-bold whitespace-nowrap z-50">
                        {pm.isPaid ? 'Paid: ' : 'Due: '} {pm.stageName}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className={`p-3 bg-slate-50/50 dark:bg-white/5 border-t ${gridColor} flex items-center gap-6`}>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-emerald-500" />
          <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-blue-500" />
          <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">In Progress</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-red-500" />
          <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Delayed</span>
        </div>
        <div className="flex items-center gap-2">
          <BanknotesIcon className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Payment Milestone</span>
        </div>
      </div>
    </div>
  );
};

export default GanttView;
