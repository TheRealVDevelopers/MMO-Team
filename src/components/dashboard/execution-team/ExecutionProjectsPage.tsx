import React, { useState } from 'react';
import {
    MagnifyingGlassIcon,
    CalendarIcon,
    ChevronRightIcon,
    PencilSquareIcon,
    FunnelIcon,
    BarsArrowUpIcon
} from '@heroicons/react/24/outline';
import { Project, ProjectStatus } from '../../../types';
import ProjectEditModal from './ProjectEditModal';
import { updateProject } from '../../../hooks/useProjects';
import { format } from 'date-fns';

interface ExecutionProjectsPageProps {
    onProjectSelect: (projectId: string) => void;
    projects: Project[];
}

const ExecutionProjectsPage: React.FC<ExecutionProjectsPageProps> = ({ onProjectSelect, projects }) => {
    const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active');
    const [searchQuery, setSearchQuery] = useState('');
    const [editingProject, setEditingProject] = useState<Project | null>(null);

    // Filter Logic
    const filteredProjects = projects.filter(p => {
        const matchesSearch = p.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.clientName.toLowerCase().includes(searchQuery.toLowerCase());

        if (filter === 'active') return matchesSearch && p.status !== ProjectStatus.COMPLETED;
        if (filter === 'completed') return matchesSearch && p.status === ProjectStatus.COMPLETED;
        return matchesSearch;
    });

    const getStatusStyle = (status: ProjectStatus) => {
        switch (status) {
            case ProjectStatus.IN_EXECUTION: return 'bg-success-subtle text-success';
            case ProjectStatus.APPROVED: return 'bg-primary-subtle text-primary';
            case ProjectStatus.COMPLETED: return 'bg-subtle-background text-text-secondary';
            default: return 'bg-warning-subtle text-warning';
        }
    };

    return (
        <div className="space-y-6 p-6 bg-subtle-background min-h-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Execution Projects</h1>
                    <p className="text-sm text-text-secondary">Manage ongoing site works, budgets, and schedules</p>
                </div>

                <div className="flex gap-4">
                    <div className="flex bg-surface p-1 rounded-lg border border-border">
                        {['active', 'completed', 'all'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f as any)}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filter === f
                                    ? 'bg-primary-subtle text-primary'
                                    : 'text-text-secondary hover:text-text-primary'
                                    }`}
                            >
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex gap-4 bg-surface p-4 rounded-xl border border-border">
                <div className="flex-1 relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                    <input
                        type="text"
                        placeholder="Search projects..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-subtle-background text-text-primary focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                </div>
                <div className="flex items-center gap-2 text-text-secondary border-l border-border pl-4">
                    <BarsArrowUpIcon className="w-5 h-5" />
                    <span className="text-sm font-medium">{filteredProjects.length} Projects</span>
                </div>
            </div>

            {/* Table View */}
            <div className="bg-surface rounded-xl border border-border overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-subtle-background border-b border-border text-xs uppercase text-text-secondary font-semibold">
                            <th className="p-4">Project Name</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-right">Budget</th>
                            <th className="p-4 text-right">Used</th>
                            <th className="p-4">Timeline</th>
                            <th className="p-4">Assigned Team</th>
                            <th className="p-4 w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {filteredProjects.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="p-8 text-center text-text-tertiary">
                                    No projects found matching your criteria.
                                </td>
                            </tr>
                        ) : (
                            filteredProjects.map((project) => (
                                <tr
                                    key={project.id}
                                    className="hover:bg-subtle-background/50 transition-colors group cursor-pointer"
                                    onClick={() => onProjectSelect(project.id)}
                                >
                                    <td className="p-4">
                                        <div className="font-bold text-text-primary">{project.projectName}</div>
                                        <div className="text-xs text-text-secondary">{project.clientName}</div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium inline-block ${getStatusStyle(project.status)}`}>
                                            {project.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right font-medium text-text-primary">
                                        {project.totalBudget ? `₹${project.totalBudget.toLocaleString()}` : <span className="text-text-tertiary">-</span>}
                                    </td>
                                    <td className="p-4 text-right">
                                        {project.budgetSpent ? (
                                            <span className={project.budgetSpent > (project.totalBudget || 0) ? 'text-error font-bold' : 'text-text-primary'}>
                                                ₹{project.budgetSpent.toLocaleString()}
                                            </span>
                                        ) : (
                                            <span className="text-text-tertiary">-</span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2 text-sm text-text-secondary">
                                            <CalendarIcon className="w-4 h-4 text-text-tertiary" />
                                            <div className="flex flex-col">
                                                <span>{project.startDate ? format(new Date(project.startDate), 'MMM d') : 'N/A'}</span>
                                                <span className="text-xs text-text-tertiary">to {project.endDate ? format(new Date(project.endDate), 'MMM d, yyyy') : 'N/A'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex -space-x-2 overflow-hidden">
                                            {/* Mock avatars for team members - ideally fetch names/avatars */}
                                            {project.assignedTeam?.execution?.map((uid, i) => (
                                                <div key={uid} className="inline-block h-8 w-8 rounded-full ring-2 ring-surface bg-primary-subtle flex items-center justify-center text-xs font-bold text-primary" title={uid}>
                                                    {uid.charAt(0).toUpperCase()}
                                                </div>
                                            ))}
                                            {(project.assignedTeam?.execution?.length || 0) === 0 && (
                                                <span className="text-xs text-text-tertiary italic">Unassigned</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setEditingProject(project); }}
                                            className="p-2 text-text-tertiary hover:text-primary hover:bg-primary-subtle rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            <PencilSquareIcon className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Edit Modal */}
            {editingProject && (
                <ProjectEditModal
                    project={editingProject}
                    isOpen={!!editingProject}
                    onClose={() => setEditingProject(null)}
                    onSave={async (updatedProject) => {
                        try {
                            await updateProject(editingProject.id, updatedProject);
                            setEditingProject(null);
                        } catch (error) {
                            console.error('Error updating project:', error);
                            alert('Failed to update project.');
                        }
                    }}
                />
            )}
        </div>
    );
};

export default ExecutionProjectsPage;
