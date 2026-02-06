import React, { useState } from 'react';
import {
    PlusIcon,
    UserCircleIcon,
    CalendarIcon,
    ClipboardDocumentListIcon,
    CheckCircleIcon,
    ClockIcon
} from '@heroicons/react/24/outline';
import { Project, UserRole, ExecutionTask as ExecutionTaskType } from '../../../types';
import { USERS } from '../../../constants';
import { useAuth } from '../../../context/AuthContext';
import { useExecutionTasks } from '../../../hooks/useExecutionTasks';
import { useProjects } from '../../../hooks/useProjects';
import { useUsers } from '../../../hooks/useUsers';
import { format } from 'date-fns';

type MissionType = 'Site Inspection' | 'Drawing' | 'BOQ' | 'Execution' | 'Installation';

const TaskAssignmentPage: React.FC = () => {
    const { projects } = useProjects();
    const { users } = useUsers();
    const { tasks, loading, addTask, updateTaskStatus } = useExecutionTasks(); // Fetch all tasks
    const [isFormOpen, setIsFormOpen] = useState(false);

    // Form state
    const [selectedProject, setSelectedProject] = useState('');
    const [selectedMember, setSelectedMember] = useState('');
    const [missionType, setMissionType] = useState<MissionType>('Site Inspection');
    const [deadline, setDeadline] = useState('');
    const [instructions, setInstructions] = useState('');

    // Filter team members
    const teamMembers = users.filter(u =>
        u.role === UserRole.SITE_ENGINEER ||
        u.role === UserRole.DRAWING_TEAM ||
        u.role === UserRole.EXECUTION_TEAM
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const project = projects.find(p => p.id === selectedProject);
        const member = users.find(u => u.id === selectedMember);

        if (!project || !member) return;

        try {
            await addTask({
                projectId: selectedProject,
                projectName: project.projectName || 'Unknown Project',
                assignedTo: selectedMember,
                assigneeName: member.name,
                missionType,
                instructions,
                deadline,
                status: 'Pending',
                priority: 'Medium'
            });

            setIsFormOpen(false);
            resetForm();
        } catch (error) {
            console.error('Failed to assign task:', error);
            alert('Failed to assign task. Please try again.');
        }
    };

    const resetForm = () => {
        setSelectedProject('');
        setSelectedMember('');
        setMissionType('Site Inspection');
        setDeadline('');
        setInstructions('');
    };

    const handleStatusUpdate = async (taskId: string, newStatus: ExecutionTaskType['status']) => {
        try {
            await updateTaskStatus(taskId, newStatus);
        } catch (error) {
            console.error('Failed to update task status:', error);
        }
    };

    const getMissionTypeColor = (type: string) => {
        switch (type) {
            case 'Site Inspection': return 'bg-primary-subtle text-primary';
            case 'Drawing': return 'bg-purple-100 text-purple-700';
            case 'BOQ': return 'bg-warning-subtle text-warning';
            case 'Execution': return 'bg-success-subtle text-success';
            case 'Installation': return 'bg-blue-100 text-blue-700';
            default: return 'bg-subtle-background text-text-secondary';
        }
    };

    return (
        <div className="p-6 space-y-6 bg-subtle-background min-h-full">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Task Assignment</h1>
                    <p className="text-sm text-text-secondary mt-1">
                        Assign tasks to Site Engineers and Drawing Team
                    </p>
                </div>
                <button
                    onClick={() => setIsFormOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                    <PlusIcon className="w-5 h-5" />
                    Assign New Task
                </button>
            </div>

            {/* Assignment Form Modal */}
            {isFormOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-surface rounded-2xl border border-border p-6 w-full max-w-lg shadow-xl">
                        <h2 className="text-xl font-bold text-text-primary mb-4">Assign Task</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Project */}
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">Project</label>
                                <select
                                    value={selectedProject}
                                    onChange={(e) => setSelectedProject(e.target.value)}
                                    required
                                    className="w-full p-2.5 border border-border rounded-lg bg-surface text-text-primary"
                                >
                                    <option value="">Select project...</option>
                                    {projects.map(p => (
                                        <option key={p.id} value={p.id}>{p.projectName}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Team Member */}
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">Assign To</label>
                                <select
                                    value={selectedMember}
                                    onChange={(e) => setSelectedMember(e.target.value)}
                                    required
                                    className="w-full p-2.5 border border-border rounded-lg bg-surface text-text-primary"
                                >
                                    <option value="">Select team member...</option>
                                    {teamMembers.map(m => (
                                        <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                                    ))}
                                </select>
                            </div>

                            {/* Mission Type */}
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">Mission Type</label>
                                <select
                                    value={missionType}
                                    onChange={(e) => setMissionType(e.target.value as MissionType)}
                                    className="w-full p-2.5 border border-border rounded-lg bg-surface text-text-primary"
                                >
                                    <option value="Site Inspection">Site Inspection</option>
                                    <option value="Drawing">Drawing</option>
                                    <option value="BOQ">BOQ</option>
                                    <option value="Execution">Execution</option>
                                    <option value="Installation">Installation</option>
                                </select>
                            </div>

                            {/* Deadline */}
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">Deadline</label>
                                <input
                                    type="date"
                                    value={deadline}
                                    onChange={(e) => setDeadline(e.target.value)}
                                    required
                                    className="w-full p-2.5 border border-border rounded-lg bg-surface text-text-primary"
                                >
                                </input>
                            </div>

                            {/* Instructions */}
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">Instructions</label>
                                <textarea
                                    value={instructions}
                                    onChange={(e) => setInstructions(e.target.value)}
                                    rows={3}
                                    required
                                    className="w-full p-2.5 border border-border rounded-lg bg-surface text-text-primary"
                                    placeholder="Describe the task details..."
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => { setIsFormOpen(false); resetForm(); }}
                                    className="px-4 py-2 text-text-secondary hover:bg-subtle-background rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                                >
                                    Assign Task
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Tasks List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-12 text-text-secondary">Loading tasks...</div>
                ) : tasks.length === 0 ? (
                    <div className="text-center py-12 bg-surface rounded-xl border border-border">
                        <ClipboardDocumentListIcon className="w-12 h-12 mx-auto text-text-tertiary mb-3" />
                        <p className="text-text-primary font-medium">No tasks assigned yet</p>
                        <p className="text-sm text-text-secondary">Click "Assign New Task" to get started</p>
                    </div>
                ) : (
                    tasks.map(task => (
                        <div key={task.id} className="bg-surface rounded-xl border border-border p-5">
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="font-semibold text-text-primary">{task.projectName}</h3>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getMissionTypeColor(task.missionType)}`}>
                                            {task.missionType}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${task.status === 'Completed' ? 'bg-success-subtle text-success' :
                                            task.status === 'In Progress' ? 'bg-primary-subtle text-primary' :
                                                'bg-warning-subtle text-warning'
                                            }`}>
                                            {task.status}
                                        </span>
                                    </div>
                                    <p className="text-sm text-text-secondary mb-3">{task.instructions}</p>
                                    <div className="flex items-center gap-4 text-sm text-text-tertiary">
                                        <span className="flex items-center gap-1">
                                            <UserCircleIcon className="w-4 h-4" />
                                            {task.assigneeName}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <CalendarIcon className="w-4 h-4" />
                                            Due: {format(new Date(task.deadline), 'MMM d, yyyy')}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {task.status === 'Pending' && (
                                        <button
                                            onClick={() => handleStatusUpdate(task.id, 'In Progress')}
                                            className="px-3 py-1.5 text-sm border border-primary text-primary rounded-lg hover:bg-primary-subtle"
                                        >
                                            Start
                                        </button>
                                    )}
                                    {task.status === 'In Progress' && (
                                        <button
                                            onClick={() => handleStatusUpdate(task.id, 'Completed')}
                                            className="px-3 py-1.5 text-sm bg-success text-white rounded-lg hover:bg-success/90"
                                        >
                                            Complete
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default TaskAssignmentPage;
