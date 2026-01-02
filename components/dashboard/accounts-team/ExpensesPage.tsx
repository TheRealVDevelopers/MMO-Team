

import React, { useState, useMemo } from 'react';
import Card from '../../shared/Card';
import { formatCurrencyINR, formatDate, USERS } from '../../../constants';
import { Expense, ExpenseStatus, Project } from '../../../types';
import StatusPill from '../../shared/StatusPill';
import { ArrowLeftIcon, PlusIcon } from '../../icons/IconComponents';
import ExpenseModal from './ExpenseModal';

const ExpenseStatusPill: React.FC<{ status: ExpenseStatus }> = ({ status }) => {
    const color = {
        'Pending': 'amber',
        'Approved': 'green',
        'Rejected': 'red',
        'Paid': 'green',
    }[status] as 'amber' | 'blue' | 'red' | 'green';
    return <StatusPill color={color}>{status}</StatusPill>;
};

interface ExpensesPageProps {
  setCurrentPage: (page: string) => void;
  expenses: Expense[];
  projects: Project[];
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
  onUpdateExpense: (expense: Expense) => void;
}

const ExpensesPage: React.FC<ExpensesPageProps> = ({ setCurrentPage, expenses, projects, onAddExpense, onUpdateExpense }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

    const handleUpdateStatus = (expense: Expense, newStatus: ExpenseStatus) => {
        onUpdateExpense({ ...expense, status: newStatus });
    };

    const handleOpenModal = (expense: Expense | null) => {
        setSelectedExpense(expense);
        setIsModalOpen(true);
    };

    const handleSaveExpense = (expenseData: Expense | Omit<Expense, 'id'>) => {
        if ('id' in expenseData) {
            onUpdateExpense(expenseData);
        } else {
            onAddExpense(expenseData);
        }
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
                        <h2 className="text-2xl font-bold text-text-primary">Expense Management</h2>
                    </div>
                     <button onClick={() => handleOpenModal(null)} className="flex items-center space-x-2 bg-primary text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-secondary mt-2 sm:mt-0">
                        <PlusIcon className="w-4 h-4" />
                        <span>Create Expense</span>
                    </button>
                </div>
                <Card>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-border">
                            <thead className="bg-subtle-background">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Date</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Submitted By</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Description</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Amount</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Status</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-surface divide-y divide-border">
                                {expenses.map(expense => {
                                    const user = USERS.find(u => u.id === expense.userId);
                                    return (
                                        <tr key={expense.id} onClick={() => handleOpenModal(expense)} className="cursor-pointer hover:bg-subtle-background">
                                            <td className="px-4 py-3 text-sm text-text-secondary">{formatDate(expense.date)}</td>
                                            <td className="px-4 py-3 text-sm font-medium text-text-primary">{user?.name || 'Unknown'}</td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <p className="text-sm font-medium text-text-primary">{expense.description}</p>
                                                <p className="text-xs text-text-secondary">
                                                    {expense.projectId ? `Project: ${projects.find(p=>p.id === expense.projectId)?.projectName}` : expense.category}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3 text-sm font-medium text-text-primary">{formatCurrencyINR(expense.amount)}</td>
                                            <td className="px-4 py-3"><ExpenseStatusPill status={expense.status} /></td>
                                            <td className="px-4 py-3 text-sm space-x-2" onClick={e => e.stopPropagation()}>
                                                {expense.status === 'Pending' && <button onClick={() => handleUpdateStatus(expense, 'Approved')} className="px-2 py-1 text-xs font-semibold text-primary bg-primary-subtle-background rounded-md hover:bg-primary/20">Approve</button>}
                                                {expense.status === 'Approved' && <button onClick={() => handleUpdateStatus(expense, 'Paid')} className="px-2 py-1 text-xs font-semibold text-secondary bg-secondary-subtle-background rounded-md hover:bg-secondary/20">Pay</button>}
                                                {expense.status === 'Pending' && <button onClick={() => handleUpdateStatus(expense, 'Rejected')} className="px-2 py-1 text-xs font-semibold text-error bg-error-subtle-background rounded-md hover:bg-error/20">Reject</button>}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
            {isModalOpen && (
                <ExpenseModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    expense={selectedExpense}
                    projects={projects}
                    onSave={handleSaveExpense}
                />
            )}
        </>
    );
};

export default ExpensesPage;