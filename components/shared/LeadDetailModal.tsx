import React, { useState } from 'react';
import Modal from './Modal';
import { Lead, LeadPipelineStatus, LeadHistory, Reminder, UserRole, TaskStatus } from '../../types';
import LeadHistoryView from './LeadHistoryView';
import { useAuth } from '../../context/AuthContext';
import { PlusIcon, BellIcon, MapPinIcon, PaintBrushIcon, CalculatorIcon, TruckIcon, WrenchScrewdriverIcon, CreditCardIcon, PhoneIcon, ChatBubbleLeftRightIcon, BanknotesIcon, CalendarIcon, UserCircleIcon, FireIcon } from '../icons/IconComponents';
import RaiseRequestModal from '../dashboard/sales-team/RaiseRequestModal';
import { addTask } from '../../hooks/useMyDayTasks';
import { formatLargeNumberINR, formatDateTime } from '../../constants';
import SmartDateTimePicker from './SmartDateTimePicker';

interface LeadDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    lead: Lead;
    onUpdate: (updatedLead: Lead) => void;
}

const LeadDetailModal: React.FC<LeadDetailModalProps> = ({ isOpen, onClose, lead, onUpdate }) => {
    if (!lead) return null;

    const { currentUser } = useAuth();
    const [newNote, setNewNote] = useState('');
    const [newStatus, setNewStatus] = useState<LeadPipelineStatus>(lead.status);

    const [reminderNote, setReminderNote] = useState('');
    const [reminderDate, setReminderDate] = useState('');

    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

    // Removed handleOpenTaskModal as we now use RaiseRequestModal directly

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

    const handleAddReminder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reminderNote.trim() || !reminderDate) return;

        const newReminder: Reminder = {
            id: `rem-${new Date().getTime()}`,
            date: new Date(reminderDate),
            notes: reminderNote,
            completed: false,
        };

        // Update lead with the new reminder
        const updatedLead = {
            ...lead,
            reminders: [...(lead.reminders || []), newReminder],
            history: [
                ...lead.history,
                {
                    action: 'Reminder set',
                    user: currentUser?.name || 'Unknown',
                    timestamp: new Date(),
                    notes: reminderNote
                }
            ]
        };

        // Create a task in My Day for the selected date
        if (currentUser) {
            const selectedDate = new Date(reminderDate);
            const dateStr = selectedDate.toISOString().split('T')[0];

            try {
                await addTask({
                    title: `[Reminder] ${lead.clientName}: ${reminderNote}`,
                    userId: currentUser.id,
                    status: TaskStatus.PENDING,
                    timeSpent: 0,
                    priority: 'Medium',
                    priorityOrder: 50,
                    deadline: reminderDate,
                    isPaused: false,
                    date: dateStr,
                    description: `Lead: ${lead.clientName} - ${lead.projectName}`,
                    createdAt: new Date(),
                    createdBy: currentUser.id,
                    createdByName: currentUser.name,
                }, currentUser.id);
            } catch (error) {
                console.error('Error adding reminder task:', error);
            }
        }

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
                    {/* Project Details Section */}
                    <div className="lg:col-span-3 pb-6 border-b border-border mb-2">
                        <h3 className="text-md font-bold text-text-primary mb-4 flex items-center">
                            <FireIcon className="w-5 h-5 mr-2 text-primary" />
                            Project Details
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            <div className="bg-subtle-background p-3 rounded-xl">
                                <div className="flex items-center gap-2 text-text-tertiary text-xs font-medium mb-1">
                                    <MapPinIcon className="w-4 h-4" />
                                    Project Name
                                </div>
                                <p className="text-sm font-bold text-text-primary">{lead.projectName}</p>
                            </div>
                            <div className="bg-subtle-background p-3 rounded-xl">
                                <div className="flex items-center gap-2 text-text-tertiary text-xs font-medium mb-1">
                                    <UserCircleIcon className="w-4 h-4" />
                                    Client Name
                                </div>
                                <p className="text-sm font-bold text-text-primary">{lead.clientName}</p>
                            </div>
                            <div className="bg-subtle-background p-3 rounded-xl">
                                <div className="flex items-center gap-2 text-text-tertiary text-xs font-medium mb-1">
                                    <PhoneIcon className="w-4 h-4" />
                                    Contact Number
                                </div>
                                <p className="text-sm font-bold text-text-primary">{lead.clientMobile || 'N/A'}</p>
                            </div>
                            <div className="bg-subtle-background p-3 rounded-xl">
                                <div className="flex items-center gap-2 text-text-tertiary text-xs font-medium mb-1">
                                    <ChatBubbleLeftRightIcon className="w-4 h-4" />
                                    Email
                                </div>
                                <p className="text-sm font-bold text-text-primary truncate">{lead.clientEmail || 'N/A'}</p>
                            </div>
                            <div className="bg-subtle-background p-3 rounded-xl">
                                <div className="flex items-center gap-2 text-text-tertiary text-xs font-medium mb-1">
                                    <BanknotesIcon className="w-4 h-4" />
                                    Project Value
                                </div>
                                <p className="text-sm font-bold text-primary">{formatLargeNumberINR(lead.value)}</p>
                            </div>
                            <div className="bg-subtle-background p-3 rounded-xl">
                                <div className="flex items-center gap-2 text-text-tertiary text-xs font-medium mb-1">
                                    <CalendarIcon className="w-4 h-4" />
                                    Inquiry Date
                                </div>
                                <p className="text-sm font-bold text-text-primary">{formatDateTime(lead.inquiryDate)}</p>
                            </div>
                            <div className="bg-subtle-background p-3 rounded-xl">
                                <div className="flex items-center gap-2 text-text-tertiary text-xs font-medium mb-1">
                                    <FireIcon className="w-4 h-4" />
                                    Source
                                </div>
                                <p className="text-sm font-bold text-text-primary">{lead.source || 'N/A'}</p>
                            </div>
                            <div className="bg-subtle-background p-3 rounded-xl">
                                <div className="flex items-center gap-2 text-text-tertiary text-xs font-medium mb-1">
                                    <BellIcon className="w-4 h-4" />
                                    Current Status
                                </div>
                                <p className="text-sm font-bold text-accent">{lead.status}</p>
                            </div>
                        </div>
                    </div>
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
                            <h3 className="text-md font-bold text-text-primary mb-4">Activity History</h3>
                            <div className="max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                                <style>{`
                                    .custom-scrollbar::-webkit-scrollbar {
                                        width: 5px;
                                    }
                                    .custom-scrollbar::-webkit-scrollbar-track {
                                        background: transparent;
                                    }
                                    .custom-scrollbar::-webkit-scrollbar-thumb {
                                        background: #e2e8f0;
                                        border-radius: 10px;
                                    }
                                    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                                        background: #cbd5e1;
                                    }
                                `}</style>
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
                                    <label htmlFor="reminder-date" className="block text-[10px] font-black uppercase tracking-widest text-text-tertiary mb-1">Date & Time</label>
                                    <SmartDateTimePicker
                                        value={reminderDate}
                                        onChange={setReminderDate}
                                        placeholder="Pick Date & Time"
                                        variant="compact"
                                    />
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
                                        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
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
                                <h3 className="text-md font-bold text-text-primary mb-2">Work Requests</h3>
                                <p className="text-xs text-text-secondary mb-4">
                                    Need a site visit, design change, or technical support? Raise a formal request here.
                                </p>
                                <button
                                    onClick={() => setIsRequestModalOpen(true)}
                                    className="w-full flex items-center justify-center p-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all"
                                >
                                    <PlusIcon className="w-5 h-5 mr-2" />
                                    Raise New Request
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </Modal>

            {isSalesperson && (
                <RaiseRequestModal
                    isOpen={isRequestModalOpen}
                    onClose={() => setIsRequestModalOpen(false)}
                    leadId={lead.id}
                    clientName={lead.clientName}
                    projectId={lead.projectName}
                />
            )}
        </>
    );
};

export default LeadDetailModal;
