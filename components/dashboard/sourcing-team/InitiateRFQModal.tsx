import React, { useState } from 'react';
import { VENDORS, formatDate } from '../../../constants';
import { MaterialRequest, RFQ, RFQStatus, RFQItem } from '../../../types';
import Modal from '../../shared/Modal';
import { UsersIcon, CalendarIcon, PaperAirplaneIcon, XMarkIcon } from '../../icons/IconComponents';

interface InitiateRFQModalProps {
    isOpen: boolean;
    onClose: () => void;
    request: MaterialRequest | null;
    onInitiate: (rfqData: Omit<RFQ, 'id' | 'rfqNumber' | 'createdDate'>) => void;
}

const InitiateRFQModal: React.FC<InitiateRFQModalProps> = ({ isOpen, onClose, request, onInitiate }) => {
    const [selectedVendorIds, setSelectedVendorIds] = useState<string[]>([]);
    const [deadline, setDeadline] = useState('');
    const [notes, setNotes] = useState('');

    if (!request) return null;

    const toggleVendor = (vendorId: string) => {
        setSelectedVendorIds(prev =>
            prev.includes(vendorId)
                ? prev.filter(id => id !== vendorId)
                : [...prev, vendorId]
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedVendorIds.length === 0) {
            alert('Please select at least one vendor.');
            return;
        }
        if (!deadline) {
            alert('Please set a deadline.');
            return;
        }

        const rfqItems: RFQItem[] = request.materials.map((m, idx) => ({
            id: `rfq-item-${idx}`,
            name: m.name,
            description: m.spec,
            quantity: 1, // Defaulting to 1 for simplicity in demo
            unit: 'nos'
        }));

        onInitiate({
            projectId: request.projectId,
            projectName: request.projectName,
            procurementRequestId: request.id,
            items: rfqItems,
            deadline: new Date(deadline),
            status: RFQStatus.OPEN,
            invitedVendorIds: selectedVendorIds,
            notes,
            createdBy: 'user-7', // Anna Procurement
        });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Initiate RFQ" size="3xl">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                    {/* Left Side: Summary */}
                    <div className="space-y-4">
                        <div className="bg-subtle-background/50 p-4 rounded-xl border border-border">
                            <h3 className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-2">Request Summary</h3>
                            <p className="text-sm font-bold text-text-primary">{request.projectName}</p>
                            <div className="mt-4 space-y-2">
                                {request.materials.map((m, i) => (
                                    <div key={i} className="text-xs text-text-secondary flex justify-between">
                                        <span>{m.name}</span>
                                        <span className="italic">{m.spec}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-2">Deadline for Bidding</label>
                            <div className="relative">
                                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                                <input
                                    type="date"
                                    value={deadline}
                                    onChange={(e) => setDeadline(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-surface border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    required
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-2">Additional Notes to Vendors</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="E.g., Please provide quote inclusive of delivery, warranty required..."
                                className="w-full p-4 bg-surface border border-border rounded-lg text-sm h-32 resize-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            />
                        </div>
                    </div>

                    {/* Right Side: Vendor Selection */}
                    <div className="space-y-4">
                        <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest">Select Vendors to Invite</label>
                        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {VENDORS.map((vendor) => (
                                <div
                                    key={vendor.id}
                                    onClick={() => toggleVendor(vendor.id)}
                                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${selectedVendorIds.includes(vendor.id)
                                        ? 'border-primary bg-primary/5 shadow-md'
                                        : 'border-border bg-surface hover:border-text-secondary'
                                        }`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${selectedVendorIds.includes(vendor.id) ? 'bg-primary text-white' : 'bg-subtle-background text-text-secondary'
                                            }`}>
                                            <UsersIcon className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-text-primary">{vendor.name}</p>
                                            <p className="text-[10px] text-text-secondary">{vendor.category} • {vendor.rating} ★</p>
                                        </div>
                                    </div>
                                    {selectedVendorIds.includes(vendor.id) && (
                                        <div className="w-5 h-5 bg-primary text-white rounded-full flex items-center justify-center p-1">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-full h-full">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-border">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2 text-sm font-bold text-text-secondary hover:text-text-primary uppercase tracking-widest transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-8 py-2 bg-primary text-white text-sm font-black uppercase tracking-[0.2em] rounded-full hover:shadow-luxury transition-all flex items-center space-x-2"
                    >
                        <PaperAirplaneIcon className="w-4 h-4" />
                        <span>Send RFQ Invitations</span>
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default InitiateRFQModal;
