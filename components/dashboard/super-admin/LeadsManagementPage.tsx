import React from 'react';
import Card from '../../shared/Card';
import { LEADS } from '../../../constants';
import { LeadPipelineStatus } from '../../../types';
import { BanknotesIcon, ChartBarIcon, PhoneIcon } from '../../icons/IconComponents';

const LeadsManagementPage: React.FC = () => {
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

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-text-primary">Leads & Client Management</h2>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-primary-subtle-background text-primary"><PhoneIcon /></div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-text-secondary">Total Leads</p>
                            <p className="text-2xl font-bold text-text-primary">{totalLeads}</p>
                        </div>
                    </div>
                </Card>
                 <Card>
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-secondary-subtle-background text-secondary"><ChartBarIcon /></div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-text-secondary">Conversion Rate</p>
                            <p className="text-2xl font-bold text-text-primary">{conversionRate.toFixed(1)}%</p>
                        </div>
                    </div>
                </Card>
                 <Card>
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-accent-subtle-background text-accent"><BanknotesIcon /></div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-text-secondary">Pipeline Value</p>
                            <p className="text-2xl font-bold text-text-primary">${(totalValue / 1_000_000).toFixed(2)}M</p>
                        </div>
                    </div>
                </Card>
            </div>
            
            <Card>
                <h3 className="text-lg font-bold">Sales Funnel</h3>
                <div className="mt-6 flex flex-col items-center space-y-1">
                    {funnelStages.map((stage, index) => {
                        const count = pipelineCounts[stage.status] || 0;
                        const widthPercentage = totalLeads > 0 ? (count / totalLeads) * 100 + 10: 10;
                        const funnelWidth = Math.max(20, 100 - index * 10);
                        return (
                            <div key={stage.status} className="flex flex-col items-center">
                                <div className="flex items-center space-x-4">
                                    <div className="w-48 text-right">
                                        <span className="text-sm font-medium">{stage.status}</span>
                                    </div>
                                    <div className={`${stage.color} h-8 rounded-sm`} style={{ width: `${funnelWidth}%` }}></div>
                                    <div className="w-16">
                                        <span className="font-bold">{count}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Card>

        </div>
    );
};

export default LeadsManagementPage;
