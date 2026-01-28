import React, { useState, useEffect } from 'react';
import Card from '../../shared/Card';
import { ContentCard, SectionHeader, PrimaryButton, SecondaryButton, cn, staggerContainer, fadeInUp } from '../shared/DashboardUI';
import { motion, AnimatePresence } from 'framer-motion';
import {
    DocumentTextIcon,
    PencilSquareIcon,
    CheckCircleIcon,
    PaperAirplaneIcon,
    EyeIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import { useApprovalRequests, useApprovals } from '../../../hooks/useApprovalSystem';
import { ApprovalRequest, ApprovalRequestType, ApprovalStatus, UserRole } from '../../../types';
import { formatCurrencyINR, formatDateTime, USERS } from '../../../constants';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../shared/toast/ToastProvider';

interface QuotationItem {
    name: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    total: number;
}

// Parse items from description text
const parseQuotationItems = (description: string): QuotationItem[] => {
    const items: QuotationItem[] = [];
    const lines = description.split('\n');

    lines.forEach(line => {
        // Match pattern: "- Item Name x Qty (₹Price/unit) - Discount% OFF = ₹Total"
        // Improved regex to handle potential spaces from Intl.NumberFormat and builder formatting
        const match = line.match(/^- (.+) x (\d+) \(₹\s*([\d,]+)\/unit\) - (\d+(?:\.\d+)?)% OFF\s*=\s*₹\s*([\d,]+)/);
        if (match) {
            items.push({
                name: match[1],
                quantity: parseInt(match[2]),
                unitPrice: parseFloat(match[3].replace(/,/g, '')),
                discount: parseFloat(match[4]),
                total: parseFloat(match[5].replace(/,/g, ''))
            });
        }
    });

    return items;
};

const QuotationAuditPage: React.FC = () => {
    const { currentUser } = useAuth();
    const toast = useToast();
    const { requests: approvalRequests, loading } = useApprovalRequests(); // Get all requests
    const { submitRequest } = useApprovals();

    // Filter for quotation approvals in pending status
    const pendingQuotations = approvalRequests.filter(
        r => r.requestType === ApprovalRequestType.QUOTATION_APPROVAL &&
            r.status === ApprovalStatus.PENDING
    );

    const [selectedQuotation, setSelectedQuotation] = useState<ApprovalRequest | null>(null);
    const [editMode, setEditMode] = useState(false);
    const [editedItems, setEditedItems] = useState<QuotationItem[]>([]);
    const [submitting, setSubmitting] = useState(false);

    // When a quotation is selected, parse its items
    useEffect(() => {
        if (selectedQuotation) {
            const items = parseQuotationItems(selectedQuotation.description);
            setEditedItems(items);
        }
    }, [selectedQuotation]);

    const calculateTotal = () => {
        return editedItems.reduce((sum, item) => sum + item.total, 0);
    };

    const handlePriceChange = (index: number, newPrice: number) => {
        setEditedItems(prev => prev.map((item, i) => {
            if (i === index) {
                const baseTotal = newPrice * item.quantity;
                const discountAmount = (baseTotal * item.discount) / 100;
                return {
                    ...item,
                    unitPrice: newPrice,
                    total: baseTotal - discountAmount
                };
            }
            return item;
        }));
    };

    const handleSubmitToAdmin = async () => {
        if (!selectedQuotation || !currentUser) return;

        setSubmitting(true);
        try {
            // Create new description with updated prices
            const lineItemsDescription = editedItems.map(i =>
                `- ${i.name} x ${i.quantity} (${formatCurrencyINR(i.unitPrice)}/unit) - ${i.discount}% OFF = ${formatCurrencyINR(i.total)}`
            ).join('\n');

            const newDescription = `AUDITED QUOTATION\n\nOriginal: ${selectedQuotation.title}\n\nItems:\n${lineItemsDescription}\n\nTotal: ${formatCurrencyINR(calculateTotal())}\n\nAudited by: ${currentUser.name}`;

            // Submit as new request to Admin
            await submitRequest({
                requestType: ApprovalRequestType.QUOTATION_APPROVAL,
                title: `[AUDITED] ${selectedQuotation.title}`,
                description: newDescription,
                priority: 'High',
                contextId: selectedQuotation.contextId,
                requesterId: currentUser.id,
                requesterName: currentUser.name,
                requesterRole: currentUser.role,
                targetRole: UserRole.SUPER_ADMIN,
                startDate: new Date(),
                endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            });

            toast.success('Quotation submitted to Admin for final approval.');
            setSelectedQuotation(null);
            setEditMode(false);
        } catch (error) {
            console.error('Error submitting to admin:', error);
            toast.error('Failed to submit quotation.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                <p className="text-text-secondary animate-pulse">Loading quotations...</p>
            </div>
        );
    }

    return (
        <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-6"
        >
            <SectionHeader
                title="Quotation Audit"
                subtitle="Review quotations from Quotation Team, verify pricing, and submit to Admin"
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pending Quotations List */}
                <ContentCard>
                    <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                        <DocumentTextIcon className="w-5 h-5 text-primary" />
                        Pending Audit ({pendingQuotations.length})
                    </h3>

                    <div className="space-y-3 max-h-[600px] overflow-y-auto">
                        {pendingQuotations.length === 0 ? (
                            <div className="text-center py-12 text-text-tertiary">
                                <DocumentTextIcon className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                <p>No quotations pending audit</p>
                            </div>
                        ) : (
                            pendingQuotations.map(quotation => (
                                <Card
                                    key={quotation.id}
                                    onClick={() => setSelectedQuotation(quotation)}
                                    className={cn(
                                        "p-4 cursor-pointer hover:border-primary transition-all",
                                        selectedQuotation?.id === quotation.id && "border-primary bg-primary/5"
                                    )}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <h4 className="font-bold text-text-primary text-sm line-clamp-1">
                                            {quotation.title.replace('[APPROVAL NEEDED] ', '')}
                                        </h4>
                                        <span className="text-[10px] font-medium px-2 py-0.5 bg-amber-500/10 text-amber-500 rounded-full">
                                            Pending
                                        </span>
                                    </div>
                                    <p className="text-xs text-text-secondary line-clamp-2 mb-2">
                                        {quotation.description.slice(0, 100)}...
                                    </p>
                                    <div className="flex items-center gap-2 text-[10px] text-text-tertiary">
                                        <span>From: {quotation.requesterName}</span>
                                        <span>•</span>
                                        <span>{formatDateTime(quotation.requestedAt)}</span>
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>
                </ContentCard>

                {/* Detail/Edit Panel */}
                <ContentCard>
                    {!selectedQuotation ? (
                        <div className="flex flex-col items-center justify-center h-[400px] text-text-tertiary">
                            <EyeIcon className="w-10 h-10 mb-2 opacity-30" />
                            <p>Select a quotation to review</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-text-primary">
                                    {editMode ? 'Edit Quotation' : 'Review Quotation'}
                                </h3>
                                <div className="flex gap-2">
                                    {!editMode ? (
                                        <SecondaryButton onClick={() => setEditMode(true)}>
                                            <PencilSquareIcon className="w-4 h-4 mr-1" />
                                            Edit Prices
                                        </SecondaryButton>
                                    ) : (
                                        <SecondaryButton onClick={() => setEditMode(false)}>
                                            <XMarkIcon className="w-4 h-4 mr-1" />
                                            Cancel
                                        </SecondaryButton>
                                    )}
                                </div>
                            </div>

                            <div className="p-4 bg-subtle-background rounded-xl">
                                <p className="text-sm font-medium text-text-primary mb-1">{selectedQuotation.title}</p>
                                <p className="text-xs text-text-secondary">Submitted by {selectedQuotation.requesterName}</p>
                            </div>

                            {/* Items Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-border">
                                            <th className="text-left text-[10px] font-black uppercase tracking-widest text-text-secondary py-2">Item</th>
                                            <th className="text-left text-[10px] font-black uppercase tracking-widest text-text-secondary py-2">Qty</th>
                                            <th className="text-left text-[10px] font-black uppercase tracking-widest text-text-secondary py-2">Price</th>
                                            <th className="text-left text-[10px] font-black uppercase tracking-widest text-text-secondary py-2">Discount</th>
                                            <th className="text-right text-[10px] font-black uppercase tracking-widest text-text-secondary py-2">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                        {editedItems.map((item, index) => (
                                            <tr key={index}>
                                                <td className="py-3 text-sm text-text-primary">{item.name}</td>
                                                <td className="py-3 text-sm text-text-secondary">{item.quantity}</td>
                                                <td className="py-3">
                                                    {editMode ? (
                                                        <input
                                                            type="number"
                                                            value={item.unitPrice}
                                                            onChange={(e) => handlePriceChange(index, parseFloat(e.target.value) || 0)}
                                                            className="w-24 px-2 py-1 text-sm bg-background border border-border rounded"
                                                        />
                                                    ) : (
                                                        <span className="text-sm text-text-secondary">₹{item.unitPrice.toLocaleString()}</span>
                                                    )}
                                                </td>
                                                <td className="py-3 text-sm text-text-secondary">{item.discount}%</td>
                                                <td className="py-3 text-sm text-text-primary text-right font-medium">₹{item.total.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="border-t-2 border-border">
                                            <td colSpan={4} className="py-3 text-sm font-bold text-text-primary text-right">Grand Total:</td>
                                            <td className="py-3 text-lg font-black text-primary text-right">{formatCurrencyINR(calculateTotal())}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            {/* Submit Button */}
                            <div className="flex justify-end pt-4 border-t border-border">
                                <PrimaryButton
                                    onClick={handleSubmitToAdmin}
                                    disabled={submitting}
                                >
                                    <PaperAirplaneIcon className="w-4 h-4 mr-1" />
                                    {submitting ? 'Submitting...' : 'Submit to Admin'}
                                </PrimaryButton>
                            </div>
                        </div>
                    )}
                </ContentCard>
            </div>
        </motion.div>
    );
};

export default QuotationAuditPage;
