import React, { useMemo, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useMyDayTasks, updateTask } from '../../../hooks/useMyDayTasks';
import { Task, TaskStatus, UserRole } from '../../../types';
import { ClockIcon, CheckCircleIcon, PlayIcon } from '../../icons/IconComponents';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../../firebase';
import { safeDate, safeDateTime } from '../../../constants';
import { handleNotificationClick } from '../../../services/notificationRouting';

interface AdminTaskRequestsProps {
    onNavigateToProject?: (caseId: string, tab?: string) => void;
}

const AdminTaskRequests: React.FC<AdminTaskRequestsProps> = ({ onNavigateToProject }) => {
    const { currentUser } = useAuth();
    const [allTasks, setAllTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch all tasks (not just current user's tasks)
    React.useEffect(() => {
        if (!db || !currentUser) return;

        const tasksRef = collection(db, 'myDayTasks');

        // Query for tasks created by current user or tasks they should see
        const q = query(
            tasksRef,
            where('createdBy', '==', currentUser.id)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const taskList: Task[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                taskList.push({
                    ...data,
                    id: doc.id,
                    createdAt: data.createdAt?.toDate?.() || new Date(),
                    dueAt: data.dueAt?.toDate?.() || undefined,
                    completedAt: data.completedAt?.toDate?.() || undefined,
                    startedAt: data.startedAt?.toDate?.() || undefined,
                    acknowledgedAt: data.acknowledgedAt?.toDate?.() || undefined,
                } as Task);
            });
            setAllTasks(taskList);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    // Filter tasks into assigned/ongoing and completed
    const { assignedTasks, completedTasks } = useMemo(() => {
        const assigned = allTasks.filter(task =>
            task.status === TaskStatus.ASSIGNED ||
            task.status === TaskStatus.ONGOING
        ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        const completed = allTasks.filter(task =>
            task.status === TaskStatus.COMPLETED
        ).sort((a, b) => new Date(b.completedAt || b.createdAt).getTime() - new Date(a.completedAt || a.createdAt).getTime());

        return { assignedTasks: assigned, completedTasks: completed };
    }, [allTasks]);

    const getStatusBadge = (status: TaskStatus) => {
        switch (status) {
            case TaskStatus.ASSIGNED:
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                        <ClockIcon className="w-3.5 h-3.5" />
                        ASSIGNED
                    </span>
                );
            case TaskStatus.ONGOING:
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">
                        <PlayIcon className="w-3.5 h-3.5" />
                        ONGOING
                    </span>
                );
            case TaskStatus.COMPLETED:
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                        <CheckCircleIcon className="w-3.5 h-3.5" />
                        COMPLETED
                    </span>
                );
            default:
                return null;
        }
    };

    const handleViewTask = (task: Task) => {
        if (task.caseId && onNavigateToProject) {
            // Determine which tab to open based on task type
            const tabMap: Record<string, string> = {
                'Quotation': 'quotations',
                'Drawing': 'drawings',
                'BOQ': 'boq',
                'Site Visit': 'overview',
                'Procurement': 'materials',
                'Execution': 'tasks',
            };

            const tab = task.taskType ? tabMap[task.taskType] || 'overview' : 'overview';
            onNavigateToProject(task.caseId, tab);
        } else {
            alert('⚠️ This task is not linked to a project.');
        }
    };

    const handleAcknowledge = async (task: Task) => {
        if (!currentUser) return;

        if (task.status !== TaskStatus.COMPLETED) {
            alert('⚠️ This task is not completed yet.');
            return;
        }

        if (confirm(`✅ Acknowledge this completed task?\n\n"${task.title}"\n\nCompleted by: ${task.assignedToName}\n\nThis will mark the task as acknowledged and remove it from your view.`)) {
            try {
                await updateTask(task.id, {
                    status: TaskStatus.ACKNOWLEDGED,
                    acknowledgedBy: currentUser.id,
                    acknowledgedByName: currentUser.name,
                    acknowledgedAt: new Date(),
                });
                alert('✅ Task acknowledged successfully!');
            } catch (error) {
                console.error('Error acknowledging task:', error);
                alert('❌ Failed to acknowledge task. Please try again.');
            }
        }
    };

    // Local formatters removed in favor of global safe helpers

    if (!currentUser) {
        return <div className="p-6">Loading...</div>;
    }

    const isAdmin = currentUser.role === UserRole.SUPER_ADMIN || currentUser.role === UserRole.SALES_GENERAL_MANAGER;

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-text-primary mb-2">
                    Task Requests
                </h1>
                <p className="text-text-secondary">
                    Manage tasks you've assigned to team members
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                    <div className="text-3xl font-bold text-orange-700">
                        {assignedTasks.length}
                    </div>
                    <div className="text-sm text-orange-600 font-medium mt-1">
                        Assigned / Ongoing Tasks
                    </div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <div className="text-3xl font-bold text-green-700">
                        {completedTasks.length}
                    </div>
                    <div className="text-sm text-green-600 font-medium mt-1">
                        Completed Tasks (Awaiting Review)
                    </div>
                </div>
            </div>

            {/* Assigned Tasks Section */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-1 h-6 bg-orange-500 rounded-full"></div>
                    <h2 className="text-2xl font-bold text-text-primary">
                        Assigned Tasks
                    </h2>
                    <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold">
                        {assignedTasks.length}
                    </span>
                </div>

                <div className="space-y-4">
                    {assignedTasks.length === 0 ? (
                        <div className="bg-surface rounded-xl border border-border p-8 text-center">
                            <div className="text-3xl mb-3">✅</div>
                            <p className="text-text-secondary">
                                No assigned or ongoing tasks
                            </p>
                        </div>
                    ) : (
                        assignedTasks.map(task => (
                            <div
                                key={task.id}
                                className="bg-surface rounded-xl border border-border p-5 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            {getStatusBadge(task.status)}
                                            {task.priority === 'High' && (
                                                <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-semibold">
                                                    HIGH PRIORITY
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="text-lg font-bold text-text-primary mb-1">
                                            {task.title}
                                        </h3>
                                        <p className="text-text-secondary text-sm">
                                            {task.description || 'No description'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleViewTask(task)}
                                        className="ml-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium flex items-center gap-2"
                                    >
                                        👁️ View Project
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-3 border-t border-border text-sm">
                                    <div>
                                        <div className="text-xs text-text-tertiary font-medium mb-1">ASSIGNED TO</div>
                                        <div className="font-semibold text-text-primary">{task.assignedToName || 'N/A'}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-text-tertiary font-medium mb-1">PROJECT</div>
                                        <div className="font-semibold text-text-primary">{task.targetName || 'N/A'}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-text-tertiary font-medium mb-1">TASK TYPE</div>
                                        <div className="font-semibold text-text-primary">{task.taskType || 'General'}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-text-tertiary font-medium mb-1">DUE DATE</div>
                                        <div className="font-semibold text-text-primary">{safeDate(task.dueAt || task.deadline)}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-text-tertiary font-medium mb-1">CREATED</div>
                                        <div className="font-semibold text-text-primary">{safeDate(task.createdAt)}</div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Completed Tasks Section */}
            <div>
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-1 h-6 bg-green-500 rounded-full"></div>
                    <h2 className="text-2xl font-bold text-text-primary">
                        Completed Tasks
                    </h2>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                        {completedTasks.length}
                    </span>
                </div>

                <div className="space-y-4">
                    {completedTasks.length === 0 ? (
                        <div className="bg-surface rounded-xl border border-border p-8 text-center">
                            <div className="text-3xl mb-3">📋</div>
                            <p className="text-text-secondary">
                                No completed tasks awaiting review
                            </p>
                        </div>
                    ) : (
                        completedTasks.map(task => (
                            <div
                                key={task.id}
                                className="bg-surface rounded-xl border-2 border-green-200 p-5 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            {getStatusBadge(task.status)}
                                            <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-semibold flex items-center gap-1.5">
                                                <CheckCircleIcon className="w-3.5 h-3.5" />
                                                Completed by {task.assignedToName}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-bold text-text-primary mb-1">
                                            {task.title}
                                        </h3>
                                        <p className="text-text-secondary text-sm">
                                            {task.description || 'No description'}
                                        </p>
                                    </div>
                                    <div className="ml-4 flex gap-2">
                                        <button
                                            onClick={() => handleViewTask(task)}
                                            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium flex items-center gap-2"
                                        >
                                            👁️ Review
                                        </button>
                                        <button
                                            onClick={() => handleAcknowledge(task)}
                                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                                        >
                                            Acknowledge
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-3 border-t border-border text-sm">
                                    <div>
                                        <div className="text-xs text-text-tertiary font-medium mb-1">COMPLETED BY</div>
                                        <div className="font-semibold text-text-primary">{task.assignedToName || 'N/A'}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-text-tertiary font-medium mb-1">PROJECT</div>
                                        <div className="font-semibold text-text-primary">{task.targetName || 'N/A'}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-text-tertiary font-medium mb-1">TASK TYPE</div>
                                        <div className="font-semibold text-text-primary">{task.taskType || 'General'}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-text-tertiary font-medium mb-1">COMPLETED ON</div>
                                        <div className="font-semibold text-green-700">{safeDateTime(task.completedAt)}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-text-tertiary font-medium mb-1">CREATED</div>
                                        <div className="font-semibold text-text-primary">{safeDate(task.createdAt)}</div>
                                    </div>
                                </div>

                                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                                    <p className="text-sm text-green-700 font-medium">
                                        ✔ Task completed - Click "Review" to check the deliverable, then "Acknowledge" to confirm
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminTaskRequests;
