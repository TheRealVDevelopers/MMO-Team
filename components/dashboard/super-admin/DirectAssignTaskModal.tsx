import React, { useState } from 'react';
import { useUsers } from '../../../hooks/useUsers';
import { useProjects } from '../../../hooks/useProjects';
import { useLeads } from '../../../hooks/useLeads';
import { UserRole, TaskStatus } from '../../../types';
import { cn } from '../shared/DashboardUI';
import { motion, AnimatePresence } from 'framer-motion';
import {
    XMarkIcon,
    UserIcon,
    ClipboardDocumentCheckIcon,
    CalendarDaysIcon,
    BoltIcon,
    ChatBubbleBottomCenterTextIcon
} from '@heroicons/react/24/outline';
import SmartDateTimePicker from '../../shared/SmartDateTimePicker';

import Modal from '../../shared/Modal';

interface DirectAssignTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAssign: (taskData: any) => Promise<void>;
    initialContextId?: string;
    initialContextType?: 'project' | 'lead';
}

const DirectAssignTaskModal: React.FC<DirectAssignTaskModalProps> = ({ isOpen, onClose, onAssign, initialContextId, initialContextType }) => {
    const { users } = useUsers();
    const { projects } = useProjects();
    const { leads } = useLeads();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [assigneeId, setAssigneeId] = useState('');
    const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
    const [deadline, setDeadline] = useState('');
    const [contextType, setContextType] = useState<'project' | 'lead'>(initialContextType || 'project');
    const [contextId, setContextId] = useState(initialContextId || '');
    const [processing, setProcessing] = useState(false);

    // Update state when props change (re-opening modal)
    React.useEffect(() => {
        if (isOpen && initialContextId) {
            setContextId(initialContextId);
            if (initialContextType) setContextType(initialContextType);
        }
    }, [isOpen, initialContextId, initialContextType]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !assigneeId) {
            return;
        }
        if (!deadline || deadline.trim() === '') {
            alert('Please set an Execution Deadline. Deadline is mandatory when assigning a task.');
            return;
        }

        setProcessing(true);
        try {
            const taskData = {
                title,
                description,
                userId: assigneeId,
                status: 'Pending',
                priority,
                deadline,
                date: deadline.split('T')[0],
                timeSpent: 0,
                isPaused: false,
                createdAt: new Date(),
                contextId, // Add Context
                contextType, // Add Context Type
            };
            await onAssign(taskData);
            resetForm();
            onClose();
        } catch (error) {
            console.error('Error assigning task:', error);
            alert('Mission Failure: Failed to assign task.');
        } finally {
            setProcessing(false);
        }
    };

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setAssigneeId('');
        setPriority('Medium');
        setDeadline('');
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Direct Task Assignment"
            size="2xl"
        >
            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                    <ClipboardDocumentCheckIcon className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-tertiary">Mission Control Overwrite</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                    {/* Mission Type Dropdown */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-tertiary px-1 flex items-center gap-2">
                            <BoltIcon className="w-3 h-3 text-primary" />
                            Mission Type
                        </label>
                        <select
                            value={title} // Using title as the value for simplicity, or we can separate missionType
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-subtle-background/30 border border-border rounded-2xl px-5 py-4 text-sm font-medium focus:ring-4 focus:ring-primary/10 transition-all outline-none appearance-none"
                        >
                            <option value="">Select Directive...</option>
                            <option value="Site Inspection">Site Inspection</option>
                            <option value="Start Drawing">Start Drawing</option>
                            <option value="Make Quotation">Make Quotation</option>
                            <option value="Material Verification">Material Verification</option>
                            <option value="Client Meeting">Client Meeting</option>
                            <option value="Custom">Custom Objective</option>
                        </select>
                    </div>

                    {/* Task Title (Custom) */}
                    {title === 'Custom' || !['Site Inspection', 'Start Drawing', 'Make Quotation', 'Material Verification', 'Client Meeting'].includes(title) ? (
                        <div className="space-y-2">
                            <input
                                type="text"
                                value={title === 'Custom' ? '' : title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Enter custom objective..."
                                className="w-full bg-subtle-background/30 border border-border rounded-2xl px-5 py-4 text-sm font-medium focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                required
                            />
                        </div>
                    ) : null}

                    {/* Target Selection (Dynamic) */}
                    <div>
                        <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-2">
                            Select Target (Optional)
                        </label>
                        <div className="relative">
                            <select
                                value={contextId ? `${contextType}:${contextId}` : ''}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (!val) {
                                        setContextId('');
                                        setContextType('project');
                                        return;
                                    }
                                    const [type, id] = val.split(':');
                                    setContextType(type as 'project' | 'lead');
                                    setContextId(id);
                                }}
                                className="w-full px-5 py-4 bg-background border border-border rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-text-primary appearance-none cursor-pointer"
                            >
                                <option value="">General Directive (No specific target)</option>

                                {projects.length > 0 && (
                                    <optgroup label="Active Projects">
                                        {projects.map(project => (
                                            <option key={`project:${project.id}`} value={`project:${project.id}`}>
                                                Project: {project.projectName} ({project.clientName})
                                            </option>
                                        ))}
                                    </optgroup>
                                )}

                                {leads.length > 0 && (
                                    <optgroup label="Active Leads">
                                        {leads.map(lead => (
                                            <option key={`lead:${lead.id}`} value={`lead:${lead.id}`}>
                                                Lead: {lead.clientName} - {lead.projectName}
                                            </option>
                                        ))}
                                    </optgroup>
                                )}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-tertiary">
                                <BoltIcon className="w-5 h-5" />
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-tertiary px-1 flex items-center gap-2">
                            <ChatBubbleBottomCenterTextIcon className="w-3 h-3 text-primary" />
                            Operation Details
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Provide specific instructions for this deployment..."
                            rows={3}
                            className="w-full bg-subtle-background/30 border border-border rounded-2xl px-5 py-4 text-sm font-medium focus:ring-4 focus:ring-primary/10 transition-all outline-none resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Priority */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-tertiary px-1 flex items-center gap-2">
                                Risk Level
                            </label>
                            <div className="flex bg-subtle-background/50 p-1 rounded-2xl border border-border/40">
                                {(['Low', 'Medium', 'High'] as const).map((p) => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => setPriority(p)}
                                        className={cn(
                                            "flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all",
                                            priority === p
                                                ? p === 'High' ? "bg-error text-white shadow-lg shadow-error/20" :
                                                    p === 'Medium' ? "bg-primary text-white shadow-lg shadow-primary/20" :
                                                        "bg-secondary text-white shadow-lg shadow-secondary/20"
                                                : "text-text-tertiary hover:text-text-primary"
                                        )}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Deadline (Mandatory when assigning) */}
                        <div className="space-y-2">
                            <SmartDateTimePicker
                                label="Execution Deadline (Required)"
                                value={deadline}
                                onChange={setDeadline}
                                required
                            />
                            <p className="text-[10px] text-amber-600 font-medium">Deadline is mandatory when assigning a task.</p>
                        </div>
                    </div>

                    {/* Personnel Assignment */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-tertiary px-1 flex items-center gap-2">
                            <UserIcon className="w-3 h-3 text-primary" />
                            Specialist Assignment
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar p-1">
                            {users.map(user => (
                                <button
                                    key={user.id}
                                    type="button"
                                    onClick={() => setAssigneeId(user.id)}
                                    className={cn(
                                        "flex items-center gap-3 p-3 rounded-2xl border transition-all text-left group",
                                        assigneeId === user.id
                                            ? "bg-secondary text-white border-secondary shadow-lg shadow-secondary/10"
                                            : "bg-surface border-border hover:bg-subtle-background hover:border-primary/20"
                                    )}
                                >
                                    <img src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || '')}&background=random`} alt={user.name} className="w-10 h-10 rounded-full border-2 border-white/20 shadow-sm" />
                                    <div className="min-w-0">
                                        <p className="text-xs font-black uppercase tracking-tight truncate">{user.name}</p>
                                        <p className={cn(
                                            "text-[9px] font-bold uppercase tracking-wider opacity-60 truncate",
                                            assigneeId === user.id ? "text-white" : "text-text-tertiary"
                                        )}>
                                            {user.role.replace('_', ' ')}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-5 rounded-2xl border border-border text-[10px] font-black uppercase tracking-widest hover:bg-subtle-background transition-all"
                        disabled={processing}
                    >
                        Abort
                    </button>
                    <button
                        type="submit"
                        disabled={processing || !title || !assigneeId || !deadline}
                        className="p-5 rounded-2xl bg-primary text-white text-[10px] font-black uppercase tracking-widest hover:bg-secondary shadow-xl shadow-primary/20 transition-all disabled:opacity-50"
                    >
                        {processing ? 'Deploying...' : 'Deploy Mission'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default DirectAssignTaskModal;
