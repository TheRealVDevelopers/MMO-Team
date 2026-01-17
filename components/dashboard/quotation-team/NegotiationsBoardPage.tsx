import React from 'react';
import { formatCurrencyINR } from '../../../constants';
import { Project, ProjectStatus } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { ClockIcon, FireIcon, CheckCircleIcon, XCircleIcon, ArrowLeftIcon, EllipsisVerticalIcon, PlusIcon } from '../../icons/IconComponents';

const KANBAN_COLUMNS: { id: string, title: string, statuses: ProjectStatus[] }[] = [
    { id: 'draft', title: 'New / In-Prep', statuses: [ProjectStatus.AWAITING_QUOTATION] },
    { id: 'sent', title: 'Sent to Client', statuses: [ProjectStatus.QUOTATION_SENT] },
    { id: 'negotiating', title: 'Under Negotiation', statuses: [ProjectStatus.NEGOTIATING] },
    { id: 'won', title: 'Success / Won', statuses: [ProjectStatus.APPROVED] },
];

const ProjectCard: React.FC<{ project: Project; onSelect: () => void; }> = ({ project, onSelect }) => {
    const daysInStage = Math.floor((new Date().getTime() - new Date(project.startDate).getTime()) / (1000 * 3600 * 24));

    const bestOffer = project.counterOffers && project.counterOffers.length > 0
        ? Math.min(...project.counterOffers.map(o => o.amount))
        : null;

    let icon = null;
    if (project.status === ProjectStatus.APPROVED) icon = <CheckCircleIcon className="text-secondary" />;
    if (project.status === ProjectStatus.REJECTED) icon = <XCircleIcon className="text-error" />;

    const handleActionClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onSelect();
    };

    return (
        <div onClick={onSelect} className="bg-surface p-4 rounded-xl border border-border space-y-3 cursor-pointer hover:shadow-xl transition-all group relative overflow-hidden">
            <div className="flex justify-between items-start">
                <div className="min-w-0">
                    <p className="text-sm font-bold text-text-primary truncate pr-6">{project.projectName}</p>
                    <p className="text-[10px] text-text-secondary truncate">{project.clientName}</p>
                </div>
                {icon ? icon : project.priority === 'High' && <FireIcon className="text-error" />}
            </div>

            <button
                onClick={handleActionClick}
                className="absolute top-2 right-2 p-1 rounded-full text-text-secondary hover:bg-subtle-background hover:text-text-primary opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <EllipsisVerticalIcon className="w-5 h-5" />
            </button>

            <div className="space-y-1">
                <p className="text-lg font-black text-primary">{formatCurrencyINR(project.budget)}</p>
                {bestOffer ? (
                    <div className="flex items-center gap-1.5 py-1 px-2 bg-secondary/10 rounded-lg animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                        <p className="text-[10px] font-bold text-secondary">Best Ask: {formatCurrencyINR(bestOffer)}</p>
                    </div>
                ) : project.items && project.items.length > 0 ? (
                    <p className="text-[10px] text-text-tertiary">{project.items.length} products quoted</p>
                ) : null}
            </div>

            <div className="flex justify-between items-center text-[10px] text-text-secondary border-t border-border pt-2">
                <div className="flex items-center space-x-1">
                    <ClockIcon className="w-3.5 h-3.5" />
                    <span>{daysInStage}d active</span>
                </div>
                {bestOffer && (
                    <span className="px-2 py-0.5 bg-secondary text-white rounded-full font-bold text-[8px] uppercase tracking-wider">Negotiation</span>
                )}
            </div>
        </div>
    );
};

const NegotiationsBoardPage: React.FC<{
    projects: Project[];
    onProjectSelect: (project: Project) => void;
    setCurrentPage: (page: string) => void;
    onCreateProject: () => void;
}> = ({ projects, onProjectSelect, setCurrentPage, onCreateProject }) => {
    const { currentUser } = useAuth();
    if (!currentUser) return null;

    const myProjects = projects.filter(p => p.assignedTeam.quotation === currentUser.id);
    const totalValue = myProjects.reduce((sum, p) => sum + p.budget, 0);
    const activeNegotiations = myProjects.filter(p => (p.counterOffers?.length ?? 0) > 0).length;

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setCurrentPage('overview')}
                        className="flex items-center space-x-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
                    >
                        <ArrowLeftIcon className="w-5 h-5" />
                        <span>Back</span>
                    </button>
                    <h2 className="text-2xl font-black text-text-primary tracking-tight">Negotiations Control</h2>
                </div>
                <button
                    onClick={onCreateProject}
                    className="flex items-center space-x-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-black shadow-xl shadow-primary/30 hover:bg-secondary hover:-translate-y-0.5 transition-all active:translate-y-0"
                >
                    <PlusIcon className="w-5 h-5" />
                    <span>Create New Quotation</span>
                </button>
            </div>

            {/* Industry Standard Stats Bar */}
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-surface border border-border p-4 rounded-2xl shadow-sm">
                    <p className="text-[10px] font-black uppercase text-text-secondary mb-1">Total Pipeline</p>
                    <p className="text-xl font-bold text-text-primary">{formatCurrencyINR(totalValue)}</p>
                </div>
                <div className="bg-surface border border-border p-4 rounded-2xl shadow-sm">
                    <p className="text-[10px] font-black uppercase text-text-secondary mb-1">Active Bids</p>
                    <p className="text-xl font-bold text-text-primary">{myProjects.length}</p>
                </div>
                <div className="bg-surface border border-border p-4 rounded-2xl shadow-sm border-l-4 border-l-secondary">
                    <p className="text-[10px] font-black uppercase text-secondary mb-1">Negotiations Active</p>
                    <p className="text-xl font-bold text-text-primary">{activeNegotiations}</p>
                </div>
                <div className="bg-surface border border-border p-4 rounded-2xl shadow-sm">
                    <p className="text-[10px] font-black uppercase text-text-secondary mb-1">Avg. Conversion</p>
                    <p className="text-xl font-bold text-text-primary">64%</p>
                </div>
            </div>

            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 min-h-0">
                {KANBAN_COLUMNS.map(column => (
                    <div key={column.id} className="bg-subtle-background/50 rounded-2xl p-4 flex flex-col border border-border/50">
                        <div className="flex justify-between items-center mb-4 px-1">
                            <h3 className="font-black text-[10px] uppercase tracking-widest text-text-secondary">{column.title}</h3>
                            <span className="bg-white/50 text-[10px] font-bold px-2 py-0.5 rounded-full border border-border">
                                {myProjects.filter(p => column.statuses.includes(p.status)).length}
                            </span>
                        </div>
                        <div className="space-y-4 flex-grow overflow-y-auto pr-1 custom-scrollbar">
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