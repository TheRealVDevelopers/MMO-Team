import React from 'react';
import Card from '../../shared/Card';
import { USERS, formatDate, formatCurrencyINR } from '../../../constants';
import { QuotationRequest, QuotationRequestStatus } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { ArrowLeftIcon } from '../../icons/IconComponents';
import StatusPill from '../../shared/StatusPill';

const QuotationStatusPill: React.FC<{ status: QuotationRequestStatus }> = ({ status }) => {
    const color = {
        [QuotationRequestStatus.REQUESTED]: 'blue',
        [QuotationRequestStatus.IN_PROGRESS]: 'amber',
        [QuotationRequestStatus.COMPLETED]: 'green',
    }[status] as 'blue' | 'amber' | 'green';
    return <StatusPill color={color}>{status}</StatusPill>;
};

const QuotationTasksPage: React.FC<{ setCurrentPage: (page: string) => void, quotationRequests: QuotationRequest[] }> = ({ setCurrentPage, quotationRequests }) => {
    const { currentUser } = useAuth();
    const myRequests = quotationRequests.filter(v => v.requesterId === currentUser?.id);

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
                <h2 className="text-2xl font-bold text-text-primary">My Quotation Task Assignments</h2>
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
                                <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Quoted Amount</th>
                            </tr>
                        </thead>
                        <tbody className="bg-surface divide-y divide-border">
                            {myRequests.map(req => (
                                <tr key={req.id} className="hover:bg-subtle-background">
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <p className="text-sm font-medium text-text-primary">{req.projectName}</p>
                                        <p className="text-xs text-text-secondary">{req.clientName}</p>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-text-secondary">{USERS.find(u => u.id === req.assigneeId)?.name}</td>
                                    <td className="px-4 py-3 text-sm text-text-secondary">{formatDate(req.requestDate)}</td>
                                    <td className="px-4 py-3"><QuotationStatusPill status={req.status} /></td>
                                    <td className="px-4 py-3 text-sm font-medium text-text-primary">{req.quotedAmount ? formatCurrencyINR(req.quotedAmount) : 'N/A'}</td>
                                </tr>
                            ))}
                             {myRequests.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="text-center py-8 text-text-secondary">No quotation tasks assigned yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default QuotationTasksPage;
