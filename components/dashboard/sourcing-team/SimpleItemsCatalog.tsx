
import React, { useState, useEffect } from 'react';
import Card from '../../shared/Card';
import { PlusIcon, TrashIcon, PencilSquareIcon } from '../../icons/IconComponents';
import { PrimaryButton, SecondaryButton } from '../shared/DashboardUI';
import { Item } from '../../../types';

// Extended Item interface for this component
interface CatalogItem extends Item {
    description?: string;
    warranty?: string;
}

const SimpleItemsCatalog: React.FC = () => {
    // Local state for items
    const [items, setItems] = useState<CatalogItem[]>(() => {
        const saved = localStorage.getItem('mmo_simple_catalog');
        return saved ? JSON.parse(saved) : [];
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);

    // Form State
    const [formData, setFormData] = useState<Partial<CatalogItem>>({
        name: '',
        category: 'General',
        price: 0,
        description: '',
        warranty: ''
    });

    useEffect(() => {
        localStorage.setItem('mmo_simple_catalog', JSON.stringify(items));
    }, [items]);

    const handleOpenModal = (item?: CatalogItem) => {
        if (item) {
            setEditingItem(item);
            setFormData(item);
        } else {
            setEditingItem(null);
            setFormData({ name: '', category: 'General', price: 0, description: '', warranty: '' });
        }
        setIsModalOpen(true);
    };

    const handleSave = () => {
        if (!formData.name || !formData.price) return;

        if (editingItem) {
            // Update
            setItems(prev => prev.map(i => i.id === editingItem.id ? { ...i, ...formData } as CatalogItem : i));
        } else {
            // Create
            const newItem: CatalogItem = {
                id: Date.now().toString(),
                name: formData.name,
                category: formData.category || 'General',
                price: Number(formData.price),
                description: formData.description,
                warranty: formData.warranty,
                imageUrl: '' // Placeholder
            };
            setItems(prev => [newItem, ...prev]);
        }
        setIsModalOpen(false);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this item?')) {
            setItems(prev => prev.filter(i => i.id !== id));
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
                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleOpenModal(item)} className="p-1 text-text-secondary hover:text-primary">
                                <PencilSquareIcon className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(item.id)} className="p-1 text-text-secondary hover:text-error">
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
                            {item.warranty && (
                                <p className="flex items-center text-xs font-medium text-success">
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
                                    <select
                                        className="w-full rounded-lg border-border bg-subtle-background p-2"
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        <option value="General">General</option>
                                        <option value="Electrical">Electrical</option>
                                        <option value="Plumbing">Plumbing</option>
                                        <option value="Furniture">Furniture</option>
                                        <option value="Civil">Civil</option>
                                    </select>
                                </div>
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
