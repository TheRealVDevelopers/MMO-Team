
import React from 'react';
import Card from '../../shared/Card';
import { LEADS, USERS } from '../../../constants';
import { Lead, LeadPipelineStatus, UserRole } from '../../../types';
import { ExclamationTriangleIcon } from '../../icons/IconComponents';

const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value);

const salesTeam = USERS.filter(u => u.role === UserRole.SALES_TEAM_MEMBER);
const pipelineOrder = Object.values(LeadPipelineStatus);

const KpiCard: React.FC<{ title: string; value: string; onClick?: () => void }> = ({ title, value, onClick }) => (
    <Card className={`flex flex-col justify-between ${onClick ? 'cursor-pointer hover:shadow-md hover:border-primary transition-all' : ''} border border-transparent`} onClick={onClick}>
      <p className="text-sm font-medium text-text-secondary">{title}</p>
      <p className="text-3xl font-bold text-text-primary tracking-tight">{value}</p>
    </Card>
);

const SalesOverviewPage: React.FC<{ setCurrentPage: (page: string) => void }> = ({ setCurrentPage }) => {
    // --- MOCK DATA CALCULATIONS ---
    const leadsThisMonth = LEADS.filter(l => l.inquiryDate > new Date(new Date().setDate(1)));
    const totalLeads = leadsThisMonth.length;
    const projectsWon = leadsThisMonth.filter(l => l.status === LeadPipelineStatus.WON).length;
    const totalRevenue = leadsThisMonth.filter(l => l.status === LeadPipelineStatus.WON).reduce((sum, l) => sum + l.value, 0);
    const conversionRate = totalLeads > 0 ? ((projectsWon / totalLeads) * 100).toFixed(1) : '0';

    const pipelineCounts = LEADS.reduce((acc, lead) => {
        acc[lead.status] = (acc[lead.status] || 0) + 1;
        return acc;
    }, {} as Record<LeadPipelineStatus, number>);

    const urgentAlerts = LEADS.filter(l => l.status === LeadPipelineStatus.NEW_NOT_CONTACTED && (new Date().getTime() - l.inquiryDate.getTime()) > 24 * 60 * 60 * 1000);

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-text-primary">Sales Dashboard</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard title="New Leads (Month)" value={totalLeads.toString()} onClick={() => setCurrentPage('leads')} />
                <KpiCard title="Conversion Rate" value={`${conversionRate}%`} />
                <KpiCard title="Projects Won (Month)" value={projectsWon.toString()} onClick={() => setCurrentPage('leads')}/>
                <KpiCard title="Revenue (Month)" value={formatCurrency(totalRevenue)} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Card className="h-full">
                        <h3 className="text-lg font-bold">Sales Pipeline</h3>
                        <div className="mt-4 space-y-4">
                            {pipelineOrder.map(status => (
                                <div key={status} className="space-y-1 cursor-pointer" onClick={() => setCurrentPage('leads')}>
                                    <div className="flex justify-between text-sm font-medium">
                                        <span className="text-text-secondary">{status}</span>
                                        <span className="text-text-primary">{pipelineCounts[status] || 0} Leads</span>
                                    </div>
                                    <div className="w-full bg-subtle-background rounded-full h-4">
                                        <div className="bg-primary h-4 rounded-full" style={{width: `${((pipelineCounts[status] || 0) / LEADS.length) * 100}%`}}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <h3 className="text-lg font-bold">Team Performance</h3>
                        <ul className="mt-4 space-y-3">
                            {salesTeam.map((member) => (
                                <li key={member.id} className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <img src={member.avatar} alt={member.name} className="w-8 h-8 rounded-full"/>
                                        <span className="ml-3 text-sm font-medium">{member.name}</span>
                                    </div>
                                    <div className="text-sm font-bold text-secondary">
                                        {LEADS.filter(l => l.assignedTo === member.id && l.status === LeadPipelineStatus.WON).length} Won
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </Card>
                    <Card>
                        <h3 className="text-lg font-bold text-error flex items-center"><ExclamationTriangleIcon className="w-5 h-5 mr-2"/> Urgent Alerts</h3>
                        <ul className="mt-4 space-y-3">
                            {urgentAlerts.length > 0 ? urgentAlerts.map(alert => (
                                <li key={alert.id} className="text-sm">
                                    <p className="font-medium text-text-primary">{alert.clientName}</p>
                                    <p className="text-xs text-text-secondary">New lead uncontacted for > 24 hours.</p>
                                </li>
                            )) : <p className="text-sm text-text-secondary">No urgent alerts.</p>}
                        </ul>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default SalesOverviewPage;