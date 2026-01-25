import React, { useState } from 'react';
import { BanknotesIcon, DocumentArrowUpIcon } from '@heroicons/react/24/outline';
import { Lead } from '../../../types';

interface PaymentVerificationRequestProps {
    lead: Lead;
    onSubmit: (data: any) => void;
    onCancel: () => void;
}

const PaymentVerificationRequest: React.FC<PaymentVerificationRequestProps> = ({ lead, onSubmit, onCancel }) => {
    const [amount, setAmount] = useState<string>('');
    const [paymentMode, setPaymentMode] = useState('Net Banking');
    const [transactionId, setTransactionId] = useState('');
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            leadId: lead.id,
            clientName: lead.clientName,
            amount: Number(amount),
            paymentMode,
            transactionId,
            paymentDate: new Date(paymentDate),
            notes,
            status: 'Pending',
            requestedAt: new Date(),
            requestedBy: 'Current User' // Replace with actual user context
        });
    };

    return (
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        <BanknotesIcon className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold">Verify Payment</h3>
                </div>
                <p className="text-emerald-100 text-sm">Request accounts team to verify authorized payment.</p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Client</label>
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 font-bold text-gray-700">
                        {lead.clientName}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Amount</label>
                        <div className="relative">
                            <span className="absolute left-3 top-3 text-gray-400 font-bold">₹</span>
                            <input
                                type="number"
                                required
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                className="w-full pl-8 p-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none font-bold"
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Date</label>
                        <input
                            type="date"
                            required
                            value={paymentDate}
                            onChange={e => setPaymentDate(e.target.value)}
                            className="w-full p-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none text-sm"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Payment Mode</label>
                    <select
                        value={paymentMode}
                        onChange={e => setPaymentMode(e.target.value)}
                        className="w-full p-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none bg-white"
                    >
                        <option>Net Banking</option>
                        <option>UPI</option>
                        <option>Cheque</option>
                        <option>Credit Card</option>
                        <option>Cash</option>
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Transaction ID / Cheque No.</label>
                    <input
                        type="text"
                        required
                        value={transactionId}
                        onChange={e => setTransactionId(e.target.value)}
                        className="w-full p-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none font-mono text-sm"
                        placeholder="e.g. UTR12345678"
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Notes (Optional)</label>
                    <textarea
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        rows={2}
                        className="w-full p-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none text-sm"
                        placeholder="Any additional details..."
                    />
                </div>

                <div className="flex items-center gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="flex-1 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all transform active:scale-95"
                    >
                        Submit Request
                    </button>
                </div>
            </form>
        </div>
    );
};

export default PaymentVerificationRequest;
