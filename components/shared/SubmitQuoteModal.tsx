import React, { useState } from 'react';
import { RFQ, BidStatus, Bid, Vendor } from '../../types';
import { formatCurrencyINR, VENDORS } from '../../constants';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import Modal from './Modal';

interface SubmitQuoteModalProps {
    isOpen: boolean;
    onClose: () => void;
    rfq: RFQ;
    currentVendor?: Vendor | null;
    onSuccess?: () => void;
}

const SubmitQuoteModal: React.FC<SubmitQuoteModalProps> = ({ isOpen, onClose, rfq, currentVendor, onSuccess }) => {
    const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(currentVendor || null);
    const [itemBids, setItemBids] = useState(
        rfq.items.map(item => ({
            rfqItemId: item.id,
            unitPrice: 0,
            remarks: ''
        }))
    );
    const [deliveryTimeline, setDeliveryTimeline] = useState('');
    const [paymentTerms, setPaymentTerms] = useState(selectedVendor?.paymentTerms || '');
    const [warranty, setWarranty] = useState('');
    const [notes, setNotes] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handlePriceChange = (index: number, price: number) => {
        const newBids = [...itemBids];
        newBids[index].unitPrice = price;
        setItemBids(newBids);
    };

    const handleRemarkChange = (index: number, remark: string) => {
        const newBids = [...itemBids];
        newBids[index].remarks = remark;
        setItemBids(newBids);
    };

    const totalAmount = itemBids.reduce((sum, item, idx) => {
        return sum + (item.unitPrice * rfq.items[idx].quantity);
    }, 0);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedVendor) {
            alert('Please select a vendor.');
            return;
        }

        const newBid: Bid = {
            id: `bid-${Date.now()}`,
            rfqId: rfq.id,
            vendorId: selectedVendor.id,
            vendorName: selectedVendor.name,
            submittedDate: new Date(),
            validityDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            items: itemBids.map((item, idx) => ({
                rfqItemId: item.rfqItemId,
                unitPrice: item.unitPrice,
                totalPrice: item.unitPrice * rfq.items[idx].quantity,
                remarks: item.remarks
            })),
            totalAmount,
            deliveryTimeline,
            paymentTerms,
            warranty,
            status: BidStatus.SUBMITTED,
            notes
        };

        const existingBids = JSON.parse(localStorage.getItem('mmo_mock_bids') || '[]');
        localStorage.setItem('mmo_mock_bids', JSON.stringify([...existingBids, newBid]));

        setIsSubmitted(true);
        if (onSuccess) onSuccess();
        setTimeout(() => {
            setIsSubmitted(false);
            onClose();
        }, 2000);
    };

    if (isSubmitted) {
        return (
            <Modal isOpen={isOpen} onClose={onClose} title="Success" size="md">
                <div className="py-12 flex flex-col items-center text-center space-y-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                        <CheckCircleIcon className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-bold text-text-primary">Quotation Submitted!</h3>
                    <p className="text-text-secondary">The bid for {rfq.projectName} has been successfully recorded.</p>
                </div>
            </Modal>
        );
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Submit Quote - ${rfq.projectName}`} size="4xl">
            <form onSubmit={handleSubmit} className="space-y-6">
                {!currentVendor && (
                    <div className="bg-subtle-background p-4 rounded-xl border border-border">
                        <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-2">Select Vendor (On Behalf Of)</label>
                        <select
                            required
                            className="w-full p-2 border border-border rounded-lg bg-white text-sm"
                            value={selectedVendor?.id || ''}
                            onChange={(e) => {
                                const v = VENDORS.find(v => v.id === e.target.value);
                                setSelectedVendor(v || null);
                                if (v) setPaymentTerms(v.paymentTerms);
                            }}
                        >
                            <option value="">Select a vendor...</option>
                            {VENDORS.map(v => (
                                <option key={v.id} value={v.id}>{v.name} ({v.category})</option>
                            ))}
                        </select>
                    </div>
                )}

                <div className="bg-subtle-background p-4 rounded-xl border border-border">
                    <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-2">Items to Quote</p>
                    <div className="space-y-4">
                        {rfq.items.map((item, index) => (
                            <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-white p-4 rounded-lg border border-border/50">
                                <div className="md:col-span-5">
                                    <p className="font-bold text-text-primary">{item.name}</p>
                                    <p className="text-xs text-text-secondary">{item.description}</p>
                                    <p className="text-xs mt-1">Quantity: <span className="font-bold">{item.quantity} {item.unit}</span></p>
                                </div>
                                <div className="md:col-span-3">
                                    <label className="block text-xs font-bold text-text-secondary mb-1">Unit Price (₹)</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={itemBids[index].unitPrice || ''}
                                        onChange={(e) => handlePriceChange(index, parseFloat(e.target.value))}
                                        className="w-full p-2 border border-border rounded-lg bg-background text-sm font-mono"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div className="md:col-span-4">
                                    <label className="block text-xs font-bold text-text-secondary mb-1">Remarks (Optional)</label>
                                    <input
                                        type="text"
                                        value={itemBids[index].remarks}
                                        onChange={(e) => handleRemarkChange(index, e.target.value)}
                                        className="w-full p-2 border border-border rounded-lg bg-background text-sm"
                                        placeholder="e.g. In stock, Express delivery"
                                    />
                                </div>
                                <div className="md:col-span-12 text-right text-xs text-text-secondary italic">
                                    Total for Item: <span className="font-bold text-text-primary">{formatCurrencyINR(itemBids[index].unitPrice * item.quantity)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-text-primary mb-1 text-[10px] uppercase tracking-widest">Delivery Timeline</label>
                            <input
                                type="text"
                                required
                                value={deliveryTimeline}
                                onChange={(e) => setDeliveryTimeline(e.target.value)}
                                className="w-full p-2 border border-border rounded-lg text-sm"
                                placeholder="e.g. 7-10 Days"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-text-primary mb-1 text-[10px] uppercase tracking-widest">Payment Terms</label>
                            <input
                                type="text"
                                required
                                value={paymentTerms}
                                onChange={(e) => setPaymentTerms(e.target.value)}
                                className="w-full p-2 border border-border rounded-lg text-sm"
                                placeholder="e.g. 50% Advance"
                            />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-text-primary mb-1 text-[10px] uppercase tracking-widest">Warranty Info</label>
                            <input
                                type="text"
                                value={warranty}
                                onChange={(e) => setWarranty(e.target.value)}
                                className="w-full p-2 border border-border rounded-lg text-sm"
                                placeholder="e.g. 1 Year Standard"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-text-primary mb-1 text-[10px] uppercase tracking-widest">General Notes</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full p-2 border border-border rounded-lg text-sm h-20"
                                placeholder="Additional details..."
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-between items-center bg-primary/5 p-6 rounded-xl border border-primary/20">
                    <div>
                        <p className="text-xs font-bold text-primary uppercase tracking-widest">Total Quote Amount</p>
                        <p className="text-3xl font-serif font-bold text-primary">{formatCurrencyINR(totalAmount)}</p>
                    </div>
                    <div className="flex space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 text-sm font-bold text-text-secondary uppercase tracking-wider hover:text-text-primary transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-8 py-2 bg-primary text-white text-sm font-bold uppercase tracking-widest rounded-lg hover:bg-secondary transition-all shadow-lg active:scale-95"
                        >
                            Submit Quote
                        </button>
                    </div>
                </div>
            </form>
        </Modal>
    );
};

export default SubmitQuoteModal;
