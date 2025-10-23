import React, { useState } from 'react';
import Modal from '../../shared/Modal';
import { Lead, LeadPipelineStatus, LeadHistory } from '../../../types';
import LeadHistoryView from '../../shared/LeadHistoryView';
import { useAuth } from '../../../context/AuthContext';
import { PlusIcon } from '../../icons/IconComponents';

interface LeadDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead;
  onUpdate: (updatedLead: Lead) => void;
}

const LeadDetailModal: React.FC<LeadDetailModalProps> = ({ isOpen, onClose, lead, onUpdate }) => {
    const { currentUser } = useAuth();
    const [newNote, setNewNote] = useState('');
    const [newStatus, setNewStatus] = useState<LeadPipelineStatus>(lead.status);

    const handleLogActivity = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newNote.trim() && newStatus === lead.status) return;

        const historyItems: LeadHistory[] = [];

        if (newStatus !== lead.status) {
            historyItems.push({
                action: `Status changed to ${newStatus}`,
                user: currentUser?.name || 'Unknown',
                timestamp: new Date(),
            });
        }
        
        if (newNote.trim()) {
            historyItems.push({
                action: 'Note added',
                user: currentUser?.name || 'Unknown',
                timestamp: new Date(),
                notes: newNote,
            });
        }

        const updatedLead = {
            ...lead,
            status: newStatus,
            history: [...lead.history, ...historyItems],
        };

        onUpdate(updatedLead);
        setNewNote('');
    };

    return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Log Activity for ${lead.clientName}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <h3 className="text-md font-bold text-text-primary mb-2">Log New Activity</h3>
                <form onSubmit={handleLogActivity} className="space-y-4 p-4 border border-border rounded-md bg-subtle-background">
                    <div>
                        <label htmlFor="lead-status" className="block text-sm font-medium text-text-primary">
                        Update Status
                        </label>
                        <select
                            id="lead-status"
                            value={newStatus}
                            onChange={(e) => setNewStatus(e.target.value as LeadPipelineStatus)}
                            className="mt-1 block w-full rounded-md border-border shadow-sm focus:border-primary focus:ring-primary sm:text-sm bg-surface"
                        >
                            {Object.values(LeadPipelineStatus).map(status => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-text-primary">
                        Add Note (Call, Meeting, etc.)
                        </label>
                        <textarea
                            id="notes"
                            rows={3}
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            className="mt-1 block w-full rounded-md border-border shadow-sm focus:border-primary focus:ring-primary sm:text-sm bg-surface"
                            placeholder="Client requested a follow-up next week..."
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full inline-flex justify-center items-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50"
                        disabled={!newNote.trim() && newStatus === lead.status}
                    >
                        <PlusIcon className="w-4 h-4 mr-2" />
                        Log Activity
                    </button>
                </form>
            </div>
            <div>
                <h3 className="text-md font-bold text-text-primary mb-2">Activity History</h3>
                <div className="max-h-96 overflow-y-auto pr-2">
                    <LeadHistoryView lead={lead} />
                </div>
            </div>
        </div>
    </Modal>
  );
};

export default LeadDetailModal;
