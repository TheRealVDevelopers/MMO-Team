import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    XMarkIcon, ChevronLeftIcon, ChevronRightIcon, PlusIcon, TrashIcon,
    CalendarIcon, ClockIcon, CurrencyRupeeIcon, UserIcon, DocumentIcon
} from '@heroicons/react/24/outline';
import { Project, GanttTask, PaymentTerm, ExecutionStage, ChecklistItem } from '../../../types';
import { useUsers } from '../../../hooks/useUsers';

interface ProjectEditModalProps {
    project: Project;
    isOpen: boolean;
    onClose: () => void;
    onSave: (project: Project) => void;
    submitLabel?: string;
}

const TABS = [
    { id: 'basic', name: 'Basic Info', icon: DocumentIcon },
    { id: 'timeline', name: 'Timeline & Gantt', icon: CalendarIcon },
    { id: 'team', name: 'Team & Resources', icon: UserIcon },
    { id: 'budget', name: 'Budget & Payments', icon: CurrencyRupeeIcon },
    { id: 'stages', name: 'Execution Stages', icon: ClockIcon }
];

const ProjectEditModal: React.FC<ProjectEditModalProps> = ({ project, isOpen, onClose, onSave, submitLabel }) => {
    const { users } = useUsers();
    const [activeTab, setActiveTab] = useState('basic');
    const [formData, setFormData] = useState<Project>(project);

    // Gantt Tasks State - ✅ Safe null check
    const [ganttTasks, setGanttTasks] = useState<GanttTask[]>(project?.ganttData || []);

    // Payment Terms State - ✅ Safe null check
    const [paymentTerms, setPaymentTerms] = useState<PaymentTerm[]>(project?.paymentTerms || []);

    // Execution Stages State - ✅ Safe null check
    const [executionStages, setExecutionStages] = useState<ExecutionStage[]>(project?.stages || []);

    // Checklists State - ✅ Safe null check
    const [dailyChecklist, setDailyChecklist] = useState<ChecklistItem[]>(project?.checklists?.daily || []);
    const [qualityChecklist, setQualityChecklist] = useState<ChecklistItem[]>(project?.checklists?.quality || []);

    // ✅ Sync state when project prop changes
    useEffect(() => {
        if (!project) return;
        setFormData(project);
        setGanttTasks(project.ganttData || []);
        setPaymentTerms(project.paymentTerms || []);
        setExecutionStages(project.stages || []);
        setDailyChecklist(project.checklists?.daily || []);
        setQualityChecklist(project.checklists?.quality || []);
    }, [project]);

    // ✅ Don't render if closed or no project
    if (!isOpen || !project) return null;

    const handleSave = () => {
        const updatedProject: Project = {
            ...formData,
            ganttData: ganttTasks,
            paymentTerms,
            stages: executionStages,
            checklists: {
                daily: dailyChecklist,
                quality: qualityChecklist
            }
        };
        onSave(updatedProject);
    };

    const addGanttTask = () => {
        const newTask: GanttTask = {
            id: `task_${Date.now()}`,
            name: '',
            start: new Date(),
            end: new Date(),
            progress: 0,
            status: 'Pending',
            type: 'task',
            assignedTo: '',
            resources: [],
            dependencies: []
        };
        setGanttTasks([...ganttTasks, newTask]);
    };

    const updateGanttTask = (taskId: string, updates: Partial<GanttTask>) => {
        setGanttTasks(ganttTasks.map(t => t.id === taskId ? { ...t, ...updates } : t));
    };

    const removeGanttTask = (taskId: string) => {
        setGanttTasks(ganttTasks.filter(t => t.id !== taskId));
    };

    const addPaymentTerm = () => {
        const newTerm: PaymentTerm = {
            id: `payment_${Date.now()}`,
            milestone: '',
            percentage: 0,
            amount: 0,
            status: 'Pending'
        };
        setPaymentTerms([...paymentTerms, newTerm]);
    };

    const updatePaymentTerm = (termId: string, updates: Partial<PaymentTerm>) => {
        setPaymentTerms(paymentTerms.map(t => t.id === termId ? { ...t, ...updates } : t));
    };

    const removePaymentTerm = (termId: string) => {
        setPaymentTerms(paymentTerms.filter(t => t.id !== termId));
    };

    const addExecutionStage = () => {
        const newStage: ExecutionStage = {
            id: `stage_${Date.now()}`,
            name: '',
            deadline: new Date(),
            status: 'Pending'
        };
        setExecutionStages([...executionStages, newStage]);
    };

    const updateExecutionStage = (stageId: string, updates: Partial<ExecutionStage>) => {
        setExecutionStages(executionStages.map(s => s.id === stageId ? { ...s, ...updates } : s));
    };

    const removeExecutionStage = (stageId: string) => {
        setExecutionStages(executionStages.filter(s => s.id !== stageId));
    };

    const addChecklistItem = (type: 'daily' | 'quality') => {
        const newItem: ChecklistItem = {
            id: `checklist_${Date.now()}`,
            text: '',
            completed: false
        };
        if (type === 'daily') {
            setDailyChecklist([...dailyChecklist, newItem]);
        } else {
            setQualityChecklist([...qualityChecklist, newItem]);
        }
    };

    const updateChecklistItem = (type: 'daily' | 'quality', itemId: string, text: string) => {
        if (type === 'daily') {
            setDailyChecklist(dailyChecklist.map(i => i.id === itemId ? { ...i, text } : i));
        } else {
            setQualityChecklist(qualityChecklist.map(i => i.id === itemId ? { ...i, text } : i));
        }
    };

    const removeChecklistItem = (type: 'daily' | 'quality', itemId: string) => {
        if (type === 'daily') {
            setDailyChecklist(dailyChecklist.filter(i => i.id !== itemId));
        } else {
            setQualityChecklist(qualityChecklist.filter(i => i.id !== itemId));
        }
    };

    // ✅ Don't render if closed or no project
    if (!isOpen || !project) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1100] flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col"
                >
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Project</h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{project.projectName}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            <XMarkIcon className="w-6 h-6 text-gray-500" />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900">
                        <div className="flex overflow-x-auto px-6">
                            {TABS.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id
                                        ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                                        }`}
                                >
                                    <tab.icon className="w-4 h-4" />
                                    {tab.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                        {activeTab === 'basic' && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Basic Information</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project Name</label>
                                        <input
                                            type="text"
                                            value={formData.projectName}
                                            onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                                            className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Client Name</label>
                                        <input
                                            type="text"
                                            value={formData.clientName}
                                            onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                                            className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                                        <input
                                            type="date"
                                            value={formData.startDate instanceof Date ? formData.startDate.toISOString().split('T')[0] : ''}
                                            onChange={(e) => setFormData({ ...formData, startDate: new Date(e.target.value) })}
                                            className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
                                        <input
                                            type="date"
                                            value={formData.endDate instanceof Date ? formData.endDate.toISOString().split('T')[0] : ''}
                                            onChange={(e) => setFormData({ ...formData, endDate: new Date(e.target.value) })}
                                            className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Client Address</label>
                                        <textarea
                                            value={formData.clientAddress}
                                            onChange={(e) => setFormData({ ...formData, clientAddress: e.target.value })}
                                            rows={2}
                                            className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Progress (%)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={formData.progress}
                                            onChange={(e) => setFormData({ ...formData, progress: Number(e.target.value) })}
                                            className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                                        <select
                                            value={formData.priority}
                                            onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'High' | 'Medium' | 'Low' })}
                                            className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white"
                                        >
                                            <option value="High">High</option>
                                            <option value="Medium">Medium</option>
                                            <option value="Low">Low</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-md font-bold text-gray-900 dark:text-white mb-3">Daily Checklist</h4>
                                    <div className="space-y-2">
                                        {dailyChecklist.map(item => (
                                            <div key={item.id} className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={item.text}
                                                    onChange={(e) => updateChecklistItem('daily', item.id, e.target.value)}
                                                    placeholder="Checklist item..."
                                                    className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white text-sm"
                                                />
                                                <button
                                                    onClick={() => removeChecklistItem('daily', item.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                                >
                                                    <TrashIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            onClick={() => addChecklistItem('daily')}
                                            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                                        >
                                            <PlusIcon className="w-4 h-4" />
                                            Add Daily Checklist Item
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-md font-bold text-gray-900 dark:text-white mb-3">Quality Checklist</h4>
                                    <div className="space-y-2">
                                        {qualityChecklist.map(item => (
                                            <div key={item.id} className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={item.text}
                                                    onChange={(e) => updateChecklistItem('quality', item.id, e.target.value)}
                                                    placeholder="Quality check..."
                                                    className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white text-sm"
                                                />
                                                <button
                                                    onClick={() => removeChecklistItem('quality', item.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                                >
                                                    <TrashIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            onClick={() => addChecklistItem('quality')}
                                            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                                        >
                                            <PlusIcon className="w-4 h-4" />
                                            Add Quality Checklist Item
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'timeline' && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Gantt Timeline & Tasks</h3>
                                    <button
                                        onClick={addGanttTask}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        <PlusIcon className="w-4 h-4" />
                                        Add Task
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {ganttTasks.map((task, index) => (
                                        <div key={task.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-semibold text-gray-500">Task #{index + 1}</span>
                                                <button
                                                    onClick={() => removeGanttTask(task.id)}
                                                    className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div className="md:col-span-2">
                                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Task Name</label>
                                                    <input
                                                        type="text"
                                                        value={task.name}
                                                        onChange={(e) => updateGanttTask(task.id, { name: e.target.value })}
                                                        placeholder="e.g., Flooring - Living Room"
                                                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Start Date</label>
                                                    <input
                                                        type="date"
                                                        value={task.start instanceof Date ? task.start.toISOString().split('T')[0] : ''}
                                                        onChange={(e) => updateGanttTask(task.id, { start: new Date(e.target.value) })}
                                                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">End Date</label>
                                                    <input
                                                        type="date"
                                                        value={task.end instanceof Date ? task.end.toISOString().split('T')[0] : ''}
                                                        onChange={(e) => updateGanttTask(task.id, { end: new Date(e.target.value) })}
                                                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Assigned To</label>
                                                    <select
                                                        value={task.assignedTo || ''}
                                                        onChange={(e) => updateGanttTask(task.id, { assignedTo: e.target.value })}
                                                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white text-sm"
                                                    >
                                                        <option value="">Select Team Member</option>
                                                        {users.map(user => (
                                                            <option key={user.id} value={user.id}>{user.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Status</label>
                                                    <select
                                                        value={task.status}
                                                        onChange={(e) => updateGanttTask(task.id, { status: e.target.value as any })}
                                                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white text-sm"
                                                    >
                                                        <option value="Pending">Pending</option>
                                                        <option value="In Progress">In Progress</option>
                                                        <option value="Completed">Completed</option>
                                                        <option value="Delayed">Delayed</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Progress (%)</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        value={task.progress}
                                                        onChange={(e) => updateGanttTask(task.id, { progress: Number(e.target.value) })}
                                                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white text-sm"
                                                    />
                                                </div>
                                                <div className="md:col-span-2">
                                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Notes</label>
                                                    <textarea
                                                        value={task.notes || ''}
                                                        onChange={(e) => updateGanttTask(task.id, { notes: e.target.value })}
                                                        rows={2}
                                                        placeholder="Additional details..."
                                                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white text-sm"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {ganttTasks.length === 0 && (
                                        <div className="text-center py-12 text-gray-500">
                                            <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                            <p>No tasks added yet. Click "Add Task" to create timeline.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'team' && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Team Composition</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Execution Lead</label>
                                        <select
                                            value={formData.projectHeadId || ''}
                                            onChange={(e) => setFormData({ ...formData, projectHeadId: e.target.value })}
                                            className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white"
                                        >
                                            <option value="">Select Execution Lead</option>
                                            {users.filter(u => u.role === 'Execution Team' || u.role === 'Project Head').map(user => (
                                                <option key={user.id} value={user.id}>{user.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Site Engineer</label>
                                        <select
                                            value={formData.assignedTeam?.site_engineer || ''}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                assignedTeam: { ...formData.assignedTeam, site_engineer: e.target.value }
                                            })}
                                            className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white"
                                        >
                                            <option value="">Select Site Engineer</option>
                                            {users.filter(u => u.role === 'Site Engineer').map(user => (
                                                <option key={user.id} value={user.id}>{user.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Drawing Team</label>
                                        <select
                                            value={formData.assignedTeam?.drawing || ''}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                assignedTeam: { ...formData.assignedTeam, drawing: e.target.value }
                                            })}
                                            className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white"
                                        >
                                            <option value="">Select Drawing Team Member</option>
                                            {users.filter(u => u.role === 'Drawing Team').map(user => (
                                                <option key={user.id} value={user.id}>{user.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quotation Team</label>
                                        <select
                                            value={formData.assignedTeam?.quotation || ''}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                assignedTeam: { ...formData.assignedTeam, quotation: e.target.value }
                                            })}
                                            className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white"
                                        >
                                            <option value="">Select Quotation Team Member</option>
                                            {users.filter(u => u.role === 'Quotation Team').map(user => (
                                                <option key={user.id} value={user.id}>{user.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'budget' && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Budget & Financial Details</h3>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Total Budget</label>
                                        <input
                                            type="number"
                                            value={formData.budget}
                                            onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
                                            className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Advance Paid</label>
                                        <input
                                            type="number"
                                            value={formData.advancePaid}
                                            onChange={(e) => setFormData({ ...formData, advancePaid: Number(e.target.value) })}
                                            className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Total Collected</label>
                                        <input
                                            type="number"
                                            value={formData.totalCollected || 0}
                                            onChange={(e) => setFormData({ ...formData, totalCollected: Number(e.target.value) })}
                                            className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-md font-bold text-gray-900 dark:text-white">Payment Terms</h4>
                                        <button
                                            onClick={addPaymentTerm}
                                            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                                        >
                                            <PlusIcon className="w-4 h-4" />
                                            Add Payment Term
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        {paymentTerms.map((term, index) => (
                                            <div key={term.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs font-semibold text-gray-500">Payment #{index + 1}</span>
                                                    <button
                                                        onClick={() => removePaymentTerm(term.id)}
                                                        className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                                    >
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                                                    <div className="md:col-span-2">
                                                        <input
                                                            type="text"
                                                            value={term.milestone}
                                                            onChange={(e) => updatePaymentTerm(term.id, { milestone: e.target.value })}
                                                            placeholder="Milestone name..."
                                                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white text-sm"
                                                        />
                                                    </div>
                                                    <div>
                                                        <input
                                                            type="number"
                                                            value={term.percentage}
                                                            onChange={(e) => {
                                                                const percentage = Number(e.target.value);
                                                                const amount = (formData.budget * percentage / 100);
                                                                updatePaymentTerm(term.id, { percentage, amount });
                                                            }}
                                                            placeholder="%"
                                                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white text-sm"
                                                        />
                                                    </div>
                                                    <div>
                                                        <input
                                                            type="text"
                                                            value={`₹${term.amount?.toFixed(2) || 0}`}
                                                            readOnly
                                                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white text-sm bg-gray-50 dark:bg-slate-600"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'stages' && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Execution Stages</h3>
                                    <button
                                        onClick={addExecutionStage}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        <PlusIcon className="w-4 h-4" />
                                        Add Stage
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {executionStages.map((stage, index) => (
                                        <div key={stage.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-semibold text-gray-500">Stage #{index + 1}</span>
                                                <button
                                                    onClick={() => removeExecutionStage(stage.id)}
                                                    className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div className="md:col-span-2">
                                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Stage Name</label>
                                                    <input
                                                        type="text"
                                                        value={stage.name}
                                                        onChange={(e) => updateExecutionStage(stage.id, { name: e.target.value })}
                                                        placeholder="e.g., Phase 1: Foundation"
                                                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Deadline</label>
                                                    <input
                                                        type="date"
                                                        value={stage.deadline instanceof Date ? stage.deadline.toISOString().split('T')[0] : ''}
                                                        onChange={(e) => updateExecutionStage(stage.id, { deadline: new Date(e.target.value) })}
                                                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Status</label>
                                                    <select
                                                        value={stage.status}
                                                        onChange={(e) => updateExecutionStage(stage.id, { status: e.target.value as any })}
                                                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white text-sm"
                                                    >
                                                        <option value="Pending">Pending</option>
                                                        <option value="In Progress">In Progress</option>
                                                        <option value="Completed">Completed</option>
                                                    </select>
                                                </div>
                                                <div className="md:col-span-2">
                                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Description</label>
                                                    <textarea
                                                        value={stage.description || ''}
                                                        onChange={(e) => updateExecutionStage(stage.id, { description: e.target.value })}
                                                        rows={2}
                                                        placeholder="Detailed scope..."
                                                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white text-sm"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {executionStages.length === 0 && (
                                        <div className="text-center py-12 text-gray-500">
                                            <ClockIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                            <p>No stages added yet. Click "Add Stage" to define execution phases.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-3 bg-gray-50 dark:bg-slate-900">
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-lg shadow-blue-200 dark:shadow-none"
                        >
                            {submitLabel || 'Save Changes'}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ProjectEditModal;
