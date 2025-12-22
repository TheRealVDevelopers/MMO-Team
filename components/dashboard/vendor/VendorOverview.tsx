
import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import { RFQS, BIDS_DATA } from '../../../constants';
import { RFQStatus, BidStatus } from '../../../types';
import { ClipboardDocumentListIcon, DocumentCheckIcon, TrophyIcon } from '@heroicons/react/24/outline';

const VendorOverview: React.FC = () => {
    const { currentVendor } = useAuth();

    if (!currentVendor) return null;

    // Calc Stats
    const activeRFQs = RFQS.filter(r =>
        r.status === RFQStatus.OPEN &&
        r.invitedVendorIds.includes(currentVendor.id)
    ).length;

    const myBids = BIDS_DATA.filter(b => b.vendorId === currentVendor.id);
    const submittedBidsCount = myBids.length;
    const wins = myBids.filter(b => b.status === BidStatus.ACCEPTED).length;

    // Win Rate logic (mock)
    const winRate = submittedBidsCount > 0 ? Math.round((wins / submittedBidsCount) * 100) : 0;

    const StatCard = ({ icon: Icon, label, value, colorClass }: any) => (
        <div className="bg-surface border border-border rounded-xl p-6 flex items-center space-x-4 shadow-sm hover:shadow-md transition-shadow">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClass}`}>
                <Icon className="w-6 h-6" />
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
                    <div className="text-2xl font-bold text-kurchi-gold-500">★ {currentVendor.rating}</div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    icon={ClipboardDocumentListIcon}
                    label="Pending RFQs"
                    value={activeRFQs}
                    colorClass="bg-blue-100 text-blue-600"
                />
                <StatCard
                    icon={DocumentCheckIcon}
                    label="Submitted Bids"
                    value={submittedBidsCount}
                    colorClass="bg-purple-100 text-purple-600"
                />
                <StatCard
                    icon={TrophyIcon}
                    label="Bids Won"
                    value={wins}
                    colorClass="bg-green-100 text-green-600"
                />
            </div>

            {/* Quick Tips */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
                <h3 className="font-bold text-primary mb-2 flex items-center">
                    <span className="w-2 h-2 rounded-full bg-primary mr-2"></span>
                    Procurement Notice
                </h3>
                <p className="text-sm text-text-secondary">
                    Please ensure all bids for Project #104 are submitted by EOD tomorrow. Late submissions will not be considered for the Comparative Statement evaluation.
                </p>
            </div>
        </div>
    );
};

export default VendorOverview;
