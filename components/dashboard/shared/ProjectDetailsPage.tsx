import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useCases, updateCase } from '../../../hooks/useCases';
import { useCaseQuotations } from '../../../hooks/useCases';
import { useCaseBOQs } from '../../../hooks/useCases';
import { useCaseDrawings } from '../../../hooks/useCases';
import { approveQuotation, rejectQuotation } from '../../../hooks/useCases';
import { createCaseTask, useCaseTasks, useCaseSiteVisits } from '../../../hooks/useCases';
import { Case, UserRole, CaseQuotation, CaseBOQ, CaseDrawing } from '../../../types';
import { formatCurrencyINR, safeDate, safeDateTime } from '../../../constants';
import Card from '../../shared/Card';
import { PrimaryButton, SecondaryButton } from '../shared/DashboardUI';
import { getTabFromUrl, setTabInUrl } from '../../../services/notificationRouting';
import QuotationPDFTemplate from '../quotation-team/QuotationPDFTemplate';

/**
 * UNIFIED PROJECT DETAILS PAGE
 * 
 * Route: /projects/{caseId}
 * 
 * Role-Based Visibility:
 * - Admin: Everything
 * - Sales Manager: Overview + Quotations + Timeline
 * - Sales Team: Overview + Quotations + Project Status
 * - Execution Team: Overview + Drawings + BOQ + Tasks + Materials
 * - Drawing Team: ONLY Drawings
 * - Quotation Team: ONLY Quotations
 * - Clients: Only Approved Drawings + Timeline
 */

type TabType = 'overview' | 'drawings' | 'boq' | 'quotations' | 'tasks' | 'timeline' | 'materials' | 'documents' | 'payment' | 'site-visits';

interface ProjectDetailsPageProps {
    initialTab?: TabType; // Allow external tab control (from notifications)
}

const ProjectDetailsPage: React.FC<ProjectDetailsPageProps> = ({ initialTab = 'overview' }) => {
    const { caseId } = useParams<{ caseId: string }>();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { cases, loading: casesLoading } = useCases();
    const { quotations, loading: quotationsLoading } = useCaseQuotations(caseId || '');
    const { boqs, loading: boqsLoading } = useCaseBOQs(caseId || '');
    const { drawings, loading: drawingsLoading } = useCaseDrawings(caseId || '');

    const [activeTab, setActiveTab] = useState<TabType>(initialTab);
    const [projectCase, setProjectCase] = useState<Case | null>(null);

    // Find the case
    useEffect(() => {
        if (caseId && cases.length > 0) {
            const found = cases.find(c => c.id === caseId);
            if (found) {
                setProjectCase(found);
            }
        }
    }, [caseId, cases]);

    // Update tab from external control
    useEffect(() => {
        setActiveTab(initialTab);
    }, [initialTab]);

    // Check URL for tab parameter (from notifications)
    useEffect(() => {
        const urlTab = getTabFromUrl();
        if (urlTab && canViewTab(urlTab as TabType)) {
            setActiveTab(urlTab as TabType);
        }
    }, []);

    // Role-based visibility checks (More permissive - users can see most tabs)
    const canViewTab = (tab: TabType): boolean => {
        if (!currentUser) return false;

        const role = currentUser.role;

        // Admin sees everything (including payment)
        if (role === UserRole.SUPER_ADMIN || role === UserRole.SALES_GENERAL_MANAGER) {
            return true;
        }

        // Sales Team - can see overview, drawings, quotations, documents, timeline, payment
        if (role === UserRole.SALES_TEAM_MEMBER) {
            return ['overview', 'drawings', 'quotations', 'documents', 'timeline', 'payment'].includes(tab);
        }

        // Execution Team - can see everything except sensitive financial details
        if (role === UserRole.EXECUTION_TEAM) {
            return ['overview', 'drawings', 'boq', 'quotations', 'tasks', 'materials', 'documents', 'timeline'].includes(tab);
        }

        // Drawing Team - can see drawings, documents, BOQ, tasks
        if (role === UserRole.DRAWING_TEAM) {
            return ['overview', 'drawings', 'boq', 'documents', 'tasks'].includes(tab);
        }

        // Quotation Team - can see drawings, BOQ, quotations, documents (everything needed for quotation work)
        if (role === UserRole.QUOTATION_TEAM) {
            return ['overview', 'drawings', 'boq', 'quotations', 'documents', 'tasks'].includes(tab);
        }

        // Default: at least show overview
        return tab === 'overview';
    };

    // Get available tabs for current user
    const getAvailableTabs = (): TabType[] => {
        const allTabs: TabType[] = ['overview', 'drawings', 'boq', 'quotations', 'documents', 'tasks', 'timeline', 'materials', 'payment'];
        return allTabs.filter(tab => canViewTab(tab));
    };

    if (casesLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-text-secondary">Loading project...</p>
            </div>
        );
    }

    if (!projectCase) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <h2 className="text-xl font-bold text-text-primary mb-2">Project Not Found</h2>
                    <p className="text-text-secondary mb-4">The project you're looking for doesn't exist or you don't have access.</p>
                    <SecondaryButton onClick={() => navigate('/projects')}>
                        Back to Projects
                    </SecondaryButton>
                </div>
            </div>
        );
    }

    const availableTabs = getAvailableTabs();

    return (
        <div className="min-h-screen bg-background p-6">
            {/* PROJECT HEADER */}
            <Card className="mb-6">
                <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold text-text-primary mb-2">{projectCase.projectName}</h1>
                            <p className="text-lg text-text-secondary">{projectCase.clientName}</p>
                        </div>
                        <SecondaryButton onClick={() => navigate('/projects')}>
                            ← Back to Projects
                        </SecondaryButton>
                    </div>

                    {/* Key Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                        <div>
                            <p className="text-xs font-medium text-text-tertiary uppercase">Client</p>
                            <p className="text-sm font-semibold text-text-primary">{projectCase.contact.name}</p>
                            <p className="text-xs text-text-secondary">{projectCase.contact.phone}</p>
                            {projectCase.contact.email && (
                                <p className="text-xs text-text-secondary">{projectCase.contact.email}</p>
                            )}
                        </div>

                        {projectCase.budget && (
                            <div>
                                <p className="text-xs font-medium text-text-tertiary uppercase">Total Budget</p>
                                <p className="text-lg font-bold text-primary">{formatCurrencyINR(projectCase.budget)}</p>
                            </div>
                        )}

                        <div>
                            <p className="text-xs font-medium text-text-tertiary uppercase">Status</p>
                            <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                {projectCase.status}
                            </span>
                        </div>

                        {projectCase.currentProjectStage && (
                            <div>
                                <p className="text-xs font-medium text-text-tertiary uppercase">Current Stage</p>
                                <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-success/10 text-success">
                                    {projectCase.currentProjectStage}
                                </span>
                            </div>
                        )}

                        {projectCase.projectHeadName && (
                            <div>
                                <p className="text-xs font-medium text-text-tertiary uppercase">Project Head</p>
                                <p className="text-sm font-semibold text-text-primary">{projectCase.projectHeadName}</p>
                            </div>
                        )}
                    </div>
                </div>
            </Card>

            {/* TABS */}
            <div className="mb-6">
                <div className="border-b border-border">
                    <div className="flex space-x-8">
                        {availableTabs.map(tab => (
                            <button
                                key={tab}
                                onClick={() => {
                                    setActiveTab(tab);
                                    setTabInUrl(tab); // Update URL for deep linking
                                }}
                                className={`py-4 px-2 text-sm font-medium transition-colors relative ${activeTab === tab
                                    ? 'text-primary border-b-2 border-primary'
                                    : 'text-text-secondary hover:text-text-primary'
                                    }`}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* TAB CONTENT */}
            <div>
                {activeTab === 'overview' && <OverviewTab projectCase={projectCase} />}
                {activeTab === 'drawings' && <DrawingsTab drawings={drawings} loading={drawingsLoading} caseId={caseId!} />}
                {activeTab === 'boq' && <BOQTab boqs={boqs} loading={boqsLoading} caseId={caseId!} />}
                {activeTab === 'quotations' && (
                    <QuotationsTab
                        quotations={quotations}
                        loading={quotationsLoading}
                        caseId={caseId!}
                        projectCase={projectCase}
                    />
                )}
                {activeTab === 'documents' && <DocumentsTab projectCase={projectCase} />}
                {activeTab === 'tasks' && <TasksTab caseId={caseId!} />}
                {activeTab === 'site-visits' && <SiteVisitsTab caseId={caseId!} />}
                {activeTab === 'timeline' && <TimelineTab projectCase={projectCase} />}
                {activeTab === 'materials' && <MaterialsTab caseId={caseId!} />}
                {activeTab === 'payment' && <PaymentTab projectCase={projectCase} caseId={caseId!} />}
            </div>
        </div>
    );
};

// ============================================
// TAB COMPONENTS
// ============================================

const OverviewTab: React.FC<{ projectCase: Case }> = ({ projectCase }) => {
    return (
        <Card>
            <div className="p-6">
                <h2 className="text-xl font-bold text-text-primary mb-4">Project Overview</h2>
                <div className="space-y-4">
                    <div>
                        <p className="text-sm font-medium text-text-tertiary">Priority</p>
                        <p className="text-base text-text-primary">{projectCase.priority}</p>
                    </div>

                </div>
            </div>
        </Card>
    );
};

const DrawingsTab: React.FC<{ drawings: CaseDrawing[]; loading: boolean; caseId: string }> = ({ drawings, loading }) => {
    const [selectedDrawing, setSelectedDrawing] = useState<CaseDrawing | null>(null);

    if (loading) return <Card><div className="p-6">Loading drawings...</div></Card>;

    const isImage = (fileName: string) => {
        const ext = fileName.toLowerCase().split('.').pop();
        return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext || '');
    };

    const isPDF = (fileName: string) => {
        return fileName.toLowerCase().endsWith('.pdf');
    };

    return (
        <Card>
            <div className="p-6">
                <h2 className="text-xl font-bold text-text-primary mb-4">2D Drawings</h2>
                {drawings.length === 0 ? (
                    <p className="text-text-secondary">No drawings uploaded yet.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {drawings.map(drawing => (
                            <div key={drawing.id} className="border border-border rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer"
                                onClick={() => setSelectedDrawing(drawing)}>
                                {/* Preview Thumbnail */}
                                {drawing.fileUrl && isImage(drawing.fileName || '') ? (
                                    <div className="aspect-video bg-subtle-background rounded mb-3 overflow-hidden">
                                        <img
                                            src={drawing.fileUrl}
                                            alt={drawing.fileName || 'Drawing'}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                ) : drawing.fileUrl && isPDF(drawing.fileName || '') ? (
                                    <div className="aspect-video bg-subtle-background rounded mb-3 flex items-center justify-center">
                                        <svg className="w-16 h-16 text-error" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                                            <text x="50%" y="50%" fontSize="8" textAnchor="middle" dy=".3em" fill="white">PDF</text>
                                        </svg>
                                    </div>
                                ) : (
                                    <div className="aspect-video bg-subtle-background rounded mb-3 flex items-center justify-center">
                                        <svg className="w-12 h-12 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                )}

                                <h3 className="font-semibold text-text-primary truncate">{drawing.fileName || 'Untitled Drawing'}</h3>
                                <p className="text-sm text-text-secondary">Type: {drawing.fileType}</p>
                                {drawing.category && <p className="text-sm text-text-secondary">Category: {drawing.category}</p>}
                                <p className="text-xs text-text-tertiary mt-2">Uploaded: {safeDate(drawing.uploadedAt)}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Drawing Preview Modal */}
                {selectedDrawing && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setSelectedDrawing(null)}>
                        <div className="max-w-6xl max-h-[90vh] w-full bg-background rounded-lg shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
                            <div className="p-4 border-b border-border flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-text-primary">{selectedDrawing.fileName}</h3>
                                    <p className="text-sm text-text-secondary">{selectedDrawing.category || 'Drawing'} - {safeDate(selectedDrawing.uploadedAt)}</p>
                                </div>
                                <button onClick={() => setSelectedDrawing(null)} className="text-text-tertiary hover:text-text-primary">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <div className="p-4 overflow-auto max-h-[calc(90vh-100px)]">
                                {selectedDrawing.fileUrl && isImage(selectedDrawing.fileName || '') ? (
                                    <img
                                        src={selectedDrawing.fileUrl}
                                        alt={selectedDrawing.fileName || 'Drawing'}
                                        className="w-full h-auto"
                                    />
                                ) : selectedDrawing.fileUrl && isPDF(selectedDrawing.fileName || '') ? (
                                    <iframe
                                        src={selectedDrawing.fileUrl}
                                        className="w-full h-[calc(90vh-150px)]"
                                        title={selectedDrawing.fileName || 'PDF Drawing'}
                                    />
                                ) : (
                                    <div className="text-center py-12">
                                        <p className="text-text-secondary">Preview not available</p>
                                        {selectedDrawing.fileUrl && (
                                            <a
                                                href={selectedDrawing.fileUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-primary hover:underline mt-2 inline-block"
                                            >
                                                Download File
                                            </a>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
};

const BOQTab: React.FC<{ boqs: CaseBOQ[]; loading: boolean; caseId: string }> = ({ boqs, loading }) => {
    if (loading) return <Card><div className="p-6">Loading BOQs...</div></Card>;

    return (
        <Card>
            <div className="p-6">
                <h2 className="text-xl font-bold text-text-primary mb-4">Bill of Quantities</h2>
                {boqs.length === 0 ? (
                    <p className="text-text-secondary">No BOQs created yet.</p>
                ) : (
                    <div className="grid gap-4">
                        {boqs.map(boq => (
                            <div key={boq.id} className="border border-border rounded-lg p-4">
                                <h3 className="font-semibold text-text-primary">BOQ #{boq.id.slice(-6)}</h3>
                                <p className="text-sm text-text-secondary">{boq.items.length} items</p>
                                <p className="text-lg font-bold text-primary">{formatCurrencyINR(boq.totalCost)}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Card>
    );
};

const QuotationsTab: React.FC<{
    quotations: CaseQuotation[];
    loading: boolean;
    caseId: string;
    projectCase: Case;
}> = ({ quotations, loading, projectCase, caseId }) => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [approving, setApproving] = useState<string | null>(null);
    const [rejecting, setRejecting] = useState<string | null>(null);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedQuotation, setSelectedQuotation] = useState<CaseQuotation | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');

    // PDF Modal State
    const [showPDFModal, setShowPDFModal] = useState(false);
    const [selectedPDFQuotation, setSelectedPDFQuotation] = useState<CaseQuotation | null>(null);

    // Dynamic import for PDF Template to avoid circular dependencies if any
    // However, since we are in the same project structure, direct import is preferred.
    // We'll need to make sure the import is added at the top of the file.
    // Assuming QuotationPDFTemplate is imported at top level.

    if (loading) return <Card><div className="p-6">Loading quotations...</div></Card>;

    const canApprove = currentUser?.role === UserRole.SUPER_ADMIN ||
        currentUser?.role === UserRole.SALES_GENERAL_MANAGER;

    const handleApprove = async (quotation: CaseQuotation) => {
        if (!currentUser || !canApprove) return;

        if (!window.confirm(`Approve quotation ${quotation.quotationNumber || 'QT-' + quotation.id.slice(-6)}?`)) return;

        setApproving(quotation.id);
        try {
            await approveQuotation(
                caseId,
                quotation.id,
                currentUser.id,
                currentUser.name
            );
            alert('Quotation approved successfully!');
        } catch (error) {
            console.error('Error approving quotation:', error);
            alert('Failed to approve quotation');
        } finally {
            setApproving(null);
        }
    };

    const handleRejectClick = (quotation: CaseQuotation) => {
        setSelectedQuotation(quotation);
        setShowRejectModal(true);
    };

    const handleRejectSubmit = async () => {
        if (!currentUser || !canApprove || !selectedQuotation || !rejectionReason.trim()) return;

        setRejecting(selectedQuotation.id);
        try {
            await rejectQuotation(
                caseId,
                selectedQuotation.id,
                currentUser.id,
                currentUser.name,
                rejectionReason
            );
            alert('Quotation rejected');
            setShowRejectModal(false);
            setRejectionReason('');
            setSelectedQuotation(null);
        } catch (error) {
            console.error('Error rejecting quotation:', error);
            alert('Failed to reject quotation');
        } finally {
            setRejecting(null);
        }
    };

    const handleViewPDF = (quotation: CaseQuotation) => {
        setSelectedPDFQuotation(quotation);
        setShowPDFModal(true);
    };

    return (
        <Card>
            <div className="p-6">
                <h2 className="text-xl font-bold text-text-primary mb-4">Quotations</h2>
                {quotations.length === 0 ? (
                    <p className="text-text-secondary">No quotations submitted yet.</p>
                ) : (
                    <div className="grid gap-4">
                        {quotations.map(quot => (
                            <div key={quot.id} className="border border-border rounded-lg p-4">
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <h3 className="font-semibold text-text-primary">
                                            {quot.quotationNumber || `QT-${quot.id.slice(-6)}`}
                                        </h3>
                                        <p className="text-xs text-text-tertiary">
                                            Submitted: {safeDate(quot.submittedAt)}
                                        </p>
                                    </div>
                                    {quot.status === 'Pending Approval' && (
                                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-warning/10 text-warning">
                                            🟡 Not Approved Yet
                                        </span>
                                    )}
                                    {quot.status === 'Approved' && (
                                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-success/10 text-success">
                                            ✅ Approved
                                        </span>
                                    )}
                                    {quot.status === 'Rejected' && (
                                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-error/10 text-error">
                                            ❌ Rejected
                                        </span>
                                    )}
                                </div>

                                <p className="text-lg font-bold text-primary mb-3">{formatCurrencyINR(quot.finalAmount)}</p>

                                <div className="flex gap-2 flex-wrap">
                                    {/* View PDF Button - Now Dynamic */}
                                    <SecondaryButton onClick={() => handleViewPDF(quot)}>
                                        📄 View PDF
                                    </SecondaryButton>

                                    {canApprove && quot.status === 'Pending Approval' && (
                                        <>
                                            <PrimaryButton
                                                onClick={() => handleApprove(quot)}
                                                disabled={approving === quot.id}
                                            >
                                                {approving === quot.id ? 'Approving...' : 'Approve'}
                                            </PrimaryButton>
                                            <SecondaryButton
                                                onClick={() => handleRejectClick(quot)}
                                                disabled={rejecting === quot.id}
                                                className="bg-error/10 text-error hover:bg-error/20"
                                            >
                                                Reject
                                            </SecondaryButton>
                                        </>
                                    )}

                                    {quot.status === 'Approved' && (
                                        <span className="text-xs text-text-tertiary">
                                            Approved by {quot.approvedByName} on {quot.approvedAt && safeDate(quot.approvedAt)}
                                        </span>
                                    )}

                                    {quot.status === 'Rejected' && quot.rejectionReason && (
                                        <p className="text-xs text-error">
                                            Reason: {quot.rejectionReason}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Rejection Modal */}
                {showRejectModal && selectedQuotation && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                        <div className="bg-background rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
                            <h3 className="text-lg font-bold text-text-primary mb-4">Reject Quotation</h3>
                            <p className="text-sm text-text-secondary mb-4">
                                Quotation: {selectedQuotation.quotationNumber || `QT-${selectedQuotation.id.slice(-6)}`}
                            </p>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-text-primary mb-2">
                                    Reason for Rejection *
                                </label>
                                <textarea
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    rows={4}
                                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                    placeholder="Enter reason for rejection..."
                                />
                            </div>
                            <div className="flex gap-2 justify-end">
                                <SecondaryButton
                                    onClick={() => {
                                        setShowRejectModal(false);
                                        setRejectionReason('');
                                        setSelectedQuotation(null);
                                    }}
                                    disabled={rejecting !== null}
                                >
                                    Cancel
                                </SecondaryButton>
                                <PrimaryButton
                                    onClick={handleRejectSubmit}
                                    disabled={!rejectionReason.trim() || rejecting !== null}
                                    className="bg-error hover:bg-error/90"
                                >
                                    {rejecting ? 'Rejecting...' : 'Reject Quotation'}
                                </PrimaryButton>
                            </div>
                        </div>
                    </div>
                )}

                {/* PDF Template Modal */}
                {showPDFModal && selectedPDFQuotation && (
                    /* @ts-ignore - Dynamic import component */
                    <QuotationPDFTemplate
                        quotation={selectedPDFQuotation}
                        caseData={projectCase}
                        onClose={() => {
                            setShowPDFModal(false);
                            setSelectedPDFQuotation(null);
                        }}
                    />
                )}
            </div>
        </Card>
    );
};

const TasksTab: React.FC<{ caseId: string }> = ({ caseId }) => {
    const { tasks, loading } = useCaseTasks(caseId);
    const { currentUser } = useAuth();
    const [showCreateModal, setShowCreateModal] = useState(false);

    if (loading) return <Card><div className="p-6">Loading tasks...</div></Card>;

    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, { color: string; label: string }> = {
            'ASSIGNED': { color: 'bg-warning/10 text-warning', label: 'Assigned' },
            'ONGOING': { color: 'bg-primary/10 text-primary', label: 'On Going' },
            'COMPLETED': { color: 'bg-success/10 text-success', label: 'Completed' },
            'ACKNOWLEDGED': { color: 'bg-success/20 text-success', label: 'Acknowledged' },
            'blocked': { color: 'bg-error/10 text-error', label: 'Blocked' },
        };
        // Handle lowercase versions as well for compatibility
        const normalized = status.toUpperCase();
        const config = statusMap[normalized] || { color: 'bg-gray-100 text-gray-800', label: status };
        return <span className={`px-2 py-1 rounded text-xs font-medium ${config.color}`}>{config.label}</span>;
    };

    return (
        <Card>
            <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-text-primary">Tasks History</h2>
                    {currentUser && (
                        <PrimaryButton onClick={() => setShowCreateModal(true)}>
                            + Assign Task
                        </PrimaryButton>
                    )}
                </div>

                {tasks.length === 0 ? (
                    <p className="text-text-secondary">No tasks yet. Create a task to get started.</p>
                ) : (
                    <div className="space-y-3">
                        {tasks.map(task => (
                            <div key={task.id} className="border border-border rounded-lg p-4 hover:bg-subtle-background transition-colors">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-semibold text-text-primary">{task.title}</h3>
                                            {task.taskType && (
                                                <span className="px-2 py-0.5 rounded text-xs bg-primary/10 text-primary">
                                                    {task.taskType}
                                                </span>
                                            )}
                                        </div>
                                        {task.description && (
                                            <p className="text-sm text-text-secondary mb-2">{task.description}</p>
                                        )}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                                            <div className="flex items-center gap-4 text-xs text-text-tertiary">
                                                <span>Assigned to: <span className="text-text-secondary font-medium">{task.assignedToName || 'Unknown'}</span></span>
                                                {task.dueAt && (
                                                    <span>Due: <span className="text-text-secondary font-medium">{safeDate(task.dueAt)}</span></span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-text-tertiary">
                                                {task.startedAt && (
                                                    <span>Started: <span className="text-text-secondary">{new Date(task.startedAt).toLocaleString()}</span></span>
                                                )}
                                                {task.completedAt && (
                                                    <span>Completed: <span className="text-success font-bold">{new Date(task.completedAt).toLocaleString()}</span></span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="ml-4 flex flex-col items-end gap-2">
                                        {getStatusBadge(task.status)}
                                        {task.status === 'COMPLETED' && (
                                            <span className="text-[10px] text-success italic">Awaiting Acknowledgement</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Create Task Modal - Simple version */}
                {showCreateModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                        <div className="bg-background rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
                            <h3 className="text-lg font-bold text-text-primary mb-4">Create Task</h3>
                            <p className="text-sm text-text-secondary mb-4">
                                Task creation form coming soon...
                            </p>
                            <SecondaryButton onClick={() => setShowCreateModal(false)}>
                                Close
                            </SecondaryButton>
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
};

const SiteVisitsTab: React.FC<{ caseId: string }> = ({ caseId }) => {
    const { siteVisits, loading } = useCaseSiteVisits(caseId);
    const { currentUser } = useAuth();

    if (loading) return <Card><div className="p-6">Loading site visits...</div></Card>;

    // Restrict visibility if not authorized
    const isAuthorized = currentUser?.role === UserRole.SUPER_ADMIN ||
        currentUser?.role === UserRole.SALES_GENERAL_MANAGER ||
        currentUser?.role === UserRole.EXECUTION_TEAM;

    if (!isAuthorized) {
        return (
            <Card>
                <div className="p-6 text-center">
                    <p className="text-text-secondary">Site visit details are only visible to Admins and Project Heads.</p>
                </div>
            </Card>
        );
    }

    return (
        <Card>
            <div className="p-6">
                <h2 className="text-xl font-bold text-text-primary mb-4">Site Visit Records</h2>
                {siteVisits.length === 0 ? (
                    <p className="text-text-secondary">No site visit records found for this project.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="border-b border-border">
                                <tr>
                                    <th className="py-3 px-4 text-xs font-semibold text-text-tertiary uppercase">Specialist</th>
                                    <th className="py-3 px-4 text-xs font-semibold text-text-tertiary uppercase">Start Time</th>
                                    <th className="py-3 px-4 text-xs font-semibold text-text-tertiary uppercase">End Time</th>
                                    <th className="py-3 px-4 text-xs font-semibold text-text-tertiary uppercase">Travel Distance</th>
                                    <th className="py-3 px-4 text-xs font-semibold text-text-tertiary uppercase">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {siteVisits.map(visit => (
                                    <tr key={visit.id} className="hover:bg-subtle-background transition-colors">
                                        <td className="py-4 px-4">
                                            <p className="text-sm font-medium text-text-primary">{visit.engineerName || 'Site Engineer'}</p>
                                        </td>
                                        <td className="py-4 px-4 text-sm text-text-secondary">
                                            {visit.startedAt ? safeDateTime(visit.startedAt) : '-'}
                                        </td>
                                        <td className="py-4 px-4 text-sm text-text-secondary">
                                            {visit.endedAt ? safeDateTime(visit.endedAt) : '-'}
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className="text-sm font-bold text-primary">
                                                {visit.distanceKm ? `${visit.distanceKm} km` : '-'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${visit.status === 'COMPLETED' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning animate-pulse'
                                                }`}>
                                                {visit.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </Card>
    );
};

const TimelineTab: React.FC<{ projectCase: Case }> = ({ projectCase }) => {
    return (
        <Card>
            <div className="p-6">
                <h2 className="text-xl font-bold text-text-primary mb-4">Timeline</h2>
                <div className="space-y-4">
                    {projectCase.history && projectCase.history.length > 0 ? (
                        projectCase.history.slice().reverse().map((entry, index) => (
                            <div key={index} className="flex gap-4">
                                <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                                <div>
                                    <p className="text-sm font-medium text-text-primary">{entry.action}</p>
                                    <p className="text-xs text-text-tertiary">
                                        {new Date(entry.timestamp).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-text-secondary">No timeline events yet.</p>
                    )}
                </div>
            </div>
        </Card>
    );
};

const MaterialsTab: React.FC<{ caseId: string }> = ({ caseId }) => {
    return (
        <Card>
            <div className="p-6">
                <h2 className="text-xl font-bold text-text-primary mb-4">Materials</h2>
                <p className="text-text-secondary">Materials tracking coming soon...</p>
            </div>
        </Card>
    );
};

const DocumentsTab: React.FC<{ projectCase: Case }> = ({ projectCase }) => {
    const [selectedDocument, setSelectedDocument] = useState<any>(null);

    const documents = projectCase.documents || [];

    const getFileIcon = (fileName: string) => {
        const ext = fileName.toLowerCase().split('.').pop();
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext || '')) {
            return (
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            );
        }
        if (ext === 'pdf') {
            return (
                <svg className="w-8 h-8 text-error" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                </svg>
            );
        }
        if (['doc', 'docx'].includes(ext || '')) {
            return (
                <svg className="w-8 h-8 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                </svg>
            );
        }
        return (
            <svg className="w-8 h-8 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        );
    };

    return (
        <Card>
            <div className="p-6">
                <h2 className="text-xl font-bold text-text-primary mb-4">Project Documents</h2>
                {documents.length === 0 ? (
                    <p className="text-text-secondary">No documents uploaded yet.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {documents.map((doc, index) => (
                            <div
                                key={doc.id || index}
                                className="border border-border rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer"
                                onClick={() => setSelectedDocument(doc)}
                            >
                                <div className="flex flex-col items-center text-center">
                                    <div className="mb-3">
                                        {getFileIcon(doc.name)}
                                    </div>
                                    <h3 className="font-semibold text-text-primary text-sm truncate w-full mb-1">
                                        {doc.name}
                                    </h3>
                                    <p className="text-xs text-text-secondary capitalize">
                                        {doc.type || 'Document'}
                                    </p>
                                    <p className="text-xs text-text-tertiary mt-2">
                                        {doc.uploaded ? new Date(doc.uploaded).toLocaleDateString() : 'Date unknown'}
                                    </p>
                                    {doc.url && (
                                        <a
                                            href={doc.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-primary hover:underline mt-2"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            Download
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Document Preview Modal */}
                {selectedDocument && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setSelectedDocument(null)}>
                        <div className="max-w-4xl max-h-[90vh] w-full bg-background rounded-lg shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
                            <div className="p-4 border-b border-border flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-text-primary">{selectedDocument.name}</h3>
                                    <p className="text-sm text-text-secondary">
                                        {selectedDocument.uploaded ? new Date(selectedDocument.uploaded).toLocaleDateString() : 'Date unknown'}
                                    </p>
                                </div>
                                <button onClick={() => setSelectedDocument(null)} className="text-text-tertiary hover:text-text-primary">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <div className="p-6 text-center">
                                {selectedDocument.url ? (
                                    <div className="space-y-4">
                                        <p className="text-text-secondary">Click below to view or download the document</p>
                                        <PrimaryButton
                                            onClick={() => window.open(selectedDocument.url, '_blank')}
                                        >
                                            Open Document
                                        </PrimaryButton>
                                    </div>
                                ) : (
                                    <p className="text-text-secondary">Document URL not available</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
};

// ============================================
// PAYMENT TAB
// ============================================

const PaymentTab: React.FC<{ projectCase: Case; caseId: string }> = ({ projectCase, caseId }) => {
    const { currentUser } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState(0);
    const [paymentDate, setPaymentDate] = useState('');
    const [paymentNotes, setPaymentNotes] = useState('');
    const [paymentHistory, setPaymentHistory] = useState<any[]>((projectCase as any)?.paymentHistory || []);

    // Check if user can edit (Sales Manager or Sales Team)
    const canEdit = currentUser?.role === UserRole.SUPER_ADMIN ||
        currentUser?.role === UserRole.SALES_GENERAL_MANAGER ||
        currentUser?.role === UserRole.SALES_TEAM_MEMBER;

    const handleAddPayment = async () => {
        if (!paymentAmount || paymentAmount <= 0) {
            alert('Please enter a valid payment amount');
            return;
        }

        try {
            const newPayment = {
                amount: paymentAmount,
                date: paymentDate || new Date().toISOString(),
                notes: paymentNotes,
                addedBy: currentUser?.name || 'Unknown',
                addedAt: new Date().toISOString()
            };

            const updatedHistory = [...paymentHistory, newPayment];
            const totalPaid = updatedHistory.reduce((sum, p) => sum + p.amount, 0);

            await updateCase(caseId, {
                advancePaid: totalPaid,
                paymentHistory: updatedHistory
            } as any);

            setPaymentHistory(updatedHistory);
            setPaymentAmount(0);
            setPaymentDate('');
            setPaymentNotes('');
            setIsEditing(false);
            alert('Payment added successfully!');
        } catch (error) {
            console.error('Error adding payment:', error);
            alert('Failed to add payment');
        }
    };

    const totalBudget = projectCase?.budget || 0;
    const totalPaid = paymentHistory.reduce((sum, p) => sum + p.amount, 0);
    const remainingBalance = totalBudget - totalPaid;
    const paymentProgress = totalBudget > 0 ? (totalPaid / totalBudget) * 100 : 0;

    return (
        <Card>
            <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-text-primary">Payment Information</h2>
                    {canEdit && !isEditing && (
                        <PrimaryButton onClick={() => setIsEditing(true)}>
                            Add Payment
                        </PrimaryButton>
                    )}
                </div>

                {/* Payment Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-subtle-background p-4 rounded-lg">
                        <p className="text-sm text-text-tertiary mb-1">Total Project Value</p>
                        <p className="text-2xl font-bold text-primary">{formatCurrencyINR(totalBudget)}</p>
                    </div>
                    <div className="bg-subtle-background p-4 rounded-lg">
                        <p className="text-sm text-text-tertiary mb-1">Total Paid</p>
                        <p className="text-2xl font-bold text-success">{formatCurrencyINR(totalPaid)}</p>
                    </div>
                    <div className="bg-subtle-background p-4 rounded-lg">
                        <p className="text-sm text-text-tertiary mb-1">Remaining Balance</p>
                        <p className="text-2xl font-bold text-warning">{formatCurrencyINR(remainingBalance)}</p>
                    </div>
                </div>

                {/* Payment Progress Bar */}
                <div className="mb-6">
                    <div className="flex justify-between text-sm text-text-tertiary mb-2">
                        <span>Payment Progress</span>
                        <span>{paymentProgress.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-border rounded-full h-3">
                        <div
                            className="bg-success h-3 rounded-full transition-all"
                            style={{ width: `${Math.min(paymentProgress, 100)}%` }}
                        />
                    </div>
                </div>

                {/* Add Payment Form */}
                {isEditing && canEdit && (
                    <div className="bg-surface border border-border rounded-lg p-4 mb-6">
                        <h3 className="font-bold text-text-primary mb-4">Add New Payment</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">Amount</label>
                                <input
                                    type="number"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                                    className="w-full p-2.5 border border-border rounded-lg bg-surface text-text-primary"
                                    placeholder="Enter amount"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">Payment Date</label>
                                <input
                                    type="date"
                                    value={paymentDate}
                                    onChange={(e) => setPaymentDate(e.target.value)}
                                    className="w-full p-2.5 border border-border rounded-lg bg-surface text-text-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">Notes (Optional)</label>
                                <textarea
                                    value={paymentNotes}
                                    onChange={(e) => setPaymentNotes(e.target.value)}
                                    className="w-full p-2.5 border border-border rounded-lg bg-surface text-text-primary"
                                    rows={3}
                                    placeholder="Add any notes about this payment"
                                />
                            </div>
                            <div className="flex gap-3">
                                <PrimaryButton onClick={handleAddPayment}>
                                    Save Payment
                                </PrimaryButton>
                                <SecondaryButton onClick={() => setIsEditing(false)}>
                                    Cancel
                                </SecondaryButton>
                            </div>
                        </div>
                    </div>
                )}

                {/* Payment History */}
                <div>
                    <h3 className="font-bold text-text-primary mb-4">Payment History</h3>
                    {paymentHistory.length === 0 ? (
                        <div className="text-center py-8 text-text-secondary">
                            <p>No payments recorded yet</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {paymentHistory.map((payment, index) => (
                                <div key={index} className="bg-subtle-background p-4 rounded-lg">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-bold text-lg text-success">{formatCurrencyINR(payment.amount)}</p>
                                            <p className="text-sm text-text-secondary mt-1">
                                                {new Date(payment.date).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </p>
                                            {payment.notes && (
                                                <p className="text-sm text-text-tertiary mt-2">{payment.notes}</p>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-text-tertiary">Added by</p>
                                            <p className="text-sm font-medium text-text-primary">{payment.addedBy}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
};

export default ProjectDetailsPage;
