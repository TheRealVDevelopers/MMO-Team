
import React, { useState, useEffect } from 'react';
import Modal from '../../shared/Modal';
import { Invoice, PaymentStatus } from '../../../types';
import { formatCurrencyINR } from '../../../constants';
import InvoicePreview from './InvoicePreview';
import { updateInvoiceStatus } from '../../../hooks/useInvoices';
import { PencilSquareIcon } from '@heroicons/react/24/outline';

interface InvoiceDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    invoice: Invoice | null;
    onUpdateInvoice: (invoice: Invoice) => void;
    onEditInvoice?: (invoice: Invoice) => void;
    /** When provided, status/paidAmount are persisted to the correct backend (e.g. sales invoices under org). */
    onSaveStatusToBackend?: (invoiceId: string, status: string, paidAmount: number) => Promise<void>;
}

const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({ isOpen, onClose, invoice, onUpdateInvoice, onEditInvoice, onSaveStatusToBackend }) => {
    const [status, setStatus] = useState<PaymentStatus>(PaymentStatus.DRAFT);
    const [paidAmount, setPaidAmount] = useState(0);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (invoice) {
            setStatus(invoice.status);
            setPaidAmount(invoice.paidAmount ?? 0);
        }
    }, [invoice]);

    if (!invoice) return null;

    const handleUpdate = async () => {
        const amount = Number(paidAmount);
        setSaving(true);
        try {
            if (onSaveStatusToBackend) {
                await onSaveStatusToBackend(invoice.id, status, amount);
            } else {
                if (status === PaymentStatus.PAID && status !== invoice.status) {
                    await updateInvoiceStatus(invoice.id, invoice.projectId, amount, status);
                } else {
                    onUpdateInvoice({ ...invoice, status, paidAmount: amount });
                }
            }
            onUpdateInvoice({ ...invoice, status, paidAmount: amount });
            onClose();
        } catch (err) {
            console.error('Failed to update invoice status:', err);
            alert('Failed to update status. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = () => {
        onClose();
        if (onEditInvoice) {
            onEditInvoice(invoice);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Invoice #${invoice.invoiceNumber}`} size="4xl">
            <div className="flex flex-col h-[75vh]">
                <div className="flex-grow overflow-y-auto border border-border rounded-lg">
                    <InvoicePreview invoice={invoice} />
                </div>

                <div className="mt-4 pt-4 border-t border-border">
                    <h3 className="text-lg font-bold mb-4">Manage Invoice</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div>
                            <label className="block text-sm font-medium text-text-primary">Payment Status</label>
                            <select
                                value={status}
                                onChange={e => setStatus(e.target.value as PaymentStatus)}
                                className="mt-1 block w-full p-2 border border-border bg-surface rounded-md"
                            >
                                {Object.values(PaymentStatus).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-primary">Amount Paid</label>
                            <input
                                type="number"
                                value={paidAmount}
                                onChange={e => setPaidAmount(Number(e.target.value))}
                                className="mt-1 block w-full p-2 border border-border bg-surface rounded-md"
                            />
                        </div>
                        <div className="flex justify-end space-x-2">
                            {onEditInvoice && (
                                <button
                                    type="button"
                                    onClick={handleEdit}
                                    className="px-4 py-2 text-sm font-medium text-text-primary bg-surface border border-border rounded-md hover:bg-subtle-background flex items-center gap-2"
                                >
                                    <PencilSquareIcon className="w-4 h-4" />
                                    Edit
                                </button>
                            )}
                            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-text-primary bg-surface border border-border rounded-md hover:bg-subtle-background">Cancel</button>
                            <button onClick={handleUpdate} disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-secondary disabled:opacity-50">{saving ? 'Saving…' : 'Save Changes'}</button>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default InvoiceDetailModal;
