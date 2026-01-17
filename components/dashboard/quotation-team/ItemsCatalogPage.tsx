import React, { useState, useMemo } from 'react';
import Card from '../../shared/Card';
import { ITEMS, formatCurrencyINR } from '../../../constants';
import { Item } from '../../../types';
import { ArrowLeftIcon, PlusIcon, MagnifyingGlassIcon } from '../../icons/IconComponents';

const ItemCard: React.FC<{ item: Item }> = ({ item }) => (
    <div className="bg-surface border border-border rounded-lg p-3 flex flex-col">
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
    items: Item[];
    setCurrentPage: (page: string) => void;
    onAddItem: () => void;
}

const ItemsCatalogPage: React.FC<ItemsCatalogPageProps> = ({ items, setCurrentPage, onAddItem }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');

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
                    onClick={onAddItem}
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
                    {filteredItems.map(item => <ItemCard key={item.id} item={item} />)}
                </div>
                {filteredItems.length === 0 && (
                    <div className="text-center py-12 text-text-secondary">
                        <p>No items found.</p>
                        <p className="text-sm">Try adjusting your search or filter.</p>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default ItemsCatalogPage;