import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { formatCurrencyINR } from '../../../constants';
import { RFQStatus, RFQ, Bid } from '../../../types';
import { ClockIcon, TrophyIcon, UserCircleIcon, FireIcon } from '@heroicons/react/24/outline';
import SubmitQuoteModal from '../../shared/SubmitQuoteModal';

const UnifiedBiddingBoard: React.FC = () => {
    const { currentVendor } = useAuth();
    const [selectedRFQ, setSelectedRFQ] = useState<RFQ | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());

    // Update timer every minute
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    // Removed hardcoded RFQS and localStorage logic
    const [rfqs, setRfqs] = useState<RFQ[]>([]);
    const [bids, setBids] = useState<Bid[]>([]);

    const refreshData = () => {
        // NO-OP as we are removing localStorage sync
    };

    // Filter RFQs where the current vendor is invited and status is OPEN
    const activeProjects = rfqs.filter(rfq => {
        const isInvited = currentVendor && rfq.invitedVendorIds.includes(currentVendor.id);
        const isOpen = rfq.status === RFQStatus.OPEN;
        return isOpen && isInvited;
    });

    useEffect(() => {
        console.log('Vendor Bidding Board State:', {
            currentVendor: currentVendor?.name,
            totalRfqs: rfqs.length,
            activeProjectsCount: activeProjects.length,
            vendorId: currentVendor?.id
        });
    }, [currentVendor, rfqs, activeProjects]);

    const getLowestBid = (rfqId: string) => {
        const rfqBids = bids.filter(b => b.rfqId === rfqId);
        if (rfqBids.length === 0) return 0;

        // Group by vendor and get only the LATEST bid from each
        const latestVendorBids = new Map<string, number>();
        rfqBids.forEach(bid => {
            const existing = latestVendorBids.get(bid.vendorId);
            const bidTime = new Date(bid.submittedDate).getTime();
            // We want the one with the latest timestamp
            // Since our array is chronological, we can just replace as we go
            latestVendorBids.set(bid.vendorId, bid.totalAmount);
        });

        return Math.min(...Array.from(latestVendorBids.values()));
    };

    const getMyBid = (rfqId: string) => {
        const myBids = bids.filter(b => b.rfqId === rfqId && b.vendorId === currentVendor?.id);
        if (myBids.length === 0) return undefined;
        // The last one in the array is the latest
        return myBids[myBids.length - 1];
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
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4">
                <div>
                    <h2 className="text-2xl font-serif font-black text-text-primary">Live Bidding Board</h2>
                    <p className="text-text-secondary text-sm">Submit and manage your project quotations in real-time.</p>
                </div>
                <div className="bg-primary/5 px-6 py-3 rounded-2xl border border-primary/10">
                    <p className="text-[10px] text-primary uppercase font-black mb-1">Active Projects</p>
                    <p className="text-2xl font-serif font-black text-primary">{activeProjects.length}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {activeProjects.map(rfq => {
                    const lowestBid = getLowestBid(rfq.id);
                    const myBid = getMyBid(rfq.id);
                    const timeRemaining = getTimeRemaining(rfq.deadline);
                    const isExpired = timeRemaining === "Closed";
                    const isWinner = myBid && lowestBid > 0 && myBid.totalAmount === lowestBid;

                    return (
                        <div
                            key={rfq.id}
                            className={`group bg-surface border border-border rounded-3xl overflow-hidden transition-all duration-500 hover:shadow-2xl hover:border-primary/50 ${isExpired ? 'opacity-70 grayscale' : ''}`}
                        >
                            <div className="p-8">
                                <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-8 mb-8">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                                            <h3 className="text-xl font-black text-text-primary group-hover:text-primary transition-colors">{rfq.projectName}</h3>
                                            <span className="text-[10px] bg-subtle-background px-2 py-1 rounded-md font-mono text-text-tertiary">
                                                {rfq.rfqNumber}
                                            </span>
                                        </div>
                                        <div className="flex items-center text-xs text-text-secondary font-medium">
                                            <UserCircleIcon className="w-4 h-4 mr-1.5 opacity-50" />
                                            Commercial Project • Individual & Lumpsum Bidding Enabled
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-3">
                                        <div className={`flex flex-col items-center justify-center min-w-[120px] p-3 rounded-2xl border ${isExpired ? 'bg-red-50 border-red-100 text-red-600' : 'bg-primary/5 border-primary/20 text-primary'}`}>
                                            <div className="flex items-center text-[8px] font-black uppercase tracking-widest mb-1.5">
                                                <ClockIcon className="w-3 h-3 mr-1" />
                                                Remaining
                                            </div>
                                            <span className="text-sm font-black tracking-tighter uppercase">{timeRemaining}</span>
                                        </div>

                                        <div className="flex flex-col items-center justify-center min-w-[140px] p-3 rounded-2xl bg-secondary/5 border border-secondary/20 text-secondary">
                                            <div className="flex items-center text-[8px] font-black uppercase tracking-widest mb-1.5">
                                                <TrophyIcon className="w-3 h-3 mr-1" />
                                                Lowest Bid
                                            </div>
                                            <span className="text-sm font-black tracking-tighter">
                                                {lowestBid > 0 ? formatCurrencyINR(lowestBid) : 'No Bids'}
                                            </span>
                                        </div>

                                        {myBid && (
                                            <div className={`flex flex-col items-center justify-center min-w-[140px] p-3 rounded-2xl border ${isWinner ? 'bg-green-50 border-green-200 text-green-600' : 'bg-subtle-background border-border text-text-secondary'}`}>
                                                <div className="flex items-center text-[8px] font-black uppercase tracking-widest mb-1.5">
                                                    Your Quote
                                                </div>
                                                <span className="text-sm font-black tracking-tighter">
                                                    {formatCurrencyINR(myBid.totalAmount)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                                    <div className="md:col-span-2 space-y-3">
                                        <p className="text-[10px] font-black text-text-tertiary uppercase tracking-[0.2em]">Project Outline</p>
                                        <div className="flex flex-wrap gap-2">
                                            {rfq.items.map(item => (
                                                <span key={item.id} className="text-[11px] font-bold text-text-secondary bg-subtle-background border border-border/50 px-3 py-1.5 rounded-xl">
                                                    {item.name} ({item.quantity})
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex justify-end">
                                        <button
                                            onClick={() => setSelectedRFQ(rfq)}
                                            disabled={isExpired}
                                            className={`group/btn relative w-full lg:w-auto px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest overflow-hidden transition-all duration-300 ${isExpired
                                                ? 'bg-text-tertiary text-white cursor-not-allowed'
                                                : myBid
                                                    ? 'bg-secondary text-white hover:bg-primary shadow-xl shadow-secondary/20'
                                                    : 'bg-primary text-white hover:bg-secondary shadow-xl shadow-primary/20 hover:-translate-y-1 active:translate-y-0'
                                                }`}
                                        >
                                            <span className="relative z-10">{isExpired ? 'Bidding Closed' : myBid ? 'Update My Bid' : 'Participate & Quote'}</span>
                                            {!isExpired && (
                                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {activeProjects.length === 0 && (
                    <div className="bg-surface border-2 border-dashed border-border rounded-[40px] py-24 flex flex-col items-center justify-center text-center p-8">
                        <div className="w-20 h-20 bg-subtle-background rounded-3xl flex items-center justify-center mb-6">
                            <ClockIcon className="w-10 h-10 text-text-tertiary/20" />
                        </div>
                        <h3 className="text-2xl font-serif font-bold text-text-primary mb-2">Queue is Empty</h3>
                        <p className="text-text-secondary max-w-sm">There are no active projects seeking quotations right now. New projects will appear here as soon as they are released by the team.</p>
                    </div>
                )}
            </div>

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

export default UnifiedBiddingBoard;
