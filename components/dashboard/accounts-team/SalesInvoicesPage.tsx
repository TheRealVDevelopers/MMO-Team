import React, { useState, useMemo } from 'react';
import Card from '../../shared/Card';
import { formatCurrencyINR, formatDate } from '../../../constants';
import { PaymentStatus, Project } from '../../../types';
import StatusPill from '../../shared/StatusPill';
import { PlusIcon, ArrowLeftIcon, TrashIcon } from '../../icons/IconComponents';
import InvoiceDetailModal from './InvoiceDetailModal';
import CreateInvoicePage from './CreateInvoicePage';
import type { SalesInvoice } from '../../../hooks/useSalesInvoices';
import type { CreateSalesInvoiceInput } from '../../../hooks/useSalesInvoices';
import type { Invoice } from '../../../types';

const PaymentStatusPill: React.FC<{ status: string }> = ({ status }) => {
    const colorMap: Record<string, 'green' | 'amber' | 'red' | 'slate' | 'blue' | 'purple'> = {
        paid: 'green',
        pending: 'amber',
        overdue: 'red',
    };
    const color = colorMap[status] || 'slate';
    return <StatusPill color={color}>{status || 'Unknown'}</StatusPill>;
};

interface SalesInvoicesPageProps {
    setCurrentPage: (page: string) => void;
    salesInvoices: SalesInvoice[];
    projects: Project[];
    onCreateSalesInvoice: (input: CreateSalesInvoiceInput) => Promise<void>;
}

const SalesInvoicesPage: React.FC<SalesInvoicesPageProps> = ({ setCurrentPage, salesInvoices, projects, onCreateSalesInvoice }) => {
    const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [selectedInvoice, setSelectedInvoice] = useState<SalesInvoice | null>(null);
    const [editingInvoice, setEditingInvoice] = useState<SalesInvoice | null>(null);

    const filteredInvoices = useMemo(() => {
        return statusFilter === 'all' ? salesInvoices : salesInvoices.filter(inv => inv.status === statusFilter);
    }, [statusFilter, salesInvoices]);

    const handleCreateInvoice = async (newInvoice: any) => {
        const caseId = newInvoice.projectId || newInvoice.caseId || projects[0]?.id;
        if (!caseId) throw new Error('Select a project/case');
        await onCreateSalesInvoice({
            caseId,
            clientName: newInvoice.clientName || '',
            amount: newInvoice.subTotal ?? newInvoice.amount ?? 0,
            taxAmount: newInvoice.taxAmount,
            totalAmount: newInvoice.total ?? 0,
            issueDate: newInvoice.issueDate instanceof Date ? newInvoice.issueDate : new Date(newInvoice.issueDate),
            dueDate: newInvoice.dueDate ? (newInvoice.dueDate instanceof Date ? newInvoice.dueDate : new Date(newInvoice.dueDate)) : undefined,
        });
        setView('list');
    };

    const handleUpdateInvoice = async (_invoice: any) => {
        setEditingInvoice(null);
        setView('list');
    };

    const handleEditClick = (invoice: SalesInvoice) => {
        setEditingInvoice(invoice);
        setView('edit');
    };

    const handleDeleteClick = async (e: React.MouseEvent, _invoiceId: string) => {
        e.stopPropagation();
        alert('Deleting sales invoices is not allowed; ledger is append-only.');
    };

    if (view === 'create' || view === 'edit') {
        return (
            <CreateInvoicePage
                projects={projects}
                onAddInvoice={handleCreateInvoice}
                onUpdateInvoice={handleUpdateInvoice}
                onBack={() => { setView('list'); setEditingInvoice(null); }}
                initialInvoice={editingInvoice ? { ...editingInvoice, projectId: editingInvoice.caseId, total: editingInvoice.totalAmount, dueDate: editingInvoice.dueDate, issueDate: editingInvoice.issueDate } : null}
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
                        {['all', 'pending', 'paid', 'overdue'].map(status => (
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
                                            <p className="text-xs text-text-secondary">{projects.find(p => p.id === invoice.caseId)?.title ?? invoice.caseId}</p>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <p className="text-sm font-medium text-text-primary">{formatCurrencyINR(invoice.totalAmount)}</p>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-text-secondary">{invoice.dueDate ? formatDate(invoice.dueDate) : '—'}</td>
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
                invoice={selectedInvoice ? { id: selectedInvoice.id, invoiceNumber: selectedInvoice.invoiceNumber, clientName: selectedInvoice.clientName, projectId: selectedInvoice.caseId, total: selectedInvoice.totalAmount, paidAmount: 0, dueDate: selectedInvoice.dueDate, issueDate: selectedInvoice.issueDate, status: selectedInvoice.status, projectName: projects.find(p => p.id === selectedInvoice!.caseId)?.title } as unknown as Invoice : null}
                onUpdateInvoice={handleUpdateInvoice}
                onEditInvoice={(inv) => handleEditClick(salesInvoices.find(s => s.id === inv.id)!)}
            />
        </>
    );
};

export default SalesInvoicesPage;
