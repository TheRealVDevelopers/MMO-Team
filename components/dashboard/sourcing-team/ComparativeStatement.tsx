
import React from 'react';
import { RFQ, Bid, Vendor } from '../../../types';
import { RFQS, BIDS_DATA, VENDORS, formatCurrencyINR } from '../../../constants';
import Modal from '../../shared/Modal';
import { CheckCircleIcon, XCircleIcon, StarIcon } from '@heroicons/react/24/solid';

interface ComparativeStatementProps {
    isOpen: boolean;
    onClose: () => void;
    requestId: string;
    onAward: (bidId: string) => void;
}

const ComparativeStatement: React.FC<ComparativeStatementProps> = ({ isOpen, onClose, requestId, onAward }) => {
    // Find RFQ linked to this material request
    const rfq = RFQS.find(r => r.sourcingRequestId === requestId);

    if (!rfq) return null;

    // Find all bids for this RFQ
    const [allBids, setAllBids] = React.useState<Bid[]>([]);

    React.useEffect(() => {
        const localBids = JSON.parse(localStorage.getItem('mmo_mock_bids') || '[]');
        setAllBids([...BIDS_DATA, ...localBids]);
    }, []);

    const bids = allBids.filter(b => b.rfqId === rfq.id);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Comparative Statement (CS) - ${rfq.projectName}`} size="6xl">
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    <div className="bg-subtle-background p-4 rounded-xl border border-border">
                        <p className="text-[10px] uppercase font-black text-text-secondary tracking-widest mb-1">RFQ Number</p>
                        <p className="text-lg font-serif font-bold text-text-primary">{rfq.rfqNumber}</p>
                    </div>
                    <div className="bg-subtle-background p-4 rounded-xl border border-border">
                        <p className="text-[10px] uppercase font-black text-text-secondary tracking-widest mb-1">Items Requested</p>
                        <p className="text-lg font-serif font-bold text-text-primary">{rfq.items.length} Items</p>
                    </div>
                    <div className="bg-subtle-background p-4 rounded-xl border border-border">
                        <p className="text-[10px] uppercase font-black text-text-secondary tracking-widest mb-1">Bids Received</p>
                        <p className="text-lg font-serif font-bold text-text-primary">{bids.length} Vendors</p>
                    </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-border">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-surface border-b border-border">
                                <th className="p-4 font-bold text-xs uppercase tracking-widest text-text-secondary">Vendor Details</th>
                                <th className="p-4 font-bold text-xs uppercase tracking-widest text-text-secondary">Rating</th>
                                <th className="p-4 font-bold text-xs uppercase tracking-widest text-text-secondary">Delivery Time</th>
                                <th className="p-4 font-bold text-xs uppercase tracking-widest text-text-secondary">Payment Terms</th>
                                <th className="p-4 font-bold text-xs uppercase tracking-widest text-text-secondary text-right">Quote Amount</th>
                                <th className="p-4 font-bold text-xs uppercase tracking-widest text-text-secondary text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {bids.map(bid => {
                                const vendor = VENDORS.find(v => v.id === bid.vendorId);
                                return (
                                    <tr key={bid.id} className="hover:bg-subtle-background transition-colors group">
                                        <td className="p-4">
                                            <div className="font-bold text-text-primary">{bid.vendorName}</div>
                                            <div className="text-xs text-text-secondary">{vendor?.category} Specialist</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center text-primary/100 font-bold">
                                                <StarIcon className="w-4 h-4 mr-1" />
                                                {vendor?.rating || 'N/A'}
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-text-primary font-medium">
                                            {bid.deliveryTimeline}
                                        </td>
                                        <td className="p-4 text-xs text-text-secondary leading-relaxed">
                                            {bid.paymentTerms}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="font-mono font-bold text-text-primary text-lg">
                                                {formatCurrencyINR(bid.totalAmount)}
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <button
                                                onClick={() => onAward(bid.id)}
                                                className="px-4 py-2 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-primary hover:text-white transition-all shadow-subtle border border-primary/20"
                                            >
                                                Award PO
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 bg-accent-subtle-background border border-accent rounded-xl flex items-start space-x-3">
                    <CheckCircleIcon className="w-5 h-5 text-accent-subtle-text mt-0.5" />
                    <p className="text-xs text-accent-subtle-text leading-relaxed">
                        <strong>Evaluation Protocol:</strong> Comparing based on L1 (Lowest Price) vs T1 (Technical Rating). Awarding a PO will automatically notify the vendor and initiate the Goods Receipt workflow.
                    </p>
                </div>
            </div>
        </Modal>
    );
};

export default ComparativeStatement;
