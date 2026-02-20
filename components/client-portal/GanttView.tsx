/**
 * Gantt V4: Premium execution timeline with Zoom, Sticky Headers, and High-Fidelity visuals.
 */

import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  BanknotesIcon,
  CalendarIcon,
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import type { JourneyStage, PaymentMilestone } from './types';
import { formatDate } from '../../constants';

interface GanttViewProps {
  stages: JourneyStage[];
  paymentMilestones?: PaymentMilestone[];
  isDark?: boolean;
}

type ZoomLevel = 'day' | 'week' | 'month';

const ZOOM_CONFIG = {
  day: { pixelsPerDay: 40, label: 'Day', tickInterval: 1 },
  week: { pixelsPerDay: 15, label: 'Week', tickInterval: 7 },
  month: { pixelsPerDay: 4, label: 'Month', tickInterval: 30 },
};

const GanttView: React.FC<GanttViewProps> = ({ stages, paymentMilestones = [], isDark }) => {
  const [zoom, setZoom] = useState<ZoomLevel>('week');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 1. Calculate Timeline Boundaries
  const { minDate, maxDate, totalDays, startDate } = useMemo(() => {
    const withDates = stages.filter((s) => s.startDate && s.expectedEndDate);
    const now = new Date();

    let min: Date, max: Date;

    if (withDates.length === 0) {
      min = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000); // -15 days
      max = new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000); // +45 days
    } else {
      min = new Date(Math.min(...withDates.map((s) => new Date(s.startDate!).getTime())));
      max = new Date(Math.max(...withDates.map((s) => new Date(s.expectedEndDate!).getTime())));
      // Add padding
      min = new Date(min.getTime() - 7 * 24 * 60 * 60 * 1000);
      max = new Date(max.getTime() + 14 * 24 * 60 * 60 * 1000);
    }

    // Normalize to start of day
    min.setHours(0, 0, 0, 0);
    max.setHours(23, 59, 59, 999);

    const totalDays = Math.ceil((max.getTime() - min.getTime()) / (24 * 60 * 60 * 1000));

    return { minDate: min, maxDate: max, totalDays, startDate: min };
  }, [stages]);

  // 2. Generate Grid
  const grid = useMemo(() => {
    const days = [];
    const pixelsPerDay = ZOOM_CONFIG[zoom].pixelsPerDay;

    for (let i = 0; i <= totalDays; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return { days, totalWidth: totalDays * pixelsPerDay };
  }, [totalDays, startDate, zoom]);

  // Helper: Get position percentage or pixels
  const getXPosition = (date: string | Date) => {
    const d = new Date(date).getTime();
    const start = minDate.getTime();
    const diffDays = (d - start) / (24 * 60 * 60 * 1000);
    return diffDays * ZOOM_CONFIG[zoom].pixelsPerDay;
  };

  const getWidth = (start: string | Date, end: string | Date) => {
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    const days = (e - s) / (24 * 60 * 60 * 1000);
    return Math.max(2, days * ZOOM_CONFIG[zoom].pixelsPerDay); // Min 2px
  };

  // Scroll to "Today" on mount/zoom change
  useEffect(() => {
    if (scrollContainerRef.current) {
      const todayX = getXPosition(new Date());
      const containerWidth = scrollContainerRef.current.clientWidth;
      scrollContainerRef.current.scrollLeft = todayX - (containerWidth / 2);
    }
  }, [zoom]);


  const executionStages = stages.filter((s) => s.startDate && s.expectedEndDate);
  const textPrimary = isDark ? 'text-white' : 'text-slate-900';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-500';
  const borderColor = isDark ? 'border-white/10' : 'border-slate-200';
  const gridColor = isDark ? 'border-white/[0.03]' : 'border-slate-100';
  const stickyBg = isDark ? 'bg-[#151515]' : 'bg-white';

  if (executionStages.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center p-12 text-center ${textMuted}`}>
        <CalendarIcon className="w-12 h-12 mb-4 opacity-20" />
        <p className="text-sm">No phase dates determined yet.</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full rounded-2xl ${borderColor} bg-transparent`}>
      {/* Controls Bar */}
      <div className={`flex items-center justify-between px-6 py-4 border-b ${borderColor} bg-slate-50/50 dark:bg-white/[0.02]`}>
        <div className="flex items-center gap-2">
          <button onClick={() => setZoom('month')} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${zoom === 'month' ? 'bg-amber-500 text-black' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-white/10'}`}>Month</button>
          <button onClick={() => setZoom('week')} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${zoom === 'week' ? 'bg-amber-500 text-black' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-white/10'}`}>Week</button>
          <button onClick={() => setZoom('day')} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${zoom === 'day' ? 'bg-amber-500 text-black' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-white/10'}`}>Day</button>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></div>Completed</div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-blue-500"></div>Active</div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-red-500"></div>Overdue</div>
        </div>
      </div>

      {/* Gantt Container */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-auto relative custom-scrollbar select-none"
        style={{ scrollBehavior: 'smooth', maxHeight: '600px' }}
      >
        <div style={{ minWidth: MAX_WIDTH_Map(zoom, totalDays), position: 'relative' }}>

          {/* Header Row */}
          <div className={`sticky top-0 z-20 flex border-b ${borderColor} ${stickyBg} shadow-sm`}>
            <div className={`sticky left-0 z-30 w-56 flex-shrink-0 p-3 text-xs font-bold uppercase tracking-wider ${textMuted} ${stickyBg} border-r ${borderColor} backdrop-blur-sm`}>
              Phase Name
            </div>
            <div className="flex-1 relative h-10">
              {/* Render Time Axis */}
              {grid.days.map((d, i) => {
                const isStartOfMonth = d.getDate() === 1;
                const showLabel = zoom === 'day' ? true : zoom === 'week' ? d.getDay() === 1 : isStartOfMonth;

                if (!showLabel) return null;

                return (
                  <div
                    key={i}
                    className="absolute top-0 bottom-0 border-l border-slate-200/50 dark:border-white/5 pl-2 pt-2 text-[10px] font-bold text-slate-400 whitespace-nowrap"
                    style={{ left: i * ZOOM_CONFIG[zoom].pixelsPerDay }}
                  >
                    {zoom === 'day' ? d.getDate() : d.toLocaleDateString('en-US', { month: 'short', day: zoom === 'week' ? 'numeric' : undefined })}
                    {zoom === 'month' && <span className="text-slate-600 dark:text-slate-500 ml-1">'{d.getFullYear().toString().slice(2)}</span>}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Grid Body */}
          <div className="relative">
            {/* Background Grid Lines */}
            <div className="absolute inset-0 z-0 flex ml-56 pointer-events-none">
              {grid.days.map((d, i) => {
                const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                // Show line based on zoom
                const showLine = zoom === 'day' ? true : zoom === 'week' ? d.getDay() === 1 : d.getDate() === 1;

                return (
                  <div
                    key={i}
                    className={`flex-shrink-0 h-full border-r ${gridColor} ${isWeekend && zoom === 'day' ? 'bg-slate-50/50 dark:bg-white/[0.01]' : ''}`}
                    style={{ width: ZOOM_CONFIG[zoom].pixelsPerDay }}
                  >
                    {showLine && <div className={`absolute h-full w-px ${isDark ? 'bg-white/5' : 'bg-slate-200'}`} style={{ left: i * ZOOM_CONFIG[zoom].pixelsPerDay }}></div>}
                  </div>
                )
              })}
            </div>

            {/* Today Line */}
            <div
              className="absolute top-0 bottom-0 z-10 w-px bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)] ml-56 transition-all duration-300 pointer-events-none"
              style={{ left: getXPosition(new Date()) }}
            >
              <div className="absolute -top-1 -translate-x-1/2 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                Today
              </div>
            </div>

            {/* Rows */}
            {executionStages.map((stage) => {
              const stageStart = new Date(stage.startDate!);
              const stageEnd = new Date(stage.expectedEndDate!);

              const left = getXPosition(stageStart);
              const width = getWidth(stageStart, stageEnd);

              const isDone = stage.status === 'completed';
              const isCurrent = stage.status === 'in-progress';
              const isDelayed = stage.expectedEndDate && new Date() > new Date(stage.expectedEndDate) && !isDone;

              const barColor = isDone
                ? 'bg-gradient-to-r from-emerald-400 to-emerald-600'
                : isDelayed
                  ? 'bg-gradient-to-r from-red-400 to-red-600 pattern-diagonal-lines'
                  : isCurrent
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg shadow-blue-500/20'
                    : 'bg-slate-200 dark:bg-slate-700';

              return (
                <div key={stage.id} className={`flex relative z-10 border-b ${gridColor} hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group h-14`}>
                  {/* Sticky Row Header */}
                  <div className={`sticky left-0 z-20 w-56 flex-shrink-0 p-3 flex flex-col justify-center border-r ${borderColor} ${stickyBg} group-hover:bg-slate-50 dark:group-hover:bg-[#1a1a1a] transition-colors`}>
                    <p className={`text-xs font-bold truncate ${textPrimary}`}>{stage.name}</p>
                    <p className={`text-[10px] ${textMuted}`}>{formatDate(stageStart)} - {formatDate(stageEnd)}</p>
                  </div>

                  {/* Bar Area */}
                  <div className="relative flex-1 h-full">
                    <motion.div
                      initial={{ opacity: 0, scaleX: 0.9 }}
                      animate={{ opacity: 1, scaleX: 1 }}
                      transition={{ duration: 0.4 }}
                      className={`absolute top-1/2 -translate-y-1/2 h-6 rounded-md ${barColor} cursor-pointer group/bar`}
                      style={{ left: left, width: width }}
                    >
                      {/* Hover Tooltip */}
                      <div className="absolute opacity-0 group-hover/bar:opacity-100 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900 text-white text-xs rounded transition-opacity whitespace-nowrap shadow-xl z-50 pointer-events-none">
                        <div className="font-bold">{stage.name}</div>
                        <div className="text-[10px] opacity-80">{Math.round(width / ZOOM_CONFIG[zoom].pixelsPerDay)} days</div>
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1 border-4 border-transparent border-t-slate-900"></div>
                      </div>
                    </motion.div>

                    {/* Milestones Overlay */}
                    {paymentMilestones.filter(pm => pm.stageId === stage.id).map(pm => {
                      const pmLeft = getXPosition(pm.dueDate || stageEnd);
                      return (
                        <div
                          key={pm.id}
                          className="absolute top-1/2 -translate-y-1/2 z-20 cursor-help group/pm"
                          style={{ left: pmLeft }}
                        >
                          <div className={`w-6 h-6 -ml-3 flex items-center justify-center rounded-full border-2 border-white dark:border-slate-800 shadow-md ${pm.isPaid ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-white animate-pulse'}`}>
                            <BanknotesIcon className="w-3.5 h-3.5" />
                          </div>

                          {/* Milestone Tooltip */}
                          <div className="absolute opacity-0 group-hover/pm:opacity-100 bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl shadow-xl z-50 transition-opacity">
                            <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Payment Milestone</div>
                            <div className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{pm.stageName}</div>
                            <div className={`text-xs font-bold mt-1 ${pm.isPaid ? 'text-emerald-500' : 'text-amber-500'}`}>
                              {pm.isPaid ? 'PAID' : 'DUE'} • {pm.amount ? `₹${pm.amount.toLocaleString()}` : 'TBD'}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper to prevent infinite width
const MAX_WIDTH_Map = (zoom: ZoomLevel, days: number) => {
  return days * ZOOM_CONFIG[zoom].pixelsPerDay + 300; // + padding
}

export default GanttView;
