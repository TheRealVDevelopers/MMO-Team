/**
 * Phase 2 – Project Execution: from executionPlan.phases (dynamic).
 * Collapsible; each phase expandable with daily logs, progress %, delay remarks.
 */

import React, { useState, useMemo } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import type { JourneyStage } from '../types';
import type { ClientDailyUpdateItem } from '../types';
import { formatDate } from '../../../constants';

interface Phase2ExecutionSectionProps {
  stages: JourneyStage[];
  dailyUpdates: ClientDailyUpdateItem[];
  isDark?: boolean;
  defaultExpanded?: boolean;
  onStageClick?: (stage: JourneyStage) => void;
}

const Phase2ExecutionSection: React.FC<Phase2ExecutionSectionProps> = ({
  stages,
  dailyUpdates,
  isDark,
  defaultExpanded = true,
  onStageClick,
}) => {
  const [collapsed, setCollapsed] = useState(!defaultExpanded);
  const [expandedStageId, setExpandedStageId] = useState<number | null>(null);

  const executionStages = useMemo(() => stages.filter((s) => s.startDate && s.expectedEndDate), [stages]);

  const getUpdatesForStage = (stage: JourneyStage) => {
    if (!stage.startDate || !stage.expectedEndDate) return [];
    const start = new Date(stage.startDate).getTime();
    const end = new Date(stage.expectedEndDate).getTime();
    return dailyUpdates.filter((u) => {
      const t = new Date(u.date).getTime();
      return t >= start && t <= end;
    });
  };

  const textPrimary = isDark ? 'text-white' : 'text-[#111111]';
  const textMuted = isDark ? 'text-slate-400' : 'text-[#111111]';

  if (executionStages.length === 0) {
    return (
      <div className={`rounded-2xl border shadow-sm p-5 ${isDark ? 'bg-white/[0.06] border-amber-500/20' : 'bg-white border-slate-200/80'}`}>
        <p className={`text-sm ${textMuted}`}>
          Planning not yet approved. Execution phases will appear here once the plan is approved.
        </p>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border overflow-hidden shadow-sm ${isDark ? 'bg-white/[0.06] border-amber-500/20' : 'bg-white border-slate-200/80'}`}>
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className={`w-full flex items-center justify-between px-5 py-4 text-left ${
          isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'
        } transition-colors`}
      >
        <span className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-amber-400' : 'text-[#111111]'}`}>
          Phase 2 — Project Execution
        </span>
        {collapsed ? <ChevronRightIcon className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} /> : <ChevronDownIcon className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />}
      </button>
      {!collapsed && (
        <div className="px-5 pb-5 space-y-4">
          {executionStages.map((stage) => {
            const isComplete = stage.status === 'completed';
            const inProgress = stage.status === 'in-progress';
            const updates = getUpdatesForStage(stage);
            const isExpanded = expandedStageId === stage.id;

            return (
              <div
                key={stage.id}
                className={`rounded-xl border overflow-hidden transition-all duration-200 ${
                  isDark ? 'border-amber-500/20' : 'border-slate-200'
                } ${isComplete ? 'bg-emerald-500/5' : inProgress ? 'bg-blue-500/5' : ''}`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setExpandedStageId(isExpanded ? null : stage.id);
                    onStageClick?.(stage);
                  }}
                  className={`w-full flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-left ${
                    isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? <ChevronDownIcon className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} /> : <ChevronRightIcon className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />}
                    <span className={`font-medium ${textPrimary}`}>{stage.name}</span>
                    {stage.startDate && stage.expectedEndDate && (
                      <span className={`text-xs ${textMuted}`}>
                        {formatDate(stage.startDate)} – {formatDate(stage.expectedEndDate)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {stage.progressPercent != null && (
                      <span className={`text-sm font-bold ${textPrimary}`}>{stage.progressPercent}%</span>
                    )}
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      isComplete ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                      inProgress ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' :
                      'bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400'
                    }`}>
                      {isComplete ? 'Done' : inProgress ? 'In progress' : 'Upcoming'}
                    </span>
                    <span className={`text-xs ${textMuted}`}>{updates.length} daily log{updates.length !== 1 ? 's' : ''}</span>
                  </div>
                </button>
                {isExpanded && (
                  <div className="border-t border-slate-200 dark:border-amber-500/20 px-4 py-3 space-y-3 transition-all duration-200">
                    {stage.description && <p className={`text-sm ${textMuted}`}>{stage.description}</p>}
                    <p className={`text-xs font-bold uppercase tracking-wider ${textMuted}`}>Daily updates</p>
                    {updates.length === 0 ? (
                      <p className={`text-sm ${textMuted}`}>No logs for this phase yet.</p>
                    ) : (
                      <ul className="space-y-2">
                        {updates.slice(0, 10).map((u) => (
                          <li key={u.id} className={`p-3 rounded-lg ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
                            <p className={`text-sm font-medium ${textPrimary}`}>{formatDate(u.date)}</p>
                            <p className={`text-sm ${textMuted} mt-0.5`}>{u.workDescription}</p>
                            <div className={`flex gap-3 mt-1 text-xs ${textMuted}`}>
                              <span>Completion: {u.completionPercent}%</span>
                              <span>Manpower: {u.manpowerCount}</span>
                              {u.blocker && <span className="text-amber-600 dark:text-amber-400">Blocker: {u.blocker}</span>}
                            </div>
                            {u.photos && u.photos.length > 0 && (
                              <div className="flex gap-2 mt-2 flex-wrap">
                                {u.photos.slice(0, 4).map((url, i) => (
                                  <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">Photo {i + 1}</a>
                                ))}
                              </div>
                            )}
                          </li>
                        ))}
                        {updates.length > 10 && <p className={`text-xs ${textMuted}`}>+{updates.length - 10} more</p>}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Phase2ExecutionSection;
