import React from 'react';
import Card from '../../shared/Card';
import { USERS, formatDate } from '../../../constants';
import { AccountsRequest, AccountsRequestStatus } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { ArrowLeftIcon } from '../../icons/IconComponents';
import StatusPill from '../../shared/StatusPill';

const AccountsStatusPill: React.FC<{ status: AccountsRequestStatus }> = ({ status }) => {
    const color = {
        [AccountsRequestStatus.REQUESTED]: 'blue',
        [AccountsRequestStatus.IN_PROGRESS]: 'amber',
        [AccountsRequestStatus.COMPLETED]: 'green',
    }[status] as 'blue' | 'amber' | 'green';
    return <StatusPill color={color}>{status}</StatusPill>;
};

const AccountsTasksPage: React.FC<{ setCurrentPage: (page: string) => void, accountsRequests: AccountsRequest[] }> = ({ setCurrentPage, accountsRequests }) => {
    const { currentUser } = useAuth();
    const myRequests = accountsRequests.filter(v => v.requesterId === currentUser?.id);

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
                <h2 className="text-2xl font-bold text-text-primary">My Accounts Task Assignments</h2>
            </div>
            <Card>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                        <thead className="bg-subtle-background">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Project</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Task</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Assigned To</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Date</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-surface divide-y divide-border">
                            {myRequests.map(req => (
                                <tr key={req.id} className="hover:bg-subtle-background">
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <p className="text-sm font-medium text-text-primary">{req.projectName}</p>
                                    </td>
                                     <td className="px-4 py-3 text-sm text-text-secondary">{req.task}</td>
                                    <td className="px-4 py-3 text-sm text-text-secondary">{USERS.find(u => u.id === req.assigneeId)?.name}</td>
                                    <td className="px-4 py-3 text-sm text-text-secondary">{formatDate(req.requestDate)}</td>
                                    <td className="px-4 py-3"><AccountsStatusPill status={req.status} /></td>
                                </tr>
                            ))}
                             {myRequests.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="text-center py-8 text-text-secondary">No accounts tasks assigned yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default AccountsTasksPage;
