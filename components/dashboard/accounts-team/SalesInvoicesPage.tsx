import React, { useState, useMemo, useEffect } from 'react';
import Card from '../../shared/Card';
import { formatCurrencyINR, formatDate, FIRESTORE_COLLECTIONS } from '../../../constants';
import { PaymentStatus, Project, Case } from '../../../types';
import StatusPill from '../../shared/StatusPill';
import { PlusIcon, ArrowLeftIcon, TrashIcon } from '../../icons/IconComponents';
import InvoiceDetailModal from './InvoiceDetailModal';
import CreateInvoicePage from './CreateInvoicePage';
import type { SalesInvoice } from '../../../hooks/useSalesInvoices';
import type { CreateSalesInvoiceInput } from '../../../hooks/useSalesInvoices';
import type { Invoice } from '../../../types';
import { db } from '../../../firebase';
import { collectionGroup, query, onSnapshot, doc, getDoc } from 'firebase/firestore';

// Interface for received payments that can be used for invoice creation
export interface ReceivedPayment {
    id: string;
    caseId: string;
    amount: number;
    paymentMethod: 'UPI' | 'BANK' | 'CASH' | 'CHEQUE';
    reference?: string | null;
    description?: string | null;
    verified: boolean;
    createdAt: any;
    case?: Case;
}

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
    onUpdateSalesInvoiceStatus?: (invoiceId: string, updates: { status?: 'pending' | 'paid' | 'overdue'; paidAmount?: number }) => Promise<void>;
}

const SalesInvoicesPage: React.FC<SalesInvoicesPageProps> = ({ setCurrentPage, salesInvoices, projects, onCreateSalesInvoice, onUpdateSalesInvoiceStatus }) => {
    const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [selectedInvoice, setSelectedInvoice] = useState<SalesInvoice | null>(null);
    const [editingInvoice, setEditingInvoice] = useState<SalesInvoice | null>(null);
    
    // PHASE 3: Dual Mode - Auto (from received payment) or Manual
    const [invoiceMode, setInvoiceMode] = useState<'auto' | 'manual'>('manual');
    const [receivedPayments, setReceivedPayments] = useState<ReceivedPayment[]>([]);
    const [selectedPayment, setSelectedPayment] = useState<ReceivedPayment | null>(null);
    const [loadingPayments, setLoadingPayments] = useState(true);

    // Fetch received payments (verified === true from cases/*/payments)
    useEffect(() => {
        if (!db) return;

        const paymentsQuery = query(collectionGroup(db, FIRESTORE_COLLECTIONS.PAYMENTS));

        const unsubscribe = onSnapshot(paymentsQuery, async (snapshot) => {
            const paymentsList: ReceivedPayment[] = [];

            for (const paymentDoc of snapshot.docs) {
                const data = paymentDoc.data();
                
                // Only include verified payments (Received Payments)
                if (data.verified !== true) continue;

                const paymentData: ReceivedPayment = {
                    id: paymentDoc.id,
                    caseId: '',
                    amount: data.verifiedAmount || data.amount || 0,
                    paymentMethod: data.paymentMethod || data.method || 'UPI',
                    reference: data.utr || data.reference || null,
                    description: data.description || null,
                    verified: true,
                    createdAt: data.createdAt || data.verifiedAt,
                };

                // Extract caseId from path: cases/{caseId}/payments/{paymentId}
                const pathParts = paymentDoc.ref.path.split('/');
                if (pathParts.length >= 2) {
                    paymentData.caseId = pathParts[1];
                }

                // Fetch case details
                if (paymentData.caseId) {
                    try {
                        const caseRef = doc(db, FIRESTORE_COLLECTIONS.CASES, paymentData.caseId);
                        const caseSnap = await getDoc(caseRef);
                        if (caseSnap.exists()) {
                            paymentData.case = { id: caseSnap.id, ...caseSnap.data() } as Case;
                        }
                    } catch (error) {
                        console.error('[SalesInvoices] Error fetching case:', error);
                    }
                }

                paymentsList.push(paymentData);
            }

            // Sort by createdAt descending
            paymentsList.sort((a, b) => {
                const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
                const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
                return bTime.getTime() - aTime.getTime();
            });

            setReceivedPayments(paymentsList);
            setLoadingPayments(false);
        }, (error) => {
            console.error('[SalesInvoices] Error loading payments:', error);
            setLoadingPayments(false);
        });

        return () => unsubscribe();
    }, []);

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

    // Merge projects from received payments with existing projects (for dropdown)
    const allProjects = useMemo(() => {
        const projectMap = new Map<string, Project>();
        
        // Add existing projects
        projects.forEach(p => projectMap.set(p.id, p));
        
        // Add projects from received payments (cases that may not be in projects list yet)
        receivedPayments.forEach(payment => {
            if (payment.case && !projectMap.has(payment.caseId)) {
                const caseAsProject: Project = {
                    ...payment.case,
                    projectName: payment.case.title || payment.case.projectName || 'Unnamed Project',
                    budget: 0,
                } as Project;
                projectMap.set(payment.caseId, caseAsProject);
            }
        });
        
        return Array.from(projectMap.values());
    }, [projects, receivedPayments]);

    if (view === 'create' || view === 'edit') {
        return (
            <CreateInvoicePage
                projects={allProjects}
                onAddInvoice={handleCreateInvoice}
                onUpdateInvoice={handleUpdateInvoice}
                onBack={() => { 
                    setView('list'); 
                    setEditingInvoice(null); 
                    setSelectedPayment(null);
                    setInvoiceMode('manual');
                }}
                initialInvoice={editingInvoice ? { ...editingInvoice, projectId: editingInvoice.caseId, total: editingInvoice.totalAmount, dueDate: editingInvoice.dueDate, issueDate: editingInvoice.issueDate } : null}
                selectedPayment={selectedPayment}
                invoiceMode={invoiceMode}
            />
        );
    }

    const handleSelectPaymentAndCreate = (payment: ReceivedPayment) => {
        setSelectedPayment(payment);
        setInvoiceMode('auto');
        setView('create');
    };

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
                        onClick={() => {
                            setInvoiceMode('manual');
                            setSelectedPayment(null);
                            setView('create');
                        }}
                        className="flex items-center space-x-2 bg-primary text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-secondary mt-2 sm:mt-0">
                        <PlusIcon className="w-4 h-4" />
                        <span>Create Sales Invoice (Manual)</span>
                    </button>
                </div>

                {/* PHASE 3: Received Payments for Auto Invoice Creation */}
                <Card>
                    <div className="p-4 border-b border-border">
                        <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-green-500"></span>
                            Create Invoice from Received Payment (Auto Mode)
                        </h3>
                        <p className="text-sm text-text-secondary mt-1">
                            Select a received payment to auto-populate invoice details
                        </p>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                        {loadingPayments ? (
                            <div className="p-6 text-center text-text-secondary">Loading received payments...</div>
                        ) : receivedPayments.length === 0 ? (
                            <div className="p-6 text-center text-text-secondary">
                                No received payments available. Add payments via Payment Verification page.
                            </div>
                        ) : (
                            <table className="min-w-full divide-y divide-border">
                                <thead className="bg-subtle-background">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Project</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Amount</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Date</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Method</th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-text-secondary uppercase">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-surface divide-y divide-border">
                                    {receivedPayments.map(payment => (
                                        <tr key={`${payment.caseId}-${payment.id}`} className="hover:bg-subtle-background">
                                            <td className="px-4 py-3">
                                                <p className="text-sm font-bold text-text-primary">{payment.case?.title || payment.case?.projectName || 'Unknown Project'}</p>
                                                <p className="text-xs text-text-secondary">{payment.case?.clientName}</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-sm font-bold text-green-600">{formatCurrencyINR(payment.amount)}</span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-text-secondary">
                                                {payment.createdAt ? formatDate(payment.createdAt?.toDate ? payment.createdAt.toDate() : payment.createdAt) : 'N/A'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                                    {payment.paymentMethod}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <button
                                                    onClick={() => handleSelectPaymentAndCreate(payment)}
                                                    className="text-sm font-medium text-primary hover:text-secondary hover:underline"
                                                >
                                                    Create Invoice →
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </Card>
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
                invoice={selectedInvoice ? { id: selectedInvoice.id, invoiceNumber: selectedInvoice.invoiceNumber, clientName: selectedInvoice.clientName, projectId: selectedInvoice.caseId, total: selectedInvoice.totalAmount, paidAmount: (selectedInvoice as any).paidAmount ?? 0, dueDate: selectedInvoice.dueDate, issueDate: selectedInvoice.issueDate, status: selectedInvoice.status, projectName: projects.find(p => p.id === selectedInvoice!.caseId)?.title } as unknown as Invoice : null}
                onUpdateInvoice={handleUpdateInvoice}
                onEditInvoice={(inv) => handleEditClick(salesInvoices.find(s => s.id === inv.id)!)}
                onSaveStatusToBackend={onUpdateSalesInvoiceStatus ? (invoiceId, status, paidAmount) => onUpdateSalesInvoiceStatus(invoiceId, { status: status as 'pending' | 'paid' | 'overdue', paidAmount }) : undefined}
            />
        </>
    );
};

export default SalesInvoicesPage;
