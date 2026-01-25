import React, { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
    XMarkIcon,
    BanknotesIcon,
    PencilSquareIcon,
    CalendarIcon,
    PhoneIcon,
    EnvelopeIcon,
    UserCircleIcon,
    ClockIcon,
    MapPinIcon
} from '@heroicons/react/24/outline';
import { Lead, LeadPipelineStatus } from '../../../types';
import { formatCurrencyINR, formatDateTime } from '../../../constants';
import PaymentVerificationRequest from '../sales-team/PaymentVerificationRequest';

interface LeadDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    lead: Lead;
    onUpdate: (lead: Lead) => void;
}

const LeadDetailModal: React.FC<LeadDetailModalProps> = ({ isOpen, onClose, lead, onUpdate }) => {
    const [isPaymentRequestOpen, setIsPaymentRequestOpen] = useState(false);

    if (!lead) return null;

    const handlePaymentSubmit = (data: any) => {
        // In a real app, this would make an API call to save the request
        console.log('Payment Verification Requested:', data);

        // Add to lead history locally for demo
        const updatedLead = {
            ...lead,
            history: [
                ...lead.history,
                {
                    action: 'Payment Verification Requested',
                    user: 'Current User',
                    timestamp: new Date(),
                    notes: `Amount: ${formatCurrencyINR(data.amount)} via ${data.paymentMode}`
                }
            ]
        };
        onUpdate(updatedLead);
        setIsPaymentRequestOpen(false);
        // showToast('Verification request sent to Accounts team');
    };

    return (
        <Transition show={isOpen} as={React.Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={React.Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={React.Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all">
                                <div className="relative">
                                    {/* Header */}
                                    <div className="bg-gray-50 border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-bold text-xl">
                                                {lead.clientName.charAt(0)}
                                            </div>
                                            <div>
                                                <Dialog.Title as="h3" className="text-lg font-bold leading-6 text-gray-900">
                                                    {lead.projectName}
                                                </Dialog.Title>
                                                <p className="text-sm text-gray-500">{lead.clientName}</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            className="text-gray-400 hover:text-gray-500"
                                            onClick={onClose}
                                        >
                                            <span className="sr-only">Close</span>
                                            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                                        </button>
                                    </div>

                                    <div className="px-6 py-6 max-h-[70vh] overflow-y-auto">
                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                            {/* LEFT COLUMN: Details */}
                                            <div className="lg:col-span-2 space-y-8">

                                                {/* Quick Stats */}
                                                <div className="flex flex-wrap gap-4">
                                                    <div className="px-4 py-2 bg-gray-50 rounded-lg border border-gray-100">
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Value</p>
                                                        <p className="text-lg font-bold text-gray-900">{formatCurrencyINR(lead.value)}</p>
                                                    </div>
                                                    <div className="px-4 py-2 bg-gray-50 rounded-lg border border-gray-100">
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</p>
                                                        <p className="text-sm font-bold text-primary">{lead.status}</p>
                                                    </div>
                                                    <div className="px-4 py-2 bg-gray-50 rounded-lg border border-gray-100">
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sales Owner</p>
                                                        <p className="text-sm font-bold text-gray-700">{lead.assignedTo || 'Unassigned'}</p>
                                                    </div>
                                                </div>

                                                {/* Client Info */}
                                                <div>
                                                    <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Contact Information</h4>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                                                            <PhoneIcon className="w-5 h-5 text-gray-400" />
                                                            <div>
                                                                <p className="text-xs text-text-tertiary">Mobile</p>
                                                                <p className="font-medium text-text-primary">{lead.clientMobile}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                                                            <EnvelopeIcon className="w-5 h-5 text-gray-400" />
                                                            <div>
                                                                <p className="text-xs text-text-tertiary">Email</p>
                                                                <p className="font-medium text-text-primary">{lead.clientEmail}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* History Timeline */}
                                                <div>
                                                    <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Activity History</h4>
                                                    <div className="space-y-4">
                                                        {lead.history?.slice().reverse().map((item, idx) => (
                                                            <div key={idx} className="flex gap-3">
                                                                <div className="flex flex-col items-center">
                                                                    <div className="w-2 h-2 rounded-full bg-gray-300 mt-1.5" />
                                                                    {idx !== lead.history.length - 1 && <div className="w-0.5 flex-1 bg-gray-100 my-1" />}
                                                                </div>
                                                                <div className="pb-4">
                                                                    <p className="text-sm font-bold text-gray-800">{item.action}</p>
                                                                    <p className="text-xs text-gray-500">{formatDateTime(item.timestamp)} • {item.user}</p>
                                                                    {item.notes && <p className="text-xs text-gray-600 mt-1 bg-gray-50 p-2 rounded">{item.notes}</p>}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* RIGHT COLUMN: Actions */}
                                            <div className="space-y-4">
                                                <button
                                                    onClick={() => setIsPaymentRequestOpen(true)}
                                                    className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
                                                >
                                                    <BanknotesIcon className="w-5 h-5" />
                                                    Verify Payment
                                                </button>

                                                <button className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all">
                                                    <CalendarIcon className="w-5 h-5" />
                                                    Schedule Visit
                                                </button>

                                                <button className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all">
                                                    <PencilSquareIcon className="w-5 h-5" />
                                                    Edit Details
                                                </button>

                                                {/* Status Changer */}
                                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 mt-6">
                                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                                        Pipeline Stage
                                                    </label>
                                                    <select
                                                        value={lead.status}
                                                        onChange={(e) => onUpdate({ ...lead, status: e.target.value as LeadPipelineStatus })}
                                                        className="w-full p-2 rounded-lg border border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                    >
                                                        {Object.values(LeadPipelineStatus).map(status => (
                                                            <option key={status} value={status}>{status}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Modals */}
                                    <Transition show={isPaymentRequestOpen} as={React.Fragment}>
                                        <Dialog as="div" className="relative z-[60]" onClose={() => setIsPaymentRequestOpen(false)}>
                                            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
                                            <div className="fixed inset-0 flex items-center justify-center p-4">
                                                <Dialog.Panel>
                                                    <PaymentVerificationRequest
                                                        lead={lead}
                                                        onSubmit={handlePaymentSubmit}
                                                        onCancel={() => setIsPaymentRequestOpen(false)}
                                                    />
                                                </Dialog.Panel>
                                            </div>
                                        </Dialog>
                                    </Transition>

                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

export default LeadDetailModal;
