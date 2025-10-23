import React, { useState, useMemo } from 'react';
import Card from '../../shared/Card';
import { EXPENSES } from '../../../constants';
import { Expense } from '../../../types';
import StatusPill from '../../shared/StatusPill';
import { PlusIcon } from '../../icons/IconComponents';

const ExpenseStatusPill: React.FC<{ status: 'Pending' | 'Approved' | 'Paid' }> = ({ status }) => {
    const color = {
        'Pending': 'amber',
        'Approved': 'blue',
        'Paid': 'green',
    }[status] as 'amber' | 'blue' | 'green';
    return <StatusPill color={color}>{status}</StatusPill>;
};

const ExpensesPage: React.FC = () => {
    const [categoryFilter, setCategoryFilter] = useState<'All' | 'Vendor' | 'Material' | 'Labor' | 'Other'>('All');

    const filteredExpenses = useMemo(() => {
        if (categoryFilter === 'All') return EXPENSES;
        return EXPENSES.filter(expense => expense.category === categoryFilter);
    }, [categoryFilter]);

    const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

    return (
        <div className="space-y-6">
            <div className="sm:flex justify-between items-center">
                <h2 className="text-2xl font-bold text-text-primary">Expense Management</h2>
                <button className="flex items-center space-x-2 bg-primary text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 mt-2 sm:mt-0">
                    <PlusIcon className="w-4 h-4" />
                    <span>Add New Expense</span>
                </button>
            </div>
            <Card>
                 <div className="flex flex-wrap items-center gap-2 mb-4">
                    <span className="text-sm font-medium mr-2">Filter by category:</span>
                    {['All', 'Vendor', 'Material', 'Labor', 'Other'].map(cat => (
                        <button 
                            key={cat}
                            onClick={() => setCategoryFilter(cat as any)}
                            className={`px-3 py-1 text-xs font-medium rounded-full ${categoryFilter === cat ? 'bg-primary text-white' : 'bg-surface text-text-secondary hover:bg-border border border-border'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                        <thead className="bg-subtle-background">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Date</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Description</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Category</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Amount</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-surface divide-y divide-border">
                            {filteredExpenses.map(expense => (
                                <tr key={expense.id} className="hover:bg-subtle-background">
                                    <td className="px-4 py-3 text-sm text-text-secondary">{expense.date.toLocaleDateString()}</td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <p className="text-sm font-medium text-text-primary">{expense.description}</p>
                                        <p className="text-xs text-text-secondary">Project: {expense.projectId}</p>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-text-secondary">{expense.category}</td>
                                    <td className="px-4 py-3 text-sm font-medium text-text-primary">{formatCurrency(expense.amount)}</td>
                                    <td className="px-4 py-3"><ExpenseStatusPill status={expense.status} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default ExpensesPage;