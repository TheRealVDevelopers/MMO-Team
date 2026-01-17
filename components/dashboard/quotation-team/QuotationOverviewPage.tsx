import React, { useState } from 'react';
import { Project, ProjectStatus } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { PlusIcon, ClockIcon } from '../../icons/IconComponents';
import { formatCurrencyINR, formatDate } from '../../../constants';

const QuotationOverviewPage: React.FC<{
    projects: Project[];
    onProjectSelect: (project: Project) => void;
    onCreateProject: () => void;
    onReset?: () => void;
}> = ({ projects, onProjectSelect, onCreateProject, onReset }) => {
    const { currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState<'live' | 'completed'>('live');

    if (!currentUser) return null;

    // Filter projects assigned to this quotation member
    const myProjects = projects.filter(p => p.assignedTeam.quotation === currentUser.id);

    // Live Quotations: On Queue, Preparation, Sent, Negotiation, Approval Requested
    const liveProjects = myProjects.filter(p =>
        p.status === ProjectStatus.AWAITING_QUOTATION ||
        p.status === ProjectStatus.QUOTATION_SENT ||
        p.status === ProjectStatus.NEGOTIATING ||
        p.status === ProjectStatus.APPROVAL_REQUESTED
    );

    // Completed Quotations: Approved (Won) or Rejected (Lost)
    const completedProjects = myProjects.filter(p =>
        p.status === ProjectStatus.APPROVED ||
        p.status === ProjectStatus.REJECTED
    );

    const displayedProjects = activeTab === 'live' ? liveProjects : completedProjects;

    const getStatusBadge = (status: ProjectStatus) => {
        switch (status) {
            case ProjectStatus.AWAITING_QUOTATION:
                return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-[10px] font-bold uppercase tracking-wider">New Request</span>;
            case ProjectStatus.QUOTATION_SENT:
                return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-[10px] font-bold uppercase tracking-wider">Sent to Client</span>;
            case ProjectStatus.NEGOTIATING:
                return <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-[10px] font-bold uppercase tracking-wider">Negotiation</span>;
            case ProjectStatus.APPROVAL_REQUESTED:
                return <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-[10px] font-bold uppercase tracking-wider">Waiting Approval</span>;
            case ProjectStatus.APPROVED:
                return <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-[10px] font-bold uppercase tracking-wider">Won</span>;
            case ProjectStatus.REJECTED:
                return <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-[10px] font-bold uppercase tracking-wider">Lost</span>;
            default:
                return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-[10px] font-bold uppercase tracking-wider">{status}</span>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-black text-text-primary tracking-tight">Procurement Dashboard</h2>
                    <p className="text-sm text-text-secondary">Manage and track your active pricing requests.</p>
                </div>
                <button
                    onClick={onCreateProject}
                    className="flex items-center space-x-2 bg-primary text-white px-6 py-3 rounded-xl text-sm font-black shadow-xl shadow-primary/20 hover:bg-secondary transition-all hover:-translate-y-0.5"
                >
                    <PlusIcon className="w-5 h-5" />
                    <span>Create New Quotation</span>
                </button>
            </div>

            {/* Simplified Tabs */}
            <div className="flex border-b border-border">
                <button
                    onClick={() => setActiveTab('live')}
                    className={`px-8 py-3 text-sm font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'live' ? 'border-primary text-primary' : 'border-transparent text-text-tertiary hover:text-text-primary'}`}
                >
                    Live Quotations ({liveProjects.length})
                </button>
                <button
                    onClick={() => setActiveTab('completed')}
                    className={`px-8 py-3 text-sm font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'completed' ? 'border-primary text-primary' : 'border-transparent text-text-tertiary hover:text-text-primary'}`}
                >
                    Won / Lost ({completedProjects.length})
                </button>
            </div>

            {/* Main Content Table */}
            <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden min-h-[50vh]">
                <table className="w-full text-left">
                    <thead className="bg-subtle-background border-b border-border">
                        <tr>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-tertiary">Project Details</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-tertiary">Status</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-tertiary text-right">Value (INR)</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-tertiary text-right">Timeline</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                        {displayedProjects.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="py-20 text-center text-text-secondary">
                                    <div className="flex flex-col items-center">
                                        <div className="w-16 h-16 bg-subtle-background rounded-full flex items-center justify-center mb-3">
                                            <ClockIcon className="w-6 h-6 text-text-tertiary" />
                                        </div>
                                        <p className="font-bold">No {activeTab} quotations found.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            displayedProjects.map(project => (
                                <tr
                                    key={project.id}
                                    onClick={() => onProjectSelect(project)}
                                    className="group hover:bg-subtle-background/30 cursor-pointer transition-colors"
                                >
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-text-primary text-sm group-hover:text-primary transition-colors">{project.projectName}</p>
                                        <p className="text-xs text-text-secondary mt-0.5">{project.clientName}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        {getStatusBadge(project.status)}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <p className="font-black text-text-primary font-serif">{formatCurrencyINR(project.budget)}</p>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2 text-xs text-text-secondary">
                                            <span className="font-medium">{formatDate(new Date(project.startDate))}</span>
                                            {project.deadline && project.deadline !== 'TBD' && (
                                                <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-bold">
                                                    Due: {project.deadline}
                                                </span>
                                            )}
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

export default QuotationOverviewPage;