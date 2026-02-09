import React, { useState } from 'react';
import { useCases } from '../../../hooks/useCases';
import { useProjectCostCenterData } from '../../../hooks/useProjectCostCenterData';
import { useAuth } from '../../../context/AuthContext';
import { formatCurrencyINR, DEFAULT_ORGANIZATION_ID } from '../../../constants';
import { Case } from '../../../types';
import ProjectLedgerView from './ProjectLedgerView';

const ProjectPnLPage: React.FC<{ setCurrentPage: (page: string) => void }> = ({ setCurrentPage }) => {
    const { currentUser } = useAuth();
    const orgId = currentUser?.organizationId || DEFAULT_ORGANIZATION_ID;
    // Fetch ALL cases without org filter to ensure full visibility for accounts
    const { cases, loading: casesLoading } = useCases({});
    const { byCaseId: costCenterByCase, loading: costCenterLoading } = useProjectCostCenterData(orgId);
    const [selectedProject, setSelectedProject] = useState<Case | null>(null);

    const loading = casesLoading || costCenterLoading;
    
    // Log for debugging
    console.log(`[ProjectPnLPage] Loaded ${cases.length} cases, costCenterByCase keys: ${Object.keys(costCenterByCase).length}`);

    // Use case.costCenter when present; otherwise fall back to aggregated data from invoices + ledger
    // Show ALL cases so accountant can see the full financial picture
    const projectFinancials = cases.map(project => {
        const p = project as any;
        const cc = p.costCenter || {};
        const aggregated = costCenterByCase[project.id] || { receivedAmount: 0, spentAmount: 0 };

        const budget = cc.totalProjectValue ?? cc.totalBudget ?? p.budget ?? 0;
        const inflow = cc.receivedAmount ?? aggregated.receivedAmount ?? p.totalCollected ?? p.financial?.totalCollected ?? 0;
        const outflow = cc.spentAmount ?? aggregated.spentAmount ?? p.totalExpenses ?? p.financial?.totalExpenses ?? 0;
        const remaining = cc.remainingAmount ?? (inflow - outflow);
        return {
            ...project,
            costCenter: {
                ...cc,
                totalProjectValue: budget,
                totalBudget: budget,
                receivedAmount: inflow,
                spentAmount: outflow,
                remainingAmount: remaining,
            },
            budget,
            totalCollected: inflow,
            totalExpenses: outflow,
            remainingBudget: remaining,
            profitLoss: inflow - outflow,
        };
    });

    if (selectedProject) {
        return (
            <div className="p-6 bg-gray-50 min-h-full">
                <ProjectLedgerView
                    project={selectedProject}
                    onBack={() => setSelectedProject(null)}
                />
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Project Profit & Loss</h2>
                    <p className="text-gray-500">Real-time profitability tracking across all cases/projects. Showing {projectFinancials.length} total.</p>
                </div>
            </div>

            {projectFinancials.length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
                    <p className="text-yellow-800 font-medium">No cases/projects found in the system.</p>
                    <p className="text-yellow-600 text-sm mt-1">Cases will appear here once created. All financial tracking will show ₹0 until transactions occur.</p>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Budget</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider text-green-600">Total Inflow</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider text-red-600">Total Outflow</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Remaining Budget</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Profit/Loss</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {projectFinancials.map((item) => {
                                const budget = item.budget ?? 0;
                                const inflow = item.totalCollected ?? 0;
                                const outflow = item.totalExpenses ?? 0;
                                const remainingBudget = item.remainingBudget ?? (budget - outflow);
                                const profitLoss = item.profitLoss ?? (inflow - outflow);

                                return (
                                    <tr
                                        key={item.id}
                                        onClick={() => setSelectedProject(item)}
                                        className="hover:bg-gray-50 transition-colors cursor-pointer group"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900 font-bold group-hover:text-primary">{item.title}</div>
                                            <div className="text-xs text-gray-500">{item.status}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.clientName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-900">
                                            {formatCurrencyINR(budget)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-green-600 font-medium">{formatCurrencyINR(inflow)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-red-600 font-medium">{formatCurrencyINR(outflow)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold">
                                            <span className={remainingBudget >= 0 ? 'text-blue-600' : 'text-red-600'}>
                                                {formatCurrencyINR(remainingBudget)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold">
                                            <span className={profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}>
                                                {formatCurrencyINR(profitLoss)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                            <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded">View Ledger</span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ProjectPnLPage;
