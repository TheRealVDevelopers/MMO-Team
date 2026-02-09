import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from './Modal';
import { Case, CaseStatus, LeadPipelineStatus, LeadHistory, Reminder, UserRole, TaskStatus, ProjectStatus } from '../../types';
import LeadHistoryView from './LeadHistoryView';
import { useAuth } from '../../context/AuthContext';
import { PlusIcon, BellIcon, MapPinIcon, PaintBrushIcon, CalculatorIcon, TruckIcon, WrenchScrewdriverIcon, CreditCardIcon, PhoneIcon, ChatBubbleLeftRightIcon, BanknotesIcon, CalendarIcon, UserCircleIcon, FireIcon, PaperClipIcon, XMarkIcon, CheckCircleIcon } from '../icons/IconComponents';
import RaiseRequestModal from '../dashboard/sales-team/RaiseRequestModal';
import DirectAssignTaskModal from '../dashboard/super-admin/DirectAssignTaskModal';
import { addTask } from '../../hooks/useMyDayTasks';
import { updateLead, mapLeadStatusToCaseStatus, CASE_STATUS_DISPLAY_LABELS } from '../../hooks/useLeads';
import { formatLargeNumberINR, formatDateTime } from '../../constants';
import SmartDateTimePicker from './SmartDateTimePicker';
import { uploadMultipleLeadAttachments, formatFileSize } from '../../services/leadAttachmentService';
import { LeadHistoryAttachment } from '../../types';
import { useActivities } from '../../hooks/useActivities';
import { doc, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { FIRESTORE_COLLECTIONS } from '../../constants';

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
    const { activities, addActivity } = useActivities(caseItem.id);
    
    const [newNote, setNewNote] = useState('');
    
    // CRITICAL FIX: Resolve the incoming status to CaseStatus
    // The caseItem may come from useLeads (LeadPipelineStatus) or useCases (CaseStatus)
    const resolveInitialCaseStatus = (status: any): CaseStatus => {
        // Check if it's already a valid CaseStatus
        const caseStatusValues = Object.values(CaseStatus) as string[];
        if (caseStatusValues.includes(status)) {
            return status as CaseStatus;
        }
        // Check _caseStatus field (set by useLeads)
        if ((caseItem as any)._caseStatus) {
            return (caseItem as any)._caseStatus as CaseStatus;
        }
        // Reverse-map from LeadPipelineStatus
        return mapLeadStatusToCaseStatus(status);
    };

    const [newStatus, setNewStatus] = useState<CaseStatus>(resolveInitialCaseStatus(caseItem.status));
    
    // Real-time case data from Firestore
    const [liveCaseData, setLiveCaseData] = useState<Case | null>(null);

    const [reminderNote, setReminderNote] = useState('');
    const [reminderDate, setReminderDate] = useState('');
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);

    // CRITICAL FIX: Subscribe to real-time updates for this case
    useEffect(() => {
        if (!db || !caseItem?.id || !isOpen) return;

        const caseRef = doc(db, FIRESTORE_COLLECTIONS.CASES, caseItem.id);
        const unsubscribe = onSnapshot(caseRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data();
                const liveCase = {
                    ...data,
                    id: snapshot.id,
                    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
                    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt ? new Date(data.updatedAt) : undefined,
                } as Case;
                setLiveCaseData(liveCase);
            }
        }, (error) => {
            console.error('[LeadDetailModal] Real-time listener error:', error);
        });

        return () => unsubscribe();
    }, [caseItem?.id, isOpen]);

    // Use live data if available, otherwise fall back to props
    const currentCase = liveCaseData || caseItem;

    // Sync newStatus when live data changes
    useEffect(() => {
        if (liveCaseData?.status) {
            setNewStatus(resolveInitialCaseStatus(liveCaseData.status));
        }
    }, [liveCaseData?.status]);

    // Also sync when props change (for backward compat)
    useEffect(() => {
        setNewStatus(resolveInitialCaseStatus(caseItem.status));
    }, [caseItem.status]);


    // Removed handleOpenTaskModal as we now use RaiseRequestModal directly

    const handleLogActivity = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Resolve current case status to CaseStatus for comparison
        const currentCaseStatus = resolveInitialCaseStatus(currentCase.status);
        const statusChanged = newStatus !== currentCaseStatus;
        
        if ((!newNote.trim() && !statusChanged && selectedFiles.length === 0) || isUploading) return;
        if (!currentUser) return;

        setIsUploading(true);

        try {
            let uploadedAttachmentUrls: string[] = [];

            // Upload files if any
            if (selectedFiles.length > 0) {
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/e4336b3f-e354-4a9b-9c27-6ecee71671c2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'LeadDetailModal.tsx:handleLogActivity',message:'before upload',data:{leadId:currentCase.id,fileCount:selectedFiles.length,hasAuth:!!currentUser,authId:currentUser?.id},timestamp:Date.now(),hypothesisId:'H5'})}).catch(()=>{});
                // #endregion
                uploadedAttachmentUrls = await uploadMultipleLeadAttachments(currentCase.id, selectedFiles);
            }

            // Log status change activity
            if (statusChanged) {
                const oldLabel = CASE_STATUS_DISPLAY_LABELS[currentCaseStatus] || currentCaseStatus;
                const newLabel = CASE_STATUS_DISPLAY_LABELS[newStatus] || newStatus;
                await addActivity({
                    type: 'status_change',
                    action: `Status changed from ${oldLabel} to ${newLabel}`,
                    userId: currentUser.id,
                    userName: currentUser.name,
                    metadata: {
                        oldStatus: currentCaseStatus,
                        newStatus: newStatus,
                    }
                });
            }

            // Log note activity
            if (newNote.trim()) {
                await addActivity({
                    type: 'note',
                    action: uploadedAttachmentUrls.length > 0 ? 'Note added with attachments' : 'Note added',
                    userId: currentUser.id,
                    userName: currentUser.name,
                    notes: newNote,
                    metadata: uploadedAttachmentUrls.length > 0 ? {
                        attachmentUrls: uploadedAttachmentUrls
                    } : undefined,
                });
            }

            // Log file upload activity (if only files, no note)
            if (uploadedAttachmentUrls.length > 0 && !newNote.trim()) {
                await addActivity({
                    type: 'file_upload',
                    action: `Uploaded ${uploadedAttachmentUrls.length} file(s)`,
                    userId: currentUser.id,
                    userName: currentUser.name,
                    metadata: {
                        attachmentUrls: uploadedAttachmentUrls
                    }
                });
            }

            // CRITICAL FIX: Use CaseStatus value (not LeadPipelineStatus) when updating
            const updatedCase: Case = {
                ...currentCase,
                status: newStatus, // This is now a CaseStatus value
                updatedAt: new Date(),
            };

            // Only pass defined fields
            const cleanedCase = Object.fromEntries(
                Object.entries(updatedCase).filter(([_, v]) => v !== undefined)
            ) as Case;

            console.log(`[LeadDetailModal] Updating case ${currentCase.id} with CaseStatus: "${newStatus}"`);
            onUpdate(cleanedCase);
            setNewNote('');
            setSelectedFiles([]);
            // Don't reset newStatus - keep it at the new status
        } catch (error: any) {
            console.error("Error logging activity/uploading:", error);
            const errorMessage = error?.message || error?.code || "Unknown error";
            alert(`Failed to save update. \nError details: ${errorMessage}\n\nCheck console for more info.`);
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
            ...currentCase,
            reminders: [...((currentCase as any).reminders || []), newReminder],
            history: [
                ...((currentCase as any).history || []),
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
                    title: `[Reminder] ${currentCase.clientName}: ${reminderNote}`,
                    userId: currentUser.id,
                    assignedTo: currentUser.id, // Required field
                    status: TaskStatus.PENDING,
                    timeSpent: 0,
                    priority: 'Medium',
                    priorityOrder: 50,
                    deadline: reminderDate,
                    isPaused: false,
                    date: dateStr,
                    description: `${currentCase.isProject ? 'Project' : 'Lead'}: ${currentCase.clientName} - ${(currentCase as any).projectName || currentCase.title}`,
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
        const updatedReminders = (currentCase as any).reminders?.map((r: any) =>
            r.id === reminderId ? { ...r, completed: !r.completed } : r
        );

        const updatedCase = { ...currentCase, reminders: updatedReminders };
        onUpdate(updatedCase as any);
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
            <Modal isOpen={isOpen} onClose={onClose} title={`Activity for ${currentCase.clientName}`} size="4xl">
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
                                    navigate(`/projects/${currentCase.id}`);
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
                                <p className="text-sm font-bold text-text-primary">{currentCase.projectName || currentCase.title}</p>
                            </div>
                            <div className="bg-subtle-background p-3 rounded-xl">
                                <div className="flex items-center gap-2 text-text-tertiary text-xs font-medium mb-1">
                                    <UserCircleIcon className="w-4 h-4" />
                                    Client Name
                                </div>
                                <p className="text-sm font-bold text-text-primary">{currentCase.clientName}</p>
                            </div>
                            <div className="bg-subtle-background p-3 rounded-xl">
                                <div className="flex items-center gap-2 text-text-tertiary text-xs font-medium mb-1">
                                    <PhoneIcon className="w-4 h-4" />
                                    Contact Number
                                </div>
                                <p className="text-sm font-bold text-text-primary">{(currentCase as any).clientMobile || currentCase.clientPhone || 'N/A'}</p>
                            </div>
                            <div className="bg-subtle-background p-3 rounded-xl">
                                <div className="flex items-center gap-2 text-text-tertiary text-xs font-medium mb-1">
                                    <ChatBubbleLeftRightIcon className="w-4 h-4" />
                                    Email
                                </div>
                                <p className="text-sm font-bold text-text-primary truncate">{currentCase.clientEmail || 'N/A'}</p>
                            </div>
                            <div className="bg-subtle-background p-3 rounded-xl">
                                <div className="flex items-center gap-2 text-text-tertiary text-xs font-medium mb-1">
                                    <BanknotesIcon className="w-4 h-4" />
                                    Project Value
                                </div>
                                <p className="text-sm font-bold text-primary">{formatLargeNumberINR(currentCase.isProject ? ((currentCase as any).budget || 0) : ((currentCase as any).value || currentCase.financial?.totalBudget || 0))}</p>
                            </div>
                            <div className="bg-subtle-background p-3 rounded-xl">
                                <div className="flex items-center gap-2 text-text-tertiary text-xs font-medium mb-1">
                                    <CalendarIcon className="w-4 h-4" />
                                    Inquiry Date
                                </div>
                                <p className="text-sm font-bold text-text-primary">{formatDateTime((currentCase as any).inquiryDate || currentCase.createdAt)}</p>
                            </div>
                            <div className="bg-subtle-background p-3 rounded-xl">
                                <div className="flex items-center gap-2 text-text-tertiary text-xs font-medium mb-1">
                                    <FireIcon className="w-4 h-4" />
                                    Source
                                </div>
                                <p className="text-sm font-bold text-text-primary">{(currentCase as any).source || 'N/A'}</p>
                            </div>
                            <div className="bg-subtle-background p-3 rounded-xl">
                                <div className="flex items-center gap-2 text-text-tertiary text-xs font-medium mb-1">
                                    <BellIcon className="w-4 h-4" />
                                    Current Status
                                </div>
                                <p className="text-sm font-bold text-accent">{CASE_STATUS_DISPLAY_LABELS[currentCase.status] || currentCase.status}</p>
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
                                        onChange={(e) => setNewStatus(e.target.value as CaseStatus)}
                                        className="mt-1 block w-full rounded-md border-border shadow-sm focus:border-primary focus:ring-primary sm:text-sm bg-surface"
                                    >
                                        {Object.values(CaseStatus).map(status => (
                                            <option key={status} value={status}>
                                                {CASE_STATUS_DISPLAY_LABELS[status] || status}
                                            </option>
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
                                    disabled={(!newNote.trim() && newStatus === resolveInitialCaseStatus(currentCase.status) && selectedFiles.length === 0) || isUploading}
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
                                {/* Show activities from subcollection */}
                                {activities && activities.length > 0 ? (
                                    <div className="flow-root">
                                        <ul role="list" className="-mb-8">
                                            {activities.map((activity, idx) => (
                                                <li key={activity.id}>
                                                    <div className="relative pb-8">
                                                        {idx !== activities.length - 1 ? (
                                                            <span className="absolute left-[15px] top-6 -ml-px h-full w-[1.5px] bg-border/60" aria-hidden="true" />
                                                        ) : null}
                                                        <div className="relative flex items-start space-x-4">
                                                            <div>
                                                                <span className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center ring-4 ring-surface">
                                                                    <CheckCircleIcon className="h-5 w-5 text-primary" aria-hidden="true" />
                                                                </span>
                                                            </div>
                                                            <div className="flex min-w-0 flex-1 justify-between items-start pt-1.5">
                                                                <div className="flex-1">
                                                                    <p className="text-sm font-medium text-text-primary">
                                                                        {activity.action} <span className="text-text-secondary font-normal">by</span> <span className="font-semibold text-text-primary">{activity.userName}</span>
                                                                    </p>
                                                                    {activity.notes && (
                                                                        <p className="mt-1.5 text-sm text-text-secondary italic bg-subtle-background/50 p-2 rounded-lg border-l-2 border-primary/20">
                                                                            "{activity.notes}"
                                                                        </p>
                                                                    )}
                                                                </div>
                                                                <div className="whitespace-nowrap text-right text-[11px] font-semibold text-text-tertiary bg-subtle-background px-2 py-1 rounded-md ml-4">
                                                                    {formatDateTime(activity.timestamp)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ) : (
                                    <p className="text-sm text-text-tertiary italic text-center py-8">No activities yet</p>
                                )}
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
                                {(currentCase as any).reminders && (currentCase as any).reminders.length > 0 ? (
                                    [...(currentCase as any).reminders]
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
                        leadId={currentCase.id}
                        clientName={currentCase.clientName}
                        projectId={(currentCase as any).projectName || currentCase.title}
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
                        contextId: task.contextId || currentCase.id,
                        contextType: task.contextType || (currentCase.isProject ? 'project' : 'lead')
                    } as any, currentUser?.id || '');

                    // 2. CRITICAL: Update the lead/project status based on task type
                    // This ensures the item appears in the correct workflow column
                    const title = (task.title || '').toLowerCase();
                    const assigneeId = task.userId;
                    const contextType = task.contextType || (currentCase.isProject ? 'project' : 'lead');
                    const contextId = task.contextId || currentCase.id;

                    console.log('[LeadDetailModal] Task assigned:', title, 'to:', assigneeId, 'context:', contextType, contextId);

                    if (contextType === 'lead') {
                        // CRITICAL FIX: Use CaseStatus values (not LeadPipelineStatus)
                        let taskCaseStatus: CaseStatus;
                        if (title.includes('drawing') || title.includes('design')) {
                            taskCaseStatus = CaseStatus.DRAWING;
                        } else if (title.includes('quotation') || title.includes('boq')) {
                            taskCaseStatus = CaseStatus.BOQ;
                        } else {
                            // Default: Site Visit for any other task type
                            taskCaseStatus = CaseStatus.SITE_VISIT;
                        }

                        console.log('[LeadDetailModal] Updating lead CaseStatus to:', taskCaseStatus, 'assignedTo:', assigneeId);
                        await updateLead(contextId, {
                            status: taskCaseStatus as any,
                            assignedTo: assigneeId
                        });

                        // Also update local state so UI reflects the change
                        onUpdate({
                            ...currentCase,
                            status: taskCaseStatus,
                            assignedSales: assigneeId
                        } as any);
                    } else if (contextType === 'project') {
                        // CRITICAL: Update project status for workflow visibility
                        try {
                            const { doc: docRef, updateDoc: updateDocFn } = await import('firebase/firestore');
                            const { db: database } = await import('../../firebase');

                            let newProjectStatus: CaseStatus;
                            if (title.includes('site') && (title.includes('visit') || title.includes('inspection'))) {
                                newProjectStatus = CaseStatus.SITE_VISIT;
                            } else if (title.includes('drawing') || title.includes('design')) {
                                newProjectStatus = CaseStatus.DRAWING;
                            } else if (title.includes('quotation') || title.includes('boq')) {
                                newProjectStatus = CaseStatus.BOQ;
                            } else {
                                newProjectStatus = CaseStatus.SITE_VISIT; // Default
                            }

                            console.log('[LeadDetailModal] Updating project CaseStatus to:', newProjectStatus, 'assignedTo:', assigneeId);
                            const projectRef = docRef(database, 'cases', contextId);
                            await updateDocFn(projectRef, {
                                status: newProjectStatus,
                                assignedEngineerId: assigneeId
                            });

                            // Update local state
                            onUpdate({
                                ...currentCase,
                                status: newProjectStatus
                            } as any);
                        } catch (error) {
                            console.error('[LeadDetailModal] Failed to update project status:', error);
                        }
                    }
                    // Note: For projects, the ApprovalsPage handles status updates

                    alert('✅ Mission Deployed Successfully - Status updated!');
                    setIsAddTaskModalOpen(false);
                }}
                initialContextId={currentCase.id}
                initialContextType={currentCase.isProject ? 'project' : 'lead'}
            />
        </>
    );
};

export default LeadDetailModal;
