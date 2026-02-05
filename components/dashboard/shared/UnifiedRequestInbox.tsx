import React, { useMemo, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useMyDayTasks, updateTask } from '../../../hooks/useMyDayTasks';
import { Task, TaskStatus, UserRole } from '../../../types';
import { ClockIcon, CheckCircleIcon, PlayIcon } from '../../icons/IconComponents';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../../firebase';

interface UnifiedRequestInboxProps {
    onNavigateToProject?: (caseId: string, tab?: string) => void;
}

const UnifiedRequestInbox: React.FC<UnifiedRequestInboxProps> = ({ onNavigateToProject }) => {
    const { currentUser } = useAuth();
    const [allTasks, setAllTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch tasks based on role
    React.useEffect(() => {
        if (!db || !currentUser) return;

        const tasksRef = collection(db, 'myDayTasks');
        let q;

        const isAdmin = currentUser.role === UserRole.SUPER_ADMIN || currentUser.role === UserRole.SALES_GENERAL_MANAGER;

        if (isAdmin) {
            // Admin sees tasks they created
            q = query(tasksRef, where('createdBy', '==', currentUser.id));
        } else {
            // Everyone else sees tasks assigned to them
            // Check both userId (old field) and assignedTo (new field)
            q = query(tasksRef, where('userId', '==', currentUser.id));
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const taskList: Task[] = [];
            console.log('📋 Tasks fetched:', snapshot.size, 'documents');
            snapshot.forEach((doc) => {
                const data = doc.data();
                console.log('Task:', doc.id, 'assignedTo:', data.assignedTo, 'status:', data.status, 'taskType:', data.taskType);
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

    const isAdmin = currentUser?.role === UserRole.SUPER_ADMIN || currentUser?.role === UserRole.SALES_GENERAL_MANAGER;

    // Filter tasks
    const { assignedTasks, ongoingTasks, completedTasks } = useMemo(() => {
        const assigned = allTasks.filter(t => t.status === TaskStatus.ASSIGNED);
        const ongoing = allTasks.filter(t => t.status === TaskStatus.ONGOING);
        const completed = allTasks.filter(t => t.status === TaskStatus.COMPLETED);

        return { 
            assignedTasks: assigned.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
            ongoingTasks: ongoing.sort((a, b) => new Date(b.startedAt || b.createdAt).getTime() - new Date(a.startedAt || a.createdAt).getTime()),
            completedTasks: completed.sort((a, b) => new Date(b.completedAt || b.createdAt).getTime() - new Date(a.completedAt || a.createdAt).getTime())
        };
    }, [allTasks]);

    const getStatusBadge = (status: TaskStatus) => {
        switch (status) {
            case TaskStatus.ASSIGNED:
                return <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold"><ClockIcon className="w-3.5 h-3.5" />ASSIGNED</span>;
            case TaskStatus.ONGOING:
                return <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold"><PlayIcon className="w-3.5 h-3.5" />ONGOING</span>;
            case TaskStatus.COMPLETED:
                return <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold"><CheckCircleIcon className="w-3.5 h-3.5" />COMPLETED</span>;
            default:
                return null;
        }
    };

    const handleStartTask = async (task: Task) => {
        try {
            await updateTask(task.id, { status: TaskStatus.ONGOING, startedAt: new Date() });
            alert('✅ Task started!');
        } catch (error) {
            console.error('Error starting task:', error);
            alert('❌ Failed to start task');
        }
    };

    const handleCompleteTask = async (task: Task) => {
        try {
            await updateTask(task.id, { status: TaskStatus.COMPLETED, completedAt: new Date() });
            alert('✅ Task marked complete! Creator has been notified.');
        } catch (error) {
            console.error('Error completing task:', error);
            alert('❌ Failed to complete task');
        }
    };

    const handleAcknowledge = async (task: Task) => {
        if (confirm(`✅ Acknowledge this completed task?\n\n"${task.title}"\n\nThis will remove it from your view.`)) {
            try {
                await updateTask(task.id, {
                    status: TaskStatus.ACKNOWLEDGED,
                    acknowledgedBy: currentUser!.id,
                    acknowledgedByName: currentUser!.name,
                    acknowledgedAt: new Date(),
                });
                alert('✅ Task acknowledged!');
            } catch (error) {
                console.error('Error acknowledging task:', error);
                alert('❌ Failed to acknowledge task');
            }
        }
    };

    const handleViewProject = (task: Task) => {
        if (task.caseId && onNavigateToProject) {
            const tabMap: Record<string, string> = {
                'Quotation': 'quotations',
                'Drawing': 'drawings',
                'BOQ': 'boq',
                'Site Visit': 'overview',
            };
            const tab = task.taskType ? tabMap[task.taskType] || 'overview' : 'overview';
            onNavigateToProject(task.caseId, tab);
        }
    };

    const formatDate = (date: Date | string | undefined) => {
        if (!date) return 'N/A';
        const d = typeof date === 'string' ? new Date(date) : date;
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    if (!currentUser) return <div className="p-6">Loading...</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-text-primary mb-2">Request Inbox</h1>
                <p className="text-text-secondary">
                    {isAdmin ? 'Tasks you assigned to team members' : 'Tasks assigned to you'}
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="text-3xl font-bold text-blue-700">{assignedTasks.length}</div>
                    <div className="text-sm text-blue-600 font-medium mt-1">Assigned</div>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                    <div className="text-3xl font-bold text-orange-700">{ongoingTasks.length}</div>
                    <div className="text-sm text-orange-600 font-medium mt-1">Ongoing</div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <div className="text-3xl font-bold text-green-700">{completedTasks.length}</div>
                    <div className="text-sm text-green-600 font-medium mt-1">Completed</div>
                </div>
            </div>

            {/* Ongoing Section (Assigned + Ongoing) */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-1 h-6 bg-orange-500 rounded-full"></div>
                    <h2 className="text-2xl font-bold text-text-primary">Ongoing Projects</h2>
                    <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold">
                        {assignedTasks.length + ongoingTasks.length}
                    </span>
                </div>

                <div className="space-y-4">
                    {[...assignedTasks, ...ongoingTasks].length === 0 ? (
                        <div className="bg-surface rounded-xl border border-border p-8 text-center">
                            <div className="text-3xl mb-3">✅</div>
                            <p className="text-text-secondary">No ongoing tasks</p>
                        </div>
                    ) : (
                        [...assignedTasks, ...ongoingTasks].map(task => (
                            <div key={task.id} className="bg-surface rounded-xl border border-border p-5 hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            {getStatusBadge(task.status)}
                                            {task.priority === 'High' && (
                                                <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-semibold">HIGH</span>
                                            )}
                                        </div>
                                        <h3 className="text-lg font-bold text-text-primary mb-1">{task.title}</h3>
                                        <p className="text-text-secondary text-sm">{task.description || 'No description'}</p>
                                    </div>
                                    <div className="ml-4">
                                        {!isAdmin && task.status === TaskStatus.ASSIGNED && (
                                            <button onClick={() => handleStartTask(task)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">Start</button>
                                        )}
                                        {!isAdmin && task.status === TaskStatus.ONGOING && (
                                            <button onClick={() => handleCompleteTask(task)} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">Complete</button>
                                        )}
                                        {isAdmin && (
                                            <button onClick={() => handleViewProject(task)} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 text-sm font-medium">👁️ View</button>
                                        )}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-border text-sm">
                                    <div>
                                        <div className="text-xs text-text-tertiary font-medium mb-1">{isAdmin ? 'ASSIGNED TO' : 'REQUESTED BY'}</div>
                                        <div className="font-semibold text-text-primary">{isAdmin ? task.assignedToName : task.createdByName}</div>
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
                                        <div className="font-semibold text-text-primary">{formatDate(task.dueAt || task.deadline)}</div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Completed Section */}
            <div>
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-1 h-6 bg-green-500 rounded-full"></div>
                    <h2 className="text-2xl font-bold text-text-primary">Completed</h2>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">{completedTasks.length}</span>
                </div>
                <div className="space-y-4">
                    {completedTasks.length === 0 ? (
                        <div className="bg-surface rounded-xl border border-border p-8 text-center">
                            <div className="text-3xl mb-3">📋</div>
                            <p className="text-text-secondary">No completed tasks</p>
                        </div>
                    ) : (
                        completedTasks.map(task => (
                            <div key={task.id} className="bg-surface rounded-xl border-2 border-green-200 p-5">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            {getStatusBadge(task.status)}
                                            <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-semibold">✔ By {task.assignedToName}</span>
                                        </div>
                                        <h3 className="text-lg font-bold text-text-primary mb-1">{task.title}</h3>
                                        <p className="text-text-secondary text-sm">{task.description}</p>
                                    </div>
                                    {isAdmin && (
                                        <div className="ml-4 flex gap-2">
                                            <button onClick={() => handleViewProject(task)} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 text-sm font-medium">👁️ Review</button>
                                            <button onClick={() => handleAcknowledge(task)} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">Acknowledge</button>
                                        </div>
                                    )}
                                </div>
                                <div className="text-sm text-green-700 mt-2">✔ Completed on {formatDate(task.completedAt)}</div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default UnifiedRequestInbox;
