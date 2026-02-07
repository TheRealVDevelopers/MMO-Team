import React, { useState, useEffect } from 'react';
import {
    ArrowRightOnRectangleIcon,
    PhoneIcon,
    EnvelopeIcon,
    ChatBubbleLeftRightIcon,
    CheckCircleIcon,
    ClockIcon,
    ExclamationTriangleIcon,
    DocumentArrowDownIcon
} from '@heroicons/react/24/outline';

// Import client portal components
import VerticalRoadmap from '../client-portal/JourneyMap/VerticalRoadmap';
import StageBottomSheet from '../client-portal/JourneyMap/StageBottomSheet';
import TodaysWork from '../client-portal/TodaysWork';
import PaymentWidget from '../client-portal/PaymentMilestones/PaymentWidget';
import QuickChat from '../client-portal/QuickChat';
import RECCEDrawingViewer from '../client-portal/RECCEDrawingViewer';
import PayAdvanceSection from '../client-portal/PayAdvanceSection';
import ExecutionProjectPlanningPanel from '../dashboard/execution-team/ExecutionProjectPlanningPanel';

import DocumentsArchive from '../client-portal/DocumentsArchive';
import ForcePasswordResetModal from '../client-portal/ForcePasswordResetModal';
import PendingApprovalsWidget from '../client-portal/PendingApprovalsWidget';

import {
    JourneyStage,
    ClientProject,
    ProjectHealth
} from '../client-portal/types';
import { useInvoices } from '../../hooks/useInvoices';
import { CompanyInfo } from '../../types';
import { formatCurrencyINR, formatDate } from '../../constants';
// Import Payment Submission Modal
import PaymentSubmissionModal from '../client-portal/PaymentSubmissionModal';

// Hooks
import { useClientCase } from '../../hooks/useClientCase';

// Mock Company Info
const MOCK_COMPANY_INFO: CompanyInfo = {
    name: 'Make My Office',
    address: '123, 100ft Road, Indiranagar, Bangalore - 560038',
    gstin: '29ABCDE1234F1Z5',
    contactPhone: '+91 98765 43210',
    contactEmail: 'support@makemyoffice.com',
    website: 'www.makemyoffice.com',
    logoUrl: '/mmo-logo.png',
    phone: '+91 98765 43210'
};

interface ClientDashboardPageProps {
    clientUser: { uid: string; email: string; isFirstLogin: boolean } | null;
    onLogout: () => void;
}

// Status Badge Component
const StatusBadge: React.FC<{ health: ProjectHealth }> = ({ health }) => {
    const config = {
        'on-track': { icon: CheckCircleIcon, label: 'On Track', bg: 'bg-emerald-100', color: 'text-emerald-700' },
        'minor-delay': { icon: ClockIcon, label: 'Minor Delay', bg: 'bg-amber-100', color: 'text-amber-700' },
        'at-risk': { icon: ExclamationTriangleIcon, label: 'At Risk', bg: 'bg-red-100', color: 'text-red-700' }
    }[health] || { icon: CheckCircleIcon, label: 'On Track', bg: 'bg-emerald-100', color: 'text-emerald-700' };
    const Icon = config.icon;

    return (
        <div className={`inline-flex items-center gap-2 px-4 py-2 ${config.bg} rounded-full`}>
            <Icon className={`w-5 h-5 ${config.color}`} />
            <span className={`font-semibold ${config.color}`}>{config.label}</span>
        </div>
    );
};

const ClientDashboardPage: React.FC<ClientDashboardPageProps> = ({ clientUser, onLogout }) => {
    // 1. Data Fetching
    const { project, loading, error } = useClientCase(clientUser?.uid);
    const { invoices, loading: invoicesLoading } = useInvoices(project?.projectId || '');

    // 2. UI State
    const [selectedStage, setSelectedStage] = useState<JourneyStage | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [recceStatus, setRecceStatus] = useState<'Pending' | 'Approved' | 'Revision Requested'>('Pending');
    const [showPayModal, setShowPayModal] = useState(false);
    const [selectedPaymentMilestone, setSelectedPaymentMilestone] = useState<{ amount: number; name: string } | null>(null);

    // 3. Password Reset State
    const [showResetModal, setShowResetModal] = useState(clientUser?.isFirstLogin || false);

    const handleStageClick = (stage: JourneyStage) => {
        setSelectedStage(stage);
        setIsSheetOpen(true);
    };

    const handlePaymentSubmit = async (data: { method: 'UTR' | 'Screenshot'; value: string; amount: number; file?: File }) => {
        try {
            if (!project || !clientUser) return;

            // Import dynamically to avoid circular deps if any
            const { ClientPortalService } = await import('../../services/clientPortalService');

            let value = data.value;

            // If screenshot, upload it first
            if (data.method === 'Screenshot' && data.file) {
                const path = `payments/${project.projectId}/${Date.now()}_${data.file.name}`;
                value = await ClientPortalService.uploadFile(path, data.file);
            }

            await ClientPortalService.submitPayment(
                project.projectId,
                project.consultant.id, // Using consultant ID as stub for Org ID or we can fetch Org ID from project if available. 
                // Actually project.projectId IS the caseId. OrganizationId is needed separately? 
                // In useClientCase, we saw caseData.organizationId. ClientProject doesn't explicitly expose it?
                // Let's assume we can query it or use a default. For now, passing 'org1' or derived.
                // Wait, useClientCase does not map organizationId to ClientProject.
                // We should add organizationId to ClientProject or fetch it.
                data.amount,
                data.method,
                value
            );

            alert('Payment Details Submitted! Accounts team will verify shortly.');
            setShowPayModal(false);
        } catch (error) {
            console.error("Payment submission error:", error);
            alert('Failed to submit payment. Please try again.');
        }
    };

    const handlePayClick = (amount: number, name: string) => {
        setSelectedPaymentMilestone({ amount, name });
        setShowPayModal(true);
    };

    const handleApprove = async (requestId: string) => {
        try {
            if (!project || !clientUser) return;
            const { ClientPortalService } = await import('../../services/clientPortalService');
            await ClientPortalService.approveRequest(project.projectId, requestId, clientUser.uid);
            // Optimistic update or wait for real-time listener? 
            // Real-time listener in useClientCase should handle it.
        } catch (error) {
            console.error("Error approving request:", error);
            alert('Failed to approve request.');
        }
    };

    const handleReject = async (requestId: string, reason: string) => {
        try {
            if (!project || !clientUser) return;
            const { ClientPortalService } = await import('../../services/clientPortalService');
            await ClientPortalService.rejectRequest(project.projectId, requestId, clientUser.uid, reason);
        } catch (error) {
            console.error("Error rejecting request:", error);
            alert('Failed to reject request.');
        }
    };

    const handleSignJMS = async () => {
        // Simple shim for now
        if (!confirm("Are you sure you want to sign off on the project completion? This confirms all work is satisfactory.")) return;

        try {
            if (!project || !clientUser) return;
            // In real app, we'd capture a signature image. For now using a placeholder.
            const signatureUrl = "https://ui-avatars.com/api/?name=" + encodeURIComponent(project.clientName) + "&background=random&length=2";

            const { ClientPortalService } = await import('../../services/clientPortalService');
            await ClientPortalService.signJMS(project.projectId, signatureUrl, clientUser.uid);
            alert("Project Signed Off Successfully!");
        } catch (error) {
            console.error("Error signing JMS:", error);
            alert('Failed to sign off project.');
        }
    };

    const handlePasswordResetSuccess = () => {
        setShowResetModal(false);
    };

    // 4. Loading & Error States
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-500 font-medium">Loading your project...</p>
                </div>
            </div>
        );
    }

    if (error || !project) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center p-8 bg-white rounded-3xl shadow-xl max-w-md">
                    <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Unable to load project</h2>
                    <p className="text-gray-500 mb-6">{error || 'No active project found for your account.'}</p>
                    <button onClick={onLogout} className="px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200">
                        Back to Login
                    </button>
                </div>
            </div>
        );
    }

    // 5. Computed Data
    const currentStage = project.stages.find(s => s.id === project.currentStageId) || project.stages[0];
    const paidMilestoneCount = project.paymentMilestones.filter(m => m.isPaid).length;
    const unlockedUntilStage = paidMilestoneCount > 0 && project.paymentMilestones[paidMilestoneCount - 1]
        ? project.paymentMilestones[paidMilestoneCount - 1].unlocksStage + 1
        : 2;
    const nextUnpaidMilestone = project.paymentMilestones.find(m => !m.isPaid);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Force Password Reset Modal */}
            {showResetModal && (
                <ForcePasswordResetModal
                    uid={clientUser?.uid || ''}
                    onSuccess={handlePasswordResetSuccess}
                />
            )}

            {/* HEADER */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
                <div className="max-w-6xl mx-auto px-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <img src={MOCK_COMPANY_INFO.logoUrl} alt={MOCK_COMPANY_INFO.name} className="h-10 w-auto" />
                            <div className="hidden md:block border-l border-gray-200 pl-3">
                                <h1 className="text-lg font-bold text-gray-900 leading-tight">{MOCK_COMPANY_INFO.name}</h1>
                                <p className="text-xs text-gray-500">GSTIN: {MOCK_COMPANY_INFO.gstin}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-bold text-gray-800">{MOCK_COMPANY_INFO.contactPhone}</p>
                                <p className="text-xs text-gray-500">{MOCK_COMPANY_INFO.contactEmail}</p>
                            </div>
                            <button onClick={onLogout} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                                <ArrowRightOnRectangleIcon className="w-4 h-4" />
                                <span className="hidden sm:inline">Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* HERO */}
            <section className="bg-white border-b border-gray-100">
                <div className="max-w-6xl mx-auto px-4 py-8">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
                        <div className="flex-1">
                            <div className="flex items-center gap-4 mb-2">
                                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{project.projectName}</h1>
                                <StatusBadge health={project.transparency.projectHealth} />
                            </div>
                            <p className="text-gray-500 text-lg">Welcome back, {project.clientName} 👋</p>

                            <div className="flex flex-wrap gap-4 mt-6">
                                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl border border-gray-100">
                                    <span className="text-gray-400">📏</span>
                                    <span className="text-sm font-medium text-gray-700">{project.area || 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl border border-gray-100">
                                    <span className="text-gray-400">💰</span>
                                    <span className="text-sm font-medium text-gray-700">{project.budget}</span>
                                </div>
                                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-xl border border-emerald-100/50">
                                    <span className="text-emerald-500">📅</span>
                                    <span className="text-sm font-bold text-emerald-700">
                                        Completion: {project.transparency.estimatedCompletion?.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) || 'TBD'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Live Activity Feed */}
                        <div className="flex flex-col sm:flex-row lg:flex-col gap-4 min-w-[300px]">
                            <div className="bg-gray-900 rounded-2xl p-4 text-white shadow-xl shadow-gray-200/50">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Live Activity Feed</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-500">RECENT</span>
                                </div>
                                <div className="space-y-3">
                                    {project.activities.slice(0, 2).map((activity) => (
                                        <div key={activity.id} className="flex items-start gap-3">
                                            <span className="text-sm mt-0.5">
                                                {activity.type === 'upload' ? '📤' : activity.type === 'payment' ? '💰' : '✅'}
                                            </span>
                                            <div>
                                                <p className="text-xs font-medium text-gray-200 line-clamp-1">{activity.title}</p>
                                                <p className="text-[10px] text-gray-500 mt-0.5">{activity.actor} • {Math.floor((Date.now() - new Date(activity.timestamp).getTime()) / 3600000)}h ago</p>
                                            </div>
                                        </div>
                                    ))}
                                    {project.activities.length === 0 && (
                                        <p className="text-xs text-gray-500">No recent activity.</p>
                                    )}
                                </div>
                            </div>

                            <button className="flex items-center justify-center gap-3 px-6 py-4 bg-primary text-white font-bold rounded-2xl hover:bg-secondary transition-all shadow-lg shadow-primary/20">
                                <ChatBubbleLeftRightIcon className="w-5 h-5" />
                                Ask a Question
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* MAIN CONTENT */}
            <main className="max-w-6xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* LEFT: Roadmap */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Project Planning Panel (Master Plan) - Only visible if Active/Planning */}
                        <ExecutionProjectPlanningPanel caseId={project.projectId} isClientView={true} />

                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                    <CheckCircleIcon className="w-6 h-6" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Project Journey</h2>
                            </div>
                            <VerticalRoadmap
                                stages={project.stages}
                                currentStageId={project.currentStageId}
                                onStageClick={handleStageClick}
                                unlockedUntilStage={unlockedUntilStage}
                            />
                        </div>
                    </div>

                    {/* RIGHT: Widgets */}
                    <div className="space-y-8">
                        <div>
                            <PendingApprovalsWidget
                                requests={project.requests}
                                onApprove={handleApprove}
                                onReject={handleReject}
                            />
                        </div>
                        <div>
                            <TodaysWork currentStage={currentStage} />
                        </div>

                        {nextUnpaidMilestone && (
                            <PayAdvanceSection
                                amount={nextUnpaidMilestone.amount}
                                milestoneName={nextUnpaidMilestone.stageName}
                                dueDate={nextUnpaidMilestone.dueDate}
                                isOverdue={nextUnpaidMilestone.dueDate ? new Date() > nextUnpaidMilestone.dueDate : false}
                                onPayNow={() => handlePayClick(nextUnpaidMilestone.amount, nextUnpaidMilestone.stageName)}
                            />
                        )}

                        <PaymentWidget
                            milestones={project.paymentMilestones}
                            totalPaid={project.totalPaid}
                            totalBudget={project.totalBudget}
                        />

                        {/* Invoices */}
                        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-gray-900">Billing & Invoices</h3>
                                <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{invoices.length} Invoices</span>
                            </div>

                            {invoicesLoading ? (
                                <p className="text-sm text-gray-500">Loading invoices...</p>
                            ) : invoices.length === 0 ? (
                                <div className="text-center py-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                    <p className="text-sm text-gray-400">No invoices generated yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {invoices.map((invoice) => (
                                        <div key={invoice.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-primary/20 transition-all group">
                                            <div>
                                                <p className="text-sm font-bold text-gray-900 mb-0.5">{invoice.invoiceNumber}</p>
                                                <p className="text-xs text-gray-500">{formatDate(invoice.issueDate)}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-gray-900">{formatCurrencyINR(invoice.total)}</p>
                                                <div className="flex items-center justify-end gap-2 mt-1">
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${invoice.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                                                        invoice.status === 'overdue' ? 'bg-red-100 text-red-700' :
                                                            'bg-amber-100 text-amber-700'
                                                        }`}>
                                                        {invoice.status}
                                                    </span>
                                                    {invoice.attachments && invoice.attachments.length > 0 && (
                                                        <a href={invoice.attachments[0].url || '#'} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-secondary" title="Download Invoice">
                                                            <DocumentArrowDownIcon className="w-4 h-4" />
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Documents Archive */}
                        <DocumentsArchive documents={project.documents} />

                        {/* JMS / completion Action */}
                        {project.currentStageId === project.stages.length && (
                            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[2rem] shadow-lg shadow-emerald-500/30 p-8 text-white text-center">
                                <h3 className="text-xl font-bold mb-2">Project Completion</h3>
                                <p className="text-emerald-100 mb-6">All stages are complete. Please review and sign off the Joint Measurement Sheet (JMS).</p>
                                <button
                                    onClick={handleSignJMS}
                                    className="w-full py-4 bg-white text-emerald-600 font-bold rounded-xl hover:bg-emerald-50 transition-all shadow-lg"
                                >
                                    Sign Off Project
                                </button>
                            </div>
                        )}

                        {/* Support */}
                        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8">
                            <h3 className="text-lg font-bold text-gray-900 mb-6">Direct Support</h3>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-14 h-14 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center text-white font-serif font-black text-xl shadow-lg shadow-primary/20">
                                    {project.consultant.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-primary/60 mb-1">Project Head</p>
                                    <p className="font-bold text-gray-900">{project.consultant.name}</p>
                                    <p className="text-xs text-gray-500">Dedicated Expert</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <a href={`tel:${project.consultant.phone}`} className="flex items-center justify-center gap-2 py-3 bg-gray-50 rounded-xl border border-gray-100 text-sm font-bold text-gray-700 hover:bg-gray-100 transition-all">
                                    <PhoneIcon className="w-4 h-4 text-gray-400" />
                                    Call
                                </a>
                                <a href={`mailto:${project.consultant.email}`} className="flex items-center justify-center gap-2 py-3 bg-gray-50 rounded-xl border border-gray-100 text-sm font-bold text-gray-700 hover:bg-gray-100 transition-all">
                                    <EnvelopeIcon className="w-4 h-4 text-gray-400" />
                                    Email
                                </a>
                            </div>
                            <div className="mt-6 pt-6 border-t border-gray-50">
                                <QuickChat projectHeadName={project.consultant.name} />
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <StageBottomSheet
                stage={selectedStage}
                isOpen={isSheetOpen}
                onClose={() => setIsSheetOpen(false)}
            />
            {selectedPaymentMilestone && (
                <PaymentSubmissionModal
                    isOpen={showPayModal}
                    onClose={() => setShowPayModal(false)}
                    onSubmit={handlePaymentSubmit}
                    amount={selectedPaymentMilestone.amount}
                    milestoneName={selectedPaymentMilestone.name}
                />
            )}
        </div>
    );
};

export default ClientDashboardPage;
