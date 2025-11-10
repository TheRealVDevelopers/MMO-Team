

import React, { useState, useEffect } from 'react';
import Modal from '../../shared/Modal';
import { Expense, ExpenseCategory, PaymentMethod, Project } from '../../../types';
import { useAuth } from '../../../context/AuthContext';

interface ExpenseModalProps {
    isOpen: boolean;
    onClose: () => void;
    expense: Expense | null;
    projects: Project[];
    onSave: (expenseData: Expense | Omit<Expense, 'id'>) => void;
}

const ExpenseModal: React.FC<ExpenseModalProps> = ({ isOpen, onClose, expense, projects, onSave }) => {
    const { currentUser } = useAuth();
    const [formData, setFormData] = useState<Omit<Expense, 'id' | 'status'>>({
        userId: currentUser?.id || '',
        projectId: '',
        category: 'Other',
        description: '',
        amount: 0,
        date: new Date(),
        paymentMethod: 'Cash',
        vendor: '',
    });

    useEffect(() => {
        if (expense) {
            setFormData({
                userId: expense.userId,
                projectId: expense.projectId || '',
                category: expense.category,
                description: expense.description,
                amount: expense.amount,
                date: expense.date,
                paymentMethod: expense.paymentMethod,
                vendor: expense.vendor || '',
            });
        } else {
            setFormData({
                userId: currentUser?.id || '',
                projectId: '',
                category: 'Other',
                description: '',
                amount: 0,
                date: new Date(),
                paymentMethod: 'Cash',
                vendor: '',
            });
        }
    }, [expense, isOpen, currentUser]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (expense) {
            onSave({ ...expense, ...formData });
        } else {
            onSave({ ...formData, status: 'Pending' });
        }
        onClose();
    };

    const categories: ExpenseCategory[] = ['Travel', 'Site', 'Office', 'Client Meeting', 'Other'];
    const paymentMethods: PaymentMethod[] = ['Cash', 'Company Card', 'Personal Card', 'UPI'];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={expense ? "Edit Expense" : "Create New Expense"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium">Category</label>
                        <select name="category" value={formData.category} onChange={handleChange} className="mt-1 w-full p-2 border border-border bg-surface rounded-md">
                            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium">Project (Optional)</label>
                        <select name="projectId" value={formData.projectId} onChange={handleChange} className="mt-1 w-full p-2 border border-border bg-surface rounded-md">
                            <option value="">None</option>
                            {projects.map(p => <option key={p.id} value={p.id}>{p.projectName}</option>)}
                        </select>
                    </div>
                </div>
                 <div>
                    <label className="block text-sm font-medium">Description</label>
                    <textarea name="description" value={formData.description} onChange={handleChange} rows={3} required className="mt-1 w-full p-2 border border-border bg-surface rounded-md" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium">Amount (INR)</label>
                        <input type="number" name="amount" value={formData.amount} onChange={handleChange} required className="mt-1 w-full p-2 border border-border bg-surface rounded-md" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Date</label>
                        <input type="date" name="date" value={new Date(formData.date).toISOString().split('T')[0]} onChange={e => setFormData(f => ({ ...f, date: new Date(e.target.value)}))} required className="mt-1 w-full p-2 border border-border bg-surface rounded-md" />
                    </div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-medium">Payment Method</label>
                        <select name="paymentMethod" value={formData.paymentMethod} onChange={handleChange} className="mt-1 w-full p-2 border border-border bg-surface rounded-md">
                            {paymentMethods.map(pm => <option key={pm} value={pm}>{pm}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Vendor (Optional)</label>
                        <input type="text" name="vendor" value={formData.vendor} onChange={handleChange} className="mt-1 w-full p-2 border border-border bg-surface rounded-md" />
                    </div>
                </div>
                <div className="flex justify-end pt-4 space-x-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-text-primary bg-surface border border-border rounded-md hover:bg-subtle-background">Cancel</button>
                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-blue-700">Save Expense</button>
                </div>
            </form>
        </Modal>
    );
};

export default ExpenseModal;