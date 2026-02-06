import React, { useState, useEffect } from 'react';
import { XMarkIcon, PlusIcon, TrashIcon, DocumentIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';
import { useCatalog } from '../../../hooks/useCatalog';
import { PrimaryButton, SecondaryButton, cn } from '../shared/DashboardUI';
import { motion, AnimatePresence } from 'framer-motion';

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

    // Reset form when opening
    useEffect(() => {
        if (isOpen) {
            setBoqItems([{ id: '1', item: '', quantity: '', unit: 'pcs', description: '' }]);
            setIsSubmitting(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

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

            for (const newItem of newItems) {
                if (!catalogItems.some(c => c.name.toLowerCase() === newItem.item.toLowerCase())) {
                    await addItem({
                        name: newItem.item,
                        category: 'General',
                        price: 0,
                        unit: newItem.unit,
                        description: newItem.description,
                        imageUrl: ''
                    });
                }
            }

            // 2. Submit the BOQ
            const finalData = boqItems.map(({ item, quantity, unit, description }) => ({
                item, quantity, unit, description
            }));

            await onSubmit(finalData);
            onClose();

        } catch (error) {
            console.error("Error in BOQ submission:", error);
            alert("Failed to submit BOQ. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto px-4 py-6 sm:p-0">
            {/* Glassmorphism Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="fixed inset-0 bg-gray-900/40 backdrop-blur-md transition-opacity"
                onClick={onClose}
            />

            {/* Modal Panel */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative transform overflow-hidden rounded-[2rem] bg-surface text-left shadow-2xl transition-all w-full max-w-4xl border border-white/10 ring-1 ring-black/5"
            >
                <form onSubmit={handleSubmit} className="flex flex-col max-h-[90vh]">
                    {/* Header */}
                    <div className="px-8 py-6 border-b border-border flex justify-between items-center bg-subtle-background/50">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary/10 rounded-2xl">
                                <DocumentIcon className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-serif font-black text-text-primary tracking-tight">
                                    Project BOQ
                                </h3>
                                <p className="text-xs font-medium text-text-tertiary uppercase tracking-widest mt-1">
                                    {projectName || 'Loading Project...'}
                                </p>
                            </div>
                        </div>
                        <button type="button" onClick={onClose} className="p-2 text-text-tertiary hover:text-text-primary hover:bg-subtle-background rounded-xl transition-all">
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Content Body */}
                    <div className="px-8 py-6 overflow-y-auto custom-scrollbar flex-1">
                        <div className="space-y-6">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-black text-text-secondary uppercase tracking-[0.2em]">Required Items</h4>
                                <span className="text-[10px] font-bold px-2 py-1 bg-primary/10 text-primary rounded-full uppercase">
                                    {boqItems.length} {boqItems.length === 1 ? 'Item' : 'Items'} Total
                                </span>
                            </div>

                            <div className="space-y-4">
                                <AnimatePresence initial={false}>
                                    {boqItems.map((row, index) => (
                                        <motion.div
                                            key={row.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20, scale: 0.95 }}
                                            transition={{ duration: 0.2 }}
                                            className="group relative grid grid-cols-12 gap-4 items-start bg-subtle-background/30 p-5 rounded-3xl border border-border hover:border-primary/30 hover:bg-subtle-background/50 transition-all shadow-sm hover:shadow-md"
                                        >
                                            {/* Item Details */}
                                            <div className="col-span-12 md:col-span-5">
                                                <label className="block text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-1.5 ml-1">
                                                    Product / Material
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    list={`catalog-items-${row.id}`}
                                                    className="w-full h-11 px-4 rounded-2xl shadow-sm text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary bg-surface text-text-primary border-border placeholder-text-tertiary transition-all"
                                                    placeholder="Search catalog or type new..."
                                                    value={row.item}
                                                    onChange={(e) => handleItemChange(row.id, 'item', e.target.value)}
                                                />
                                                <datalist id={`catalog-items-${row.id}`}>
                                                    {catalogItems.map((c) => (
                                                        <option key={c.id} value={c.name} />
                                                    ))}
                                                </datalist>
                                                {row.isCustom && row.item && (
                                                    <div className="flex items-center gap-1.5 mt-2 ml-1 text-accent">
                                                        <PlusIcon className="w-3 h-3" />
                                                        <span className="text-[10px] font-bold uppercase tracking-wider">New Catalog Entry</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Quantity */}
                                            <div className="col-span-6 md:col-span-3">
                                                <label className="block text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-1.5 ml-1">
                                                    Quantity
                                                </label>
                                                <input
                                                    type="number"
                                                    required
                                                    step="0.01"
                                                    className="w-full h-11 px-4 rounded-2xl shadow-sm text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary bg-surface text-text-primary border-border placeholder-text-tertiary transition-all"
                                                    placeholder="0.00"
                                                    value={row.quantity}
                                                    onChange={(e) => handleItemChange(row.id, 'quantity', e.target.value)}
                                                />
                                            </div>

                                            {/* Unit */}
                                            <div className="col-span-6 md:col-span-3">
                                                <label className="block text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-1.5 ml-1">
                                                    Unit
                                                </label>
                                                <select
                                                    className="w-full h-11 px-4 rounded-2xl shadow-sm text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary bg-surface text-text-primary border-border transition-all cursor-pointer"
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

                                            {/* Description */}
                                            <div className="col-span-11 md:col-span-11 mt-1">
                                                <input
                                                    type="text"
                                                    className="w-full h-10 px-4 rounded-xl text-xs bg-subtle-background/50 text-text-secondary border-transparent border focus:border-primary/20 focus:bg-surface border-dashed border-border transition-all"
                                                    placeholder="Notes / Specifications (Optional)"
                                                    value={row.description}
                                                    onChange={(e) => handleItemChange(row.id, 'description', e.target.value)}
                                                />
                                            </div>

                                            {/* Actions */}
                                            <div className="col-span-1 flex items-center justify-center pt-8">
                                                {boqItems.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveItem(row.id)}
                                                        className="p-2 text-text-tertiary hover:text-error hover:bg-error/10 rounded-xl transition-all"
                                                    >
                                                        <TrashIcon className="w-5 h-5" />
                                                    </button>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>

                            <motion.button
                                type="button"
                                whileHover={{ scale: 1.01, x: 5 }}
                                whileTap={{ scale: 0.99 }}
                                onClick={handleAddItem}
                                className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.2em] text-primary hover:text-secondary transition-all px-4 py-8 w-full border-2 border-dashed border-border rounded-[2rem] hover:border-primary/30 bg-subtle-background/20 hover:bg-primary/5"
                            >
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <PlusIcon className="w-4 h-4" />
                                </div>
                                Append Another Material Component
                            </motion.button>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="px-8 py-6 flex items-center justify-between border-t border-border bg-subtle-background/30 rounded-b-[2rem]">
                        <div className="hidden sm:flex items-center gap-2 text-text-tertiary">
                            <ShoppingCartIcon className="w-5 h-5" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Inventory List Summary</span>
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <SecondaryButton
                                type="button"
                                onClick={onClose}
                                disabled={isSubmitting || loading}
                                className="flex-1 sm:flex-none border-none shadow-none text-text-tertiary hover:text-text-primary"
                            >
                                Cancel
                            </SecondaryButton>
                            <PrimaryButton
                                type="submit"
                                disabled={isSubmitting || loading}
                                className="flex-1 sm:flex-none min-w-[240px]"
                            >
                                {isSubmitting || loading ? 'Finalizing...' : 'Finalize & Submit BOQ'}
                            </PrimaryButton>
                        </div>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default BOQSubmissionModal;
