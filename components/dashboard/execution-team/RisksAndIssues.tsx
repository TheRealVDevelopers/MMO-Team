import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { ShieldExclamationIcon, PlusIcon, CheckCircleIcon, XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Issue } from '../../../types';

interface RisksAndIssuesProps {
    projectId: string; // Kept for consistency and future API calls
    issues: Issue[];
    onAddIssue: (issue: Issue) => void;
    onUpdateStatus: (issueId: string, newStatus: Issue['status']) => void;
}

const RisksAndIssues: React.FC<RisksAndIssuesProps> = ({ projectId, issues, onAddIssue, onUpdateStatus }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newIssue, setNewIssue] = useState<Partial<Issue>>({
        priority: 'Medium',
        status: 'Open'
    });

    const handleAddIssue = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newIssue.title) return; // Basic validation

        const issue: Issue = {
            id: Date.now().toString(),
            projectId, // Use the prop
            title: newIssue.title,
            status: 'Open',
            priority: newIssue.priority as any,
            reportedBy: 'Me', // Replace with current user
            timestamp: new Date(),
            notes: newIssue.notes // Mapping description to notes as per updated Type
        };

        onAddIssue(issue);
        setIsModalOpen(false);
        setNewIssue({ priority: 'Medium', status: 'Open' });
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'Critical': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200';
            case 'High': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200';
            case 'Medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200';
            case 'Low': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <ShieldExclamationIcon className="w-6 h-6 text-red-500" />
                        Risks & Issues Tracker
                    </h3>
                    <p className="text-sm text-gray-500">Monitor and resolve project impediments</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
                >
                    <PlusIcon className="w-4 h-4" />
                    Report Issue
                </button>
            </div>

            <div className="grid gap-4">
                {issues.map((issue) => (
                    <div key={issue.id} className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col md:flex-row gap-4 justify-between transition-all hover:shadow-md">
                        <div className="space-y-3 flex-1">
                            <div className="flex items-center gap-3">
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getSeverityColor(issue.priority)}`}>
                                    {issue.priority} Priority
                                </span>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${issue.status === 'Resolved' ? 'border-green-200 text-green-600 bg-green-50 dark:bg-green-900/20' : 'border-blue-200 text-blue-600 bg-blue-50 dark:bg-blue-900/20'
                                    }`}>
                                    {issue.status}
                                </span>
                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                    <ClockIconWrapper className="w-3 h-3" /> {new Date(issue.timestamp).toLocaleDateString()}
                                </span>
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 dark:text-white text-lg">{issue.title}</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">{issue.notes}</p>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-600">
                                    {issue.reportedBy.charAt(0)}
                                </span>
                                Reported by {issue.reportedBy}
                            </div>
                        </div>

                        <div className="flex items-center gap-3 md:border-l md:pl-6 md:border-gray-100 dark:md:border-gray-700">
                            {issue.status !== 'Resolved' && (
                                <button
                                    onClick={() => onUpdateStatus(issue.id, 'Resolved')}
                                    className="px-4 py-2 text-sm border border-emerald-200 text-emerald-600 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors flex items-center gap-2 font-medium"
                                >
                                    <CheckCircleIcon className="w-4 h-4" />
                                    Mark Resolved
                                </button>
                            )}
                        </div>
                    </div>
                ))}

                {issues.length === 0 && (
                    <div className="text-center py-16 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center">
                        <CheckCircleIcon className="w-12 h-12 text-gray-300 mb-3" />
                        <p className="text-gray-500 font-medium">No issues reported yet.</p>
                        <p className="text-sm text-gray-400">Keep up the good work on site!</p>
                    </div>
                )}
            </div>

            {/* Add Issue Modal */}
            <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} className="relative z-50">
                <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Panel className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-xl border border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-6">
                            <Dialog.Title className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
                                Report New Issue
                            </Dialog.Title>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleAddIssue} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Issue Title</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full p-2 rounded-lg border-gray-300 dark:bg-slate-700 dark:border-gray-600 focus:ring-red-500 focus:border-red-500"
                                    placeholder="e.g. Broken tiles in kitchen"
                                    value={newIssue.title || ''}
                                    onChange={e => setNewIssue({ ...newIssue, title: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Severity</label>
                                <select
                                    className="w-full p-2 rounded-lg border-gray-300 dark:bg-slate-700 dark:border-gray-600 focus:ring-red-500 focus:border-red-500"
                                    value={newIssue.priority}
                                    onChange={e => setNewIssue({ ...newIssue, priority: e.target.value as any })}
                                >
                                    <option value="Low">Low - Cosmetic/Minor</option>
                                    <option value="Medium">Medium - Delays work</option>
                                    <option value="High">High - Stops work</option>
                                    <option value="Critical">Critical - Safety Hazard</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                                <textarea
                                    required
                                    className="w-full p-2 rounded-lg border-gray-300 dark:bg-slate-700 dark:border-gray-600 focus:ring-red-500 focus:border-red-500"
                                    rows={4}
                                    placeholder="Describe the issue in detail..."
                                    value={newIssue.notes || ''}
                                    onChange={e => setNewIssue({ ...newIssue, notes: e.target.value })}
                                />
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:bg-slate-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-slate-600"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 shadow-lg shadow-red-200"
                                >
                                    Report Issue
                                </button>
                            </div>
                        </form>
                    </Dialog.Panel>
                </div>
            </Dialog>
        </div>
    );
};

// Helper for icon
const ClockIconWrapper = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export default RisksAndIssues;
