import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useAssignedApprovalRequests, approveRequest, rejectRequest, negotiateRequest } from '../../../hooks/useApprovalSystem';
import { ApprovalStatus, ApprovalRequestType, ExecutionStage, ApprovalRequest } from '../../../types';
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

    // Shared navigation handling
    if (currentPage === 'my-day') return <MyDayPage />;
    if (currentPage === 'performance') return <PerformancePage />;
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
                        className="grid grid-cols-1 gap-6"
                    >
                        {/* Operational Board Placeholder */}
                        <div className="py-32 text-center bg-surface rounded-[3rem] border border-dashed border-border/60">
                            <BriefcaseIcon className="w-16 h-16 mx-auto mb-4 text-text-tertiary opacity-20" />
                            <p className="text-text-tertiary font-serif italic text-lg uppercase tracking-widest opacity-40">"No active field operations initialized."</p>
                            <p className="text-[10px] text-text-tertiary font-black uppercase tracking-widest mt-2 max-w-xs mx-auto">Once you accept a protocol, it will manifest here for final stage tracking.</p>
                        </div>
                    </motion.div>
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
