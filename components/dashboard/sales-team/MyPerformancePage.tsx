import React from 'react';
import Card from '../../shared/Card';
import { LEADS } from '../../../constants';
import { LeadPipelineStatus } from '../../../types';
import { useAuth } from '../../../context/AuthContext';

const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value);

const MyPerformancePage: React.FC = () => {
    const { currentUser } = useAuth();

    if (!currentUser) return null;

    const myLeads = LEADS.filter(l => l.assignedTo === currentUser.id);

    const pipelineCounts = myLeads.reduce((acc, lead) => {
        acc[lead.status] = (acc[lead.status] || 0) + 1;
        return acc;
    }, {} as Record<LeadPipelineStatus, number>);
    
    const totalLeads = myLeads.length;
    const wonLeads = pipelineCounts[LeadPipelineStatus.WON] || 0;
    const conversionRate = totalLeads > 0 ? (wonLeads / totalLeads) * 100 : 0;
    const totalValue = myLeads.reduce((sum, l) => sum + l.value, 0);
    const wonValue = myLeads.filter(l => l.status === LeadPipelineStatus.WON).reduce((sum, l) => sum + l.value, 0);

    const funnelStages = [
        { status: LeadPipelineStatus.NEW_NOT_CONTACTED, label: 'New' },
        { status: LeadPipelineStatus.CONTACTED_CALL_DONE, label: 'Contacted' },
        { status: LeadPipelineStatus.SITE_VISIT_SCHEDULED, label: 'Site Visit' },
        { status: LeadPipelineStatus.QUOTATION_SENT, label: 'Quoted' },
        { status: LeadPipelineStatus.NEGOTIATION, label: 'Negotiating' },
        { status: LeadPipelineStatus.WON, label: 'Won' },
    ];
    
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-text-primary">My Performance</h2>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card><p className="text-sm text-text-secondary">Total Leads Assigned</p><p className="text-2xl font-bold">{totalLeads}</p></Card>
                <Card><p className="text-sm text-text-secondary">Overall Conversion</p><p className="text-2xl font-bold">{conversionRate.toFixed(1)}%</p></Card>
                <Card><p className="text-sm text-text-secondary">Total Value Generated</p><p className="text-2xl font-bold">{formatCurrency(wonValue)}</p></Card>
                <Card><p className="text-sm text-text-secondary">Avg. Deal Value</p><p className="text-2xl font-bold">{formatCurrency(wonLeads > 0 ? wonValue / wonLeads : 0)}</p></Card>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <h3 className="text-lg font-bold">My Sales Funnel</h3>
                     <div className="mt-6 flex justify-between items-end h-64 bg-subtle-background p-4 rounded-md">
                        {funnelStages.map(stage => {
                            const count = pipelineCounts[stage.status] || 0;
                            const percentage = totalLeads > 0 ? (count / totalLeads) * 100 : 0;
                            return (
                                <div key={stage.status} className="flex flex-col items-center w-1/6">
                                    <div className="text-lg font-bold">{count}</div>
                                    <div className="bg-primary rounded-t-md" style={{height: `${percentage}%`, width: '50%'}}></div>
                                    <div className="text-xs text-center mt-2 font-medium text-text-secondary">{stage.label}</div>
                                </div>
                            );
                        })}
                    </div>
                </Card>
                 <Card>
                    <h3 className="text-lg font-bold">Monthly Revenue Trend</h3>
                    <div className="mt-4 h-72 bg-subtle-background rounded-md flex items-center justify-center">
                        <p className="text-text-secondary">Chart Placeholder</p>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default MyPerformancePage;
