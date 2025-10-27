import React from 'react';
import Card from '../../shared/Card';
import { USERS, formatDate } from '../../../constants';
import { ProcurementRequest, ProcurementRequestStatus } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { ArrowLeftIcon } from '../../icons/IconComponents';
import StatusPill from '../../shared/StatusPill';

const ProcurementStatusPill: React.FC<{ status: ProcurementRequestStatus }> = ({ status }) => {
    const color = {
        [ProcurementRequestStatus.REQUESTED]: 'blue',
        [ProcurementRequestStatus.IN_PROGRESS]: 'amber',
        [ProcurementRequestStatus.COMPLETED]: 'green',
    }[status] as 'blue' | 'amber' | 'green';
    return <StatusPill color={color}>{status}</StatusPill>;
};

const ProcurementTasksPage: React.FC<{ setCurrentPage: (page: string) => void, procurementRequests: ProcurementRequest[] }> = ({ setCurrentPage, procurementRequests }) => {
    const { currentUser } = useAuth();
    const myRequests = procurementRequests.filter(v => v.requesterId === currentUser?.id);

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => setCurrentPage('leads')}
                    className="flex items-center space-x-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
                >
                    <ArrowLeftIcon className="w-5 h-5" />
                    <span>Back</span>
                </button>
                <h2 className="text-2xl font-bold text-text-primary">My Procurement Task Assignments</h2>
            </div>
            <Card>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                        <thead className="bg-subtle-background">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Project</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Assigned To</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Date</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Status</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Materials</th>
                            </tr>
                        </thead>
                        <tbody className="bg-surface divide-y divide-border">
                            {myRequests.map(req => (
                                <tr key={req.id} className="hover:bg-subtle-background">
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <p className="text-sm font-medium text-text-primary">{req.projectName}</p>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-text-secondary">{USERS.find(u => u.id === req.assigneeId)?.name}</td>
                                    <td className="px-4 py-3 text-sm text-text-secondary">{formatDate(req.requestDate)}</td>
                                    <td className="px-4 py-3"><ProcurementStatusPill status={req.status} /></td>
                                     <td className="px-4 py-3 text-sm text-text-secondary max-w-xs truncate">{req.materials}</td>
                                </tr>
                            ))}
                            {myRequests.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="text-center py-8 text-text-secondary">No procurement tasks assigned yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default ProcurementTasksPage;
