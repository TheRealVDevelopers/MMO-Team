import React, { useState, useEffect } from 'react';
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useCatalog } from '../../../hooks/useCatalog';
import { PrimaryButton, SecondaryButton } from '../shared/DashboardUI';

interface BOQItem {
    id: string; // Temporary ID for list management
    item: string;
    quantity: string;
    unit: string;
    description: string;
    isCustom?: boolean; // Track if it's a new item not in catalog
}

interface BOQSubmissionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (items: any[]) => Promise<void>;
    loading?: boolean;
    projectName?: string;
}

const BOQSubmissionModal: React.FC<BOQSubmissionModalProps> = ({ isOpen, onClose, onSubmit, loading, projectName }) => {
    const { items: catalogItems, addItem } = useCatalog();
    const [boqItems, setBoqItems] = useState<BOQItem[]>([
        { id: '1', item: '', quantity: '', unit: 'pcs', description: '' }
    ]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Debug: Log when isOpen changes
    useEffect(() => {
        console.log('BOQSubmissionModal isOpen changed to:', isOpen);
        console.log('Project name:', projectName);
    }, [isOpen, projectName]);

    // Reset form when opening
    useEffect(() => {
        if (isOpen) {
            setBoqItems([{ id: '1', item: '', quantity: '', unit: 'pcs', description: '' }]);
            setIsSubmitting(false);
        }
    }, [isOpen]);

    if (!isOpen) {
        console.log('BOQSubmissionModal: not rendering because isOpen is false');
        return null;
    }

    console.log('BOQSubmissionModal: rendering modal');

    const handleAddItem = () => {
        setBoqItems([
            ...boqItems,
            { id: Date.now().toString(), item: '', quantity: '', unit: 'pcs', description: '' }
        ]);
    };

    const handleRemoveItem = (id: string) => {
        if (boqItems.length === 1) return;
        setBoqItems(boqItems.filter(item => item.id !== id));
    };

    const handleItemChange = (id: string, field: keyof BOQItem, value: any) => {
        setBoqItems(boqItems.map(item => {
            if (item.id === id) {
                const updates: Partial<BOQItem> = { [field]: value };

                // If selecting an item from catalog, autofill unit/description if empty
                if (field === 'item') {
                    const catalogItem = catalogItems.find(c => c.name === value);
                    if (catalogItem) {
                        updates.isCustom = false;
                        if (!item.unit) updates.unit = catalogItem.unit || 'pcs';
                    } else {
                        updates.isCustom = true;
                    }
                }
                return { ...item, ...updates };
            }
            return item;
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // 1. Identify and Save new/custom items to Catalog automatically
            const newItems = boqItems.filter(i => i.isCustom && i.item.trim() !== '');

            // We do this in parallel mostly, but sequentially to avoid rate limits if any
            for (const newItem of newItems) {
                // Check uniqueness again just in case
                if (!catalogItems.some(c => c.name.toLowerCase() === newItem.item.toLowerCase())) {
                    await addItem({
                        name: newItem.item,
                        category: 'General', // Default
                        price: 0, // Needs to be set by sourcing team later
                        unit: newItem.unit,
                        description: newItem.description,
                        imageUrl: '' // Required by type
                    });
                }
            }

            // 2. Submit the BOQ
            // Strip UI-only fields like 'id' and 'isCustom' before submitting
            const finalData = boqItems.map(({ item, quantity, unit, description }) => ({
                item, quantity, unit, description
            }));

            await onSubmit(finalData);

        } catch (error) {
            console.error("Error in BOQ submission:", error);
            alert("Failed to submit BOQ. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm transition-opacity" onClick={onClose} aria-hidden="true" />

            {/* Modal Positioning Wrapper */}
            <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
                {/* Modal Panel */}
                <div className="relative transform overflow-hidden rounded-xl bg-white dark:bg-slate-900 text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-4xl border border-gray-200 dark:border-gray-700 ring-1 ring-white/5">
                    <form onSubmit={handleSubmit}>
                        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-slate-800/80">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                    Submit Bill of Quantities (BOQ)
                                </h3>
                                {projectName ? (
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Project: <span className="font-medium text-gray-900 dark:text-gray-200">{projectName}</span></p>
                                ) : (
                                    <p className="text-sm text-gray-500 mt-1 animate-pulse">Loading project details...</p>
                                )}
                            </div>
                            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-500 transition-colors">
                                <XMarkIcon className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="px-6 py-6 max-h-[60vh] overflow-y-auto">
                            <div className="space-y-4">
                                <div className="grid grid-cols-12 gap-4 text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 px-2">
                                    <div className="col-span-4">Item Details</div>
                                    <div className="col-span-2">Quantity</div>
                                    <div className="col-span-2">Unit</div>
                                    <div className="col-span-3">Description (Optional)</div>
                                    <div className="col-span-1"></div>
                                </div>

                                {boqItems.map((row, index) => (
                                    <div key={row.id} className="grid grid-cols-12 gap-4 items-start bg-gray-50 dark:bg-slate-700/30 p-3 rounded-lg border border-transparent hover:border-gray-200 dark:hover:border-gray-600 transition-colors">
                                        <div className="col-span-4">
                                            <input
                                                type="text"
                                                required
                                                list={`catalog-items-${row.id}`}
                                                className="w-full rounded-md shadow-sm sm:text-sm focus:ring-primary focus:border-primary bg-[var(--color-surface)] text-[var(--color-text-primary)] border-[var(--color-border)] placeholder-[var(--color-text-tertiary)]"
                                                placeholder="Select or type item..."
                                                value={row.item}
                                                onChange={(e) => handleItemChange(row.id, 'item', e.target.value)}
                                            />
                                            <datalist id={`catalog-items-${row.id}`}>
                                                {catalogItems.map((c) => (
                                                    <option key={c.id} value={c.name} />
                                                ))}
                                            </datalist>
                                            {row.isCustom && row.item && (
                                                <span className="text-[10px] text-amber-500 flex items-center mt-1">
                                                    * New item will be saved to catalog
                                                </span>
                                            )}
                                        </div>
                                        <div className="col-span-2">
                                            <input
                                                type="number"
                                                required
                                                step="0.01"
                                                className="w-full rounded-md shadow-sm sm:text-sm focus:ring-primary focus:border-primary bg-[var(--color-surface)] text-[var(--color-text-primary)] border-[var(--color-border)] placeholder-[var(--color-text-tertiary)]"
                                                placeholder="0.00"
                                                value={row.quantity}
                                                onChange={(e) => handleItemChange(row.id, 'quantity', e.target.value)}
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <select
                                                className="w-full rounded-md shadow-sm sm:text-sm focus:ring-primary focus:border-primary bg-[var(--color-surface)] text-[var(--color-text-primary)] border-[var(--color-border)]"
                                                value={row.unit}
                                                onChange={(e) => handleItemChange(row.id, 'unit', e.target.value)}
                                            >
                                                <option value="pcs">Pcs</option>
                                                <option value="sqft">Sq. Ft.</option>
                                                <option value="rft">Rft</option>
                                                <option value="kg">Kg</option>
                                                <option value="set">Set</option>
                                                <option value="ltr">Ltr</option>
                                                <option value="box">Box</option>
                                            </select>
                                        </div>
                                        <div className="col-span-3">
                                            <input
                                                type="text"
                                                className="w-full rounded-md shadow-sm sm:text-sm focus:ring-primary focus:border-primary bg-[var(--color-surface)] text-[var(--color-text-primary)] border-[var(--color-border)] placeholder-[var(--color-text-tertiary)]"
                                                placeholder="Notes..."
                                                value={row.description}
                                                onChange={(e) => handleItemChange(row.id, 'description', e.target.value)}
                                            />
                                        </div>
                                        <div className="col-span-1 flex justify-center pt-1.5">
                                            {boqItems.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveItem(row.id)}
                                                    className="text-gray-400 hover:text-error transition-colors"
                                                >
                                                    <TrashIcon className="w-5 h-5" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-4">
                                <button
                                    type="button"
                                    onClick={handleAddItem}
                                    className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors px-2 py-1"
                                >
                                    <PlusIcon className="w-4 h-4" />
                                    Add Another Item
                                </button>
                            </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-slate-800/50 px-6 py-4 flex flex-row-reverse gap-3 border-t border-gray-200 dark:border-gray-700">
                            <PrimaryButton type="submit" disabled={isSubmitting || loading}>
                                {isSubmitting || loading ? 'Processing...' : 'Submit BOQ & Complete Phase'}
                            </PrimaryButton>
                            <SecondaryButton onClick={onClose} disabled={isSubmitting || loading}>
                                Cancel
                            </SecondaryButton>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default BOQSubmissionModal;
