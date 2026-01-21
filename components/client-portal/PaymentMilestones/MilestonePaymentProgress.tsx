import React from 'react';
import {
    CheckCircleIcon,
    LockClosedIcon,
    ClockIcon,
    CurrencyRupeeIcon
} from '@heroicons/react/24/solid';
import { PaymentMilestone } from '../types';

interface MilestonePaymentProgressProps {
    milestones: PaymentMilestone[];
    totalBudget: number;
    totalPaid: number;
    className?: string;
}

const MilestonePaymentProgress: React.FC<MilestonePaymentProgressProps> = ({
    milestones,
    totalBudget,
    totalPaid,
    className = ''
}) => {
    const paidPercentage = (totalPaid / totalBudget) * 100;
    const nextDueMilestone = milestones.find(m => !m.isPaid);

    return (
        <div className={`bg-white rounded-2xl shadow-lg overflow-hidden ${className}`}>
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900">Payment Progress</h3>
                    <div className="flex items-center gap-1 text-emerald-600 font-bold">
                        <CurrencyRupeeIcon className="w-4 h-4" />
                        <span>{(totalPaid / 100000).toFixed(1)}L</span>
                        <span className="text-gray-400 font-normal">/ {(totalBudget / 100000).toFixed(1)}L</span>
                    </div>
                </div>

                {/* Overall Progress Bar */}
                <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${paidPercentage}%` }}
                    />
                    {/* Milestone markers */}
                    {milestones.map((milestone, index) => {
                        const position = milestones.slice(0, index + 1).reduce((acc, m) => acc + m.percentage, 0);
                        return (
                            <div
                                key={milestone.id}
                                className="absolute top-1/2 -translate-y-1/2 w-0.5 h-full bg-white"
                                style={{ left: `${position}%` }}
                            />
                        );
                    })}
                </div>

                <div className="flex justify-between mt-2 text-xs text-gray-500">
                    <span>{paidPercentage.toFixed(0)}% paid</span>
                    <span>{(100 - paidPercentage).toFixed(0)}% remaining</span>
                </div>
            </div>

            {/* Milestones List */}
            <div className="px-6 py-4 space-y-3">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                    Payment Milestones
                </h4>

                {milestones.map((milestone, index) => {
                    const isPreviousPaid = index === 0 || milestones[index - 1].isPaid;
                    const isUnlockable = !milestone.isPaid && isPreviousPaid;

                    return (
                        <div
                            key={milestone.id}
                            className={`
                                flex items-center gap-4 p-4 rounded-xl transition-all
                                ${milestone.isPaid
                                    ? 'bg-emerald-50 border border-emerald-200'
                                    : isUnlockable
                                        ? 'bg-primary/5 border-2 border-primary border-dashed'
                                        : 'bg-gray-50 border border-gray-200 opacity-60'
                                }
                            `}
                        >
                            {/* Status Icon */}
                            <div className={`
                                w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                                ${milestone.isPaid
                                    ? 'bg-emerald-500 text-white'
                                    : isUnlockable
                                        ? 'bg-primary/20 text-primary'
                                        : 'bg-gray-200 text-gray-400'
                                }
                            `}>
                                {milestone.isPaid ? (
                                    <CheckCircleIcon className="w-6 h-6" />
                                ) : isUnlockable ? (
                                    <ClockIcon className="w-5 h-5" />
                                ) : (
                                    <LockClosedIcon className="w-5 h-5" />
                                )}
                            </div>

                            {/* Details */}
                            <div className="flex-1 min-w-0">
                                <p className={`font-medium text-sm ${milestone.isPaid ? 'text-emerald-700' : 'text-gray-800'}`}>
                                    {milestone.stageName}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {milestone.description || `Unlocks Stage ${milestone.unlocksStage}`}
                                </p>
                            </div>

                            {/* Amount */}
                            <div className="text-right flex-shrink-0">
                                <p className={`font-bold text-sm ${milestone.isPaid ? 'text-emerald-600' : 'text-gray-800'}`}>
                                    ₹{(milestone.amount / 1000).toFixed(0)}K
                                </p>
                                <p className="text-xs text-gray-500">{milestone.percentage}%</p>
                            </div>

                            {/* Paid/Due Badge */}
                            {milestone.isPaid ? (
                                <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                                    Paid
                                </span>
                            ) : isUnlockable && milestone.dueDate ? (
                                <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                                    Due {new Date(milestone.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                            ) : null}
                        </div>
                    );
                })}
            </div>

            {/* Next Payment CTA */}
            {nextDueMilestone && (
                <div className="px-6 py-4 bg-gradient-to-r from-primary/5 to-primary/10 border-t border-primary/20">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-700">Next Payment Due</p>
                            <p className="text-lg font-bold text-primary">
                                ₹{(nextDueMilestone.amount / 1000).toFixed(0)}K
                            </p>
                        </div>
                        <button className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90 transition-colors">
                            Pay Now
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MilestonePaymentProgress;
