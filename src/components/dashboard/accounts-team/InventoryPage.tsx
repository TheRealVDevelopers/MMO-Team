import React, { useState } from 'react';
import { useInventory } from '../../../hooks/useInventory';
import { useProjects } from '../../../hooks/useProjects';
import Card from '../../shared/Card';
import { InventoryItem, GREntry, GRItem } from '../../../types';
import { PlusIcon, ArrowDownTrayIcon, ArrowUpTrayIcon, CubeIcon } from '@heroicons/react/24/outline';

const InventoryPage: React.FC = () => {
    const { items, grEntries, loading, addInventoryItem, addGREntry } = useInventory();
    const { projects } = useProjects();

    const [activeTab, setActiveTab] = useState<'overview' | 'gr'>('overview');
    const [showAddItem, setShowAddItem] = useState(false);
    const [showAddGR, setShowAddGR] = useState(false);

    // New Item State
    const [newItemName, setNewItemName] = useState('');
    const [newItemCategory, setNewItemCategory] = useState('Raw Material');
    const [newItemUnit, setNewItemUnit] = useState('pcs');

    // New GR State
    const [grType, setGrType] = useState<'IN' | 'OUT'>('IN');
    const [selectedProject, setSelectedProject] = useState('');
    const [grItems, setGrItems] = useState<GRItem[]>([]);
    const [currentItemId, setCurrentItemId] = useState('');
    const [currentQty, setCurrentQty] = useState('');

    // --- Handlers ---

    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await addInventoryItem({
                name: newItemName,
                category: newItemCategory,
                unit: newItemUnit,
                totalQuantity: 0,
                linkedProjects: []
            });
            setShowAddItem(false);
            setNewItemName('');
        } catch (error) {
            alert('Failed to add item');
        }
    };

    const handleAddGrItem = () => {
        if (!currentItemId || !currentQty) return;
        const itemDef = items.find(i => i.id === currentItemId);
        if (!itemDef) return;

        setGrItems(prev => [
            ...prev,
            { itemId: currentItemId, itemName: itemDef.name, quantity: Number(currentQty) }
        ]);
        setCurrentItemId('');
        setCurrentQty('');
    };

    const handleSubmitGR = async () => {
        if (grItems.length === 0) return alert("No items added!");
        if (grType === 'OUT' && !selectedProject) return alert("Select a project for consumption!");

        try {
            await addGREntry({
                type: grType,
                projectId: selectedProject || 'WAREHOUSE', // 'WAREHOUSE' for stock in
                items: grItems,
                totalValue: 0, // Placeholder
                createdBy: 'system',
                status: 'COMPLETED',
                date: new Date() // Hook handles this but good for types
            });
            alert("GR Entry Created Successfully!");
            setShowAddGR(false);
            setGrItems([]);
            setSelectedProject('');
        } catch (e: any) {
            alert(e.message);
        }
    };

    if (loading) return <div className="p-8">Loading Inventory...</div>;

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Inventory Management</h1>
                    <p className="text-text-secondary">Track Stock, Goods Receipts & Consumption</p>
                </div>
                <div className="space-x-2">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`px-4 py-2 rounded-lg ${activeTab === 'overview' ? 'bg-primary text-white' : 'bg-surface border'}`}
                    >
                        Stock Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('gr')}
                        className={`px-4 py-2 rounded-lg ${activeTab === 'gr' ? 'bg-primary text-white' : 'bg-surface border'}`}
                    >
                        Godown (GR)
                    </button>
                </div>
            </div>

            {/* --- STOCK OVERVIEW TAB --- */}
            {activeTab === 'overview' && (
                <div className="space-y-6">
                    <Card>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold">Current Stock Levels</h3>
                            <button
                                onClick={() => setShowAddItem(!showAddItem)}
                                className="flex items-center gap-2 text-sm text-primary hover:underline"
                            >
                                <PlusIcon className="w-4 h-4" /> New Item Definition
                            </button>
                        </div>

                        {showAddItem && (
                            <form onSubmit={handleAddItem} className="bg-subtle-background p-4 rounded-lg mb-4 grid grid-cols-4 gap-4 items-end">
                                <div>
                                    <label className="text-xs font-medium">Item Name</label>
                                    <input value={newItemName} onChange={e => setNewItemName(e.target.value)} className="w-full p-2 border rounded" required />
                                </div>
                                <div>
                                    <label className="text-xs font-medium">Category</label>
                                    <select value={newItemCategory} onChange={e => setNewItemCategory(e.target.value)} className="w-full p-2 border rounded">
                                        <option>Raw Material</option>
                                        <option>Electrical</option>
                                        <option>Plumbing</option>
                                        <option>Finishing</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-medium">Unit</label>
                                    <input value={newItemUnit} onChange={e => setNewItemUnit(e.target.value)} className="w-full p-2 border rounded" placeholder="pcs, kg" required />
                                </div>
                                <button type="submit" className="bg-primary text-white p-2 rounded">Add Item</button>
                            </form>
                        )}

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b text-text-secondary text-sm">
                                        <th className="p-2">Item Name</th>
                                        <th className="p-2">Category</th>
                                        <th className="p-2">Total Quantity</th>
                                        <th className="p-2">Unit</th>
                                        <th className="p-2 text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map(item => (
                                        <tr key={item.id} className="border-b hover:bg-subtle-background">
                                            <td className="p-3 font-medium">{item.name}</td>
                                            <td className="p-3 text-sm text-text-secondary">{item.category}</td>
                                            <td className={`p-3 font-bold ${item.totalQuantity < 10 ? 'text-red-500' : 'text-text-primary'}`}>
                                                {item.totalQuantity}
                                            </td>
                                            <td className="p-3 text-sm">{item.unit}</td>
                                            <td className="p-3 text-right">
                                                <span className={`px-2 py-1 rounded text-xs ${item.totalQuantity > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                    {item.totalQuantity > 0 ? 'In Stock' : 'Out of Stock'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {items.length === 0 && (
                                        <tr><td colSpan={5} className="p-8 text-center text-text-secondary">No items defined yet.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            )}

            {/* --- GODOWN / GR TAB --- */}
            {activeTab === 'gr' && (
                <div className="space-y-6">
                    <div className="flex gap-4 mb-4">
                        <button
                            onClick={() => { setShowAddGR(true); setGrType('IN'); }}
                            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                        >
                            <ArrowDownTrayIcon className="w-5 h-5" /> Record Stock IN
                        </button>
                        <button
                            onClick={() => { setShowAddGR(true); setGrType('OUT'); }}
                            className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
                        >
                            <ArrowUpTrayIcon className="w-5 h-5" /> Record Consumption (OUT)
                        </button>
                    </div>

                    {showAddGR && (
                        <Card className="border-2 border-primary/20">
                            <h3 className="text-lg font-bold mb-4">
                                {grType === 'IN' ? 'New Goods Receipt (Stock In)' : 'New Material Issue (Consumption)'}
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Transaction Type</label>
                                    <div className="font-mono bg-subtle-background p-2 rounded">{grType}</div>
                                </div>
                                {grType === 'OUT' ? (
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Issue to Project</label>
                                        <select
                                            value={selectedProject}
                                            onChange={e => setSelectedProject(e.target.value)}
                                            className="w-full p-2 border rounded"
                                        >
                                            <option value="">Select Project...</option>
                                            {projects.filter(p => !['Completed', 'Archived'].includes(p.status)).map(p => (
                                                <option key={p.id} value={p.id}>{p.projectName}</option>
                                            ))}
                                        </select>
                                    </div>
                                ) : (
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Source (Vendor / Warehouse)</label>
                                        <input className="w-full p-2 border rounded" placeholder="Optional Vendor Name" />
                                    </div>
                                )}
                            </div>

                            <div className="border-t pt-4">
                                <h4 className="font-medium mb-2">Item Details</h4>
                                <div className="flex gap-2 mb-4">
                                    <select
                                        value={currentItemId}
                                        onChange={e => setCurrentItemId(e.target.value)}
                                        className="flex-1 p-2 border rounded"
                                    >
                                        <option value="">Select Item...</option>
                                        {items.map(i => <option key={i.id} value={i.id}>{i.name} (Avail: {i.totalQuantity})</option>)}
                                    </select>
                                    <input
                                        type="number"
                                        value={currentQty}
                                        onChange={e => setCurrentQty(e.target.value)}
                                        className="w-32 p-2 border rounded"
                                        placeholder="Qty"
                                    />
                                    <button
                                        onClick={handleAddGrItem}
                                        type="button"
                                        className="px-4 py-2 bg-text-primary text-white rounded"
                                    >
                                        Add Line
                                    </button>
                                </div>

                                {/* Items Table */}
                                {grItems.length > 0 && (
                                    <table className="w-full text-sm mb-4">
                                        <thead className="bg-subtle-background">
                                            <tr>
                                                <th className="p-2 text-left">Item</th>
                                                <th className="p-2 text-right">Qty</th>
                                                <th className="p-2">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {grItems.map((item, idx) => (
                                                <tr key={idx} className="border-b">
                                                    <td className="p-2">{item.itemName}</td>
                                                    <td className="p-2 text-right">{item.quantity}</td>
                                                    <td className="p-2 text-center text-red-500 cursor-pointer" onClick={() => setGrItems(grItems.filter((_, i) => i !== idx))}>Remove</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>

                            <div className="flex justify-end gap-2 mt-4">
                                <button onClick={() => setShowAddGR(false)} className="px-4 py-2 border rounded">Cancel</button>
                                <button onClick={handleSubmitGR} className="px-4 py-2 bg-primary text-white rounded font-medium">Confirm Transaction</button>
                            </div>
                        </Card>
                    )}

                    <h3 className="text-lg font-bold mt-8 mb-4">Recent Transactions</h3>
                    <div className="space-y-3">
                        {grEntries.length === 0 && <p className="text-text-secondary">No recent transactions.</p>}
                        {grEntries.map(entry => (
                            <div key={entry.id} className="bg-surface border p-4 rounded-lg flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-full ${entry.type === 'IN' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                        <CubeIcon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-text-primary">
                                            {entry.type === 'IN' ? 'Stock In (Purchase)' : 'Outward (Consumption)'}
                                        </p>
                                        <p className="text-xs text-text-secondary">
                                            {new Date(entry.date).toLocaleDateString()} • {entry.items.length} Items • Ref: {entry.id.substring(0, 6)}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    {entry.type === 'OUT' && (
                                        <p className="text-xs font-mono bg-subtle-background px-2 py-1 rounded mb-1">
                                            Project: {projects.find(p => p.id === entry.projectId)?.projectName || 'Unknown'}
                                        </p>
                                    )}
                                    <p className="font-bold">{entry.items.reduce((acc, curr) => acc + curr.quantity, 0)} Units</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default InventoryPage;
