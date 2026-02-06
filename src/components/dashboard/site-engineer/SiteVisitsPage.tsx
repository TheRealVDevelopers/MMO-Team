
import React, { useState, useMemo } from 'react';
import Card from '../../shared/Card';
import { SITE_VISITS, formatDateTime } from '../../../constants';
import { SiteVisit, SiteVisitStatus } from '../../../types';
import StatusPill from '../../shared/StatusPill';
import { ArrowLeftIcon } from '../../icons/IconComponents';

const VisitStatusPill: React.FC<{ status: SiteVisitStatus }> = ({ status }) => {
    const color = {
        [SiteVisitStatus.SCHEDULED]: 'blue',
        [SiteVisitStatus.COMPLETED]: 'amber',
        [SiteVisitStatus.REPORT_SUBMITTED]: 'green',
    }[status] as 'blue' | 'amber' | 'green';
    return <StatusPill color={color}>{status}</StatusPill>;
};

const SiteVisitsPage: React.FC<{ onVisitSelect: (visit: SiteVisit) => void; setCurrentPage: (page: string) => void; }> = ({ onVisitSelect, setCurrentPage }) => {
    const [statusFilter, setStatusFilter] = useState<SiteVisitStatus | 'all'>('all');
    
    const filteredVisits = useMemo(() => {
        return SITE_VISITS.filter(visit => statusFilter === 'all' || visit.status === statusFilter);
    }, [statusFilter]);
    
    return (
        <div className="space-y-6 p-4 sm:p-6 lg:p-8">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => setCurrentPage('overview')}
                    className="flex items-center space-x-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
                >
                    <ArrowLeftIcon className="w-5 h-5" />
                    <span>Back</span>
                </button>
                <h2 className="text-2xl font-bold text-text-primary">All Site Visits</h2>
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
                                <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Date & Time</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-surface divide-y divide-border">
                            {filteredVisits.map(visit => (
                                <tr key={visit.id} onClick={() => onVisitSelect(visit)} className="cursor-pointer hover:bg-subtle-background">
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <p className="text-sm font-bold text-text-primary">{visit.projectName}</p>
                                        <p className="text-xs text-text-secondary">{visit.clientName}</p>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-text-secondary">{formatDateTime(visit.date)}</td>
                                    <td className="px-4 py-3"><VisitStatusPill status={visit.status} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default SiteVisitsPage;