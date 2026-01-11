import React, { useState } from 'react';
import { XMarkIcon, PlusIcon, FlagIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from './DashboardUI';
import { db } from '../../../firebase';
import { collection, query, getDocs } from 'firebase/firestore';
import { UserRole } from '../../../types';

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
}

const priorityOptions = [
    { value: 'High', label: 'High Priority', color: 'bg-error/10 text-error border-error/30' },
    { value: 'Medium', label: 'Medium Priority', color: 'bg-accent/10 text-accent border-accent/30' },
    { value: 'Low', label: 'Low Priority', color: 'bg-text-secondary/10 text-text-secondary border-text-secondary/30' },
];

const AddTaskModal: React.FC<AddTaskModalProps> = ({ isOpen, onClose, onAddTask, existingTaskCount, currentUser }) => {
    const [title, setTitle] = useState('');
    const [priorityOrder, setPriorityOrder] = useState(existingTaskCount + 1);
    const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
    const [deadline, setDeadline] = useState('');

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
                    const q = query(collection(db, 'users'));
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
    }, [isOpen, canAssign]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        onAddTask({
            title: title.trim(),
            priorityOrder,
            priority,
            deadline: deadline || undefined,
            assignedTo: canAssign && assignedTo ? assignedTo : undefined
        });

        // Reset form
        setTitle('');
        setPriorityOrder(existingTaskCount + 2);
        setPriority('Medium');
        setDeadline('');
        setAssignedTo('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="bg-surface rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-border"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="px-8 py-6 border-b border-border bg-subtle-background/30">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                                    <PlusIcon className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-serif font-bold text-text-primary">Add New Task</h2>
                                    <p className="text-sm text-text-secondary">Create an objective for today</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-background rounded-xl transition-colors"
                            >
                                <XMarkIcon className="w-6 h-6 text-text-secondary" />
                            </button>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
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
                            <label className="flex items-center gap-2 text-xs font-bold text-text-secondary uppercase tracking-widest mb-2">
                                <CalendarIcon className="w-4 h-4" />
                                Deadline *
                            </label>
                            <input
                                type="datetime-local"
                                value={deadline}
                                onChange={(e) => setDeadline(e.target.value)}
                                className="w-full px-5 py-4 bg-background border border-border rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-text-primary"
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
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default AddTaskModal;
