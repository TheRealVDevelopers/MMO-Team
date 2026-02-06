import React, { useState } from 'react';
import Card from '../../shared/Card';
import { useProjects } from '../../../hooks/useProjects';
import { useFinance } from '../../../hooks/useFinance';
import { formatCurrencyINR } from '../../../constants';
import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase';
import { CostCenter, Project } from '../../../types';
import ProjectFinancials from '../shared/ProjectFinancials';

const ProjectPnLPage: React.FC<{ setCurrentPage: (page: string) => void }> = ({ setCurrentPage }) => {
    const { projects, loading: projectsLoading } = useProjects();
    const { costCenters, loading: financeLoading } = useFinance();
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [initializing, setInitializing] = useState<string | null>(null);

    const loading = projectsLoading || financeLoading;

    // Combine Projects and Cost Centers
    const projectFinancials = projects.map(project => {
        const costCenter = costCenters.find(cc => cc.projectId === project.id);

        // Use CostCenter data if available, enabled automatic tracking means we prefer Project.totalCollected/Expenses
        // But for now, let's assume we want to view the consolidated view
        return {
            ...project,
            costCenter,
            // Fallback to project totals if cost center is missing or out of sync (optional)
            totalCollected: project.totalCollected || costCenter?.totalPayIn || 0,
            totalExpenses: project.totalExpenses || costCenter?.totalPayOut || 0,
        };
    });

    const handleInitializeCostCenter = async (e: React.MouseEvent, projectId: string) => {
        e.stopPropagation();
        try {
            setInitializing(projectId);
            const costCenterRef = doc(db, 'costCenters', projectId);

            const initialData: CostCenter = {
                id: projectId,
                projectId,
                totalBudget: 0,
                totalPayIn: 0,
                totalPayOut: 0,
                remainingBudget: 0,
                profit: 0,
                status: 'Active',
                lastUpdated: new Date()
            };

            await setDoc(costCenterRef, {
                ...initialData,
                lastUpdated: serverTimestamp()
            });

        } catch (error) {
            console.error("Error initializing cost center:", error);
            alert("Failed to initialize Cost Center");
        } finally {
            setInitializing(null);
        }
    };

    if (selectedProject) {
        return (
            <div className="p-6 bg-subtle-background min-h-full">
                <ProjectFinancials
                    project={selectedProject}
                    userRole="ACCOUNTS"
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
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-text-primary">Project P&L (Cost Centers)</h2>
                    <p className="text-text-secondary">Track profitability and financial history. Click on a project for detailed ledger.</p>
                </div>
            </div>

            <Card>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                        <thead className="bg-subtle-background">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Project Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Client</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">Budget</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider text-green-600">Total Inflow</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider text-red-600">Total Outflow</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">Remaining Budget</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">Profit/Loss</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-text-secondary uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-surface divide-y divide-border">
                            {projectFinancials.map((item) => {
                                const hasCostCenter = !!item.costCenter;
                                const budget = item.budget || item.costCenter?.totalBudget || 0;
                                const inflow = item.totalCollected || 0;
                                const outflow = item.totalExpenses || 0;
                                const remainingBudget = budget - outflow; // Budget - Expenses
                                const profitLoss = inflow - outflow; // Actual profit/loss

                                return (
                                    <tr
                                        key={item.id}
                                        onClick={() => setSelectedProject(item as unknown as Project)}
                                        className="hover:bg-subtle-background transition-colors cursor-pointer group"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-text-primary font-bold group-hover:underline">{item.projectName}</div>
                                            <div className="text-xs text-text-secondary">{item.lifecycleStatus}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{item.clientName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-text-primary">
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
                                            {!hasCostCenter ? (
                                                <button
                                                    onClick={(e) => handleInitializeCostCenter(e, item.id)}
                                                    disabled={initializing === item.id}
                                                    className="text-primary hover:text-primary-dark font-medium inline-flex items-center"
                                                >
                                                    {initializing === item.id ? 'Init...' : 'Initialize'}
                                                </button>
                                            ) : (
                                                <span className="text-xs text-text-secondary">View Ledger</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default ProjectPnLPage;
