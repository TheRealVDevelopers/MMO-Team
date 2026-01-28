import React from 'react';
import { CheckCircleIcon, XCircleIcon, ClockIcon, CurrencyRupeeIcon } from '@heroicons/react/24/outline';
import { formatCurrencyINR } from '../../../constants';
import { PaymentRequest } from '../../../types';

interface PaymentVerificationInboxProps {
    requests: PaymentRequest[];
    onVerify: (requestId: string) => void;
    onReject: (requestId: string) => void;
}

const PaymentVerificationInbox: React.FC<PaymentVerificationInboxProps> = ({ requests, onVerify, onReject }) => {

    if (requests.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-gray-200">
                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-400">
                    <CheckCircleIcon className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">All Caught Up!</h3>
                <p className="text-sm text-gray-500">No pending payment verifications.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {requests.map(request => (
                <div key={request.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex gap-4">
                            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100">
                                <CurrencyRupeeIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900">{request.clientName}</h4>
                                <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                    <ClockIcon className="w-3 h-3" />
                                    Submitted at {new Date(request.submittedAt).toLocaleString()}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xl font-black text-emerald-600">{formatCurrencyINR(request.amount)}</p>
                            <span className="inline-block px-2 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] font-bold uppercase tracking-wider rounded-md mt-1">
                                {request.status} Needed
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-5 p-4 bg-gray-50 rounded-xl text-sm border border-gray-100">
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Payment Method</p>
                            <p className="font-medium text-gray-800">{request.paymentMethod}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">UTR / Ref Number</p>
                            <p className="font-mono font-medium text-gray-800">{request.utrNumber || 'N/A'}</p>
                        </div>
                        <div className="col-span-2">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Notes</p>
                            <p className="font-medium text-gray-800 italic">{request.notes || "No notes provided."}</p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => onVerify(request.id)}
                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200/50"
                        >
                            <CheckCircleIcon className="w-5 h-5" />
                            Confirm Receipt
                        </button>
                        <button
                            onClick={() => onReject(request.id)}
                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border border-red-100 text-red-600 rounded-xl font-bold hover:bg-red-50 transition-all"
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

export default PaymentVerificationInbox;
