import React, { useState } from 'react';
import { PROJECTS, INVOICES, formatLargeNumberINR } from '../../../constants';
import { PaymentStatus, ProjectStatus, Invoice } from '../../../types';
import { ContentCard, SectionHeader, cn, staggerContainer } from '../shared/DashboardUI';
import { format } from 'date-fns';
import {
    BanknotesIcon,
    ArrowTrendingUpIcon,
    ClockIcon,
    ChartPieIcon,
    DocumentTextIcon,
    FunnelIcon,
    MagnifyingGlassIcon,
    ArrowTrendingDownIcon,
    BriefcaseIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

const FinancePage: React.FC = () => {
    const [filterStatus, setFilterStatus] = useState<PaymentStatus | 'All'>('All');

    // 1. Calculations
    const revenueProjects = PROJECTS.filter(p => p.status === ProjectStatus.COMPLETED || p.status === ProjectStatus.APPROVED);
    const totalRevenue = revenueProjects.reduce((sum, p) => sum + p.budget, 0);

    const unpaidInvoices = INVOICES.filter(i => i.status !== PaymentStatus.PAID);
    const outstandingAmount = unpaidInvoices.reduce((sum, i) => sum + (i.total - (i.paidAmount || 0)), 0);

    const totalPipelineValue = PROJECTS.reduce((sum, p) => sum + p.budget, 0);

    // Mocking Month-over-Month
    const lastMonthRevenue = totalRevenue * 0.85; // Mock
    const revenueGrowth = ((totalRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;

    // Payment Breakdown by Category (Mock)
    const breakdown = [
        { label: 'Design Services', value: totalRevenue * 0.15, color: 'bg-indigo-500', icon: '🎨' },
        { label: 'Site Execution', value: totalRevenue * 0.60, color: 'bg-emerald-500', icon: '🏗️' },
        { label: 'Procurement', value: totalRevenue * 0.25, color: 'bg-amber-500', icon: '📦' },
    ];

    // Mock Chart Data (YTD Monthly)
    const monthlyData = [
        { month: 'Apr', value: 4500000 },
        { month: 'May', value: 5200000 },
        { month: 'Jun', value: 4800000 },
        { month: 'Jul', value: 6100000 },
        { month: 'Aug', value: 5900000 },
        { month: 'Sep', value: 7200000 },
        { month: 'Oct', value: 8500000 },
        { month: 'Nov', value: 7800000 },
        { month: 'Dec', value: 9200000 },
        { month: 'Jan', value: 10500000 },
    ];

    const maxVal = Math.max(...monthlyData.map(d => d.value));

    const paidPercentage = (totalRevenue / totalPipelineValue) * 100;

    const filteredInvoices = filterStatus === 'All'
        ? INVOICES
        : INVOICES.filter(i => i.status === filterStatus);

    return (
        <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="space-y-8 pb-20"
        >
            <SectionHeader
                title="Financial Intelligence"
                subtitle="Real-time revenue stream tracking and project-level financial audits."
                actions={
                    <div className="flex items-center gap-2 bg-surface px-4 py-2 rounded-2xl border border-border shadow-sm">
                        <BanknotesIcon className="w-4 h-4 text-emerald-500" />
                        <span className="text-xs font-black uppercase tracking-[0.15em] text-text-secondary">FY 25-26</span>
                    </div>
                }
            />

            {/* Core Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <ContentCard className="bg-emerald-500/5 border-emerald-500/10">
                    <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-1">Total Revenue (YTD)</p>
                    <div className="flex items-end gap-3">
                        <h3 className="text-2xl font-black text-text-primary">{formatLargeNumberINR(totalRevenue)}</h3>
                        <div className="flex items-center text-[10px] font-black text-emerald-600 mb-1">
                            <ArrowTrendingUpIcon className="w-3 h-3 mr-0.5" />
                            {revenueGrowth.toFixed(1)}%
                        </div>
                    </div>
                </ContentCard>

                <ContentCard className="bg-error/5 border-error/10">
                    <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-1">Outstanding Debt</p>
                    <div className="flex items-end gap-3">
                        <h3 className="text-2xl font-black text-text-primary">{formatLargeNumberINR(outstandingAmount)}</h3>
                        <div className="text-[10px] font-black text-error mb-1 uppercase">Action Req</div>
                    </div>
                </ContentCard>

                <ContentCard className="border-border">
                    <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-1">Last Month</p>
                    <h3 className="text-2xl font-black text-text-primary">{formatLargeNumberINR(lastMonthRevenue)}</h3>
                    <p className="text-[10px] text-text-tertiary mt-1">Settled on 5th Jan</p>
                </ContentCard>

                <ContentCard className="bg-indigo-500/5 border-indigo-500/10">
                    <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-1">Pipeline Ratio</p>
                    <div className="flex items-end gap-3">
                        <h3 className="text-2xl font-black text-text-primary">{paidPercentage.toFixed(1)}%</h3>
                        <div className="w-16 h-1.5 bg-indigo-500/10 rounded-full mb-2.5 overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${paidPercentage}%` }} />
                        </div>
                    </div>
                </ContentCard>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Revenue Chart (SVG) */}
                <ContentCard className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-text-primary">Revenue Velocity</h3>
                            <p className="text-[10px] text-text-tertiary font-bold mt-1 uppercase tracking-tight">Financial Year Performance Trend</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-primary" />
                                <span className="text-[10px] font-bold text-text-tertiary uppercase">Actual</span>
                            </div>
                        </div>
                    </div>

                    <div className="h-64 w-full relative group">
                        <svg className="w-full h-full overflow-visible" preserveAspectRatio="none">
                            {/* Grid Lines */}
                            {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
                                <line
                                    key={i}
                                    x1="0" y1={`${p * 100}%`}
                                    x2="100%" y2={`${p * 100}%`}
                                    stroke="currentColor"
                                    className="text-border/30"
                                    strokeDasharray="4 4"
                                />
                            ))}

                            {/* Area Fill */}
                            <path
                                d={`M 0 256 ${monthlyData.map((d, i) =>
                                    `L ${(i / (monthlyData.length - 1)) * 100}%, ${(1 - d.value / (maxVal * 1.1)) * 100}%`
                                ).join(' ')} L 100% 256 Z`}
                                fill="url(#gradient)"
                                className="opacity-10"
                            />

                            {/* Line Path */}
                            <path
                                d={monthlyData.map((d, i) =>
                                    `${i === 0 ? 'M' : 'L'} ${(i / (monthlyData.length - 1)) * 100}%, ${(1 - d.value / (maxVal * 1.1)) * 100}%`
                                ).join(' ')}
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                className="text-primary"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />

                            {/* Data Points */}
                            {monthlyData.map((d, i) => (
                                <circle
                                    key={i}
                                    cx={`${(i / (monthlyData.length - 1)) * 100}%`}
                                    cy={`${(1 - d.value / (maxVal * 1.1)) * 100}%`}
                                    r="4"
                                    className="fill-white stroke-primary stroke-2 hover:r-6 transition-all cursor-pointer"
                                />
                            ))}

                            <defs>
                                <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="var(--primary-color, #1e40af)" />
                                    <stop offset="100%" stopColor="transparent" />
                                </linearGradient>
                            </defs>
                        </svg>

                        {/* X-Axis Labels */}
                        <div className="flex justify-between mt-4">
                            {monthlyData.map(d => (
                                <span key={d.month} className="text-[9px] font-black text-text-tertiary uppercase tracking-tighter">{d.month}</span>
                            ))}
                        </div>
                    </div>
                </ContentCard>

                {/* Distribution Chart */}
                <ContentCard>
                    <div className="flex items-center gap-3 mb-8">
                        <ChartPieIcon className="w-5 h-5 text-indigo-500" />
                        <h3 className="text-sm font-black uppercase tracking-widest text-text-primary">Source Attribution</h3>
                    </div>

                    <div className="space-y-6">
                        {breakdown.map((item, idx) => (
                            <div key={idx} className="group cursor-default">
                                <div className="flex justify-between items-end mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">{item.icon}</span>
                                        <div>
                                            <p className="text-[10px] font-black text-text-primary uppercase tracking-tight">{item.label}</p>
                                            <p className="text-[9px] font-bold text-text-tertiary">Current Tier Contribution</p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-black text-text-primary">{formatLargeNumberINR(item.value)}</span>
                                </div>
                                <div className="w-full h-1.5 bg-subtle-background rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(item.value / totalRevenue) * 100}%` }}
                                        className={cn("h-full rounded-full shadow-sm", item.color)}
                                    />
                                </div>
                                <div className="flex justify-between mt-1 text-[8px] font-black text-text-tertiary uppercase tracking-widest">
                                    <span>Share: {((item.value / totalRevenue) * 100).toFixed(0)}%</span>
                                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">Target Exceeded</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 p-6 bg-indigo-500/5 border border-indigo-500/10 rounded-3xl">
                        <div className="flex items-start gap-4">
                            <BriefcaseIcon className="w-5 h-5 text-indigo-500 mt-1" />
                            <div>
                                <p className="text-[11px] font-black text-indigo-900 uppercase">Strategic Insight</p>
                                <p className="text-[10px] text-indigo-700/80 mt-1 leading-relaxed font-medium italic">
                                    "Execution services account for 60% of volume. Consider upselling premium design packages to balance the yield."
                                </p>
                            </div>
                        </div>
                    </div>
                </ContentCard>
            </div>

            {/* Project Audits Row */}
            <ContentCard>
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <ArrowTrendingUpIcon className="w-5 h-5 text-emerald-500" />
                        <h3 className="text-sm font-black uppercase tracking-widest text-text-primary">Project Financial Health</h3>
                    </div>
                    <button className="text-[10px] font-black text-primary uppercase tracking-[0.2em] hover:underline transition-all">Export Detailed Ledger</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {PROJECTS.slice(0, 6).map((project, idx) => {
                        const paid = project.budget * (idx % 2 === 0 ? 0.7 : 0.4);
                        const progress = (paid / project.budget) * 100;
                        return (
                            <div key={project.id} className="p-5 border border-border/60 rounded-[2rem] hover:shadow-xl hover:border-primary/20 transition-all bg-surface group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-subtle-background flex items-center justify-center text-text-tertiary">
                                            <DocumentTextIcon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-black text-text-primary uppercase truncate w-32">{project.projectName}</h4>
                                            <p className="text-[9px] font-bold text-text-tertiary uppercase">{project.clientName}</p>
                                        </div>
                                    </div>
                                    <span className={cn(
                                        "px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border",
                                        progress > 60 ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                    )}>
                                        {progress > 60 ? 'Healthy' : 'Pending'}
                                    </span>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-end">
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-text-tertiary uppercase tracking-widest">Invoiced Value</p>
                                            <p className="text-sm font-black text-text-primary">{formatLargeNumberINR(project.budget)}</p>
                                        </div>
                                        <div className="text-right space-y-1">
                                            <p className="text-[9px] font-black text-text-tertiary uppercase tracking-widest">Balance</p>
                                            <p className="text-sm font-black text-error">{formatLargeNumberINR(project.budget - paid)}</p>
                                        </div>
                                    </div>
                                    <div className="w-full h-1.5 bg-subtle-background rounded-full overflow-hidden">
                                        <div
                                            className={cn("h-full rounded-full transition-all duration-1000", progress > 60 ? "bg-emerald-500" : "bg-amber-500")}
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </ContentCard>

            {/* Invoices List */}
            <ContentCard>
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <DocumentTextIcon className="w-5 h-5 text-text-tertiary" />
                        <h3 className="text-sm font-black uppercase tracking-widest text-text-primary">Recent Invoices</h3>
                    </div>
                    <div className="flex gap-2">
                        {['All', PaymentStatus.PAID, PaymentStatus.PENDING, PaymentStatus.OVERDUE].map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status as any)}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                                    filterStatus === status
                                        ? "bg-primary text-white border-primary shadow-lg shadow-primary/25"
                                        : "bg-surface text-text-tertiary border-border hover:border-primary hover:text-primary"
                                )}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border/40 text-[10px] font-black uppercase tracking-[0.2em] text-text-tertiary bg-subtle-background/30 rounded-t-2xl">
                                <th className="py-5 pl-8">Protocol ID</th>
                                <th className="py-5">Entity / Engagement</th>
                                <th className="py-5">Sync Date</th>
                                <th className="py-5">Gross Value</th>
                                <th className="py-5 text-right pr-8">Status Registry</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/20">
                            {filteredInvoices.map((invoice, idx) => (
                                <motion.tr
                                    key={invoice.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="hover:bg-subtle-background/50 transition-all group"
                                >
                                    <td className="py-6 pl-8">
                                        <div className="w-12 h-12 bg-white border border-border rounded-xl flex items-center justify-center font-mono text-[10px] font-black text-primary shadow-sm group-hover:scale-110 transition-transform">
                                            #{invoice.invoiceNumber.split('-')[1]}
                                        </div>
                                    </td>
                                    <td className="py-6">
                                        <p className="text-xs font-black text-text-primary uppercase tracking-tight">{invoice.clientName}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="w-1 h-1 rounded-full bg-primary" />
                                            <p className="text-[10px] font-bold text-text-tertiary uppercase italic">{invoice.projectName}</p>
                                        </div>
                                    </td>
                                    <td className="py-6 text-[10px] font-black text-text-secondary uppercase">
                                        {format(new Date(invoice.issueDate), 'dd MMM yyyy')}
                                    </td>
                                    <td className="py-6 font-mono text-sm font-black text-text-primary">
                                        {formatLargeNumberINR(invoice.total)}
                                    </td>
                                    <td className="py-6 text-right pr-8">
                                        <span className={cn(
                                            "inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.15em] border",
                                            invoice.status === PaymentStatus.PAID ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                                                invoice.status === PaymentStatus.OVERDUE ? "bg-error/10 text-error border-error/20" :
                                                    "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                        )}>
                                            <div className={cn("w-1.5 h-1.5 rounded-full",
                                                invoice.status === PaymentStatus.PAID ? "bg-emerald-500" :
                                                    invoice.status === PaymentStatus.OVERDUE ? "bg-error" : "bg-amber-500"
                                            )} />
                                            {invoice.status}
                                        </span>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </ContentCard>
        </motion.div>
    );
};

export default FinancePage;
