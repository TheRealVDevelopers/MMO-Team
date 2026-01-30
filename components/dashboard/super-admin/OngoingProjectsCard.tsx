import React from 'react';
import { useProjects } from '../../../hooks/useProjects';
import { Project, ProjectStatus } from '../../../types';
import { RocketLaunchIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { ContentCard, cn } from '../shared/DashboardUI';
import { motion } from 'framer-motion';

const getPhase = (progress: number) => {
    if (progress <= 20) return "Mobilization";
    if (progress <= 40) return "Design Finalization";
    if (progress <= 60) return "Procurement & Sourcing";
    if (progress <= 80) return "Structural Execution";
    if (progress <= 95) return "Finishing & snagging";
    return "Closure & Handover";
};

interface OngoingProjectsCardProps {
    onProjectSelect?: (project: Project) => void;
}

const OngoingProjectsCard: React.FC<OngoingProjectsCardProps> = ({ onProjectSelect }) => {
    const { projects } = useProjects();
    const ongoingProjects = projects.filter(p =>
        p.status === ProjectStatus.IN_EXECUTION ||
        p.status === ProjectStatus.PROCUREMENT ||
        p.status === ProjectStatus.DESIGN_IN_PROGRESS
    );

    return (
        <ContentCard>
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-border/40">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
                        <RocketLaunchIcon className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-xl font-serif font-bold text-text-primary tracking-tight">Ongoing Missions</h3>
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-tertiary">Real-time Project Trajectory</p>
                    </div>
                </div>
                <button className="text-[10px] font-black uppercase tracking-widest text-text-tertiary hover:text-primary transition-colors flex items-center gap-1 group">
                    View Registry
                    <ChevronRightIcon className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>

            <div className="space-y-6 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                {ongoingProjects.map((project, idx) => {
                    const phase = getPhase(project.progress);
                    return (
                        <motion.div
                            key={project.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className={cn(
                                "group rounded-xl p-2 -mx-2 transition-colors",
                                onProjectSelect ? "cursor-pointer hover:bg-subtle-background" : ""
                            )}
                            onClick={() => onProjectSelect?.(project)}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div>
                                    <h4 className="text-sm font-bold text-text-primary group-hover:text-primary transition-colors">{project.projectName}</h4>
                                    <p className="text-[10px] font-medium text-text-tertiary uppercase tracking-tighter">{project.clientName}</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] font-black text-text-primary bg-subtle-background px-2 py-1 rounded-lg border border-border/40">
                                        PHASE: {phase.toUpperCase()}
                                    </span>
                                </div>
                            </div>

                            <div className="relative h-2 w-full bg-subtle-background rounded-full overflow-hidden border border-border/20 shadow-inner">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${project.progress}%` }}
                                    transition={{ duration: 1.5, ease: "easeOut", delay: idx * 0.1 }}
                                    className={cn(
                                        "h-full rounded-full shadow-lg",
                                        project.progress > 80 ? "bg-secondary" :
                                            project.progress > 40 ? "bg-primary" : "bg-accent"
                                    )}
                                />
                            </div>
                            <div className="flex justify-between mt-1.5">
                                <span className="text-[10px] font-black text-text-tertiary tabular-nums tracking-widest">{project.progress}% SYNC</span>
                                <span className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">ETA: {project.deadline || 'TBA'}</span>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </ContentCard>
    );
};

export default OngoingProjectsCard;
