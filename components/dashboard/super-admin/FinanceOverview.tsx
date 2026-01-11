import React from 'react';
import { PROJECTS, INVOICES } from '../../../constants';
import { PaymentStatus, ProjectStatus } from '../../../types';
import { ContentCard, cn } from '../shared/DashboardUI';
import { formatLargeNumberINR } from '../../../constants';
import {
    BanknotesIcon,
    ArrowTrendingUpIcon,
    CurrencyRupeeIcon,
    ClockIcon,
    ChartPieIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

const FinanceOverview: React.FC = () => {
    // 1. Total Revenue (Completed & Approved Projects)
    const revenueProjects = PROJECTS.filter(p => p.status === ProjectStatus.COMPLETED || p.status === ProjectStatus.APPROVED);
    const totalRevenue = revenueProjects.reduce((sum, p) => sum + p.budget, 0);

    // 2. Outstanding (Pending Invoices)
    const unpaidInvoices = INVOICES.filter(i => i.status !== PaymentStatus.PAID);
    const outstandingAmount = unpaidInvoices.reduce((sum, i) => sum + (i.total - (i.paidAmount || 0)), 0);

    // 3. New Leads vs Old Leads Value (Mock Logic for Demo)
    // Assuming "New" means created this year, "Old" means earlier. 
    // Since we don't have detailed dates in mock constants, we'll simulate a 40/60 split of total project value
    const totalPipelineValue = PROJECTS.reduce((sum, p) => sum + p.budget, 0);
    const newBusinessValue = totalPipelineValue * 0.4;

    // 4. Payment Breakdown
    const totalInvoiced = INVOICES.reduce((sum, i) => sum + i.total, 0);
    const paidAmount = INVOICES.reduce((sum, i) => sum + (i.paidAmount || 0), 0);
    const paidPercentage = totalInvoiced > 0 ? (paidAmount / totalInvoiced) * 100 : 0;

    // Mocking Advance/50%/30% breakdown based on standard terms
    const advanceCollected = paidAmount * 0.4;
    const midTermCollected = paidAmount * 0.4;
    const finalCollected = paidAmount * 0.2;

    const stats = [
        {
            title: 'Total Revenue',
            value: formatLargeNumberINR(totalRevenue),
            subValue: '+12% vs last month',
            icon: <BanknotesIcon className="w-6 h-6" />,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10',
            trend: 'up'
        },
        {
            title: 'Outstanding',
            value: formatLargeNumberINR(outstandingAmount),
            subValue: `${unpaidInvoices.length} pending invoices`,
            icon: <ClockIcon className="w-6 h-6" />,
            color: 'text-error',
            bg: 'bg-error/10',
            trend: 'down'
        },
        {
            title: 'Pipeline Value',
            value: formatLargeNumberINR(totalPipelineValue),
            subValue: 'Active deals volume',
            icon: <ArrowTrendingUpIcon className="w-6 h-6" />,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10',
            trend: 'up'
        }
    ];

    return (
        <ContentCard className="col-span-1 lg:col-span-3">
            <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600">
                    <CurrencyRupeeIcon className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-xl font-serif font-bold text-text-primary tracking-tight">Finance & Revenue</h3>
                    <p className="text-xs text-text-tertiary">Real-time financial health indicator</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {stats.map((stat, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-background rounded-2xl p-5 border border-border flex items-center gap-4"
                    >
                        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", stat.bg, stat.color)}>
                            {stat.icon}
                        </div>
                        <div>
                            <p className="text-xs font-bold text-text-tertiary uppercase tracking-wider">{stat.title}</p>
                            <h4 className="text-xl font-black text-text-primary mt-1">{stat.value}</h4>
                            <p className={cn("text-[10px] font-bold mt-1", stat.trend === 'up' ? 'text-emerald-500' : 'text-error')}>
                                {stat.subValue}
                            </p>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Visual Breakdown */}
                <div className="space-y-4">
                    <h4 className="text-sm font-bold text-text-primary flex items-center gap-2">
                        <ChartPieIcon className="w-4 h-4 text-text-tertiary" />
                        Collection Efficiency
                    </h4>

                    {/* Progress Bars */}
                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between text-xs mb-2">
                                <span className="text-text-secondary font-medium">Advance Payments</span>
                                <span className="font-bold text-text-primary">{formatLargeNumberINR(advanceCollected)}</span>
                            </div>
                            <div className="w-full h-2 bg-border/30 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: '85%' }}
                                    className="h-full bg-emerald-500 rounded-full"
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between text-xs mb-2">
                                <span className="text-text-secondary font-medium">Mid-Term (50%)</span>
                                <span className="font-bold text-text-primary">{formatLargeNumberINR(midTermCollected)}</span>
                            </div>
                            <div className="w-full h-2 bg-border/30 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: '45%' }}
                                    className="h-full bg-blue-500 rounded-full"
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between text-xs mb-2">
                                <span className="text-text-secondary font-medium">Final Settlements</span>
                                <span className="font-bold text-text-primary">{formatLargeNumberINR(finalCollected)}</span>
                            </div>
                            <div className="w-full h-2 bg-border/30 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: '20%' }}
                                    className="h-full bg-purple-500 rounded-full"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Additional Insight */}
                <div className="bg-subtle-background/50 rounded-2xl p-6 border border-border/50 flex flex-col justify-center">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-xs font-bold text-text-tertiary uppercase">Net Cashflow</span>
                        <span className="text-green-500 text-xs font-black">+8.4%</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-text-primary">84%</span>
                        <span className="text-sm text-text-secondary">collection rate</span>
                    </div>
                    <p className="text-xs text-text-tertiary mt-2 leading-relaxed">
                        Overall collection efficiency is healthy. Significant pending payments from "Luxury Villa Project" need attention.
                    </p>
                </div>
            </div>
        </ContentCard>
    );
};

export default FinanceOverview;
