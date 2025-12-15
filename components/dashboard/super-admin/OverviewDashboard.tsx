
import React from 'react';
import Card from '../../shared/Card';
import { 
    BanknotesIcon, 
    ChartBarIcon, 
    UserGroupIcon,
    ClipboardDocumentCheckIcon,
    ExclamationTriangleIcon,
    RectangleStackIcon
} from '../../icons/IconComponents';
import { USERS, PROJECTS, PENDING_APPROVALS_COUNT, LEADS, ACTIVITIES, formatLargeNumberINR } from '../../../constants';
import { ActivityStatus, UserRole, ProjectStatus, LeadPipelineStatus } from '../../../types';
import TeamLiveStatusCard from './TeamLiveStatusCard';

const MetricCard: React.FC<{ title: string; value: string; icon: React.ReactNode; subtext?: string; onClick?: () => void; gradient?: string }> = ({ title, value, icon, subtext, onClick, gradient = 'from-kurchi-gold-500 to-kurchi-gold-600' }) => (
    <Card 
        hover={!!onClick}
        className={`${onClick ? 'cursor-pointer' : ''} overflow-hidden relative group`}
        onClick={onClick}
    >
        <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
            <div className={`w-full h-full bg-gradient-to-br ${gradient} rounded-full transform translate-x-12 -translate-y-12`}></div>
        </div>
        <div className="relative">
            <div className="flex items-start justify-between mb-4">
                <div className={`p-3.5 rounded-xl bg-gradient-to-br ${gradient} text-white shadow-md group-hover:scale-110 transition-transform`}>
                    {icon}
                </div>
                <div className="text-right">
                    <p className="text-3xl font-bold text-kurchi-espresso-900 group-hover:text-kurchi-gold-600 transition-colors">{value}</p>
                </div>
            </div>
            <div>
                <p className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-1">{title}</p>
                {subtext && <p className="text-xs text-text-secondary font-light mt-2">{subtext}</p>}
            </div>
        </div>
    </Card>
);

const AlertCard: React.FC<{ title: string; count: number; items: string[] }> = ({ title, count, items }) => (
    <Card className="border-l-4 border-error">
        <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-error flex items-center">
                <div className="p-2 rounded-lg bg-error/10 mr-3">
                    <ExclamationTriangleIcon className="w-5 h-5" />
                </div>
                {title}
            </h3>
            <span className="px-3 py-1 bg-error/10 text-error rounded-full text-sm font-bold">{count}</span>
        </div>
        {items.length > 0 ? (
            <ul className="space-y-3">
                {items.slice(0, 3).map((item, index) => (
                    <li key={index} className="flex items-start space-x-2 text-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-error mt-1.5 flex-shrink-0"></span>
                        <span className="text-text-primary font-medium">{item}</span>
                    </li>
                ))}
                {items.length > 3 && (
                    <li className="text-xs text-text-secondary italic pl-3.5">+ {items.length - 3} more items</li>
                )}
            </ul>
        ) : (
            <p className="text-sm text-text-secondary italic">No pending items</p>
        )}
    </Card>
);

interface OverviewDashboardProps {
    setCurrentPage: (page: string) => void;
}

const OverviewDashboard: React.FC<OverviewDashboardProps> = ({ setCurrentPage }) => {
    // KPI Calculations
    const totalProjects = PROJECTS.length;
    const activeProjects = PROJECTS.filter(p => p.status === ProjectStatus.IN_EXECUTION).length;
    const completedProjects = PROJECTS.filter(p => p.status === ProjectStatus.COMPLETED).length;

    const totalLeads = LEADS.length;
    const newLeadsThisWeek = LEADS.filter(l => (new Date().getTime() - l.inquiryDate.getTime()) < 7 * 24 * 60 * 60 * 1000).length;
    const convertedLeads = LEADS.filter(l => l.status === LeadPipelineStatus.WON).length;
    const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : 0;
    
    const teamMembers = USERS.length;
    const totalRevenue = PROJECTS.filter(p => p.status === ProjectStatus.COMPLETED || p.status === ProjectStatus.APPROVED).reduce((sum, p) => sum + p.budget, 0);

    // Alert Calculations
    const projectDelays = PROJECTS.filter(p => p.progress < 50 && new Date(p.endDate) < new Date());
    const pendingApprovals = ACTIVITIES.filter(a => a.status === ActivityStatus.PENDING);


    return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
            <h2 className="text-3xl font-serif font-bold text-kurchi-espresso-900 mb-2">Dashboard Overview</h2>
            <p className="text-text-secondary font-light">Welcome back! Here's what's happening today.</p>
        </div>
        <div className="text-right">
            <p className="text-xs text-text-secondary uppercase tracking-wider mb-1">Current Period</p>
            <p className="text-sm font-bold text-kurchi-espresso-900">December 2025</p>
        </div>
      </div>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard 
                title="Total Projects" 
                value={totalProjects.toString()} 
                icon={<RectangleStackIcon className="w-6 h-6" />} 
                subtext={`${activeProjects} active · ${completedProjects} completed`} 
                onClick={() => setCurrentPage('projects')}
                gradient="from-blue-500 to-blue-600"
            />
            <MetricCard 
                title="Lead Conversion" 
                value={`${conversionRate}%`} 
                icon={<ChartBarIcon className="w-6 h-6" />} 
                subtext={`${newLeadsThisWeek} new leads this week`}
                onClick={() => setCurrentPage('leads')}
                gradient="from-purple-500 to-purple-600"
            />
            <MetricCard 
                title="Team Members" 
                value={teamMembers.toString()} 
                icon={<UserGroupIcon className="w-6 h-6" />} 
                subtext="Across all departments"
                onClick={() => setCurrentPage('team')}
                gradient="from-orange-500 to-orange-600"
            />
            <MetricCard 
                title="Total Revenue (YTD)" 
                value={formatLargeNumberINR(totalRevenue)} 
                icon={<BanknotesIcon className="w-6 h-6" />} 
                subtext="From completed projects"
                onClick={() => setCurrentPage('reports')}
                gradient="from-green-500 to-green-600"
            />
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
            <TeamLiveStatusCard />
        </div>
        <div className="lg:col-span-1 space-y-6">
            <AlertCard 
                title="Pending Approvals" 
                count={PENDING_APPROVALS_COUNT} 
                items={pendingApprovals.map(a => a.description)}
            />
            <AlertCard 
                title="Project Delays" 
                count={projectDelays.length} 
                items={projectDelays.map(p => p.projectName)}
            />
        </div>
      </div>
    </div>
  );
};

export default OverviewDashboard;