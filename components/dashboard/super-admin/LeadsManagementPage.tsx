
import React from 'react';
import Card from '../../shared/Card';
import { LEADS, USERS, formatLargeNumberINR, formatDateTime } from '../../../constants';
import { LeadPipelineStatus } from '../../../types';
import { BanknotesIcon, ChartBarIcon, PhoneIcon, FunnelIcon, ArrowLeftIcon } from '../../icons/IconComponents';
import StatusPill from '../../shared/StatusPill';

const KpiCard: React.FC<{ title: string; value: string; icon: React.ReactNode }> = ({ title, value, icon }) => (
     <Card>
        <div className="flex items-center">
            <div className="p-3 rounded-full bg-primary-subtle-background text-primary">{icon}</div>
            <div className="ml-4">
                <p className="text-sm font-medium text-text-secondary">{title}</p>
                <p className="text-2xl font-bold text-text-primary">{value}</p>
            </div>
        </div>
    </Card>
);

const LeadStatusPill: React.FC<{ status: LeadPipelineStatus }> = ({ status }) => {
    const color = {
        [LeadPipelineStatus.NEW_NOT_CONTACTED]: 'red',
        [LeadPipelineStatus.CONTACTED_CALL_DONE]: 'amber',
        [LeadPipelineStatus.SITE_VISIT_SCHEDULED]: 'purple',
        [LeadPipelineStatus.WAITING_FOR_DRAWING]: 'slate',
        [LeadPipelineStatus.QUOTATION_SENT]: 'blue',
        [LeadPipelineStatus.NEGOTIATION]: 'amber',
        [LeadPipelineStatus.WON]: 'green',
        [LeadPipelineStatus.LOST]: 'slate',
    }[status] as 'red' | 'amber' | 'purple' | 'slate' | 'blue' | 'green';
    return <StatusPill color={color}>{status}</StatusPill>;
};


const LeadsManagementPage: React.FC<{ setCurrentPage: (page: string) => void }> = ({ setCurrentPage }) => {
    const pipelineCounts = LEADS.reduce((acc, lead) => {
        acc[lead.status] = (acc[lead.status] || 0) + 1;
        return acc;
    }, {} as Record<LeadPipelineStatus, number>);
    
    const totalLeads = LEADS.length;
    const wonLeads = pipelineCounts[LeadPipelineStatus.WON] || 0;
    const conversionRate = totalLeads > 0 ? (wonLeads / totalLeads) * 100 : 0;
    const totalValue = LEADS.reduce((sum, l) => sum + l.value, 0);

    const funnelStages = [
        { status: LeadPipelineStatus.NEW_NOT_CONTACTED, color: 'bg-error' },
        { status: LeadPipelineStatus.CONTACTED_CALL_DONE, color: 'bg-accent' },
        { status: LeadPipelineStatus.SITE_VISIT_SCHEDULED, color: 'bg-purple' },
        { status: LeadPipelineStatus.QUOTATION_SENT, color: 'bg-primary' },
        { status: LeadPipelineStatus.NEGOTIATION, color: 'bg-accent' },
        { status: LeadPipelineStatus.WON, color: 'bg-secondary' },
    ];
    
    const maxLeadsInStage = Math.max(...funnelStages.map(stage => pipelineCounts[stage.status] || 0));
    
    const recentLeads = [...LEADS].sort((a, b) => b.inquiryDate.getTime() - a.inquiryDate.getTime()).slice(0, 5);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => setCurrentPage('overview')}
                    className="flex items-center space-x-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
                >
                    <ArrowLeftIcon className="w-5 h-5" />
                    <span>Back</span>
                </button>
                <h2 className="text-2xl font-bold text-text-primary">Leads & Client Management</h2>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3">
                    <Card>
                        <h3 className="text-lg font-bold flex items-center mb-6">
                            <FunnelIcon className="w-5 h-5 mr-2" />
                            Sales Funnel
                        </h3>
                        <div className="space-y-3">
                            {funnelStages.map((stage) => {
                                const count = pipelineCounts[stage.status] || 0;
                                const widthPercentage = maxLeadsInStage > 0 ? (count / maxLeadsInStage) * 100 : 0;
                                
                                return (
                                    <div key={stage.status} className="flex items-center text-sm">
                                        <div className="w-48 text-right text-text-secondary font-medium truncate pr-4">{stage.status}</div>
                                        <div className="flex-1 flex items-center">
                                            <div className="w-full bg-subtle-background rounded-full h-6">
                                                <div 
                                                    className={`${stage.color} h-6 rounded-full text-white flex items-center justify-end pr-2 transition-all duration-500`} 
                                                    style={{ width: `${widthPercentage}%` }}
                                                >
                                                {widthPercentage > 10 && <span className="font-bold text-xs">{count}</span>}
                                                </div>
                                            </div>
                                            {widthPercentage <= 10 && count > 0 && <span className="font-bold text-xs text-text-primary ml-2">{count}</span>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                </div>
                <div className="lg:col-span-2 space-y-6">
                    <KpiCard title="Total Leads" value={totalLeads.toString()} icon={<PhoneIcon />} />
                    <KpiCard title="Conversion Rate" value={`${conversionRate.toFixed(1)}%`} icon={<ChartBarIcon />} />
                    <KpiCard title="Pipeline Value" value={formatLargeNumberINR(totalValue)} icon={<BanknotesIcon />} />
                </div>
            </div>
            
            <Card>
                <h3 className="text-lg font-bold mb-4">Recent Leads</h3>
                 <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                        <thead className="bg-subtle-background">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Client / Project</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Assigned To</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Status</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Inquiry Date</th>
                            </tr>
                        </thead>
                        <tbody className="bg-surface divide-y divide-border">
                            {recentLeads.map(lead => (
                                <tr key={lead.id} className="cursor-pointer hover:bg-subtle-background">
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <p className="text-sm font-bold text-text-primary">{lead.clientName}</p>
                                        <p className="text-xs text-text-secondary">{lead.projectName}</p>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-text-secondary">{USERS.find(u => u.id === lead.assignedTo)?.name}</td>
                                    <td className="px-4 py-3 whitespace-nowrap"><LeadStatusPill status={lead.status} /></td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-text-secondary">{formatDateTime(lead.inquiryDate)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

        </div>
    );
};

export default LeadsManagementPage;