
import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { RFQS } from '../../../constants';
import { RFQStatus, RFQ } from '../../../types';
import { formatCurrencyINR } from '../../../constants';
import { ClipboardDocumentListIcon, ClockIcon } from '@heroicons/react/24/outline';

const ActiveRFQs: React.FC = () => {
    const { currentVendor } = useAuth();
    const [selectedRFQ, setSelectedRFQ] = useState<RFQ | null>(null);

    // Filter RFQs where the current vendor is invited and status is OPEN
    const myRFQs = RFQS.filter(rfq =>
        rfq.status === RFQStatus.OPEN &&
        currentVendor &&
        rfq.invitedVendorIds.includes(currentVendor.id)
    );

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-3xl font-serif font-bold text-text-primary">Active RFQs</h1>

            {myRFQs.length === 0 ? (
                <div className="bg-surface border border-border rounded-xl p-8 text-center text-text-secondary">
                    <ClipboardDocumentListIcon className="w-12 h-12 mx-auto mb-4 text-text-secondary/50" />
                    <p>No active RFQ invitations found.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {myRFQs.map(rfq => (
                        <div key={rfq.id} className="bg-surface border border-border rounded-xl p-6 hover:shadow-lg transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-xl font-bold text-text-primary">{rfq.projectName}</h3>
                                    <p className="text-sm text-text-secondary font-mono">{rfq.rfqNumber}</p>
                                </div>
                                <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full uppercase tracking-wider">
                                    {rfq.status}
                                </span>
                            </div>

                            <div className="flex items-center space-x-6 text-sm text-text-secondary mb-6">
                                <div className="flex items-center">
                                    <ClockIcon className="w-4 h-4 mr-2" />
                                    Deadline: {new Date(rfq.deadline).toLocaleDateString()}
                                </div>
                                <div>
                                    Items: <span className="font-bold text-text-primary">{rfq.items.length}</span>
                                </div>
                            </div>

                            <div className="space-y-3 mb-6">
                                {rfq.items.slice(0, 2).map(item => (
                                    <div key={item.id} className="flex justify-between items-center text-sm p-2 bg-background rounded-lg border border-border/50">
                                        <span>{item.name} <span className="text-text-secondary">({item.quantity} {item.unit})</span></span>
                                        {item.targetPrice && <span className="text-text-secondary">Target: {formatCurrencyINR(item.targetPrice)}</span>}
                                    </div>
                                ))}
                                {rfq.items.length > 2 && (
                                    <p className="text-xs text-text-secondary italic">+ {rfq.items.length - 2} more items</p>
                                )}
                            </div>

                            <div className="flex justify-end">
                                <button
                                    onClick={() => setSelectedRFQ(rfq)}
                                    className="px-6 py-2 bg-primary text-white text-sm font-bold uppercase tracking-wider rounded-lg hover:bg-secondary transition-colors"
                                >
                                    Submit Quote
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ActiveRFQs;
