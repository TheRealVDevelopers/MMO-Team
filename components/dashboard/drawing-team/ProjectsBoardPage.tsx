import React from 'react';
import { Project, ProjectStatus } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { useProjects } from '../../../hooks/useProjects';
import { ClockIcon, FireIcon, PaperClipIcon, ArrowLeftIcon, EllipsisVerticalIcon } from '../../icons/IconComponents';

const KANBAN_COLUMNS: { id: string, title: string, statuses: ProjectStatus[] }[] = [
    { id: 'todo', title: 'To Do', statuses: [ProjectStatus.AWAITING_DESIGN] },
    { id: 'in-design', title: 'In Design', statuses: [ProjectStatus.DESIGN_IN_PROGRESS] },
    { id: 'review', title: 'Under Review', statuses: [ProjectStatus.PENDING_REVIEW] },
    { id: 'revisions', title: 'Revisions', statuses: [ProjectStatus.REVISIONS_REQUESTED] },
    { id: 'completed', title: 'Completed', statuses: [ProjectStatus.COMPLETED] },
];

const ProjectCard: React.FC<{ project: Project; onSelect: () => void; }> = ({ project, onSelect }) => {
    const daysInStage = Math.floor((new Date().getTime() - project.startDate.getTime()) / (1000 * 3600 * 24));

    const handleActionClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onSelect();
    };

    return (
        <div onClick={onSelect} className="bg-surface p-3 rounded-md border border-border space-y-3 cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1 group relative">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-bold text-text-primary pr-6">{project.projectName}</p>
                    <p className="text-xs text-text-secondary">{project.clientName}</p>
                </div>
                {project.priority === 'High' && <FireIcon className="text-error" />}
            </div>

            <button
                onClick={handleActionClick}
                className="absolute top-2 right-2 p-1 rounded-full text-text-secondary hover:bg-subtle-background hover:text-text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Open project details"
            >
                <EllipsisVerticalIcon className="w-5 h-5" />
            </button>

            <div className="flex justify-between items-center text-xs text-text-secondary border-t border-border pt-2">
                <div className="flex items-center space-x-1">
                    <ClockIcon className="w-4 h-4" />
                    <span>{daysInStage}d in stage</span>
                </div>
                <div className="flex items-center space-x-1">
                    <PaperClipIcon className="w-4 h-4" />
                    <span>3</span>
                </div>
            </div>
        </div>
    );
};

const ProjectsBoardPage: React.FC<{ onProjectSelect: (project: Project) => void; setCurrentPage: (page: string) => void; }> = ({ onProjectSelect, setCurrentPage }) => {
    const { currentUser } = useAuth();
    const { projects, loading } = useProjects(currentUser?.id); // Fix: useProjects takes an optional userId

    if (!currentUser) return null;

    if (loading) {
        return (
            <div className="flex-grow flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                    <p className="text-text-secondary text-sm">Loading projects board...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => setCurrentPage('overview')}
                    className="flex items-center space-x-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
                >
                    <ArrowLeftIcon className="w-5 h-5" />
                    <span>Back</span>
                </button>
                <h2 className="text-2xl font-bold text-text-primary">Projects Board</h2>
            </div>
            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 overflow-hidden">
                {KANBAN_COLUMNS.map(column => (
                    <div key={column.id} className="bg-subtle-background rounded-lg p-3 flex flex-col overflow-hidden">
                        <h3 className="font-bold text-sm mb-3 px-1 flex items-center justify-between">
                            <span>{column.title}</span>
                            <span className="text-[10px] bg-white px-2 py-0.5 rounded-full text-text-secondary border border-border">
                                {projects.filter(p => column.statuses.includes(p.status)).length}
                            </span>
                        </h3>
                        <div className="space-y-3 flex-grow overflow-y-auto pr-1 pb-4">
                            {projects
                                .filter(p => column.statuses.includes(p.status))
                                .map(project => (
                                    <ProjectCard key={project.id} project={project} onSelect={() => onProjectSelect(project)} />
                                ))
                            }
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProjectsBoardPage;