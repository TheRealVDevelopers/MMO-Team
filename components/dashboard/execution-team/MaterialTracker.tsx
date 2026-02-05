import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { MaterialRequest, MaterialRequestStatus } from '../../../types';
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
    const { currentUser } = useAuth();
    const [isFormOpen, setIsFormOpen] = useState(false);

    // Form State
    const [selectedItem, setSelectedItem] = useState(BOQ_ITEMS[0].id);
    const [quantity, setQuantity] = useState(0);
    const [date, setDate] = useState('');
    const [notes, setNotes] = useState('');
    const [urgency, setUrgency] = useState<MaterialRequest['urgency']>('Normal');

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
            status: MaterialRequestStatus.REQUESTED,
            requestedBy: currentUser?.id || 'unknown',
            createdAt: new Date(),
            notes,
            urgency,
            targetRole: 'execution',
            executionApproval: 'pending',
            accountsStatus: 'pending'
        };

        onAddRequest(newRequest);
        setIsFormOpen(false);
        setQuantity(0);
        setNotes('');
        setDate('');
        setUrgency('Normal');
    };

    const getStatusColor = (status: MaterialRequest['status']) => {
        switch (status) {
            case 'Requested': return 'bg-warning-subtle text-warning';
            case 'Approved': return 'bg-primary-subtle text-primary';
            case 'Ordered': return 'bg-purple-100 text-purple-800';
            case 'Delivered': return 'bg-success-subtle text-success';
            case 'Rejected': return 'bg-error-subtle text-error';
            default: return 'bg-subtle-background text-text-secondary';
        }
    };

    return (
        <div className="h-full flex flex-col gap-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-text-primary">Material Logistics</h3>
                    <p className="text-xs text-text-secondary">Track site inventory and requests</p>
                </div>
                <button
                    onClick={() => setIsFormOpen(!isFormOpen)}
                    className="flex items-center gap-2 px-4 py-2 bg-success text-white rounded-lg hover:bg-success/90 transition-colors shadow-sm"
                >
                    <PlusIcon className="w-5 h-5" />
                    Request Material
                </button>
            </div>

            {isFormOpen && (
                <div className="bg-surface p-6 rounded-xl border border-border shadow-md animate-in slide-in-from-top-4">
                    <h4 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-4">Material Requisition Form</h4>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-text-secondary mb-1">Select Item (from BOQ)</label>
                                <select
                                    value={selectedItem}
                                    onChange={e => setSelectedItem(e.target.value)}
                                    className="w-full p-2 border border-border rounded-lg bg-surface text-text-primary"
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
                                    <label className="block text-xs font-medium text-text-secondary mb-1">Quantity</label>
                                    <input
                                        type="number"
                                        value={quantity}
                                        onChange={e => setQuantity(parseFloat(e.target.value))}
                                        className="w-full p-2 border border-border rounded-lg bg-surface text-text-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-text-secondary mb-1">Required By</label>
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={e => setDate(e.target.value)}
                                        className="w-full p-2 border border-border rounded-lg bg-surface text-text-primary"
                                    />
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-text-secondary mb-1">Urgency</label>
                            <select
                                value={urgency}
                                onChange={e => setUrgency(e.target.value as any)}
                                className="w-full p-2 border border-border rounded-lg bg-surface text-text-primary"
                            >
                                <option value="Normal">Normal</option>
                                <option value="Urgent">Urgent</option>
                                <option value="Critical">Critical</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-text-secondary mb-1">Notes / Specifications</label>
                            <textarea
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                rows={2}
                                className="w-full p-2 border border-border rounded-lg bg-surface text-text-primary"
                                placeholder="E.g. Deliver to back gate..."
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setIsFormOpen(false)}
                                className="px-3 py-1.5 text-sm text-text-secondary hover:bg-subtle-background rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-3 py-1.5 text-sm bg-success text-white rounded-lg hover:bg-success/90"
                            >
                                Submit Request
                            </button>
                        </div>
                    </form >
                </div >
            )}

            <div className="bg-surface rounded-xl border border-border overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-subtle-background border-b border-border">
                        <tr>
                            <th className="px-6 py-3 font-medium text-text-secondary">Item</th>
                            <th className="px-6 py-3 font-medium text-text-secondary">Qty</th>
                            <th className="px-6 py-3 font-medium text-text-secondary">Urgency</th>
                            <th className="px-6 py-3 font-medium text-text-secondary">Required Date</th>
                            <th className="px-6 py-3 font-medium text-text-secondary">Status</th>
                            <th className="px-6 py-3 font-medium text-text-secondary">Requestor</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {requests.map(req => {
                            const user = USERS.find(u => u.id === req.requestedBy);
                            return (
                                <tr key={req.id} className="hover:bg-subtle-background/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-text-primary">
                                        {req.itemName}
                                        {req.notes && <p className="text-xs text-text-tertiary font-normal mt-0.5">{req.notes}</p>}
                                    </td>
                                    <td className="px-6 py-4 text-text-secondary">
                                        {req.quantityRequested} {req.unit}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${req.urgency === 'Critical' ? 'bg-error-subtle text-error' :
                                            req.urgency === 'Urgent' ? 'bg-warning-subtle text-warning' :
                                                'bg-info-subtle text-info'
                                            }`}>
                                            {req.urgency || 'Normal'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-text-secondary flex items-center gap-2">
                                        <ClockIcon className="w-4 h-4 text-text-tertiary" />
                                        {format(new Date(req.requiredDate), 'dd MMM')}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold w-fit ${getStatusColor(req.status)}`}>
                                                {req.status}
                                            </span>
                                            {req.executionApproval === 'pending' && (
                                                <span className="text-[10px] text-text-tertiary">Awaiting Exec.</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-text-tertiary">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-subtle-background flex items-center justify-center text-xs font-bold text-text-primary">
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
                    <div className="p-8 text-center text-text-tertiary italic">No material requests found.</div>
                )}
            </div>
        </div >
    );
};

export default MaterialTracker;
