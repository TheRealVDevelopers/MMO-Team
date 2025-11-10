
import React, { useState, useEffect } from 'react';
import Modal from '../../shared/Modal';
import { Invoice, PaymentStatus, Project } from '../../../types';
import { BANK_DETAILS, numberToWordsINR } from '../../../constants';

interface CreateInvoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    projects: Project[];
    onAddInvoice: (newInvoice: Omit<Invoice, 'id'>) => void;
}

const CreateInvoiceModal: React.FC<CreateInvoiceModalProps> = ({ isOpen, onClose, projects, onAddInvoice }) => {
    const [formData, setFormData] = useState({
        projectId: '',
        amount: '',
        dueDate: '',
    });

    useEffect(() => {
        if (projects.length > 0 && !formData.projectId) {
            setFormData(prev => ({ ...prev, projectId: projects[0].id }));
        }
    }, [projects, formData.projectId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const selectedProject = projects.find(p => p.id === formData.projectId);
        if (!selectedProject || !formData.amount || !formData.dueDate) return;

        // Fix: The original object was invalid. Creating a valid Invoice object now.
        const totalAmount = Number(formData.amount);
        const newInvoice: Omit<Invoice, 'id'> = {
            invoiceNumber: '', // This will be populated by the handler
            projectId: selectedProject.id,
            projectName: selectedProject.projectName,
            clientName: selectedProject.clientName,
            clientAddress: selectedProject.clientAddress,
            clientGstin: 'N/A',
            issueDate: new Date(),
            dueDate: new Date(formData.dueDate),
            items: [{
                id: `item-${Date.now()}`,
                description: 'Services Rendered',
                hsn: '9983',
                quantity: 1,
                rate: totalAmount,
                taxRate: 0,
            }],
            subTotal: totalAmount,
            discountValue: 0,
            taxAmount: 0,
            total: totalAmount,
            amountInWords: numberToWordsINR(totalAmount),
            paidAmount: 0,
            status: PaymentStatus.DRAFT,
            terms: 'Payment is due within 30 days.',
            notes: 'Thank you for your business.',
            bankDetails: BANK_DETAILS,
        };

        onAddInvoice(newInvoice);
        onClose();
        setFormData({ projectId: projects[0]?.id || '', amount: '', dueDate: '' });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create New Invoice">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="project" className="block text-sm font-medium text-text-primary">Project</label>
                    <select
                        id="project"
                        name="projectId"
                        value={formData.projectId}
                        onChange={handleChange}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-border bg-surface focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                    >
                        {projects.map(p => (
                            <option key={p.id} value={p.id}>{p.projectName} - {p.clientName}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="amount" className="block text-sm font-medium text-text-primary">Amount (INR)</label>
                    <input
                        type="number"
                        name="amount"
                        id="amount"
                        value={formData.amount}
                        onChange={handleChange}
                        className="mt-1 block w-full p-2 border border-border bg-surface rounded-md shadow-sm"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="dueDate" className="block text-sm font-medium text-text-primary">Due Date</label>
                    <input
                        type="date"
                        name="dueDate"
                        id="dueDate"
                        value={formData.dueDate}
                        onChange={handleChange}
                        className="mt-1 block w-full p-2 border border-border bg-surface rounded-md shadow-sm"
                        required
                    />
                </div>
                <div className="flex justify-end pt-4 space-x-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-text-primary bg-surface border border-border rounded-md hover:bg-subtle-background">Cancel</button>
                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-blue-700">Create Invoice</button>
                </div>
            </form>
        </Modal>
    );
};

export default CreateInvoiceModal;
