import React, { useMemo } from 'react';
import { useGeneralLedger } from '../../../hooks/useGeneralLedger';
import { formatCurrencyINR } from '../../../constants';
import { Project, Case } from '../../../types';

interface ProjectLedgerViewProps {
    project: Project | Case;
    onBack: () => void;
}

const ProjectLedgerView: React.FC<ProjectLedgerViewProps> = ({ project, onBack }) => {
    // Fetch GL entries for this project
    const { entries, loading, stats: summary } = useGeneralLedger({ caseId: project.id });

    // PHASE 5: Cost Center from project data
    const costCenter = (project as any).costCenter || null;

    // Computed breakdown
    const breakdown = useMemo(() => {
        const stats = {
            material: 0,
            salary: 0,
            vendor: 0,
            other: 0,
            revenue: 0
        };

        entries.forEach(entry => {
            if (entry.category === 'REVENUE') {
                stats.revenue += entry.amount;
            } else if (entry.category === 'EXPENSE') {
                if (entry.sourceType === 'SALARY') stats.salary += entry.amount;
                else if (entry.description.toLowerCase().includes('material')) stats.material += entry.amount; // Heuristic or add sub-category?
                else if (entry.sourceType === 'PAYMENT' && entry.description.toLowerCase().includes('vendor')) stats.vendor += entry.amount;
                else stats.other += entry.amount;
            }
        });

        return stats;
    }, [entries]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <button onClick={onBack} className="text-gray-500 hover:text-gray-700 mb-2 flex items-center">
                        ← Back to Projects
                    </button>
                    <h2 className="text-2xl font-bold text-gray-900">{project.projectName} - Financial Ledger</h2>
                    <p className="text-sm text-gray-500">Real-time General Ledger transactions.</p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-gray-500">Net Profit</p>
                    <p className={`text-2xl font-bold ${summary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrencyINR(summary.netProfit)}
                    </p>
                </div>
            </div>

            {/* PHASE 5: Cost Center Summary (Read-Only) */}
            {costCenter && (
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-indigo-500"></span>
                            Cost Center
                        </h3>
                        <span className="text-xs font-medium text-indigo-600 bg-indigo-100 px-2 py-1 rounded">Read-Only</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white p-4 rounded-lg border border-indigo-100">
                            <p className="text-xs text-gray-500 uppercase mb-1">Total Project Value</p>
                            <p className="text-lg font-bold text-gray-900">{formatCurrencyINR(costCenter.totalProjectValue || costCenter.totalBudget || 0)}</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-green-100">
                            <p className="text-xs text-gray-500 uppercase mb-1">Total Received</p>
                            <p className="text-lg font-bold text-green-600">{formatCurrencyINR(costCenter.receivedAmount || 0)}</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-red-100">
                            <p className="text-xs text-gray-500 uppercase mb-1">Total Spent</p>
                            <p className="text-lg font-bold text-red-600">{formatCurrencyINR(costCenter.spentAmount || 0)}</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-blue-100">
                            <p className="text-xs text-gray-500 uppercase mb-1">Remaining Balance</p>
                            <p className={`text-lg font-bold ${(costCenter.remainingAmount || 0) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                {formatCurrencyINR(costCenter.remainingAmount || 0)}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <p className="text-xs text-gray-500 uppercase">Total Revenue</p>
                    <p className="text-lg font-bold text-green-600">{formatCurrencyINR(breakdown.revenue)}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <p className="text-xs text-gray-500 uppercase">Material Cost</p>
                    <p className="text-lg font-bold text-red-600">{formatCurrencyINR(breakdown.material)}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <p className="text-xs text-gray-500 uppercase">Salary Allocation</p>
                    <p className="text-lg font-bold text-red-600">{formatCurrencyINR(breakdown.salary)}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <p className="text-xs text-gray-500 uppercase">Other Expenses</p>
                    <p className="text-lg font-bold text-red-600">{formatCurrencyINR(breakdown.other)}</p>
                </div>
            </div>

            {/* Transaction Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="font-bold text-gray-900">Transaction History</h3>
                </div>
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Loading ledger...</div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {entries.map(entry => (
                                <tr key={entry.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {entry.date ? entry.date.toLocaleDateString() : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                        {entry.description}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${entry.type === 'DEBIT' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                            }`}>
                                            {entry.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 uppercase">
                                        {entry.sourceType}
                                    </td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-bold ${entry.type === 'DEBIT' ? 'text-red-600' : 'text-green-600'
                                        }`}>
                                        {formatCurrencyINR(entry.amount)}
                                    </td>
                                </tr>
                            ))}
                            {entries.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        No transactions found for this project.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default ProjectLedgerView;
