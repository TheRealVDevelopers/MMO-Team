import React, { useState, useMemo } from 'react';
import Card from '../../shared/Card';
import { ExpenseClaim, ExpenseClaimStatus } from '../../../types';
import { formatCurrencyINR, formatDate } from '../../../constants';
import StatusPill from '../../shared/StatusPill';
import { ArrowLeftIcon } from '../../icons/IconComponents';

const ExpenseStatusPill: React.FC<{ status: ExpenseClaimStatus }> = ({ status }) => {
    const color = {
        [ExpenseClaimStatus.SUBMITTED]: 'blue',
        [ExpenseClaimStatus.UNDER_REVIEW]: 'amber',
        [ExpenseClaimStatus.APPROVED]: 'green',
        [ExpenseClaimStatus.REJECTED]: 'red',
        [ExpenseClaimStatus.PAID]: 'purple',
    }[status] as 'blue' | 'amber' | 'green' | 'red' | 'purple';
    return <StatusPill color={color}>{status}</StatusPill>;
};

const ExpenseClaimsPage: React.FC<{ claims: ExpenseClaim[]; setCurrentPage: (page: string) => void; }> = ({ claims, setCurrentPage }) => {
    const [statusFilter, setStatusFilter] = useState<ExpenseClaimStatus | 'all'>('all');

    const filteredClaims = useMemo(() => {
        return claims.filter(claim => statusFilter === 'all' || claim.status === statusFilter);
    }, [statusFilter, claims]);
    
    return (
        <div className="space-y-6 p-4 sm:p-6 lg:p-8">
            <div className="flex items-center gap-4">
                <button onClick={() => setCurrentPage('overview')} className="flex items-center space-x-2 text-sm font-medium text-text-secondary hover:text-text-primary">
                    <ArrowLeftIcon className="w-5 h-5" />
                    <span>Back</span>
                </button>
                <h2 className="text-2xl font-bold text-text-primary">My Expense Claims</h2>
            </div>
            <Card>
                <div className="flex flex-wrap items-center gap-2 mb-4 p-2 bg-subtle-background rounded-md border border-border">
                    <span className="text-sm font-medium mr-2">Filter by status:</span>
                    {['all', ...Object.values(ExpenseClaimStatus)].map(status => (
                        <button 
                            key={status}
                            onClick={() => setStatusFilter(status as any)}
                            className={`px-3 py-1 text-xs font-medium rounded-full ${statusFilter === status ? 'bg-primary text-white' : 'bg-surface text-text-secondary hover:bg-border'}`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                        <thead className="bg-subtle-background">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Submission Date</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Visit ID</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Amount</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-surface divide-y divide-border">
                            {filteredClaims.map(claim => (
                                <tr key={claim.id} className="hover:bg-subtle-background">
                                    <td className="px-4 py-3 text-sm text-text-secondary">{formatDate(claim.submissionDate)}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-primary">{claim.visitId}</td>
                                    <td className="px-4 py-3 text-sm font-medium text-text-primary">{formatCurrencyINR(claim.totalAmount)}</td>
                                    <td className="px-4 py-3"><ExpenseStatusPill status={claim.status} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default ExpenseClaimsPage;