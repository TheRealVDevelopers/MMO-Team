
import React, { useState, useMemo } from 'react';
import Card from '../../shared/Card';
import { INVOICES, formatCurrencyINR, formatDate } from '../../../constants';
import { Invoice, PaymentStatus } from '../../../types';
import StatusPill from '../../shared/StatusPill';
import { PlusIcon, ArrowLeftIcon } from '../../icons/IconComponents';

const PaymentStatusPill: React.FC<{ status: PaymentStatus }> = ({ status }) => {
    const color = {
        [PaymentStatus.PAID]: 'green',
        [PaymentStatus.PENDING]: 'amber',
        [PaymentStatus.OVERDUE]: 'red',
        [PaymentStatus.DRAFT]: 'slate',
        [PaymentStatus.SENT]: 'blue',
        [PaymentStatus.PARTIALLY_PAID]: 'purple',
    }[status] as 'green' | 'amber' | 'red' | 'slate' | 'blue' | 'purple';
    return <StatusPill color={color}>{status}</StatusPill>;
};

const InvoicesPage: React.FC<{ setCurrentPage: (page: string) => void }> = ({ setCurrentPage }) => {
    const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'all'>('all');

    const filteredInvoices = useMemo(() => {
        return INVOICES.filter(invoice => statusFilter === 'all' || invoice.status === statusFilter);
    }, [statusFilter]);

    return (
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
                    <h2 className="text-2xl font-bold text-text-primary">Invoice Management</h2>
                </div>
                <button className="flex items-center space-x-2 bg-primary text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 mt-2 sm:mt-0">
                    <PlusIcon className="w-4 h-4" />
                    <span>Create New Invoice</span>
                </button>
            </div>
            <Card>
                <div className="flex flex-wrap items-center gap-2 mb-4 p-2 bg-subtle-background rounded-md border border-border">
                    <span className="text-sm font-medium mr-2">Filter by status:</span>
                    {['all', ...Object.values(PaymentStatus)].map(status => (
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
                                <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Invoice ID</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Client / Project</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Amount</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Due Date</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-surface divide-y divide-border">
                            {filteredInvoices.map(invoice => (
                                <tr key={invoice.id} className="cursor-pointer hover:bg-subtle-background">
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-primary">{invoice.id}</td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <p className="text-sm font-bold text-text-primary">{invoice.clientName}</p>
                                        <p className="text-xs text-text-secondary">{invoice.projectName}</p>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <p className="text-sm font-medium text-text-primary">{formatCurrencyINR(invoice.amount)}</p>
                                        <p className="text-xs text-text-secondary">Paid: {formatCurrencyINR(invoice.paidAmount)}</p>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-text-secondary">{formatDate(invoice.dueDate)}</td>
                                    <td className="px-4 py-3"><PaymentStatusPill status={invoice.status} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default InvoicesPage;