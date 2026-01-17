import React, { useState, useMemo } from 'react';
import Modal from '../../shared/Modal';
import { ProjectTemplate, Item } from '../../../types';
import { PlusIcon, CheckIcon, TrashIcon } from '../../icons/IconComponents';
import { formatCurrencyINR } from '../../../constants';

interface AddTemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (template: Omit<ProjectTemplate, 'id'>) => void;
    items: Item[];
}

const AddTemplateModal: React.FC<AddTemplateModalProps> = ({ isOpen, onClose, onSubmit, items }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [projectType, setProjectType] = useState<'Office' | 'Residential' | 'Commercial'>('Office');
    const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
    const [laborCost, setLaborCost] = useState('0');
    const [profitMargin, setProfitMargin] = useState('15'); // 15% default

    const selectedItems = useMemo(() => {
        return items.filter(item => selectedItemIds.includes(item.id));
    }, [items, selectedItemIds]);

    const materialCost = useMemo(() => {
        return selectedItems.reduce((sum, item) => sum + item.price, 0);
    }, [selectedItems]);

    const totalCost = useMemo(() => {
        const material = materialCost;
        const labor = Number(laborCost) || 0;
        const margin = Number(profitMargin) || 0;

        // Final Price = (Material + Labor) / (1 - Margin/100)
        // Ensure we don't divide by zero if margin is 100
        const divider = 1 - (margin / 100);
        const finalPrice = divider > 0 ? (material + labor) / divider : (material + labor);
        return isFinite(finalPrice) ? finalPrice : 0;
    }, [materialCost, laborCost, profitMargin]);

    const handleToggleItem = (itemId: string) => {
        setSelectedItemIds(prev =>
            prev.includes(itemId)
                ? prev.filter(id => id !== itemId)
                : [...prev, itemId]
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        onSubmit({
            name,
            description,
            projectType,
            itemCount: selectedItemIds.length,
            avgCost: Math.round(totalCost)
        });

        onClose();
        setName('');
        setDescription('');
        setSelectedItemIds([]);
        setLaborCost('0');
        setProfitMargin('15');
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Robust Template Builder" size="xl">
            <form onSubmit={handleSubmit} className="h-[70vh] flex flex-col">
                <div className="flex-1 overflow-y-auto px-1 space-y-8 pb-6">
                    {/* Step 1: Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-text-primary mb-1">Template Name</label>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full p-2 border border-border rounded-lg bg-surface text-text-primary"
                                    placeholder="e.g. Premium Executive Suite"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-text-primary mb-1">Project Category</label>
                                <select
                                    value={projectType}
                                    onChange={(e) => setProjectType(e.target.value as any)}
                                    className="w-full p-2 border border-border rounded-lg bg-surface text-text-primary"
                                >
                                    <option value="Office">Office</option>
                                    <option value="Residential">Residential</option>
                                    <option value="Commercial">Commercial</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-text-primary mb-1">Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full p-2 border border-border rounded-lg bg-surface text-text-primary h-[116px]"
                                placeholder="What does this template include?"
                            />
                        </div>
                    </div>

                    {/* Step 2: Item Selection */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <h3 className="text-sm font-black uppercase tracking-widest text-text-secondary">Select Items from Catalog</h3>
                            <p className="text-xs text-text-tertiary">{selectedItemIds.length} items selected</p>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                            {items.map(item => {
                                const isSelected = selectedItemIds.includes(item.id);
                                return (
                                    <div
                                        key={item.id}
                                        onClick={() => handleToggleItem(item.id)}
                                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${isSelected
                                                ? 'bg-primary/5 border-primary shadow-sm'
                                                : 'bg-surface border-border hover:border-primary/50'
                                            }`}
                                    >
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-text-primary truncate">{item.name}</p>
                                            <p className="text-[10px] text-text-secondary">{formatCurrencyINR(item.price)}</p>
                                        </div>
                                        {isSelected ? (
                                            <CheckIcon className="w-4 h-4 text-primary" />
                                        ) : (
                                            <PlusIcon className="w-4 h-4 text-text-tertiary" />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Step 3: Financials */}
                    <div className="bg-subtle-background p-6 rounded-2xl border border-border grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-text-secondary mb-2">Total Material Cost</label>
                            <p className="text-2xl font-serif font-bold text-text-primary">{formatCurrencyINR(materialCost)}</p>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-text-secondary mb-2">Labor & Installation (INR)</label>
                                <input
                                    type="number"
                                    value={laborCost}
                                    onChange={(e) => setLaborCost(e.target.value)}
                                    className="w-full p-2 border border-border rounded-lg bg-surface text-text-primary font-bold"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-text-secondary mb-2">Profit Margin (%)</label>
                                <input
                                    type="number"
                                    value={profitMargin}
                                    onChange={(e) => setProfitMargin(e.target.value)}
                                    className="w-full p-2 border border-border rounded-lg bg-surface text-text-primary font-bold"
                                />
                            </div>
                        </div>
                        <div className="md:border-l border-border md:pl-6 flex flex-col justify-center">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-primary mb-2">Recommended Template Price</label>
                            <p className="text-3xl font-serif font-bold text-primary">{formatCurrencyINR(totalCost)}</p>
                            <p className="text-[10px] text-text-tertiary mt-2 italic">Formula: (Material + Labor) / (1 - Margin%)</p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-border mt-auto">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 text-sm font-bold text-text-secondary hover:text-text-primary transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={selectedItemIds.length === 0 || !name}
                        className="px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        Save Template
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default AddTemplateModal;
