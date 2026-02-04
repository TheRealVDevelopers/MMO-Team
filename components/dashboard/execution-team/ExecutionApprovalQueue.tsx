import React, { useState, useMemo } from 'react';
import {
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    DocumentTextIcon,
    ChevronRightIcon,
    ExclamationTriangleIcon,
    ClipboardDocumentCheckIcon,
    PencilIcon
} from '@heroicons/react/24/outline';
import { useProjects } from '../../../hooks/useProjects';
import { useAllExecutionMaterialRequests } from '../../../hooks/useMaterialRequests';
import { useUsers } from '../../../hooks/useUsers';
import { useTargetedApprovalRequests, approveRequest as approveGenericRequest, rejectRequest as rejectGenericRequest } from '../../../hooks/useApprovalSystem';
import { Project, ProjectStatus, UserRole, ApprovalRequest, ApprovalStatus } from '../../../types';
import { format } from 'date-fns';
import { useAuth } from '../../../context/AuthContext';
import ProjectEditModal from './ProjectEditModal';

const ExecutionApprovalQueue: React.FC = () => {
    const { currentUser } = useAuth();
    const { projects, loading: projectsLoading, updateProject } = useProjects();
    const { requests: materialRequests, loading: matRequestsLoading, approveRequest: approveMaterial, rejectRequest: rejectMaterial } = useAllExecutionMaterialRequests();
    const { requests: generalRequests, loading: genRequestsLoading } = useTargetedApprovalRequests(UserRole.EXECUTION_TEAM);
    const { users } = useUsers();

    const [processingId, setProcessingId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'projects' | 'materials' | 'general'>('projects');
    const [editProject, setEditProject] = useState<Project | null>(null); // ✅ EDIT modal state (replaces review)

    const loading = projectsLoading || matRequestsLoading || genRequestsLoading;

    // Filter projects pending execution approval
    const pendingProjects = useMemo(() => {
        return projects.filter(p =>
            p.status === ProjectStatus.PENDING_EXECUTION_APPROVAL
        );
    }, [projects]);

    const pendingGeneralRequests = useMemo(() => {
        return generalRequests.filter(r => r.status === ApprovalStatus.PENDING);
    }, [generalRequests]);

    const handleSaveEdits = async (updatedProject: Project) => {
        setProcessingId(updatedProject.id);
        try {
            console.log('✅ [ExecutionApproval] Saving project edits and sending for budget approval:', {
                projectId: updatedProject.id,
                projectName: updatedProject.projectName,
                currentStatus: updatedProject.status,
                newStatus: ProjectStatus.PENDING_BUDGET_APPROVAL,
                updates: {
                    budget: updatedProject.budget,
                    startDate: updatedProject.startDate,
                    endDate: updatedProject.endDate,
                    ganttTasksCount: updatedProject.ganttData?.length || 0,
                    paymentTermsCount: updatedProject.paymentTerms?.length || 0,
                    stagesCount: updatedProject.stages?.length || 0
                }
            });

            // ✅ NEW WORKFLOW: Execution EDITS and sends to Accounts for budget approval
            // IMPORTANT: Don't spread updatedProject.status, explicitly set to PENDING_BUDGET_APPROVAL
            const { status: _, ...projectDataWithoutStatus } = updatedProject;
            
            await updateProject(updatedProject.id, {
                ...projectDataWithoutStatus,
                status: ProjectStatus.PENDING_BUDGET_APPROVAL, // Force this status
                executionApprovedAt: new Date().toISOString(),
                executionApprovedBy: currentUser?.id || 'unknown'
            });

            console.log('✅ [ExecutionApproval] Project configured successfully, status -> PENDING_BUDGET_APPROVAL');
            setEditProject(null);
        } catch (error) {
            console.error('❌ [ExecutionApproval] Failed to save project:', error);
            alert('Failed to save project changes');
        }
        setProcessingId(null);
    };

    const handleRejectProject = async (project: Project, reason: string) => {
        setProcessingId(project.id);
        try {
            await updateProject(project.id, {
                status: 'Sent Back for Correction' as any,
                rejectionReason: reason,
                rejectedAt: new Date().toISOString()
            });
        } catch (error) {
            console.error('Failed to reject project:', error);
        }
        setProcessingId(null);
    };

    const handleMaterialAction = async (requestId: string, action: 'approve' | 'reject') => {
        const req = materialRequests.find(r => r.id === requestId);
        if (!req) return;
        setProcessingId(requestId);

        try {
            if (action === 'approve') {
                await approveMaterial(req.projectId, requestId);
            } else {
                await rejectMaterial(req.projectId, requestId);
            }
        } catch (error) {
            console.error(`Failed to ${action} request:`, error);
        }
        setProcessingId(null);
    };

    const handleGeneralAction = async (request: ApprovalRequest, action: 'approve' | 'reject') => {
        if (!currentUser) return;
        setProcessingId(request.id);
        try {
            if (action === 'approve') {
                await approveGenericRequest(request.id, currentUser.id, currentUser.name, currentUser.id, 'Approved by Execution Team');
            } else {
                await rejectGenericRequest(request.id, currentUser.id, currentUser.name, 'Rejected by Execution Team');
            }
        } catch (error) {
            console.error(`Failed to ${action} general request:`, error);
        }
        setProcessingId(null);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 bg-subtle-background min-h-full">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Approvals Queue</h1>
                    <p className="text-sm text-text-secondary mt-1">
                        Manage project kick-offs, materials, and other execution requests
                    </p>
                </div>
                <div className="flex bg-surface rounded-lg p-1 border border-border overflow-x-auto max-w-full">
                    <button
                        onClick={() => setActiveTab('projects')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap ${activeTab === 'projects'
                            ? 'bg-primary-subtle text-primary shadow-sm'
                            : 'text-text-secondary hover:text-text-primary'
                            }`}
                    >
                        Projects ({pendingProjects.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('materials')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap ${activeTab === 'materials'
                            ? 'bg-primary-subtle text-primary shadow-sm'
                            : 'text-text-secondary hover:text-text-primary'
                            }`}
                    >
                        Materials ({materialRequests.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('general')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap ${activeTab === 'general'
                            ? 'bg-primary-subtle text-primary shadow-sm'
                            : 'text-text-secondary hover:text-text-primary'
                            }`}
                    >
                        General ({pendingGeneralRequests.length})
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-surface p-4 rounded-xl border border-border">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-warning-subtle flex items-center justify-center">
                            <ClockIcon className="w-5 h-5 text-warning" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-text-primary">
                                {pendingProjects.length + materialRequests.length + pendingGeneralRequests.length}
                            </div>
                            <div className="text-xs text-text-secondary">Total Pending</div>
                        </div>
                    </div>
                </div>
                <div className="bg-surface p-4 rounded-xl border border-border">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-success-subtle flex items-center justify-center">
                            <CheckCircleIcon className="w-5 h-5 text-success" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-text-primary">
                                {projects.filter(p => p.status === ProjectStatus.ACTIVE || p.status === ProjectStatus.IN_EXECUTION).length}
                            </div>
                            <div className="text-xs text-text-secondary">Active Projects</div>
                        </div>
                    </div>
                </div>
                <div className="bg-surface p-4 rounded-xl border border-border">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-info-subtle flex items-center justify-center">
                            <ClipboardDocumentCheckIcon className="w-5 h-5 text-info" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-text-primary">{generalRequests.length}</div>
                            <div className="text-xs text-text-secondary">Total Requests Handled</div>
                        </div>
                    </div>
                </div>
            </div>

            {activeTab === 'projects' && (
                <div className="space-y-4">
                    {pendingProjects.length === 0 ? (
                        <div className="text-center py-12 bg-surface rounded-xl border border-border">
                            <CheckCircleIcon className="w-12 h-12 mx-auto text-success mb-3" />
                            <p className="text-text-primary font-medium">All caught up!</p>
                            <p className="text-sm text-text-secondary">No projects pending approval</p>
                        </div>
                    ) : (
                        pendingProjects.map(project => (
                            <div key={project.id} className="bg-surface rounded-xl border border-border p-5 hover:shadow-md transition-all">
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="font-bold text-text-primary text-lg">{project.projectName}</h3>
                                            <span className="px-2 py-0.5 bg-warning-subtle text-warning text-xs font-medium rounded-full">
                                                Pending Review
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                            <div><span className="text-text-tertiary">Client:</span> <span className="ml-2 text-text-primary">{project.clientName}</span></div>
                                            <div><span className="text-text-tertiary">Value:</span> <span className="ml-2 text-text-primary font-medium">₹{project.contractValue?.toLocaleString()}</span></div>
                                            <div><span className="text-text-tertiary">Created:</span> <span className="ml-2 text-text-primary">{project.createdAt ? format(new Date(project.createdAt), 'MMM d, yyyy') : 'N/A'}</span></div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => setEditProject(project)}
                                            className="px-4 py-2 border border-primary text-primary rounded-lg hover:bg-primary/10 transition-colors flex items-center gap-2"
                                        >
                                            <PencilIcon className="w-4 h-4" /> Edit & Configure
                                        </button>
                                        <button
                                            onClick={() => handleRejectProject(project, 'Requires more details')}
                                            disabled={processingId === project.id}
                                            className="px-4 py-2 border border-error text-error rounded-lg hover:bg-error-subtle transition-colors flex items-center gap-2 disabled:opacity-50"
                                        >
                                            <XCircleIcon className="w-4 h-4" /> Send Back
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {activeTab === 'materials' && (
                <div className="space-y-4">
                    {materialRequests.length === 0 ? (
                        <div className="text-center py-12 bg-surface rounded-xl border border-border">
                            <CheckCircleIcon className="w-12 h-12 mx-auto text-success mb-3" />
                            <p className="text-text-primary font-medium">No material requests pending</p>
                        </div>
                    ) : (
                        materialRequests.map(req => (
                            <div key={req.id} className="bg-surface rounded-xl border border-border p-5 hover:shadow-md transition-all">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-text-primary">{req.itemName}</h3>
                                        <p className="text-sm text-text-secondary">{req.quantityRequested} {req.unit} • Required by {format(new Date(req.requiredDate), 'MMM d, yyyy')}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleMaterialAction(req.id, 'reject')} className="p-2 text-error hover:bg-error-subtle rounded-lg border border-error/50"><XCircleIcon className="w-5 h-5" /></button>
                                        <button onClick={() => handleMaterialAction(req.id, 'approve')} className="p-2 text-success hover:bg-success-subtle rounded-lg border border-success/50"><CheckCircleIcon className="w-5 h-5" /></button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {activeTab === 'general' && (
                <div className="space-y-4">
                    {pendingGeneralRequests.length === 0 ? (
                        <div className="text-center py-12 bg-surface rounded-xl border border-border">
                            <CheckCircleIcon className="w-12 h-12 mx-auto text-success mb-3" />
                            <p className="text-text-primary font-medium">No pending requests</p>
                        </div>
                    ) : (
                        pendingGeneralRequests.map(req => (
                            <div key={req.id} className="bg-surface rounded-xl border border-border p-5 hover:shadow-md transition-all">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="font-bold text-text-primary">{req.title}</h3>
                                            <span className="px-2 py-0.5 bg-info-subtle text-info text-xs font-medium rounded-full">{req.requestType}</span>
                                        </div>
                                        <p className="text-sm text-text-secondary mb-2">{req.description}</p>
                                        <div className="flex items-center gap-4 text-xs text-text-tertiary">
                                            <span>Requested by: {req.requesterName}</span>
                                            <span>Date: {format(new Date(req.requestedAt), 'MMM d, yyyy')}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleGeneralAction(req, 'reject')}
                                            disabled={processingId === req.id}
                                            className="px-3 py-1.5 border border-error text-error rounded-lg hover:bg-error-subtle text-sm flex items-center gap-1"
                                        >
                                            <XCircleIcon className="w-4 h-4" /> Reject
                                        </button>
                                        <button
                                            onClick={() => handleGeneralAction(req, 'approve')}
                                            disabled={processingId === req.id}
                                            className="px-3 py-1.5 bg-success text-white rounded-lg hover:bg-success/90 text-sm flex items-center gap-1"
                                        >
                                            {processingId === req.id ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircleIcon className="w-4 h-4" />} Approve
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* ✅ PROJECT EDIT MODAL - Execution team configures ALL project details */}
            {editProject && (
                <ProjectEditModal
                    project={editProject}
                    isOpen={true}
                    onClose={() => setEditProject(null)}
                    onSave={handleSaveEdits}
                    submitLabel="Save & Send to Accounts"
                />
            )}
        </div>
    );
};

export default ExecutionApprovalQueue;
