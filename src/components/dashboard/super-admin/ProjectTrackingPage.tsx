import React, { useState, useMemo } from 'react';
import { formatDate, formatCurrencyINR } from '../../../constants';
import { useProjects } from '../../../hooks/useProjects';
import { Project, ProjectStatus, UserRole } from '../../../types';
import ProjectDetailModal from './ProjectDetailModal';
import GanttChart from './GanttChart';
import {
    ArrowLeftIcon,
    MagnifyingGlassIcon,
    AdjustmentsHorizontalIcon,
    ListBulletIcon,
    ViewColumnsIcon,
    ChevronRightIcon,
    TrashIcon
} from '@heroicons/react/24/outline';
import { db } from '../../../firebase';
import { deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '../../../context/AuthContext';


import { ContentCard, cn, staggerContainer } from '../shared/DashboardUI';
import { motion, AnimatePresence } from 'framer-motion';

const getStatusConfig = (status: ProjectStatus) => {
    switch (status) {
        case ProjectStatus.IN_EXECUTION: return { color: 'text-amber-500 bg-amber-500/10 border-amber-500/20', label: 'In Execution' };
        case ProjectStatus.COMPLETED: return { color: 'text-green-500 bg-green-500/10 border-green-500/20', label: 'Completed' };
        case ProjectStatus.ON_HOLD: return { color: 'text-slate-500 bg-slate-500/10 border-slate-500/20', label: 'On Hold' };
        case ProjectStatus.PENDING_REVIEW: return { color: 'text-purple-500 bg-purple-500/10 border-purple-500/20', label: 'Reviewing' };
        case ProjectStatus.REJECTED: return { color: 'text-error bg-error/10 border-error/20', label: 'Rejected' };
        default: return { color: 'text-primary bg-primary/10 border-primary/20', label: status };
    }
}

const getProgressColor = (progress: number): string => {
    if (progress < 40) return 'bg-error';
    if (progress < 80) return 'bg-accent';
    return 'bg-secondary';
};

const ProjectTrackingPage: React.FC<{ setCurrentPage: (page: string) => void }> = ({ setCurrentPage }) => {
    const { projects, loading } = useProjects();
    const { currentUser } = useAuth();
    const [view, setView] = useState<'list' | 'gantt'>('list');
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
    const [searchTerm, setSearchTerm] = useState('');

    const handleDeleteProject = async (projectId: string) => {
        if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
            try {
                await deleteDoc(doc(db, 'projects', projectId));
            } catch (error) {
                console.error("Error deleting project:", error);
                alert("Failed to delete project.");
            }
        }
    };

    const filteredProjects = useMemo(() => {
        return projects.filter(project => {
            const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
            const matchesSearch = project.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                project.clientName.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesStatus && matchesSearch;
        });
    }, [projects, statusFilter, searchTerm]);


    return (
        <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="space-y-10"
        >
            {/* Header Module */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border/40 pb-8">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => setCurrentPage('overview')}
                        className="group p-3 rounded-2xl border border-border bg-surface hover:bg-subtle-background hover:scale-105 transition-all text-text-tertiary shadow-sm"
                    >
                        <ArrowLeftIcon className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <h2 className="text-3xl font-serif font-black text-text-primary tracking-tight">Deploy Registry</h2>
                        <p className="text-text-tertiary text-sm font-medium mt-1">Operational footprint tracking & roadmap execution.</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="bg-subtle-background/50 p-1 rounded-2xl border border-border/40 flex">
                        <button
                            onClick={() => setView('list')}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                view === 'list' ? "bg-surface text-primary shadow-sm ring-1 ring-border/20" : "text-text-tertiary hover:text-text-primary"
                            )}
                        >
                            <ListBulletIcon className="w-3.5 h-3.5" />
                            Stream
                        </button>
                        <button
                            onClick={() => setView('gantt')}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                view === 'gantt' ? "bg-surface text-primary shadow-sm ring-1 ring-border/20" : "text-text-tertiary hover:text-text-primary"
                            )}
                        >
                            <ViewColumnsIcon className="w-3.5 h-3.5" />
                            Roadmap
                        </button>
                    </div>
                </div>
            </div>

            {/* Controls Module */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center bg-surface/50 p-6 rounded-3xl border border-border/40 backdrop-blur-sm shadow-xl">
                <div className="md:col-span-1 border-r border-border/40 pr-6 flex items-center justify-center">
                    <AdjustmentsHorizontalIcon className="w-6 h-6 text-primary animate-pulse" />
                </div>
                <div className="md:col-span-7 flex gap-4">
                    <div className="relative flex-1 group">
                        <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Identify project or stakeholder..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-surface border border-border rounded-2xl text-xs font-semibold focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-text-tertiary shadow-inner"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | 'all')}
                        className="px-6 py-3 bg-surface border border-border rounded-2xl text-xs font-black uppercase tracking-widest focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all shadow-inner border-r-[12px] border-r-transparent"
                    >
                        <option value="all">Sectors: All</option>
                        {Object.values(ProjectStatus).map(status => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </select>
                </div>
                <div className="md:col-span-4 text-right">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-tertiary">
                        Showing {filteredProjects.length} Synchronized Units
                    </p>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {view === 'list' ? (
                    <motion.div
                        key="list"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        <ContentCard className="!p-0 overflow-hidden shadow-2xl">
                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="min-w-full">
                                    <thead className="bg-subtle-background/50 border-b border-border/40">
                                        <tr>
                                            <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-widest text-text-tertiary">Strategic Unit</th>
                                            <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-widest text-text-tertiary">Status State</th>
                                            <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-widest text-text-tertiary">Execution Depth</th>
                                            <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-widest text-text-tertiary">Temporal Bound</th>
                                            <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-widest text-text-tertiary">Capital Value</th>
                                            <th className="px-8 py-6 text-center text-[10px] font-black uppercase tracking-widest text-text-tertiary">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/20">
                                        {filteredProjects.map((project, idx) => {
                                            const progress = project.milestones.length > 0
                                                ? Math.round((project.milestones.filter(m => m.completed).length / project.milestones.length) * 100)
                                                : project.progress;
                                            const config = getStatusConfig(project.status);

                                            return (
                                                <motion.tr
                                                    key={project.id}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: idx * 0.03 }}
                                                    onClick={() => setSelectedProject(project)}
                                                    className="group hover:bg-primary/[0.02] cursor-pointer transition-all border-l-2 border-l-transparent hover:border-l-primary"
                                                >
                                                    <td className="px-8 py-6">
                                                        <p className="text-sm font-black text-text-primary mb-1 group-hover:text-primary transition-colors">{project.projectName}</p>
                                                        <p className="text-[10px] font-black uppercase tracking-tighter text-text-tertiary">{project.clientName}</p>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm", config.color)}>
                                                            {config.label}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-6 min-w-[200px]">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex-1 h-2 bg-border/20 rounded-full overflow-hidden shadow-inner">
                                                                <motion.div
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${progress}%` }}
                                                                    className={cn("h-full", getProgressColor(progress))}
                                                                />
                                                            </div>
                                                            <span className="text-[10px] font-black text-text-secondary">{progress}%</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-2 text-text-secondary">
                                                            <span className="text-[10px] font-bold">{formatDate(project.startDate)}</span>
                                                            <span className="text-text-tertiary opacity-40">→</span>
                                                            <span className="text-[10px] font-bold text-text-primary">{formatDate(project.endDate)}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 font-serif font-black text-sm text-text-primary tracking-tight">
                                                        {formatCurrencyINR(project.budget)}
                                                    </td>
                                                    <td className="px-8 py-6 text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <div
                                                                className="w-8 h-8 rounded-xl bg-subtle-background flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all shadow-sm"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedProject(project);
                                                                }}
                                                            >
                                                                <ChevronRightIcon className="w-4 h-4" />
                                                            </div>
                                                            {currentUser?.role === UserRole.SUPER_ADMIN && (
                                                                <div
                                                                    className="w-8 h-8 rounded-xl bg-error/10 flex items-center justify-center text-error hover:bg-error hover:text-white transition-all shadow-sm opacity-0 group-hover:opacity-100"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDeleteProject(project.id);
                                                                    }}
                                                                    title="Delete Project"
                                                                >
                                                                    <TrashIcon className="w-4 h-4" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </ContentCard>
                    </motion.div>
                ) : (
                    <motion.div
                        key="gantt"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                    >
                        <GanttChart projects={filteredProjects} onProjectSelect={setSelectedProject} />
                    </motion.div>
                )}
            </AnimatePresence>

            {selectedProject && (
                <ProjectDetailModal
                    project={selectedProject}
                    isOpen={!!selectedProject}
                    onClose={() => setSelectedProject(null)}
                />
            )}
        </motion.div>
    );
};

export default ProjectTrackingPage;