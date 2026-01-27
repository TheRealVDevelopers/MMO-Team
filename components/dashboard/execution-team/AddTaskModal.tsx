import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon, CalendarIcon, UserIcon, FlagIcon, LinkIcon } from '@heroicons/react/24/outline';
import { formatDate } from 'date-fns';
import { GanttTask, UserRole } from '../../../types';
import { USERS } from '../../../constants';

interface AddTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (task: Partial<GanttTask>) => void;
    currentTaskCount: number;
}

const AddTaskModal: React.FC<AddTaskModalProps> = ({ isOpen, onClose, onSave, currentTaskCount }) => {
    const [title, setTitle] = useState('');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]); // +3 days
    const [assignee, setAssignee] = useState(USERS.filter(u => u.role === UserRole.EXECUTION_TEAM)[0]?.id || '');
    const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
    const [status, setStatus] = useState<GanttTask['status']>('Pending');
    const [description, setDescription] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            name: title,
            start: new Date(startDate),
            end: new Date(endDate),
            assignedTo: assignee,
            status: status,
            progress: 0,
            type: 'task',
            dependencies: [], // Can implement dependency selector later
            notes: description
        });
        resetForm();
    };

    const resetForm = () => {
        setTitle('');
        setStartDate(new Date().toISOString().split('T')[0]);
        setDescription('');
    };

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-xl border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-6">
                        <Dialog.Title className="text-lg font-bold text-gray-900 dark:text-white">
                            Add New Task
                        </Dialog.Title>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Task Title</label>
                            <input
                                type="text"
                                required
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full rounded-lg border-gray-300 dark:bg-slate-700 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="e.g. Electrical wiring first floor"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                                <input
                                    type="date"
                                    required
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full rounded-lg border-gray-300 dark:bg-slate-700 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
                                <input
                                    type="date"
                                    required
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full rounded-lg border-gray-300 dark:bg-slate-700 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assignee</label>
                                <select
                                    value={assignee}
                                    onChange={(e) => setAssignee(e.target.value)}
                                    className="w-full rounded-lg border-gray-300 dark:bg-slate-700 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">Select User</option>
                                    {USERS.map(user => (
                                        <option key={user.id} value={user.id}>{user.name} ({user.role})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                                <select
                                    value={priority}
                                    onChange={(e) => setPriority(e.target.value as any)}
                                    className="w-full rounded-lg border-gray-300 dark:bg-slate-700 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="High">High</option>
                                    <option value="Medium">Medium</option>
                                    <option value="Low">Low</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description / Notes</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full rounded-lg border-gray-300 dark:bg-slate-700 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                                rows={3}
                                placeholder="Add details about this task..."
                            />
                        </div>

                        <div className="pt-4 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-slate-600"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Create Task
                            </button>
                        </div>
                    </form>
                </Dialog.Panel>
            </div>
        </Dialog>
    );
};

export default AddTaskModal;
