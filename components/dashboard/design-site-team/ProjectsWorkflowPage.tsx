import React, { useState, useMemo } from 'react';
import { Project, LeadPipelineStatus, Task, TaskStatus } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { useMyDayTasks } from '../../../hooks/useMyDayTasks';
import Card from '../../shared/Card';
import { ContentCard, StatCard, SectionHeader, PrimaryButton, cn, staggerContainer } from '../shared/DashboardUI';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import {
    ClipboardDocumentListIcon,
    MapPinIcon,
    PencilSquareIcon,
    CheckCircleIcon,
    ClockIcon,
    ExclamationTriangleIcon,
    ChevronRightIcon,
    PlayIcon
} from '@heroicons/react/24/outline';
import { formatDateTime, USERS } from '../../../constants';

// Animation variant
const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

// Stage definitions for the workflow
const WORKFLOW_STAGES = [
    {
        id: 'site-inspection',
        label: 'Waiting for Site Inspection',
        icon: MapPinIcon,
        color: 'text-amber-500',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/30'
    },
    {
        id: 'drawing',
        label: 'Waiting for Drawing',
        icon: PencilSquareIcon,
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/30'
    },
    {
        id: 'completed',
        label: 'Completed',
        icon: CheckCircleIcon,
        color: 'text-green-500',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500/30'
    }
];

interface ProjectsWorkflowPageProps {
    projects: Project[];
    loading: boolean;
    onUpdateProject: (projectId: string, updates: Partial<Project>) => Promise<void>;
    setCurrentPage: (page: string) => void;
}

// Helper to determine which stage a project is in
const getProjectStage = (project: Project): string => {
    // Check if site inspection is done
    const hasSiteInspection = project.siteInspectionDate != null;
    const hasDrawing = project.drawingSubmittedAt != null;

    if (hasDrawing) return 'completed';
    if (hasSiteInspection) return 'drawing';
    return 'site-inspection';
};

const ProjectCard: React.FC<{
    project: Project;
    stage: string;
    onAction: (project: Project, action: string) => void;
}> = ({ project, stage, onAction }) => {
    const stageConfig = WORKFLOW_STAGES.find(s => s.id === stage);
    const Icon = stageConfig?.icon || ClipboardDocumentListIcon;

    // Check if drawing deadline is approaching (24 hours)
    const isDrawingUrgent = stage === 'drawing' && project.siteInspectionDate &&
        (new Date().getTime() - new Date(project.siteInspectionDate).getTime()) > 20 * 60 * 60 * 1000; // 20 hours

    return (
        <motion.div variants={fadeInUp}>
            <Card className={cn(
                "p-4 hover:shadow-lg transition-all border-l-4 group cursor-pointer",
                stageConfig?.borderColor,
                isDrawingUrgent && "border-l-error animate-pulse"
            )}>
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <Icon className={cn("w-5 h-5", stageConfig?.color)} />
                            <span className={cn(
                                "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
                                stageConfig?.bgColor,
                                stageConfig?.color
                            )}>
                                {stageConfig?.label}
                            </span>
                            {isDrawingUrgent && (
                                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-error/10 text-error flex items-center gap-1">
                                    <ExclamationTriangleIcon className="w-3 h-3" />
                                    Urgent
                                </span>
                            )}
                        </div>

                        <h3 className="text-lg font-bold text-text-primary mb-1 group-hover:text-primary transition-colors">
                            {project.projectName}
                        </h3>
                        <p className="text-sm text-text-secondary mb-2">
                            Client: {project.clientName}
                        </p>

                        <div className="flex items-center gap-4 text-xs text-text-tertiary">
                            <span className="flex items-center gap-1">
                                <ClockIcon className="w-3.5 h-3.5" />
                                {formatDateTime(project.createdAt || new Date())}
                            </span>
                            {project.assignedEngineerId && (
                                <span>
                                    Engineer: {USERS.find(u => u.id === project.assignedEngineerId)?.name}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        {stage === 'site-inspection' && (
                            <PrimaryButton
                                onClick={() => onAction(project, 'complete-inspection')}
                                className="text-xs px-3 py-1.5"
                            >
                                <CheckCircleIcon className="w-4 h-4 mr-1" />
                                Complete Inspection
                            </PrimaryButton>
                        )}
                        {stage === 'drawing' && (
                            <PrimaryButton
                                onClick={() => onAction(project, 'submit-drawing')}
                                className="text-xs px-3 py-1.5"
                            >
                                <PlayIcon className="w-4 h-4 mr-1" />
                                Submit Drawing
                            </PrimaryButton>
                        )}
                        <ChevronRightIcon className="w-5 h-5 text-text-tertiary group-hover:text-primary transition-all group-hover:translate-x-1" />
                    </div>
                </div>
            </Card>
        </motion.div>
    );
};

const ProjectsWorkflowPage: React.FC<ProjectsWorkflowPageProps> = ({
    projects,
    loading,
    onUpdateProject,
    setCurrentPage
}) => {
    const { currentUser } = useAuth();
    const { addTask } = useMyDayTasks(currentUser?.id || '');
    const [activeStage, setActiveStage] = useState<string | null>(null);

    // Group projects by stage
    const projectsByStage = useMemo(() => {
        const grouped: Record<string, Project[]> = {
            'site-inspection': [],
            'drawing': [],
            'completed': []
        };

        projects.forEach(project => {
            const stage = getProjectStage(project);
            grouped[stage].push(project);
        });

        return grouped;
    }, [projects]);

    // Handle project actions
    const handleProjectAction = async (project: Project, action: string) => {
        if (action === 'complete-inspection') {
            // Mark site inspection as complete
            await onUpdateProject(project.id, {
                siteInspectionDate: new Date(),
            });

            // Auto-create "Start Drawing" task with 24-hour deadline
            const deadline = new Date();
            deadline.setHours(deadline.getHours() + 24);

            await addTask({
                title: `Start Drawing - ${project.projectName}`,
                description: `Complete the drawing for ${project.clientName}'s project. This task will become a red flag if not completed within 24 hours.`,
                status: TaskStatus.PENDING,
                priority: 'High',
                date: new Date().toISOString().split('T')[0],
                userId: currentUser?.id || '',
                contextId: project.id,
                contextType: 'project',
                deadline: deadline.toISOString(),
                timeSpent: 0,
                isPaused: false,
                createdAt: new Date(),
            });
        } else if (action === 'submit-drawing') {
            // Mark drawing as submitted
            await onUpdateProject(project.id, {
                drawingSubmittedAt: new Date(),
            });
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                <p className="text-text-secondary animate-pulse">Loading projects...</p>
            </div>
        );
    }

    return (
        <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-8"
        >
            {/* KPI Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {WORKFLOW_STAGES.map(stage => (
                    <StatCard
                        key={stage.id}
                        title={stage.label}
                        value={projectsByStage[stage.id].length.toString()}
                        icon={<stage.icon className="w-6 h-6" />}
                        color={stage.id === 'site-inspection' ? 'accent' : stage.id === 'drawing' ? 'primary' : 'secondary'}
                        onClick={() => setActiveStage(activeStage === stage.id ? null : stage.id)}
                    />
                ))}
            </div>

            {/* Project Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {WORKFLOW_STAGES.map(stage => (
                    <ContentCard
                        key={stage.id}
                        className={cn(
                            "transition-all",
                            activeStage && activeStage !== stage.id && "opacity-50"
                        )}
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <stage.icon className={cn("w-5 h-5", stage.color)} />
                            <h3 className="text-lg font-serif font-bold text-text-primary">
                                {stage.label}
                            </h3>
                            <span className={cn(
                                "ml-auto text-sm font-bold px-2 py-0.5 rounded-full",
                                stage.bgColor,
                                stage.color
                            )}>
                                {projectsByStage[stage.id].length}
                            </span>
                        </div>

                        <div className="space-y-4 max-h-[500px] overflow-y-auto">
                            <AnimatePresence>
                                {projectsByStage[stage.id].length === 0 ? (
                                    <div className="text-center py-8 text-text-tertiary">
                                        <ClipboardDocumentListIcon className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                        <p className="text-sm">No projects in this stage</p>
                                    </div>
                                ) : (
                                    projectsByStage[stage.id].map(project => (
                                        <ProjectCard
                                            key={project.id}
                                            project={project}
                                            stage={stage.id}
                                            onAction={handleProjectAction}
                                        />
                                    ))
                                )}
                            </AnimatePresence>
                        </div>
                    </ContentCard>
                ))}
            </div>
        </motion.div>
    );
};

export default ProjectsWorkflowPage;
