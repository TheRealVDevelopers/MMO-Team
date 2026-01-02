
import React, { useState, useEffect } from 'react';
import Modal from '../../shared/Modal';
import { Invoice, PaymentStatus } from '../../../types';
import { formatCurrencyINR } from '../../../constants';
import InvoicePreview from './InvoicePreview';

interface InvoiceDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    invoice: Invoice | null;
    onUpdateInvoice: (invoice: Invoice) => void;
}

const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({ isOpen, onClose, invoice, onUpdateInvoice }) => {
    const [status, setStatus] = useState<PaymentStatus>(PaymentStatus.DRAFT);
    const [paidAmount, setPaidAmount] = useState(0);

    useEffect(() => {
        if (invoice) {
            setStatus(invoice.status);
            setPaidAmount(invoice.paidAmount);
        }
    }, [invoice]);

    if (!invoice) return null;

    const handleUpdate = () => {
        onUpdateInvoice({ ...invoice, status, paidAmount: Number(paidAmount) });
        onClose();
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
                             <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-text-primary bg-surface border border-border rounded-md hover:bg-subtle-background">Cancel</button>
                             <button onClick={handleUpdate} className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-secondary">Save Changes</button>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default InvoiceDetailModal;
