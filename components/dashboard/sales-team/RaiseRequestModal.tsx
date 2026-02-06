
import React, { useState } from 'react';
// Request Modal
import { useAuth } from '../../../context/AuthContext';
import { TaskType, UserRole, TaskStatus } from '../../../types';
import { useCaseTasks } from '../../../hooks/useCaseTasks';
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
    { label: 'Site Visit', value: TaskType.SITE_VISIT, targetRole: UserRole.SITE_ENGINEER },
    { label: 'Drawing Task', value: TaskType.DRAWING_TASK, targetRole: UserRole.DRAWING_TEAM },
    { label: 'BOQ Task', value: TaskType.BOQ, targetRole: UserRole.QUOTATION_TEAM },
    { label: 'Quotation Task', value: TaskType.QUOTATION_TASK, targetRole: UserRole.QUOTATION_TEAM },
    { label: 'Procurement Audit', value: TaskType.PROCUREMENT_AUDIT, targetRole: UserRole.PROCUREMENT_TEAM },
    { label: 'Execution Task', value: TaskType.EXECUTION_TASK, targetRole: UserRole.EXECUTION_TEAM },
];

const URGENCY_LEVELS = ['Low', 'Medium', 'High'];

const RaiseRequestModal: React.FC<RaiseRequestModalProps> = ({ isOpen, onClose, projectId, clientId, clientName, leadId }) => {
    const { currentUser } = useAuth();
    const { createTask, loading } = useCaseTasks({});

    const [requestType, setRequestType] = useState<TaskType>(TaskType.SITE_VISIT);
    const [description, setDescription] = useState('');
    const [preferredDateTime, setPreferredDateTime] = useState('');
    const [urgency, setUrgency] = useState<'Low' | 'Medium' | 'High'>('Medium');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const caseId = leadId || projectId;
        if (!currentUser || !caseId) {
            alert('Missing required information. Please try again.');
            return;
        }

        setSubmitting(true);
        try {
            await createTask({
                caseId: caseId,
                type: requestType,
                status: TaskStatus.PENDING,
                notes: description || `${requestType} for ${clientName || 'Client'}`,
                assignedBy: currentUser.id,
                assignedTo: '', // Will be assigned by admin/manager
                deadline: preferredDateTime ? new Date(preferredDateTime) : undefined,
            });

            onClose();
            // Reset form
            setDescription('');
            setPreferredDateTime('');
            setUrgency('Medium');
        } catch (error) {
            console.error("Failed to submit request", error);
            alert('Failed to submit request. Please try again.');
        } finally {
            setSubmitting(false);
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
                    <p className="text-xs opacity-80 mt-1">Request will be routed to the appropriate team.</p>
                </div>

                <div>
                    <label className="block text-sm font-bold text-text-secondary mb-1">Request Type</label>
                    <select
                        value={requestType}
                        onChange={(e) => setRequestType(e.target.value as TaskType)}
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
                    <PrimaryButton type="submit" disabled={submitting}>
                        {submitting ? 'Submitting...' : 'Submit Request'}
                    </PrimaryButton>
                </div>
            </form>
        </Modal>
    );
};

export default RaiseRequestModal;
