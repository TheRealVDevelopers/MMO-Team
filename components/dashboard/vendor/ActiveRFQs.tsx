import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { RFQS, formatCurrencyINR } from '../../../constants';
import { RFQStatus, RFQ, Bid } from '../../../types';
import { ClipboardDocumentListIcon, ClockIcon, TrophyIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import SubmitQuoteModal from '../../shared/SubmitQuoteModal';

const ActiveRFQs: React.FC = () => {
    const { currentVendor } = useAuth();
    const [selectedRFQ, setSelectedRFQ] = useState<RFQ | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());

    // Update timer every minute
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const [rfqs, setRfqs] = useState<RFQ[]>(() => {
        const saved = localStorage.getItem('mmo_rfqs');
        return saved ? JSON.parse(saved) : RFQS;
    });

    const [bids, setBids] = useState<Bid[]>(() => {
        const saved = localStorage.getItem('mmo_bids');
        return saved ? JSON.parse(saved) : [];
    });

    const refreshData = () => {
        const savedRfqs = localStorage.getItem('mmo_rfqs');
        if (savedRfqs) setRfqs(JSON.parse(savedRfqs));

        const savedBids = localStorage.getItem('mmo_bids');
        if (savedBids) setBids(JSON.parse(savedBids));
    };

    // Filter RFQs where the current vendor is invited and status is OPEN
    const myRFQs = rfqs.filter(rfq =>
        rfq.status === RFQStatus.OPEN &&
        currentVendor &&
        rfq.invitedVendorIds.includes(currentVendor.id)
    );

    const getLowestBid = (rfqId: string) => {
        const rfqBids = bids.filter(b => b.rfqId === rfqId);
        if (rfqBids.length === 0) return 0;
        return Math.min(...rfqBids.map(b => b.totalAmount));
    };

    const getTimeRemaining = (deadline: Date | string) => {
        const diff = new Date(deadline).getTime() - currentTime.getTime();
        if (diff <= 0) return "Closed";

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (days > 0) return `${days}d ${hours}h left`;
        return `${hours}h ${mins}m left`;
    };

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-3xl font-serif font-bold text-text-primary">Active RFQs</h1>

            {myRFQs.length === 0 ? (
                <div className="bg-surface border border-border rounded-xl p-8 text-center text-text-secondary">
                    <ClipboardDocumentListIcon className="w-12 h-12 mx-auto mb-4 text-text-secondary/50" />
                    <p>No active RFQ invitations found.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {myRFQs.map(rfq => {
                        const lowestBid = getLowestBid(rfq.id);
                        const timeRemaining = getTimeRemaining(rfq.deadline);
                        const isExpired = timeRemaining === "Closed";

                        return (
                            <div key={rfq.id} className={`bg-surface border border-border rounded-xl p-6 transition-all ${isExpired ? 'opacity-75' : 'hover:shadow-lg'}`}>
                                <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2 mb-1">
                                            <h3 className="text-xl font-bold text-text-primary">{rfq.projectName}</h3>
                                            <span className="px-2 py-0.5 bg-subtle-background text-text-tertiary text-[10px] font-mono rounded">
                                                {rfq.rfqNumber}
                                            </span>
                                        </div>
                                        <div className="flex items-center text-text-secondary text-xs">
                                            <UserCircleIcon className="w-4 h-4 mr-1" />
                                            Commercial Proposal Mode (Client Info Hidden)
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        <div className={`flex items-center px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider ${isExpired ? 'bg-red-100 text-red-700' : 'bg-primary/10 text-primary animate-pulse'}`}>
                                            <ClockIcon className="w-4 h-4 mr-2" />
                                            {timeRemaining}
                                        </div>
                                        <div className="flex items-center px-4 py-2 bg-secondary/10 text-secondary rounded-lg font-bold text-xs uppercase tracking-wider">
                                            <TrophyIcon className="w-4 h-4 mr-2" />
                                            {lowestBid > 0 ? `Current L1: ${formatCurrencyINR(lowestBid)}` : 'No Bids Yet'}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Required Items</p>
                                        <div className="space-y-2">
                                            {rfq.items.map(item => (
                                                <div key={item.id} className="flex justify-between items-center text-sm p-3 bg-background rounded-xl border border-border/50">
                                                    <div>
                                                        <span className="font-bold text-text-primary">{item.name}</span>
                                                        <p className="text-[10px] text-text-secondary">{item.description}</p>
                                                    </div>
                                                    <span className="px-3 py-1 bg-surface border border-border rounded-lg font-mono text-xs">
                                                        {item.quantity} {item.unit}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10 flex flex-col justify-center">
                                        <h4 className="text-sm font-bold text-primary mb-2 italic">Competitive Advice</h4>
                                        <p className="text-xs text-text-secondary leading-relaxed">
                                            Based on current live data, the lowest bid for this project is currently sitting at <b>{lowestBid > 0 ? formatCurrencyINR(lowestBid) : '₹0'}</b>.
                                            Ensure your pricing is competitive while maintaining our standard of quality.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4 border-t border-border">
                                    <button
                                        onClick={() => setSelectedRFQ(rfq)}
                                        disabled={isExpired}
                                        className={`px-8 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all shadow-lg ${isExpired
                                            ? 'bg-text-tertiary text-white cursor-not-allowed'
                                            : 'bg-primary text-white hover:bg-secondary hover:-translate-y-0.5 active:translate-y-0 shadow-primary/20 hover:shadow-secondary/30'
                                            }`}
                                    >
                                        {isExpired ? 'Bidding Closed' : 'Submit My Quote'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {selectedRFQ && (
                <SubmitQuoteModal
                    isOpen={!!selectedRFQ}
                    onClose={() => setSelectedRFQ(null)}
                    rfq={selectedRFQ}
                    currentVendor={currentVendor}
                    onSuccess={refreshData}
                />
            )}
        </div>
    );
};

export default ActiveRFQs;
