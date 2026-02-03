
import React, { useState, useEffect, useMemo } from 'react';
import { Project, Invoice, InvoiceItem, PaymentStatus } from '../../../types';
import { BANK_DETAILS, COMPANY_DETAILS, numberToWordsINR } from '../../../constants';
import { ArrowLeftIcon, XMarkIcon, PlusIcon } from '../../icons/IconComponents';
import InvoicePreview from './InvoicePreview';

interface CreateInvoicePageProps {
    projects: Project[];
    onAddInvoice: (newInvoice: Omit<Invoice, 'id'>) => Promise<void>;
    onUpdateInvoice?: (invoice: Invoice) => Promise<void>;
    onBack: () => void;
    initialInvoice?: Invoice | null;
}

const CreateInvoicePage: React.FC<CreateInvoicePageProps> = ({ projects, onAddInvoice, onUpdateInvoice, onBack, initialInvoice }) => {
    const isEditMode = !!initialInvoice;

    // Initial State Logic
    const [invoice, setInvoice] = useState<Omit<Invoice, 'id' | 'invoiceNumber'> & { id?: string, invoiceNumber?: string }>(() => {
        if (initialInvoice) {
            return {
                ...initialInvoice,
                issueDate: new Date(initialInvoice.issueDate),
                dueDate: new Date(initialInvoice.dueDate),
            };
        }

        const defaultProject = projects[0];
        return {
            projectId: defaultProject?.id || '',
            projectName: defaultProject?.projectName || '',
            clientName: defaultProject?.clientName || '',
            clientAddress: defaultProject?.clientAddress || '',
            clientGstin: '',
            clientPhone: '',

            issueDate: new Date(),
            dueDate: new Date(new Date().setDate(new Date().getDate() + 30)),
            items: [{ id: `item-${Date.now()}`, description: '', hsn: '', quantity: 1, rate: 0, taxRate: 18 }],
            subTotal: 0,
            discountValue: 0,
            taxAmount: 0,
            total: 0,
            amountInWords: '',
            paidAmount: 0,
            status: PaymentStatus.DRAFT,
            terms: 'Payment is due within 30 days. Late payments are subject to a 1.5% monthly interest charge.',
            notes: 'Thank you for your business. We appreciate your prompt payment.',
            bankDetails: BANK_DETAILS,

            transportMode: 'Road',
            vehicleNumber: '',
            placeOfSupply: '',
            poReference: '',
        };
    });

    useEffect(() => {
        const subTotal = invoice.items.reduce((acc, item) => acc + (item.quantity * item.rate), 0);
        const taxableAmount = subTotal - invoice.discountValue;
        const taxAmount = invoice.items.reduce((acc, item) => {
            const itemTotal = item.quantity * item.rate;
            return acc + (itemTotal * (item.taxRate / 100));
        }, 0);
        const total = taxableAmount + taxAmount;
        const amountInWords = numberToWordsINR(total);
        setInvoice(i => ({ ...i, subTotal, taxAmount, total, amountInWords }));
    }, [invoice.items, invoice.discountValue]);

    const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const project = projects.find(p => p.id === e.target.value);
        if (project) {
            setInvoice(i => ({
                ...i,
                projectId: project.id,
                projectName: project.projectName,
                clientName: project.clientName,
                clientAddress: project.clientAddress,
            }));
        }
    }

    const handleItemChange = (index: number, field: keyof InvoiceItem, value: string | number) => {
        const newItems = [...invoice.items];
        (newItems[index] as any)[field] = value;
        setInvoice(i => ({ ...i, items: newItems }));
    };

    const addItem = () => {
        setInvoice(i => ({
            ...i,
            items: [...i.items, { id: `item-${Date.now()}`, description: '', hsn: '', quantity: 1, rate: 0, taxRate: 18 }]
        }));
    };

    const removeItem = (index: number) => {
        const newItems = invoice.items.filter((_, i) => i !== index);
        setInvoice(i => ({ ...i, items: newItems }));
    };

    const handleSave = async () => {
        if (isEditMode && onUpdateInvoice && invoice.id) {
            await onUpdateInvoice(invoice as Invoice);
        } else {
            await onAddInvoice(invoice);
        }
        onBack();
    }

    return (
        <div className="flex h-full bg-subtle-background">
            {/* Form Column */}
            <div className="w-1/2 p-6 overflow-y-auto space-y-6">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="flex items-center space-x-2 text-sm font-medium text-text-secondary hover:text-text-primary">
                        <ArrowLeftIcon className="w-5 h-5" /><span>Back to Invoices</span>
                    </button>
                    <h2 className="text-2xl font-bold text-text-primary">{isEditMode ? 'Edit Invoice' : 'Create Invoice'}</h2>
                </div>

                {/* Invoice Number Input */}
                <div className="p-4 bg-surface rounded-lg border border-border space-y-2">
                    <label className="text-sm font-bold text-text-primary">Invoice Number (Optional)</label>
                    <input
                        value={invoice.invoiceNumber || ''}
                        onChange={e => setInvoice(i => ({ ...i, invoiceNumber: e.target.value }))}
                        placeholder="Leave empty for auto-generation (e.g. INV-2026-0203-001)"
                        className="w-full p-2 border border-border rounded-md bg-subtle-background"
                    />
                    <p className="text-xs text-text-secondary">If left blank, an invoice number will be automatically generated upon saving.</p>
                </div>

                {/* Client & Dates */}
                <div className="p-4 bg-surface rounded-lg border border-border space-y-4">
                    <h3 className="font-bold text-sm text-text-primary">Bill To</h3>
                    <select onChange={handleProjectChange} value={invoice.projectId} disabled={isEditMode} className="w-full p-2 border border-border rounded-md bg-subtle-background">
                        {projects.map(p => <option key={p.id} value={p.id}>{p.clientName} - {p.projectName}</option>)}
                    </select>

                    <div className="grid grid-cols-2 gap-4">
                        <input value={invoice.clientName} onChange={e => setInvoice(i => ({ ...i, clientName: e.target.value }))} placeholder="Client Name" className="p-2 border border-border rounded-md bg-subtle-background" />
                        <input value={invoice.clientPhone || ''} onChange={e => setInvoice(i => ({ ...i, clientPhone: e.target.value }))} placeholder="Client Phone" className="p-2 border border-border rounded-md bg-subtle-background" />
                        <textarea value={invoice.clientAddress} onChange={e => setInvoice(i => ({ ...i, clientAddress: e.target.value }))} placeholder="Billing Address" rows={2} className="col-span-2 p-2 border border-border rounded-md bg-subtle-background" />
                        <input value={invoice.clientGstin || ''} onChange={e => setInvoice(i => ({ ...i, clientGstin: e.target.value }))} placeholder="Client GSTIN" className="p-2 border border-border rounded-md bg-subtle-background" />
                        <input value={invoice.placeOfSupply || ''} onChange={e => setInvoice(i => ({ ...i, placeOfSupply: e.target.value }))} placeholder="Place of Supply" className="p-2 border border-border rounded-md bg-subtle-background" />
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
                        <div>
                            <label className="text-xs font-medium text-text-secondary">Invoice Date</label>
                            <input type="date" value={invoice.issueDate instanceof Date ? invoice.issueDate.toISOString().split('T')[0] : ''} onChange={e => setInvoice(i => ({ ...i, issueDate: new Date(e.target.value) }))} className="w-full p-2 border border-border rounded-md bg-subtle-background" />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-text-secondary">Due Date</label>
                            <input type="date" value={invoice.dueDate instanceof Date ? invoice.dueDate.toISOString().split('T')[0] : ''} onChange={e => setInvoice(i => ({ ...i, dueDate: new Date(e.target.value) }))} className="w-full p-2 border border-border rounded-md bg-subtle-background" />
                        </div>
                    </div>
                </div>

                {/* Logistics Details (Tally Style) */}
                <div className="p-4 bg-surface rounded-lg border border-border space-y-4">
                    <h3 className="font-bold text-sm text-text-primary">Logistics & Shipping</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <select value={invoice.transportMode || 'Road'} onChange={e => setInvoice(i => ({ ...i, transportMode: e.target.value as any }))} className="p-2 border border-border rounded-md bg-subtle-background">
                            <option value="Road">Road</option>
                            <option value="Rail">Rail</option>
                            <option value="Air">Air</option>
                            <option value="Ship">Ship</option>
                        </select>
                        <input value={invoice.vehicleNumber || ''} onChange={e => setInvoice(i => ({ ...i, vehicleNumber: e.target.value }))} placeholder="Vehicle Number" className="p-2 border border-border rounded-md bg-subtle-background" />
                        <input value={invoice.poReference || ''} onChange={e => setInvoice(i => ({ ...i, poReference: e.target.value }))} placeholder="PO Reference / Order No." className="col-span-2 p-2 border border-border rounded-md bg-subtle-background" />
                    </div>
                </div>

                {/* Line Items */}
                <div className="p-4 bg-surface rounded-lg border border-border space-y-2">
                    <h3 className="font-bold text-sm text-text-primary mb-2">Item Details</h3>
                    {invoice.items.map((item, index) => (
                        <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                            <input value={item.description} onChange={e => handleItemChange(index, 'description', e.target.value)} placeholder="Description" className="col-span-5 p-2 border border-border rounded-md text-sm bg-subtle-background" />
                            <input value={item.hsn} onChange={e => handleItemChange(index, 'hsn', e.target.value)} placeholder="HSN/SAC" className="col-span-2 p-2 border border-border rounded-md text-sm bg-subtle-background" />
                            <input type="number" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', Number(e.target.value))} placeholder="Qty" className="col-span-1 p-2 border border-border rounded-md text-sm bg-subtle-background" />
                            <input type="number" value={item.rate} onChange={e => handleItemChange(index, 'rate', Number(e.target.value))} placeholder="Rate" className="col-span-2 p-2 border border-border rounded-md text-sm bg-subtle-background" />
                            <select value={item.taxRate} onChange={e => handleItemChange(index, 'taxRate', Number(e.target.value))} className="col-span-1 p-2 border border-border rounded-md text-sm bg-subtle-background">
                                <option value="0">0%</option>
                                <option value="5">5%</option>
                                <option value="12">12%</option>
                                <option value="18">18%</option>
                                <option value="28">28%</option>
                            </select>
                            <div className="col-span-1 flex justify-center">
                                <button onClick={() => removeItem(index)} className="text-error hover:bg-error/10 rounded-full p-1"><XMarkIcon className="w-4 h-4" /></button>
                            </div>
                        </div>
                    ))}
                    <button onClick={addItem} className="text-sm font-medium text-primary flex items-center pt-2"><PlusIcon className="w-4 h-4 mr-1" />Add Item</button>
                </div>

                {/* Notes & Terms */}
                <div className="p-4 bg-surface rounded-lg border border-border space-y-4">
                    <div>
                        <label className="text-sm font-bold mb-1 block">Client Notes</label>
                        <textarea value={invoice.notes} onChange={e => setInvoice(i => ({ ...i, notes: e.target.value }))} rows={2} placeholder="Add any client-specific notes here..." className="w-full p-2 border border-border rounded-md text-sm bg-subtle-background" />
                    </div>
                    <div>
                        <label className="text-sm font-bold mb-1 block">Terms & Conditions</label>
                        <textarea value={invoice.terms} onChange={e => setInvoice(i => ({ ...i, terms: e.target.value }))} rows={3} placeholder="Enter payment terms, warranties, etc." className="w-full p-2 border border-border rounded-md text-sm bg-subtle-background" />
                    </div>
                </div>

                <button onClick={handleSave} className="w-full py-2 bg-primary text-white font-semibold rounded-lg hover:bg-secondary">
                    {isEditMode ? 'Update Invoice' : 'Save and Generate Invoice'}
                </button>
            </div>

            {/* Preview Column */}
            <div className="w-1/2 p-6">
                <div className="bg-surface rounded-lg shadow-lg h-full overflow-y-auto">
                    <InvoicePreview invoice={{ ...invoice, id: invoice.id || 'preview', invoiceNumber: invoice.invoiceNumber || 'INV-XXXX-XXX' }} />
                </div>
            </div>
        </div>
    );
}

export default CreateInvoicePage;