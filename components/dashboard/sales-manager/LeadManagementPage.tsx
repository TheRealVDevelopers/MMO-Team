import React, { useState, useMemo } from 'react';
import Card from '../../shared/Card';
import { USERS, formatDateTime, formatLargeNumberINR } from '../../../constants';
import { Lead, LeadPipelineStatus, UserRole } from '../../../types';
import { FunnelIcon, BanknotesIcon, ChartBarIcon, PhoneIcon, MagnifyingGlassIcon } from '../../icons/IconComponents';
import StatusPill from '../../shared/StatusPill';
import LeadDetailModal from '../../shared/LeadDetailModal';

const salesTeam = USERS.filter(u => u.role === UserRole.SALES_TEAM_MEMBER);

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

const PriorityPill: React.FC<{ priority: 'High' | 'Medium' | 'Low' }> = ({ priority }) => {
    const color = {
        High: 'red',
        Medium: 'amber',
        Low: 'slate',
    }[priority] as 'red' | 'amber' | 'slate';
    return <StatusPill color={color}>{priority}</StatusPill>;
};

interface LeadManagementPageProps {
    leads: Lead[];
    setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
}

const LeadManagementPage: React.FC<LeadManagementPageProps> = ({ leads, setLeads }) => {
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [filter, setFilter] = useState<{ status: LeadPipelineStatus | 'all', rep: string | 'all' }>({ status: 'all', rep: 'all' });
    const [searchTerm, setSearchTerm] = useState('');

    const filteredLeads = useMemo(() => {
        const lowercasedSearchTerm = searchTerm.toLowerCase();
        return leads.filter(lead => 
            (filter.status === 'all' || lead.status === filter.status) &&
            (filter.rep === 'all' || lead.assignedTo === filter.rep) &&
            (lead.clientName.toLowerCase().includes(lowercasedSearchTerm) ||
             lead.projectName.toLowerCase().includes(lowercasedSearchTerm))
        );
    }, [filter, leads, searchTerm]);

    const handleLeadUpdate = (updatedLead: Lead) => {
        setLeads(currentLeads => currentLeads.map(l => l.id === updatedLead.id ? updatedLead : l));
        setSelectedLead(updatedLead);
    };

    const { pipelineCounts, totalLeads, conversionRate, pipelineValue } = useMemo(() => {
        const counts = leads.reduce((acc, lead) => {
            acc[lead.status] = (acc[lead.status] || 0) + 1;
            return acc;
        }, {} as Record<LeadPipelineStatus, number>);
        
        const total = leads.length;
        const won = counts[LeadPipelineStatus.WON] || 0;
        const conversion = total > 0 ? (won / total) * 100 : 0;
        const value = leads.reduce((sum, l) => ![LeadPipelineStatus.WON, LeadPipelineStatus.LOST].includes(l.status) ? sum + l.value : sum, 0);
        
        return {
            pipelineCounts: counts,
            totalLeads: total,
            conversionRate: conversion,
            pipelineValue: value,
        };
    }, [leads]);

    const funnelStages = [
        { status: LeadPipelineStatus.NEW_NOT_CONTACTED, color: 'bg-error' },
        { status: LeadPipelineStatus.CONTACTED_CALL_DONE, color: 'bg-accent' },
        { status: LeadPipelineStatus.SITE_VISIT_SCHEDULED, color: 'bg-purple' },
        { status: LeadPipelineStatus.QUOTATION_SENT, color: 'bg-primary' },
        { status: LeadPipelineStatus.NEGOTIATION, color: 'bg-accent' },
        { status: LeadPipelineStatus.WON, color: 'bg-secondary' },
    ];
    
    const maxLeadsInStage = Math.max(...funnelStages.map(stage => pipelineCounts[stage.status] || 0), 1);

    return (
        <>
            <div className="space-y-6">
                
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <KpiCard title="Total Leads" value={totalLeads.toString()} icon={<FunnelIcon />} />
                    <KpiCard title="Conversion Rate" value={`${conversionRate.toFixed(1)}%`} icon={<ChartBarIcon />} />
                    <KpiCard title="Pipeline Value" value={formatLargeNumberINR(pipelineValue)} icon={<BanknotesIcon />} />
                    <KpiCard title="Won This Month" value={(leads.filter(l => l.status === LeadPipelineStatus.WON && l.inquiryDate > new Date(new Date().setDate(1)))).length.toString()} icon={<PhoneIcon />} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    <div className="lg:col-span-2">
                        <Card>
                            <h3 className="text-lg font-bold flex items-center mb-6">Sales Funnel</h3>
                            <div className="space-y-3">
                                {funnelStages.map((stage) => {
                                    const count = pipelineCounts[stage.status] || 0;
                                    const widthPercentage = maxLeadsInStage > 0 ? (count / maxLeadsInStage) * 100 : 0;
                                    
                                    return (
                                        <div key={stage.status} className="flex items-center text-sm">
                                            <div className="w-40 text-right text-text-secondary font-medium truncate pr-4">{stage.status}</div>
                                            <div className="flex-1 flex items-center">
                                                <div className="bg-subtle-background rounded-full h-6 w-full">
                                                  <div 
                                                      className={`${stage.color} h-6 rounded-full text-white flex items-center justify-end pr-2 transition-all duration-500`} 
                                                      style={{ width: `${widthPercentage}%` }}
                                                  >
                                                      {widthPercentage > 15 && <span className="font-bold text-xs">{count}</span>}
                                                  </div>
                                                </div>
                                                {(widthPercentage <= 15 && count > 0) && <span className="font-bold text-xs text-text-primary ml-2">{count}</span>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>
                    </div>

                    <div className="lg:col-span-3">
                        <Card>
                            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2 mb-4">
                                <div className="relative flex-grow w-full">
                                    <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"/>
                                    <input
                                        type="text"
                                        placeholder="Search by client or project..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-8 pr-4 py-1.5 border border-border rounded-md bg-surface text-sm focus:ring-primary focus:border-primary"
                                    />
                                </div>
                                <select value={filter.status} onChange={e => setFilter(f => ({...f, status: e.target.value as any}))} className="w-full sm:w-auto bg-surface border-border rounded-md py-1.5 px-2 text-sm focus:ring-primary focus:border-primary">
                                    <option value="all">All Statuses</option>
                                    {Object.values(LeadPipelineStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                                <select value={filter.rep} onChange={e => setFilter(f => ({...f, rep: e.target.value}))} className="w-full sm:w-auto bg-surface border-border rounded-md py-1.5 px-2 text-sm focus:ring-primary focus:border-primary">
                                    <option value="all">All Sales Reps</option>
                                    {salesTeam.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}
                                </select>
                            </div>

                            <div className="overflow-auto max-h-[400px]">
                                <table className="min-w-full divide-y divide-border">
                                    <thead className="bg-subtle-background sticky top-0">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Client / Project</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Assigned To</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Priority</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Status</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Last Activity</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-surface divide-y divide-border">
                                        {filteredLeads.map(lead => (
                                            <tr key={lead.id} onClick={() => setSelectedLead(lead)} className="cursor-pointer hover:bg-subtle-background">
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <p className="text-sm font-bold text-text-primary">{lead.clientName}</p>
                                                    <p className="text-xs text-text-secondary">{lead.projectName}</p>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-text-secondary">{USERS.find(u => u.id === lead.assignedTo)?.name}</td>
                                                <td className="px-4 py-3 whitespace-nowrap"><PriorityPill priority={lead.priority} /></td>
                                                <td className="px-4 py-3 whitespace-nowrap"><LeadStatusPill status={lead.status} /></td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-text-secondary">{lead.history.length > 0 ? formatDateTime(lead.history[lead.history.length - 1].timestamp) : 'N/A'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
            {selectedLead && (
                <LeadDetailModal
                    lead={selectedLead}
                    isOpen={!!selectedLead}
                    onClose={() => setSelectedLead(null)}
                    onUpdate={handleLeadUpdate}
                />
            )}
        </>
    );
};

export default LeadManagementPage;