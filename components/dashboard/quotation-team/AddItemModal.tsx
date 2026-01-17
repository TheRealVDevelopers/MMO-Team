import React, { useState } from 'react';
import Modal from '../../shared/Modal';
import { Item } from '../../../types';

interface AddItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (item: Omit<Item, 'id'>) => void;
}

const AddItemModal: React.FC<AddItemModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const [name, setName] = useState('');
    const [category, setCategory] = useState('Workstations');
    const [price, setPrice] = useState('');
    const [imageUrl, setImageUrl] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const priceNum = parseFloat(price);
        if (isNaN(priceNum)) {
            alert("Please enter a valid price");
            return;
        }

        onSubmit({
            name,
            category,
            price: priceNum,
            imageUrl: imageUrl || 'https://images.unsplash.com/photo-1592078615290-033ee584e267?q=80&w=300&h=300&auto=format&fit=crop',
            description: 'New item added to catalog'
        });

        onClose();
        setName('');
        setCategory('Workstations');
        setPrice('');
        setImageUrl('');
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add New Item to Catalog" size="md">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-text-primary mb-1">Item Name</label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full p-2 border border-border rounded-md bg-surface text-text-primary"
                            placeholder="e.g. Executive Leather Chair"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-primary mb-1">Category</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full p-2 border border-border rounded-md bg-surface text-text-primary"
                        >
                            <option value="Workstations">Workstations</option>
                            <option value="Chairs">Chairs</option>
                            <option value="Storage">Storage</option>
                            <option value="Lighting">Lighting</option>
                            <option value="Flooring">Flooring</option>
                            <option value="Accessories">Accessories</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-primary mb-1">Base Price (INR)</label>
                        <input
                            type="number"
                            required
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            className="w-full p-2 border border-border rounded-md bg-surface text-text-primary"
                            placeholder="0.00"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-primary mb-1">Image URL (Optional)</label>
                        <input
                            type="text"
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                            className="w-full p-2 border border-border rounded-md bg-surface text-text-primary"
                            placeholder="https://..."
                        />
                        <p className="text-xs text-text-tertiary mt-1">Leave blank for placeholder</p>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-secondary transition-colors"
                    >
                        Add Item
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default AddItemModal;
