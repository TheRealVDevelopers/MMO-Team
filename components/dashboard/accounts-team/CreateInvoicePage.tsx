
import React, { useState, useEffect, useMemo } from 'react';
import { Project, Invoice, InvoiceItem, PaymentStatus } from '../../../types';
import { BANK_DETAILS, COMPANY_DETAILS, numberToWordsINR } from '../../../constants';
import { ArrowLeftIcon, XMarkIcon, PlusIcon } from '../../icons/IconComponents';
import InvoicePreview from './InvoicePreview';

interface CreateInvoicePageProps {
    projects: Project[];
    onAddInvoice: (newInvoice: Omit<Invoice, 'id'>) => void;
    onBack: () => void;
}

const CreateInvoicePage: React.FC<CreateInvoicePageProps> = ({ projects, onAddInvoice, onBack }) => {
    const [invoice, setInvoice] = useState<Omit<Invoice, 'id' | 'invoiceNumber'>>(() => {
        const defaultProject = projects[0];
        return {
            projectId: defaultProject?.id || '',
            projectName: defaultProject?.projectName || '',
            clientName: defaultProject?.clientName || '',
            clientAddress: defaultProject?.clientAddress || '',
            clientGstin: 'N/A',
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

    const handleSave = () => {
        onAddInvoice(invoice);
    }
    
    return (
        <div className="flex h-full bg-subtle-background">
            {/* Form Column */}
            <div className="w-1/2 p-6 overflow-y-auto space-y-6">
                 <div className="flex items-center gap-4">
                    <button onClick={onBack} className="flex items-center space-x-2 text-sm font-medium text-text-secondary hover:text-text-primary">
                        <ArrowLeftIcon className="w-5 h-5" /><span>Back to Invoices</span>
                    </button>
                    <h2 className="text-2xl font-bold text-text-primary">Create Invoice</h2>
                </div>
                
                {/* Client & Dates */}
                <div className="p-4 bg-surface rounded-lg border border-border space-y-4">
                    <select onChange={handleProjectChange} value={invoice.projectId} className="w-full p-2 border border-border rounded-md bg-subtle-background">
                        {projects.map(p => <option key={p.id} value={p.id}>{p.clientName} - {p.projectName}</option>)}
                    </select>
                    <div className="grid grid-cols-2 gap-4">
                        <input type="date" value={invoice.issueDate.toISOString().split('T')[0]} onChange={e => setInvoice(i => ({...i, issueDate: new Date(e.target.value)}))} className="p-2 border border-border rounded-md bg-subtle-background"/>
                        <input type="date" value={invoice.dueDate.toISOString().split('T')[0]} onChange={e => setInvoice(i => ({...i, dueDate: new Date(e.target.value)}))} className="p-2 border border-border rounded-md bg-subtle-background"/>
                    </div>
                </div>

                {/* Line Items */}
                 <div className="p-4 bg-surface rounded-lg border border-border space-y-2">
                    {invoice.items.map((item, index) => (
                        <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                           <input value={item.description} onChange={e => handleItemChange(index, 'description', e.target.value)} placeholder="Description" className="col-span-5 p-2 border border-border rounded-md text-sm bg-subtle-background"/>
                           <input value={item.hsn} onChange={e => handleItemChange(index, 'hsn', e.target.value)} placeholder="HSN/SAC" className="col-span-2 p-2 border border-border rounded-md text-sm bg-subtle-background"/>
                           <input type="number" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', Number(e.target.value))} placeholder="Qty" className="col-span-1 p-2 border border-border rounded-md text-sm bg-subtle-background"/>
                           <input type="number" value={item.rate} onChange={e => handleItemChange(index, 'rate', Number(e.target.value))} placeholder="Rate" className="col-span-2 p-2 border border-border rounded-md text-sm bg-subtle-background"/>
                           <select value={item.taxRate} onChange={e => handleItemChange(index, 'taxRate', Number(e.target.value))} className="col-span-1 p-2 border border-border rounded-md text-sm bg-subtle-background">
                                <option value="0">0%</option>
                                <option value="5">5%</option>
                                <option value="12">12%</option>
                                <option value="18">18%</option>
                                <option value="28">28%</option>
                           </select>
                           <button onClick={() => removeItem(index)} className="text-error hover:bg-error/10 rounded-full p-1"><XMarkIcon className="w-4 h-4"/></button>
                        </div>
                    ))}
                     <button onClick={addItem} className="text-sm font-medium text-primary flex items-center pt-2"><PlusIcon className="w-4 h-4 mr-1"/>Add Item</button>
                </div>

                 {/* Notes & Terms */}
                <div className="p-4 bg-surface rounded-lg border border-border space-y-4">
                    <div>
                        <label className="text-sm font-bold mb-1 block">Client Notes</label>
                        <textarea value={invoice.notes} onChange={e => setInvoice(i => ({...i, notes: e.target.value}))} rows={2} placeholder="Add any client-specific notes here..." className="w-full p-2 border border-border rounded-md text-sm bg-subtle-background"/>
                    </div>
                    <div>
                        <label className="text-sm font-bold mb-1 block">Terms & Conditions</label>
                        <textarea value={invoice.terms} onChange={e => setInvoice(i => ({...i, terms: e.target.value}))} rows={3} placeholder="Enter payment terms, warranties, etc." className="w-full p-2 border border-border rounded-md text-sm bg-subtle-background"/>
                    </div>
                </div>

                {/* Attachments */}
                <div className="p-4 bg-surface rounded-lg border border-border">
                    <h3 className="font-bold text-sm mb-2">Attachments</h3>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-border border-dashed rounded-md">
                        <div className="space-y-1 text-center">
                            <svg className="mx-auto h-12 w-12 text-text-secondary" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                            <div className="flex text-sm text-text-secondary">
                                <label htmlFor="file-upload" className="relative cursor-pointer bg-surface rounded-md font-medium text-primary hover:text-secondary">
                                    <span>Upload supporting documents</span>
                                    <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple/>
                                </label>
                            </div>
                            <p className="text-xs text-text-secondary">PDF, PNG, JPG up to 10MB</p>
                        </div>
                    </div>
                </div>

                <button onClick={handleSave} className="w-full py-2 bg-primary text-white font-semibold rounded-lg hover:bg-secondary">Save and Generate Invoice</button>
            </div>

            {/* Preview Column */}
            <div className="w-1/2 p-6">
                <div className="bg-surface rounded-lg shadow-lg h-full overflow-y-auto">
                    <InvoicePreview invoice={{...invoice, id: 'preview', invoiceNumber: 'INV-XXXX-XXX'}} />
                </div>
            </div>
        </div>
    );
}

export default CreateInvoicePage;