/**
 * Phase 1 Lead Journey — steps synced from staff (activities, documents, quotations).
 */

import React from 'react';
import { CheckCircleIcon, ClockIcon, MinusCircleIcon } from '@heroicons/react/24/outline';
import type { LeadJourneyStep } from './types';
import { formatDate } from '../../constants';

interface LeadJourneyTimelineProps {
  steps: LeadJourneyStep[];
  isDark?: boolean;
}

const LeadJourneyTimeline: React.FC<LeadJourneyTimelineProps> = ({ steps, isDark }) => {
  if (!steps || steps.length === 0) return null;

  return (
    <div className="mb-8">
      <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 ${isDark ? 'text-amber-400/90' : 'text-slate-500'}`}>
        Phase 1 — Lead Journey
      </h3>
      <div className="relative pl-6 border-l-2 border-slate-200 dark:border-amber-500/30 space-y-0">
        {steps.map((step, i) => {
          const isDone = step.status === 'completed';
          const isCurrent = step.status === 'in-progress';
          const isUpcoming = step.status === 'upcoming';
          return (
            <div key={step.key} className="relative flex gap-4 pb-6 last:pb-0">
              <span
                className={`absolute -left-6 w-4 h-4 rounded-full border-2 ${
                  isDone
                    ? 'bg-emerald-500 border-emerald-500'
                    : isCurrent
                      ? 'bg-blue-500 border-blue-500 animate-pulse'
                      : 'bg-slate-200 dark:bg-slate-600 border-slate-300 dark:border-slate-500'
                }`}
              />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{step.label}</span>
                  {step.date && (
                    <span className="text-xs text-slate-500 dark:text-slate-400">{formatDate(step.date)}</span>
                  )}
                  {isDone && <CheckCircleIcon className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
                  {isCurrent && <ClockIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />}
                  {isUpcoming && <MinusCircleIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />}
                </div>
                {(step.description || step.revisionInfo) && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {step.description || step.revisionInfo}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LeadJourneyTimeline;
