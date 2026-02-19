/**
 * Today's Work panel – placed below header. Green tint, icon, task summary, View Details.
 * Text on light background: #111111. Optional pulse when work is in progress.
 */

import React from 'react';
import { ClockIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { JourneyStage, ROLE_CONFIGS } from './types';

interface TodaysWorkProps {
  currentStage: JourneyStage;
  className?: string;
  isDark?: boolean;
  onViewDetails?: () => void;
}

const TodaysWork: React.FC<TodaysWorkProps> = ({
  currentStage,
  className = '',
  isDark,
  onViewDetails,
}) => {
  const roleConfig = ROLE_CONFIGS[currentStage.responsibleRole];
  const isInProgress = currentStage.status === 'in-progress';
  const textPrimary = isDark ? 'text-white' : 'text-[#111111]';
  const textMuted = isDark ? 'text-slate-400' : 'text-[#111111]';

  return (
    <div
      className={`rounded-2xl border overflow-hidden transition-all duration-300 ${
        isDark
          ? 'bg-emerald-500/10 border-emerald-500/20'
          : 'bg-gradient-to-r from-emerald-50 via-emerald-50/80 to-transparent border-emerald-200/80'
      } ${isInProgress ? 'ring-2 ring-emerald-400/30' : ''} ${className}`}
    >
      <div className="p-5 flex items-center gap-4">
        <div
          className={`relative w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${
            isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'
          }`}
        >
          <ClockIcon className={`w-7 h-7 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
          {isInProgress && (
            <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-bold uppercase tracking-wider ${textMuted}`}>
              Today&apos;s Work
            </span>
            {isInProgress && (
              <span className="px-2 py-0.5 bg-emerald-500 text-white text-[10px] font-bold rounded-full">
                LIVE
              </span>
            )}
          </div>
          <p className={`text-lg font-bold ${textPrimary} mb-0.5`}>{currentStage.name}</p>
          <p className={`text-sm ${textMuted} leading-relaxed opacity-95`}>
            {currentStage.description}
          </p>
          <div className="flex flex-wrap items-center gap-4 mt-3">
            {currentStage.assigneeName && (
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: roleConfig.color }}
                >
                  {currentStage.assigneeName.charAt(0)}
                </div>
                <span className={`text-sm ${textMuted}`}>{currentStage.assigneeName}</span>
              </div>
            )}
            {currentStage.progressPercent !== undefined && (
              <div className="flex items-center gap-2">
                <div className="w-20 h-2 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${currentStage.progressPercent}%` }}
                  />
                </div>
                <span className={`text-sm font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                  {currentStage.progressPercent}%
                </span>
              </div>
            )}
          </div>
        </div>

        {onViewDetails && (
          <button
            type="button"
            onClick={onViewDetails}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex-shrink-0 ${
              isDark
                ? 'bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30'
                : 'bg-white/80 text-[#111111] hover:bg-white border border-emerald-200'
            }`}
          >
            View Details
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default TodaysWork;
