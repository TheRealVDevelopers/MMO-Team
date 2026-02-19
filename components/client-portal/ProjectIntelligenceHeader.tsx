/**
 * Premium 3-Row Project Intelligence Header.
 * Row 1: Project name, code, health badge.
 * Row 2: Metrics grid (Budget, Paid %, Remaining %, Days Left, Completion %).
 * Row 3: Project head, contact, View Team.
 * All text on light background: #111111 (no faded text).
 */

import React from 'react';
import { CheckCircleIcon, ClockIcon, ExclamationTriangleIcon, UserCircleIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import type { ProjectHealth } from './types';
import { formatCurrencyINR, formatDate } from '../../constants';

const healthConfig: Record<ProjectHealth, { icon: typeof CheckCircleIcon; label: string; bar: string; bg: string; text: string }> = {
  'on-track': { icon: CheckCircleIcon, label: 'On Track', bar: 'bg-emerald-500', bg: 'bg-emerald-500/10', text: 'text-emerald-700' },
  'minor-delay': { icon: ClockIcon, label: 'Minor Delay', bar: 'bg-amber-500', bg: 'bg-amber-500/10', text: 'text-amber-700' },
  'at-risk': { icon: ExclamationTriangleIcon, label: 'At Risk', bar: 'bg-red-500', bg: 'bg-red-500/10', text: 'text-red-700' },
};

export interface ProjectIntelligenceHeaderProps {
  projectName: string;
  clientName: string;
  projectCode: string;
  health: ProjectHealth;
  completionPercent: number;
  daysRemaining: number;
  budgetUtilizationPercent: number;
  totalBudget: number;
  totalPaid: number;
  nextMilestoneName?: string;
  nextPaymentDueDate?: Date | null;
  nextPaymentAmount?: number;
  projectHeadName?: string;
  projectHeadPhone?: string;
  projectHeadEmail?: string;
  isDark?: boolean;
  onViewTeam?: () => void;
}

const ProjectIntelligenceHeader: React.FC<ProjectIntelligenceHeaderProps> = (props) => {
  const {
    projectName,
    clientName,
    projectCode,
    health,
    completionPercent,
    daysRemaining,
    totalBudget,
    totalPaid,
    nextPaymentDueDate,
    nextPaymentAmount,
    projectHeadName,
    projectHeadPhone,
    projectHeadEmail,
    isDark,
    onViewTeam,
  } = props;

  const config = healthConfig[health];
  const Icon = config.icon;
  const remaining = Math.max(0, totalBudget - totalPaid);
  const remainingPercent = totalBudget > 0 ? Math.round((remaining / totalBudget) * 100) : 0;
  const paidPercent = totalBudget > 0 ? Math.round((totalPaid / totalBudget) * 100) : 0;

  const countdownText = nextPaymentDueDate
    ? (() => {
        const now = new Date();
        const due = new Date(nextPaymentDueDate);
        const days = Math.ceil((due.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
        if (days < 0) return `${Math.abs(days)} days overdue`;
        if (days === 0) return 'Due today';
        if (days === 1) return 'Due tomorrow';
        return `${days} days to due`;
      })()
    : null;

  const textPrimary = isDark ? 'text-white' : 'text-[#111111]';
  const textMuted = isDark ? 'text-slate-400' : 'text-[#111111]'; // labels still black for contrast
  const labelClass = `text-[10px] font-semibold uppercase tracking-wider ${textMuted} opacity-90`;

  return (
    <header
      className={`sticky top-0 z-40 w-full border-b ${
        isDark ? 'bg-[#0c0c0c]/95 border-amber-500/20' : 'bg-white border-slate-200 shadow-sm'
      } backdrop-blur-md`}
    >
      {/* Progress bar */}
      <div className="h-1 w-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
        <div
          className={`h-full ${config.bar} transition-all duration-700 ease-out`}
          style={{ width: `${Math.min(100, Math.max(0, completionPercent))}%` }}
        />
      </div>

      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-5">
        {/* Row 1: Project name, code, health badge */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
          <div className="min-w-0">
            <h1 className={`text-2xl sm:text-3xl font-bold truncate ${textPrimary}`}>{projectName}</h1>
            <p className={`text-sm truncate ${textMuted} mt-0.5`}>{clientName}</p>
            <p className={`text-xs ${textMuted} mt-0.5`}>
              <span className="font-semibold">Code:</span> <span className={textPrimary}>{projectCode || '—'}</span>
            </p>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${config.bg} ${config.text}`}>
            <Icon className="w-5 h-5" />
            <span className="text-sm font-bold">{config.label}</span>
          </div>
        </div>

        {/* Row 2: Metrics grid – 5 mini glass cards */}
        <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5`}>
          <div className={`rounded-xl border p-3 ${isDark ? 'bg-white/5 border-amber-500/20' : 'bg-blue-50/80 border-blue-100'}`}>
            <p className={labelClass}>Budget</p>
            <p className={`text-lg font-bold ${textPrimary} truncate`}>{formatCurrencyINR(totalBudget)}</p>
          </div>
          <div className={`rounded-xl border p-3 ${isDark ? 'bg-white/5 border-amber-500/20' : 'bg-emerald-50/80 border-emerald-100'}`}>
            <p className={labelClass}>Paid %</p>
            <p className={`text-lg font-bold ${textPrimary}`}>{paidPercent}%</p>
          </div>
          <div className={`rounded-xl border p-3 ${isDark ? 'bg-white/5 border-amber-500/20' : 'bg-amber-50/80 border-amber-100'}`}>
            <p className={labelClass}>Remaining</p>
            <p className={`text-lg font-bold ${textPrimary}`}>{formatCurrencyINR(remaining)}</p>
            <p className={`text-[10px] ${textMuted}`}>{remainingPercent}%</p>
          </div>
          <div className={`rounded-xl border p-3 ${isDark ? 'bg-white/5 border-amber-500/20' : 'bg-violet-50/80 border-violet-100'}`}>
            <p className={labelClass}>Days left</p>
            <p className={`text-lg font-bold ${textPrimary}`}>{daysRemaining}</p>
          </div>
          <div className={`rounded-xl border p-3 ${isDark ? 'bg-white/5 border-amber-500/20' : 'bg-slate-50/80 border-slate-200'}`}>
            <p className={labelClass}>Completion</p>
            <p className={`text-lg font-bold ${textPrimary}`}>{completionPercent}%</p>
          </div>
        </div>

        {/* Row 3: Project head, contact, View Team */}
        <div className={`flex flex-wrap items-center justify-between gap-4 pt-4 border-t ${isDark ? 'border-amber-500/10' : 'border-slate-200'}`}>
          <div className="flex flex-wrap items-center gap-4">
            {projectHeadName && (
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-amber-500/20' : 'bg-slate-100'}`}>
                  <UserCircleIcon className={`w-6 h-6 ${isDark ? 'text-amber-400' : 'text-[#111111]'}`} />
                </div>
                <div>
                  <p className={labelClass}>Project Head</p>
                  <p className={`text-sm font-bold ${textPrimary}`}>{projectHeadName}</p>
                  {(projectHeadPhone || projectHeadEmail) && (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {projectHeadPhone && (
                        <a href={`tel:${projectHeadPhone}`} className={`text-xs font-medium ${isDark ? 'text-amber-300 hover:text-amber-200' : 'text-[#111111] hover:underline'}`}>
                          {projectHeadPhone}
                        </a>
                      )}
                      {projectHeadEmail && (
                        <a href={`mailto:${projectHeadEmail}`} className={`text-xs font-medium ${isDark ? 'text-amber-300 hover:text-amber-200' : 'text-[#111111] hover:underline'}`}>
                          {projectHeadEmail}
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          {onViewTeam && (
            <button
              type="button"
              onClick={onViewTeam}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                isDark ? 'bg-amber-500/20 text-amber-200 hover:bg-amber-500/30' : 'bg-slate-100 text-[#111111] hover:bg-slate-200'
              }`}
            >
              <UserGroupIcon className="w-5 h-5" />
              View Team
            </button>
          )}
        </div>

        {/* Next payment strip (if present) */}
        {nextPaymentDueDate != null && nextPaymentAmount != null && nextPaymentAmount > 0 && (
          <div className={`mt-4 flex flex-wrap items-center gap-3 px-4 py-2 rounded-xl ${isDark ? 'bg-amber-500/10' : 'bg-amber-50'} border ${isDark ? 'border-amber-500/20' : 'border-amber-200'}`}>
            <span className={`text-xs font-semibold ${textMuted}`}>Next payment</span>
            <span className={`text-sm font-bold ${textPrimary}`}>{formatDate(nextPaymentDueDate)}</span>
            {countdownText && <span className={`text-xs font-medium ${health === 'at-risk' ? 'text-red-600' : 'text-amber-700'}`}>{countdownText}</span>}
            <span className={`text-sm font-bold ${textPrimary}`}>{formatCurrencyINR(nextPaymentAmount)}</span>
          </div>
        )}
      </div>
    </header>
  );
};

export default ProjectIntelligenceHeader;
