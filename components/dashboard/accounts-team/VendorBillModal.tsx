

import React, { useState, useEffect } from 'react';
import Modal from '../../shared/Modal';
import { VendorBill, VendorBillStatus } from '../../../types';
import { VENDORS } from '../../../constants';

interface VendorBillModalProps {
    isOpen: boolean;
    onClose: () => void;
    bill: VendorBill | null;
    onSave: (billData: VendorBill | Omit<VendorBill, 'id'>) => void;
}

const VendorBillModal: React.FC<VendorBillModalProps> = ({ isOpen, onClose, bill, onSave }) => {
    const [formData, setFormData] = useState<Omit<VendorBill, 'id' | 'status' | 'vendorName'>>({
        vendorId: VENDORS[0]?.id || '',
        invoiceNumber: '',
        poReference: '',
        amount: 0,
        issueDate: new Date(),
        dueDate: new Date(),
        projectId: '',
    });

    useEffect(() => {
        if (bill) {
            setFormData({
                vendorId: bill.vendorId,
                invoiceNumber: bill.invoiceNumber,
                poReference: bill.poReference || '',
                amount: bill.amount,
                issueDate: bill.issueDate,
                dueDate: bill.dueDate,
                projectId: bill.projectId || '',
            });
        } else {
            setFormData({
                vendorId: VENDORS[0]?.id || '',
                invoiceNumber: '',
                poReference: '',
                amount: 0,
                issueDate: new Date(),
                dueDate: new Date(),
                projectId: '',
            });
        }
    }, [bill, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const vendor = VENDORS.find(v => v.id === formData.vendorId);
        if (!vendor) return;

        const dataToSave = { ...formData, vendorName: vendor.name };

        if (bill) {
            onSave({ ...bill, ...dataToSave });
        } else {
            onSave({ ...dataToSave, status: 'Pending Approval' as VendorBillStatus });
        }
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={bill ? "Vendor Bill Details" : "Add New Vendor Bill"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium">Vendor</label>
                        <select name="vendorId" value={formData.vendorId} onChange={handleChange} required className="mt-1 w-full p-2 border border-border bg-surface rounded-md">
                            {VENDORS.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium">Vendor Invoice #</label>
                        <input type="text" name="invoiceNumber" value={formData.invoiceNumber} onChange={handleChange} required className="mt-1 w-full p-2 border border-border bg-surface rounded-md" />
                    </div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium">Amount (INR)</label>
                        <input type="number" name="amount" value={formData.amount} onChange={handleChange} required className="mt-1 w-full p-2 border border-border bg-surface rounded-md" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">PO Reference (Optional)</label>
                        <input type="text" name="poReference" value={formData.poReference} onChange={handleChange} className="mt-1 w-full p-2 border border-border bg-surface rounded-md" />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium">Issue Date</label>
                        <input type="date" name="issueDate" value={new Date(formData.issueDate).toISOString().split('T')[0]} onChange={e => setFormData(f => ({ ...f, issueDate: new Date(e.target.value)}))} required className="mt-1 w-full p-2 border border-border bg-surface rounded-md" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Due Date</label>
                        <input type="date" name="dueDate" value={new Date(formData.dueDate).toISOString().split('T')[0]} onChange={e => setFormData(f => ({ ...f, dueDate: new Date(e.target.value)}))} required className="mt-1 w-full p-2 border border-border bg-surface rounded-md" />
                    </div>
                </div>
                
                <div className="flex justify-end pt-4 space-x-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-text-primary bg-surface border border-border rounded-md hover:bg-subtle-background">Cancel</button>
                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-secondary">Save Bill</button>
                </div>
            </form>
        </Modal>
    );
};

export default VendorBillModal;