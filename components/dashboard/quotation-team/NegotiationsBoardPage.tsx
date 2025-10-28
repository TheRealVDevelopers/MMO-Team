import React from 'react';
import { PROJECTS, formatCurrencyINR } from '../../../constants';
import { Project, ProjectStatus } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { ClockIcon, FireIcon, CheckCircleIcon, XCircleIcon, ArrowLeftIcon, EllipsisVerticalIcon } from '../../icons/IconComponents';

const KANBAN_COLUMNS: { id: string, title: string, statuses: ProjectStatus[] }[] = [
    { id: 'sent', title: 'Sent to Client', statuses: [ProjectStatus.QUOTATION_SENT] },
    { id: 'negotiating', title: 'Under Negotiation', statuses: [ProjectStatus.NEGOTIATING] },
    { id: 'won', title: 'Success / Won', statuses: [ProjectStatus.APPROVED] },
    { id: 'lost', title: 'Lost', statuses: [ProjectStatus.REJECTED] },
];

const ProjectCard: React.FC<{ project: Project; onSelect: () => void; }> = ({ project, onSelect }) => {
    const daysInStage = Math.floor((new Date().getTime() - project.startDate.getTime()) / (1000 * 3600 * 24));
    
    let icon = null;
    if(project.status === ProjectStatus.APPROVED) icon = <CheckCircleIcon className="text-secondary" />;
    if(project.status === ProjectStatus.REJECTED) icon = <XCircleIcon className="text-error" />;

    const handleActionClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onSelect();
    };
    
    return (
        <div onClick={onSelect} className="bg-surface p-3 rounded-md border border-border space-y-3 cursor-pointer hover:shadow-lg transition-shadow group relative">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-bold text-text-primary pr-6">{project.projectName}</p>
                    <p className="text-xs text-text-secondary">{project.clientName}</p>
                </div>
                {icon ? icon : project.priority === 'High' && <FireIcon className="text-error" />}
            </div>

            <button 
                onClick={handleActionClick}
                className="absolute top-2 right-2 p-1 rounded-full text-text-secondary hover:bg-subtle-background hover:text-text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Open project details"
            >
                <EllipsisVerticalIcon className="w-5 h-5" />
            </button>

             <p className="text-xl font-bold text-primary">{formatCurrencyINR(project.budget)}</p>
            <div className="flex justify-between items-center text-xs text-text-secondary border-t border-border pt-2">
                <div className="flex items-center space-x-1">
                    <ClockIcon className="w-4 h-4" />
                    <span>{daysInStage}d in stage</span>
                </div>
            </div>
        </div>
    );
};

const NegotiationsBoardPage: React.FC<{ onProjectSelect: (project: Project) => void; setCurrentPage: (page: string) => void; }> = ({ onProjectSelect, setCurrentPage }) => {
    const { currentUser } = useAuth();
    if (!currentUser) return null;

    const myProjects = PROJECTS.filter(p => p.assignedTeam.quotation === currentUser.id);

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
                <h2 className="text-2xl font-bold text-text-primary">Negotiations Board</h2>
            </div>
            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {KANBAN_COLUMNS.map(column => (
                    <div key={column.id} className="bg-subtle-background rounded-lg p-3 flex flex-col">
                        <h3 className="font-bold text-sm mb-3 px-1">{column.title}</h3>
                        <div className="space-y-3 flex-grow overflow-y-auto pr-1">
                            {myProjects
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

export default NegotiationsBoardPage;