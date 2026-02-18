import React, { useState } from 'react';
import { db } from '../../../firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, getDoc } from 'firebase/firestore';
import { FIRESTORE_COLLECTIONS } from '../../../constants';
import { useCatalog } from '../../../hooks/useCatalog';
import { CaseBOQ, BOQItemData, Case, TaskType, TaskStatus } from '../../../types';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { generateBOQPDF } from '../../../services/pdfGenerationService';

interface CreateBOQModalProps {
    isOpen: boolean;
    onClose: () => void;
    caseId: string;
    currentUser: any;
    onBOQCreated?: () => void; // Optional callback when BOQ is created
}

const CreateBOQModal: React.FC<CreateBOQModalProps> = ({
    isOpen,
    onClose,
    caseId,
    currentUser,
    onBOQCreated
}) => {
    const { items: catalogItems } = useCatalog();
    const [showCatalogModal, setShowCatalogModal] = useState(false);
    const [boqItems, setBoqItems] = useState<BOQItemData[]>([]);
    const [submitting, setSubmitting] = useState(false);

    if (!isOpen) return null;

    const addItemsFromCatalog = (selectedItems: any[]) => {
        const newItems: BOQItemData[] = selectedItems.map(item => ({
            catalogItemId: item.id,
            name: item.name,
            unit: item.unit || 'pcs',
            quantity: 1,
            rate: 0, // Rate will be filled by quotation team, not by BOQ creator
            total: 0
        }));
        setBoqItems([...boqItems, ...newItems]);
        setShowCatalogModal(false);
    };

    const updateItem = (index: number, field: keyof BOQItemData, value: any) => {
        setBoqItems(items => items.map((item, i) => {
            if (i === index) {
                const updated = { ...item, [field]: value };
                // BOQ creator only sets quantity, rate stays 0
                return updated;
            }
            return item;
        }));
    };

    const removeItem = (index: number) => {
        setBoqItems(items => items.filter((_, i) => i !== index));
    };

    const subtotal = 0; // BOQ has no rates, so subtotal is 0

    const handleSubmit = async () => {
        if (boqItems.length === 0) {
            alert('❌ Please add at least one item from catalog');
            return;
        }

        setSubmitting(true);

        try {
            // Get case data first
            const caseRef = doc(db!, FIRESTORE_COLLECTIONS.CASES, caseId);
            const caseSnap = await getDoc(caseRef);
            
            if (!caseSnap.exists()) {
                throw new Error('Case not found');
            }
            
            const caseData = caseSnap.data() as Case;

            // 1. Save BOQ to cases/{caseId}/boq
            const boqData: Omit<CaseBOQ, 'id' | 'pdfUrl'> & { pdfUrl: string } = {
                caseId,
                items: boqItems,
                subtotal,
                createdBy: currentUser.id,
                createdAt: serverTimestamp(),
                pdfUrl: '' // Will be updated after PDF generation
            };

            const boqRef = await addDoc(
                collection(db!, FIRESTORE_COLLECTIONS.CASES, caseId, FIRESTORE_COLLECTIONS.BOQ),
                boqData
            );

            console.log('[BOQ] ✅ Created BOQ:', boqRef.id);

            // 2. Generate PDF
            const boqWithId: CaseBOQ = {
                ...boqData,
                id: boqRef.id
            };
            
            const pdfUrl = await generateBOQPDF(boqWithId, { ...caseData, id: caseId });
            
            // Update BOQ with PDF URL
            await updateDoc(boqRef, { pdfUrl });

            console.log('[BOQ] ✅ PDF generated:', pdfUrl);

            // 3. Log activity
            await addDoc(
                collection(db!, FIRESTORE_COLLECTIONS.CASES, caseId, FIRESTORE_COLLECTIONS.ACTIVITIES),
                {
                    caseId,
                    action: `BOQ created with ${boqItems.length} items`,
                    by: currentUser.id,
                    timestamp: serverTimestamp()
                }
            );

            // 4. Auto-create QUOTATION_TASK
            const quotationTeamId = (caseData as any).assignedQuotationTeam || currentUser.id;

            await addDoc(
                collection(db!, FIRESTORE_COLLECTIONS.CASES, caseId, FIRESTORE_COLLECTIONS.TASKS),
                {
                    caseId,
                    type: TaskType.QUOTATION_TASK,
                    assignedTo: quotationTeamId,
                    assignedBy: currentUser.id,
                    status: TaskStatus.PENDING,
                    startedAt: null,
                    completedAt: null,
                    notes: `BOQ created with ${boqItems.length} items. Create quotation.`,
                    createdAt: serverTimestamp()
                }
            );

            await addDoc(
                collection(db!, FIRESTORE_COLLECTIONS.CASES, caseId, FIRESTORE_COLLECTIONS.ACTIVITIES),
                {
                    caseId,
                    action: 'Quotation task created automatically from BOQ',
                    by: currentUser.id,
                    timestamp: serverTimestamp()
                }
            );

            console.log('[BOQ] ✅ QUOTATION_TASK created');

            alert('✅ BOQ created successfully! Quotation task assigned.');
            
            // Call parent callback if provided
            if (onBOQCreated) {
                onBOQCreated();
            }
            
            onClose();
        } catch (error) {
            console.error('[BOQ] Error:', error);
            alert('Failed to create BOQ. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 rounded-t-2xl">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold">Create BOQ</h2>
                            <p className="text-purple-100 text-sm mt-1">Select items from catalog</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2"
                        >
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Add Item Button */}
                    <div className="flex justify-between items-center">
                        <h3 className="font-bold text-gray-900">BOQ Items</h3>
                        <button
                            onClick={() => setShowCatalogModal(true)}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
                        >
                            + Add from Catalog
                        </button>
                    </div>

                    {/* Items List */}
                    {boqItems.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-xl">
                            <p className="text-gray-500">No items added. Click "Add from Catalog" to start.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <div className="grid grid-cols-12 gap-2 text-xs font-bold text-gray-600 px-3">
                                <div className="col-span-1">#</div>
                                <div className="col-span-6">Item</div>
                                <div className="col-span-3">Quantity</div>
                                <div className="col-span-2">Unit</div>
                            </div>
                            {boqItems.map((item, index) => (
                                <div key={index} className="grid grid-cols-12 gap-2 items-center bg-white p-3 rounded-lg border">
                                    <div className="col-span-1 font-bold text-gray-500">{index + 1}</div>
                                    <div className="col-span-6">
                                        <p className="text-sm font-medium">{item.name}</p>
                                    </div>
                                    <div className="col-span-3">
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={item.quantity}
                                            onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                                            className="w-full px-2 py-1 border rounded text-sm"
                                            placeholder="Quantity"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-sm text-center font-medium">{item.unit}</p>
                                    </div>
                                </div>
                            ))}

                            {/* Total Items Count */}
                            <div className="grid grid-cols-12 gap-2 px-3 pt-4 border-t-2">
                                <div className="col-span-12 text-right font-bold text-lg">
                                    Total Items: {boqItems.length}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Submit */}
                    <div className="flex gap-3 justify-end pt-4 border-t">
                        <button
                            onClick={onClose}
                            disabled={submitting}
                            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={submitting || boqItems.length === 0}
                            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 font-medium disabled:opacity-50"
                        >
                            {submitting ? 'Creating...' : 'Save BOQ & Create Quotation Task'}
                        </button>
                    </div>
                </div>

                {/* Catalog Modal */}
                {showCatalogModal && (
                    <CatalogSelectorModal
                        catalogItems={catalogItems}
                        onSelect={addItemsFromCatalog}
                        onClose={() => setShowCatalogModal(false)}
                        hidePricing={true}
                    />
                )}
            </div>
        </div>
    );
};

// Catalog Selector Modal - exported for use in EditBOQModal
// hidePricing: when true (BOQ context), do not show price - only product name, unit; user enters quantity only.
// Categories: show categories first; user picks a category then sees products in that category (same categories used by quotation team).
export const CatalogSelectorModal: React.FC<{
    catalogItems: any[];
    onSelect: (items: any[]) => void;
    onClose: () => void;
    /** When true (BOQ creation), hide pricing - show only product name and unit */
    hidePricing?: boolean;
}> = ({ catalogItems, onSelect, onClose, hidePricing = false }) => {
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    const categories = React.useMemo(() => {
        const set = new Set<string>();
        catalogItems.forEach(item => {
            const cat = (item.category && String(item.category).trim()) || 'Uncategorized';
            set.add(cat);
        });
        return Array.from(set).sort((a, b) => (a === 'Uncategorized' ? 1 : a.localeCompare(b)));
    }, [catalogItems]);

    const itemsInCategory = React.useMemo(() => {
        if (!selectedCategory) return [];
        return catalogItems.filter(item => {
            const cat = (item.category && String(item.category).trim()) || 'Uncategorized';
            return cat === selectedCategory;
        });
    }, [catalogItems, selectedCategory]);

    const filteredCatalog = React.useMemo(() => {
        const base = selectedCategory ? itemsInCategory : catalogItems;
        if (!searchQuery.trim()) return base;
        const q = searchQuery.toLowerCase();
        return base.filter(item =>
            item.name.toLowerCase().includes(q) ||
            (item.category && String(item.category).toLowerCase().includes(q))
        );
    }, [selectedCategory, itemsInCategory, catalogItems, searchQuery]);

    const toggleItem = (itemId: string) => {
        const newSelected = new Set(selectedItems);
        if (newSelected.has(itemId)) newSelected.delete(itemId);
        else newSelected.add(itemId);
        setSelectedItems(newSelected);
    };

    const handleSubmit = () => {
        const selected = catalogItems.filter(item => selectedItems.has(item.id));
        onSelect(selected);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60]">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] flex flex-col">
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-5">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-xl font-bold">Select Items from Catalog</h3>
                        <button onClick={onClose} className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2">✕</button>
                    </div>
                    {selectedCategory && (
                        <button
                            type="button"
                            onClick={() => setSelectedCategory(null)}
                            className="text-sm text-purple-100 hover:text-white mb-2"
                        >
                            ← Back to categories
                        </button>
                    )}
                    <input
                        type="text"
                        placeholder={selectedCategory ? "Search in this category..." : "Search items..."}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg text-gray-900"
                    />
                </div>

                <div className="flex-1 overflow-y-auto p-5">
                    {!selectedCategory ? (
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-3">Choose a category</p>
                            <div className="flex flex-wrap gap-2">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => setSelectedCategory(cat)}
                                        className="px-4 py-2 rounded-xl bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100 font-medium"
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : filteredCatalog.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">No items found</div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3">
                            {filteredCatalog.map(item => (
                                <div
                                    key={item.id}
                                    onClick={() => toggleItem(item.id)}
                                    className={`p-4 border-2 rounded-xl cursor-pointer ${
                                        selectedItems.has(item.id) ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-300'
                                    }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedItems.has(item.id)}
                                            onChange={() => toggleItem(item.id)}
                                            className="mt-1"
                                        />
                                        <div>
                                            <h4 className="font-bold text-gray-900">{item.name}</h4>
                                            <p className="text-xs text-gray-500">{item.category || 'Uncategorized'}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">Unit: {item.unit || 'pcs'}</p>
                                            {!hidePricing && (
                                                <p className="text-sm font-medium text-purple-700 mt-1">
                                                    ₹{item.price?.toLocaleString('en-IN') || 0} / {item.unit || 'pcs'}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="border-t p-5 flex justify-between items-center bg-gray-50">
                    <p className="text-sm text-gray-600">{selectedItems.size} item(s) selected</p>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Cancel</button>
                        <button
                            onClick={handleSubmit}
                            disabled={selectedItems.size === 0}
                            className="px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                        >
                            Add Selected Items
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateBOQModal;
