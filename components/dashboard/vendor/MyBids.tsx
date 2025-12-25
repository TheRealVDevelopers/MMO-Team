
import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import { BIDS_DATA, RFQS } from '../../../constants';
import { BidStatus } from '../../../types';
import { formatCurrencyINR } from '../../../constants';
import { DocumentTextIcon } from '@heroicons/react/24/outline';

const MyBids: React.FC = () => {
    const { currentVendor } = useAuth();

    // Filter Bids submitted by current vendor
    const [allBids, setAllBids] = React.useState<Bid[]>([]);

    React.useEffect(() => {
        const localBids = JSON.parse(localStorage.getItem('mmo_mock_bids') || '[]');
        setAllBids([...BIDS_DATA, ...localBids]);
    }, []);

    const myBids = allBids.filter(bid =>
        currentVendor &&
        bid.vendorId === currentVendor.id
    );

    const getStatusStyle = (status: BidStatus) => {
        switch (status) {
            case BidStatus.ACCEPTED: return 'bg-green-100 text-green-800';
            case BidStatus.REJECTED: return 'bg-red-100 text-red-800';
            case BidStatus.SHORTLISTED: return 'bg-blue-100 text-blue-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getRFQDetails = (rfqId: string) => {
        return RFQS.find(r => r.id === rfqId);
    };

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-3xl font-serif font-bold text-text-primary">My Bids</h1>

            {myBids.length === 0 ? (
                <div className="bg-surface border border-border rounded-xl p-8 text-center text-text-secondary">
                    <DocumentTextIcon className="w-12 h-12 mx-auto mb-4 text-text-secondary/50" />
                    <p>No bids submitted yet.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border text-xs uppercase tracking-wider text-text-secondary">
                                <th className="p-4 font-bold">RFQ / Project</th>
                                <th className="p-4 font-bold">Submitted Details</th>
                                <th className="p-4 font-bold text-right">Quote Amount</th>
                                <th className="p-4 font-bold text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {myBids.map(bid => {
                                const rfq = getRFQDetails(bid.rfqId);
                                return (
                                    <tr key={bid.id} className="hover:bg-background transition-colors">
                                        <td className="p-4">
                                            <div className="font-bold text-text-primary">{rfq?.projectName || 'Unknown Project'}</div>
                                            <div className="text-xs text-text-secondary">{rfq?.rfqNumber}</div>
                                        </td>
                                        <td className="p-4 text-sm text-text-secondary">
                                            <div>Date: {new Date(bid.submittedDate).toLocaleDateString()}</div>
                                            <div>Validity: {new Date(bid.validityDate).toLocaleDateString()}</div>
                                        </td>
                                        <td className="p-4 text-right font-mono font-bold text-text-primary">
                                            {formatCurrencyINR(bid.totalAmount)}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`px-3 py-1 text-[10px] uppercase font-bold rounded-full ${getStatusStyle(bid.status)}`}>
                                                {bid.status}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default MyBids;
