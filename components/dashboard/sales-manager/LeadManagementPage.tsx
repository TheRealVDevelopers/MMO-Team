
import React, { useState, useMemo } from 'react';
import Card from '../../shared/Card';
import { LEADS, USERS } from '../../../constants';
import { Lead, LeadPipelineStatus, UserRole } from '../../../types';
import Modal from '../../shared/Modal';
import { FunnelIcon } from '../../icons/IconComponents';
import StatusPill from '../../shared/StatusPill';
import LeadHistoryView from '../../shared/LeadHistoryView';

const salesTeam = USERS.filter(u => u.role === UserRole.SALES_TEAM_MEMBER);
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

const LeadManagementPage: React.FC = () => {
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [filter, setFilter] = useState<{ status: LeadPipelineStatus | 'all', rep: string | 'all' }>({ status: 'all', rep: 'all' });

    const filteredLeads = useMemo(() => {
        return LEADS.filter(lead => 
            (filter.status === 'all' || lead.status === filter.status) &&
            (filter.rep === 'all' || lead.assignedTo === filter.rep)
        );
    }, [filter]);

    return (
        <>
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-text-primary">Lead Management</h2>
                <Card>
                    <div className="flex items-center space-x-4 mb-4 p-2 bg-subtle-background rounded-md border border-border">
                        <FunnelIcon className="text-text-secondary" />
                        <select value={filter.status} onChange={e => setFilter(f => ({...f, status: e.target.value as any}))} className="bg-surface border-border rounded-md py-1 px-2 text-sm focus:ring-primary focus:border-primary">
                            <option value="all">All Statuses</option>
                            {Object.values(LeadPipelineStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <select value={filter.rep} onChange={e => setFilter(f => ({...f, rep: e.target.value}))} className="bg-surface border-border rounded-md py-1 px-2 text-sm focus:ring-primary focus:border-primary">
                            <option value="all">All Sales Reps</option>
                            {salesTeam.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}
                        </select>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-border">
                            <thead className="bg-subtle-background">
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
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-text-secondary">{formatDateTime(lead.history[lead.history.length - 1].timestamp)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
            <Modal isOpen={!!selectedLead} onClose={() => setSelectedLead(null)} title={`Lead History: ${selectedLead?.clientName}`}>
                {selectedLead && <LeadHistoryView lead={selectedLead} />}
            </Modal>
        </>
    );
};

export default LeadManagementPage;