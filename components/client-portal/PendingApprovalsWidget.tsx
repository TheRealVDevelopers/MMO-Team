import React, { useState } from 'react';
import { CheckCircleIcon, XCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { ClientRequest } from './types';

interface PendingApprovalsWidgetProps {
    requests: ClientRequest[];
    onApprove: (requestId: string) => void;
    onReject: (requestId: string, reason: string) => void;
}

const PendingApprovalsWidget: React.FC<PendingApprovalsWidgetProps> = ({ requests, onApprove, onReject }) => {
    const pendingRequests = requests.filter(r => r.status === 'open');
    const [rejectingId, setRejectingId] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState('');

    if (pendingRequests.length === 0) return null;

    const handleRejectClick = (id: string) => {
        setRejectingId(id);
        setRejectReason('');
    };

    const submitReject = (id: string) => {
        if (!rejectReason.trim()) return;
        onReject(id, rejectReason);
        setRejectingId(null);
    };

    return (
        <div className="bg-white rounded-[2rem] shadow-sm border border-orange-100 p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-orange-400"></div>
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                    <ExclamationCircleIcon className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Action Required</h3>
                    <p className="text-xs text-orange-600 font-bold uppercase tracking-wider">{pendingRequests.length} Pending Items</p>
                </div>
            </div>

            <div className="space-y-4">
                {pendingRequests.map(req => (
                    <div key={req.id} className="bg-orange-50/50 rounded-xl p-4 border border-orange-100">
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-gray-900 text-sm">{req.title}</h4>
                            <span className="text-[10px] font-bold bg-white text-orange-600 px-2 py-0.5 rounded-full border border-orange-100 uppercase">
                                {req.type}
                            </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">{req.description}</p>

                        {rejectingId === req.id ? (
                            <div className="mt-3 bg-white p-3 rounded-lg border border-gray-200">
                                <label className="block text-xs font-bold text-gray-500 mb-1">Reason for Rejection / Changes</label>
                                <textarea
                                    className="w-full text-sm border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-orange-500 outline-none mb-2"
                                    rows={2}
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    placeholder="Please describe what changes are needed..."
                                ></textarea>
                                <div className="flex gap-2 justify-end">
                                    <button
                                        onClick={() => setRejectingId(null)}
                                        className="text-xs font-bold text-gray-500 px-3 py-1.5 hover:bg-gray-100 rounded-lg"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => submitReject(req.id)}
                                        className="text-xs font-bold text-white bg-red-500 px-3 py-1.5 rounded-lg hover:bg-red-600 shadow-lg shadow-red-500/20"
                                    >
                                        Submit
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => onApprove(req.id)}
                                    className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 text-white py-2 rounded-lg text-sm font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                                >
                                    <CheckCircleIcon className="w-5 h-5" />
                                    Approve
                                </button>
                                <button
                                    onClick={() => handleRejectClick(req.id)}
                                    className="flex-1 flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-200 py-2 rounded-lg text-sm font-bold hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all"
                                >
                                    <XCircleIcon className="w-5 h-5" />
                                    Changes
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PendingApprovalsWidget;
