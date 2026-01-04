import React, { useState } from 'react';
import Modal from '../../shared/Modal';
import { Lead, UserRole, ApprovalRequestType } from '../../../types';
import { USERS } from '../../../constants';
import { createApprovalRequest } from '../../../hooks/useApprovals';
import { RocketLaunchIcon } from '@heroicons/react/24/outline';

interface TaskAssignmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    lead: Lead;
    taskType: UserRole | null;
    onSuccess: () => void;
}

const TaskAssignmentModal: React.FC<TaskAssignmentModalProps> = ({ isOpen, onClose, lead, taskType, onSuccess }) => {
    const [notes, setNotes] = useState('');
    const [deadline, setDeadline] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const getApprovalType = (role: UserRole): ApprovalRequestType => {
        switch (role) {
            case UserRole.DRAWING_TEAM: return ApprovalRequestType.DESIGN_TOKEN;
            case UserRole.QUOTATION_TEAM: return ApprovalRequestType.QUOTATION_TOKEN;
            case UserRole.PROCUREMENT_TEAM: return ApprovalRequestType.PROCUREMENT_TOKEN;
            case UserRole.EXECUTION_TEAM: return ApprovalRequestType.EXECUTION_TOKEN;
            case UserRole.ACCOUNTS_TEAM: return ApprovalRequestType.ACCOUNTS_TOKEN;
            default: return ApprovalRequestType.OTHER;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!taskType) return;

        setIsSubmitting(true);
        try {
            const requester = USERS.find(u => u.id === lead.assignedTo);
            if (!requester) throw new Error("Requester not found");

            await createApprovalRequest({
                requestType: getApprovalType(taskType),
                requesterId: requester.id,
                requesterName: requester.name,
                requesterRole: requester.role,
                title: `${taskType} Request: ${lead.projectName}`,
                description: `Work required for ${lead.clientName}. 
Requested Task: ${taskType}
Instructions: ${notes}
Desired Deadline: ${deadline || 'ASAP'}`,
                priority: lead.priority,
                contextId: lead.id,
                targetRole: taskType,
                endDate: deadline ? new Date(deadline) : undefined,
            });
            onSuccess();
            handleClose();
        } catch (error) {
            console.error("Failed to raise task token:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setNotes('');
        setDeadline('');
        onClose();
    };

    if (!taskType) return null;

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Raise Service Token" size="xl">
            <form onSubmit={handleSubmit} className="p-2 space-y-6">
                <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-2xl border border-primary/10 mb-2">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <RocketLaunchIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h4 className="font-bold text-text-primary text-sm uppercase tracking-tight">Mission Request</h4>
                        <p className="text-xs text-text-tertiary">Initiating protocol for {taskType} support.</p>
                    </div>
                </div>

                <div>
                    <label htmlFor="notes" className="block text-xs font-black uppercase tracking-widest text-text-tertiary mb-2 text-center">Protocol Instructions / Scope</label>
                    <textarea
                        id="notes"
                        rows={5}
                        required
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        className="mt-1 block w-full rounded-2xl border-border shadow-inner focus:border-primary focus:ring-primary sm:text-sm bg-subtle-background p-4"
                        placeholder={`Explain exactly what the ${taskType} needs to accomplish for this project...`}
                    />
                </div>

                <div>
                    <label htmlFor="deadline" className="block text-xs font-black uppercase tracking-widest text-text-tertiary mb-2 text-center">Desired Project Milestone (Deadline)</label>
                    <input
                        type="date"
                        id="deadline"
                        value={deadline}
                        onChange={e => setDeadline(e.target.value)}
                        className="mt-1 block w-full px-4 py-3 text-sm border-border bg-subtle-background focus:outline-none focus:ring-primary focus:border-primary rounded-2xl shadow-inner"
                    />
                </div>

                <div className="p-4 bg-accent/5 rounded-xl border border-accent/10">
                    <p className="text-[10px] text-accent font-bold uppercase tracking-widest text-center">Note: Personnel assignment is handled by Executive Administration upon approval.</p>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                    <button type="button" onClick={handleClose} className="px-6 py-2.5 text-sm font-bold text-text-primary bg-surface border border-border rounded-xl hover:bg-subtle-background transition-colors">Cancel</button>
                    <button
                        type="submit"
                        className="px-8 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-50"
                        disabled={isSubmitting || !notes}
                    >
                        {isSubmitting ? 'Processing Protocol...' : 'Raise Token'}
                    </button>
                </div>

            </form>
        </Modal>
    );
};

export default TaskAssignmentModal;
