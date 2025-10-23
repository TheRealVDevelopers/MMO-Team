import React from 'react';
import Card from '../../shared/Card';
import { LEADS } from '../../../constants';
import { LeadPipelineStatus } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { ChevronRightIcon, ClockIcon } from '../../icons/IconComponents';

const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value);

const KpiCard: React.FC<{ title: string; value: string; onClick?: () => void }> = ({ title, value, onClick }) => (
    <Card className={`flex flex-col justify-between ${onClick ? 'cursor-pointer hover:shadow-md hover:border-primary transition-all' : ''} border border-transparent`} onClick={onClick}>
      <p className="text-sm font-medium text-text-secondary">{title}</p>
      <p className="text-3xl font-bold text-text-primary tracking-tight">{value}</p>
    </Card>
);

const SalesOverviewPage: React.FC<{ setCurrentPage: (page: string) => void }> = ({ setCurrentPage }) => {
    const { currentUser } = useAuth();
    
    if (!currentUser) return null;

    const myLeads = LEADS.filter(l => l.assignedTo === currentUser.id);
    const leadsThisMonth = myLeads.filter(l => l.inquiryDate > new Date(new Date().setDate(1)));
    const activeLeads = myLeads.filter(l => ![LeadPipelineStatus.WON, LeadPipelineStatus.LOST].includes(l.status)).length;
    const projectsWon = leadsThisMonth.filter(l => l.status === LeadPipelineStatus.WON).length;
    const totalRevenue = leadsThisMonth.filter(l => l.status === LeadPipelineStatus.WON).reduce((sum, l) => sum + l.value, 0);
    const conversionRate = leadsThisMonth.length > 0 ? ((projectsWon / leadsThisMonth.length) * 100).toFixed(1) : '0';
    
    const todaysFollowUps = myLeads.filter(l => l.status === LeadPipelineStatus.CONTACTED_CALL_DONE || l.status === LeadPipelineStatus.NEW_NOT_CONTACTED);
    const recentActivities = myLeads.flatMap(l => l.history).sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 5);
    const formatDateTime = (date: Date) => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(date);

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-text-primary">Welcome back, {currentUser.name.split(' ')[0]}!</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard title="My Active Leads" value={activeLeads.toString()} onClick={() => setCurrentPage('leads')} />
                <KpiCard title="My Conversion (Month)" value={`${conversionRate}%`} onClick={() => setCurrentPage('performance')} />
                <KpiCard title="Won this Month" value={projectsWon.toString()} onClick={() => setCurrentPage('leads')}/>
                <KpiCard title="My Revenue (Month)" value={formatCurrency(totalRevenue)} onClick={() => setCurrentPage('performance')} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Card className="h-full">
                        <h3 className="text-lg font-bold">Today's Follow-ups</h3>
                        <div className="mt-4 flow-root">
                            {todaysFollowUps.length > 0 ? (
                                <ul role="list" className="-my-4 divide-y divide-border">
                                {todaysFollowUps.map((lead) => (
                                    <li key={lead.id} className="flex items-center py-4 space-x-3 cursor-pointer hover:bg-subtle-background px-2 -mx-2 rounded-md" onClick={() => setCurrentPage('leads')}>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-medium text-text-primary truncate">{lead.clientName}</p>
                                            <p className="text-sm text-text-secondary truncate">{lead.projectName}</p>
                                        </div>
                                        <div className="flex-shrink-0">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${lead.status === LeadPipelineStatus.NEW_NOT_CONTACTED ? 'bg-error-subtle-background text-error-subtle-text' : 'bg-accent-subtle-background text-accent-subtle-text'}`}>
                                                {lead.status === LeadPipelineStatus.NEW_NOT_CONTACTED ? 'First Contact' : 'Follow Up'}
                                            </span>
                                        </div>
                                        <ChevronRightIcon className="w-5 h-5 text-text-secondary"/>
                                    </li>
                                ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-text-secondary mt-2">No pressing follow-ups. Great job!</p>
                            )}
                        </div>
                    </Card>
                </div>
                <div className="lg:col-span-1">
                    <Card>
                        <h3 className="text-lg font-bold">Recent Activity</h3>
                         <ul role="list" className="mt-4 space-y-4">
                          {recentActivities.map((activity, idx) => (
                            <li key={idx} className="relative flex gap-x-4">
                               <div className="absolute left-0 top-0 flex w-6 justify-center -bottom-4">
                                <div className="w-px bg-border"></div>
                              </div>
                              <div className="relative flex h-6 w-6 flex-none items-center justify-center bg-surface">
                                <div className="h-1.5 w-1.5 rounded-full bg-border ring-1 ring-text-secondary"></div>
                              </div>
                              <p className="flex-auto py-0.5 text-xs leading-5 text-text-secondary">
                                <span className="font-medium text-text-primary">{activity.action}</span> for {myLeads.find(l => l.history.includes(activity))?.clientName}
                              </p>
                              <time dateTime={activity.timestamp.toISOString()} className="flex-none py-0.5 text-xs leading-5 text-text-secondary">{formatDateTime(activity.timestamp)}</time>
                            </li>
                          ))}
                        </ul>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default SalesOverviewPage;
