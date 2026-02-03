import React, { useState, useMemo, useEffect } from 'react';
import Modal from '../../shared/Modal';
import { UserRole, Lead, User } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { BanknotesIcon, BuildingOfficeIcon, TagIcon, UserCircleIcon, CheckCircleIcon, CalendarDaysIcon, PencilSquareIcon } from '../../icons/IconComponents';
import SmartDateTimePicker from '../../shared/SmartDateTimePicker';

interface AddNewLeadModalProps {
    isOpen: boolean;
    onClose: () => void;
    users: User[];
    onAddLead: (
        newLeadData: Omit<Lead, 'id' | 'status' | 'inquiryDate' | 'history' | 'lastContacted'>,
        reminder?: { date: string; notes: string }
    ) => void;
}

const AddNewLeadModal: React.FC<AddNewLeadModalProps> = ({ isOpen, onClose, users, onAddLead }) => {
    const { currentUser } = useAuth();
    const salesTeam = useMemo(() => users.filter(u => u.role === UserRole.SALES_TEAM_MEMBER), [users]);

    const initialFormData = {
        clientName: '',
        clientEmail: '',
        clientMobile: '',
        projectName: '',
        value: '',
        source: '',
        assignedTo: '',
        priority: 'Medium' as 'High' | 'Medium' | 'Low',
        reminderDate: '',
        reminderNotes: '',
    };

    const [formData, setFormData] = useState(initialFormData);

    // Set default assignedTo when modal opens or user changes
    useEffect(() => {
        if (isOpen && currentUser) {
            if (currentUser.role === UserRole.SALES_TEAM_MEMBER) {
                setFormData(prev => ({ ...prev, assignedTo: currentUser.id }));
            } else {
                setFormData(prev => ({ ...prev, assignedTo: salesTeam[0]?.id || '' }));
            }
        }
    }, [isOpen, currentUser, salesTeam]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const { clientName, clientEmail, clientMobile, projectName, value, assignedTo, reminderDate, reminderNotes } = formData;

        // Strict Validation
        if (!clientName || !clientEmail || !clientMobile || !projectName || !value || !assignedTo) {
            alert('Please fill all required fields: Name, Email, Mobile, Project, Value, Assigned To.');
            return;
        }

        // separate reminder data
        const { reminderDate: rd, reminderNotes: rn, ...leadData } = formData;

        let reminder;
        if (reminderDate && reminderNotes) {
            reminder = { date: reminderDate, notes: reminderNotes };
        }

        onAddLead({ ...leadData, value: Number(value) } as any, reminder);
        setFormData(initialFormData);
        onClose();
    };

    const priorityOptions: ('High' | 'Medium' | 'Low')[] = ['High', 'Medium', 'Low'];
    const priorityColors = {
        High: 'border-error text-error bg-error/10',
        Medium: 'border-accent text-accent bg-accent/10',
        Low: 'border-slate-400 text-slate-500 bg-slate-400/10'
    }

    // Filter assignable users
    const assignableUsers = currentUser?.role === UserRole.SALES_TEAM_MEMBER
        ? [currentUser] // Only self
        : salesTeam; // Manager can assign to anyone

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create a New Lead" size="lg">
            <form onSubmit={handleSubmit} className="space-y-6">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                        <UserCircleIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                        <input type="text" name="clientName" value={formData.clientName} onChange={handleInputChange} placeholder="Client Name *" required className="pl-10 w-full p-2 border border-border bg-subtle-background rounded-md shadow-sm" />
                    </div>
                    <div className="relative">
                        <BuildingOfficeIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                        <input type="text" name="projectName" value={formData.projectName} onChange={handleInputChange} placeholder="Project Name *" required className="pl-10 w-full p-2 border border-border bg-subtle-background rounded-md shadow-sm" />
                    </div>
                    <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary font-bold">@</div>
                        <input type="email" name="clientEmail" value={formData.clientEmail} onChange={handleInputChange} placeholder="Email Address *" required className="pl-8 w-full p-2 border border-border bg-subtle-background rounded-md shadow-sm" />
                    </div>
                    <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">📞</div>
                        <input type="tel" name="clientMobile" value={formData.clientMobile} onChange={handleInputChange} placeholder="Phone Number *" required className="pl-8 w-full p-2 border border-border bg-subtle-background rounded-md shadow-sm" />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="relative">
                        <BanknotesIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                        <input type="number" name="value" value={formData.value} onChange={handleInputChange} placeholder="Lead Value (INR) *" required className="pl-10 w-full p-2 border border-border bg-subtle-background rounded-md shadow-sm" />
                    </div>
                    <div className="relative">
                        <TagIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                        <input type="text" name="source" value={formData.source} onChange={handleInputChange} placeholder="Lead Source" className="pl-10 w-full p-2 border border-border bg-subtle-background rounded-md shadow-sm" />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">Priority</label>
                    <div className="flex space-x-2">
                        {priorityOptions.map(p => (
                            <button key={p} type="button" onClick={() => setFormData(prev => ({ ...prev, priority: p }))} className={`flex-1 py-2 text-sm font-semibold rounded-md border ${formData.priority === p ? `ring-2 ring-primary ${priorityColors[p]}` : `bg-surface hover:bg-subtle-background ${priorityColors[p]}`}`}>
                                {p}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">Assign To *</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {assignableUsers.map(user => (
                            <button
                                key={user.id}
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, assignedTo: user.id }))}
                                className={`relative text-left p-2 rounded-lg border-2 ${formData.assignedTo === user.id ? 'border-primary bg-primary-subtle-background' : 'border-border bg-surface hover:bg-subtle-background'} ${assignableUsers.length === 1 ? 'cursor-not-allowed opacity-80' : ''}`}
                                disabled={assignableUsers.length === 1}
                            >
                                <div className="flex items-center space-x-2">
                                    <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full" />
                                    <div>
                                        <p className="text-xs font-bold text-text-primary">{user.name}</p>
                                        <p className="text-xs text-text-secondary">{user.role}</p>
                                    </div>
                                </div>
                                {formData.assignedTo === user.id && <CheckCircleIcon className="w-5 h-5 text-primary absolute top-1 right-1" />}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="pt-4 border-t border-border">
                    <label className="block text-sm font-medium text-text-primary mb-2">Add a Reminder (Optional)</label>
                    <div className="space-y-4">
                        <div className="relative">
                            <SmartDateTimePicker
                                value={formData.reminderDate}
                                onChange={(val) => setFormData(prev => ({ ...prev, reminderDate: val }))}
                                placeholder="Select Reminder Date & Time"
                            />
                        </div>
                        <div className="relative">
                            <PencilSquareIcon className="w-5 h-5 absolute left-3 top-3 text-text-secondary" />
                            <textarea name="reminderNotes" value={formData.reminderNotes} onChange={handleInputChange} placeholder="Reminder notes..." rows={2} className="pl-10 w-full p-2 border border-border bg-subtle-background rounded-md shadow-sm" />
                        </div>
                    </div>
                </div>

                <div className="pt-4 flex justify-end space-x-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-text-primary bg-surface border border-border rounded-md hover:bg-subtle-background">Cancel</button>
                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-secondary">Add Lead</button>
                </div>
            </form>
        </Modal>
    );
};

export default AddNewLeadModal;