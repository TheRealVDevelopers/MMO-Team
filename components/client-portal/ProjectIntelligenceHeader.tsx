/**
 * Premium 3-Row Project Intelligence Header.
 * Row 1: Project name, code, health badge.
 * Row 2: Metrics grid (Budget, Paid %, Remaining %, Days Left, Completion %).
 * Row 3: Project head, contact, View Team.
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
      const diffTime = due.getTime() - now.getTime();
      const days = Math.ceil(diffTime / (24 * 60 * 60 * 1000));
      if (days < 0) return `${Math.abs(days)}d Overdue`;
      if (days === 0) return 'Due today';
      return `${days}d Left`;
    })()
    : null;

  const textPrimary = isDark ? 'text-white' : 'text-slate-900';
  const textSecondary = isDark ? 'text-slate-400' : 'text-slate-500';
  const labelClass = `text-[9px] font-black uppercase tracking-[0.15em] ${isDark ? 'text-white/40' : 'text-slate-400'} mb-1.5`;

  return (
    <header className={`relative z-40 w-full overflow-hidden ${isDark ? 'bg-[#0f0f0f]' : 'bg-white'}`}>
      {/* Dynamic Background Accent */}
      <div className="absolute top-0 right-0 w-1/3 h-full overflow-hidden pointer-events-none opacity-20">
        <div className={`absolute -top-1/2 -right-1/4 w-[600px] h-[600px] rounded-full blur-[120px] ${config.bg.replace('/10', '/30')}`} />
      </div>

      <div className="max-w-[1700px] mx-auto px-6 sm:px-10 py-8 relative">
        {/* Row 1: Identity & Health */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-10">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-4 mb-2">
              <span className={`px-2.5 py-1 rounded-md text-[10px] font-black tracking-widest uppercase border ${isDark ? 'border-amber-500/30 text-amber-500' : 'border-slate-200 text-slate-500'}`}>
                {projectCode || 'MMO-PN-001'}
              </span>
              <div className="h-4 w-px bg-slate-200 dark:bg-white/10" />
              <p className={`text-sm font-bold tracking-tight ${textSecondary}`}>{clientName}</p>
            </div>
            <h1 className={`text-3xl sm:text-5xl font-black tracking-tighter ${textPrimary} leading-[1.1]`}>
              {projectName}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl ${config.bg} ${config.text} border border-current opacity-80 backdrop-blur-sm transition-all hover:opacity-100`}>
              <Icon className="w-6 h-6 animate-pulse" />
              <div className="leading-none">
                <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-70">Status</p>
                <p className="text-lg font-black">{config.label}</p>
              </div>
            </div>

            {onViewTeam && (
              <button
                type="button"
                onClick={onViewTeam}
                className={`hidden sm:flex items-center gap-3 px-6 py-4 rounded-2xl font-black text-sm transition-all active:scale-95 ${isDark ? 'bg-white/5 text-white hover:bg-white/10' : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
              >
                <UserGroupIcon className="w-5 h-5" />
                TEAM ACCESS
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Deep Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-6 mb-10">
          {[
            { label: 'Total Value', value: formatCurrencyINR(totalBudget), sub: 'Master Budget', color: 'blue' },
            { label: 'Payment Progress', value: `${paidPercent}%`, sub: `${formatCurrencyINR(totalPaid)} Paid`, color: 'emerald' },
            { label: 'Unused Credit', value: formatCurrencyINR(remaining), sub: `${remainingPercent}% Remaining`, color: 'amber' },
            { label: 'Time Horizon', value: `${daysRemaining} Days`, sub: 'To Completion', color: 'violet' },
            { label: 'Milestone Depth', value: `${completionPercent}%`, sub: 'Actual Progress', color: 'teal' },
          ].map((m, i) => (
            <div key={i} className={`group relative p-6 rounded-2xl border transition-all duration-500 ${isDark ? 'bg-white/[0.03] border-white/5 hover:border-white/20' : 'bg-slate-50 border-slate-200/60 hover:border-slate-300'}`}>
              <p className={labelClass}>{m.label}</p>
              <p className={`text-2xl font-black tracking-tighter ${textPrimary} truncate group-hover:scale-105 transition-transform origin-left`}>
                {m.value}
              </p>
              <p className={`text-[11px] font-bold ${textSecondary} mt-1.5 opacity-80 uppercase tracking-wide`}>{m.sub}</p>
              <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-1 bg-${m.color}-500 group-hover:w-1/2 transition-all duration-500 rounded-t-full`} />
            </div>
          ))}
        </div>

        {/* Row 3: Bottom Action Strip */}
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-6 pt-8 border-t ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
          <div className="flex flex-wrap items-center gap-8">
            {projectHeadName && (
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform hover:rotate-3 ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
                  <UserCircleIcon className={`w-7 h-7 ${isDark ? 'text-amber-500' : 'text-slate-900'}`} />
                </div>
                <div>
                  <p className={labelClass}>Project Lead</p>
                  <p className={`text-sm font-black ${textPrimary}`}>{projectHeadName}</p>
                  <div className="flex gap-3 mt-1">
                    <a href={`tel:${projectHeadPhone}`} className="text-[10px] font-black uppercase text-amber-500 hover:underline">Direct Line</a>
                    <a href={`mailto:${projectHeadEmail}`} className="text-[10px] font-black uppercase text-amber-500 hover:underline">Secure Email</a>
                  </div>
                </div>
              </div>
            )}

            {nextPaymentDueDate && (
              <div className="h-10 w-px bg-slate-200 dark:bg-white/5 hidden md:block" />
            )}

            {nextPaymentDueDate && (
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isDark ? 'bg-amber-500/10' : 'bg-amber-50'}`}>
                  <ClockIcon className={`w-7 h-7 text-amber-500`} />
                </div>
                <div>
                  <p className={labelClass}>Upcoming Payment</p>
                  <p className={`text-sm font-black ${textPrimary}`}>
                    {formatCurrencyINR(nextPaymentAmount ?? 0)}
                  </p>
                  <p className={`text-[10px] font-bold ${health === 'at-risk' ? 'text-red-500' : 'text-amber-600'} uppercase tracking-wide`}>
                    {countdownText} • {formatDate(nextPaymentDueDate)}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className={labelClass}>Current Pace</p>
              <p className={`text-sm font-black ${textPrimary}`}>{completionPercent > 80 ? 'Peak Execution' : 'Steady Flow'}</p>
            </div>
            <div className="w-12 h-12 rounded-full border-4 border-slate-100 dark:border-white/5 flex items-center justify-center p-1.5 relative group">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="20" cy="20" r="18"
                  stroke="currentColor" strokeWidth="4" fill="transparent"
                  className="text-slate-200 dark:text-white/5"
                />
                <circle
                  cx="20" cy="20" r="18"
                  stroke="currentColor" strokeWidth="4" fill="transparent"
                  strokeDasharray={113}
                  strokeDashoffset={113 - (113 * completionPercent) / 100}
                  className="text-amber-500 transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black group-hover:scale-110 transition-transform">
                {completionPercent}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default ProjectIntelligenceHeader;
