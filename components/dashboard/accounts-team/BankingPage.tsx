import React, { useState } from 'react';
import Card from '../../shared/Card';
import { useFinance } from '../../../hooks/useFinance';
import { useProjects } from '../../../hooks/useProjects';
import { useLeads } from '../../../hooks/useLeads'; // For client names if needed
import { formatCurrencyINR } from '../../../constants';
import { Transaction, TransactionType, TransactionCategory } from '../../../types';
import { ArrowDownLeftIcon, ArrowUpRightIcon, BanknotesIcon, CalendarIcon, PlusIcon } from '@heroicons/react/24/outline';

const BankingPage: React.FC<{ setCurrentPage: (page: string) => void }> = ({ setCurrentPage }) => {
    const { transactions, costCenters, addTransaction, loading: financeLoading } = useFinance();
    const { projects, loading: projectsLoading } = useProjects();

    const [activeTab, setActiveTab] = useState<'overview' | 'add'>('overview');

    // Form State
    const [transType, setTransType] = useState<TransactionType>('PAY_IN');
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');
    const [amount, setAmount] = useState<string>('');
    const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState<string>('');
    const [category, setCategory] = useState<TransactionCategory>('ADVANCE');
    const [paymentMode, setPaymentMode] = useState<string>('ONLINE');
    const [submitting, setSubmitting] = useState(false);

    // Computed Data
    const recentTransactions = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const activeProjects = projects.filter(p => p.status !== 'Completed');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            if (!selectedProjectId || !amount || parseFloat(amount) <= 0) {
                alert("Please fill all required fields correctly.");
                setSubmitting(false);
                return;
            }

            const numAmount = parseFloat(amount);

            // Validation for Pay Out
            if (transType === 'PAY_OUT') {
                const costCenter = costCenters.find(cc => cc.projectId === selectedProjectId);
                if (costCenter) {
                    const currentBalance = costCenter.totalPayIn - costCenter.totalPayOut;
                    if (numAmount > currentBalance) {
                        alert(`Insufficient Project Balance! Current Balance: ${formatCurrencyINR(currentBalance)}`);
                        setSubmitting(false);
                        return;
                    }
                } else {
                    // No cost center = 0 balance
                    alert("Insufficient Project Balance (No Funds)");
                    setSubmitting(false);
                    return;
                }
            }

            await addTransaction({
                projectId: selectedProjectId,
                amount: numAmount,
                type: transType,
                category: category,
                date: new Date(date),
                description: description,
                paymentMode: paymentMode as any,
                createdBy: 'current-user-id', // TODO: Get from Auth Context
                status: 'COMPLETED'
            });

            alert("Transaction Recorded Successfully!");
            setActiveTab('overview');
            // Reset form
            setAmount('');
            setDescription('');
            setSelectedProjectId('');
        } catch (error) {
            console.error("Transaction Error:", error);
            alert("Failed to record transaction.");
        } finally {
            setSubmitting(false);
        }
    };

    const selectedProject = projects.find(p => p.id === selectedProjectId);
    const selectedCostCenter = costCenters.find(cc => cc.projectId === selectedProjectId);
    const currentBalance = selectedCostCenter ? (selectedCostCenter.totalPayIn - selectedCostCenter.totalPayOut) : 0;

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-text-primary">Banking & Cash Flow</h2>
                    <p className="text-text-secondary">Manage Pay Ins, Pay Outs, and view Transaction History.</p>
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'overview' ? 'bg-primary text-white' : 'bg-surface text-text-secondary hover:bg-subtle-background'}`}
                    >
                        Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('add')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center ${activeTab === 'add' ? 'bg-primary text-white' : 'bg-surface text-text-secondary hover:bg-subtle-background'}`}
                    >
                        <PlusIcon className="w-4 h-4 mr-2" /> Record Transaction
                    </button>
                </div>
            </div>

            {activeTab === 'overview' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card>
                            <div className="flex items-center">
                                <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
                                    <ArrowDownLeftIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-text-secondary">Total Inflow (All Time)</p>
                                    <p className="text-2xl font-bold text-text-primary">{formatCurrencyINR(transactions.filter(t => t.type === 'PAY_IN').reduce((s, t) => s + t.amount, 0))}</p>
                                </div>
                            </div>
                        </Card>
                        <Card>
                            <div className="flex items-center">
                                <div className="p-3 rounded-full bg-red-100 text-red-600 mr-4">
                                    <ArrowUpRightIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-text-secondary">Total Outflow (All Time)</p>
                                    <p className="text-2xl font-bold text-text-primary">{formatCurrencyINR(transactions.filter(t => t.type === 'PAY_OUT').reduce((s, t) => s + t.amount, 0))}</p>
                                </div>
                            </div>
                        </Card>
                        <Card>
                            <div className="flex items-center">
                                <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
                                    <BanknotesIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-text-secondary">Net Cash Position</p>
                                    <p className="text-2xl font-bold text-text-primary">
                                        {formatCurrencyINR(
                                            transactions.filter(t => t.type === 'PAY_IN').reduce((s, t) => s + t.amount, 0) -
                                            transactions.filter(t => t.type === 'PAY_OUT').reduce((s, t) => s + t.amount, 0)
                                        )}
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </div>

                    <Card>
                        <h3 className="text-lg font-bold mb-4">Recent Transactions</h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-border">
                                <thead className="bg-subtle-background">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Description</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Project</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Type</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase">Amount</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-text-secondary uppercase">Mode</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-surface divide-y divide-border">
                                    {recentTransactions.map((tx) => {
                                        const proj = projects.find(p => p.id === tx.projectId);
                                        return (
                                            <tr key={tx.id} className="hover:bg-subtle-background/50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                                                    {new Date(tx.date).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-text-primary">
                                                    {tx.description}
                                                    <span className="block text-xs text-text-tertiary">{tx.category}</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                                                    {proj?.projectName || 'Unknown Project'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${tx.type === 'PAY_IN' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                        {tx.type}
                                                    </span>
                                                </td>
                                                <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold text-right ${tx.type === 'PAY_IN' ? 'text-green-600' : 'text-red-600'}`}>
                                                    {tx.type === 'PAY_IN' ? '+' : '-'}{formatCurrencyINR(tx.amount)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-text-secondary">
                                                    {tx.paymentMode || 'N/A'}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                    {recentTransactions.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-8 text-center text-text-secondary">
                                                No transactions found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            )}

            {activeTab === 'add' && (
                <Card>
                    <div className="max-w-2xl mx-auto">
                        <h3 className="text-xl font-bold mb-6">Record New Transaction</h3>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Transaction Type */}
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => { setTransType('PAY_IN'); setCategory('ADVANCE'); }}
                                    className={`p-4 border rounded-xl flex flex-col items-center justify-center transition-all ${transType === 'PAY_IN' ? 'border-primary bg-primary/5 ring-2 ring-primary ring-opacity-50' : 'border-border hover:border-text-secondary'}`}
                                >
                                    <ArrowDownLeftIcon className={`w-8 h-8 mb-2 ${transType === 'PAY_IN' ? 'text-primary' : 'text-text-tertiary'}`} />
                                    <span className={`font-medium ${transType === 'PAY_IN' ? 'text-primary' : 'text-text-secondary'}`}>Pay In (Received)</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setTransType('PAY_OUT'); setCategory('VENDOR_PAYMENT'); }}
                                    className={`p-4 border rounded-xl flex flex-col items-center justify-center transition-all ${transType === 'PAY_OUT' ? 'border-red-500 bg-red-50 ring-2 ring-red-500 ring-opacity-50' : 'border-border hover:border-text-secondary'}`}
                                >
                                    <ArrowUpRightIcon className={`w-8 h-8 mb-2 ${transType === 'PAY_OUT' ? 'text-red-500' : 'text-text-tertiary'}`} />
                                    <span className={`font-medium ${transType === 'PAY_OUT' ? 'text-red-500' : 'text-text-secondary'}`}>Pay Out (Paid)</span>
                                </button>
                            </div>

                            {/* Project Selection */}
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">Project</label>
                                <select
                                    value={selectedProjectId}
                                    onChange={(e) => setSelectedProjectId(e.target.value)}
                                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    required
                                >
                                    <option value="">Select Project</option>
                                    {activeProjects.map(p => (
                                        <option key={p.id} value={p.id}>{p.projectName} ({p.clientName})</option>
                                    ))}
                                </select>
                                {selectedProjectId && (
                                    <div className="mt-2 text-sm">
                                        <span className="text-text-secondary">Current Balance: </span>
                                        <span className={`font-medium ${currentBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {formatCurrencyINR(currentBalance)}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Amount & Date */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1">Amount</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2 text-text-tertiary">₹</span>
                                        <input
                                            type="number"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            className="w-full pl-8 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                            placeholder="0.00"
                                            min="0"
                                            step="0.01"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1">Date</label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                            className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Category & Mode */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1">Category</label>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value as TransactionCategory)}
                                        className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    >
                                        {transType === 'PAY_IN' ? (
                                            <>
                                                <option value="ADVANCE">Advance</option>
                                                <option value="INSTALLMENT">Installment</option>
                                                <option value="OTHER">Other</option>
                                            </>
                                        ) : (
                                            <>
                                                <option value="VENDOR_PAYMENT">Vendor Payment</option>
                                                <option value="SITE_EXPENSE">Site Expense</option>
                                                <option value="SALARY_ALLOCATION">Salary Allocation</option>
                                                <option value="REIMBURSEMENT">Reimbursement</option>
                                                <option value="OTHER">Other</option>
                                            </>
                                        )}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1">Payment Mode</label>
                                    <select
                                        value={paymentMode}
                                        onChange={(e) => setPaymentMode(e.target.value)}
                                        className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    >
                                        <option value="ONLINE">Online (NEFT/IMPS)</option>
                                        <option value="UPI">UPI</option>
                                        <option value="CHEQUE">Cheque</option>
                                        <option value="CASH">Cash</option>
                                    </select>
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">Description / Notes</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary h-24 resize-none"
                                    placeholder="Enter details about this transaction..."
                                    required
                                />
                            </div>

                            <div className="flex justify-end pt-4">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('overview')}
                                    className="px-6 py-2 border border-border rounded-lg text-text-secondary hover:bg-subtle-background mr-4"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitting ? 'Processing...' : 'Record Transaction'}
                                </button>
                            </div>
                        </form>
                    </div>
                </Card>
            )}
        </div>
    );
};

export default BankingPage;
