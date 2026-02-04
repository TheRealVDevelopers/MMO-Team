import React, { useState, useMemo } from 'react';
import {
    CurrencyDollarIcon,
    PlusIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon
} from '@heroicons/react/24/outline';
import { useProjects } from '../../../hooks/useProjects';
import { useCostCenter } from '../../../hooks/useCostCenter';
import { Project, ProjectStatus } from '../../../types';
import ProjectFinancials from '../shared/ProjectFinancials';

const BudgetManagementPage: React.FC = () => {
    const { projects } = useProjects();
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);

    // Filter active/execution projects
    const activeProjects = useMemo(() => {
        return projects.filter(p =>
            p.status === ProjectStatus.IN_EXECUTION ||
            p.status === ProjectStatus.APPROVED ||
            p.status === 'Pending Execution Approval' as any
        );
    }, [projects]);

    if (selectedProject) {
        return (
            <div className="p-6 bg-subtle-background min-h-full">
                <ProjectFinancials
                    project={selectedProject}
                    userRole="EXECUTION"
                    onBack={() => setSelectedProject(null)}
                />
            </div>
        );
    }

    const totalBudgetedAmount = activeProjects.reduce((sum, p) => sum + (p.totalBudget || 0), 0);
    const budgetsDefinedCount = activeProjects.filter(p => p.budgetDefined).length;

    return (
        <div className="p-6 space-y-6 bg-subtle-background min-h-full">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Budget Management</h1>
                    <p className="text-sm text-text-secondary mt-1">
                        Define and track project budgets. Add cost center splits and transactions.
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-surface p-4 rounded-xl border border-border">
                    <div className="text-2xl font-bold text-text-primary">{activeProjects.length}</div>
                    <div className="text-sm text-text-secondary">Active Projects</div>
                </div>
                <div className="bg-surface p-4 rounded-xl border border-border">
                    <div className="text-2xl font-bold text-success">{budgetsDefinedCount}</div>
                    <div className="text-sm text-text-secondary">Budgets Defined</div>
                </div>
                <div className="bg-surface p-4 rounded-xl border border-border">
                    <div className="text-2xl font-bold text-warning">{activeProjects.length - budgetsDefinedCount}</div>
                    <div className="text-sm text-text-secondary">Pending Budget</div>
                </div>
                <div className="bg-surface p-4 rounded-xl border border-border">
                    <div className="text-2xl font-bold text-primary">
                        {/* Note: This total comes from Project doc summary, not deep calculation */}
                        ₹{totalBudgetedAmount.toLocaleString()}
                    </div>
                    <div className="text-sm text-text-secondary">Total Budgeted</div>
                </div>
            </div>

            {/* Projects List */}
            <div className="space-y-4">
                {activeProjects.length === 0 ? (
                    <div className="text-center py-12 bg-surface rounded-xl border border-border">
                        <CurrencyDollarIcon className="w-12 h-12 mx-auto text-text-tertiary mb-3" />
                        <p className="text-text-primary font-medium">No active projects</p>
                        <p className="text-sm text-text-secondary">Budget can be defined once projects are approved</p>
                    </div>
                ) : (
                    activeProjects.map(project => {
                        const utilization = project.totalBudget && project.totalBudget > 0
                            ? Math.round(((project.budgetSpent || 0) / project.totalBudget) * 100)
                            : 0;

                        return (
                            <div key={project.id} className="bg-surface rounded-xl border border-border p-5">
                                <div className="flex flex-col lg:flex-row justify-between gap-4">
                                    {/* Project Info */}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="font-bold text-text-primary text-lg">{project.projectName}</h3>
                                            {project.budgetDefined ? (
                                                <span className="px-2 py-0.5 bg-success-subtle text-success text-xs font-medium rounded-full flex items-center gap-1">
                                                    <CheckCircleIcon className="w-3 h-3" />
                                                    Budget Set
                                                </span>
                                            ) : (
                                                <span className="px-2 py-0.5 bg-warning-subtle text-warning text-xs font-medium rounded-full flex items-center gap-1">
                                                    <ExclamationTriangleIcon className="w-3 h-3" />
                                                    Needs Definition
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-sm text-text-secondary">
                                            {project.clientName} • Contract: ₹{project.contractValue?.toLocaleString()}
                                        </div>
                                    </div>

                                    {/* Action */}
                                    <div className="flex items-center gap-6">
                                        {project.budgetDefined && (
                                            <div className="text-center hidden md:block">
                                                <div className="text-lg font-bold text-text-primary">₹{project.budgetSpent?.toLocaleString() || 0}</div>
                                                <div className="text-xs text-text-tertiary">Spent</div>
                                            </div>
                                        )}

                                        <button
                                            onClick={() => setSelectedProject(project)}
                                            className="px-4 py-2 bg-white border border-gray-300 dark:bg-slate-700 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors flex items-center gap-2"
                                        >
                                            <CurrencyDollarIcon className="w-4 h-4" />
                                            {project.budgetDefined ? 'Manage Financials' : 'Define Budget'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default BudgetManagementPage;
