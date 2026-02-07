import React, { useState } from 'react';
import Card from '../../shared/Card';
import { useProjects } from '../../../hooks/useProjects';
import { useFinance } from '../../../hooks/useFinance';
import { formatCurrencyINR } from '../../../constants';
import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase';
import { CostCenter, Project } from '../../../types';
import ProjectLedgerView from './ProjectLedgerView';

const ProjectPnLPage: React.FC<{ setCurrentPage: (page: string) => void }> = ({ setCurrentPage }) => {
    const { projects, loading: projectsLoading } = useProjects();
    const { costCenters, loading: financeLoading } = useFinance();
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [initializing, setInitializing] = useState<string | null>(null);

    const loading = projectsLoading || financeLoading;

    // ... (rest of the file)

    // Combine Projects and Cost Centers (or just Projects with Financials)
    const projectFinancials = projects.map(project => {
        const p = project as any;
        return {
            ...project,
            totalCollected: p.totalCollected || p.financial?.totalCollected || 0,
            totalExpenses: p.totalExpenses || p.financial?.totalExpenses || 0,
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
                    <p className="text-gray-500">Real-time profitability tracking across all active projects.</p>
                </div>
            </div>

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
                                const budget = item.budget || 0;
                                const inflow = item.totalCollected || item.financial?.totalCollected || 0;
                                const outflow = item.totalExpenses || item.financial?.totalExpenses || 0;
                                const remainingBudget = budget - outflow;
                                const profitLoss = inflow - outflow;

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
