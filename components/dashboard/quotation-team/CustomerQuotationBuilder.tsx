import React, { useState, useEffect } from 'react';
import Card from '../../shared/Card';
import { PlusIcon, TrashIcon, CheckCircleIcon, CalculatorIcon, DocumentTextIcon } from '../../icons/IconComponents';
import { PrimaryButton, SecondaryButton } from '../shared/DashboardUI';
import { useAuth } from '../../../context/AuthContext';
import { useCases, addCaseQuotation, useCaseQuotations, useCaseBOQs } from '../../../hooks/useCases';
import { useTargetedApprovalRequests, useAssignedApprovalRequests } from '../../../hooks/useApprovalSystem';
import { useCatalog } from '../../../hooks/useCatalog';
import { Case, Project, UserRole, CaseQuotation, CaseBOQ, TaskType, TaskStatus } from '../../../types';
import { formatCurrencyINR, safeDate } from '../../../constants';
import { createNotification } from '../../../services/liveDataService';
import QuotationPDFTemplate from './QuotationPDFTemplate';
import EditQuotationModal from './EditQuotationModal';
import { db } from '../../../firebase';
import { collection, doc, updateDoc, addDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { FIRESTORE_COLLECTIONS } from '../../../constants';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';

// Interface for items loaded from catalog
interface CatalogItem {
    id: string;
    name: string;
    category: string;
    price: number;
    description?: string;
    warranty?: string;
    unit?: string;
    material?: string;
    gstRate?: number;
}

// Interface for line items in the quotation
interface QuoteLineItem extends CatalogItem {
    quantity: number;
    discount: number; // Percentage
    total: number;
}

const CaseListItem: React.FC<{
    caseItem: Case;
    isPriority: boolean;
    onSelect: (c: Case) => void;
    onSubmitForAudit: (quot: any, c: Case) => Promise<void>;
    submittingForAudit: boolean;
}> = ({ caseItem, isPriority, onSelect, onSubmitForAudit, submittingForAudit }) => {
    const { boqs, loading: boqsLoading } = useCaseBOQs(caseItem.id);
    const { quotations, loading: quotationsLoading } = useCaseQuotations(caseItem.id);
    const hasBoq = boqs.length > 0;

    // Audit status from quotations (procurement audit)
    const latestQuot = quotations[0]; // Already ordered by createdAt desc
    const auditStatus = latestQuot?.auditStatus;
    const isAudited = auditStatus === 'approved';
    const isPendingAudit = auditStatus === 'pending';
    const isRejected = auditStatus === 'rejected';
    const canSubmitForAudit = quotations.some(
        (q) => q.auditStatus !== 'pending' && q.auditStatus !== 'approved'
    );
    const quotationToSubmit = quotations.find(
        (q) => q.auditStatus !== 'pending' && q.auditStatus !== 'approved'
    );

    return (
        <Card>
            <div
                className={`p-4 flex items-center justify-between transition-colors ${isPriority
                    ? 'bg-blue-50/50 border-l-4 border-blue-500'
                    : 'hover:bg-subtle-background'
                    }`}
            >
                <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-bold text-text-primary">{caseItem.projectName}</h3>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${caseItem.isProject ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                            {caseItem.isProject ? 'PROJECT' : 'LEAD'}
                        </span>
                        {isPriority && (
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700 animate-pulse">
                                ACTION REQUIRED
                            </span>
                        )}
                        {!boqsLoading && (
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${hasBoq ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                                }`}>
                                {hasBoq ? 'BOQ ATTACHED' : 'BOQ NOT ATTACHED'}
                            </span>
                        )}
                        {!quotationsLoading && quotations.length > 0 && (
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                isAudited ? 'bg-green-100 text-green-700' :
                                isPendingAudit ? 'bg-amber-100 text-amber-700' :
                                isRejected ? 'bg-red-100 text-red-700' :
                                'bg-gray-100 text-gray-500'
                            }`}>
                                {isAudited ? 'AUDITED' : isPendingAudit ? 'PENDING AUDIT' : isRejected ? 'REJECTED' : 'NOT AUDITED'}
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-text-secondary">{caseItem.clientName} • {caseItem.clientPhone || '—'}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    {canSubmitForAudit && quotationToSubmit && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onSubmitForAudit(quotationToSubmit, caseItem); }}
                            disabled={submittingForAudit}
                            className="px-3 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 font-medium text-sm flex items-center gap-1.5 disabled:opacity-50"
                            title="Submit to procurement for auditing"
                        >
                            <PaperAirplaneIcon className="w-4 h-4" />
                            {submittingForAudit ? 'Submitting...' : 'Submit for Auditing'}
                        </button>
                    )}
                    <SecondaryButton onClick={() => onSelect(caseItem)}>
                        Create Quotation
                    </SecondaryButton>
                </div>
            </div>
        </Card>
    );
};

const CustomerQuotationBuilder: React.FC = () => {
    const { currentUser } = useAuth();
    const { cases } = useCases();
    const { items: catalogItems, loading: catalogLoading } = useCatalog();

    // State
    const [viewMode, setViewMode] = useState<'list' | 'select-case' | 'build' | 'view-quotations'>('list');
    const [selectedCase, setSelectedCase] = useState<Case | null>(null);
    const [quoteItems, setQuoteItems] = useState<QuoteLineItem[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // Filters
    const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'approved' | 'pending'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedViewCase, setSelectedViewCase] = useState<Case | null>(null);

    // PDF Modal
    const [showPDFModal, setShowPDFModal] = useState(false);
    const [selectedQuotation, setSelectedQuotation] = useState<{ quotation: CaseQuotation; caseData: Case } | null>(null);

    // Edit Modal
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingQuotation, setEditingQuotation] = useState<{ quotation: CaseQuotation; caseData: Case } | null>(null);

    // Submit for Auditing
    const [submittingForAuditCaseId, setSubmittingForAuditCaseId] = useState<string | null>(null);

    // Form inputs for adding line item
    const [selectedCatalogId, setSelectedCatalogId] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [discount, setDiscount] = useState(0);
    const [ssLeft, setSsLeft] = useState<number | ''>(''); // SS Left value
    const [ssRight, setSsRight] = useState<number | ''>(''); // SS Right value

    // SS Field visibility (only for authorized roles)
    const canViewSS = currentUser?.role === UserRole.QUOTATION_TEAM ||
        currentUser?.role === UserRole.SUPER_ADMIN ||
        currentUser?.role === UserRole.SALES_GENERAL_MANAGER;

    // Fetch BOQs for selected case (used in build view)
    const { boqs: selectedCaseBOQs, loading: selectedCaseBOQsLoading } = useCaseBOQs(selectedCase?.id || '');

    // Filter: ALL eligible cases (Leads + Projects where quotation is allowed)
    const activeCases = cases.filter(c => c.status !== 'completed');

    // FETCH TARGETED REQUESTS FOR PRIORITY SORTING
    const { requests: targetedRequests = [] } = useTargetedApprovalRequests(UserRole.QUOTATION_TEAM);
    const { requests: assignedRequests = [] } = useAssignedApprovalRequests(currentUser?.id || '');

    // Identification of priority cases
    const inputRequests = [...(targetedRequests || []), ...(assignedRequests || [])];
    const priorityCaseIds = new Set(
        inputRequests
            .filter(r =>
                (r.status === 'Assigned' || r.status === 'Pending' || r.status === 'Ongoing') && // Active Only
                r.contextId // Must link to a case
            )
            .map(r => r.contextId!)
    );

    // Sorted Active Cases
    const sortedCases = [...activeCases].sort((a, b) => {
        const isAPriority = priorityCaseIds.has(a.id);
        const isBPriority = priorityCaseIds.has(b.id);

        if (isAPriority && !isBPriority) return -1;
        if (!isAPriority && isBPriority) return 1;

        // Then Sort by Newest Created
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // Submit quotation to procurement for auditing
    const handleSubmitForAudit = async (quot: any, caseData: Case) => {
        if (!db || !currentUser) return;
        setSubmittingForAuditCaseId(caseData.id);
        try {
            const quotRef = doc(db, FIRESTORE_COLLECTIONS.CASES, caseData.id, FIRESTORE_COLLECTIONS.QUOTATIONS, quot.id);
            const caseRef = doc(db, FIRESTORE_COLLECTIONS.CASES, caseData.id);

            // Normalize items for procurement (handles both old and new schema)
            const items = (quot.items || []).map((i: any) => ({
                name: i.name || i.itemName || i.description || 'Item',
                quantity: Number(i.quantity) || 0,
                unit: i.unit || 'pcs',
                rate: Number(i.rate ?? i.unitPrice ?? 0) || 0,
                total: Number(i.total ?? (i.quantity * (i.rate ?? i.unitPrice ?? 0))) || 0,
            }));
            const grandTotal = Number(quot.grandTotal ?? quot.finalAmount ?? quot.totalAmount ?? 0) || 0;
            const subtotal = Number(quot.subtotal ?? quot.totalAmount ?? grandTotal) || grandTotal;
            const discount = Number(quot.discount ?? 0) || 0;
            const discountAmount = Number(quot.discountAmount ?? 0) || 0;
            const taxRate = Number(quot.taxRate ?? 18) || 18;
            const taxAmount = Number(quot.taxAmount ?? 0) || 0;

            await updateDoc(quotRef, {
                auditStatus: 'pending',
                items,
                grandTotal,
                subtotal,
                discount,
                discountAmount,
                taxRate,
                taxAmount,
            });

            await updateDoc(caseRef, {
                status: 'QUOTATION_SUBMITTED',
                updatedAt: serverTimestamp(),
            });

            const caseSnap = await getDoc(caseRef);
            const assignedProcurement = caseSnap.exists() ? (caseSnap.data() as any).assignedProcurement : null;

            await addDoc(
                collection(db, FIRESTORE_COLLECTIONS.CASES, caseData.id, FIRESTORE_COLLECTIONS.TASKS),
                {
                    caseId: caseData.id,
                    type: TaskType.PROCUREMENT_AUDIT,
                    assignedTo: assignedProcurement || currentUser.id,
                    assignedBy: currentUser.id,
                    status: TaskStatus.PENDING,
                    startedAt: null,
                    completedAt: null,
                    notes: 'Audit quotation before admin approval',
                    createdAt: serverTimestamp(),
                }
            );

            await addDoc(
                collection(db, FIRESTORE_COLLECTIONS.CASES, caseData.id, FIRESTORE_COLLECTIONS.ACTIVITIES),
                {
                    caseId: caseData.id,
                    action: `Quotation submitted to procurement audit (₹${grandTotal.toLocaleString('en-IN')}) by ${currentUser.name || currentUser.email}`,
                    by: currentUser.id,
                    timestamp: serverTimestamp(),
                }
            );

            alert('✅ Quotation submitted to procurement for auditing.');
        } catch (err) {
            console.error('[SubmitForAudit] Error:', err);
            alert('Failed to submit for auditing. Please try again.');
        } finally {
            setSubmittingForAuditCaseId(null);
        }
    };

    // Render modals at component level (outside view conditionals)
    const renderModals = () => (
        <>
            {/* PDF Modal */}
            {showPDFModal && selectedQuotation && (
                <QuotationPDFTemplate
                    quotation={selectedQuotation.quotation}
                    caseData={selectedQuotation.caseData}
                    onClose={() => {
                        setShowPDFModal(false);
                        setSelectedQuotation(null);
                    }}
                    onEdit={() => {
                        setShowPDFModal(false);
                        setEditingQuotation(selectedQuotation);
                        setShowEditModal(true);
                    }}
                />
            )}

            {/* Edit Modal */}
            {showEditModal && editingQuotation && (
                <EditQuotationModal
                    isOpen={showEditModal}
                    onClose={() => {
                        setShowEditModal(false);
                        setEditingQuotation(null);
                    }}
                    quotation={editingQuotation.quotation}
                    caseData={editingQuotation.caseData}
                    onSuccess={() => {
                        window.location.reload();
                    }}
                />
            )}

            {/* Success Message */}
            {showSuccess && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
                    <Card>
                        <div className="p-8 text-center">
                            <CheckCircleIcon className="w-16 h-16 text-success mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-text-primary mb-2">Quotation Submitted!</h3>
                            <p className="text-text-secondary">Quotation saved successfully.</p>
                        </div>
                    </Card>
                </div>
            )}
        </>
    );

    const handleStartNew = () => {
        setViewMode('select-case');
    };

    const handleSelectCase = (caseItem: Case) => {
        setSelectedCase(caseItem);
        setViewMode('build');
    };

    const handleAddItem = () => {
        if (!selectedCatalogId || quantity <= 0) return;

        const catalogItem = catalogItems.find(i => i.id === selectedCatalogId);
        if (!catalogItem) return;

        const baseTotal = catalogItem.price * quantity;
        const discountAmount = (baseTotal * discount) / 100;
        const finalTotal = baseTotal - discountAmount;

        const newItem: QuoteLineItem = {
            ...catalogItem,
            quantity: quantity,
            discount: discount,
            total: finalTotal
        };

        setQuoteItems(prev => [...prev, newItem]);

        // Reset inputs
        setSelectedCatalogId('');
        setQuantity(1);
        setDiscount(0);
    };

    const handleRemoveItem = (index: number) => {
        setQuoteItems(prev => prev.filter((_, i) => i !== index));
    };

    const calculateGrandTotal = () => {
        return quoteItems.reduce((sum, item) => sum + item.total, 0);
    };

    const handleSubmitQuotation = async () => {
        if (!selectedCase || quoteItems.length === 0 || !currentUser) return;

        if (!window.confirm(`Submit quotation of ${formatCurrencyINR(calculateGrandTotal())} for ${selectedCase.projectName}?`)) return;

        setIsSubmitting(true);

        try {
            // Calculate totals
            const totalValue = calculateGrandTotal();
            const totalDiscount = quoteItems.reduce((sum, item) => sum + ((item.price * item.quantity) - item.total), 0);
            const taxAmount = totalValue * 0.18; // 18% GST
            const finalAmount = totalValue + taxAmount;

            // ========================================
            // SAVE QUOTATION TO CASE SUBCOLLECTION
            // ========================================
            const quotationId = await addCaseQuotation(selectedCase.id, {
                caseId: selectedCase.id,
                quotationNumber: `QT-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`,
                items: quoteItems.map(i => ({
                    itemId: i.id,
                    quantity: i.quantity,
                    unitPrice: i.price,
                    discount: i.discount
                })),
                totalAmount: totalValue + totalDiscount,
                discountAmount: totalDiscount,
                taxAmount: taxAmount,
                finalAmount: finalAmount,
                submittedBy: currentUser.id,
                submittedByName: currentUser.name,
                submittedAt: new Date(),
                status: 'Pending Approval', // Requires Admin or Sales Manager approval
                notes: `Customer quotation submitted by ${currentUser.name}`,
                ssValue: (ssLeft !== '' || ssRight !== '') ? `${ssLeft || 0}:${ssRight || 0}` : undefined // SS format: left:right
            });

            console.log(`✅ Quotation saved to cases/${selectedCase.id}/quotations/${quotationId}`);

            // Notify relevant parties
            await createNotification({
                title: 'Quotation Created',
                message: `Quotation ${formatCurrencyINR(finalAmount)} ready for ${selectedCase.clientName}`,
                user_id: (selectedCase as any).assignedTo || (selectedCase as any).salespersonId || currentUser.id,
                entity_type: selectedCase.isProject ? 'project' : 'lead',
                entity_id: selectedCase.id,
                type: 'info'
            });

            setShowSuccess(true);
            setTimeout(() => {
                setShowSuccess(false);
                setSelectedCase(null);
                setQuoteItems([]);
                setSsLeft(''); // Reset SS Left
                setSsRight(''); // Reset SS Right
                setViewMode('list');
            }, 3000);

        } catch (error) {
            console.error("Failed to submit quotation:", error);
            alert("Failed to submit quotation. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // VIEW: List of cases needing quotations
    if (viewMode === 'list') {
        return (
            <>
                {renderModals()}
                <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-text-primary">Customer Quotations</h2>
                            <p className="text-text-secondary">Create quotations for leads and projects</p>
                        </div>
                        <div className="flex gap-3">
                            <SecondaryButton onClick={() => setViewMode('view-quotations')}>
                                <DocumentTextIcon className="w-5 h-5 mr-2" />
                                View Submitted Quotations
                            </SecondaryButton>
                            <PrimaryButton onClick={handleStartNew}>
                                <PlusIcon className="w-5 h-5 mr-2" />
                                Create New Quotation
                            </PrimaryButton>
                        </div>
                    </div>

                    <div className="grid gap-4">
                        {sortedCases.length === 0 ? (
                            <Card>
                                <div className="p-12 text-center">
                                    <DocumentTextIcon className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
                                    <h3 className="text-lg font-bold text-text-primary mb-2">No Cases Available</h3>
                                    <p className="text-text-secondary">All cases have quotations or none are available.</p>
                                </div>
                            </Card>
                        ) : (
                            sortedCases.map(caseItem => (
                                <CaseListItem
                                    key={caseItem.id}
                                    caseItem={caseItem}
                                    isPriority={priorityCaseIds.has(caseItem.id)}
                                    onSelect={handleSelectCase}
                                    onSubmitForAudit={handleSubmitForAudit}
                                    submittingForAudit={submittingForAuditCaseId === caseItem.id}
                                />
                            ))
                        )}
                    </div>
                </div>
            </>
        );
    }

    // VIEW: Select case
    if (viewMode === 'select-case') {
        return (
            <>
                {renderModals()}
                <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-text-primary">Select Case</h2>
                        <SecondaryButton onClick={() => setViewMode('list')}>
                            Back to List
                        </SecondaryButton>
                    </div>

                    <div className="grid gap-4">
                        {activeCases.map(caseItem => (
                            <Card key={caseItem.id}>
                                <div
                                    className="p-4 cursor-pointer hover:bg-subtle-background transition-colors"
                                    onClick={() => handleSelectCase(caseItem)}
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold text-text-primary">{caseItem.projectName}</h3>
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${caseItem.isProject ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                            }`}>
                                            {caseItem.isProject ? 'PROJECT' : 'LEAD'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-text-secondary">{caseItem.clientName} • {caseItem.clientPhone || '—'}</p>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            </>
        );
    }

    // VIEW: Submitted Quotations with Filters
    if (viewMode === 'view-quotations') {
        // Component to display quotations and BOQs for a case
        const CaseQuotationsView: React.FC<{ caseItem: Case }> = ({ caseItem }) => {
            const { quotations, loading: quotationsLoading } = useCaseQuotations(caseItem.id);
            const { boqs, loading: boqsLoading } = useCaseBOQs(caseItem.id);
            const [expanded, setExpanded] = useState(false);

            if (!expanded) {
                const quotationCount = quotations.length;
                const boqCount = boqs.length;

                return (
                    <Card>
                        <div className="p-4 cursor-pointer hover:bg-subtle-background transition-colors" onClick={() => setExpanded(true)}>
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold text-text-primary">{caseItem.projectName}</h3>
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${caseItem.isProject ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                            }`}>
                                            {caseItem.isProject ? 'PROJECT' : 'LEAD'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-text-secondary">{caseItem.clientName} • {caseItem.clientPhone || '—'}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-text-primary">{quotationCount} Quotations</p>
                                        <p className="text-xs text-text-tertiary">{boqCount} BOQs</p>
                                    </div>
                                    <CheckCircleIcon className="w-5 h-5 text-primary" />
                                </div>
                            </div>
                        </div>
                    </Card>
                );
            }

            return (
                <Card>
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-lg font-bold text-text-primary">{caseItem.projectName}</h3>
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${caseItem.isProject ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                        }`}>
                                        {caseItem.isProject ? 'PROJECT' : 'LEAD'}
                                    </span>
                                </div>
                                <p className="text-sm text-text-secondary">{caseItem.clientName} • {caseItem.clientPhone || '—'}</p>
                            </div>
                            <button
                                onClick={() => setExpanded(false)}
                                className="text-text-tertiary hover:text-text-primary transition-colors"
                            >
                                Collapse
                            </button>
                        </div>

                        {/* Quotations Section */}
                        <div className="mb-6">
                            <h4 className="text-md font-bold text-text-primary mb-3 flex items-center gap-2">
                                <DocumentTextIcon className="w-5 h-5" />
                                Quotations ({quotations.length})
                            </h4>
                            {quotationsLoading ? (
                                <p className="text-sm text-text-secondary">Loading quotations...</p>
                            ) : quotations.length === 0 ? (
                                <p className="text-sm text-text-tertiary">No quotations submitted yet</p>
                            ) : (
                                <div className="space-y-2">
                                    {quotations.map((quot) => (
                                        <div key={quot.id} className="p-4 bg-subtle-background rounded-lg border border-border">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                        <h5 className="font-bold text-text-primary">{quot.quotationNumber}</h5>
                                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${quot.status === 'Approved' ? 'bg-green-100 text-green-700' :
                                                            quot.status === 'Pending Approval' ? 'bg-yellow-100 text-yellow-700' :
                                                                quot.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                                                                    'bg-gray-100 text-gray-700'
                                                            }`}>
                                                            {quot.status}
                                                        </span>
                                                        {quot.auditStatus && (
                                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                                                quot.auditStatus === 'approved' ? 'bg-green-100 text-green-700' :
                                                                quot.auditStatus === 'pending' ? 'bg-amber-100 text-amber-700' :
                                                                quot.auditStatus === 'rejected' ? 'bg-red-100 text-red-700' :
                                                                'bg-gray-100 text-gray-700'
                                                            }`}>
                                                                {quot.auditStatus === 'approved' ? 'AUDITED' : quot.auditStatus === 'pending' ? 'PENDING AUDIT' : quot.auditStatus === 'rejected' ? 'REJECTED' : 'NOT AUDITED'}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-text-secondary mb-1">
                                                        {quot.items.length} items • Subtotal: {formatCurrencyINR(quot.totalAmount)}
                                                    </p>
                                                    <p className="text-xs text-text-tertiary">
                                                        Submitted: {safeDate(quot.submittedAt)}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="text-right">
                                                        <p className="text-sm font-medium text-text-secondary">Tax: {formatCurrencyINR(quot.taxAmount)}</p>
                                                        <p className="text-lg font-bold text-primary">{formatCurrencyINR(quot.finalAmount || quot.grandTotal)}</p>
                                                    </div>
                                                    {quot.auditStatus !== 'pending' && quot.auditStatus !== 'approved' && (
                                                        <button
                                                            onClick={async () => {
                                                                await handleSubmitForAudit(quot, caseItem);
                                                            }}
                                                            disabled={submittingForAuditCaseId === caseItem.id}
                                                            className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium text-sm flex items-center gap-1.5 disabled:opacity-50"
                                                        >
                                                            <PaperAirplaneIcon className="w-4 h-4" />
                                                            {submittingForAuditCaseId === caseItem.id ? 'Submitting...' : 'Submit for Auditing'}
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => {
                                                            setSelectedQuotation({ quotation: quot, caseData: caseItem });
                                                            setShowPDFModal(true);
                                                        }}
                                                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm"
                                                    >
                                                        View PDF
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* BOQs Section */}
                        <div>
                            <h4 className="text-md font-bold text-text-primary mb-3 flex items-center gap-2">
                                <CalculatorIcon className="w-5 h-5" />
                                BOQs ({boqs.length})
                            </h4>
                            {boqsLoading ? (
                                <p className="text-sm text-text-secondary">Loading BOQs...</p>
                            ) : boqs.length === 0 ? (
                                <p className="text-sm text-text-tertiary">No BOQs available</p>
                            ) : (
                                <div className="space-y-2">
                                    {boqs.map((boq) => (
                                        <div key={boq.id} className="p-4 bg-subtle-background rounded-lg border border-border">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <h5 className="font-bold text-text-primary">BOQ #{boq.id.slice(-6)}</h5>
                                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${boq.status === 'Approved' ? 'bg-green-100 text-green-700' :
                                                            boq.status === 'Submitted' ? 'bg-blue-100 text-blue-700' :
                                                                'bg-gray-100 text-gray-700'
                                                            }`}>
                                                            {boq.status}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-text-secondary mb-1">
                                                        {boq.items.length} items{boq.totalCost ? ` • ${formatCurrencyINR(boq.totalCost)}` : ''}
                                                    </p>
                                                    <p className="text-xs text-text-tertiary">
                                                        Submitted: {safeDate(boq.submittedAt)}
                                                    </p>
                                                    {boq.notes && <p className="text-xs text-text-secondary mt-2">{boq.notes}</p>}
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

        // Filter cases - only show cases with quotations (pending approval or approved)
        const casesWithQuotations = cases.filter(c =>
            c.quotationStatus === 'PENDING_APPROVAL' || c.quotationStatus === 'APPROVED' || c.quotationStatus === 'REJECTED'
        );

        const filteredCases = casesWithQuotations.filter(c => {
            // Search filter
            if (searchTerm) {
                const search = searchTerm.toLowerCase();
                return (
                    c.projectName.toLowerCase().includes(search) ||
                    c.clientName.toLowerCase().includes(search) ||
                    (c.clientPhone || '').includes(search)
                );
            }
            return true;
        });

        return (
            <>
                {renderModals()}
                <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-text-primary">Submitted Quotations</h2>
                            <p className="text-text-secondary">View all submitted quotations and BOQs</p>
                        </div>
                        <SecondaryButton onClick={() => setViewMode('list')}>
                            Back to Create
                        </SecondaryButton>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap gap-4 mb-6">
                        <div className="flex-1 min-w-[200px]">
                            <input
                                type="text"
                                placeholder="Search by project, client, or phone..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Cases List */}
                    <div className="grid gap-4">
                        {filteredCases.length === 0 ? (
                            <Card>
                                <div className="p-12 text-center">
                                    <DocumentTextIcon className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
                                    <h3 className="text-lg font-bold text-text-primary mb-2">No Quotations Found</h3>
                                    <p className="text-text-secondary">No submitted quotations available.</p>
                                </div>
                            </Card>
                        ) : (
                            filteredCases.map(caseItem => (
                                <CaseQuotationsView key={caseItem.id} caseItem={caseItem} />
                            ))
                        )}
                    </div>
                </div>
            </>
        );
    }

    // VIEW: Build quotation (Redesigned Split-View)
    return (
        <>
            {renderModals()}
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-text-primary">Build Quotation</h2>
                        <p className="text-text-secondary">{selectedCase?.projectName} - {selectedCase?.clientName}</p>
                    </div>
                    <SecondaryButton onClick={() => {
                        setSelectedCase(null);
                        setQuoteItems([]);
                        setSsLeft('');
                        setSsRight('');
                        setViewMode('list');
                    }}>
                        Cancel
                    </SecondaryButton>
                </div>

                {/* SPLIT VIEW: BOQ Reference (Left) + Quotation Builder (Right) */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

                    {/* LEFT PANEL: BOQ Reference (2 cols) */}
                    <div className="lg:col-span-2 space-y-4">
                        <Card>
                            <div className="p-5 border-b border-border bg-gradient-to-r from-blue-50 to-transparent">
                                <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                                    <CalculatorIcon className="w-5 h-5 text-blue-600" />
                                    BOQ Reference
                                </h3>
                                <p className="text-sm text-text-secondary">Use these items as reference for your quotation</p>
                            </div>
                            <div className="p-4 max-h-[60vh] overflow-y-auto">
                                {selectedCaseBOQsLoading ? (
                                    <p className="text-text-tertiary text-sm py-8 text-center">Loading BOQs...</p>
                                ) : selectedCaseBOQs.length === 0 ? (
                                    <div className="py-8 text-center">
                                        <CalculatorIcon className="w-12 h-12 text-text-tertiary mx-auto mb-2" />
                                        <p className="text-text-tertiary text-sm">No BOQ attached for this case</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {selectedCaseBOQs.map((boq) => (
                                            <div key={boq.id} className="border border-border rounded-lg">
                                                <div className="p-3 bg-subtle-background border-b border-border flex items-center justify-between">
                                                    <span className="font-medium text-text-primary text-sm">BOQ #{boq.id.slice(-6)}</span>
                                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${boq.status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                                        }`}>
                                                        {boq.status}
                                                    </span>
                                                </div>
                                                <div className="p-3 space-y-2">
                                                    {boq.items.map((item, idx) => (
                                                        <div key={idx} className="flex justify-between items-start text-sm py-1 border-b border-border last:border-0">
                                                            <div className="flex-1">
                                                                <p className="text-text-primary font-medium">{item.name || item.description || `Item ${idx + 1}`}</p>
                                                                <p className="text-text-tertiary text-xs">Qty: {item.quantity} {item.unit}</p>
                                                            </div>
                                                            {item.estimatedCost && (
                                                                <span className="text-text-secondary font-medium">{formatCurrencyINR(item.estimatedCost * item.quantity)}</span>
                                                            )}
                                                        </div>
                                                    ))}
                                                    {boq.totalCost && (
                                                        <div className="pt-2 mt-2 border-t border-border flex justify-between">
                                                            <span className="font-bold text-text-primary">Total</span>
                                                            <span className="font-bold text-primary">{formatCurrencyINR(boq.totalCost)}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>

                    {/* RIGHT PANEL: Quotation Builder (3 cols) */}
                    <div className="lg:col-span-3 space-y-5">
                        {/* Add Item Form */}
                        <Card>
                            <div className="p-5 border-b border-border bg-gradient-to-r from-green-50 to-transparent">
                                <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                                    <PlusIcon className="w-5 h-5 text-green-600" />
                                    Add Items from Catalog
                                </h3>
                            </div>
                            <div className="p-5">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-text-secondary mb-2">Item</label>
                                        <select
                                            value={selectedCatalogId}
                                            onChange={(e) => setSelectedCatalogId(e.target.value)}
                                            className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                                        >
                                            <option value="">Select an item...</option>
                                            {catalogItems.map(item => (
                                                <option key={item.id} value={item.id}>
                                                    {item.name} - {formatCurrencyINR(item.price)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-text-secondary mb-2">Quantity</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={quantity}
                                            onChange={(e) => setQuantity(Number(e.target.value))}
                                            className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-text-secondary mb-2">Discount (%)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={discount}
                                            onChange={(e) => setDiscount(Number(e.target.value))}
                                            className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                        />
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <PrimaryButton onClick={handleAddItem} disabled={!selectedCatalogId || quantity <= 0}>
                                        <PlusIcon className="w-5 h-5 mr-2" />
                                        Add Item
                                    </PrimaryButton>
                                </div>
                            </div>
                        </Card>

                        {/* Items List */}
                        <Card>
                            <div className="p-5 border-b border-border">
                                <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                                    <DocumentTextIcon className="w-5 h-5 text-primary" />
                                    Quotation Items
                                    {quoteItems.length > 0 && (
                                        <span className="ml-2 px-2 py-0.5 bg-primary/10 text-primary rounded-full text-sm">
                                            {quoteItems.length} item{quoteItems.length > 1 ? 's' : ''}
                                        </span>
                                    )}
                                </h3>
                            </div>
                            <div className="p-5">
                                {quoteItems.length === 0 ? (
                                    <div className="py-12 text-center">
                                        <DocumentTextIcon className="w-12 h-12 text-text-tertiary mx-auto mb-2" />
                                        <p className="text-text-tertiary">No items added yet. Select from catalog above.</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="space-y-3 max-h-[40vh] overflow-y-auto">
                                            {quoteItems.map((item, index) => (
                                                <div key={index} className="flex items-center justify-between p-4 bg-subtle-background rounded-lg border border-border hover:border-primary/30 transition-colors">
                                                    <div className="flex-1">
                                                        <h4 className="font-bold text-text-primary">{item.name}</h4>
                                                        <p className="text-sm text-text-secondary">
                                                            {item.quantity} × {formatCurrencyINR(item.price)}
                                                            {item.discount > 0 && <span className="text-green-600 ml-1">(-{item.discount}%)</span>}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <span className="font-bold text-primary text-lg">{formatCurrencyINR(item.total)}</span>
                                                        <button
                                                            onClick={() => handleRemoveItem(index)}
                                                            className="p-2 text-error hover:bg-red-50 rounded-lg transition-colors"
                                                        >
                                                            <TrashIcon className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Totals & SS Field */}
                                        <div className="mt-6 pt-6 border-t border-border">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {/* SS Field (Visible to authorized users only) */}
                                                {canViewSS && (
                                                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                                        <label className="block text-xs font-bold text-amber-800 mb-1">PR (Internal Only)</label>
                                                        <div className="flex items-center gap-1">
                                                            <input
                                                                type="number"
                                                                value={ssLeft}
                                                                onChange={(e) => setSsLeft(e.target.value === '' ? '' : Number(e.target.value))}
                                                                placeholder="0"
                                                                className="w-16 px-2 py-1.5 border border-amber-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white text-center text-sm"
                                                            />
                                                            <span className="text-lg font-bold text-amber-700">:</span>
                                                            <input
                                                                type="number"
                                                                value={ssRight}
                                                                onChange={(e) => setSsRight(e.target.value === '' ? '' : Number(e.target.value))}
                                                                placeholder="0"
                                                                className="w-16 px-2 py-1.5 border border-amber-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white text-center text-sm"
                                                            />
                                                        </div>
                                                        <p className="text-xs text-amber-600 mt-1">Visible only to authorized personnel</p>
                                                    </div>
                                                )}

                                                {/* Totals */}
                                                <div className={`space-y-2 ${canViewSS ? '' : 'md:col-span-2'}`}>
                                                    <div className="flex justify-between text-text-secondary">
                                                        <span>Subtotal:</span>
                                                        <span className="font-medium">{formatCurrencyINR(calculateGrandTotal())}</span>
                                                    </div>
                                                    <div className="flex justify-between text-text-secondary">
                                                        <span>Tax (18% GST):</span>
                                                        <span className="font-medium">{formatCurrencyINR(calculateGrandTotal() * 0.18)}</span>
                                                    </div>
                                                    <div className="flex justify-between text-xl font-bold text-text-primary pt-3 border-t border-border">
                                                        <span>Total:</span>
                                                        <span className="text-primary">{formatCurrencyINR(calculateGrandTotal() * 1.18)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-6">
                                            <PrimaryButton
                                                onClick={handleSubmitQuotation}
                                                disabled={isSubmitting || quoteItems.length === 0}
                                                className="w-full py-3"
                                            >
                                                {isSubmitting ? (
                                                    'Submitting...'
                                                ) : (
                                                    <>
                                                        <CheckCircleIcon className="w-5 h-5 mr-2" />
                                                        Submit Quotation
                                                    </>
                                                )}
                                            </PrimaryButton>
                                        </div>
                                    </>
                                )}
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
};

export default CustomerQuotationBuilder;
