/**
 * Today's Work panel – premium redesign.
 * High-fidelity status board with live indicators, assignee depth, and progress visualization.
 */

import React from 'react';
import { ClockIcon, ChevronRightIcon, UserCircleIcon } from '@heroicons/react/24/outline';
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
  const roleConfig = ROLE_CONFIGS[currentStage.responsibleRole] || { color: '#6366f1', label: 'Team Member' };
  const isInProgress = currentStage.status === 'in-progress';
  const textPrimary = isDark ? 'text-white' : 'text-slate-900';
  const textSecondary = isDark ? 'text-slate-400' : 'text-slate-600';

  return (
    <div
      className={`relative rounded-3xl border overflow-hidden transition-all duration-500 group ${isDark
          ? 'bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border-emerald-500/20 hover:border-emerald-500/40'
          : 'bg-gradient-to-br from-emerald-50 to-white border-emerald-100/80 hover:shadow-2xl hover:shadow-emerald-500/10'
        } ${className}`}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`, backgroundSize: '24px 24px' }} />

      <div className="relative p-6 sm:p-8 flex flex-col md:flex-row md:items-center gap-8">
        {/* Modern Live Indicator Icon */}
        <div className="relative flex-shrink-0">
          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500 ${isDark ? 'bg-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.2)]' : 'bg-emerald-500 shadow-[0_10px_30px_rgba(16,185,129,0.3)]'
            }`}>
            <ClockIcon className={`w-10 h-10 ${isDark ? 'text-emerald-400' : 'text-white'}`} />
          </div>
          {isInProgress && (
            <div className="absolute -top-2 -right-2 flex h-6 w-6">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-6 w-6 bg-emerald-500 border-4 border-white dark:border-[#0a0a0a]" />
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Active Work Item
            </div>
            <span className={`text-[10px] font-black uppercase tracking-widest ${textSecondary} opacity-60`}>
              Updated 2h ago
            </span>
          </div>

          <h3 className={`text-2xl sm:text-3xl font-black tracking-tight ${textPrimary} mb-2 leading-tight uppercase`}>
            {currentStage.name}
          </h3>

          <p className={`text-base ${textSecondary} leading-relaxed max-w-2xl font-medium mb-6`}>
            {currentStage.description}
          </p>

          <div className="flex flex-wrap items-center gap-6">
            {currentStage.assigneeName && (
              <div className={`flex items-center gap-3 px-4 py-2 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-white shadow-sm border border-slate-100'}`}>
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-black shadow-lg shadow-current"
                  style={{ backgroundColor: roleConfig.color }}
                >
                  {currentStage.assigneeName.charAt(0)}
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Assigned To</p>
                  <p className={`text-sm font-bold ${textPrimary}`}>{currentStage.assigneeName}</p>
                </div>
              </div>
            )}

            {currentStage.progressPercent !== undefined && (
              <div className="flex-1 max-w-[240px]">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Milestone Progress</p>
                  <p className={`text-sm font-black ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                    {currentStage.progressPercent}%
                  </p>
                </div>
                <div className="w-full h-2.5 bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                    style={{ width: `${currentStage.progressPercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CTA Section */}
        {onViewDetails && (
          <button
            type="button"
            onClick={onViewDetails}
            className={`group/btn relative flex items-center gap-3 px-8 py-4 rounded-2xl text-sm font-black transition-all active:scale-95 overflow-hidden shadow-xl shadow-emerald-500/10 ${isDark
                ? 'bg-emerald-500 text-black hover:bg-emerald-400'
                : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}
          >
            <span className="relative z-10 uppercase tracking-widest">Execute Deep View</span>
            <ChevronRightIcon className="w-5 h-5 relative z-10 group-hover/btn:translate-x-1 transition-transform" />
          </button>
        )}
      </div>
    </div>
  );
};

export default TodaysWork;
