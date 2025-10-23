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
import { USERS, PROJECTS, PENDING_APPROVALS_COUNT, LEADS, ACTIVITIES } from '../../../constants';
import { ActivityStatus, UserRole, ProjectStatus, LeadPipelineStatus } from '../../../types';

const MetricCard: React.FC<{ title: string; value: string; icon: React.ReactNode; subtext?: string; }> = ({ title, value, icon, subtext }) => (
    <Card className="hover:shadow-md hover:border-primary transition-all border border-transparent">
        <div className="flex items-center">
            <div className="p-3 rounded-full bg-primary-subtle-background text-primary">
                {icon}
            </div>
            <div className="ml-4">
                <p className="text-sm font-medium text-text-secondary">{title}</p>
                <p className="text-2xl font-bold text-text-primary">{value}</p>
            </div>
        </div>
        {subtext && <p className="text-xs text-text-secondary mt-2">{subtext}</p>}
    </Card>
);

const AlertCard: React.FC<{ title: string; count: number; items: string[] }> = ({ title, count, items }) => (
    <Card>
        <h3 className="text-lg font-bold text-error flex items-center">
            <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
            {title} ({count})
        </h3>
        <ul className="mt-4 space-y-2 text-sm list-disc list-inside text-text-primary">
           {items.slice(0, 3).map((item, index) => <li key={index}>{item}</li>)}
           {items.length > 3 && <li className="text-xs text-text-secondary">...and {items.length - 3} more</li>}
        </ul>
    </Card>
);

const OverviewDashboard: React.FC = () => {
    // KPI Calculations
    const totalProjects = PROJECTS.length;
    const activeProjects = PROJECTS.filter(p => p.status === ProjectStatus.IN_EXECUTION).length;
    const completedProjects = PROJECTS.filter(p => p.status === ProjectStatus.COMPLETED).length;

    const totalLeads = LEADS.length;
    const newLeadsThisWeek = LEADS.filter(l => (new Date().getTime() - l.inquiryDate.getTime()) < 7 * 24 * 60 * 60 * 1000).length;
    const convertedLeads = LEADS.filter(l => l.status === LeadPipelineStatus.WON).length;
    const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : 0;
    
    const teamMembers = USERS.length;
    
    // Alert Calculations
    const projectDelays = PROJECTS.filter(p => p.progress < 50 && new Date(p.endDate) < new Date());
    const pendingApprovals = ACTIVITIES.filter(a => a.status === ActivityStatus.PENDING);


    return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-text-primary">Super Admin Overview</h2>
      
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard title="Total Projects" value={totalProjects.toString()} icon={<RectangleStackIcon />} subtext={`${activeProjects} active, ${completedProjects} completed`} />
            <MetricCard title="Lead Conversion" value={`${conversionRate}%`} icon={<ChartBarIcon />} subtext={`${newLeadsThisWeek} new leads this week`} />
            <MetricCard title="Team Members" value={teamMembers.toString()} icon={<UserGroupIcon />} subtext="Across all departments" />
            <MetricCard title="Total Revenue (YTD)" value="$1.2M" icon={<BanknotesIcon />} subtext="Placeholder data" />
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
            <Card>
                <h3 className="text-lg font-bold">Productivity Chart (Weekly)</h3>
                <div className="mt-4 h-64 bg-subtle-background rounded-md flex items-center justify-center">
                    <p className="text-text-secondary">Chart Placeholder</p>
                </div>
            </Card>
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
