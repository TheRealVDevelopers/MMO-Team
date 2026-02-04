import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MagnifyingGlassIcon, CalendarIcon, UserIcon, MapPinIcon, ChevronRightIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import { Project, ProjectStatus } from '../../../types';
import ProjectEditModal from './ProjectEditModal';
import { updateProject } from '../../../hooks/useProjects';

interface ExecutionProjectsPageProps {
    onProjectSelect: (projectId: string) => void;
    projects: Project[]; // Accept projects as props instead of fetching
}

const ExecutionProjectsPage: React.FC<ExecutionProjectsPageProps> = ({ onProjectSelect, projects }) => {
    const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active');
    const [groupBy, setGroupBy] = useState<'none' | 'status'>('none');
    const [searchQuery, setSearchQuery] = useState('');
    const [editingProject, setEditingProject] = useState<Project | null>(null);

    // Use projects from props (already filtered by user in parent component)
    const relevantProjects = projects;

    const filteredProjects = relevantProjects.filter(p => {
        const matchesSearch = p.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.clientName.toLowerCase().includes(searchQuery.toLowerCase());

        if (filter === 'active') return matchesSearch && p.status !== ProjectStatus.COMPLETED;
        if (filter === 'completed') return matchesSearch && p.status === ProjectStatus.COMPLETED;
        return matchesSearch;
    });

    // Grouping Logic
    const groupedProjects = React.useMemo(() => {
        if (groupBy === 'none') return { 'All Projects': filteredProjects };

        return filteredProjects.reduce((groups, project) => {
            const key = project.status;
            if (!groups[key]) groups[key] = [];
            groups[key].push(project);
            return groups;
        }, {} as Record<string, typeof filteredProjects>);
    }, [filteredProjects, groupBy]);

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Execution Projects</h1>
                    <p className="text-text-secondary">Manage ongoing site works and schedules</p>
                </div>

                <div className="flex gap-4">
                    {/* Filter Tabs */}
                    <div className="flex bg-subtle-background p-1 rounded-lg">
                        {['active', 'completed', 'all'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f as any)}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filter === f
                                    ? 'bg-surface text-primary shadow-sm'
                                    : 'text-text-secondary hover:text-text-primary'
                                    }`}
                            >
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Search & Group Controls */}
            <div className="flex gap-4">
                <div className="flex-1 bg-surface p-4 rounded-xl shadow-sm border border-border">
                    <div className="relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                        <input
                            type="text"
                            placeholder="Search projects..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-surface text-text-primary"
                        />
                    </div>
                </div>
                <div className="bg-surface p-4 rounded-xl shadow-sm border border-border flex items-center gap-2">
                    <span className="text-sm text-text-secondary">Group By:</span>
                    <select
                        value={groupBy}
                        onChange={(e) => setGroupBy(e.target.value as any)}
                        className="p-2 border border-border rounded-lg bg-surface text-text-primary text-sm"
                    >
                        <option value="none">None</option>
                        <option value="status">Status</option>
                    </select>
                </div>
            </div>

            {/* Projects Grid */}
            <div className="space-y-8">
                {Object.entries(groupedProjects).map(([groupTitle, projects]) => (
                    <div key={groupTitle}>
                        {groupBy !== 'none' && (
                            <h2 className="text-lg font-bold text-text-primary mb-4 border-b border-border pb-2">
                                {groupTitle} <span className="text-sm font-normal text-text-secondary">({projects.length})</span>
                            </h2>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {projects.map((project) => (
                                <motion.div
                                    key={project.id}
                                    layoutId={project.id}
                                    className="bg-surface rounded-xl shadow-sm border border-border hover:shadow-md transition-all p-6 group relative"
                                >
                                    {/* Edit Button - Top Right */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingProject(project);
                                        }}
                                        className="absolute top-4 right-4 p-2 rounded-lg bg-primary-subtle text-primary hover:bg-primary/20 transition-all opacity-0 group-hover:opacity-100 z-10"
                                        title="Edit Project"
                                    >
                                        <PencilSquareIcon className="w-5 h-5" />
                                    </button>

                                    <div
                                        onClick={() => onProjectSelect(project.id)}
                                        className="cursor-pointer"
                                    >
                                        <div className="flex justify-between items-start mb-4 pr-12">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold
                                                ${project.status === ProjectStatus.IN_EXECUTION ? 'bg-success-subtle text-success' :
                                                    project.status === ProjectStatus.APPROVED ? 'bg-primary-subtle text-primary' :
                                                        'bg-subtle-background text-text-secondary'
                                                }`}>
                                                {project.status}
                                            </span>
                                            <span className="text-xs text-text-tertiary">ID: {project.id.slice(0, 8)}</span>
                                        </div>

                                        <h3 className="text-lg font-bold text-text-primary mb-1 group-hover:text-primary transition-colors">
                                            {project.projectName}
                                        </h3>
                                        <p className="text-sm text-text-secondary mb-4">{project.clientName}</p>

                                        <div className="space-y-3 mb-6">
                                            <div className="flex items-center gap-2 text-sm text-text-secondary">
                                                <MapPinIcon className="w-4 h-4 text-text-tertiary" />
                                                <span className="line-clamp-1">{project.clientAddress}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-text-secondary">
                                                <CalendarIcon className="w-4 h-4 text-text-tertiary" />
                                                <span>Deadline: {new Date(project.endDate).toLocaleDateString()}</span>
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="mb-4">
                                            <div className="flex justify-between text-xs mb-1">
                                                <span className="text-text-secondary">Completion</span>
                                                <span className="font-medium text-text-primary">{project.progress}%</span>
                                            </div>
                                            <div className="w-full bg-subtle-background rounded-full h-2">
                                                <div
                                                    className="bg-primary h-2 rounded-full transition-all duration-500"
                                                    style={{ width: `${project.progress}%` }}
                                                />
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-border flex justify-between items-center text-sm font-medium text-primary">
                                            View Dashboard
                                            <ChevronRightIcon className="w-4 h-4" />
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Edit Modal */}
            {editingProject && (
                <ProjectEditModal
                    project={editingProject}
                    isOpen={!!editingProject}
                    onClose={() => setEditingProject(null)}
                    onSave={async (updatedProject) => {
                        try {
                            // Update project in Firestore
                            await updateProject(editingProject.id, updatedProject);
                            console.log('Project updated successfully in Firestore');
                            setEditingProject(null);
                            // Projects will auto-refresh via useProjects hook in parent
                        } catch (error) {
                            console.error('Error updating project:', error);
                            alert('Failed to update project. Please try again.');
                        }
                    }}
                />
            )}
        </div>
    );
};

export default ExecutionProjectsPage;
