import React, { useState, useMemo } from 'react';
import { useProjects } from '../../../hooks/useProjects';
import { Project, ProjectStatus } from '../../../types';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircleIcon,
    BanknotesIcon,
    CurrencyRupeeIcon
} from '@heroicons/react/24/outline';

const BudgetDefinitionPage: React.FC = () => {
    const { projects, updateProject, loading } = useProjects();
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Budget form state
    const [totalBudget, setTotalBudget] = useState('');
    const [materialsBudget, setMaterialsBudget] = useState('');
    const [laborBudget, setLaborBudget] = useState('');
    const [overheadBudget, setOverheadBudget] = useState('');
    const [contingencyBudget, setContingencyBudget] = useState('');
    const [notes, setNotes] = useState('');

    // Filter projects that need budget definition (BLUEPRINT_CREATED)
    const pendingBudgetProjects = useMemo(() =>
        projects.filter(p => p.status === ProjectStatus.BLUEPRINT_CREATED),
        [projects]
    );

    const resetForm = () => {
        setTotalBudget('');
        setMaterialsBudget('');
        setLaborBudget('');
        setOverheadBudget('');
        setContingencyBudget('');
        setNotes('');
    };

    const handleSelectProject = (project: Project) => {
        setSelectedProject(project);
        // Pre-fill with existing budget if available
        if (project.budget) {
            setTotalBudget(project.budget.toString());
        }
        resetForm();
        if (project.budget) setTotalBudget(project.budget.toString());
    };

    const handleSubmitBudget = async () => {
        if (!selectedProject) return;

        const total = parseFloat(totalBudget);
        if (isNaN(total) || total <= 0) {
            alert("Please enter a valid total budget.");
            return;
        }

        setIsSubmitting(true);
        try {
            await updateProject(selectedProject.id, {
                status: ProjectStatus.PENDING_BUDGET_APPROVAL,
                projectBudget: {
                    total,
                    materials: parseFloat(materialsBudget) || 0,
                    labor: parseFloat(laborBudget) || 0,
                    overhead: parseFloat(overheadBudget) || 0,
                    contingency: parseFloat(contingencyBudget) || 0,
                    notes,
                    submittedAt: new Date(),
                },
                budget: total,
            });

            setSelectedProject(null);
            resetForm();
        } catch (error) {
            console.error("Error submitting budget:", error);
            alert("Failed to submit budget. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full bg-subtle-background">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-text-secondary">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-subtle-background min-h-full">
            <header className="mb-8">
                <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3">
                    <BanknotesIcon className="w-8 h-8 text-primary" />
                    Budget Definition
                </h1>
                <p className="text-text-secondary mt-2">
                    Define project budgets for accounts approval
                </p>
            </header>

            {pendingBudgetProjects.length === 0 ? (
                <div className="bg-surface rounded-xl p-12 text-center">
                    <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-text-primary mb-2">No Pending Budgets</h3>
                    <p className="text-text-secondary">All projects with blueprints have budgets defined.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Project List */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-text-primary">
                            Awaiting Budget ({pendingBudgetProjects.length})
                        </h2>
                        {pendingBudgetProjects.map(project => (
                            <motion.div
                                key={project.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`bg-surface rounded-lg p-4 cursor-pointer border-2 transition-all ${selectedProject?.id === project.id
                                        ? 'border-primary shadow-lg'
                                        : 'border-transparent hover:border-border'
                                    }`}
                                onClick={() => handleSelectProject(project)}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-bold text-text-primary">{project.projectName}</h3>
                                        <p className="text-sm text-text-secondary">{project.clientName}</p>
                                    </div>
                                    <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                                        Blueprint Ready
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 mt-3 text-xs text-text-secondary">
                                    <span>{project.executionBlueprint?.stages?.length || 0} stages</span>
                                    <span>•</span>
                                    <span>{project.executionBlueprint?.totalDurationDays || 0} days</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Budget Form */}
                    <AnimatePresence mode="wait">
                        {selectedProject && (
                            <motion.div
                                key={selectedProject.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="bg-surface rounded-xl p-6 sticky top-6"
                            >
                                <h2 className="text-xl font-bold text-text-primary mb-2">
                                    Define Budget
                                </h2>
                                <p className="text-sm text-text-secondary mb-6">
                                    For: {selectedProject.projectName}
                                </p>

                                {/* Budget Fields */}
                                <div className="space-y-4 mb-6">
                                    <div>
                                        <label className="block text-sm font-medium text-text-primary mb-2">
                                            Total Project Budget *
                                        </label>
                                        <div className="relative">
                                            <CurrencyRupeeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                                            <input
                                                type="number"
                                                value={totalBudget}
                                                onChange={(e) => setTotalBudget(e.target.value)}
                                                placeholder="Enter total budget"
                                                className="w-full pl-10 p-3 bg-subtle-background border border-border rounded-lg text-text-primary text-lg font-semibold"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs text-text-secondary mb-1">Materials</label>
                                            <input
                                                type="number"
                                                value={materialsBudget}
                                                onChange={(e) => setMaterialsBudget(e.target.value)}
                                                placeholder="₹0"
                                                className="w-full p-2 bg-subtle-background border border-border rounded-lg text-text-primary"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-text-secondary mb-1">Labor</label>
                                            <input
                                                type="number"
                                                value={laborBudget}
                                                onChange={(e) => setLaborBudget(e.target.value)}
                                                placeholder="₹0"
                                                className="w-full p-2 bg-subtle-background border border-border rounded-lg text-text-primary"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-text-secondary mb-1">Overhead</label>
                                            <input
                                                type="number"
                                                value={overheadBudget}
                                                onChange={(e) => setOverheadBudget(e.target.value)}
                                                placeholder="₹0"
                                                className="w-full p-2 bg-subtle-background border border-border rounded-lg text-text-primary"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-text-secondary mb-1">Contingency</label>
                                            <input
                                                type="number"
                                                value={contingencyBudget}
                                                onChange={(e) => setContingencyBudget(e.target.value)}
                                                placeholder="₹0"
                                                className="w-full p-2 bg-subtle-background border border-border rounded-lg text-text-primary"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs text-text-secondary mb-1">Notes (optional)</label>
                                        <textarea
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            placeholder="Any budget notes or justifications..."
                                            rows={3}
                                            className="w-full p-2 bg-subtle-background border border-border rounded-lg text-text-primary"
                                        />
                                    </div>
                                </div>

                                {/* Submit */}
                                <button
                                    onClick={handleSubmitBudget}
                                    disabled={isSubmitting || !totalBudget}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-hover disabled:opacity-50 transition-colors"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircleIcon className="w-5 h-5" />
                                            Submit for Accounts Approval
                                        </>
                                    )}
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};

export default BudgetDefinitionPage;
