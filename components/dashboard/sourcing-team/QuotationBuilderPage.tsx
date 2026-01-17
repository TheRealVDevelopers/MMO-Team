
import React, { useState, useEffect } from 'react';
import Card from '../../shared/Card';
import { PlusIcon, TrashIcon, CheckCircleIcon, CalculatorIcon, DocumentTextIcon } from '../../icons/IconComponents';
import { PrimaryButton, SecondaryButton } from '../shared/DashboardUI';
import { useAuth } from '../../../context/AuthContext';
import { useProjects } from '../../../hooks/useProjects';
import { useApprovals } from '../../../hooks/useApprovalSystem';
import { Project, ProjectStatus, ApprovalRequestType, UserRole } from '../../../types';
import { formatCurrencyINR } from '../../../constants';

// Interface for items loaded from catalog
interface CatalogItem {
    id: string;
    name: string;
    category: string;
    price: number;
    description?: string;
    warranty?: string;
}

// Interface for line items in the quotation
interface QuoteLineItem extends CatalogItem {
    quantity: number;
    total: number;
}

const QuotationBuilderPage: React.FC = () => {
    const { currentUser } = useAuth();
    const { projects } = useProjects();
    const { submitRequest, loading: submitting } = useApprovals();

    // Fetch all requests to show history
    const { requests: allRequests } = useApprovals();
    // Filter for Quotation Approvals
    const quotationHistory = allRequests.filter(r => r.requestType === ApprovalRequestType.QUOTATION_APPROVAL);

    // State
    const [viewMode, setViewMode] = useState<'list' | 'select-project' | 'build'>('list');
    const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [quoteItems, setQuoteItems] = useState<QuoteLineItem[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // Form inputs for adding line item
    const [selectedCatalogId, setSelectedCatalogId] = useState('');
    const [quantity, setQuantity] = useState(1);

    // Load Catalog Items
    useEffect(() => {
        const loadCatalog = () => {
            const saved = localStorage.getItem('mmo_simple_catalog');
            if (saved) {
                setCatalogItems(JSON.parse(saved));
            }
        };
        loadCatalog();
        // Listen for storage events in case catalog updates in another tab
        window.addEventListener('storage', loadCatalog);
        return () => window.removeEventListener('storage', loadCatalog);
    }, []);

    // Filter projects that need quotation
    const activeProjects = projects.filter(p =>
        p.status === ProjectStatus.AWAITING_QUOTATION ||
        p.status === ProjectStatus.NEGOTIATING ||
        p.status === ProjectStatus.QUOTATION_SENT
    );

    const handleStartNew = () => {
        setViewMode('select-project');
    };

    const handleSelectProject = (project: Project) => {
        setSelectedProject(project);
        setViewMode('build');
    };

    const handleAddItem = () => {
        if (!selectedCatalogId || quantity <= 0) return;

        const catalogItem = catalogItems.find(i => i.id === selectedCatalogId);
        if (!catalogItem) return;

        const newItem: QuoteLineItem = {
            ...catalogItem,
            quantity: quantity,
            total: catalogItem.price * quantity
        };

        setQuoteItems(prev => [...prev, newItem]);

        // Reset inputs
        setSelectedCatalogId('');
        setQuantity(1);
    };

    const handleRemoveItem = (index: number) => {
        setQuoteItems(prev => prev.filter((_, i) => i !== index));
    };

    const calculateGrandTotal = () => {
        return quoteItems.reduce((sum, item) => sum + item.total, 0);
    };

    const handleSubmitQuotation = async () => {
        if (!selectedProject || quoteItems.length === 0 || !currentUser) return;

        // Confirm submission
        if (!window.confirm(`Submit quotation of ${formatCurrencyINR(calculateGrandTotal())} for ${selectedProject.projectName}?`)) return;

        setIsSubmitting(true);

        try {
            // Create the description with line item details
            const lineItemsDescription = quoteItems.map(i =>
                `- ${i.name} x ${i.quantity} (${formatCurrencyINR(i.price)}/unit) = ${formatCurrencyINR(i.total)}`
            ).join('\n');

            const fullDescription = `Quotation for ${selectedProject.projectName}\n\nItems:\n${lineItemsDescription}\n\nTotal Value: ${formatCurrencyINR(calculateGrandTotal())}`;

            await submitRequest({
                requestType: ApprovalRequestType.QUOTATION_APPROVAL,
                title: `Quotation for ${selectedProject.clientName} - ${selectedProject.projectName}`,
                description: fullDescription,
                priority: 'High',
                contextId: selectedProject.id, // Link to project
                requesterId: currentUser.id,
                requesterName: currentUser.name,
                requesterRole: currentUser.role,
                targetRole: UserRole.SALES_GENERAL_MANAGER, // Send to Admin/Manager for approval
                startDate: new Date(),
                endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week validity
            });

            setShowSuccess(true);
            setTimeout(() => {
                setShowSuccess(false);
                setSelectedProject(null);
                setQuoteItems([]);
                setViewMode('list'); // Return to list view
            }, 3000);

        } catch (error) {
            console.error("Failed to submit quotation:", error);
            alert("Failed to submit quotation. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (showSuccess) {
        return (
            <div className="flex flex-col items-center justify-center p-12 h-full">
                <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mb-4 text-success">
                    <CheckCircleIcon className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-bold text-text-primary mb-2">Quotation Submitted!</h2>
                <p className="text-text-secondary">Your quotation has been sent for approval.</p>
            </div>
        );
    }

    // VIEW 1: LIST OF QUOTATIONS
    if (viewMode === 'list') {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-text-primary">Quotations</h2>
                        <p className="text-sm text-text-secondary">Manage and create quotations.</p>
                    </div>
                    <PrimaryButton onClick={handleStartNew}>
                        <PlusIcon className="w-5 h-5 mr-2" />
                        Create New Quotation
                    </PrimaryButton>
                </div>

                <div className="space-y-4">
                    {quotationHistory.length === 0 ? (
                        <div className="py-12 text-center text-text-secondary bg-surface rounded-xl border border-dashed border-border">
                            <p>No quotations found. Click "Create New Quotation" to start.</p>
                        </div>
                    ) : (
                        quotationHistory.map(q => (
                            <Card key={q.id} className="hover:border-primary transition-colors">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-text-primary">{q.title}</h3>
                                        <p className="text-sm text-text-secondary mt-1 whitespace-pre-line line-clamp-2">{q.description}</p>
                                        <div className="flex items-center gap-2 mt-2 text-xs text-text-tertiary">
                                            <span>Created: {q.requestedAt ? new Date(q.requestedAt).toLocaleDateString() : 'N/A'}</span>
                                            <span>•</span>
                                            <span>By: {q.requesterName}</span>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${q.status === 'Approved' ? 'bg-success/10 text-success' :
                                            q.status === 'Rejected' ? 'bg-error/10 text-error' : 'bg-warning/10 text-warning'
                                        }`}>
                                        {q.status}
                                    </span>
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        );
    }

    // VIEW 2: SELECT PROJECT
    if (viewMode === 'select-project') {
        return (
            <div className="space-y-6">
                <div>
                    <button
                        onClick={() => setViewMode('list')}
                        className="text-sm text-text-secondary hover:text-primary mb-1 flex items-center gap-1"
                    >
                        ← Back to List
                    </button>
                    <h2 className="text-2xl font-bold text-text-primary">Select Project</h2>
                    <p className="text-sm text-text-secondary">Choose a project to create a quotation for.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activeProjects.length === 0 && (
                        <div className="col-span-full py-12 text-center text-text-secondary bg-surface rounded-xl border border-dashed border-border">
                            <p>No projects currently require a quotation.</p>
                        </div>
                    )}
                    {activeProjects.map(project => (
                        <Card
                            key={project.id}
                            onClick={() => handleSelectProject(project)}
                            className="cursor-pointer hover:border-primary transition-all hover:shadow-lg group"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2 bg-primary/10 rounded-lg text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                    <DocumentTextIcon className="w-6 h-6" />
                                </div>
                                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${project.status === ProjectStatus.AWAITING_QUOTATION ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                                    }`}>
                                    {project.status}
                                </span>
                            </div>
                            <h3 className="font-bold text-lg text-text-primary mb-1">{project.projectName}</h3>
                            <p className="text-sm text-text-secondary mb-3">{project.clientName}</p>
                            <div className="text-xs text-text-tertiary">
                                Budget: {formatCurrencyINR(project.budget)}
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    // VIEW 3: BUILDER (Existing Code)
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <button
                        onClick={() => { setSelectedProject(null); setViewMode('select-project'); }}
                        className="text-sm text-text-secondary hover:text-primary mb-1 flex items-center gap-1"
                    >
                        ← Back to Selection
                    </button>
                    <h2 className="text-2xl font-bold text-text-primary">New Quotation: {selectedProject?.projectName}</h2>
                    <p className="text-sm text-text-secondary">Client: {selectedProject?.clientName}</p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-text-secondary">Grand Total</p>
                    <p className="text-3xl font-black text-primary">{formatCurrencyINR(calculateGrandTotal())}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Item Selector */}
                <Card className="lg:col-span-1 h-fit space-y-4">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <PlusIcon className="w-5 h-5 text-primary" />
                        Add Items
                    </h3>

                    <div>
                        <label className="block text-sm font-medium mb-1">Select Item</label>
                        <select
                            className="w-full rounded-lg border-border bg-subtle-background p-2"
                            value={selectedCatalogId}
                            onChange={(e) => setSelectedCatalogId(e.target.value)}
                        >
                            <option value="">-- Choose from Catalog --</option>
                            {catalogItems.map(item => (
                                <option key={item.id} value={item.id}>
                                    {item.name} - {formatCurrencyINR(item.price)}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-text-tertiary mt-1">
                            Don't see an item? Add it in the <a href="#" className="underline">Items Catalog</a>.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Quantity</label>
                        <input
                            type="number"
                            min="1"
                            className="w-full rounded-lg border-border bg-subtle-background p-2"
                            value={quantity}
                            onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                        />
                    </div>

                    <PrimaryButton onClick={handleAddItem} disabled={!selectedCatalogId || quantity <= 0} className="w-full">
                        Add to Quote
                    </PrimaryButton>
                </Card>

                {/* Right: Quote Preview */}
                <div className="lg:col-span-2 space-y-4">
                    <Card className="min-h-[400px] flex flex-col">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <DocumentTextIcon className="w-5 h-5 text-text-secondary" />
                            Quotation Draft
                        </h3>

                        <div className="flex-1 overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-border text-xs text-text-secondary uppercase tracking-wider">
                                        <th className="py-2">Item</th>
                                        <th className="py-2 text-right">Price</th>
                                        <th className="py-2 text-center">Qty</th>
                                        <th className="py-2 text-right">Total</th>
                                        <th className="py-2 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {quoteItems.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="py-8 text-center text-text-tertiary italic">
                                                No items added yet.
                                            </td>
                                        </tr>
                                    )}
                                    {quoteItems.map((item, index) => (
                                        <tr key={index} className="border-b border-border/50 hover:bg-subtle-background/50">
                                            <td className="py-3">
                                                <p className="font-bold text-text-primary">{item.name}</p>
                                                <p className="text-xs text-text-secondary">{item.description}</p>
                                            </td>
                                            <td className="py-3 text-right tabular-nums">{formatCurrencyINR(item.price)}</td>
                                            <td className="py-3 text-center tabular-nums">{item.quantity}</td>
                                            <td className="py-3 text-right font-bold tabular-nums text-primary">{formatCurrencyINR(item.total)}</td>
                                            <td className="py-3 text-right">
                                                <button onClick={() => handleRemoveItem(index)} className="text-text-tertiary hover:text-error transition-colors">
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t-2 border-border">
                                        <td colSpan={3} className="py-4 text-right font-bold text-text-primary">Grand Total</td>
                                        <td className="py-4 text-right font-black text-xl text-primary">{formatCurrencyINR(calculateGrandTotal())}</td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        <div className="mt-8 pt-4 border-t border-border flex justify-end gap-4">
                            <SecondaryButton onClick={() => { setSelectedProject(null); setViewMode('select-project'); }} disabled={isSubmitting}>
                                Cancel
                            </SecondaryButton>
                            <PrimaryButton onClick={handleSubmitQuotation} disabled={quoteItems.length === 0 || isSubmitting}>
                                {isSubmitting ? 'Submitting...' : 'Submit for Approval'}
                            </PrimaryButton>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default QuotationBuilderPage;
