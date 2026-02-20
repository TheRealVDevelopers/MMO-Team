import React, { useState } from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

// Command Center (redesigned client project page)
import ClientProjectCommandCenter from '../client-portal/ClientProjectCommandCenter';
import ForcePasswordResetModal from '../client-portal/ForcePasswordResetModal';
import PaymentSubmissionModal from '../client-portal/PaymentSubmissionModal';

import type { JourneyStage } from '../client-portal/types';
import { useInvoices } from '../../hooks/useInvoices';
import { CompanyInfo } from '../../types';
import { useClientCase } from '../../hooks/useClientCase';
import { usePendingJMS } from '../../hooks/usePendingJMS';

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
    clientUser: { uid: string; email: string; isFirstLogin: boolean; selectedCaseId?: string; cases?: any[] } | null;
    onLogout: () => void;
    caseId?: string; // Optional: For B2I Parent View
    isReadOnly?: boolean; // Optional: Disables actions
    onBack?: () => void; // Optional: Custom back handler for ReadOnly view
}

const ClientDashboardPage: React.FC<ClientDashboardPageProps> = ({ clientUser, onLogout, caseId, isReadOnly, onBack }) => {
    // Determine the active case ID — ensure it's always a string
    const rawId = caseId || clientUser?.selectedCaseId || clientUser?.cases?.[0]?.id || '';
    const activeCaseId = typeof rawId === 'string' ? rawId : String(rawId || '');

    console.log('[ClientDashboardPage] activeCaseId:', activeCaseId, 'type:', typeof activeCaseId, 'clientUser:', clientUser ? { uid: clientUser.uid, selectedCaseId: clientUser.selectedCaseId, casesCount: clientUser.cases?.length } : null);

    // 1. Data Fetching
    const { project, loading, error } = useClientCase(activeCaseId);
    const projectId = project?.projectId || '';
    console.log('[ClientDashboardPage] projectId for invoices/JMS:', projectId, 'type:', typeof projectId);
    const { invoices, loading: invoicesLoading } = useInvoices(projectId);
    const { pendingDoc: pendingJMS, signedDoc: signedJMS, loading: jmsLoading } = usePendingJMS(projectId || undefined);

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
            if (!project || (!clientUser && !isReadOnly)) return;

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
                project.consultant.id,
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
        if (isReadOnly) return;
        setSelectedPaymentMilestone({ amount, name });
        setShowPayModal(true);
    };

    const handleApprove = async (requestId: string) => {
        try {
            if (isReadOnly) return;
            if (!project || !clientUser) return;
            const { ClientPortalService } = await import('../../services/clientPortalService');
            await ClientPortalService.approveRequest(project.projectId, requestId, clientUser.uid);
        } catch (error) {
            console.error("Error approving request:", error);
            alert('Failed to approve request.');
        }
    };

    const handleReject = async (requestId: string, reason: string) => {
        try {
            if (isReadOnly) return;
            if (!project || !clientUser) return;
            const { ClientPortalService } = await import('../../services/clientPortalService');
            await ClientPortalService.rejectRequest(project.projectId, requestId, clientUser.uid, reason);
        } catch (error) {
            console.error("Error rejecting request:", error);
            alert('Failed to reject request.');
        }
    };

    const handleSignJMS = async () => {
        if (isReadOnly) return;
        if (!confirm("Are you sure you want to sign off on the project completion? This confirms all work is satisfactory.")) return;
        try {
            if (!project || !clientUser) return;
            const signatureUrl = "https://ui-avatars.com/api/?name=" + encodeURIComponent(project.clientName) + "&background=random&length=2";
            const { ClientPortalService } = await import('../../services/clientPortalService');
            await ClientPortalService.signJMS(project.projectId, { signatureUrl }, clientUser.uid);
            alert("Project Signed Off Successfully!");
        } catch (err) {
            console.error("Error signing JMS:", err);
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

    const nextUnpaidMilestone = project.paymentMilestones.find(m => !m.isPaid);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a]">
            {showResetModal && (
                <ForcePasswordResetModal
                    uid={clientUser?.uid || ''}
                    onSuccess={handlePasswordResetSuccess}
                />
            )}
            <ClientProjectCommandCenter
                project={project}
                invoices={invoices}
                invoicesLoading={invoicesLoading}
                pendingJMS={pendingJMS}
                signedJMS={signedJMS}
                jmsLoading={jmsLoading}
                clientUser={clientUser}
                isReadOnly={isReadOnly}
                onBack={onBack ?? undefined}
                onLogout={onLogout}
                onResetPassword={clientUser?.isFirstLogin ? () => setShowResetModal(true) : undefined}
                onStageClick={handleStageClick}
                onApprove={handleApprove}
                onReject={handleReject}
                onPayClick={handlePayClick}
                onSignJMS={handleSignJMS}
                selectedStage={selectedStage}
                isSheetOpen={isSheetOpen}
                onCloseSheet={() => setIsSheetOpen(false)}
                nextUnpaidMilestone={nextUnpaidMilestone ?? null}
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
