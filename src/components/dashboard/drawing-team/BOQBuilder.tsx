import React, { useState, useMemo } from 'react';
import { PlusIcon, TrashIcon, CalculatorIcon, DocumentCheckIcon } from '@heroicons/react/24/outline';
import { BOQItem } from '../../../types';
import { motion, AnimatePresence } from 'framer-motion';

interface BOQBuilderProps {
    projectName: string;
    onSubmit: (items: BOQItem[], total: number) => void;
    onCancel: () => void;
}

const TEMPLATE_ITEMS = [
    { category: 'Flooring', description: 'Vitrified Tiles (600x600)', unit: 'sqft', estimatedCost: 120 },
    { category: 'Flooring', description: 'Vinyl Flooring (Wooden finish)', unit: 'sqft', estimatedCost: 85 },
    { category: 'Ceiling', description: 'Gypsum False Ceiling', unit: 'sqft', estimatedCost: 110 },
    { category: 'Electrical', description: 'LED Panel Lights (12W)', unit: 'nos', estimatedCost: 850 },
    { category: 'Electrical', description: 'Wiring & Conducting', unit: 'point', estimatedCost: 1200 },
    { category: 'Paint', description: 'Premium Emulsion Paint', unit: 'sqft', estimatedCost: 35 },
    { category: 'Furniture', description: 'Modular Workstation', unit: 'nos', estimatedCost: 15000 },
];

const BOQBuilder: React.FC<BOQBuilderProps> = ({ projectName, onSubmit, onCancel }) => {
    const [items, setItems] = useState<BOQItem[]>([]);

    const addItem = (template?: typeof TEMPLATE_ITEMS[0]) => {
        const newItem: BOQItem = {
            id: `item-${Date.now()}`,
            description: template?.description || '',
            category: template?.category || 'General',
            quantity: 1,
            unit: template?.unit || 'nos',
            estimatedCost: template?.estimatedCost || 0,
            isTemplateItem: !!template
        };
        setItems([...items, newItem]);
    };

    const updateItem = (id: string, field: keyof BOQItem, value: any) => {
        setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const removeItem = (id: string) => {
        setItems(items.filter(item => item.id !== id));
    };

    const totalCost = useMemo(() => {
        return items.reduce((sum, item) => sum + ((item.estimatedCost || 0) * item.quantity), 0);
    }, [items]);

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-800 rounded-xl overflow-hidden animate-fade-in">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">New BOQ: {projectName}</h2>
                    <p className="text-sm text-gray-500">Add items from templates or create custom ones</p>
                </div>
                <div className="text-right">
                    <div className="text-sm text-gray-500">Estimated Total</div>
                    <div className="text-2xl font-bold text-blue-600">₹{totalCost.toLocaleString('en-IN')}</div>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar: Templates */}
                <div className="w-64 bg-gray-50 dark:bg-slate-900 border-r border-gray-200 dark:border-gray-700 overflow-y-auto p-4 hidden md:block">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Quick Add Templates</h3>
                    <div className="space-y-2">
                        {TEMPLATE_ITEMS.map((bgItem, idx) => (
                            <button
                                key={idx}
                                onClick={() => addItem(bgItem)}
                                className="w-full text-left p-3 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors shadow-sm text-sm group"
                            >
                                <div className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600">{bgItem.category}</div>
                                <div className="text-gray-500 truncate">{bgItem.description}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content: Items List */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="space-y-4">
                        <AnimatePresence>
                            {items.map((item, index) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="flex gap-4 items-start p-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm group hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                                >
                                    <div className="flex-1 grid grid-cols-12 gap-4">
                                        <div className="col-span-12 md:col-span-5">
                                            <label className="text-xs text-gray-500 mb-1 block">Description</label>
                                            <input
                                                type="text"
                                                value={item.description}
                                                onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                                className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                        </div>
                                        <div className="col-span-6 md:col-span-2">
                                            <label className="text-xs text-gray-500 mb-1 block">Category</label>
                                            <select
                                                value={item.category}
                                                onChange={(e) => updateItem(item.id, 'category', e.target.value)}
                                                className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white"
                                            >
                                                <option>General</option>
                                                <option>Flooring</option>
                                                <option>Ceiling</option>
                                                <option>Electrical</option>
                                                <option>Paint</option>
                                                <option>Furniture</option>
                                            </select>
                                        </div>
                                        <div className="col-span-3 md:col-span-2">
                                            <label className="text-xs text-gray-500 mb-1 block">Qty / Unit</label>
                                            <div className="flex gap-1">
                                                <input
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                                                    className="w-16 p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white"
                                                />
                                                <input
                                                    type="text"
                                                    value={item.unit}
                                                    onChange={(e) => updateItem(item.id, 'unit', e.target.value)}
                                                    className="w-16 p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white"
                                                />
                                            </div>
                                        </div>
                                        <div className="col-span-3 md:col-span-3">
                                            <label className="text-xs text-gray-500 mb-1 block">Est. Cost / Unit</label>
                                            <div className="relative">
                                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₹</span>
                                                <input
                                                    type="number"
                                                    value={item.estimatedCost}
                                                    onChange={(e) => updateItem(item.id, 'estimatedCost', Number(e.target.value))}
                                                    className="w-full pl-6 pr-2 p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => removeItem(item.id)}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors mt-6"
                                    >
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        <button
                            onClick={() => addItem()}
                            className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-colors flex items-center justify-center gap-2 font-medium"
                        >
                            <PlusIcon className="w-5 h-5" />
                            Add Custom Item
                        </button>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 flex justify-end gap-3 z-10">
                <button
                    onClick={onCancel}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={() => onSubmit(items, totalCost)}
                    disabled={items.length === 0}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <DocumentCheckIcon className="w-5 h-5" />
                    Submit BOQ
                </button>
            </div>
        </div>
    );
};

export default BOQBuilder;
