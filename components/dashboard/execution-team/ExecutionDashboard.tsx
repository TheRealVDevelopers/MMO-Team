import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useAssignedApprovalRequests, approveRequest, rejectRequest, negotiateRequest } from '../../../hooks/useApprovalSystem';
import { ApprovalStatus, ApprovalRequestType, ExecutionStage, ApprovalRequest, Project } from '../../../types';
import { ContentCard, SectionHeader, cn } from '../shared/DashboardUI';
import { formatDateTime } from '../../../constants';
import { CheckCircleIcon, XCircleIcon, ClockIcon, BriefcaseIcon } from '@heroicons/react/24/outline';
import { AnimatePresence, motion } from 'framer-motion';

// Pages
import MyDayPage from '../shared/MyDayPage';
import PerformancePage from './PerformancePage';
import CommunicationDashboard from '../../communication/CommunicationDashboard';
import EscalateIssuePage from '../../escalation/EscalateIssuePage';
import ExecutionRequestWizard from './ExecutionRequestWizard';
import { useAssignedProjects, updateProjectStage, raiseProjectIssue } from '../../../hooks/useProjects';
import { CheckIcon, ExclamationTriangleIcon, ChatBubbleLeftRightIcon, ChevronRightIcon, ListBulletIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';


const ExecutionDashboard: React.FC<{ currentPage: string, setCurrentPage: (page: string) => void }> = ({ currentPage, setCurrentPage }) => {
    const { currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState<'requests' | 'projects'>('requests');
    const { assignedRequests, loading } = useAssignedApprovalRequests(currentUser?.id || '');

    // Review Wizard State
    const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
    const [isReviewOpen, setIsReviewOpen] = useState(false);

    const handleOpenReview = (req: ApprovalRequest) => {
        setSelectedRequest(req);
        setIsReviewOpen(true);
    };

    const handleCloseReview = () => {
        setIsReviewOpen(false);
        setSelectedRequest(null);
    };

    const handleNegotiateRequest = async (stages: ExecutionStage[], notes: string) => {
        if (!selectedRequest || !currentUser) return;
        try {
            await negotiateRequest(
                selectedRequest.id,
                currentUser.id,
                currentUser.name,
                stages,
                "Changes Proposed: " + notes
            );

            alert("Negotiation Protocol Initiated. Sending counter-proposal...");
            handleCloseReview();
        } catch (error) {
            console.error("Error negotiating:", error);
            alert("System Failure: Could not initiate negotiation.");
        }
    };

    const handleAcceptRequest = async (stages: ExecutionStage[], notes: string) => {
        if (!selectedRequest || !currentUser) return;
        try {
            // Update request with final stages and approve
            await approveRequest(
                selectedRequest.id,
                currentUser.id,
                currentUser.name,
                currentUser.id,
                "Execution Protocol Accepted: " + notes,
                undefined, // deadline
                stages
            );

            alert("Protocol Accepted. Initializing Field Operation...");
            handleCloseReview();
        } catch (error) {
            console.error("Error accepting request:", error);
            alert("System Failure: Could not accept protocol.");
        }
    };

    // Project Logic
    const { projects: assignedProjects, loading: projectsLoading } = useAssignedProjects(currentUser?.id || '');
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
    const [issueData, setIssueData] = useState({ category: 'Technical', description: '', priority: 'High' });

    const handleToggleStage = async (projectId: string, stageId: string, completed: boolean) => {
        if (!currentUser) return;
        try {
            await updateProjectStage(projectId, stageId, completed, currentUser.name);
        } catch (error) {
            console.error("Error updating stage:", error);
            alert("Failed to update stage status.");
        }
    };

    const handleRaiseIssue = async () => {
        if (!selectedProject || !currentUser) return;
        try {
            await raiseProjectIssue(selectedProject.id, issueData, currentUser.name);
            alert("Critical Issue Reported to Command Center.");
            setIsIssueModalOpen(false);
            setIssueData({ category: 'Technical', description: '', priority: 'High' });
        } catch (error) {
            console.error("Error raising issue:", error);
            alert("System Failure: Could not report issue.");
        }
    };

    // Shared navigation handling
    if (currentPage === 'my-day') return <MyDayPage />;
    // if (currentPage === 'performance') return <PerformancePage />;
    if (currentPage === 'communication') return <CommunicationDashboard />;
    if (currentPage === 'escalate-issue') return <EscalateIssuePage setCurrentPage={setCurrentPage} />;

    return (
        <div className="space-y-8 p-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-serif font-black text-text-primary uppercase tracking-tighter">Execution Command</h1>
                    <p className="text-[10px] text-text-tertiary font-black uppercase tracking-[0.2em] opacity-60">Field Operations Center</p>
                </div>
                <div className="flex gap-2 bg-subtle-background p-1.5 rounded-2xl border border-border/40">
                    <button
                        onClick={() => setActiveTab('requests')}
                        className={cn(
                            "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                            activeTab === 'requests' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-text-tertiary hover:text-primary hover:bg-surface"
                        )}
                    >
                        Protocol Inbox
                    </button>
                    <button
                        onClick={() => setActiveTab('projects')}
                        className={cn(
                            "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                            activeTab === 'projects' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-text-tertiary hover:text-primary hover:bg-surface"
                        )}
                    >
                        Operational Board
                    </button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'requests' ? (
                    <motion.div
                        key="requests"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                    >
                        {assignedRequests.length > 0 ? (
                            assignedRequests.map((req) => (
                                <ContentCard key={req.id} className="group hover:border-primary/40 transition-all">
                                    <div className="p-6">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 font-black">
                                                    EX
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold text-text-primary group-hover:text-primary transition-colors">{req.title}</h3>
                                                    <p className="text-[10px] text-text-tertiary font-black uppercase tracking-wider">{req.requesterName} • {formatDateTime(req.requestedAt)}</p>
                                                </div>
                                            </div>
                                            <span className={cn(
                                                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                                                req.status === 'Negotiation' ? "bg-amber-100 text-amber-600" : "bg-primary/10 text-primary"
                                            )}>
                                                {req.status}
                                            </span>
                                        </div>

                                        <div className="bg-subtle-background/50 rounded-2xl p-4 mb-6 border border-border/40">
                                            <p className="text-xs text-text-secondary line-clamp-2 italic">"{req.description}"</p>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex -space-x-2">
                                                {req.stages?.slice(0, 3).map((_, i) => (
                                                    <div key={i} className="w-8 h-8 rounded-full bg-surface border-2 border-primary/20 flex items-center justify-center text-[10px] font-black pointer-events-none">
                                                        {i + 1}
                                                    </div>
                                                ))}
                                                {(req.stages?.length || 0) > 3 && (
                                                    <div className="w-8 h-8 rounded-full bg-subtle-background border-2 border-border flex items-center justify-center text-[10px] font-black">
                                                        +{(req.stages?.length || 0) - 3}
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => handleOpenReview(req)}
                                                className="px-6 py-2 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-secondary transition-all shadow-md shadow-primary/20"
                                            >
                                                Review Protocol
                                            </button>
                                        </div>
                                    </div>
                                </ContentCard>
                            ))
                        ) : (
                            <div className="lg:col-span-2 py-32 text-center bg-surface rounded-[3rem] border border-dashed border-border/60">
                                <ClockIcon className="w-16 h-16 mx-auto mb-4 text-text-tertiary opacity-20" />
                                <p className="text-text-tertiary font-serif italic text-lg uppercase tracking-widest opacity-40">"No pending execution protocols assigned."</p>
                            </div>
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        key="projects"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                    >
                        {assignedProjects.length > 0 ? (
                            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                                {/* Project List Side */}
                                <div className="xl:col-span-1 space-y-4">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-text-tertiary px-2 mb-4">Active Field Ops ({assignedProjects.length})</p>
                                    {assignedProjects.map((proj) => (
                                        <div
                                            key={proj.id}
                                            onClick={() => setSelectedProject(proj)}
                                            className={cn(
                                                "p-6 rounded-[2rem] border transition-all cursor-pointer group",
                                                selectedProject?.id === proj.id
                                                    ? "bg-primary text-white border-primary shadow-xl shadow-primary/20"
                                                    : "bg-surface border-border/40 hover:border-primary/40"
                                            )}
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h4 className={cn("font-bold text-lg", selectedProject?.id === proj.id ? "text-white" : "text-text-primary")}>{proj.projectName}</h4>
                                                    <p className={cn("text-[10px] font-black uppercase tracking-wider", selectedProject?.id === proj.id ? "text-white/60" : "text-text-tertiary")}>{proj.clientName}</p>
                                                </div>
                                                <ChevronRightIcon className={cn("w-5 h-5 opacity-40", selectedProject?.id === proj.id ? "text-white" : "text-text-tertiary")} />
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 h-1.5 bg-black/10 rounded-full overflow-hidden">
                                                    <div
                                                        className={cn("h-full transition-all duration-1000", selectedProject?.id === proj.id ? "bg-white" : "bg-primary")}
                                                        style={{ width: `${(proj.stages?.filter(s => s.status === 'Completed').length || 0) / (proj.stages?.length || 1) * 100}%` }}
                                                    />
                                                </div>
                                                <span className="text-[10px] font-black">{Math.round((proj.stages?.filter(s => s.status === 'Completed').length || 0) / (proj.stages?.length || 1) * 100)}%</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Project Detail View */}
                                <div className="xl:col-span-2">
                                    {selectedProject ? (
                                        <ContentCard className="h-full border-primary/20 bg-surface/50 backdrop-blur-sm overflow-hidden flex flex-col">
                                            <div className="p-8 border-b border-border/40 flex justify-between items-center">
                                                <div>
                                                    <h2 className="text-2xl font-serif font-black text-text-primary tracking-tight">{selectedProject.projectName}</h2>
                                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-tertiary">Mission Timeline & Field Control</p>
                                                </div>
                                                <button
                                                    onClick={() => setIsIssueModalOpen(true)}
                                                    className="px-6 py-2.5 bg-red-500/10 text-red-600 border border-red-500/20 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/10 flex items-center gap-2"
                                                >
                                                    <ExclamationTriangleIcon className="w-4 h-4" />
                                                    Report Intel
                                                </button>
                                            </div>

                                            <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                    {/* Stages Tracker */}
                                                    <div className="space-y-6">
                                                        <SectionHeader title="Operational Stages" />
                                                        <div className="space-y-3">
                                                            {selectedProject.stages?.map((stage, idx) => (
                                                                <div
                                                                    key={stage.id || idx}
                                                                    className={cn(
                                                                        "p-4 rounded-2xl border transition-all flex items-center justify-between group/stage",
                                                                        stage.status === 'Completed' ? "bg-green-500/5 border-green-500/20" : "bg-subtle-background/50 border-border/40"
                                                                    )}
                                                                >
                                                                    <div className="flex items-center gap-4">
                                                                        <button
                                                                            onClick={() => handleToggleStage(selectedProject.id, stage.id || '', stage.status !== 'Completed')}
                                                                            className={cn(
                                                                                "w-6 h-6 rounded-lg border-2 transition-all flex items-center justify-center",
                                                                                stage.status === 'Completed'
                                                                                    ? "bg-green-500 border-green-500 text-white"
                                                                                    : "border-border/60 hover:border-primary/60 group-hover/stage:border-primary"
                                                                            )}
                                                                        >
                                                                            {stage.status === 'Completed' && <CheckIcon className="w-4 h-4 stroke-[3]" />}
                                                                        </button>
                                                                        <div>
                                                                            <p className={cn("text-sm font-bold", stage.status === 'Completed' ? "text-green-700" : "text-text-primary")}>{stage.name}</p>
                                                                            <p className="text-[10px] text-text-tertiary font-black uppercase tracking-wider">
                                                                                Target: {stage.deadline ? new Date(stage.deadline).toLocaleDateString() : 'TBD'}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    {stage.completedAt && (
                                                                        <span className="text-[9px] font-black text-green-600/60 uppercase">Cleared</span>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Context & Issues */}
                                                    <div className="space-y-8">
                                                        <div className="bg-subtle-background/30 rounded-[2rem] p-6 border border-border/40">
                                                            <SectionHeader title="Deployment Context" />
                                                            <div className="space-y-4 mt-6">
                                                                <div className="flex justify-between items-center py-2 border-b border-border/20">
                                                                    <span className="text-[10px] font-black uppercase text-text-tertiary">Mission ID</span>
                                                                    <span className="text-xs font-bold text-text-primary">{selectedProject.id.slice(0, 8)}</span>
                                                                </div>
                                                                <div className="flex justify-between items-center py-2 border-b border-border/20">
                                                                    <span className="text-[10px] font-black uppercase text-text-tertiary">Initiated</span>
                                                                    <span className="text-xs font-bold text-text-primary">{formatDateTime(selectedProject.startDate)}</span>
                                                                </div>
                                                                <div className="flex justify-between items-center py-2 border-b border-border/20">
                                                                    <span className="text-[10px] font-black uppercase text-text-tertiary">Current Op</span>
                                                                    <span className="text-xs font-bold text-primary">
                                                                        {selectedProject.stages?.find(s => s.status === 'Pending')?.name || 'Operational Complete'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Recent Issues Feed */}
                                                        <div className="space-y-4">
                                                            <SectionHeader title="Mission Issues" />
                                                            {(selectedProject.issues?.length || 0) > 0 ? (
                                                                <div className="space-y-3">
                                                                    {selectedProject.issues?.map((issue: any) => (
                                                                        <div key={issue.id} className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl">
                                                                            <div className="flex justify-between items-start mb-2">
                                                                                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-red-500 text-white tracking-widest">
                                                                                    {issue.category}
                                                                                </span>
                                                                                <span className="text-[9px] text-text-tertiary font-bold uppercase">{formatDateTime(issue.createdAt)}</span>
                                                                            </div>
                                                                            <p className="text-xs text-text-secondary leading-relaxed font-medium italic">"{issue.description}"</p>
                                                                            <div className="mt-3 pt-3 border-t border-red-500/10 flex justify-between items-center">
                                                                                <span className="text-[9px] font-bold text-red-600 uppercase">Status: {issue.status}</span>
                                                                                <span className="text-[9px] font-black text-text-tertiary uppercase">Alpha: {issue.raisedBy}</span>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <div className="py-12 text-center bg-subtle-background/20 rounded-[2rem] border border-dashed border-border/60">
                                                                    <CheckCircleIcon className="w-8 h-8 mx-auto mb-3 text-green-500/40" />
                                                                    <p className="text-xs text-text-tertiary font-serif italic uppercase tracking-widest opacity-60">"No operational intel reported."</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </ContentCard>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center py-32 bg-surface/50 rounded-[3rem] border border-dashed border-border/60">
                                            <ListBulletIcon className="w-16 h-16 mb-4 text-text-tertiary opacity-20" />
                                            <p className="text-text-tertiary font-serif italic text-lg uppercase tracking-widest opacity-40">"Select a mission for deployment details."</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="py-32 text-center bg-surface rounded-[3rem] border border-dashed border-border/60">
                                <BriefcaseIcon className="w-16 h-16 mx-auto mb-4 text-text-tertiary opacity-20" />
                                <p className="text-text-tertiary font-serif italic text-lg uppercase tracking-widest opacity-40">"No active field operations initialized."</p>
                                <p className="text-[10px] text-text-tertiary font-black uppercase tracking-widest mt-2 max-w-xs mx-auto">Once you accept a protocol, it will manifest here for final stage tracking.</p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Issue Reporting Modal */}
            <AnimatePresence>
                {isIssueModalOpen && selectedProject && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-background/80 backdrop-blur-md"
                            onClick={() => setIsIssueModalOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-md bg-surface border border-border rounded-[2.5rem] shadow-2xl overflow-hidden"
                        >
                            <div className="p-8 border-b border-border/40">
                                <h2 className="text-2xl font-serif font-black text-text-primary tracking-tight">Report Operational Intel</h2>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-tertiary">Critical Field Issue Escalation</p>
                            </div>

                            <div className="p-8 space-y-6">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-tertiary mb-2 block px-1">Intel Category</label>
                                    <select
                                        value={issueData.category}
                                        onChange={(e) => setIssueData({ ...issueData, category: e.target.value })}
                                        className="w-full bg-subtle-background/50 border-border rounded-xl text-xs font-bold py-3"
                                    >
                                        <option>Technical</option>
                                        <option>Material Delay</option>
                                        <option>Client Interference</option>
                                        <option>Site Obstacle</option>
                                        <option>Design Conflict</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-tertiary mb-2 block px-1">Intel Description</label>
                                    <textarea
                                        value={issueData.description}
                                        onChange={(e) => setIssueData({ ...issueData, description: e.target.value })}
                                        rows={4}
                                        placeholder="Describe the critical intel / issue discovered in the field..."
                                        className="w-full bg-subtle-background/50 border-border rounded-2xl text-xs py-3 px-4 resize-none"
                                    />
                                </div>
                            </div>

                            <div className="p-6 border-t border-border/40 bg-subtle-background/30 flex justify-end gap-3">
                                <button
                                    onClick={() => setIsIssueModalOpen(false)}
                                    className="px-6 py-2.5 rounded-xl border border-border text-[10px] font-black uppercase tracking-widest hover:bg-surface transition-all"
                                >
                                    Abort
                                </button>
                                <button
                                    onClick={handleRaiseIssue}
                                    disabled={!issueData.description.trim()}
                                    className="px-8 py-2.5 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-700 shadow-lg shadow-red-600/20 transition-all disabled:opacity-50"
                                >
                                    Escalate Intel
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Premium Wizard Overlay */}
            {selectedRequest && (
                <ExecutionRequestWizard
                    isOpen={isReviewOpen}
                    onClose={handleCloseReview}
                    request={selectedRequest}
                    onAccept={handleAcceptRequest}
                    onNegotiate={handleNegotiateRequest}
                />
            )}
        </div>
    );
};

export default ExecutionDashboard;
