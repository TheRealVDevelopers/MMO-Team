import React, { useState } from 'react';
import { LockOpenIcon, LockClosedIcon, CheckCircleIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/solid';
import { PaymentMilestone } from '../types';

interface PaymentWidgetProps {
  milestones: PaymentMilestone[];
  totalPaid: number;
  totalBudget: number;
  className?: string;
  nextDueDate?: Date | null;
  isOverdue?: boolean;
  onPayClick?: (amount: number, stageName: string) => void;
}

const PaymentWidget: React.FC<PaymentWidgetProps> = ({
  milestones,
  totalPaid,
  totalBudget,
  className = '',
  nextDueDate,
  isOverdue,
  onPayClick,
}) => {
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const paidPercentage = totalBudget > 0 ? Math.round((totalPaid / totalBudget) * 100) : 0;
  const safePaidPct = Math.min(100, Math.max(0, paidPercentage));
  const nextMilestone = milestones.find((m) => !m.isPaid);
  const paidCount = milestones.filter((m) => m.isPaid).length;

  const countdownText = nextDueDate
    ? (() => {
        const now = new Date();
        const due = new Date(nextDueDate);
        const days = Math.ceil((due.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
        if (days < 0) return `${Math.abs(days)} days overdue`;
        if (days === 0) return 'Due today';
        if (days === 1) return 'Due tomorrow';
        return `${days} days to due`;
      })()
    : null;

  const r = 24;
  const circumference = 2 * Math.PI * r;
  const strokeDash = (safePaidPct / 100) * circumference;

  return (
    <div className={`rounded-2xl overflow-hidden ${className}`}>
      {/* Donut + summary row */}
      <div className="flex items-center gap-4 p-4">
        <div className="relative w-16 h-16 flex-shrink-0">
          <svg className="w-16 h-16 -rotate-90" viewBox="0 0 56 56">
            <circle cx="28" cy="28" r={r} fill="none" stroke="currentColor" strokeWidth="6" className="text-slate-200 dark:text-slate-600" />
            <circle
              cx="28"
              cy="28"
              r={r}
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              strokeDasharray={`${strokeDash} ${circumference}`}
              strokeLinecap="round"
              className="text-emerald-500 transition-all duration-700"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-[#111111] dark:text-white">
            {safePaidPct}%
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-[#111111] dark:text-slate-300 uppercase tracking-wider">Progress</p>
          <p className="text-lg font-bold text-[#111111] dark:text-white">
            ₹{(totalPaid / 100000).toFixed(1)}L / ₹{(totalBudget / 100000).toFixed(1)}L
          </p>
          {nextDueDate && countdownText && (
            <p className={`text-xs font-medium mt-0.5 ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
              {countdownText}
            </p>
          )}
        </div>
      </div>

      {/* Expandable installment breakdown */}
      <div className="border-t border-slate-100 dark:border-slate-700/50">
        <button
          type="button"
          onClick={() => setBreakdownOpen(!breakdownOpen)}
          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
        >
          <span className="text-sm font-semibold text-[#111111] dark:text-white">Installment breakdown</span>
          {breakdownOpen ? <ChevronUpIcon className="w-4 h-4 text-slate-500" /> : <ChevronDownIcon className="w-4 h-4 text-slate-500" />}
        </button>
        {breakdownOpen && (
          <div className="px-4 pb-4 space-y-2 max-h-[220px] overflow-y-auto">
            {milestones.map((milestone, index) => (
              <div
                key={milestone.id}
                className={`flex items-center gap-3 p-3 rounded-xl ${
                  milestone.isPaid ? 'bg-emerald-50 dark:bg-emerald-500/10' : index === paidCount ? 'bg-amber-50 dark:bg-amber-500/10' : 'bg-slate-50 dark:bg-white/5'
                } ${index === paidCount && isOverdue ? 'ring-2 ring-red-300 dark:ring-red-500/50' : ''}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    milestone.isPaid ? 'bg-emerald-500 text-white' : index === paidCount ? 'bg-amber-500 text-white' : 'bg-slate-200 dark:bg-slate-600 text-slate-500'
                  }`}
                >
                  {milestone.isPaid ? <CheckCircleIcon className="w-5 h-5" /> : index === paidCount ? <LockOpenIcon className="w-4 h-4" /> : <LockClosedIcon className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${milestone.isPaid ? 'text-emerald-700 dark:text-emerald-400' : 'text-[#111111] dark:text-white'}`}>
                    {milestone.stageName}
                  </p>
                  {index === paidCount && !milestone.isPaid && (
                    <p className="text-[10px] text-amber-600 dark:text-amber-400">Unlocks next stage</p>
                  )}
                </div>
                <span className={`text-sm font-bold ${milestone.isPaid ? 'text-emerald-700 dark:text-emerald-400' : 'text-[#111111] dark:text-white'}`}>
                  ₹{(milestone.amount / 1000).toFixed(0)}K
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Next payment CTA – with overdue glow */}
      {nextMilestone && (
        <div
          className={`px-4 py-4 border-t ${isOverdue ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30 ring-2 ring-red-200/50 dark:ring-red-500/20' : 'bg-gradient-to-r from-amber-50 to-amber-100/50 dark:from-amber-500/10 dark:to-amber-500/5 border-amber-200 dark:border-amber-500/20'}`}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-[#111111] dark:text-slate-300">Next payment</p>
              <p className="text-lg font-bold text-[#111111] dark:text-white">₹{(nextMilestone.amount / 1000).toFixed(0)}K</p>
              {nextDueDate && <p className={`text-xs mt-0.5 ${isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : 'text-amber-600 dark:text-amber-400'}`}>{countdownText}</p>}
            </div>
            <button
              type="button"
              onClick={() => nextMilestone && onPayClick?.(nextMilestone.amount, nextMilestone.stageName)}
              disabled={!onPayClick}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${isOverdue ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/25' : 'bg-amber-500 text-white hover:bg-amber-600'}`}
            >
              Pay Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentWidget;
