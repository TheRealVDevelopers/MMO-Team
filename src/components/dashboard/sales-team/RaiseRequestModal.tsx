
import React, { useState } from 'react';
// Request Modal
import { useAuth } from '../../../context/AuthContext';
import { ApprovalRequestType, UserRole, ExecutionStage } from '../../../types';
import { useApprovals } from '../../../hooks/useApprovalSystem';
import { XMarkIcon } from '../../icons/IconComponents';
import { PrimaryButton, SecondaryButton } from '../shared/DashboardUI';
import SmartDateTimePicker from '../../shared/SmartDateTimePicker';

import Modal from '../../shared/Modal';

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
    { label: 'Reschedule Site Visit', value: ApprovalRequestType.RESCHEDULE_SITE_VISIT },
    { label: 'Start Drawing', value: ApprovalRequestType.START_DRAWING },
    { label: 'Design Change', value: ApprovalRequestType.DESIGN_CHANGE },
    { label: 'Drawing Revisions', value: ApprovalRequestType.DRAWING_REVISIONS },
    { label: 'Material Change', value: ApprovalRequestType.MATERIAL_CHANGE },
    { label: 'Payment Query', value: ApprovalRequestType.PAYMENT_QUERY },
    { label: 'Clarification', value: ApprovalRequestType.CLARIFICATION },
    { label: 'Modification', value: ApprovalRequestType.MODIFICATION },
    { label: 'Request for Quotation', value: ApprovalRequestType.REQUEST_FOR_QUOTATION },
    { label: 'Execution Request', value: ApprovalRequestType.EXECUTION_TOKEN },
    { label: 'Procurement Request', value: ApprovalRequestType.PROCUREMENT_TOKEN },
    { label: 'Negotiation', value: ApprovalRequestType.NEGOTIATION },
    { label: 'Other', value: ApprovalRequestType.OTHER },
];

// Mapping request types to the role that should be assigned
const REQUEST_TYPE_TO_ROLE: Partial<Record<ApprovalRequestType, UserRole>> = {
    [ApprovalRequestType.SITE_VISIT]: UserRole.SITE_ENGINEER,
    [ApprovalRequestType.RESCHEDULE_SITE_VISIT]: UserRole.SITE_ENGINEER,
    [ApprovalRequestType.START_DRAWING]: UserRole.DRAWING_TEAM,
    [ApprovalRequestType.DESIGN_CHANGE]: UserRole.DRAWING_TEAM,
    [ApprovalRequestType.DRAWING_REVISIONS]: UserRole.DRAWING_TEAM,
    [ApprovalRequestType.MATERIAL_CHANGE]: UserRole.QUOTATION_TEAM,
    [ApprovalRequestType.PAYMENT_QUERY]: UserRole.ACCOUNTS_TEAM,
    [ApprovalRequestType.REQUEST_FOR_QUOTATION]: UserRole.PROCUREMENT_TEAM,
    [ApprovalRequestType.NEGOTIATION]: UserRole.PROCUREMENT_TEAM,
    [ApprovalRequestType.MODIFICATION]: UserRole.EXECUTION_TEAM,
    [ApprovalRequestType.EXECUTION_TOKEN]: UserRole.EXECUTION_TEAM,
    [ApprovalRequestType.PROCUREMENT_TOKEN]: UserRole.PROCUREMENT_TEAM,
    [ApprovalRequestType.OTHER]: UserRole.SUPER_ADMIN,
};

const URGENCY_LEVELS = ['Low', 'Medium', 'High'];

const RaiseRequestModal: React.FC<RaiseRequestModalProps> = ({ isOpen, onClose, projectId, clientId, clientName, leadId }) => {
    const { currentUser } = useAuth();
    const { submitRequest, loading } = useApprovals();

    const [requestType, setRequestType] = useState<ApprovalRequestType>(ApprovalRequestType.SITE_VISIT);
    const [description, setDescription] = useState('');
    const [preferredDateTime, setPreferredDateTime] = useState('');
    const [urgency, setUrgency] = useState<'Low' | 'Medium' | 'High'>('Medium');
    const [stages, setStages] = useState<ExecutionStage[]>([]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;

        try {
            await submitRequest({
                requestType,
                title: `${requestType} for ${clientName || 'Client'}`,
                description: description, // Keep description clean for pre-filling in approval
                priority: urgency,
                contextId: leadId || projectId,
                clientName: clientName,
                endDate: preferredDateTime ? new Date(preferredDateTime) : undefined,
                // These are workflow fields we rely on
                requesterId: currentUser.id,
                requesterName: currentUser.name,
                requesterRole: currentUser.role,
                // Map request type to the role that should handle it
                targetRole: REQUEST_TYPE_TO_ROLE[requestType] || UserRole.SUPER_ADMIN,
                ...(requestType === ApprovalRequestType.EXECUTION_TOKEN ? { stages } : {}),
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

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Raise Work Request"
            size="lg"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
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

                {/* Stage Builder for Execution Requests */}
                {requestType === ApprovalRequestType.EXECUTION_TOKEN && (
                    <div className="space-y-3 bg-subtle-background/50 p-4 rounded-xl border border-border/50">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-bold text-text-secondary">Execution Stages</label>
                            <button
                                type="button"
                                onClick={() => {
                                    setStages(prev => [...prev, {
                                        id: Date.now().toString(),
                                        name: `Stage ${prev.length + 1}`,
                                        deadline: null as any, // Placeholder
                                        status: 'Pending'
                                    }]);
                                }}
                                className="text-xs font-black uppercase tracking-wider text-primary hover:text-secondary"
                            >
                                + Add Stage
                            </button>
                        </div>

                        {stages.map((stage, idx) => (
                            <div key={stage.id} className="flex gap-2 items-start">
                                <div className="flex-1 space-y-2">
                                    <input
                                        type="text"
                                        value={stage.name}
                                        onChange={(e) => {
                                            const newStages = [...stages];
                                            newStages[idx].name = e.target.value;
                                            setStages(newStages);
                                        }}
                                        placeholder="Stage Name (e.g. Flooring)"
                                        className="w-full rounded-lg border-border bg-surface text-xs py-1.5"
                                    />
                                    <input
                                        type="date"
                                        onChange={(e) => {
                                            const newStages = [...stages];
                                            newStages[idx].deadline = new Date(e.target.value);
                                            setStages(newStages);
                                        }}
                                        className="w-full rounded-lg border-border bg-surface text-xs py-1.5"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setStages(stages.filter(s => s.id !== stage.id))}
                                    className="p-1.5 text-text-tertiary hover:text-error"
                                >
                                    <XMarkIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                        {stages.length === 0 && (
                            <p className="text-xs text-text-tertiary italic text-center py-2">No stages defined. Add at least one.</p>
                        )}
                    </div>
                )}

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
        </Modal>
    );
};

export default RaiseRequestModal;
