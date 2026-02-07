import React, { useState } from 'react';
import { useGeneralLedger } from '../../../hooks/useGeneralLedger';
import { formatCurrencyINR, formatDate, formatDateTime } from '../../../constants';
import { ArrowDownIcon, ArrowUpIcon, FunnelIcon } from '@heroicons/react/24/outline';

const GeneralLedgerPage: React.FC = () => {
    const [filterCategory, setFilterCategory] = useState<string>('');
    const { entries, stats, loading, error } = useGeneralLedger({ category: filterCategory || undefined });

    if (loading) return <div className="p-8 text-center">Loading General Ledger...</div>;
    if (error) return <div className="p-8 text-center text-red-600">Error: {error}</div>;

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <p className="text-sm text-gray-500 mb-1">Total Revenue</p>
                    <p className="text-2xl font-bold text-emerald-600">{formatCurrencyINR(stats.totalRevenue)}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <p className="text-sm text-gray-500 mb-1">Total Expenses</p>
                    <p className="text-2xl font-bold text-red-600">{formatCurrencyINR(stats.totalExpenses)}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <p className="text-sm text-gray-500 mb-1">Net Profit</p>
                    <p className={`text-2xl font-bold ${stats.netProfit >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                        {formatCurrencyINR(stats.netProfit)}
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">Transactions</h2>
                <div className="flex gap-2">
                    <select
                        className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                    >
                        <option value="">All Categories</option>
                        <option value="REVENUE">Revenue</option>
                        <option value="EXPENSE">Expense</option>
                        <option value="SALARY">Salary</option>
                        <option value="ASSET">Asset</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto bg-white rounded-2xl border border-gray-100 shadow-sm">
                <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {entries.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                                    No transactions found.
                                </td>
                            </tr>
                        ) : (
                            entries.map((entry) => (
                                <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-gray-700">{formatDate(entry.date)}</span>
                                            <span className="text-xs">{formatDateTime(entry.date).split(',')[1]}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900">
                                        {entry.description}
                                        {entry.caseId && (
                                            <div className="text-xs text-blue-500 mt-1">Ref: {entry.caseId}</div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${entry.category === 'REVENUE' ? 'bg-emerald-100 text-emerald-800' :
                                                entry.category === 'EXPENSE' ? 'bg-red-100 text-red-800' :
                                                    'bg-gray-100 text-gray-800'}`}>
                                            {entry.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {entry.sourceType || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold">
                                        <div className={`flex items-center justify-end gap-1 ${entry.type === 'CREDIT' ? 'text-emerald-600' : 'text-red-600'}`}>
                                            {entry.type === 'CREDIT' ? '+' : '-'} {formatCurrencyINR(entry.amount)}
                                            {entry.type === 'CREDIT' ? <ArrowUpIcon className="w-3 h-3" /> : <ArrowDownIcon className="w-3 h-3" />}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default GeneralLedgerPage;
