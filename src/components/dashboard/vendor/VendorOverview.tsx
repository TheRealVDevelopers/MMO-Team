
import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import { RFQStatus, BidStatus, RFQ, Bid } from '../../../types';
import { ClipboardDocumentListIcon, DocumentCheckIcon, TrophyIcon, FireIcon, ClockIcon } from '@heroicons/react/24/outline';

const VendorOverview: React.FC = () => {
    const { currentVendor } = useAuth();

    // Removed localStorage fallback and hardcoded RFQS/BIDS_DATA
    const [rfqs] = React.useState<RFQ[]>([]);
    const [bids] = React.useState<Bid[]>([]);

    if (!currentVendor) return null;

    // Filter RFQs where the current vendor is invited and status is OPEN
    const myActiveRFQs = rfqs.filter(rfq =>
        rfq.status === RFQStatus.OPEN &&
        rfq.invitedVendorIds.includes(currentVendor.id)
    );

    const activeRFQsCount = myActiveRFQs.length;
    const mySubmittedBids = bids.filter(b => b.vendorId === currentVendor.id);
    const submittedBidsCount = mySubmittedBids.length;
    const wins = mySubmittedBids.filter(b => b.status === BidStatus.ACCEPTED).length;

    const StatCard = ({ icon: Icon, label, value, colorClass }: any) => (
        <div className="bg-surface border border-border rounded-xl p-6 flex items-center space-x-4 shadow-sm hover:shadow-md transition-shadow">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClass}`}>
                {Icon && <Icon className="w-6 h-6" />}
            </div>
            <div>
                <p className="text-sm text-text-secondary font-medium uppercase tracking-wider">{label}</p>
                <p className="text-2xl font-serif font-bold text-text-primary">{value}</p>
            </div>
        </div>
    );

    return (
        <div className="p-6 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-text-primary mb-2">Welcome, {currentVendor.name}</h1>
                    <p className="text-text-secondary">Here is an overview of your bidding activity.</p>
                </div>
                <div className="text-right">
                    <div className="text-xs font-bold uppercase tracking-wider text-text-secondary">Vendor Rating</div>
                    <div className="text-2xl font-bold text-primary">★ {currentVendor.rating}</div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    icon={ClipboardDocumentListIcon}
                    label="Active RFQs"
                    value={activeRFQsCount}
                    colorClass="bg-primary/10 text-primary"
                />
                <StatCard
                    icon={DocumentCheckIcon}
                    label="All Bids"
                    value={submittedBidsCount}
                    colorClass="bg-purple/10 text-purple"
                />
                <StatCard
                    icon={TrophyIcon}
                    label="Contracts Won"
                    value={wins}
                    colorClass="bg-secondary/10 text-secondary"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Live Opportunities */}
                <div className="space-y-4">
                    <h3 className="text-lg font-serif font-bold text-text-primary flex items-center">
                        <FireIcon className="w-5 h-5 mr-2 text-primary" />
                        Hot Opportunities
                    </h3>
                    <div className="space-y-3">
                        {myActiveRFQs.slice(0, 3).map(rfq => {
                            const diff = new Date(rfq.deadline).getTime() - new Date().getTime();
                            const isUrgent = diff > 0 && diff < (24 * 60 * 60 * 1000); // Less than 24h
                            return (
                                <div key={rfq.id} className="bg-surface border border-border rounded-xl p-4 flex justify-between items-center group hover:border-primary transition-colors">
                                    <div>
                                        <p className="font-bold text-text-primary">{rfq.projectName}</p>
                                        <div className="flex items-center text-[10px] text-text-secondary mt-1">
                                            <ClockIcon className="w-3 h-3 mr-1" />
                                            Deadline: {new Date(rfq.deadline).toLocaleDateString()}
                                            {isUrgent && <span className="ml-2 text-red-500 font-bold uppercase tracking-tighter">Urgent!</span>}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-bold text-text-tertiary uppercase mb-1">{rfq.items.length} Items</p>
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-[10px] font-black text-primary uppercase">View Details →</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {myActiveRFQs.length === 0 && (
                            <div className="p-8 text-center bg-subtle-background rounded-xl border border-dashed border-border text-text-tertiary">
                                No new opportunities at the moment.
                            </div>
                        )}
                    </div>
                </div>

                {/* Performance Analytics (Placeholders for now) */}
                <div className="bg-subtle-background rounded-2xl p-6 border border-border">
                    <h3 className="text-lg font-serif font-bold text-text-primary mb-6">Bidding Insights</h3>
                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between text-xs mb-2">
                                <span className="text-text-secondary uppercase">Success Rate</span>
                                <span className="font-bold text-text-primary">{submittedBidsCount > 0 ? Math.round((wins / submittedBidsCount) * 100) : 0}%</span>
                            </div>
                            <div className="h-2 bg-border rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-secondary transition-all duration-1000"
                                    style={{ width: `${submittedBidsCount > 0 ? (wins / submittedBidsCount) * 100 : 0}%` }}
                                ></div>
                            </div>
                        </div>
                        <p className="text-xs text-text-secondary italic">
                            <b>Pro Tip:</b> Competitive pricing (within 5% of target) improves your win rate by 40%. Check "Lowest Bid" data in Active RFQs frequently.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VendorOverview;
