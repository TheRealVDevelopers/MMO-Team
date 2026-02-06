import React, { useState } from 'react';
import { XMarkIcon, PlusIcon, FlagIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from './DashboardUI';
import Modal from '../../shared/Modal';
import SmartDateTimePicker from '../../shared/SmartDateTimePicker';
import { db } from '../../../firebase';
import { collection, query, getDocs } from 'firebase/firestore';
import { UserRole } from '../../../types';
import { useProjects } from '../../../hooks/useProjects';
import { useLeads } from '../../../hooks/useLeads';

interface AddTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddTask: (task: {
        title: string;
        priorityOrder: number;
        priority: 'High' | 'Medium' | 'Low';
        deadline?: string;
        assignedTo?: string;
    }) => void;
    existingTaskCount: number;
    currentUser: any; // Pass auth context
    initialTarget?: string; // e.g. "project:123" or "lead:456"
}

const priorityOptions = [
    { value: 'High', label: 'High Priority', color: 'bg-error/10 text-error border-error/30' },
    { value: 'Medium', label: 'Medium Priority', color: 'bg-accent/10 text-accent border-accent/30' },
    { value: 'Low', label: 'Low Priority', color: 'bg-text-secondary/10 text-text-secondary border-text-secondary/30' },
];

const AddTaskModal: React.FC<AddTaskModalProps> = ({ isOpen, onClose, onAddTask, existingTaskCount, currentUser, initialTarget }) => {
    const [title, setTitle] = useState('');
    const [priorityOrder, setPriorityOrder] = useState(existingTaskCount + 1);
    const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
    const [deadline, setDeadline] = useState('');

    // Target Selection State
    const { projects } = useProjects();
    const { leads } = useLeads();
    const [selectedTarget, setSelectedTarget] = useState<string>(initialTarget || '');

    // Assignment State
    const [assignedTo, setAssignedTo] = useState<string>('');
    const [users, setUsers] = useState<{ id: string, name: string, role: string }[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);

    // Check permissions
    const canAssign = currentUser?.role === UserRole.SUPER_ADMIN ||
        currentUser?.role === UserRole.MANAGER ||
        currentUser?.role === UserRole.SALES_GENERAL_MANAGER;

    React.useEffect(() => {
        if (isOpen && canAssign && users.length === 0) {
            const fetchUsers = async () => {
                setIsLoadingUsers(true);
                try {
                    const q = query(collection(db, 'staffUsers'));
                    const snapshot = await getDocs(q);
                    const userData = snapshot.docs.map(doc => ({
                        id: doc.id,
                        name: doc.data().name,
                        role: doc.data().role
                    }));
                    setUsers(userData);
                } catch (error) {
                    console.error("Error fetching users", error);
                } finally {
                    setIsLoadingUsers(false);
                }
            };
            fetchUsers();
        }

        // Update target if initialTarget provided
        if (isOpen && initialTarget) {
            setSelectedTarget(initialTarget);
        }
    }, [isOpen, canAssign, initialTarget]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        // Parse Target
        let targetId: string | undefined = undefined;
        let targetType: 'Lead' | 'Project' | undefined = undefined;
        let targetName: string | undefined = undefined;

        if (selectedTarget) {
            const [type, id] = selectedTarget.split(':');
            if (type === 'project') {
                const project = projects.find(p => p.id === id);
                if (project) {
                    targetId = project.id;
                    targetType = 'Project';
                    targetName = project.projectName;
                }
            } else if (type === 'lead') {
                const lead = leads.find(l => l.id === id);
                if (lead) {
                    targetId = lead.id;
                    targetType = 'Lead';
                    targetName = lead.clientName; // Or project name if available
                }
            }
        }

        onAddTask({
            title: title.trim(),
            priorityOrder,
            priority,
            deadline: deadline || undefined,
            assignedTo: canAssign && assignedTo ? assignedTo : undefined,
            targetId,
            targetType,
            targetName
        } as any); // Type cast for now, will update interface in next step if needed

        // Reset form
        setTitle('');
        setPriorityOrder(existingTaskCount + 2);
        setPriority('Medium');
        setDeadline('');
        setAssignedTo('');
        setSelectedTarget('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Add New Task"
            size="lg"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Task Name */}
                <div>
                    <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-2">
                        Task Name *
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="What do you need to accomplish?"
                        className="w-full px-5 py-4 bg-background border border-border rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-text-primary placeholder:text-text-tertiary"
                        autoFocus
                    />
                </div>

                {/* Target Selection (Dynamic) */}
                <div>
                    <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-2">
                        Select Target (Optional)
                    </label>
                    <div className="relative">
                        <select
                            value={selectedTarget}
                            onChange={(e) => setSelectedTarget(e.target.value)}
                            className="w-full px-5 py-4 bg-background border border-border rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-text-primary appearance-none cursor-pointer"
                        >
                            <option value="">General Task (No specific target)</option>

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
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Assignment Dropdown (Privileged) */}
                {canAssign && (
                    <div>
                        <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-2">
                            Assign To (Optional)
                        </label>
                        <select
                            value={assignedTo}
                            onChange={(e) => setAssignedTo(e.target.value)}
                            className="w-full px-5 py-4 bg-background border border-border rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-text-primary appearance-none cursor-pointer"
                            disabled={isLoadingUsers}
                        >
                            <option value="">Myself ({currentUser?.name})</option>
                            {users.map(user => (
                                <option key={user.id} value={user.id}>
                                    {user.name} ({user.role})
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Priority Order */}
                <div>
                    <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-2">
                        <FlagIcon className="w-4 h-4 inline mr-2" />
                        Execution Order
                    </label>
                    <div className="flex items-center gap-3">
                        {[1, 2, 3, 4, 5].map((num) => (
                            <button
                                key={num}
                                type="button"
                                onClick={() => setPriorityOrder(num)}
                                className={cn(
                                    "w-12 h-12 rounded-xl font-bold text-lg transition-all border",
                                    priorityOrder === num
                                        ? "bg-primary text-white border-primary shadow-lg shadow-primary/30"
                                        : "bg-background text-text-secondary border-border hover:border-primary hover:text-primary"
                                )}
                            >
                                {num}
                            </button>
                        ))}
                        <span className="text-sm text-text-tertiary ml-2">
                            {priorityOrder === 1 ? '1st' : priorityOrder === 2 ? '2nd' : priorityOrder === 3 ? '3rd' : `${priorityOrder}th`} priority
                        </span>
                    </div>
                </div>

                {/* Priority Level */}
                <div>
                    <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-2">
                        Priority Level
                    </label>
                    <div className="flex gap-3">
                        {priorityOptions.map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => setPriority(opt.value as 'High' | 'Medium' | 'Low')}
                                className={cn(
                                    "flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all border",
                                    priority === opt.value
                                        ? opt.color + " ring-2 ring-offset-2 ring-current"
                                        : "bg-background text-text-secondary border-border hover:bg-subtle-background"
                                )}
                            >
                                {opt.label.split(' ')[0]}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Deadline */}
                <div>
                    <SmartDateTimePicker
                        label="Deadline"
                        value={deadline}
                        onChange={setDeadline}
                        required
                    />
                    <p className="text-xs text-error mt-2">
                        ⚠️ Tasks past deadline will be marked with a RED FLAG
                    </p>
                </div>

                {/* Actions */}
                <div className="flex gap-4 pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-4 px-6 rounded-2xl font-bold text-text-secondary bg-background border border-border hover:bg-subtle-background transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={!title.trim() || !deadline}
                        className={cn(
                            "flex-1 py-4 px-6 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all",
                            title.trim() && deadline
                                ? "bg-primary text-white hover:bg-secondary shadow-lg shadow-primary/30"
                                : "bg-border text-text-tertiary cursor-not-allowed"
                        )}
                    >
                        <PlusIcon className="w-5 h-5" />
                        Add Task
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default AddTaskModal;
