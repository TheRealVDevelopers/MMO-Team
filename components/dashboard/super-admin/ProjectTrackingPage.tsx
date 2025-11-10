import React, { useState, useMemo } from 'react';
import Card from '../../shared/Card';
import { PROJECTS, formatDate, formatCurrencyINR } from '../../../constants';
import { Project, ProjectStatus } from '../../../types';
import ProgressBar from '../../shared/ProgressBar';
import StatusPill from '../../shared/StatusPill';
import ProjectDetailModal from './ProjectDetailModal';
import GanttChart from './GanttChart';
import { ArrowLeftIcon } from '../../icons/IconComponents';

const getStatusPillColor = (status: ProjectStatus): 'blue' | 'amber' | 'green' | 'red' | 'slate' | 'purple' => {
    switch (status) {
        case ProjectStatus.IN_EXECUTION: return 'amber';
        case ProjectStatus.COMPLETED: return 'green';
        case ProjectStatus.ON_HOLD: return 'slate';
        case ProjectStatus.PENDING_REVIEW: return 'purple';
        case ProjectStatus.REJECTED: return 'red';
        default: return 'blue';
    }
}

const getProgressColor = (progress: number): string => {
    if (progress < 40) return 'bg-error';
    if (progress < 80) return 'bg-accent';
    return 'bg-secondary';
};

const ProjectTrackingPage: React.FC<{ setCurrentPage: (page: string) => void }> = ({ setCurrentPage }) => {
    const [view, setView] = useState<'list' | 'gantt'>('list');
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');

    const filteredProjects = useMemo(() => {
        if (statusFilter === 'all') {
            return PROJECTS;
        }
        return PROJECTS.filter(project => project.status === statusFilter);
    }, [statusFilter]);


    return (
        <>
        <div className="space-y-6">
            <div className="sm:flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setCurrentPage('overview')}
                        className="flex items-center space-x-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
                    >
                        <ArrowLeftIcon className="w-5 h-5" />
                        <span>Back</span>
                    </button>
                    <h2 className="text-2xl font-bold text-text-primary">Project Tracking</h2>
                </div>
                <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                    {view === 'list' && (
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | 'all')}
                            className="px-3 py-1.5 border border-border rounded-md text-sm bg-surface focus:ring-primary focus:border-primary"
                            aria-label="Filter projects by status"
                        >
                            <option value="all">All Statuses</option>
                            {Object.values(ProjectStatus).map(status => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                    )}
                    <div className="flex space-x-1 p-1 bg-subtle-background rounded-lg">
                        <button onClick={() => setView('list')} className={`px-3 py-1 text-sm font-medium rounded-md ${view === 'list' ? 'bg-surface shadow' : 'text-text-secondary'}`}>List View</button>
                        <button onClick={() => setView('gantt')} className={`px-3 py-1 text-sm font-medium rounded-md ${view === 'gantt' ? 'bg-surface shadow' : 'text-text-secondary'}`}>Gantt View</button>
                    </div>
                </div>
            </div>
            
            {view === 'list' && (
                <Card>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-border">
                            <thead className="bg-subtle-background">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Project Name</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Status</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Progress</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Timeline</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Budget</th>
                                </tr>
                            </thead>
                            <tbody className="bg-surface divide-y divide-border">
                                {filteredProjects.map((project) => {
                                    const progress = project.milestones.length > 0
                                        ? Math.round((project.milestones.filter(m => m.completed).length / project.milestones.length) * 100)
                                        : project.progress;

                                    return (
                                        <tr key={project.id} onClick={() => setSelectedProject(project)} className="hover:bg-subtle-background cursor-pointer">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-text-primary">{project.projectName}</div>
                                                <div className="text-xs text-text-secondary">{project.clientName}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <StatusPill color={getStatusPillColor(project.status)}>{project.status}</StatusPill>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="w-32">
                                                    <ProgressBar progress={progress} colorClass={getProgressColor(progress)} />
                                                    </div>
                                                    <span className="text-sm ml-2 text-text-secondary">{progress}%</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                                                {formatDate(project.startDate)} - {formatDate(project.endDate)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">
                                                {formatCurrencyINR(project.budget)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {view === 'gantt' && (
                <Card className="p-0 overflow-hidden">
                    <div className="overflow-x-auto">
                      <GanttChart projects={filteredProjects} onProjectSelect={setSelectedProject} />
                    </div>
                </Card>
            )}
        </div>
        {selectedProject && (
            <ProjectDetailModal 
                project={selectedProject}
                isOpen={!!selectedProject}
                onClose={() => setSelectedProject(null)}
            />
        )}
        </>
    );
};

export default ProjectTrackingPage;