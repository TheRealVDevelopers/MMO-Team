import React, { useState } from 'react';
import { Project, ProjectStatus } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { useProjects } from '../../../hooks/useProjects';
import { ClockIcon, FireIcon, PaperClipIcon, ArrowLeftIcon, EllipsisVerticalIcon, CheckCircleIcon, ArrowUpIcon, DocumentTextIcon, ExclamationTriangleIcon } from '../../icons/IconComponents';
import BOQSubmissionModal from './BOQSubmissionModal';

const KANBAN_COLUMNS: { id: string, title: string, statuses: any[] }[] = [
    { id: 'site-audit', title: 'Site Inspection', statuses: [ProjectStatus.SITE_VISIT_PENDING, 'Site Visit Scheduled'] },
    { id: 'drawing', title: 'Ready for Drawing', statuses: [ProjectStatus.DRAWING_PENDING, 'Waiting for Drawing'] },
    { id: 'boq', title: 'BOQ Submission', statuses: [ProjectStatus.BOQ_PENDING] },
    { id: 'completed', title: 'Completed', statuses: [ProjectStatus.COMPLETED] },
];

const ProjectCard: React.FC<{ project: Project; onSelect: () => void; onAction: (action: string, project: Project) => void }> = ({ project, onSelect, onAction }) => {
    const daysInStage = Math.floor((new Date().getTime() - new Date(project.startDate).getTime()) / (1000 * 3600 * 24));

    const handleActionClick = (e: React.MouseEvent, action: string) => {
        e.stopPropagation();
        onAction(action, project);
    };

    let ActionButton = null;
    const currentStatus = project.status as string;

    const isOverdue = currentStatus === ProjectStatus.DRAWING_PENDING &&
        project.drawingDeadline &&
        new Date() > new Date(project.drawingDeadline);

    if (currentStatus === ProjectStatus.SITE_VISIT_PENDING || currentStatus === 'Site Visit Scheduled') {
        ActionButton = (
            <button
                onClick={(e) => handleActionClick(e, 'mark_visited')}
                className="w-full mt-2 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md text-xs font-medium flex items-center justify-center gap-1 transition-colors"
            >
                <CheckCircleIcon className="w-4 h-4" />
                Mark Visited
            </button>
        );
    } else if (currentStatus === ProjectStatus.DRAWING_PENDING || currentStatus === 'Waiting for Drawing') {
        ActionButton = (
            <button
                onClick={(e) => handleActionClick(e, 'upload_drawing')}
                className="w-full mt-2 py-1.5 bg-purple-50 text-purple-600 hover:bg-purple-100 rounded-md text-xs font-medium flex items-center justify-center gap-1 transition-colors"
            >
                <ArrowUpIcon className="w-4 h-4" />
                Upload 2D Drawing
            </button>
        );
    } else if (currentStatus === ProjectStatus.BOQ_PENDING) {
        ActionButton = (
            <button
                onClick={(e) => handleActionClick(e, 'submit_boq')}
                className="w-full mt-2 py-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-md text-xs font-medium flex items-center justify-center gap-1 transition-colors"
            >
                <DocumentTextIcon className="w-4 h-4" />
                Submit BOQ
            </button>
        );
    }

    return (
        <div onClick={onSelect} className="bg-surface p-3 rounded-md border border-border space-y-3 cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1 group relative">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-bold text-text-primary pr-6">{project.projectName}</p>
                    <p className="text-xs text-text-secondary">{project.clientName}</p>
                </div>
                {project.priority === 'High' && <FireIcon className="text-error" />}
            </div>

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
            {isOverdue && (
                <div className="mt-2 text-[10px] text-error font-bold flex items-center gap-1 bg-error/5 p-1 rounded border border-error/20">
                    <ExclamationTriangleIcon className="w-3 h-3" />
                    DEADLINE MISSED (24H RULE)
                </div>
            )}
            {ActionButton}
        </div>
    );
};

const ProjectsBoardPage: React.FC<{ onProjectSelect: (project: Project) => void; setCurrentPage: (page: string) => void; }> = ({ onProjectSelect, setCurrentPage }) => {
    const { currentUser } = useAuth();
    const { projects, loading, updateProject } = useProjects(currentUser?.id);

    // BOQ Modal State
    const [isBOQModalOpen, setIsBOQModalOpen] = useState(false);
    const [selectedProjectForBOQ, setSelectedProjectForBOQ] = useState<Project | null>(null);

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

    const handleCardAction = async (action: string, project: Project) => {
        try {
            if (action === 'mark_visited') {
                if (window.confirm(`Confirm site visit completed for ${project.projectName}? This will move the project to Drawing stage.`)) {
                    const now = new Date();
                    const deadline = new Date(now.getTime() + 24 * 60 * 60 * 1000);
                    await updateProject(project.id, {
                        status: ProjectStatus.DRAWING_PENDING,
                        siteInspectionDate: now,
                        drawingDeadline: deadline,
                        drawingRedFlagged: false
                    });
                }
            } else if (action === 'upload_drawing') {
                // Mock file upload interaction
                const mockFile = window.prompt("Enter filename to simulate upload (e.g. 'FloorPlan_v1.pdf'):");
                if (mockFile) {
                    await updateProject(project.id, {
                        status: ProjectStatus.BOQ_PENDING,
                        drawingSubmittedAt: new Date(),
                        drawingRedFlagged: false
                    });
                    alert("Drawing uploaded! Project moved to BOQ Pending.");
                }
            } else if (action === 'submit_boq') {
                setSelectedProjectForBOQ(project);
                setIsBOQModalOpen(true);
            }
        } catch (error) {
            console.error("Action failed:", error);
            alert("Failed to update project status.");
        }
    };

    const handleBOQSubmit = async (data: any) => {
        if (!selectedProjectForBOQ) return;
        try {
            // In a real app, save BOQ data to sub-collection
            console.log("Submitting BOQ:", data);

            await updateProject(selectedProjectForBOQ.id, {
                status: ProjectStatus.COMPLETED
            });

            setIsBOQModalOpen(false);
            setSelectedProjectForBOQ(null);
            alert("BOQ Submitted! Project marked as Completed.");
        } catch (error) {
            console.error("BOQ Submit Error:", error);
        }
    };

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

            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 overflow-hidden">
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
                                    <ProjectCard
                                        key={project.id}
                                        project={project}
                                        onSelect={() => onProjectSelect(project)}
                                        onAction={handleCardAction}
                                    />
                                ))
                            }
                            {projects.filter(p => column.statuses.includes(p.status)).length === 0 && (
                                <div className="text-center text-xs text-text-secondary py-8 italic opacity-50">
                                    No projects in this stage
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <BOQSubmissionModal
                isOpen={isBOQModalOpen}
                onClose={() => setIsBOQModalOpen(false)}
                onSubmit={handleBOQSubmit}
            />
        </div>
    );
};

export default ProjectsBoardPage;