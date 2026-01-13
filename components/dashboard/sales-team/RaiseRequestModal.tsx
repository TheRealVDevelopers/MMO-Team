
import React, { useState } from 'react';
// Request Modal
import { useAuth } from '../../../context/AuthContext';
import { ApprovalRequestType, UserRole } from '../../../types';
import { useApprovals } from '../../../hooks/useApprovalSystem';
import { XMarkIcon } from '../../icons/IconComponents';
import { PrimaryButton, SecondaryButton } from '../shared/DashboardUI';
import SmartDateTimePicker from '../../shared/SmartDateTimePicker';

interface RaiseRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId?: string;
    clientId?: string;
    clientName?: string;
    leadId?: string; // Optional: if raising from a lead view
}

const REQUEST_TYPES = [
    { label: 'Site Visit', value: ApprovalRequestType.SITE_VISIT },
    { label: 'Design Change', value: ApprovalRequestType.DESIGN_CHANGE },
    { label: 'Material Change', value: ApprovalRequestType.MATERIAL_CHANGE },
    { label: 'Payment Query', value: ApprovalRequestType.PAYMENT_QUERY },
    { label: 'Clarification', value: ApprovalRequestType.CLARIFICATION },
    { label: 'Modification', value: ApprovalRequestType.MODIFICATION },
    { label: 'Proposal Request', value: ApprovalRequestType.PROPOSAL_REQUEST },
    { label: 'Other', value: ApprovalRequestType.OTHER },
];

// Mapping request types to the role that should be assigned
const REQUEST_TYPE_TO_ROLE: Partial<Record<ApprovalRequestType, UserRole>> = {
    [ApprovalRequestType.SITE_VISIT]: UserRole.SITE_ENGINEER,
    [ApprovalRequestType.DESIGN_CHANGE]: UserRole.DRAWING_TEAM,
    [ApprovalRequestType.MATERIAL_CHANGE]: UserRole.PROCUREMENT_TEAM,
    [ApprovalRequestType.PAYMENT_QUERY]: UserRole.ACCOUNTS_TEAM,
    [ApprovalRequestType.PROPOSAL_REQUEST]: UserRole.QUOTATION_TEAM,
    [ApprovalRequestType.MODIFICATION]: UserRole.EXECUTION_TEAM,
};

const URGENCY_LEVELS = ['Low', 'Medium', 'High'];

const RaiseRequestModal: React.FC<RaiseRequestModalProps> = ({ isOpen, onClose, projectId, clientId, clientName, leadId }) => {
    const { currentUser } = useAuth();
    const { submitRequest, loading } = useApprovals();

    const [requestType, setRequestType] = useState<ApprovalRequestType>(ApprovalRequestType.SITE_VISIT);
    const [description, setDescription] = useState('');
    const [preferredDateTime, setPreferredDateTime] = useState('');
    const [urgency, setUrgency] = useState<'Low' | 'Medium' | 'High'>('Medium');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;

        try {
            // Context Description to append to the main description
            const contextInfo = `\n\n-- Context --\nClient: ${clientName || 'N/A'}\nProject ID: ${projectId || 'N/A'}\nLead ID: ${leadId || 'N/A'}\nPreferred Date/Time: ${preferredDateTime}`;

            await submitRequest({
                requestType,
                title: `${requestType} for ${clientName || 'Client'}`,
                description: description + contextInfo,
                priority: urgency,
                contextId: leadId || projectId, // Favor Lead ID for history logging
                // These are workflow fields we rely on
                requesterId: currentUser.id,
                requesterName: currentUser.name,
                requesterRole: currentUser.role,
                // Map request type to the role that should handle it
                targetRole: REQUEST_TYPE_TO_ROLE[requestType],
            });

            onClose();
            // Reset form
            setDescription('');
            setPreferredDateTime('');
            setUrgency('Medium');
        } catch (error) {
            console.error("Failed to submit request", error);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 z-[100] transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

                <div className="inline-block align-bottom bg-surface rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full relative z-[101]">
                    <div className="px-6 py-5 border-b border-border flex justify-between items-center">
                        <h3 className="text-xl font-serif font-black text-text-primary">Raise Work Request</h3>
                        <button onClick={onClose} className="text-text-tertiary hover:text-text-primary transition-colors">
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">

                        {/* Pre-filled Info Alert */}
                        <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-sm text-primary-dark">
                            <p className="font-bold">Client: {clientName || 'Not selected'}</p>
                            <p className="text-xs opacity-80 mt-1">Request will be routed to Sales Manager & Admin.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-text-secondary mb-1">Request Type</label>
                            <select
                                value={requestType}
                                onChange={(e) => setRequestType(e.target.value as ApprovalRequestType)}
                                className="w-full rounded-xl border-border bg-subtle-background focus:ring-primary focus:border-primary text-sm py-2"
                            >
                                {REQUEST_TYPES.map(type => (
                                    <option key={type.value} value={type.value}>{type.label}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-text-secondary mb-1">Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={4}
                                placeholder="Describe what the client wants..."
                                className="w-full rounded-xl border-border bg-subtle-background focus:ring-primary focus:border-primary text-sm py-2"
                                required
                            />
                        </div>

                        <div>
                            <SmartDateTimePicker
                                label="Preferred Date & Time"
                                value={preferredDateTime}
                                onChange={setPreferredDateTime}
                                variant="compact"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-text-secondary mb-1">Urgency</label>
                            <div className="flex gap-4">
                                {URGENCY_LEVELS.map(level => (
                                    <label key={level} className="flex items-center cursor-pointer">
                                        <input
                                            type="radio"
                                            name="urgency"
                                            value={level}
                                            checked={urgency === level}
                                            onChange={() => setUrgency(level as any)}
                                            className="focus:ring-primary text-primary border-gray-300"
                                        />
                                        <span className={`ml-2 text-sm font-medium ${level === 'High' ? 'text-error' : level === 'Medium' ? 'text-warning' : 'text-success'
                                            }`}>{level}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <SecondaryButton onClick={onClose} type="button">Cancel</SecondaryButton>
                            <PrimaryButton type="submit" disabled={loading}>
                                {loading ? 'Submitting...' : 'Submit Request'}
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default RaiseRequestModal;
