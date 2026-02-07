import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useApprovals } from '../../../hooks/useApprovals';
import { ApprovalRequest } from '../../../types';
import { CheckCircleIcon, XCircleIcon, ClockIcon, CurrencyRupeeIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { formatCurrencyINR, formatDate, formatDateTime } from '../../../constants';

const ApprovalInbox: React.FC = () => {
    const { currentUser } = useAuth();
    const { pendingApprovals, loading, approveRequest, rejectRequest } = useApprovals(currentUser?.role);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const handleApprove = async (request: ApprovalRequest) => {
        if (!confirm("Are you sure you want to approve this request?")) return;
        setProcessingId(request.id);
        try {
            await approveRequest(request);
            alert("Approved successfully!");
        } catch (err: any) {
            alert("Error: " + err.message);
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (request: ApprovalRequest) => {
        const reason = prompt("Enter rejection reason:");
        if (!reason) return;

        setProcessingId(request.id);
        try {
            await rejectRequest(request, reason);
            alert("Rejected successfully.");
        } catch (err: any) {
            alert("Error: " + err.message);
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) return <div className="p-4">Loading approvals...</div>;

    if (pendingApprovals.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-gray-200">
                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-400">
                    <CheckCircleIcon className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">All Caught Up!</h3>
                <p className="text-sm text-gray-500">No pending approvals for your role.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {pendingApprovals.map(request => (
                <div key={request.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${request.type === 'PAYMENT' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                    request.type === 'EXPENSE' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                        'bg-blue-50 text-blue-600 border-blue-100'
                                }`}>
                                {request.type === 'PAYMENT' ? <CurrencyRupeeIcon className="w-6 h-6" /> : <DocumentTextIcon className="w-6 h-6" />}
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900">{request.type} REQUEST</h4>
                                <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                    <ClockIcon className="w-3 h-3" />
                                    {formatDateTime(request.requestedAt)}
                                </p>
                                <p className="text-xs text-gray-400">Case ID: {request.caseId}</p>
                            </div>
                        </div>

                        {(request.payload.amount) && (
                            <div className="text-right">
                                <p className="text-xl font-black text-gray-900">{formatCurrencyINR(request.payload.amount)}</p>
                            </div>
                        )}
                    </div>

                    <div className="bg-gray-50 p-3 rounded-xl mb-4 text-sm text-gray-700">
                        {request.payload.notes && <p className="italic">"{request.payload.notes}"</p>}
                        {/* Add more payload details here based on type if needed */}
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => handleApprove(request)}
                            disabled={!!processingId}
                            className="flex-1 flex items-center justify-center gap-2 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 disabled:opacity-50"
                        >
                            <CheckCircleIcon className="w-5 h-5" />
                            {processingId === request.id ? 'Processing...' : 'Approve'}
                        </button>
                        <button
                            onClick={() => handleReject(request)}
                            disabled={!!processingId}
                            className="flex-1 flex items-center justify-center gap-2 py-2 bg-white border border-red-200 text-red-600 rounded-lg font-bold hover:bg-red-50 disabled:opacity-50"
                        >
                            <XCircleIcon className="w-5 h-5" />
                            Reject
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ApprovalInbox;
