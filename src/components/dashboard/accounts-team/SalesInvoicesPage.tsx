import React, { useState, useMemo } from 'react';
import Card from '../../shared/Card';
import { formatCurrencyINR, formatDate } from '../../../constants';
import { Invoice, PaymentStatus, Project } from '../../../types';
import StatusPill from '../../shared/StatusPill';
import { PlusIcon, ArrowLeftIcon, ArrowUpRightIcon, TrashIcon } from '../../icons/IconComponents';
import InvoiceDetailModal from './InvoiceDetailModal';
import CreateInvoicePage from './CreateInvoicePage';
import { deleteInvoice } from '../../../hooks/useInvoices';

const PaymentStatusPill: React.FC<{ status: PaymentStatus }> = ({ status }) => {
    const color = {
        [PaymentStatus.PAID]: 'green',
        [PaymentStatus.PENDING]: 'amber',
        [PaymentStatus.OVERDUE]: 'red',
        [PaymentStatus.DRAFT]: 'slate',
        [PaymentStatus.SENT]: 'green',
        [PaymentStatus.PARTIALLY_PAID]: 'purple',
    }[status] as 'green' | 'amber' | 'red' | 'slate' | 'blue' | 'purple';
    return <StatusPill color={color}>{status}</StatusPill>;
};

interface SalesInvoicesPageProps {
    setCurrentPage: (page: string) => void;
    invoices: Invoice[];
    projects: Project[];
    onAddInvoice: (newInvoice: Omit<Invoice, 'id'>) => Promise<void> | void;
    onUpdateInvoice: (updatedInvoice: Invoice) => Promise<void> | void;
}

const SalesInvoicesPage: React.FC<SalesInvoicesPageProps> = ({ setCurrentPage, invoices, projects, onAddInvoice, onUpdateInvoice }) => {
    const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
    const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'all'>('all');
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

    const filteredInvoices = useMemo(() => {
        return invoices.filter(invoice => statusFilter === 'all' || invoice.status === statusFilter);
    }, [statusFilter, invoices]);

    const handleCreateInvoice = async (newInvoice: Omit<Invoice, 'id'>) => {
        await onAddInvoice(newInvoice);
        setView('list');
    }

    const handleUpdateInvoice = async (invoice: Invoice) => {
        await onUpdateInvoice(invoice);
        setEditingInvoice(null);
        setView('list');
    }

    const handleEditClick = (invoice: Invoice) => {
        setEditingInvoice(invoice);
        setView('edit');
    }

    const handleDeleteClick = async (e: React.MouseEvent, invoiceId: string) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
            await deleteInvoice(invoiceId);
        }
    }

    if (view === 'create' || view === 'edit') {
        return (
            <CreateInvoicePage
                projects={projects}
                onAddInvoice={handleCreateInvoice}
                onUpdateInvoice={handleUpdateInvoice}
                onBack={() => { setView('list'); setEditingInvoice(null); }}
                initialInvoice={editingInvoice}
            />
        );
    }

    return (
        <>
            <div className="p-4 sm:p-6 lg:p-8 space-y-6">
                <div className="sm:flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setCurrentPage('my-day')}
                            className="flex items-center space-x-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
                        >
                            <ArrowLeftIcon className="w-5 h-5" />
                            <span>Back</span>
                        </button>
                        <div>
                            <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                                GRIN <span className="text-sm font-normal text-text-secondary bg-surface px-2 py-0.5 rounded-full border border-border">(Out)</span>
                            </h2>
                            <p className="text-sm text-text-secondary">Manage outgoing invoices to clients</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setView('create')}
                        className="flex items-center space-x-2 bg-primary text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-secondary mt-2 sm:mt-0">
                        <PlusIcon className="w-4 h-4" />
                        <span>Create Sales Invoice</span>
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
                                    <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Invoice #</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Client / Project</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Amount</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Due Date</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Status</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-text-secondary uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-surface divide-y divide-border">
                                {filteredInvoices.map(invoice => (
                                    <tr key={invoice.id} onClick={() => setSelectedInvoice(invoice)} className="cursor-pointer hover:bg-subtle-background group">
                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-primary group-hover:underline">{invoice.invoiceNumber}</td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <p className="text-sm font-bold text-text-primary">{invoice.clientName}</p>
                                            <p className="text-xs text-text-secondary">{invoice.projectName}</p>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <p className="text-sm font-medium text-text-primary">{formatCurrencyINR(invoice.total)}</p>
                                            <p className="text-xs text-text-secondary">Paid: {formatCurrencyINR(invoice.paidAmount)}</p>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-text-secondary">{formatDate(invoice.dueDate)}</td>
                                        <td className="px-4 py-3"><PaymentStatusPill status={invoice.status} /></td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                onClick={(e) => handleDeleteClick(e, invoice.id)}
                                                className="text-text-secondary hover:text-error transition-colors p-1 rounded-full hover:bg-error/10"
                                                title="Delete Invoice"
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
            <InvoiceDetailModal
                isOpen={!!selectedInvoice}
                onClose={() => setSelectedInvoice(null)}
                invoice={selectedInvoice}
                onUpdateInvoice={onUpdateInvoice}
                onEditInvoice={handleEditClick}
            />
        </>
    );
};

export default SalesInvoicesPage;
