

import React, { useState } from 'react';
import Card from '../../shared/Card';
import { formatCurrencyINR, formatDate } from '../../../constants';
import { Project } from '../../../types';
import { ArrowLeftIcon } from '../../icons/IconComponents';
import type { ExpenseLedgerItem } from '../../../hooks/useExpensesForOrg';

interface ExpensesPageProps {
    setCurrentPage: (page: string) => void;
    expenses: ExpenseLedgerItem[];
    projects: Project[];
}

const ExpensesPage: React.FC<ExpensesPageProps> = ({ setCurrentPage, expenses, projects }) => {
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
                    <p className="text-sm text-text-secondary">Expenses are created via Approval flow (request → Accounts approve).</p>
                </div>
                <Card>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-border">
                            <thead className="bg-subtle-background">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Date</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Case</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Description</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="bg-surface divide-y divide-border">
                                {expenses.map(expense => (
                                        <tr key={expense.id} className="hover:bg-subtle-background">
                                            <td className="px-4 py-3 text-sm text-text-secondary">{formatDate(expense.date)}</td>
                                            <td className="px-4 py-3 text-sm font-medium text-text-primary">{projects.find(p => p.id === expense.caseId)?.title ?? expense.caseId ?? '—'}</td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <p className="text-sm font-medium text-text-primary">{expense.description}</p>
                                            </td>
                                            <td className="px-4 py-3 text-sm font-bold text-text-primary">{formatCurrencyINR(expense.amount)}</td>
                                        </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </>
    );
};

export default ExpensesPage;