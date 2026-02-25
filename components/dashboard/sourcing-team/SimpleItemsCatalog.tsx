
import React, { useState, useEffect } from 'react';
import Card from '../../shared/Card';
import { PlusIcon, TrashIcon, PencilSquareIcon } from '../../icons/IconComponents';
import { PrimaryButton, SecondaryButton } from '../shared/DashboardUI';
import { Item } from '../../../types';
import { useCatalog } from '../../../hooks/useCatalog';

// Extended Item interface for this component
interface CatalogItem extends Item {
    description?: string;
    warranty?: string;
}

const SimpleItemsCatalog: React.FC = () => {
    const { items, loading, addItem, updateItem, removeItem } = useCatalog();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);

    // Form State
    const [formData, setFormData] = useState<Partial<CatalogItem>>({
        name: '',
        category: 'General',
        price: 0,
        description: '',
        warranty: '',
        gstRate: 18,
        unit: 'pcs',
        material: '',
        imageUrl: ''
    });

    const handleOpenModal = (item?: CatalogItem) => {
        if (item) {
            setEditingItem(item);
            setFormData(item);
        } else {
            setEditingItem(null);
            setFormData({ name: '', category: 'General', price: 0, description: '', warranty: '', gstRate: 18, unit: 'pcs', material: '', imageUrl: '' });
        }
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!formData.name || !formData.price) return;

        const finalCategory = formData.category === 'new'
            ? ((formData as any).newCategoryName || 'General')
            : formData.category || 'General';

        try {
            if (editingItem) {
                // Update
                await updateItem(editingItem.id, { ...formData, category: finalCategory });
            } else {
                // Create
                await addItem({
                    name: formData.name,
                    category: finalCategory,
                    price: Number(formData.price),
                    description: formData.description,
                    warranty: formData.warranty,
                    gstRate: formData.gstRate || 18,
                    unit: formData.unit || 'pcs',
                    material: formData.material,
                    imageUrl: formData.imageUrl || ''
                });
            }
            setIsModalOpen(false);
        } catch (error) {
            console.error("Failed to save item:", error);
            alert("Error saving item to catalog.");
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this item?')) {
            try {
                await removeItem(id);
            } catch (error) {
                console.error("Failed to remove item:", error);
                alert("Error removing item from catalog.");
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-text-primary">Items Catalog</h2>
                    <p className="text-sm text-text-secondary">Manage items, prices, and warranties for your quotations.</p>
                </div>
                <PrimaryButton onClick={() => handleOpenModal()}>
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Add New Item
                </PrimaryButton>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.length === 0 && (
                    <div className="col-span-full py-12 text-center text-text-secondary bg-surface rounded-xl border border-dashed border-border">
                        <p>No items in the catalog yet. Click "Add New Item" to get started.</p>
                    </div>
                )}
                {items.map(item => (
                    <Card key={item.id} className="relative group hover:border-primary transition-colors">
                        <div className="absolute top-4 right-4 flex gap-2">
                            <button
                                onClick={() => handleOpenModal(item)}
                                className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
                                title="Edit item"
                            >
                                <PencilSquareIcon className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => handleDelete(item.id)}
                                className="p-2 rounded-lg bg-error/10 text-error hover:bg-error hover:text-white transition-all shadow-sm"
                                title="Delete item"
                            >
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="mb-4">
                            <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-1 rounded-md">
                                {item.category}
                            </span>
                        </div>

                        <h3 className="text-lg font-bold text-text-primary mb-1">{item.name}</h3>
                        <p className="text-2xl font-black text-text-primary mb-4">₹{item.price.toLocaleString()}</p>

                        <div className="space-y-2 text-sm text-text-secondary">
                            {item.description && <p className="line-clamp-2">{item.description}</p>}

                            <div className="flex flex-wrap gap-2 mt-2">
                                {item.gstRate !== undefined && (
                                    <span className="text-[10px] font-medium px-2 py-0.5 bg-subtle-background rounded">
                                        GST: {item.gstRate}%
                                    </span>
                                )}
                                {item.unit && (
                                    <span className="text-[10px] font-medium px-2 py-0.5 bg-subtle-background rounded">
                                        Unit: {item.unit}
                                    </span>
                                )}
                                {item.material && (
                                    <span className="text-[10px] font-medium px-2 py-0.5 bg-subtle-background rounded">
                                        {item.material}
                                    </span>
                                )}
                            </div>

                            {item.warranty && (
                                <p className="flex items-center text-xs font-medium text-success mt-2">
                                    <span className="w-2 h-2 rounded-full bg-success mr-2"></span>
                                    Warranty: {item.warranty}
                                </p>
                            )}
                        </div>
                    </Card>
                ))}
            </div>

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-surface rounded-2xl w-full max-w-md p-6 shadow-xl">
                        <h3 className="text-xl font-bold mb-4">{editingItem ? 'Edit Item' : 'Add New Item'}</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Item Name</label>
                                <input
                                    type="text"
                                    className="w-full rounded-lg border-border bg-subtle-background p-2"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Price (₹)</label>
                                    <input
                                        type="number"
                                        className="w-full rounded-lg border-border bg-subtle-background p-2"
                                        value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Category</label>
                                    {formData.category === 'new' ? (
                                        <input
                                            type="text"
                                            className="w-full rounded-lg border-border bg-subtle-background p-2"
                                            placeholder="New Category Name"
                                            value={(formData as any).newCategoryName || ''}
                                            onChange={e => setFormData({ ...formData, newCategoryName: e.target.value })}
                                        />
                                    ) : (
                                        <select
                                            className="w-full rounded-lg border-border bg-subtle-background p-2"
                                            value={formData.category}
                                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        >
                                            {Array.from(new Set(items.map((i) => i.category).filter(Boolean))).map(cat => (
                                                <option key={cat!} value={cat!}>{cat}</option>
                                            ))}
                                            <option value="new">+ Add New Category</option>
                                        </select>
                                    )}
                                    {formData.category === 'new' && (
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, category: 'General' })}
                                            className="text-[10px] text-primary mt-1 hover:underline"
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">GST Rate (%)</label>
                                    <select
                                        className="w-full rounded-lg border-border bg-subtle-background p-2"
                                        value={formData.gstRate || 18}
                                        onChange={e => setFormData({ ...formData, gstRate: Number(e.target.value) })}
                                    >
                                        <option value={0}>0%</option>
                                        <option value={5}>5%</option>
                                        <option value={12}>12%</option>
                                        <option value={18}>18%</option>
                                        <option value={28}>28%</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Unit</label>
                                    <select
                                        className="w-full rounded-lg border-border bg-subtle-background p-2"
                                        value={formData.unit || 'pcs'}
                                        onChange={e => setFormData({ ...formData, unit: e.target.value })}
                                    >
                                        <option value="pcs">Pieces (pcs)</option>
                                        <option value="sqft">Square Feet (sqft)</option>
                                        <option value="rft">Running Feet (rft)</option>
                                        <option value="kg">Kilograms (kg)</option>
                                        <option value="set">Set</option>
                                        <option value="lot">Lot</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Material</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Stainless Steel, MDF, PVC"
                                    className="w-full rounded-lg border-border bg-subtle-background p-2"
                                    value={formData.material || ''}
                                    onChange={e => setFormData({ ...formData, material: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Image URL</label>
                                <input
                                    type="url"
                                    placeholder="https://example.com/image.jpg"
                                    className="w-full rounded-lg border-border bg-subtle-background p-2"
                                    value={formData.imageUrl || ''}
                                    onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Warranty Info</label>
                                <input
                                    type="text"
                                    placeholder="e.g. 1 Year Replacement"
                                    className="w-full rounded-lg border-border bg-subtle-background p-2"
                                    value={formData.warranty}
                                    onChange={e => setFormData({ ...formData, warranty: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Description</label>
                                <textarea
                                    className="w-full rounded-lg border-border bg-subtle-background p-2"
                                    rows={3}
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <SecondaryButton onClick={() => setIsModalOpen(false)}>Cancel</SecondaryButton>
                            <PrimaryButton onClick={handleSave}>Save Item</PrimaryButton>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SimpleItemsCatalog;
