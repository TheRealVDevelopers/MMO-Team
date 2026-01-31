import React, { useState, useMemo } from 'react';
import Card from '../../shared/Card';
import { formatCurrencyINR } from '../../../constants';
import { Item } from '../../../types';
import { ArrowLeftIcon, PlusIcon, MagnifyingGlassIcon, PencilSquareIcon, TrashIcon } from '../../icons/IconComponents';
import { useCatalog } from '../../../hooks/useCatalog';
import { PrimaryButton, SecondaryButton } from '../shared/DashboardUI';

interface CatalogItem extends Item {
    description?: string;
    warranty?: string;
}

const ItemCard: React.FC<{ 
    item: Item; 
    onEdit: (item: Item) => void; 
    onDelete: (id: string) => void; 
}> = ({ item, onEdit, onDelete }) => (
    <div className="bg-surface border border-border rounded-lg p-3 flex flex-col relative group">
        <div className="absolute top-2 right-2 flex gap-1 z-10">
            <button 
                onClick={() => onEdit(item)} 
                className="p-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
                title="Edit item"
            >
                <PencilSquareIcon className="w-3.5 h-3.5" />
            </button>
            <button 
                onClick={() => onDelete(item.id)} 
                className="p-1.5 rounded-md bg-error/10 text-error hover:bg-error hover:text-white transition-all shadow-sm"
                title="Delete item"
            >
                <TrashIcon className="w-3.5 h-3.5" />
            </button>
        </div>
        <img src={item.imageUrl} alt={item.name} className="h-24 w-full object-cover rounded" />
        <div className="mt-2 flex-grow">
            <h4 className="font-bold text-sm text-text-primary">{item.name}</h4>
            <p className="text-xs text-text-secondary">{item.category}</p>
        </div>
        <div className="mt-2 text-right">
            <p className="font-bold text-primary">{formatCurrencyINR(item.price)}</p>
        </div>
    </div>
);

interface ItemsCatalogPageProps {
    setCurrentPage: (page: string) => void;
}

const ItemsCatalogPage: React.FC<ItemsCatalogPageProps> = ({ setCurrentPage }) => {
    const { items, loading, addItem, updateItem, removeItem } = useCatalog();
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
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
            setFormData({ 
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
        }
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!formData.name || !formData.price) return;

        try {
            if (editingItem) {
                await updateItem(editingItem.id, formData);
            } else {
                await addItem({
                    name: formData.name,
                    category: formData.category || 'General',
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

    const categories = useMemo(() => ['All', ...new Set(items.map(item => item.category))], [items]);

    const filteredItems = useMemo(() => {
        return items.filter(item =>
            (item.name.toLowerCase().includes(searchTerm.toLowerCase())) &&
            (categoryFilter === 'All' || item.category === categoryFilter)
        );
    }, [searchTerm, categoryFilter, items]);

    return (
        <div className="space-y-6">
            <div className="sm:flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setCurrentPage('overview')}
                        className="flex items-center space-x-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
                    >
                        <ArrowLeftIcon className="w-5 h-5" />
                        <span>Back</span>
                    </button>
                    <h2 className="text-2xl font-bold text-text-primary">Items Catalog</h2>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center space-x-2 bg-primary text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-secondary mt-2 sm:mt-0"
                >
                    <PlusIcon className="w-4 h-4" />
                    <span>Add New Item</span>
                </button>
            </div>

            <Card>
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                    <div className="relative flex-grow">
                        <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                        <input
                            type="text"
                            placeholder="Search items..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-surface"
                        />
                    </div>
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="py-2 px-4 border border-border rounded-md bg-surface"
                    >
                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {filteredItems.map(item => (
                        <ItemCard 
                            key={item.id} 
                            item={item} 
                            onEdit={handleOpenModal}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
                {filteredItems.length === 0 && (
                    <div className="text-center py-12 text-text-secondary">
                        <p>No items found.</p>
                        <p className="text-sm">Try adjusting your search or filter.</p>
                    </div>
                )}
            </Card>

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-surface rounded-2xl w-full max-w-md p-6 shadow-xl max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold mb-4">{editingItem ? 'Edit Item' : 'Add New Item'}</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Item Name *</label>
                                <input
                                    type="text"
                                    className="w-full rounded-lg border border-border bg-subtle-background p-2"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Rate/Price (₹) *</label>
                                    <input
                                        type="number"
                                        className="w-full rounded-lg border border-border bg-subtle-background p-2"
                                        value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                                        placeholder="Price per unit"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Unit *</label>
                                    <select
                                        className="w-full rounded-lg border border-border bg-subtle-background p-2"
                                        value={formData.unit || 'pcs'}
                                        onChange={e => setFormData({ ...formData, unit: e.target.value })}
                                    >
                                        <option value="pcs">Pieces (pcs)</option>
                                        <option value="sqft">Square Feet (sqft)</option>
                                        <option value="rft">Running Feet (rft)</option>
                                        <option value="kg">Kilograms (kg)</option>
                                        <option value="ltr">Liters (ltr)</option>
                                        <option value="set">Set</option>
                                        <option value="lot">Lot</option>
                                        <option value="box">Box</option>
                                        <option value="bag">Bag</option>
                                        <option value="sqm">Square Meter (sqm)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">GST Rate (%)</label>
                                    <select
                                        className="w-full rounded-lg border border-border bg-subtle-background p-2"
                                        value={formData.gstRate || 18}
                                        onChange={e => setFormData({ ...formData, gstRate: Number(e.target.value) })}
                                    >
                                        <option value={0}>0% (Exempt)</option>
                                        <option value={5}>5%</option>
                                        <option value={12}>12%</option>
                                        <option value={18}>18%</option>
                                        <option value={28}>28%</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Category</label>
                                    <select
                                        className="w-full rounded-lg border border-border bg-subtle-background p-2"
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
                                <label className="block text-sm font-medium mb-1">Material / Specification</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Stainless Steel, MDF, PVC, Granite"
                                    className="w-full rounded-lg border border-border bg-subtle-background p-2"
                                    value={formData.material || ''}
                                    onChange={e => setFormData({ ...formData, material: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Warranty Information</label>
                                <input
                                    type="text"
                                    placeholder="e.g., 1 Year Replacement, 5 Year Warranty"
                                    className="w-full rounded-lg border border-border bg-subtle-background p-2"
                                    value={formData.warranty || ''}
                                    onChange={e => setFormData({ ...formData, warranty: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Image URL</label>
                                <input
                                    type="url"
                                    placeholder="https://example.com/image.jpg"
                                    className="w-full rounded-lg border border-border bg-subtle-background p-2"
                                    value={formData.imageUrl || ''}
                                    onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Description</label>
                                <textarea
                                    className="w-full rounded-lg border border-border bg-subtle-background p-2"
                                    rows={3}
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Additional details about the item..."
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <SecondaryButton onClick={() => setIsModalOpen(false)}>Cancel</SecondaryButton>
                            <PrimaryButton onClick={handleSave} disabled={!formData.name || !formData.price}>
                                {editingItem ? 'Update Item' : 'Save Item'}
                            </PrimaryButton>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ItemsCatalogPage;