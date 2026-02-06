

import React, { useState, useMemo } from 'react';
import Card from '../../shared/Card';
import { USERS, LEADS, formatDateTime } from '../../../constants';
import { SiteVisit, SiteVisitStatus, UserRole, Lead } from '../../../types';
import StatusPill from '../../shared/StatusPill';
import { useAuth } from '../../../context/AuthContext';
import { PlusIcon, ArrowLeftIcon } from '../../icons/IconComponents';
import AssignVisitModal from './AssignVisitModal';

const VisitStatusPill: React.FC<{ status: SiteVisitStatus }> = ({ status }) => {
    const color = {
        [SiteVisitStatus.SCHEDULED]: 'blue',
        [SiteVisitStatus.COMPLETED]: 'amber',
        [SiteVisitStatus.REPORT_SUBMITTED]: 'green',
    }[status] as 'blue' | 'amber' | 'green';
    return <StatusPill color={color}>{status}</StatusPill>;
};

const SiteVisitsPage: React.FC<{ setCurrentPage: (page: string) => void; siteVisits: SiteVisit[]; onScheduleVisit: (visitData: Omit<SiteVisit, 'id' | 'status'>) => void; }> = ({ setCurrentPage, siteVisits, onScheduleVisit }) => {
    const { currentUser } = useAuth();
    const [isModalOpen, setModalOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState<SiteVisitStatus | 'all'>('all');

    const myVisits = useMemo(() => {
        if (!currentUser) return [];
        return siteVisits.filter(visit => 
            visit.requesterId === currentUser.id && 
            (statusFilter === 'all' || visit.status === statusFilter)
        );
    }, [currentUser, statusFilter, siteVisits]);

    const myLeads = useMemo(() => {
        if (!currentUser) return [];
        return LEADS.filter(lead => lead.assignedTo === currentUser.id);
    }, [currentUser]);

    if (!currentUser) return null;

    return (
        <>
        <div className="space-y-6">
            <div className="sm:flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setCurrentPage('overview')}
                        className="flex items-center space-x-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
                    >
                        <ArrowLeftIcon className="w-5 h-5" />
                        <span>Back</span>
                    </button>
                    <h2 className="text-2xl font-bold text-text-primary">My Site Visit Requests</h2>
                </div>
                 <button onClick={() => setModalOpen(true)} className="flex items-center space-x-2 bg-primary text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-secondary mt-2 sm:mt-0">
                    <PlusIcon className="w-4 h-4" />
                    <span>Assign New Visit</span>
                </button>
            </div>
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
                        {Object.values(SiteVisitStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                        <thead className="bg-subtle-background">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Project / Client</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Assigned To</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Date & Time</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Status</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Notes</th>
                            </tr>
                        </thead>
                        <tbody className="bg-surface divide-y divide-border">
                            {myVisits.map(visit => (
                                <tr key={visit.id} className="cursor-pointer hover:bg-subtle-background">
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <p className="text-sm font-bold text-text-primary">{visit.projectName}</p>
                                        <p className="text-xs text-text-secondary">{visit.clientName}</p>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-text-secondary">{USERS.find(u => u.id === visit.assigneeId)?.name || 'N/A'}</td>
                                    <td className="px-4 py-3 text-sm text-text-secondary">{formatDateTime(visit.date)}</td>
                                    <td className="px-4 py-3"><VisitStatusPill status={visit.status} /></td>
                                    <td className="px-4 py-3 text-sm text-text-secondary max-w-xs truncate">{visit.notes?.keyPoints}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
        <AssignVisitModal 
            isOpen={isModalOpen} 
            onClose={() => setModalOpen(false)} 
            leads={myLeads} 
            requesterId={currentUser.id}
            onSchedule={onScheduleVisit}
        />
        </>
    );
};

export default SiteVisitsPage;