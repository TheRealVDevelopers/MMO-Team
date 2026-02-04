import React, { useState, useMemo } from 'react';
import { Project, LeadPipelineStatus, Task, TaskStatus, ProjectStatus } from '../../../types';
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
import BOQSubmissionModal from '../drawing-team/BOQSubmissionModal';
import DrawingUploadModal from '../drawing-team/DrawingUploadModal';

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

// Status values for site inspection stage (handle both enum and string values from Firebase)
const SITE_INSPECTION_STATUSES = [
    ProjectStatus.SITE_VISIT_PENDING,
    ProjectStatus.SITE_VISIT_RESCHEDULED,
    'Site Visit Pending',
    'Site Visit Rescheduled',
    'SITE_VISIT_PENDING',
    'SITE_VISIT_RESCHEDULED'
];

// Status values for drawing stage
const DRAWING_STATUSES = [
    ProjectStatus.DRAWING_PENDING,
    ProjectStatus.DESIGN_IN_PROGRESS,
    ProjectStatus.REVISIONS_IN_PROGRESS,
    ProjectStatus.AWAITING_DESIGN,
    'Drawing Pending',
    'Design In Progress',
    'Revisions In Progress',
    'Awaiting Design',
    'DRAWING_PENDING',
    'DESIGN_IN_PROGRESS',
    'REVISIONS_IN_PROGRESS',
    'AWAITING_DESIGN',
    'Waiting for Drawing',
    'WAITING_FOR_DRAWING'
];

// Status values for completed stage
const COMPLETED_STATUSES = [
    ProjectStatus.AWAITING_QUOTATION,
    ProjectStatus.BOQ_PENDING,
    ProjectStatus.COMPLETED,
    ProjectStatus.QUOTATION_SENT,
    ProjectStatus.NEGOTIATING,
    ProjectStatus.APPROVED,
    ProjectStatus.PROCUREMENT,
    ProjectStatus.IN_EXECUTION,
    'Awaiting Quotation',
    'BOQ Pending',
    'Completed',
    'Quotation Sent',
    'Negotiating',
    'Approved',
    'Procurement',
    'In Execution',
    'AWAITING_QUOTATION',
    'BOQ_PENDING',
    'COMPLETED'
];

// Helper to determine which stage a project is in
const getProjectStage = (project: Project): string => {
    const status = project.status;
    
    // Debug logging for troubleshooting
    console.log(`[getProjectStage] Project: ${project.projectName}, Status: "${status}", Type: ${typeof status}`);
    
    // First check project status for explicit workflow stages
    // Use includes() for robust string matching
    if (status && SITE_INSPECTION_STATUSES.includes(status as any)) {
        console.log(`[getProjectStage] -> site-inspection (matched status)`);
        return 'site-inspection';
    }
    
    if (status && DRAWING_STATUSES.includes(status as any)) {
        console.log(`[getProjectStage] -> drawing (matched status)`);
        return 'drawing';
    }
    
    if (status && COMPLETED_STATUSES.includes(status as any)) {
        console.log(`[getProjectStage] -> completed (matched status)`);
        return 'completed';
    }
    
    // Fallback to date-based checks for backward compatibility
    const hasSiteInspection = project.siteInspectionDate != null;
    const hasDrawing = project.drawingSubmittedAt != null;

    if (hasDrawing) {
        console.log(`[getProjectStage] -> completed (has drawing date)`);
        return 'completed';
    }
    if (hasSiteInspection) {
        console.log(`[getProjectStage] -> drawing (has inspection date)`);
        return 'drawing';
    }
    
    // Default fallback - new projects go to site-inspection
    console.log(`[getProjectStage] -> site-inspection (fallback default)`);
    return 'site-inspection';
};

const ProjectCard: React.FC<{
    project: Project;
    stage: string;
    onAction: (project: Project, action: string) => void;
}> = ({ project, stage, onAction }) => {
    const stageConfig = WORKFLOW_STAGES.find(s => s.id === stage);
    const Icon = stageConfig?.icon || ClipboardDocumentListIcon;
    
    // Check if this is a lead-sourced project
    const isFromLead = project.id.startsWith('lead-');

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
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <Icon className={cn("w-5 h-5", stageConfig?.color)} />
                            <span className={cn(
                                "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
                                stageConfig?.bgColor,
                                stageConfig?.color
                            )}>
                                {stageConfig?.label}
                            </span>
                            {isFromLead && (
                                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-500">
                                    From Lead
                                </span>
                            )}
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
                            <div className="flex flex-col gap-2">
                                <PrimaryButton
                                    onClick={() => onAction(project, 'submit-drawing')}
                                    className="text-xs px-3 py-1.5"
                                >
                                    <PlayIcon className="w-4 h-4 mr-1" />
                                    Submit Drawing
                                </PrimaryButton>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onAction(project, 'submit-boq');
                                    }}
                                    className="text-xs px-3 py-1.5 font-bold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 transition-all flex items-center justify-center"
                                >
                                    <ClipboardDocumentListIcon className="w-4 h-4 mr-1" />
                                    Submit BOQ
                                </button>
                            </div>
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
    const [isBOQModalOpen, setIsBOQModalOpen] = useState(false);
    const [selectedProjectForBOQ, setSelectedProjectForBOQ] = useState<Project | null>(null);

    // Drawing Upload Modal State
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [selectedProjectForUpload, setSelectedProjectForUpload] = useState<Project | null>(null);

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
            try {
                console.log('[ProjectsWorkflowPage] Completing inspection for:', project.projectName, 'ID:', project.id);
                
                // Mark site inspection as complete and update status
                await onUpdateProject(project.id, {
                    siteInspectionDate: new Date(),
                    status: ProjectStatus.DRAWING_PENDING, // Move to drawing stage
                });
                
                console.log('[ProjectsWorkflowPage] Update completed successfully');

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
                
                console.log('[ProjectsWorkflowPage] Task created successfully');
            } catch (error) {
                console.error('[ProjectsWorkflowPage] Error completing inspection:', error);
                alert('Failed to complete inspection. Please try again.');
            }
        } else if (action === 'submit-drawing') {
            setSelectedProjectForUpload(project);
            setIsUploadModalOpen(true);
        } else if (action === 'submit-boq') {
            setSelectedProjectForBOQ(project);
            setIsBOQModalOpen(true);
        }
    };

    const handleBOQSubmit = async (items: any[]) => {
        if (!selectedProjectForBOQ) return;

        try {
            console.log("Submitting BOQ for project:", selectedProjectForBOQ.projectName, items);

            // Mark drawing as submitted AND project as completed
            await onUpdateProject(selectedProjectForBOQ.id, {
                drawingSubmittedAt: new Date(),
                items: items, // Save the submitted BOQ items to the project
                status: ProjectStatus.AWAITING_QUOTATION // Transition to Quotation Phase
            });

            // Create Task for Quotation Team if assigned
            const quotationUserId = selectedProjectForBOQ.assignedTeam?.quotation;
            if (quotationUserId) {
                await addTask({
                    title: `Create Quotation - ${selectedProjectForBOQ.projectName}`,
                    description: `BOQ has been submitted. Please prepare the commercial quotation.`,
                    status: TaskStatus.PENDING,
                    priority: 'High',
                    date: new Date().toISOString().split('T')[0],
                    userId: quotationUserId, // Assign to Quotation Team Member
                    contextId: selectedProjectForBOQ.id,
                    contextType: 'project',
                    deadline: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString(), // 2 days deadline
                    timeSpent: 0,
                    isPaused: false,
                    createdAt: new Date(),
                });
            }

            alert("BOQ Submitted and Project Phase Completed!");
            setIsBOQModalOpen(false);
            setSelectedProjectForBOQ(null);

        } catch (error) {
            console.error("Failed to submit BOQ", error);
            alert("Failed to submit BOQ");
        }
    };

    const handleDrawingUpload = async (file: File, type: 'pdf' | 'cad') => {
        if (!selectedProjectForUpload) return;

        // After upload, we immediately open the BOQ modal as per previous workflow logic
        // but now we have the file.
        console.log(`Uploaded ${type} file:`, file.name);

        setIsUploadModalOpen(false);
        // Important: Close upload modal first, then set BOQ project and open BOQ modal
        // to maintain the flow: Upload Drawing -> Submit BOQ
        const project = selectedProjectForUpload;
        setSelectedProjectForUpload(null);

        // Simulate upload delay
        await new Promise(resolve => setTimeout(resolve, 500));

        setSelectedProjectForBOQ(project);
        setIsBOQModalOpen(true);
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
                        title={stage.id === 'site-inspection' ? 'Site Engineer' : stage.label}
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
                            {/* Simplified rendering to avoid visibility issues */}
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
                        </div>
                    </ContentCard>
                ))}
            </div>
            {/* BOQ Modal */}
            <BOQSubmissionModal
                isOpen={isBOQModalOpen}
                onClose={() => setIsBOQModalOpen(false)}
                onSubmit={handleBOQSubmit}
                projectName={selectedProjectForBOQ?.projectName}
            />

            <DrawingUploadModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onUpload={handleDrawingUpload}
            />
        </motion.div>
    );
};

export default ProjectsWorkflowPage;
