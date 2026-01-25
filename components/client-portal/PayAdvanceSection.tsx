import React from 'react';
import { CreditCardIcon, LockClosedIcon, CheckBadgeIcon } from '@heroicons/react/24/outline';
import { formatCurrencyINR } from '../../constants';

interface PayAdvanceSectionProps {
    amount: number;
    milestoneName: string;
    dueDate?: Date;
    isOverdue?: boolean;
    onPayNow: () => void;
}

const PayAdvanceSection: React.FC<PayAdvanceSectionProps> = ({
    amount,
    milestoneName,
    dueDate,
    isOverdue,
    onPayNow
}) => {
    return (
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-bold uppercase tracking-wider mb-3 backdrop-blur-sm">
                            <CreditCardIcon className="w-4 h-4" />
                            Payment Due
                        </div>
                        <h2 className="text-3xl font-bold mb-1">Pay {milestoneName}</h2>
                        {dueDate && (
                            <p className={`text-sm ${isOverdue ? 'text-red-300 font-bold' : 'text-indigo-200'}`}>
                                Due by {dueDate.toLocaleDateString()}
                            </p>
                        )}
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-indigo-300 uppercase tracking-widest font-bold mb-1">Amount</p>
                        <p className="text-4xl font-black tracking-tight">{formatCurrencyINR(amount)}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 text-sm text-indigo-200">
                            <CheckBadgeIcon className="w-5 h-5 text-emerald-400" />
                            <span>Secure Payment Gateway (256-bit SSL)</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-indigo-200">
                            <CheckBadgeIcon className="w-5 h-5 text-emerald-400" />
                            <span>Instant Receipt Generation</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-indigo-200">
                            <CheckBadgeIcon className="w-5 h-5 text-emerald-400" />
                            <span>Multiple Payment Options (UPI, Card, NetBanking)</span>
                        </div>
                    </div>

                    <button
                        onClick={onPayNow}
                        className="w-full py-4 bg-white text-indigo-900 rounded-xl font-black text-lg hover:bg-indigo-50 transition-all transform hover:-translate-y-1 shadow-lg flex items-center justify-center gap-3"
                    >
                        <LockClosedIcon className="w-6 h-6" />
                        Pay Securely Now
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PayAdvanceSection;
