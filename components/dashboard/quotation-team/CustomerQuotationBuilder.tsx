import React, { useState, useEffect } from 'react';
import Card from '../../shared/Card';
import { PlusIcon, TrashIcon, CheckCircleIcon, CalculatorIcon, DocumentTextIcon } from '../../icons/IconComponents';
import { PrimaryButton, SecondaryButton } from '../shared/DashboardUI';
import { useAuth } from '../../../context/AuthContext';
import { useCases, addCaseQuotation, useCaseQuotations, useCaseBOQs } from '../../../hooks/useCases';
import { useCatalog } from '../../../hooks/useCatalog';
import { Case, Project, UserRole, CaseQuotation, CaseBOQ } from '../../../types';
import { formatCurrencyINR } from '../../../constants';
import { createNotification } from '../../../services/liveDataService';
import QuotationPDFTemplate from './QuotationPDFTemplate';
import EditQuotationModal from './EditQuotationModal';

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
    const [selectedQuotation, setSelectedQuotation] = useState<{quotation: CaseQuotation; caseData: Case} | null>(null);
    
    // Edit Modal
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingQuotation, setEditingQuotation] = useState<{quotation: CaseQuotation; caseData: Case} | null>(null);

    // Form inputs for adding line item
    const [selectedCatalogId, setSelectedCatalogId] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [discount, setDiscount] = useState(0);

    // Filter cases that need quotations
    const activeCases = cases.filter(c => 
        !c.quotationStatus || c.quotationStatus === 'NONE'
    );

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
                notes: `Customer quotation submitted by ${currentUser.name}`
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
                    {activeCases.length === 0 ? (
                        <Card>
                            <div className="p-12 text-center">
                                <DocumentTextIcon className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-text-primary mb-2">No Cases Available</h3>
                                <p className="text-text-secondary">All cases have quotations or none are available.</p>
                            </div>
                        </Card>
                    ) : (
                        activeCases.map(caseItem => (
                            <Card key={caseItem.id}>
                                <div className="p-4 flex items-center justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-bold text-text-primary">{caseItem.projectName}</h3>
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                                caseItem.isProject ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                            }`}>
                                                {caseItem.isProject ? 'PROJECT' : 'LEAD'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-text-secondary">{caseItem.clientName} • {caseItem.contact.phone}</p>
                                    </div>
                                    <SecondaryButton onClick={() => handleSelectCase(caseItem)}>
                                        Create Quotation
                                    </SecondaryButton>
                                </div>
                            </Card>
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
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                        caseItem.isProject ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                    }`}>
                                        {caseItem.isProject ? 'PROJECT' : 'LEAD'}
                                    </span>
                                </div>
                                <p className="text-sm text-text-secondary">{caseItem.clientName} • {caseItem.contact.phone}</p>
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
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                            caseItem.isProject ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                        }`}>
                                            {caseItem.isProject ? 'PROJECT' : 'LEAD'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-text-secondary">{caseItem.clientName} • {caseItem.contact.phone}</p>
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
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                        caseItem.isProject ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                    }`}>
                                        {caseItem.isProject ? 'PROJECT' : 'LEAD'}
                                    </span>
                                </div>
                                <p className="text-sm text-text-secondary">{caseItem.clientName} • {caseItem.contact.phone}</p>
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
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <h5 className="font-bold text-text-primary">{quot.quotationNumber}</h5>
                                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                                            quot.status === 'Approved' ? 'bg-green-100 text-green-700' :
                                                            quot.status === 'Pending Approval' ? 'bg-yellow-100 text-yellow-700' :
                                                            quot.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                                                            'bg-gray-100 text-gray-700'
                                                        }`}>
                                                            {quot.status}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-text-secondary mb-1">
                                                        {quot.items.length} items • Subtotal: {formatCurrencyINR(quot.totalAmount)}
                                                    </p>
                                                    <p className="text-xs text-text-tertiary">
                                                        Submitted: {new Date(quot.submittedAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="text-right">
                                                        <p className="text-sm font-medium text-text-secondary">Tax: {formatCurrencyINR(quot.taxAmount)}</p>
                                                        <p className="text-lg font-bold text-primary">{formatCurrencyINR(quot.finalAmount)}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            console.log('Opening PDF for quotation:', quot.quotationNumber);
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
                                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                                            boq.status === 'Approved' ? 'bg-green-100 text-green-700' :
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
                                                        Submitted: {new Date(boq.submittedAt).toLocaleDateString()}
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
                    c.contact.phone.includes(search)
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

    // VIEW: Build quotation
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
                    setViewMode('list');
                }}>
                    Cancel
                </SecondaryButton>
            </div>

            {/* Add Item Form */}
            <Card>
                <div className="p-6">
                    <h3 className="text-lg font-bold text-text-primary mb-4">Add Items from Catalog</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-text-secondary mb-2">Item</label>
                            <select
                                value={selectedCatalogId}
                                onChange={(e) => setSelectedCatalogId(e.target.value)}
                                className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
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
                                className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
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
                                className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
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
            {quoteItems.length > 0 && (
                <Card>
                    <div className="p-6">
                        <h3 className="text-lg font-bold text-text-primary mb-4">Quotation Items</h3>
                        <div className="space-y-3">
                            {quoteItems.map((item, index) => (
                                <div key={index} className="flex items-center justify-between p-4 bg-subtle-background rounded-lg">
                                    <div className="flex-1">
                                        <h4 className="font-bold text-text-primary">{item.name}</h4>
                                        <p className="text-sm text-text-secondary">
                                            {item.quantity} × {formatCurrencyINR(item.price)} 
                                            {item.discount > 0 && ` - ${item.discount}% discount`}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="font-bold text-primary">{formatCurrencyINR(item.total)}</span>
                                        <button
                                            onClick={() => handleRemoveItem(index)}
                                            className="p-2 text-error hover:bg-error-subtle-background rounded-lg transition-colors"
                                        >
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Totals */}
                        <div className="mt-6 pt-6 border-t border-border space-y-2">
                            <div className="flex justify-between text-text-secondary">
                                <span>Subtotal:</span>
                                <span className="font-medium">{formatCurrencyINR(calculateGrandTotal())}</span>
                            </div>
                            <div className="flex justify-between text-text-secondary">
                                <span>Tax (18% GST):</span>
                                <span className="font-medium">{formatCurrencyINR(calculateGrandTotal() * 0.18)}</span>
                            </div>
                            <div className="flex justify-between text-xl font-bold text-text-primary pt-2 border-t border-border">
                                <span>Total:</span>
                                <span className="text-primary">{formatCurrencyINR(calculateGrandTotal() * 1.18)}</span>
                            </div>
                        </div>

                        <div className="mt-6">
                            <PrimaryButton 
                                onClick={handleSubmitQuotation} 
                                disabled={isSubmitting || quoteItems.length === 0}
                                className="w-full"
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
                    </div>
                </Card>
            )}
        </div>
        </>
    );
};

export default CustomerQuotationBuilder;
