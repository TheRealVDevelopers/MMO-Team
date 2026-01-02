import React, { useState } from 'react';
import Modal from './Modal';
import { Lead, LeadPipelineStatus, LeadHistory, Reminder, UserRole } from '../../types';
import LeadHistoryView from './LeadHistoryView';
import { useAuth } from '../../context/AuthContext';
import { PlusIcon, BellIcon, MapPinIcon, PaintBrushIcon, CalculatorIcon, TruckIcon, WrenchScrewdriverIcon, CreditCardIcon } from '../icons/IconComponents';
import TaskAssignmentModal from '../dashboard/sales-team/TaskAssignmentModal';

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

    const [reminderNote, setReminderNote] = useState('');
    const [reminderDate, setReminderDate] = useState('');

    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [taskType, setTaskType] = useState<UserRole | null>(null);

    const handleOpenTaskModal = (type: UserRole) => {
        setTaskType(type);
        setIsTaskModalOpen(true);
    };

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
    
    const handleAddReminder = (e: React.FormEvent) => {
        e.preventDefault();
        if (!reminderNote.trim() || !reminderDate) return;

        const newReminder: Reminder = {
            id: `rem-${new Date().getTime()}`,
            date: new Date(reminderDate),
            notes: reminderNote,
            completed: false,
        };

        const historyItem: LeadHistory = {
            action: `Reminder set`,
            user: currentUser?.name || 'Unknown',
            timestamp: new Date(),
            notes: reminderNote,
        };

        const updatedLead = {
            ...lead,
            reminders: [...(lead.reminders || []), newReminder],
            history: [...lead.history, historyItem],
        };

        onUpdate(updatedLead);
        setReminderNote('');
        setReminderDate('');
    };

    const handleToggleReminder = (reminderId: string) => {
        const updatedReminders = lead.reminders?.map(r => 
            r.id === reminderId ? { ...r, completed: !r.completed } : r
        );

        const updatedLead = { ...lead, reminders: updatedReminders };
        onUpdate(updatedLead);
    };

    const isSalesperson = currentUser?.role === UserRole.SALES_TEAM_MEMBER;

    const taskButtons = [
        { role: UserRole.SITE_ENGINEER, icon: <MapPinIcon className="w-6 h-6" />, label: 'Site Visit' },
        { role: UserRole.DRAWING_TEAM, icon: <PaintBrushIcon className="w-6 h-6" />, label: 'Drawing' },
        { role: UserRole.QUOTATION_TEAM, icon: <CalculatorIcon className="w-6 h-6" />, label: 'Quotation' },
        { role: UserRole.PROCUREMENT_TEAM, icon: <TruckIcon className="w-6 h-6" />, label: 'Procurement' },
        { role: UserRole.EXECUTION_TEAM, icon: <WrenchScrewdriverIcon className="w-6 h-6" />, label: 'Execution' },
        { role: UserRole.ACCOUNTS_TEAM, icon: <CreditCardIcon className="w-6 h-6" />, label: 'Accounts' },
    ];

    return (
    <>
        <Modal isOpen={isOpen} onClose={onClose} title={`Activity for ${lead.clientName}`} size="4xl">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-8 gap-y-6">
                <div className="lg:col-span-2 space-y-6">
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
                                className="w-full inline-flex justify-center items-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50"
                                disabled={!newNote.trim() && newStatus === lead.status}
                            >
                                <PlusIcon className="w-4 h-4 mr-2" />
                                Log Activity
                            </button>
                        </form>
                    </div>
                    
                    <div className="mt-6">
                        <h3 className="text-md font-bold text-text-primary mb-2">Activity History</h3>
                        <div className="max-h-96 overflow-y-auto pr-2">
                            <LeadHistoryView lead={lead} />
                        </div>
                    </div>
                </div>
                
                {/* Right Column */}
                <div className="space-y-6">
                     <div>
                        <h3 className="text-md font-bold text-text-primary mb-2 flex items-center">
                            <BellIcon className="w-5 h-5 mr-2" />
                            Reminders
                        </h3>
                        <form onSubmit={handleAddReminder} className="space-y-3 p-3 border border-border rounded-md bg-subtle-background mb-4">
                            <div>
                                <label htmlFor="reminder-date" className="block text-xs font-medium text-text-primary">Date & Time</label>
                                <input type="datetime-local" id="reminder-date" value={reminderDate} onChange={e => setReminderDate(e.target.value)} className="mt-1 block w-full text-sm rounded-md border-border shadow-sm focus:border-primary focus:ring-primary bg-surface" />
                            </div>
                            <div>
                                <label htmlFor="reminder-notes" className="block text-xs font-medium text-text-primary">Notes</label>
                                <textarea id="reminder-notes" rows={2} value={reminderNote} onChange={e => setReminderNote(e.target.value)} placeholder="Follow up about quotation..." className="mt-1 block w-full text-sm rounded-md border-border shadow-sm focus:border-primary focus:ring-primary bg-surface" />
                            </div>
                            <button type="submit" className="w-full text-sm font-medium bg-primary/20 text-primary py-1.5 rounded-md hover:bg-primary/30 disabled:opacity-50" disabled={!reminderDate || !reminderNote}>Add Reminder</button>
                        </form>
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                            {lead.reminders && lead.reminders.length > 0 ? (
                                [...lead.reminders]
                                    .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                                    .map(reminder => (
                                        <div key={reminder.id} className="flex items-start p-2 bg-subtle-background rounded-md">
                                            <input type="checkbox" checked={reminder.completed} onChange={() => handleToggleReminder(reminder.id)} className="h-4 w-4 mt-1 text-primary focus:ring-primary border-border rounded" />
                                            <div className="ml-3">
                                                <p className={`text-sm ${reminder.completed ? 'line-through text-text-secondary' : 'text-text-primary'}`}>{reminder.notes}</p>
                                                <p className="text-xs text-text-secondary">{new Date(reminder.date).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    ))
                            ) : (
                                <p className="text-sm text-center text-text-secondary py-4">No reminders set.</p>
                            )}
                        </div>
                    </div>

                    {isSalesperson && (
                        <div>
                            <h3 className="text-md font-bold text-text-primary mb-2">Universal Task Assignment</h3>
                            <div className="grid grid-cols-2 gap-2">
                                {taskButtons.map(task => (
                                     <button key={task.role} onClick={() => handleOpenTaskModal(task.role)} className="flex flex-col items-center justify-center p-3 bg-surface border border-border rounded-lg hover:bg-primary-subtle-background hover:border-primary transition-colors">
                                        <span className="text-primary">{task.icon}</span>
                                        <span className="mt-1 text-xs font-semibold">{task.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Modal>

        {isSalesperson && (
            <TaskAssignmentModal 
                isOpen={isTaskModalOpen}
                onClose={() => setIsTaskModalOpen(false)}
                lead={lead}
                taskType={taskType}
                onUpdateLead={onUpdate}
            />
        )}
    </>
  );
};

export default LeadDetailModal;
