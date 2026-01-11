import React from 'react';
import {
    BanknotesIcon,
    PresentationChartLineIcon,
    UserGroupIcon,
    ExclamationTriangleIcon,
    RectangleStackIcon,
    CalendarIcon,
    CreditCardIcon
} from '@heroicons/react/24/outline';
import { USERS, PROJECTS, PENDING_APPROVALS_COUNT, ACTIVITIES, formatLargeNumberINR, INVOICES } from '../../../constants';
import { ActivityStatus, ProjectStatus, PaymentStatus } from '../../../types';
import { ContentCard, StatCard, SectionHeader, staggerContainer, cn } from '../shared/DashboardUI';
import { motion } from 'framer-motion';

// New Components
import OngoingProjectsCard from './OngoingProjectsCard';
import AttendanceStatsCard from './AttendanceStatsCard';
import DashboardCalendar from './DashboardCalendar';
import PerformanceFlagSummary from './PerformanceFlagSummary';
import { usePerformanceMonitor } from '../../../hooks/usePerformanceMonitor';

const AlertCard: React.FC<{ title: string; count: number; items: string[]; type?: 'error' | 'warning' | 'primary' }> = ({ title, count, items, type = 'error' }) => (
    <ContentCard className={cn(
        "border-l-4",
        type === 'error' ? "border-error" : type === 'warning' ? "border-accent" : "border-primary"
    )}>
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
                <div className={cn(
                    "p-2.5 rounded-xl bg-opacity-10",
                    type === 'error' ? "bg-error text-error" : type === 'warning' ? "bg-accent text-accent" : "bg-primary text-primary"
                )}>
                    {type === 'error' || type === 'warning' ? <ExclamationTriangleIcon className="w-5 h-5" /> : <CreditCardIcon className="w-5 h-5" />}
                </div>
                <h3 className="text-lg font-serif font-bold text-text-primary tracking-tight">{title}</h3>
            </div>
            <span className={cn(
                "px-3 py-1 rounded-full text-xs font-black",
                type === 'error' ? "bg-error/10 text-error" : type === 'warning' ? "bg-accent/10 text-accent" : "bg-primary/10 text-primary"
            )}>{count}</span>
        </div>
        {items.length > 0 ? (
            <ul className="space-y-4">
                {items.slice(0, 3).map((item, index) => (
                    <motion.li
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start gap-3 text-sm group cursor-default"
                    >
                        <span className={cn(
                            "w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 transition-transform group-hover:scale-150",
                            type === 'error' ? "bg-error" : type === 'warning' ? "bg-accent" : "bg-primary"
                        )}></span>
                        <span className="text-text-secondary font-medium group-hover:text-text-primary transition-colors">{item}</span>
                    </motion.li>
                ))}
                {items.length > 3 && (
                    <li className="text-[10px] text-text-tertiary font-black uppercase tracking-widest pl-4.5 pt-2">
                        + {items.length - 3} more critical items
                    </li>
                )}
            </ul>
        ) : (
            <p className="text-sm text-text-tertiary italic py-4 text-center">Protocol synchronized. No pending alerts.</p>
        )}
    </ContentCard>
);

interface OverviewDashboardProps {
    setCurrentPage: (page: string) => void;
}

const OverviewDashboard: React.FC<OverviewDashboardProps> = ({ setCurrentPage }) => {
    // Activate Background Performance Monitoring
    usePerformanceMonitor();

    // KPI Calculations
    const totalProjects = PROJECTS.length;
    const activeProjects = PROJECTS.filter(p => [ProjectStatus.IN_EXECUTION, ProjectStatus.PROCUREMENT, ProjectStatus.DESIGN_IN_PROGRESS].includes(p.status)).length;

    const totalLeads = PROJECTS.length; // Simplified for this view
    const conversionRate = 12.5; // Mocked for simplicity here

    const teamMembers = USERS.length;
    const totalRevenue = PROJECTS.filter(p => p.status === ProjectStatus.COMPLETED || p.status === ProjectStatus.APPROVED).reduce((sum, p) => sum + p.budget, 0);

    // Outstanding Payments Calculation
    const unpaidInvoices = INVOICES.filter(i => i.status !== PaymentStatus.PAID);
    const outstandingTotal = unpaidInvoices.reduce((sum, i) => sum + (i.total - (i.paidAmount || 0)), 0);

    // Alert Calculations
    const pendingApprovals = ACTIVITIES.filter(a => a.status === ActivityStatus.PENDING);

    return (
        <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="space-y-10"
        >
            <SectionHeader
                title="Executive Overview"
                subtitle="Synergized command center for MMO project operations."
                actions={
                    <div className="flex items-center gap-2 bg-surface px-4 py-2 rounded-2xl border border-border shadow-sm">
                        <CalendarIcon className="w-4 h-4 text-text-tertiary" />
                        <span className="text-xs font-black uppercase tracking-[0.15em] text-text-secondary">January 2026</span>
                    </div>
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <StatCard
                    title="Enterprise Projects"
                    value={totalProjects}
                    icon={<RectangleStackIcon className="w-6 h-6" />}
                    trend={{ value: '8%', positive: true }}
                    color="primary"
                    className="cursor-pointer"
                    onClick={() => setCurrentPage('projects')}
                />
                <StatCard
                    title="Conversion Yield"
                    value={`${conversionRate}%`}
                    icon={<PresentationChartLineIcon className="w-6 h-6" />}
                    trend={{ value: '12%', positive: true }}
                    color="secondary"
                    className="cursor-pointer"
                    onClick={() => setCurrentPage('leads')}
                />
                <StatCard
                    title="Global Talent"
                    value={teamMembers}
                    icon={<UserGroupIcon className="w-6 h-6" />}
                    trend={{ value: '2', positive: true }}
                    color="accent"
                    className="cursor-pointer"
                    onClick={() => setCurrentPage('team')}
                />
                <StatCard
                    title="Fiscal Velocity (YTD)"
                    value={formatLargeNumberINR(totalRevenue)}
                    icon={<BanknotesIcon className="w-6 h-6" />}
                    trend={{ value: '18%', positive: true }}
                    color="purple"
                    className="cursor-pointer"
                    onClick={() => setCurrentPage('reports')}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-10">
                    <OngoingProjectsCard />
                    <DashboardCalendar />
                </div>
                <div className="lg:col-span-1 space-y-8">
                    <AttendanceStatsCard />

                    {/* Performance Flag System */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 px-1">
                            <span className="w-2 h-4 bg-primary rounded-full"></span>
                            <h3 className="text-sm font-black uppercase tracking-widest text-text-secondary">Workforce Velocity</h3>
                        </div>
                        <PerformanceFlagSummary />
                    </div>

                    <AlertCard
                        title="Strategic Approvals"
                        count={PENDING_APPROVALS_COUNT}
                        items={pendingApprovals.map(a => a.description)}
                        type="warning"
                    />
                    <AlertCard
                        title="Outstanding Payments"
                        count={unpaidInvoices.length}
                        items={unpaidInvoices.map(i => `${i.projectName}: ${formatLargeNumberINR(i.total - i.paidAmount)}`)}
                        type="error"
                    />
                </div>
            </div>
        </motion.div>
    );
};

export default OverviewDashboard;
