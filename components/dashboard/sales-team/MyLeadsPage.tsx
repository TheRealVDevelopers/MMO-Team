import React, { useState, useMemo } from 'react';
import Card from '../../shared/Card';
import { LEADS } from '../../../constants';
import { Lead, LeadPipelineStatus } from '../../../types';
import StatusPill from '../../shared/StatusPill';
import { useAuth } from '../../../context/AuthContext';
import LeadDetailModal from './LeadDetailModal';

const formatDateTime = (date: Date) => new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(date);

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

const MyLeadsPage: React.FC = () => {
    const { currentUser } = useAuth();
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [statusFilter, setStatusFilter] = useState<LeadPipelineStatus | 'all'>('all');

    const myLeads = useMemo(() => {
        if (!currentUser) return [];
        return LEADS.filter(lead =>
            lead.assignedTo === currentUser.id &&
            (statusFilter === 'all' || lead.status === statusFilter)
        );
    }, [currentUser, statusFilter]);

    // This state is just to force re-renders when mock data is "updated"
    const [leadsData, setLeadsData] = useState(LEADS);
    const handleLeadUpdate = (updatedLead: Lead) => {
        const newLeads = leadsData.map(l => l.id === updatedLead.id ? updatedLead : l);
        setLeadsData(newLeads); // In a real app, this would re-fetch or update a global state
        setSelectedLead(updatedLead);
    };

    if (!currentUser) return null;

    return (
        <>
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-text-primary">My Leads</h2>
                <Card>
                    <div className="flex items-center space-x-4 mb-4">
                        <label htmlFor="status-filter" className="text-sm font-medium text-text-secondary">Filter by status:</label>
                        <select
                            id="status-filter"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            className="bg-surface border-border rounded-md py-1 px-2 text-sm focus:ring-primary focus:border-primary"
                        >
                            <option value="all">All Statuses</option>
                            {Object.values(LeadPipelineStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-border">
                            <thead className="bg-subtle-background">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Client / Project</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Priority</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Status</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Last Activity</th>
                                </tr>
                            </thead>
                            <tbody className="bg-surface divide-y divide-border">
                                {myLeads.map(lead => (
                                    <tr key={lead.id} onClick={() => setSelectedLead(lead)} className="cursor-pointer hover:bg-subtle-background">
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <p className="text-sm font-bold text-text-primary">{lead.clientName}</p>
                                            <p className="text-xs text-text-secondary">{lead.projectName}</p>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap"><PriorityPill priority={lead.priority} /></td>
                                        <td className="px-4 py-3 whitespace-nowrap"><LeadStatusPill status={lead.status} /></td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-text-secondary">{formatDateTime(lead.history[lead.history.length - 1].timestamp)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
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

export default MyLeadsPage;
