/**
 * Zone A – Project Intelligence Header (full width, sticky).
 * Project name, client, code, health, completion %, days remaining, budget utilization,
 * next milestone, next payment due, project head, horizontal progress bar with risk colors.
 */

import React from 'react';
import { CheckCircleIcon, ClockIcon, ExclamationTriangleIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import type { ProjectHealth } from './types';
import { formatCurrencyINR, formatDate } from '../../constants';

const healthConfig: Record<ProjectHealth, { icon: typeof CheckCircleIcon; label: string; bar: string; bg: string }> = {
  'on-track': { icon: CheckCircleIcon, label: 'On Track', bar: 'bg-emerald-500', bg: 'bg-emerald-500/10' },
  'minor-delay': { icon: ClockIcon, label: 'Minor Delay', bar: 'bg-amber-500', bg: 'bg-amber-500/10' },
  'at-risk': { icon: ExclamationTriangleIcon, label: 'At Risk', bar: 'bg-red-500', bg: 'bg-red-500/10' },
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
  isDark?: boolean;
}

const ProjectIntelligenceHeader: React.FC<ProjectIntelligenceHeaderProps> = (props) => {
  const {
    projectName,
    clientName,
    projectCode,
    health,
    completionPercent,
    daysRemaining,
    budgetUtilizationPercent,
    totalBudget,
    totalPaid,
    nextMilestoneName,
    nextPaymentDueDate,
    nextPaymentAmount,
    projectHeadName,
    isDark,
  } = props;

  const config = healthConfig[health];
  const Icon = config.icon;

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

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b ${
        isDark ? 'bg-[#0c0c0c]/95 border-amber-500/20' : 'bg-white/90 border-slate-200'
      } backdrop-blur-md shadow-lg`}
    >
      {/* Full-width progress bar */}
      <div className="h-1 w-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
        <div
          className={`h-full ${config.bar} transition-all duration-700 ease-out`}
          style={{ width: `${Math.min(100, Math.max(0, completionPercent))}%` }}
        />
      </div>

      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className={`text-xl sm:text-2xl font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {projectName}
            </h1>
            <p className={`text-sm truncate ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{clientName}</p>
            <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-600'}`}><span className="font-medium">Code:</span> <span className={isDark ? 'text-slate-300' : 'text-slate-900'}>{projectCode || '—'}</span></p>
          </div>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl ${config.bg} ${health === 'on-track' ? (isDark ? 'text-emerald-400' : 'text-emerald-800') : health === 'minor-delay' ? (isDark ? 'text-amber-400' : 'text-amber-800') : (isDark ? 'text-red-400' : 'text-red-800')}`}>
              <Icon className="w-5 h-5" />
              <span className="text-sm font-bold">{config.label}</span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5">
              <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Completion</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">{completionPercent}%</span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-100 dark:bg-blue-500/10">
              <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Days left</span>
              <span className="text-sm font-bold text-blue-700 dark:text-blue-400">{daysRemaining}</span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-violet-100 dark:bg-violet-500/10">
              <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Budget used</span>
              <span className="text-sm font-bold text-violet-700 dark:text-violet-400">{budgetUtilizationPercent}%</span>
            </div>

            {nextMilestoneName && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5">
                <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Next</span>
                <span className="text-sm font-medium text-slate-900 dark:text-white truncate max-w-[120px]">{nextMilestoneName}</span>
              </div>
            )}

            {nextPaymentDueDate != null && (
              <div className="flex flex-col gap-0.5 px-3 py-1.5 rounded-xl bg-amber-100 dark:bg-amber-500/10">
                <span className={`text-xs font-medium ${isDark ? 'text-amber-200' : 'text-amber-800'}`}>Next payment</span>
                <span className="text-sm font-bold text-amber-700 dark:text-amber-400">{formatDate(nextPaymentDueDate)}</span>
                {countdownText && <span className={`text-xs font-medium ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>{countdownText}</span>}
                {nextPaymentAmount != null && nextPaymentAmount > 0 && (
                  <span className={`text-xs font-medium ${isDark ? 'text-amber-200' : 'text-amber-800'}`}>{formatCurrencyINR(nextPaymentAmount)}</span>
                )}
              </div>
            )}

            {projectHeadName && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5">
                <UserCircleIcon className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`} />
                <div>
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Project Head</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[100px]">{projectHeadName}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Secondary row: paid / remaining — ensure labels and values are readable */}
        <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-slate-200/50 dark:border-amber-500/10">
          <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Total value: <strong className="text-slate-900 dark:text-slate-100">{formatCurrencyINR(totalBudget)}</strong>
          </span>
          <span className="text-sm text-emerald-700 dark:text-emerald-400">
            Paid: <strong>{formatCurrencyINR(totalPaid)}</strong>
          </span>
          <span className="text-sm text-amber-700 dark:text-amber-400">
            Remaining: <strong>{formatCurrencyINR(Math.max(0, totalBudget - totalPaid))}</strong>
          </span>
        </div>
      </div>
    </header>
  );
};

export default ProjectIntelligenceHeader;
