import React, { useState } from 'react';
import { useProjects } from '../../../hooks/useProjects';
import { Project, ProjectStatus, UserRole } from '../../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircleIcon, XCircleIcon, BanknotesIcon, DocumentTextIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { auth } from '../../../firebase';

const AccountsBudgetApprovalPage: React.FC = () => {
    const { projects, updateProject, loading } = useProjects();
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);

    // Filter projects pending budget approval
    const pendingProjects = projects.filter(p => p.status === ProjectStatus.PENDING_BUDGET_APPROVAL);

    const handleApprove = async () => {
        if (!selectedProject) return;

        try {
            const confirmed = window.confirm("Are you sure you want to approve this project budget? This will activate the project.");
            if (!confirmed) return;

            await updateProject(selectedProject.id, {
                status: ProjectStatus.ACTIVE, // Final approved state - project is now active
                budgetApprovedAt: new Date(),
                budgetApprovedBy: auth.currentUser?.uid,
                advancePaymentVerified: true // Implicit verification as per workflow
            });
            setSelectedProject(null);
        } catch (error) {
            console.error("Error approving budget:", error);
            alert("Failed to approve budget. Please try again.");
        }
    };

    const handleReject = async () => {
        if (!selectedProject) return;
        const reason = prompt("Please enter a reason for rejection (this will be sent to the Execution Team):");
        if (!reason) return;

        try {
            await updateProject(selectedProject.id, {
                status: ProjectStatus.PENDING_EXECUTION_APPROVAL, // Send back to Execution Team
                rejectionReason: reason,
                rejectedAt: new Date().toISOString()
            });
            setSelectedProject(null);
        } catch (error) {
            console.error("Error rejecting budget:", error);
            alert("Failed to reject budget.");
        }
    };

    if (loading) return <div className="p-8 text-center">Loading pending approvals...</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <header className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                    <BanknotesIcon className="w-8 h-8 text-blue-600" />
                    Budget Approvals
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                    Review and approve project budgets and payment terms before activation.
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* List of Pending Projects */}
                <div className="lg:col-span-1 space-y-4">
                    <h2 className="font-semibold text-gray-700 dark:text-gray-300 uppercase text-xs tracking-wider">Pending Requests ({pendingProjects.length})</h2>
                    {pendingProjects.length === 0 ? (
                        <div className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 text-center text-gray-500">
                            No pending budget approvals.
                        </div>
                    ) : (
                        pendingProjects.map(project => (
                            <div
                                key={project.id}
                                onClick={() => setSelectedProject(project)}
                                className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedProject?.id === project.id
                                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 ring-1 ring-blue-500'
                                    : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-gray-700 hover:border-blue-300'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-gray-900 dark:text-white">{project.projectName}</h3>
                                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-md">Pending</span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{project.clientName}</p>
                                <p className="text-xs text-gray-500">Submitted: {new Date(project.createdAt || Date.now()).toLocaleDateString()}</p>
                            </div>
                        ))
                    )}
                </div>

                {/* Detail View */}
                <div className="lg:col-span-2">
                    {selectedProject ? (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
                        >
                            {/* Header */}
                            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedProject.projectName}</h2>
                                        <p className="text-gray-500 dark:text-gray-400">{selectedProject.clientName}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleReject}
                                            className="px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors"
                                        >
                                            Reject
                                        </button>
                                        <button
                                            onClick={handleApprove}
                                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors flex items-center gap-2"
                                        >
                                            <CheckCircleIcon className="w-4 h-4" /> Approve Budget & Activate
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 space-y-8">
                                {/* 1. Basic Info (Limited View) */}
                                <section>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                        <DocumentTextIcon className="w-5 h-5 text-gray-400" /> Project Details
                                    </h3>
                                    <div className="grid grid-cols-2 gap-6 bg-gray-50 dark:bg-slate-700/30 p-4 rounded-lg">
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase">Organization</p>
                                            <p className="font-medium text-gray-900 dark:text-white">{selectedProject.clientName}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase">Location</p>
                                            <p className="font-medium text-gray-900 dark:text-white">{selectedProject.clientAddress || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase">Site Engineer</p>
                                            <p className="font-medium text-gray-900 dark:text-white">{selectedProject.assignedTeam?.site_engineer ? 'Assigned' : 'Unassigned'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase">Project Head</p>
                                            <p className="font-medium text-gray-900 dark:text-white">{selectedProject.projectHeadId ? 'Assigned' : 'Unassigned'}</p>
                                        </div>
                                    </div>
                                </section>

                                {/* 2. Financials & Advance (Primary Focus) */}
                                <section>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                        <BanknotesIcon className="w-5 h-5 text-blue-500" /> Financial Overview & Advance
                                    </h3>
                                    <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-xl p-6">
                                        <div className="flex justify-between items-center mb-6">
                                            <div>
                                                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">Total Verified Budget</p>
                                                <p className="text-3xl font-bold text-gray-900 dark:text-white">₹{Number(selectedProject.budget).toLocaleString()}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-green-600 dark:text-green-400 font-medium mb-1">Advance Received</p>
                                                <p className="text-2xl font-bold text-green-700 dark:text-green-400">₹{Number(selectedProject.advancePaid || 0).toLocaleString()}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${Number(selectedProject.advancePaid) > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                                    {Number(selectedProject.advancePaid) > 0 ? <CheckCircleIcon className="w-4 h-4" /> : <XCircleIcon className="w-4 h-4" />}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white">Advance Verification</p>
                                                    <p className="text-xs text-gray-500">
                                                        {Number(selectedProject.advancePaid) > 0
                                                            ? `Advance of ₹${Number(selectedProject.advancePaid).toLocaleString()} has been recorded.`
                                                            : "No advance payment recorded. Please verify before approving."}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* 3. Payment Terms */}
                                <section>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Payment Schedule</h3>
                                    <div className="overflow-hidden border border-gray-200 dark:border-gray-700 rounded-lg">
                                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                            <thead className="bg-gray-50 dark:bg-slate-900">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Milestone</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Percentage</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-gray-700">
                                                {selectedProject.paymentTerms?.map((term, idx) => (
                                                    <tr key={idx}>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{term.milestone}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{term.percentage}%</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-mono">₹{term.amount?.toLocaleString()}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{term.dueDate ? new Date(term.dueDate).toLocaleDateString() : 'TBD'}</td>
                                                    </tr>
                                                ))}
                                                {(!selectedProject.paymentTerms || selectedProject.paymentTerms.length === 0) && (
                                                    <tr>
                                                        <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500 italic">No payment terms defined.</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </section>
                            </div>
                        </motion.div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 p-12 bg-gray-50 dark:bg-slate-800/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                            <BanknotesIcon className="w-16 h-16 mb-4 opacity-50" />
                            <p className="text-lg font-medium">Select a project to review</p>
                            <p className="text-sm">Approve budgets to unlock execution workflows.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AccountsBudgetApprovalPage;
