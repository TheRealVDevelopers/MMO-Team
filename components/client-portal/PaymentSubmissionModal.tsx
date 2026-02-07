import React, { useState } from 'react';
import Modal from '../shared/Modal'; // Assuming shared Modal exists
import { CloudArrowUpIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface PaymentSubmissionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: { method: 'UTR' | 'Screenshot'; value: string; amount: number; file?: File }) => void;
    amount: number;
    milestoneName: string;
}

const PaymentSubmissionModal: React.FC<PaymentSubmissionModalProps> = ({ isOpen, onClose, onSubmit, amount, milestoneName }) => {
    const [activeTab, setActiveTab] = useState<'UTR' | 'Screenshot'>('UTR');
    const [utrNumber, setUtrNumber] = useState('');
    const [screenshot, setScreenshot] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        // Simulate upload/network delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        if (activeTab === 'UTR') {
            if (!utrNumber) return;
            onSubmit({ method: 'UTR', value: utrNumber, amount });
        } else {
            if (!screenshot) return;
            // Pass the file object so parent can upload it
            onSubmit({ method: 'Screenshot', value: '', amount, file: screenshot });
        }
        setIsSubmitting(false);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Pay for ${milestoneName}`}>
            <div className="p-4 space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg flex justify-between items-center">
                    <span className="text-blue-900 font-medium">Amount to Pay</span>
                    <span className="text-2xl font-bold text-blue-700">₹{amount.toLocaleString()}</span>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200">
                    <button
                        className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'UTR' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        onClick={() => setActiveTab('UTR')}
                    >
                        Enter UTR Number
                    </button>
                    <button
                        className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'Screenshot' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        onClick={() => setActiveTab('Screenshot')}
                    >
                        Upload Screenshot
                    </button>
                </div>

                <div className="min-h-[200px] py-4">
                    {activeTab === 'UTR' ? (
                        <div className="space-y-4">
                            <label className="block text-sm font-medium text-gray-700">Bank UTR / Ref Number</label>
                            <input
                                type="text"
                                placeholder="e.g. 30281938291..."
                                value={utrNumber}
                                onChange={(e) => setUtrNumber(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                            />
                            <p className="text-xs text-gray-500">
                                Please enter the Unique Transaction Reference (UTR) number provided by your bank after the transfer.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
                                <input
                                    type="file"
                                    accept="image/*,application/pdf"
                                    onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                                {screenshot ? (
                                    <div className="flex flex-col items-center">
                                        <CheckCircleIcon className="w-12 h-12 text-emerald-500 mb-2" />
                                        <p className="font-medium text-gray-900">{screenshot.name}</p>
                                        <p className="text-sm text-gray-500">{(screenshot.size / 1024).toFixed(1)} KB</p>
                                        <button className="text-xs text-red-500 mt-2 hover:underline" onClick={(e) => { e.stopPropagation(); setScreenshot(null); }}>Remove</button>
                                    </div>
                                ) : (
                                    <>
                                        <CloudArrowUpIcon className="w-12 h-12 text-gray-400 mb-2" />
                                        <p className="font-medium text-gray-900">Click to Upload Payment Screenshot</p>
                                        <p className="text-xs text-gray-500 mt-1">PNG, JPG or PDF accepted</p>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <button
                    disabled={isSubmitting || (activeTab === 'UTR' ? !utrNumber : !screenshot)}
                    onClick={handleSubmit}
                    className="w-full bg-primary text-white font-bold py-3.5 rounded-xl hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/20"
                >
                    {isSubmitting ? 'Submitting...' : 'Submit Payment Details'}
                </button>
            </div>
        </Modal>
    );
};

export default PaymentSubmissionModal;
