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
            case 'Critical': return 'bg-error-subtle text-error border-error/30';
            case 'High': return 'bg-warning-subtle text-warning border-warning/30';
            case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'Low': return 'bg-success-subtle text-success border-success/30';
            default: return 'bg-subtle-background text-text-secondary border-border';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                        <ShieldExclamationIcon className="w-6 h-6 text-error" />
                        Risks & Issues Tracker
                    </h3>
                    <p className="text-sm text-text-secondary">Monitor and resolve project impediments</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-error text-white rounded-lg hover:bg-error/90 transition-colors shadow-lg"
                >
                    <PlusIcon className="w-4 h-4" />
                    Report Issue
                </button>
            </div>

            <div className="grid gap-4">
                {issues.map((issue) => (
                    <div key={issue.id} className="bg-surface p-5 rounded-xl border border-border shadow-sm flex flex-col md:flex-row gap-4 justify-between transition-all hover:shadow-md">
                        <div className="space-y-3 flex-1">
                            <div className="flex items-center gap-3">
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getSeverityColor(issue.priority)}`}>
                                    {issue.priority} Priority
                                </span>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${issue.status === 'Resolved' ? 'border-success/30 text-success bg-success-subtle' : 'border-primary/30 text-primary bg-primary-subtle'
                                    }`}>
                                    {issue.status}
                                </span>
                                <span className="text-xs text-text-tertiary flex items-center gap-1">
                                    <ClockIconWrapper className="w-3 h-3" /> {new Date(issue.timestamp).toLocaleDateString()}
                                </span>
                            </div>
                            <div>
                                <h4 className="font-bold text-text-primary text-lg">{issue.title}</h4>
                                <p className="text-sm text-text-secondary mt-1 leading-relaxed">{issue.notes}</p>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-text-tertiary">
                                <span className="w-5 h-5 rounded-full bg-subtle-background flex items-center justify-center font-bold text-text-secondary">
                                    {issue.reportedBy.charAt(0)}
                                </span>
                                Reported by {issue.reportedBy}
                            </div>
                        </div>

                        <div className="flex items-center gap-3 md:border-l md:pl-6 border-border">
                            {issue.status !== 'Resolved' && (
                                <button
                                    onClick={() => onUpdateStatus(issue.id, 'Resolved')}
                                    className="px-4 py-2 text-sm border border-success/30 text-success rounded-lg hover:bg-success-subtle transition-colors flex items-center gap-2 font-medium"
                                >
                                    <CheckCircleIcon className="w-4 h-4" />
                                    Mark Resolved
                                </button>
                            )}
                        </div>
                    </div>
                ))}

                {issues.length === 0 && (
                    <div className="text-center py-16 bg-subtle-background rounded-xl border border-dashed border-border flex flex-col items-center justify-center">
                        <CheckCircleIcon className="w-12 h-12 text-text-tertiary mb-3" />
                        <p className="text-text-secondary font-medium">No issues reported yet.</p>
                        <p className="text-sm text-text-tertiary">Keep up the good work on site!</p>
                    </div>
                )}
            </div>

            {/* Add Issue Modal */}
            <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} className="relative z-50">
                <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Panel className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl border border-border">
                        <div className="flex justify-between items-center mb-6">
                            <Dialog.Title className="text-lg font-bold text-text-primary flex items-center gap-2">
                                <ExclamationTriangleIcon className="w-5 h-5 text-error" />
                                Report New Issue
                            </Dialog.Title>
                            <button onClick={() => setIsModalOpen(false)} className="text-text-tertiary hover:text-text-primary">
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleAddIssue} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">Issue Title</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full p-2 rounded-lg border border-border bg-surface text-text-primary focus:ring-error focus:border-error"
                                    placeholder="e.g. Broken tiles in kitchen"
                                    value={newIssue.title || ''}
                                    onChange={e => setNewIssue({ ...newIssue, title: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">Severity</label>
                                <select
                                    className="w-full p-2 rounded-lg border border-border bg-surface text-text-primary focus:ring-error focus:border-error"
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
                                <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
                                <textarea
                                    required
                                    className="w-full p-2 rounded-lg border border-border bg-surface text-text-primary focus:ring-error focus:border-error"
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
                                    className="px-4 py-2 text-sm font-medium text-text-secondary bg-surface border border-border rounded-lg hover:bg-subtle-background"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-sm font-medium text-white bg-error rounded-lg hover:bg-error/90 shadow-lg"
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
