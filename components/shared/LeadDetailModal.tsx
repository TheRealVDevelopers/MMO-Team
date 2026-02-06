import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from './Modal';
import { Case, LeadPipelineStatus, LeadHistory, Reminder, UserRole, TaskStatus, ProjectStatus } from '../../types';
import LeadHistoryView from './LeadHistoryView';
import { useAuth } from '../../context/AuthContext';
import { PlusIcon, BellIcon, MapPinIcon, PaintBrushIcon, CalculatorIcon, TruckIcon, WrenchScrewdriverIcon, CreditCardIcon, PhoneIcon, ChatBubbleLeftRightIcon, BanknotesIcon, CalendarIcon, UserCircleIcon, FireIcon, PaperClipIcon, XMarkIcon } from '../icons/IconComponents';
import RaiseRequestModal from '../dashboard/sales-team/RaiseRequestModal';
import DirectAssignTaskModal from '../dashboard/super-admin/DirectAssignTaskModal';
import { addTask } from '../../hooks/useMyDayTasks';
import { updateLead } from '../../hooks/useLeads';
import { formatLargeNumberINR, formatDateTime } from '../../constants';
import SmartDateTimePicker from './SmartDateTimePicker';
import { uploadMultipleLeadAttachments, formatFileSize } from '../../services/leadAttachmentService';
import { LeadHistoryAttachment } from '../../types';

interface LeadDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    caseItem: Case; // Unified Case type (works for both Lead and Project)
    onUpdate: (updatedCase: Case) => void;
}

const LeadDetailModal: React.FC<LeadDetailModalProps> = ({ isOpen, onClose, caseItem, onUpdate }) => {
    if (!caseItem) return null;

    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [newNote, setNewNote] = useState('');
    const [newStatus, setNewStatus] = useState<LeadPipelineStatus | ProjectStatus>(caseItem.status);

    const [reminderNote, setReminderNote] = useState('');
    const [reminderDate, setReminderDate] = useState('');
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);

    // Determine available statuses based on whether it's a lead or project
    const availableStatuses = caseItem.isProject
        ? Object.values(ProjectStatus)
        : Object.values(LeadPipelineStatus);


    // Removed handleOpenTaskModal as we now use RaiseRequestModal directly

    const handleLogActivity = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!newNote.trim() && newStatus === caseItem.status && selectedFiles.length === 0) || isUploading) return;

        setIsUploading(true);

        try {
            let uploadedAttachments: LeadHistoryAttachment[] = [];

            if (selectedFiles.length > 0) {
                uploadedAttachments = await uploadMultipleLeadAttachments(selectedFiles, caseItem.id);
            }

            const historyItems: LeadHistory[] = [];

            if (newStatus !== caseItem.status) {
                historyItems.push({
                    action: `Status changed to ${newStatus}`,
                    user: currentUser?.name || 'Unknown',
                    timestamp: new Date(),
                });
            }

            if (newNote.trim() || uploadedAttachments.length > 0) {
                historyItems.push({
                    action: uploadedAttachments.length > 0 ? 'Note added with attachments' : 'Note added',
                    user: currentUser?.name || 'Unknown',
                    timestamp: new Date(),
                    notes: newNote,
                    attachments: uploadedAttachments.length > 0 ? uploadedAttachments : undefined,
                });
            }

            const updatedCase = {
                ...caseItem,
                status: newStatus,
                history: [...caseItem.history, ...historyItems],
            };

            onUpdate(updatedCase);
            setNewNote('');
            setSelectedFiles([]);
        } catch (error) {
            console.error("Error logging activity:", error);
            alert("Failed to upload attachments. Please try again.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setSelectedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
        }
    };

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
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

        // Update case with the new reminder
        const updatedCase = {
            ...caseItem,
            reminders: [...(caseItem.reminders || []), newReminder],
            history: [
                ...caseItem.history,
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
                    title: `[Reminder] ${caseItem.clientName}: ${reminderNote}`,
                    userId: currentUser.id,
                    assignedTo: currentUser.id, // Required field
                    status: TaskStatus.PENDING,
                    timeSpent: 0,
                    priority: 'Medium',
                    priorityOrder: 50,
                    deadline: reminderDate,
                    isPaused: false,
                    date: dateStr,
                    description: `${caseItem.isProject ? 'Project' : 'Lead'}: ${caseItem.clientName} - ${caseItem.projectName}`,
                    createdAt: new Date(),
                    createdBy: currentUser.id,
                    createdByName: currentUser.name,
                }, currentUser.id);
            } catch (error) {
                console.error('Error adding reminder task:', error);
            }
        }

        onUpdate(updatedCase);
        setReminderNote('');
        setReminderDate('');
    };

    const handleToggleReminder = (reminderId: string) => {
        const updatedReminders = caseItem.reminders?.map(r =>
            r.id === reminderId ? { ...r, completed: !r.completed } : r
        );

        const updatedCase = { ...caseItem, reminders: updatedReminders };
        onUpdate(updatedCase);
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
            <Modal isOpen={isOpen} onClose={onClose} title={`Activity for ${caseItem.clientName}`} size="4xl">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-8 gap-y-6">
                    {/* Project Details Section */}
                    <div className="lg:col-span-3 pb-6 border-b border-border mb-2">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-md font-bold text-text-primary flex items-center">
                                <FireIcon className="w-5 h-5 mr-2 text-primary" />
                                Project Details
                            </h3>
                            <button
                                onClick={() => {
                                    onClose();
                                    navigate(`/projects/${caseItem.id}`);
                                }}
                                className="px-3 py-1.5 bg-subtle-background text-primary text-xs font-bold uppercase tracking-wider rounded-lg border border-primary/20 hover:bg-primary hover:text-white transition-all shadow-sm"
                            >
                                View Reference
                            </button>
                            {(currentUser?.role === UserRole.SUPER_ADMIN || currentUser?.role === UserRole.MANAGER || currentUser?.role === UserRole.SALES_GENERAL_MANAGER) && (
                                <button
                                    onClick={() => setIsAddTaskModalOpen(true)}
                                    className="ml-2 px-3 py-1.5 bg-primary text-white text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-primary-hover transition-all shadow-sm flex items-center gap-1"
                                >
                                    <PlusIcon className="w-3 h-3" />
                                    Assign Task
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            <div className="bg-subtle-background p-3 rounded-xl">
                                <div className="flex items-center gap-2 text-text-tertiary text-xs font-medium mb-1">
                                    <MapPinIcon className="w-4 h-4" />
                                    Project Name
                                </div>
                                <p className="text-sm font-bold text-text-primary">{caseItem.projectName}</p>
                            </div>
                            <div className="bg-subtle-background p-3 rounded-xl">
                                <div className="flex items-center gap-2 text-text-tertiary text-xs font-medium mb-1">
                                    <UserCircleIcon className="w-4 h-4" />
                                    Client Name
                                </div>
                                <p className="text-sm font-bold text-text-primary">{caseItem.clientName}</p>
                            </div>
                            <div className="bg-subtle-background p-3 rounded-xl">
                                <div className="flex items-center gap-2 text-text-tertiary text-xs font-medium mb-1">
                                    <PhoneIcon className="w-4 h-4" />
                                    Contact Number
                                </div>
                                <p className="text-sm font-bold text-text-primary">{caseItem.clientMobile || 'N/A'}</p>
                            </div>
                            <div className="bg-subtle-background p-3 rounded-xl">
                                <div className="flex items-center gap-2 text-text-tertiary text-xs font-medium mb-1">
                                    <ChatBubbleLeftRightIcon className="w-4 h-4" />
                                    Email
                                </div>
                                <p className="text-sm font-bold text-text-primary truncate">{caseItem.clientEmail || 'N/A'}</p>
                            </div>
                            <div className="bg-subtle-background p-3 rounded-xl">
                                <div className="flex items-center gap-2 text-text-tertiary text-xs font-medium mb-1">
                                    <BanknotesIcon className="w-4 h-4" />
                                    Project Value
                                </div>
                                <p className="text-sm font-bold text-primary">{formatLargeNumberINR(caseItem.isProject ? (caseItem.budget || 0) : (caseItem.value || 0))}</p>
                            </div>
                            <div className="bg-subtle-background p-3 rounded-xl">
                                <div className="flex items-center gap-2 text-text-tertiary text-xs font-medium mb-1">
                                    <CalendarIcon className="w-4 h-4" />
                                    Inquiry Date
                                </div>
                                <p className="text-sm font-bold text-text-primary">{formatDateTime(caseItem.inquiryDate)}</p>
                            </div>
                            <div className="bg-subtle-background p-3 rounded-xl">
                                <div className="flex items-center gap-2 text-text-tertiary text-xs font-medium mb-1">
                                    <FireIcon className="w-4 h-4" />
                                    Source
                                </div>
                                <p className="text-sm font-bold text-text-primary">{caseItem.source || 'N/A'}</p>
                            </div>
                            <div className="bg-subtle-background p-3 rounded-xl">
                                <div className="flex items-center gap-2 text-text-tertiary text-xs font-medium mb-1">
                                    <BellIcon className="w-4 h-4" />
                                    Current Status
                                </div>
                                <p className="text-sm font-bold text-accent">{caseItem.status}</p>
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
                                        onChange={(e) => setNewStatus(e.target.value as LeadPipelineStatus | ProjectStatus)}
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

                                    <div className="mt-3">
                                        <div className="flex items-center gap-2 mb-2">
                                            <label
                                                htmlFor="file-upload"
                                                className="cursor-pointer inline-flex items-center px-3 py-1.5 border border-border rounded-md shadow-sm text-xs font-medium text-text-secondary bg-surface hover:bg-subtle-background transition-colors"
                                            >
                                                <PaperClipIcon className="h-4 w-4 mr-1.5 text-text-tertiary" />
                                                Attach Files
                                            </label>
                                            <input
                                                id="file-upload"
                                                type="file"
                                                multiple
                                                className="hidden"
                                                onChange={handleFileSelect}
                                            />
                                            <span className="text-xs text-text-tertiary">
                                                {selectedFiles.length > 0 ? `${selectedFiles.length} file(s) selected` : 'Optional'}
                                            </span>
                                        </div>

                                        {selectedFiles.length > 0 && (
                                            <div className="space-y-2 bg-surface p-2 rounded-md border border-border/50">
                                                {selectedFiles.map((file, index) => (
                                                    <div key={index} className="flex items-center justify-between text-xs p-1.5 bg-subtle-background rounded">
                                                        <span className="truncate max-w-[200px] text-text-primary font-medium">{file.name}</span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-text-tertiary">{formatFileSize(file.size)}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeFile(index)}
                                                                className="text-text-tertiary hover:text-error transition-colors"
                                                            >
                                                                <XMarkIcon className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    className="w-full inline-flex justify-center items-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50"
                                    disabled={(!newNote.trim() && newStatus === caseItem.status && selectedFiles.length === 0) || isUploading}
                                >
                                    <PlusIcon className="w-4 h-4 mr-2" />
                                    {isUploading ? 'Uploading...' : 'Log Activity'}
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
                                <LeadHistoryView lead={caseItem as any} />
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
                                {caseItem.reminders && caseItem.reminders.length > 0 ? (
                                    [...caseItem.reminders]
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

            {
                isSalesperson && (
                    <RaiseRequestModal
                        isOpen={isRequestModalOpen}
                        onClose={() => setIsRequestModalOpen(false)}
                        leadId={caseItem.id}
                        clientName={caseItem.clientName}
                        projectId={caseItem.projectName}
                    />
                )
            }

            <DirectAssignTaskModal
                isOpen={isAddTaskModalOpen}
                onClose={() => setIsAddTaskModalOpen(false)}
                onAssign={async (task) => {
                    // 1. Create the task
                    await addTask({
                        ...task,
                        status: TaskStatus.ASSIGNED, // Explicitly set Assigned for mission control
                        date: new Date().toISOString().split('T')[0],
                        timeSpent: 0,
                        isPaused: false,
                        createdBy: currentUser?.id || '',
                        createdByName: currentUser?.name || '',
                        createdAt: new Date(),
                        // Ensure context is passed if not already in task object (though it should be)
                        contextId: task.contextId || caseItem.id,
                        contextType: task.contextType || (caseItem.isProject ? 'project' : 'lead')
                    } as any, currentUser?.id || '');

                    // 2. CRITICAL: Update the lead/project status based on task type
                    // This ensures the item appears in the correct workflow column
                    const title = (task.title || '').toLowerCase();
                    const assigneeId = task.userId;
                    const contextType = task.contextType || (caseItem.isProject ? 'project' : 'lead');
                    const contextId = task.contextId || caseItem.id;

                    console.log('[LeadDetailModal] Task assigned:', title, 'to:', assigneeId, 'context:', contextType, contextId);

                    if (contextType === 'lead') {
                        // Determine status based on task title
                        let newStatus: LeadPipelineStatus;
                        if (title.includes('drawing') || title.includes('design')) {
                            newStatus = LeadPipelineStatus.WAITING_FOR_DRAWING;
                        } else if (title.includes('quotation')) {
                            newStatus = LeadPipelineStatus.WAITING_FOR_QUOTATION;
                        } else {
                            // Default: Site Visit for any other task type
                            newStatus = LeadPipelineStatus.SITE_VISIT_SCHEDULED;
                        }

                        console.log('[LeadDetailModal] Updating lead status to:', newStatus, 'assignedTo:', assigneeId);
                        await updateLead(contextId, {
                            status: newStatus,
                            assignedTo: assigneeId
                        });

                        // Also update local state so UI reflects the change
                        onUpdate({
                            ...caseItem,
                            status: newStatus,
                            assignedTo: assigneeId
                        });
                    }
                    // Note: For projects, the ApprovalsPage handles status updates

                    alert('✅ Mission Deployed Successfully - Status updated!');
                    setIsAddTaskModalOpen(false);
                }}
                initialContextId={caseItem.id}
                initialContextType={caseItem.isProject ? 'project' : 'lead'}
            />
        </>
    );
};

export default LeadDetailModal;
