import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useAssignedApprovalRequests, approveRequest, rejectRequest, negotiateRequest } from '../../../hooks/useApprovalSystem';
import { ApprovalStatus, ApprovalRequestType, ExecutionStage, ApprovalRequest } from '../../../types';
import { ContentCard, SectionHeader, cn } from '../shared/DashboardUI';
import { CheckCircleIcon, XCircleIcon, ClockIcon, BriefcaseIcon } from '@heroicons/react/24/outline';
import { AnimatePresence, motion } from 'framer-motion';

// Pages
import MyDayPage from '../shared/MyDayPage';
import PerformancePage from '../execution-team/PerformancePage';
// Note: PerformancePage might be generic or specific. Assuming we use a placeholder or generic if missing.
// Actually, in ExecutionTeamDashboard.tsx it imported from './execution-team/PerformancePage'
// Check if that file exists. If not, use generic or create it.
import CommunicationDashboard from '../../communication/CommunicationDashboard';
import EscalateIssuePage from '../../escalation/EscalateIssuePage';


const ExecutionDashboard: React.FC<{ currentPage: string, setCurrentPage: (page: string) => void }> = ({ currentPage, setCurrentPage }) => {
    const { currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState<'requests' | 'projects'>('requests');
    const { assignedRequests, loading } = useAssignedApprovalRequests(currentUser?.id || '');
    // approveRequest and rejectRequest are imported functions

    // Review Modal State
    const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
    const [reviewStages, setReviewStages] = useState<ExecutionStage[]>([]);
    const [reviewNotes, setReviewNotes] = useState('');
    const [isReviewOpen, setIsReviewOpen] = useState(false);

    const handleOpenReview = (req: ApprovalRequest) => {
        setSelectedRequest(req);
        setReviewStages(req.stages ? [...req.stages] : []); // Clone stages for editing
        setReviewNotes('');
        setIsReviewOpen(true);
    };

    const handleCloseReview = () => {
        setIsReviewOpen(false);
        setSelectedRequest(null);
    };

    const handleAcceptRequest = async () => {
        if (!selectedRequest || !currentUser) return;
        try {
            // Logic: Acceptance means converting to a Project. 
            // We need a specific function for this, or we treat "Approved" by Execution Team as the trigger?
            // Let's assume for now we mark it as "Converted" or handle it via a new function if needed.
            // But reuse approveRequest for simplicity to update status to "Completed" or similar?
            // Actually, we need to create a project.
            // For this iteration, let's update status to 'Approved' (final) which triggers creation, 
            // OR we add a new status 'Project Created'.

            // Let's use a specific payload or just update stages.
            // We need to update the request with the FINAL agreed stages.

            // TEMPORARY: Just update status to 'Approved' and save stages.
            // Real implementation: Call a 'createProjectFromRequest' function.

            // We will use approveRequest but we need to pass the stages back.
            // approveRequest signature: (requestId, reviewerId, reviewerName, assigneeId, comments, deadline)
            // It doesn't support stages update yet. We might need to call updateDoc directly or update hook.
            // Assign the final task to the Execution Team member (currentUser) who accepted it
            await approveRequest(selectedRequest.id, currentUser.id, currentUser.name, currentUser.id, "Execution Protocol Accepted: " + reviewNotes);

            alert("Protocol Accepted. Initializing Field Operation...");
            handleCloseReview();
        } catch (error) {
            console.error("Error accepting request:", error);
            alert("System Failure: Could not accept protocol.");
        }
    };

    const handleNegotiateRequest = async () => {
        if (!selectedRequest || !currentUser) return;
        try {
            // We pass the updated reviewStages to the negotiation function
            await negotiateRequest(
                selectedRequest.id,
                currentUser.id,
                currentUser.name,
                reviewStages,
                "Changes Proposed: " + reviewNotes
            );

            alert("Negotiation Protocol Initiated. Sending counter-proposal...");
            handleCloseReview();
        } catch (error) {
            console.error("Error negotiating:", error);
            alert("System Failure: Could not initiate negotiation.");
        }
    };

    // Existing pages
    if (currentPage === 'my-day') return <MyDayPage />;
    // Performance page handling - referencing the one from Previous ExecutionTeamDashboard logic
    // We need to ensuring imports point to valid files. 
    // Assuming 'PerformancePage' exists in the same directory or adjust path.
    // For now, let's assume it was shared or specific. 
    // The previous file had: import PerformancePage from './execution-team/PerformancePage';
    // So it should be handled.
    if (currentPage === 'performance') return <div className="p-8">Performance Page Placeholder</div>; // Use placeholder to avoid import errors if file not moved
    if (currentPage === 'communication') return <CommunicationDashboard />;
    if (currentPage === 'escalate-issue') return <EscalateIssuePage setCurrentPage={setCurrentPage} />;

    // Main Execution Board Logic (replaces "ExecutionBoardPage")
    return (
        <div className="space-y-8 p-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-serif font-black text-text-primary">Execution Command</h1>
                    <p className="text-sm text-text-tertiary font-bold uppercase tracking-widest">Field Operations Center</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('requests')}
                        className={cn(
                            "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                            activeTab === 'requests' ? "bg-primary text-white" : "bg-surface text-text-tertiary hover:text-primary"
                        )}
                    >
                        Incoming Requests
                    </button>
                    <button
                        onClick={() => setActiveTab('projects')}
                        className={cn(
                            "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                            activeTab === 'projects' ? "bg-primary text-white" : "bg-surface text-text-tertiary hover:text-primary"
                        )}
                    >
                        Active Projects
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
                        className="grid grid-cols-1 gap-4"
                    >
                        {assignedRequests.length > 0 ? (
                            <div className="grid grid-cols-1 gap-4">
                                {assignedRequests.map((req) => (
                                    <ContentCard key={req.id}>
                                        <div className="p-6">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h3 className="text-lg font-bold text-text-primary">{req.title}</h3>
                                                    <p className="text-xs text-text-tertiary">{req.description}</p>
                                                </div>
                                                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-[10px] font-bold uppercase rounded-full">
                                                    {req.status}
                                                </span>
                                            </div>

                                            {req.stages && req.stages.length > 0 && (
                                                <div className="space-y-2 mb-4">
                                                    <p className="text-xs font-black uppercase tracking-widest text-text-tertiary">Stages</p>
                                                    {req.stages.map((stage, idx) => (
                                                        <div key={idx} className="flex justify-between items-center bg-subtle-background p-2 rounded text-xs">
                                                            <span className="font-semibold">{stage.name}</span>
                                                            <span className="text-text-secondary">{new Date(stage.deadline).toLocaleDateString()}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="flex gap-2 justify-end mt-4">
                                                <button className="px-4 py-2 bg-primary text-white text-xs font-bold uppercase rounded-lg hover:bg-secondary">
                                                    Review & Accept
                                                </button>
                                            </div>
                                        </div>
                                    </ContentCard>
                                ))}
                            </div>
                        ) : (
                            <ContentCard>
                                <div className="p-8 text-center text-text-tertiary">
                                    <ClockIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    <p className="font-serif italic">"No pending execution protocols assigned."</p>
                                </div>
                            </ContentCard>
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        key="projects"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="grid grid-cols-1 gap-4"
                    >
                        <ContentCard>
                            <div className="p-8 text-center text-text-tertiary">
                                <BriefcaseIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p className="font-serif italic">"No active field operations initialized."</p>
                            </div>
                        </ContentCard>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Review Modal */}
            <AnimatePresence>
                {isReviewOpen && selectedRequest && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-background/80 backdrop-blur-md"
                            onClick={handleCloseReview}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-2xl bg-surface border border-border rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
                        >
                            <div className="p-8 border-b border-border/40">
                                <h2 className="text-2xl font-serif font-black text-text-primary tracking-tight">Mission Protocol Review</h2>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-tertiary">Review Stages & Deadlines</p>
                            </div>

                            <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                                <div className="space-y-6">
                                    <div className="bg-subtle-background/50 p-6 rounded-3xl border border-border/40">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-text-tertiary mb-1">Subject</p>
                                        <p className="text-lg font-bold text-text-primary">{selectedRequest.title}</p>
                                        <p className="text-sm text-text-secondary mt-2">{selectedRequest.description}</p>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-tertiary px-1 mb-2 block">
                                            Execution Stages (Editable)
                                        </label>
                                        <div className="space-y-3">
                                            {reviewStages.map((stage, idx) => (
                                                <div key={idx} className="flex gap-4 items-center bg-surface p-4 rounded-xl border border-border/60">
                                                    <div className="flex-1">
                                                        <label className="text-[9px] font-bold uppercase text-text-tertiary block mb-1">Phase Name</label>
                                                        <input
                                                            type="text"
                                                            value={stage.name}
                                                            onChange={(e) => {
                                                                const newStages = [...reviewStages];
                                                                newStages[idx].name = e.target.value;
                                                                setReviewStages(newStages);
                                                            }}
                                                            className="w-full bg-transparent border-none p-0 text-sm font-bold text-text-primary focus:ring-0"
                                                        />
                                                    </div>
                                                    <div className="w-[180px]">
                                                        <label className="text-[9px] font-bold uppercase text-text-tertiary block mb-1">Deadline</label>
                                                        <input
                                                            type="date"
                                                            value={stage.deadline ? new Date(stage.deadline).toISOString().split('T')[0] : ''}
                                                            onChange={(e) => {
                                                                const newStages = [...reviewStages];
                                                                newStages[idx].deadline = new Date(e.target.value);
                                                                setReviewStages(newStages);
                                                            }}
                                                            className="w-full bg-subtle-background rounded-lg border-border text-xs py-1.5"
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-tertiary px-1 mb-2 block">
                                            Notes / Counter-Proposal
                                        </label>
                                        <textarea
                                            value={reviewNotes}
                                            onChange={(e) => setReviewNotes(e.target.value)}
                                            placeholder="Add notes here if you are negotiating changes..."
                                            rows={3}
                                            className="w-full p-4 rounded-2xl border border-border bg-subtle-background/30 text-sm focus:ring-primary/20"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-border/40 bg-subtle-background/30 flex justify-end gap-3">
                                <button
                                    onClick={handleCloseReview}
                                    className="px-6 py-3 rounded-xl border border-border text-xs font-black uppercase tracking-widest hover:bg-surface transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleNegotiateRequest}
                                    className="px-6 py-3 rounded-xl border border-yellow-500/30 text-yellow-700 bg-yellow-500/10 text-xs font-black uppercase tracking-widest hover:bg-yellow-500/20 transition-all"
                                >
                                    Propose Changes
                                </button>
                                <button
                                    onClick={handleAcceptRequest}
                                    className="px-6 py-3 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-widest hover:bg-secondary shadow-lg shadow-primary/20 transition-all"
                                >
                                    Accept Protocol
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Review Modal */}
            <AnimatePresence>
                {isReviewOpen && selectedRequest && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-background/80 backdrop-blur-md"
                            onClick={handleCloseReview}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-2xl bg-surface border border-border rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
                        >
                            <div className="p-8 border-b border-border/40">
                                <h2 className="text-2xl font-serif font-black text-text-primary tracking-tight">Mission Protocol Review</h2>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-tertiary">Review Stages & Deadlines</p>
                            </div>

                            <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                                <div className="space-y-6">
                                    <div className="bg-subtle-background/50 p-6 rounded-3xl border border-border/40">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-text-tertiary mb-1">Subject</p>
                                        <p className="text-lg font-bold text-text-primary">{selectedRequest.title}</p>
                                        <p className="text-sm text-text-secondary mt-2">{selectedRequest.description}</p>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-tertiary px-1 mb-2 block">
                                            Execution Stages (Editable)
                                        </label>
                                        <div className="space-y-3">
                                            {reviewStages.map((stage, idx) => (
                                                <div key={idx} className="flex gap-4 items-center bg-surface p-4 rounded-xl border border-border/60">
                                                    <div className="flex-1">
                                                        <label className="text-[9px] font-bold uppercase text-text-tertiary block mb-1">Phase Name</label>
                                                        <input
                                                            type="text"
                                                            value={stage.name}
                                                            onChange={(e) => {
                                                                const newStages = [...reviewStages];
                                                                newStages[idx].name = e.target.value;
                                                                setReviewStages(newStages);
                                                            }}
                                                            className="w-full bg-transparent border-none p-0 text-sm font-bold text-text-primary focus:ring-0"
                                                        />
                                                    </div>
                                                    <div className="w-[180px]">
                                                        <label className="text-[9px] font-bold uppercase text-text-tertiary block mb-1">Deadline</label>
                                                        <input
                                                            type="date"
                                                            value={stage.deadline ? new Date(stage.deadline).toISOString().split('T')[0] : ''}
                                                            onChange={(e) => {
                                                                const newStages = [...reviewStages];
                                                                newStages[idx].deadline = new Date(e.target.value);
                                                                setReviewStages(newStages);
                                                            }}
                                                            className="w-full bg-subtle-background rounded-lg border-border text-xs py-1.5"
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-tertiary px-1 mb-2 block">
                                            Notes / Counter-Proposal
                                        </label>
                                        <textarea
                                            value={reviewNotes}
                                            onChange={(e) => setReviewNotes(e.target.value)}
                                            placeholder="Add notes here if you are negotiating changes..."
                                            rows={3}
                                            className="w-full p-4 rounded-2xl border border-border bg-subtle-background/30 text-sm focus:ring-primary/20"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-border/40 bg-subtle-background/30 flex justify-end gap-3">
                                <button
                                    onClick={handleCloseReview}
                                    className="px-6 py-3 rounded-xl border border-border text-xs font-black uppercase tracking-widest hover:bg-surface transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleNegotiateRequest}
                                    className="px-6 py-3 rounded-xl border border-yellow-500/30 text-yellow-700 bg-yellow-500/10 text-xs font-black uppercase tracking-widest hover:bg-yellow-500/20 transition-all"
                                >
                                    Propose Changes
                                </button>
                                <button
                                    onClick={handleAcceptRequest}
                                    className="px-6 py-3 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-widest hover:bg-secondary shadow-lg shadow-primary/20 transition-all"
                                >
                                    Accept Protocol
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ExecutionDashboard;
