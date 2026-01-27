import React, { useState } from 'react';
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
import { ActivityStatus, ProjectStatus, PaymentStatus, Project } from '../../../types';
import { ContentCard, StatCard, SectionHeader, staggerContainer, cn } from '../shared/DashboardUI';
import { motion } from 'framer-motion';

// New Components
import OngoingProjectsCard from './OngoingProjectsCard';
import AttendanceStatsCard from './AttendanceStatsCard';
import DashboardCalendar from './DashboardCalendar';
import PerformanceFlagSummary from './PerformanceFlagSummary';
import { usePerformanceMonitor } from '../../../hooks/usePerformanceMonitor';
import FinanceOverview from './FinanceOverview';

import RedFlagsHeader from '../admin/RedFlagsHeader';
import ProjectDetailModal from '../admin/ProjectDetailModal';
import FunnelDetailModal from '../admin/FunnelDetailModal';

const AlertCard: React.FC<{ title: string; count: number; items: string[]; type?: 'error' | 'warning' | 'primary'; onClick?: () => void }> = ({ title, count, items, type = 'error', onClick }) => (
    <ContentCard
        className={cn(
            "border-l-4 transition-all hover:shadow-md",
            type === 'error' ? "border-error" : type === 'warning' ? "border-accent" : "border-primary",
            onClick ? "cursor-pointer active:scale-[0.99]" : ""
        )}
        onClick={onClick}
    >
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
    onNavigateToMember?: (userId: string) => void;
}

const OverviewDashboard: React.FC<OverviewDashboardProps> = ({ setCurrentPage, onNavigateToMember }) => {
    // Activate Background Performance Monitoring
    usePerformanceMonitor();

    // Modal States
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

    // Funnel/Lead Modal State
    const [isFunnelModalOpen, setIsFunnelModalOpen] = useState(false);
    const [funnelStage, setFunnelStage] = useState('All Active Opportunities');
    const [funnelLeads, setFunnelLeads] = useState<Project[]>([]);

    // KPI Calculations
    const totalProjects = PROJECTS.length;
    const activeProjects = PROJECTS.filter(p => [ProjectStatus.IN_EXECUTION, ProjectStatus.PROCUREMENT, ProjectStatus.DESIGN_IN_PROGRESS].includes(p.status)).length;

    const totalLeads = PROJECTS.length; // Simplified for this view
    const conversionRate = 12.5; // Mocked for simplicity here

    const teamMembers = USERS.length;
    const totalRevenue = PROJECTS.filter(p => p.status === ProjectStatus.COMPLETED || p.status === ProjectStatus.APPROVED).reduce((sum, p) => sum + p.budget, 0);

    // Outstanding Payments Calculation
    const unpaidInvoices = INVOICES.filter(i => i.status !== PaymentStatus.PAID);
    // const outstandingTotal -> Moved to FinanceOverview

    // Alert Calculations
    const pendingApprovals = ACTIVITIES.filter(a => a.status === ActivityStatus.PENDING);

    // Handlers
    const handleProjectSelect = (project: Project) => {
        setSelectedProject(project);
        setIsProjectModalOpen(true);
    };

    const handleFunnelClick = () => {
        // Filter leads (mocked here by taking 'NEW' or 'ASSIGNED' projects as leads)
        // In real app, this would be leads from LEADS constant or API
        const leads = PROJECTS.filter(p => p.status === ProjectStatus.AWAITING_DESIGN || p.status === ProjectStatus.PENDING_REVIEW);
        setFunnelLeads(leads);
        setFunnelStage("Active Pipeline");
        setIsFunnelModalOpen(true);
    };

    return (
        <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="space-y-8"
        >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-6">
                    {/* ... existing content ... */}
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

                    {/* Critical Alerts Header */}
                    <RedFlagsHeader />

                    {/* Primary Calendar View - Moved to Top */}
                    <DashboardCalendar />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* ... existing stats cards ... */}
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
                            value={`${conversionRate || 12.5}%`}
                            icon={<PresentationChartLineIcon className="w-6 h-6" />}
                            trend={{ value: '12%', positive: true }}
                            color="secondary"
                            className="cursor-pointer"
                            onClick={handleFunnelClick}
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
                            onClick={() => setCurrentPage('finance')}
                        />
                    </div>

                    <OngoingProjectsCard onProjectSelect={handleProjectSelect} />
                </div>

                {/* Right Sidebar */}
                <div className="lg:col-span-1 space-y-8">
                    <AttendanceStatsCard onViewMember={onNavigateToMember} />

                    {/* ... existing sidebar content ... */}

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

            {/* Modals */}
            <ProjectDetailModal
                isOpen={isProjectModalOpen}
                onClose={() => setIsProjectModalOpen(false)}
                project={selectedProject}
            />

            <FunnelDetailModal
                isOpen={isFunnelModalOpen}
                onClose={() => setIsFunnelModalOpen(false)}
                leadStage={funnelStage}
                leads={funnelLeads}
            />

        </motion.div>
    );
};

export default OverviewDashboard;
