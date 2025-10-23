import React from 'react';
import Card from '../../shared/Card';
import { PROJECTS } from '../../../constants';
import { Project, ProjectStatus } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { FireIcon, ClockIcon } from '../../icons/IconComponents';
import StatusPill from '../../shared/StatusPill';

const PriorityIndicator: React.FC<{ priority: 'High' | 'Medium' | 'Low' }> = ({ priority }) => {
    if (priority === 'High') return <div className="flex items-center text-sm text-error"><FireIcon className="w-4 h-4 mr-1" /> High</div>;
    if (priority === 'Medium') return <div className="flex items-center text-sm text-accent">Medium</div>;
    return <div className="flex items-center text-sm text-text-secondary">Low</div>;
};

const KpiCard: React.FC<{ title: string; value: string; subtext?: string }> = ({ title, value, subtext }) => (
    <Card>
      <p className="text-sm font-medium text-text-secondary">{title}</p>
      <p className="text-2xl font-bold text-text-primary tracking-tight">{value}</p>
      {subtext && <p className="text-xs text-text-secondary mt-1">{subtext}</p>}
    </Card>
);

const QuotationOverviewPage: React.FC<{ onProjectSelect: (project: Project) => void }> = ({ onProjectSelect }) => {
    const { currentUser } = useAuth();
    if (!currentUser) return null;

    const myProjects = PROJECTS.filter(p => p.assignedTeam.quotation === currentUser.id);
    const quotationQueue = myProjects.filter(p => p.status === ProjectStatus.AWAITING_QUOTATION);
    
    // Performance Metrics
    const quotesSent = myProjects.filter(p => p.status !== ProjectStatus.AWAITING_QUOTATION).length;
    const dealsWon = myProjects.filter(p => p.status === ProjectStatus.APPROVED).length;
    const conversionRate = quotesSent > 0 ? ((dealsWon / quotesSent) * 100).toFixed(1) : '0';
    const avgDealSize = dealsWon > 0 ? (myProjects.filter(p => p.status === ProjectStatus.APPROVED).reduce((sum, p) => sum + p.budget, 0) / dealsWon) : 0;
    const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value);

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-text-primary">Welcome, {currentUser.name.split(' ')[0]}</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard title="Projects in Queue" value={quotationQueue.length.toString()} subtext="Awaiting your pricing" />
                <KpiCard title="Conversion Rate" value={`${conversionRate}%`} subtext={`${dealsWon} deals won`} />
                <KpiCard title="Average Deal Size" value={formatCurrency(avgDealSize)} />
                <KpiCard title="Avg. Negotiation Time" value="2.1 Days" />
            </div>

            <Card>
                <h3 className="text-lg font-bold">My Quotation Queue</h3>
                <p className="text-sm text-text-secondary mt-1">Projects awaiting pricing and proposal.</p>
                <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                        <thead className="bg-subtle-background">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Project / Client</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Received</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Deadline</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Priority</th>
                            </tr>
                        </thead>
                        <tbody className="bg-surface divide-y divide-border">
                            {quotationQueue.length > 0 ? quotationQueue.map(project => (
                                <tr key={project.id} onClick={() => onProjectSelect(project)} className="cursor-pointer hover:bg-subtle-background">
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <p className="text-sm font-bold text-text-primary">{project.projectName}</p>
                                        <p className="text-xs text-text-secondary">{project.clientName}</p>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-text-secondary">{project.startDate.toLocaleDateString()}</td>
                                    <td className="px-4 py-3 text-sm text-text-secondary flex items-center"><ClockIcon className="w-4 h-4 mr-1.5"/>{project.deadline}</td>
                                    <td className="px-4 py-3"><PriorityIndicator priority={project.priority} /></td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="text-center py-8 text-text-secondary">The quotation queue is clear. Well done!</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default QuotationOverviewPage;