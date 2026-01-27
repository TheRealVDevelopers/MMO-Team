import React, { useState } from 'react';
import { MaterialRequest } from '../../../types';
import { ArchiveBoxIcon, CheckCircleIcon, ClockIcon, PlusIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { USERS } from '../../../constants';

interface MaterialTrackerProps {
    projectId: string;
    requests: MaterialRequest[];
    onAddRequest: (request: MaterialRequest) => void;
}

// Mock BOQ Items that site engineer can request
const BOQ_ITEMS = [
    { id: 'item-1', name: '2x2 Vitrified Tiles', unit: 'sqft', remaining: 500 },
    { id: 'item-2', name: 'Cement Bags (Ultratech)', unit: 'bags', remaining: 50 },
    { id: 'item-3', name: 'Sand', unit: 'cft', remaining: 200 },
    { id: 'item-4', name: 'Plywood 18mm', unit: 'sheets', remaining: 25 },
];

const MaterialTracker: React.FC<MaterialTrackerProps> = ({ projectId, requests, onAddRequest }) => {
    const [isFormOpen, setIsFormOpen] = useState(false);

    // Form State
    const [selectedItem, setSelectedItem] = useState(BOQ_ITEMS[0].id);
    const [quantity, setQuantity] = useState(0);
    const [date, setDate] = useState('');
    const [notes, setNotes] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const item = BOQ_ITEMS.find(i => i.id === selectedItem);
        if (!item) return;

        const newRequest: MaterialRequest = {
            id: `mr-${Date.now()}`,
            projectId,
            itemId: item.id,
            itemName: item.name,
            quantityRequested: quantity,
            unit: item.unit,
            requiredDate: new Date(date).toISOString(),
            status: 'Requested',
            requestedBy: 'u-5',
            createdAt: new Date(),
            notes
        };

        onAddRequest(newRequest);
        setIsFormOpen(false);
        setQuantity(0);
        setNotes('');
        setDate('');
    };

    const getStatusColor = (status: MaterialRequest['status']) => {
        switch (status) {
            case 'Requested': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'Approved': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
            case 'Ordered': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
            case 'Delivered': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            case 'Rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="h-full flex flex-col gap-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Material Logistics</h3>
                    <p className="text-xs text-gray-500">Track site inventory and requests</p>
                </div>
                <button
                    onClick={() => setIsFormOpen(!isFormOpen)}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
                >
                    <PlusIcon className="w-5 h-5" />
                    Request Material
                </button>
            </div>

            {isFormOpen && (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-md animate-in slide-in-from-top-4">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4">Material Requisition Form</h4>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Select Item (from BOQ)</label>
                                <select
                                    value={selectedItem}
                                    onChange={e => setSelectedItem(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-lg dark:bg-slate-700 dark:border-gray-600"
                                >
                                    {BOQ_ITEMS.map(item => (
                                        <option key={item.id} value={item.id}>
                                            {item.name} ({item.remaining} {item.unit} remaining)
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Quantity</label>
                                    <input
                                        type="number"
                                        value={quantity}
                                        onChange={e => setQuantity(parseFloat(e.target.value))}
                                        className="w-full p-2 border border-gray-300 rounded-lg dark:bg-slate-700 dark:border-gray-600"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Required By</label>
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={e => setDate(e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded-lg dark:bg-slate-700 dark:border-gray-600"
                                    />
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Notes / Specifications</label>
                            <textarea
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                rows={2}
                                className="w-full p-2 border border-gray-300 rounded-lg dark:bg-slate-700 dark:border-gray-600"
                                placeholder="E.g. Deliver to back gate..."
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setIsFormOpen(false)}
                                className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                            >
                                Submit Request
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-gray-700">
                        <tr>
                            <th className="px-6 py-3 font-medium text-gray-500">Item</th>
                            <th className="px-6 py-3 font-medium text-gray-500">Qty</th>
                            <th className="px-6 py-3 font-medium text-gray-500">Required Date</th>
                            <th className="px-6 py-3 font-medium text-gray-500">Status</th>
                            <th className="px-6 py-3 font-medium text-gray-500">Requestor</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {requests.map(req => {
                            const user = USERS.find(u => u.id === req.requestedBy);
                            return (
                                <tr key={req.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                        {req.itemName}
                                        {req.notes && <p className="text-xs text-gray-500 font-normal mt-0.5">{req.notes}</p>}
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                                        {req.quantityRequested} {req.unit}
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300 flex items-center gap-2">
                                        <ClockIcon className="w-4 h-4 text-gray-400" />
                                        {format(new Date(req.requiredDate), 'dd MMM')}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(req.status)}`}>
                                            {req.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold">
                                                {user?.name.charAt(0)}
                                            </div>
                                            <span className="text-xs">{user?.name}</span>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {requests.length === 0 && (
                    <div className="p-8 text-center text-gray-400 italic">No material requests found.</div>
                )}
            </div>
        </div>
    );
};

export default MaterialTracker;
