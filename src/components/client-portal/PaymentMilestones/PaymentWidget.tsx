import React from 'react';
import { LockOpenIcon, LockClosedIcon, CheckCircleIcon } from '@heroicons/react/24/solid';
import { PaymentMilestone } from '../types';

interface PaymentWidgetProps {
    milestones: PaymentMilestone[];
    totalPaid: number;
    totalBudget: number;
    className?: string;
}

const PaymentWidget: React.FC<PaymentWidgetProps> = ({
    milestones,
    totalPaid,
    totalBudget,
    className = ''
}) => {
    const paidPercentage = Math.round((totalPaid / totalBudget) * 100);
    const nextMilestone = milestones.find(m => !m.isPaid);
    const paidCount = milestones.filter(m => m.isPaid).length;

    return (
        <div className={`bg-white rounded-2xl shadow-lg overflow-hidden ${className}`}>
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-800">Payments</h3>
                    <span className="text-sm text-gray-500">
                        {paidCount}/{milestones.length} paid
                    </span>
                </div>

                {/* Simple progress bar */}
                <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                        style={{ width: `${paidPercentage}%` }}
                    />
                </div>
                <div className="flex justify-between mt-2 text-xs">
                    <span className="text-emerald-600 font-medium">₹{(totalPaid / 100000).toFixed(1)}L paid</span>
                    <span className="text-gray-500">₹{(totalBudget / 100000).toFixed(1)}L total</span>
                </div>
            </div>

            {/* Milestone list - Simple */}
            <div className="px-5 py-4 space-y-3 max-h-[200px] overflow-y-auto">
                {milestones.map((milestone, index) => (
                    <div
                        key={milestone.id}
                        className={`
                            flex items-center gap-3 p-3 rounded-xl
                            ${milestone.isPaid
                                ? 'bg-emerald-50'
                                : index === paidCount
                                    ? 'bg-amber-50 border border-amber-200'
                                    : 'bg-gray-50'
                            }
                        `}
                    >
                        {/* Icon */}
                        <div className={`
                            w-8 h-8 rounded-full flex items-center justify-center
                            ${milestone.isPaid
                                ? 'bg-emerald-500 text-white'
                                : index === paidCount
                                    ? 'bg-amber-500 text-white'
                                    : 'bg-gray-200 text-gray-400'
                            }
                        `}>
                            {milestone.isPaid ? (
                                <CheckCircleIcon className="w-5 h-5" />
                            ) : index === paidCount ? (
                                <LockOpenIcon className="w-4 h-4" />
                            ) : (
                                <LockClosedIcon className="w-4 h-4" />
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${milestone.isPaid ? 'text-emerald-700' : 'text-gray-700'}`}>
                                {milestone.stageName}
                            </p>
                            {index === paidCount && !milestone.isPaid && (
                                <p className="text-[10px] text-amber-600">
                                    Unlocks {milestone.stageName} stage
                                </p>
                            )}
                        </div>

                        {/* Amount */}
                        <span className={`text-sm font-bold ${milestone.isPaid ? 'text-emerald-600' : 'text-gray-600'}`}>
                            ₹{(milestone.amount / 1000).toFixed(0)}K
                        </span>
                    </div>
                ))}
            </div>

            {/* Next Payment CTA */}
            {nextMilestone && (
                <div className="px-5 py-4 bg-gradient-to-r from-amber-50 to-amber-100/50 border-t border-amber-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-500">Next Payment</p>
                            <p className="text-lg font-bold text-gray-800">
                                ₹{(nextMilestone.amount / 1000).toFixed(0)}K
                            </p>
                        </div>
                        <button className="px-4 py-2 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 transition-colors">
                            Pay Now
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaymentWidget;
