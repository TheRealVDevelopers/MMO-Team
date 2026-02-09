import React, { useState, useEffect } from 'react';
import Modal from '../../shared/Modal';
import { CaseQuotation, Case } from '../../../types';
import { useCatalog } from '../../../hooks/useCatalog';
import { formatCurrencyINR } from '../../../constants';
import { PrimaryButton, SecondaryButton } from '../shared/DashboardUI';
import { PlusIcon, TrashIcon } from '../../icons/IconComponents';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { FIRESTORE_COLLECTIONS } from '../../../constants';

interface EditQuotationModalProps {
    isOpen: boolean;
    onClose: () => void;
    quotation: CaseQuotation;
    caseData: Case;
    onSuccess: () => void;
}

interface QuoteLineItem {
    itemId: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    name?: string;
}

const EditQuotationModal: React.FC<EditQuotationModalProps> = ({
    isOpen,
    onClose,
    quotation,
    caseData,
    onSuccess
}) => {
    const { items: catalogItems } = useCatalog();
    const [quoteItems, setQuoteItems] = useState<QuoteLineItem[]>([]);
    const [selectedCatalogId, setSelectedCatalogId] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [discount, setDiscount] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Load existing items
            const itemsWithNames = quotation.items.map(item => {
                const catalogItem = catalogItems.find(ci => ci.id === item.itemId);
                return {
                    ...item,
                    name: catalogItem?.name || 'Unknown Item'
                };
            });
            setQuoteItems(itemsWithNames);
        }
    }, [isOpen, quotation, catalogItems]);

    const handleAddItem = () => {
        if (!selectedCatalogId || quantity <= 0) return;

        const catalogItem = catalogItems.find(i => i.id === selectedCatalogId);
        if (!catalogItem) return;

        const newItem: QuoteLineItem = {
            itemId: catalogItem.id,
            quantity,
            unitPrice: catalogItem.price,
            discount,
            name: catalogItem.name
        };

        setQuoteItems(prev => [...prev, newItem]);
        setSelectedCatalogId('');
        setQuantity(1);
        setDiscount(0);
    };

    const handleRemoveItem = (index: number) => {
        setQuoteItems(prev => prev.filter((_, i) => i !== index));
    };

    const calculateTotals = () => {
        const subtotal = quoteItems.reduce((sum, item) => {
            const lineTotal = item.unitPrice * item.quantity;
            const discountAmount = (lineTotal * item.discount) / 100;
            return sum + (lineTotal - discountAmount);
        }, 0);
        const tax = subtotal * 0.18;
        const total = subtotal + tax;
        return { subtotal, tax, total };
    };

    const handleSubmit = async () => {
        if (quoteItems.length === 0) {
            alert('Please add at least one item');
            return;
        }

        setIsSubmitting(true);

        try {
            const { subtotal, tax, total } = calculateTotals();
            const totalDiscount = quoteItems.reduce((sum, item) => {
                const lineTotal = item.unitPrice * item.quantity;
                const discountAmount = (lineTotal * item.discount) / 100;
                return sum + discountAmount;
            }, 0);

            // Update quotation in Firestore
            const quotationRef = doc(
                db,
                FIRESTORE_COLLECTIONS.CASES,
                caseData.id,
                'quotations',
                quotation.id
            );

            await updateDoc(quotationRef, {
                items: quoteItems.map(i => ({
                    itemId: i.itemId,
                    quantity: i.quantity,
                    unitPrice: i.unitPrice,
                    discount: i.discount
                })),
                totalAmount: subtotal + totalDiscount,
                discountAmount: totalDiscount,
                taxAmount: tax,
                finalAmount: total,
                updatedAt: new Date()
            });

            alert('Quotation updated successfully!');
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error updating quotation:', error);
            alert('Failed to update quotation. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const { subtotal, tax, total } = calculateTotals();

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Edit Quotation - ${quotation.quotationNumber}`} size="4xl">
            <div className="p-6 space-y-6">
                {/* Case Info */}
                <div className="bg-subtle-background p-4 rounded-lg">
                    <h3 className="font-bold text-text-primary mb-1">{caseData.projectName}</h3>
                    <p className="text-sm text-text-secondary">{caseData.clientName} • {caseData.contact?.phone || caseData.clientPhone || '—'}</p>
                </div>

                {/* Add Item Form */}
                <div className="border border-border rounded-lg p-4">
                    <h3 className="text-lg font-bold text-text-primary mb-4">Add Items</h3>
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
                        <button
                            onClick={handleAddItem}
                            disabled={!selectedCatalogId || quantity <= 0}
                            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <PlusIcon className="w-5 h-5" />
                            Add Item
                        </button>
                    </div>
                </div>

                {/* Items List */}
                {quoteItems.length > 0 && (
                    <div className="border border-border rounded-lg p-4">
                        <h3 className="text-lg font-bold text-text-primary mb-4">Quotation Items</h3>
                        <div className="space-y-3">
                            {quoteItems.map((item, index) => {
                                const lineTotal = item.unitPrice * item.quantity;
                                const discountAmount = (lineTotal * item.discount) / 100;
                                const finalAmount = lineTotal - discountAmount;

                                return (
                                    <div key={index} className="flex items-center justify-between p-4 bg-subtle-background rounded-lg">
                                        <div className="flex-1">
                                            <h4 className="font-bold text-text-primary">{item.name}</h4>
                                            <p className="text-sm text-text-secondary">
                                                {item.quantity} × {formatCurrencyINR(item.unitPrice)} 
                                                {item.discount > 0 && ` - ${item.discount}% discount`}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="font-bold text-primary">{formatCurrencyINR(finalAmount)}</span>
                                            <button
                                                onClick={() => handleRemoveItem(index)}
                                                className="p-2 text-error hover:bg-error-subtle-background rounded-lg transition-colors"
                                            >
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Totals */}
                        <div className="mt-6 pt-6 border-t border-border space-y-2">
                            <div className="flex justify-between text-text-secondary">
                                <span>Subtotal:</span>
                                <span className="font-medium">{formatCurrencyINR(subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-text-secondary">
                                <span>Tax (18% GST):</span>
                                <span className="font-medium">{formatCurrencyINR(tax)}</span>
                            </div>
                            <div className="flex justify-between text-xl font-bold text-text-primary pt-2 border-t border-border">
                                <span>Total:</span>
                                <span className="text-primary">{formatCurrencyINR(total)}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-3">
                    <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
                    <PrimaryButton
                        onClick={handleSubmit}
                        disabled={isSubmitting || quoteItems.length === 0}
                    >
                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </PrimaryButton>
                </div>
            </div>
        </Modal>
    );
};

export default EditQuotationModal;
