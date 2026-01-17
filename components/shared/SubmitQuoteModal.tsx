import React, { useState, useEffect, useMemo } from 'react';
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
    const [quoteMode, setQuoteMode] = useState<'itemized' | 'lumpsum'>('itemized');
    const [lumpsumAmount, setLumpsumAmount] = useState<number>(0);
    const [isSubmitted, setIsSubmitted] = useState(false);

    // Re-bid detection - get the LATEST bid from our history
    const existingBid = useMemo(() => {
        const allBids = JSON.parse(localStorage.getItem('mmo_bids') || '[]');
        return allBids
            .filter((b: Bid) => b.rfqId === rfq.id && b.vendorId === (currentVendor?.id || selectedVendor?.id))
            .sort((a: any, b: any) => new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime())[0];
    }, [rfq.id, currentVendor?.id, selectedVendor?.id, isSubmitted]);

    const [itemBids, setItemBids] = useState(
        rfq.items.map(item => {
            const existingItem = existingBid?.items?.find((bi: any) => bi.rfqItemId === item.id);
            return {
                rfqItemId: item.id,
                unitPrice: existingItem?.unitPrice || 0,
                remarks: existingItem?.remarks || ''
            };
        })
    );

    const [deliveryTimeline, setDeliveryTimeline] = useState(existingBid?.deliveryTimeline || '');
    const [paymentTerms, setPaymentTerms] = useState(existingBid?.paymentTerms || selectedVendor?.paymentTerms || '');
    const [warranty, setWarranty] = useState(existingBid?.warranty || '');
    const [notes, setNotes] = useState(existingBid?.notes || '');

    useEffect(() => {
        if (existingBid && existingBid.totalAmount > 0 && existingBid.items.length === 0) {
            setQuoteMode('lumpsum');
            setLumpsumAmount(existingBid.totalAmount);
        }
    }, [existingBid]);

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

    const totalAmount = quoteMode === 'itemized'
        ? itemBids.reduce((sum, item, idx) => sum + (item.unitPrice * rfq.items[idx].quantity), 0)
        : lumpsumAmount;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedVendor) {
            alert('Please select a vendor.');
            return;
        }

        const newBid: Bid = {
            id: `bid-${Date.now()}`, // Always new ID to track history
            rfqId: rfq.id,
            vendorId: selectedVendor.id,
            vendorName: selectedVendor.name,
            submittedDate: new Date(),
            validityDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            items: quoteMode === 'itemized' ? itemBids.map((item, idx) => ({
                rfqItemId: item.rfqItemId,
                unitPrice: item.unitPrice,
                totalPrice: item.unitPrice * rfq.items[idx].quantity,
                remarks: item.remarks
            })) : [],
            totalAmount,
            deliveryTimeline,
            paymentTerms,
            warranty,
            status: BidStatus.SUBMITTED,
            notes,
            isUpdated: !!existingBid
        };

        const existingBids = JSON.parse(localStorage.getItem('mmo_bids') || '[]');
        const updatedBids = [...existingBids, newBid];

        localStorage.setItem('mmo_bids', JSON.stringify(updatedBids));

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

                {/* Bidding Mode Selector */}
                <div className="flex bg-subtle-background p-1.5 rounded-2xl border border-border w-fit mx-auto">
                    <button
                        type="button"
                        onClick={() => setQuoteMode('itemized')}
                        className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${quoteMode === 'itemized' ? 'bg-primary text-white shadow-lg' : 'text-text-tertiary hover:bg-white'}`}
                    >
                        Itemized Pricing
                    </button>
                    <button
                        type="button"
                        onClick={() => setQuoteMode('lumpsum')}
                        className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${quoteMode === 'lumpsum' ? 'bg-secondary text-white shadow-lg' : 'text-text-tertiary hover:bg-white'}`}
                    >
                        Lumpsum Quote
                    </button>
                </div>

                <div className="bg-subtle-background p-6 rounded-2xl border border-border">
                    {quoteMode === 'itemized' ? (
                        <div className="space-y-4">
                            <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mb-4">Line Item Breakdown</p>
                            {rfq.items.map((item, index) => (
                                <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-white p-5 rounded-2xl border border-border/50 group hover:border-primary transition-colors">
                                    <div className="md:col-span-5">
                                        <p className="font-bold text-text-primary text-sm">{item.name}</p>
                                        <p className="text-[10px] text-text-tertiary mt-0.5">{item.description}</p>
                                        <div className="mt-2 flex items-center space-x-2">
                                            <span className="text-[10px] font-mono bg-subtle-background px-2 py-0.5 rounded text-text-secondary">QTY: {item.quantity} {item.unit}</span>
                                        </div>
                                    </div>
                                    <div className="md:col-span-3">
                                        <label className="block text-[10px] font-black text-text-tertiary uppercase mb-1.5 ml-1">Unit Price (₹)</label>
                                        <input
                                            type="number"
                                            required={quoteMode === 'itemized'}
                                            min="0"
                                            value={itemBids[index].unitPrice || ''}
                                            onChange={(e) => handlePriceChange(index, parseFloat(e.target.value))}
                                            className="w-full p-2.5 border border-border rounded-xl bg-background text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all"
                                            placeholder="0"
                                        />
                                    </div>
                                    <div className="md:col-span-4">
                                        <label className="block text-[10px] font-black text-text-tertiary uppercase mb-1.5 ml-1">Remarks</label>
                                        <input
                                            type="text"
                                            value={itemBids[index].remarks}
                                            onChange={(e) => handleRemarkChange(index, e.target.value)}
                                            className="w-full p-2.5 border border-border rounded-xl bg-background text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                                            placeholder="Notes for this item..."
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-12 px-6 bg-white rounded-3xl border border-border flex flex-col items-center max-w-lg mx-auto shadow-sm">
                            <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center text-secondary mb-6">
                                <span className="text-2xl font-serif font-black">₹</span>
                            </div>
                            <h3 className="text-lg font-black text-text-primary mb-2">Total Project Amount</h3>
                            <p className="text-text-secondary text-xs text-center mb-8">Enter a single consolidated amount for all items in this RFQ.</p>
                            <div className="w-full relative">
                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-serif font-black text-text-tertiary">₹</span>
                                <input
                                    type="number"
                                    required={quoteMode === 'lumpsum'}
                                    min="1"
                                    value={lumpsumAmount || ''}
                                    onChange={(e) => setLumpsumAmount(parseFloat(e.target.value))}
                                    className="w-full pl-12 pr-6 py-5 bg-background border-2 border-border rounded-[2rem] text-3xl font-serif font-black text-text-primary text-center focus:border-secondary transition-all outline-none"
                                    placeholder="0"
                                />
                            </div>
                        </div>
                    )}
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

                <div className="flex justify-between items-center bg-primary/5 p-8 rounded-[2.5rem] border border-primary/20">
                    <div>
                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Grand Total Quote</p>
                        <p className="text-4xl font-serif font-black text-primary">{formatCurrencyINR(totalAmount)}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-8 py-3 text-sm font-black text-text-tertiary uppercase tracking-widest hover:text-text-primary transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-12 py-4 bg-primary text-white text-sm font-bold uppercase tracking-widest rounded-3xl hover:bg-secondary transition-all shadow-2xl shadow-primary/30 active:scale-95 flex items-center"
                        >
                            {existingBid ? 'Update My Quotation' : 'Submit Final Quote'}
                        </button>
                    </div>
                </div>
            </form>
        </Modal>
    );
};

export default SubmitQuoteModal;
