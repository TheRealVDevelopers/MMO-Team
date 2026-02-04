import React, { useState, useMemo } from 'react';
import { useCostCenter, Transaction } from '../../../hooks/useCostCenter';
import { useAuth } from '../../../context/AuthContext';
import { Project } from '../../../types';
import { formatCurrencyINR, formatDate } from '../../../constants';
import {
    BanknotesIcon,
    PlusIcon,
    CalendarDaysIcon,
    ArrowDownTrayIcon,
    ArrowUpTrayIcon,
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    TrashIcon,
    PencilIcon
} from '@heroicons/react/24/outline';

interface ProjectFinancialsProps {
    project: Project;
    userRole: 'EXECUTION' | 'ACCOUNTS' | 'ADMIN';
    onBack?: () => void;
}

const ProjectFinancials: React.FC<ProjectFinancialsProps> = ({ project, userRole, onBack }) => {
    const {
        budget,
        transactions,
        loading,
        addCostCenter,
        removeCostCenter,
        addTransaction,
        approveTransaction,
        rejectTransaction,
        saveBudget
    } = useCostCenter(project.id);

    const { currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState<'budget' | 'ledger'>('budget');

    // Budget Form State
    const [isBudgetFormOpen, setIsBudgetFormOpen] = useState(false);
    const [budgetForm, setBudgetForm] = useState({
        totalBudget: 0
    });

    // Cost Center Form State
    const [isCCFormOpen, setIsCCFormOpen] = useState(false);
    const [ccForm, setCcForm] = useState({ name: '', amount: 0 });

    // Transaction Form State
    const [isTransFormOpen, setIsTransFormOpen] = useState(false);
    const [transForm, setTransForm] = useState({
        type: 'debit' as 'credit' | 'debit',
        category: '',
        amount: 0,
        description: '',
        date: new Date().toISOString().split('T')[0]
    });

    const isAccountsOrAdmin = userRole === 'ACCOUNTS' || userRole === 'ADMIN';

    // Calculations
    const totalAllocated = useMemo(() =>
        budget?.costCenters.reduce((sum, cc) => sum + cc.allocatedAmount, 0) || 0,
        [budget]);

    const handleSaveTotalBudget = async () => {
        await saveBudget({ totalBudget: budgetForm.totalBudget });
        setIsBudgetFormOpen(false);
    };

    const handleAddCostCenter = async (e: React.FormEvent) => {
        e.preventDefault();
        await addCostCenter(ccForm.name, ccForm.amount);
        setCcForm({ name: '', amount: 0 });
        setIsCCFormOpen(false);
    };

    const handleAddTransaction = async (e: React.FormEvent) => {
        e.preventDefault();
        await addTransaction({
            type: transForm.type,
            category: transForm.category,
            amount: transForm.amount,
            description: transForm.description,
            date: new Date(transForm.date),
            addedBy: {
                uid: currentUser?.id || 'unknown',
                name: currentUser?.name || 'Unknown',
                role: currentUser?.role || 'unknown'
            }
        }, userRole === 'ACCOUNTS' ? 'ACCOUNTS_TEAM' : 'EXECUTION_TEAM');

        setTransForm({
            type: 'debit',
            category: '',
            amount: 0,
            description: '',
            date: new Date().toISOString().split('T')[0]
        });
        setIsTransFormOpen(false);
    };

    if (loading) return <div className="p-8 text-center">Loading Financials...</div>;

    return (
        <div className="space-y-6">
            {/* Header / Navigation */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{project.projectName} Financials</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Manage budget allocations and track expenses</p>
                </div>
                {onBack && (
                    <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400">
                        &larr; Back to Dashboard
                    </button>
                )}
            </div>

            {/* Top Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-500 mb-1">Total Budget</p>
                    <div className="flex items-center justify-between">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {formatCurrencyINR(budget?.totalBudget || 0)}
                        </p>
                        <button onClick={() => {
                            setBudgetForm({ totalBudget: budget?.totalBudget || 0 });
                            setIsBudgetFormOpen(true);
                        }} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded">
                            <PencilIcon className="w-4 h-4 text-gray-500" />
                        </button>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-500 mb-1">Total Received (In)</p>
                    <p className="text-2xl font-bold text-green-600">
                        {formatCurrencyINR(budget?.receivedAmount || 0)}
                    </p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-500 mb-1">Total Spent (Approved)</p>
                    <p className="text-2xl font-bold text-red-600">
                        {formatCurrencyINR(budget?.spentAmount || 0)}
                    </p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-500 mb-1">Pending Approval</p>
                    <p className="text-2xl font-bold text-amber-500">
                        {formatCurrencyINR(budget?.pendingAmount || 0)}
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700">
                <div className="flex space-x-8">
                    <button
                        onClick={() => setActiveTab('budget')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'budget'
                            ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                            }`}
                    >
                        Cost Centers & Allocation
                    </button>
                    <button
                        onClick={() => setActiveTab('ledger')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'ledger'
                            ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                            }`}
                    >
                        Transaction Log (Ledger)
                    </button>
                </div>
            </div>

            {/* Tab: Budget Allocation */}
            {activeTab === 'budget' && (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-4 bg-gray-50 dark:bg-slate-900/50 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">Cost Center Allocation</h3>
                                <p className="text-xs text-gray-500 mt-1">Plan your budget by allocating funds to specific heads (e.g., Civil, Electrical).</p>
                            </div>
                            <button
                                onClick={() => setIsCCFormOpen(true)}
                                className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg flex items-center gap-2 hover:bg-indigo-700 text-sm"
                            >
                                <PlusIcon className="w-4 h-4" /> Allocate Budget Head
                            </button>
                        </div>

                        {/* Budget Allocation Progress */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">Total Allocated: {formatCurrencyINR(totalAllocated)}</span>
                                <span className="text-gray-900 dark:text-white font-medium">Total Budget: {formatCurrencyINR(budget?.totalBudget || 0)}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                                <div
                                    className={`h-2.5 rounded-full ${totalAllocated > (budget?.totalBudget || 0) ? 'bg-red-500' : 'bg-blue-600'}`}
                                    style={{ width: `${Math.min(((totalAllocated / (budget?.totalBudget || 1)) * 100), 100)}%` }}
                                ></div>
                            </div>
                            <div className="text-xs text-right text-gray-500">
                                {Math.round((totalAllocated / (budget?.totalBudget || 1)) * 100)}% Allocated
                            </div>
                        </div>
                    </div>
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-slate-900">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Budget Head</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Allocated</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Weightage</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actual Spent</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Utilization</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {budget?.costCenters.length === 0 ? (
                                <tr><td colSpan={6} className="p-6 text-center text-gray-500">No budget heads defined. Click "Allocate Budget Head" to start planning.</td></tr>
                            ) : (
                                budget?.costCenters.map(cc => {
                                    const util = cc.allocatedAmount > 0 ? (cc.spentAmount / cc.allocatedAmount) * 100 : 0;
                                    const weightage = (cc.allocatedAmount / (budget?.totalBudget || 1)) * 100;
                                    return (
                                        <tr key={cc.id}>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{cc.name}</td>
                                            <td className="px-6 py-4 text-sm text-right text-gray-900 dark:text-white">{formatCurrencyINR(cc.allocatedAmount)}</td>
                                            <td className="px-6 py-4 text-sm text-center text-gray-500 dark:text-gray-400">{weightage.toFixed(1)}%</td>
                                            <td className="px-6 py-4 text-sm text-right text-gray-900 dark:text-white">{formatCurrencyINR(cc.spentAmount)}</td>
                                            <td className="px-6 py-4">
                                                <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
                                                    <div className={`h-1.5 rounded-full ${util > 100 ? 'bg-red-600' : util > 80 ? 'bg-amber-500' : 'bg-green-600'}`} style={{ width: `${Math.min(util, 100)}%` }}></div>
                                                </div>
                                                <div className="text-[10px] text-center mt-1 text-gray-500">{Math.round(util)}% Used</div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button onClick={() => removeCostCenter(cc.id)} className="text-red-500 hover:text-red-700">
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Tab: Transaction Ledger */}
            {activeTab === 'ledger' && (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-4 bg-gray-50 dark:bg-slate-900/50 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">Transaction Log</h3>
                            <p className="text-xs text-gray-500 mt-1">Record actual expenses (Money Out) or receipts (Money In). Expenses need approval.</p>
                        </div>
                        <button
                            onClick={() => setIsTransFormOpen(true)}
                            className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg flex items-center gap-2 hover:bg-indigo-700"
                        >
                            <PlusIcon className="w-4 h-4" /> Add Entry
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-slate-900">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Description</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Budget Head</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Amount</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Added By</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                                    {isAccountsOrAdmin && <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {transactions.length === 0 ? (
                                    <tr><td colSpan={7} className="p-6 text-center text-gray-500">No transactions recorded.</td></tr>
                                ) : (
                                    transactions.map(t => (
                                        <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{formatDate(t.date)}</td>
                                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{t.description}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                <span className="px-2 py-1 rounded bg-gray-100 dark:bg-slate-700 text-xs">{t.category}</span>
                                            </td>
                                            <td className={`px-6 py-4 text-right text-sm font-medium ${t.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                                                {t.type === 'credit' ? '+' : '-'} {formatCurrencyINR(t.amount)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                {t.addedBy.name}
                                                <div className="text-xs text-gray-400">{t.addedBy.role}</div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {t.status === 'approved' && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs font-medium">
                                                        <CheckCircleIcon className="w-3 h-3" /> Approved
                                                    </span>
                                                )}
                                                {t.status === 'pending' && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-medium">
                                                        <ClockIcon className="w-3 h-3" /> Pending
                                                    </span>
                                                )}
                                                {t.status === 'rejected' && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-800 text-xs font-medium">
                                                        <XCircleIcon className="w-3 h-3" /> Rejected
                                                    </span>
                                                )}
                                            </td>
                                            {isAccountsOrAdmin && (
                                                <td className="px-6 py-4 text-center">
                                                    {t.status === 'pending' && (
                                                        <div className="flex justify-center gap-2">
                                                            <button
                                                                onClick={() => approveTransaction(t, { uid: currentUser?.id || '', name: currentUser?.name || 'Admin' })}
                                                                className="text-green-600 hover:text-green-900"
                                                                title="Approve"
                                                            >
                                                                <CheckCircleIcon className="w-5 h-5" />
                                                            </button>
                                                            <button
                                                                onClick={() => rejectTransaction(t, { uid: currentUser?.id || '', name: currentUser?.name || 'Admin' })}
                                                                className="text-red-600 hover:text-red-900"
                                                                title="Reject"
                                                            >
                                                                <XCircleIcon className="w-5 h-5" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal: Define Total Budget */}
            {isBudgetFormOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-sm">
                        <h3 className="text-lg font-bold mb-4 dark:text-white">Update Total Project Budget</h3>
                        <p className="text-sm text-gray-500 mb-4">Set the overall budget limit for this project.</p>
                        <input
                            type="number"
                            className="w-full p-2 border rounded mb-4 dark:bg-slate-700 dark:text-white dark:border-gray-600"
                            value={budgetForm.totalBudget}
                            onChange={e => setBudgetForm({ totalBudget: Number(e.target.value) })}
                            min="0"
                        />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setIsBudgetFormOpen(false)} className="px-4 py-2 text-gray-500">Cancel</button>
                            <button onClick={handleSaveTotalBudget} className="px-4 py-2 bg-indigo-600 text-white rounded">Save Budget</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Add Cost Center (Budget Allocation) */}
            {isCCFormOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-sm">
                        <h3 className="text-lg font-bold mb-6 dark:text-white">Allocate Budget Head</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Budget Head Name</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border rounded dark:bg-slate-700 dark:text-white dark:border-gray-600"
                                    value={ccForm.name}
                                    placeholder="e.g., Civil Work, Electrical, Plumbing"
                                    onChange={e => setCcForm({ ...ccForm, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Allocation Amount</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-gray-500">₹</span>
                                    <input
                                        type="number"
                                        className="w-full p-2 pl-7 border rounded dark:bg-slate-700 dark:text-white dark:border-gray-600"
                                        value={ccForm.amount}
                                        onChange={e => setCcForm({ ...ccForm, amount: Number(e.target.value) })}
                                        min="0"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Remaining Unallocated: {formatCurrencyINR((budget?.totalBudget || 0) - totalAllocated)}</p>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <button onClick={() => setIsCCFormOpen(false)} className="px-4 py-2 text-gray-500">Cancel</button>
                            <button
                                onClick={handleAddCostCenter}
                                disabled={!ccForm.name || ccForm.amount <= 0}
                                className="px-4 py-2 bg-indigo-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Allocate
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Add Transaction */}
            {isTransFormOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md">
                        <h3 className="text-lg font-bold mb-4 dark:text-white">Add Financial Entry</h3>
                        <form onSubmit={handleAddTransaction} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-500 mb-1">Type</label>
                                    <select
                                        className="w-full p-2 border rounded dark:bg-slate-700 dark:text-white dark:border-gray-600"
                                        value={transForm.type}
                                        onChange={e => setTransForm({ ...transForm, type: e.target.value as 'credit' | 'debit' })}
                                    >
                                        <option value="debit">Expense (Money Out)</option>
                                        <option value="credit">Receipt (Money In)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-500 mb-1">Date</label>
                                    <input
                                        type="date"
                                        className="w-full p-2 border rounded dark:bg-slate-700 dark:text-white dark:border-gray-600"
                                        value={transForm.date}
                                        onChange={e => setTransForm({ ...transForm, date: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-500 mb-1">Budget Head / Category</label>
                                <select
                                    className="w-full p-2 border rounded dark:bg-slate-700 dark:text-white dark:border-gray-600"
                                    value={transForm.category}
                                    onChange={e => setTransForm({ ...transForm, category: e.target.value })}
                                    required
                                >
                                    <option value="">Select Budget Head</option>
                                    {budget?.costCenters.map(cc => (
                                        <option key={cc.id} value={cc.name}>{cc.name}</option>
                                    ))}
                                    <option value="General">General / Unallocated</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-500 mb-1">Description / Reason</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border rounded dark:bg-slate-700 dark:text-white dark:border-gray-600"
                                    value={transForm.description}
                                    placeholder="e.g. Purchase of 50 bags cement"
                                    onChange={e => setTransForm({ ...transForm, description: e.target.value })}
                                    required
                                    minLength={3}
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-500 mb-1">Amount</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-gray-500">₹</span>
                                    <input
                                        type="number"
                                        className="w-full p-2 pl-7 border rounded dark:bg-slate-700 dark:text-white dark:border-gray-600"
                                        value={transForm.amount}
                                        onChange={e => setTransForm({ ...transForm, amount: Number(e.target.value) })}
                                        required
                                        min="1"
                                    />
                                </div>
                            </div>

                            {!isAccountsOrAdmin && transForm.type === 'debit' && (
                                <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 text-xs p-2 rounded">
                                    Note: This expense will be marked as <strong>Pending</strong> until approved by the Accounts Team.
                                </div>
                            )}

                            <div className="flex justify-end gap-2 mt-6">
                                <button type="button" onClick={() => setIsTransFormOpen(false)} className="px-4 py-2 text-gray-500">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Submit for Approval</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectFinancials;
