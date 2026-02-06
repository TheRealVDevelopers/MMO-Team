import React, { useState, useMemo } from 'react';
import Modal from '../../shared/Modal';
import { User, Lead, ProjectStatus } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { useProjects } from '../../../hooks/useProjects';
import { updateLead } from '../../../hooks/useLeads';
import { PrimaryButton, SecondaryButton } from '../shared/DashboardUI';
import { CalendarIcon, UserCircleIcon, MapPinIcon } from '@heroicons/react/24/outline';

interface ScheduleVisitModalProps {
    isOpen: boolean;
    onClose: () => void;
    lead: Lead;
    users: User[];
}

const ScheduleVisitModal: React.FC<ScheduleVisitModalProps> = ({ isOpen, onClose, lead, users }) => {
    const { currentUser } = useAuth();
    const { addProject } = useProjects();

    // Filter for Drawing Team or Site Engineers
    const eligibleAssignees = useMemo(() =>
        users.filter(u => u.role === 'Drawing Team' || u.role === 'Site Engineer'),
        [users]);

    const [visitDate, setVisitDate] = useState<string>('');
    const [visitTime, setVisitTime] = useState<string>('10:00');
    const [assigneeId, setAssigneeId] = useState<string>('');
    const [notes, setNotes] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!visitDate || !assigneeId) return;

        setIsSubmitting(true);
        try {
            const visitDateTime = new Date(`${visitDate}T${visitTime}`);
            const assignee = users.find(u => u.id === assigneeId);

            // 1. Create Project in PENDING_EXECUTION_APPROVAL state (ENFORCE WORKFLOW)
            const newProject = {
                clientName: lead.clientName,
                projectName: lead.projectName,
                status: ProjectStatus.PENDING_EXECUTION_APPROVAL, // ✅ ENFORCE: Must go through execution approval first
                priority: lead.priority || 'Medium',
                budget: lead.value,
                advancePaid: 0,
                clientAddress: lead.clientMobile, // Fallback, should use address if available
                clientContact: { name: lead.clientName, phone: lead.clientMobile },
                progress: 0,
                assignedTeam: {
                    drawing: assignee?.role === 'Drawing Team' ? assigneeId : undefined,
                    site_engineer: assignee?.role === 'Site Engineer' ? assigneeId : undefined,
                },
                milestones: [],
                startDate: new Date(),
                endDate: new Date(new Date().setDate(new Date().getDate() + 30)), // Approx 1 month
                convertedFromLeadId: lead.id,
                conversionDate: new Date(),
                siteInspectionDate: visitDateTime, // Predicted date
                salespersonId: lead.assignedTo || currentUser?.id,
            };

            await addProject(newProject as any);

            // 2. Update Lead Status
            await updateLead(lead.id, {
                status: 'Site Visit Scheduled' as any, // Enum mapping might be string
                tasks: {
                    ...lead.tasks,
                    siteVisits: [...(lead.tasks?.siteVisits || []), `Scheduled for ${visitDateTime.toLocaleString()}`]
                }
            });

            alert('Site Visit Scheduled & Project Created!');
            onClose();

        } catch (error) {
            console.error('Error scheduling visit:', error);
            alert('Failed to schedule visit. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Schedule Site Visit">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg flex items-start gap-3">
                    <MapPinIcon className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                        <h4 className="font-bold text-blue-900 text-sm">{lead.projectName}</h4>
                        <p className="text-xs text-blue-700">{lead.clientName} • {lead.clientMobile}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Date</label>
                        <input
                            type="date"
                            required
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                            value={visitDate}
                            onChange={e => setVisitDate(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Time</label>
                        <input
                            type="time"
                            required
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                            value={visitTime}
                            onChange={e => setVisitTime(e.target.value)}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Assign To (Drawing Team / Site Eng)</label>
                    <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-md p-2">
                        {eligibleAssignees.map(user => (
                            <label key={user.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                                <input
                                    type="radio"
                                    name="assignee"
                                    value={user.id}
                                    checked={assigneeId === user.id}
                                    onChange={() => setAssigneeId(user.id)}
                                    className="text-primary focus:ring-primary"
                                />
                                <div className="flex items-center gap-2">
                                    {user.avatar ? (
                                        <img src={user.avatar} className="w-6 h-6 rounded-full" />
                                    ) : (
                                        <UserCircleIcon className="w-6 h-6 text-gray-400" />
                                    )}
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">{user.name}</p>
                                        <p className="text-[10px] text-gray-500">{user.role}</p>
                                    </div>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Notes / Instructions</label>
                    <textarea
                        rows={3}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                        placeholder="Key access details, measurements to focus on, etc."
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                    />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <SecondaryButton onClick={onClose} type="button">Cancel</SecondaryButton>
                    <PrimaryButton type="submit" disabled={isSubmitting || !visitDate || !assigneeId}>
                        {isSubmitting ? 'Scheduling...' : 'Confirm Schedule'}
                    </PrimaryButton>
                </div>
            </form>
        </Modal>
    );
};

export default ScheduleVisitModal;
