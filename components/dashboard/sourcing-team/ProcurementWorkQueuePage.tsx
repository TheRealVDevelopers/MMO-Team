/**
 * Procurement Work Queue Page
 * Lists PROCUREMENT_AUDIT and PROCUREMENT_BIDDING tasks assigned to the current user.
 * Allows Start/Complete task lifecycle.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { db } from '../../../firebase';
import {
    collectionGroup,
    query,
    where,
    onSnapshot,
    doc,
    updateDoc,
    addDoc,
    collection,
    serverTimestamp,
    Timestamp,
    getDoc,
    getDocs,
} from 'firebase/firestore';
import {
    CaseTask,
    TaskType,
    TaskStatus,
    Case,
} from '../../../types';
import { FIRESTORE_COLLECTIONS } from '../../../constants';
import {
    ClockIcon,
    CheckCircleIcon,
    PlayIcon,
    DocumentTextIcon,
    MagnifyingGlassIcon,
    ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';

interface TaskWithCase extends CaseTask {
    projectName?: string;
    clientName?: string;
}

const ProcurementWorkQueuePage: React.FC<{
    setCurrentPage: (page: string) => void;
}> = ({ setCurrentPage }) => {
    const { currentUser } = useAuth();
    const [tasks, setTasks] = useState<TaskWithCase[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | TaskStatus>('ALL');

    useEffect(() => {
        if (!db || !currentUser?.id) {
            setLoading(false);
            return;
        } // Never pass undefined to where()

        const taskQuery = query(
            collectionGroup(db, FIRESTORE_COLLECTIONS.TASKS),
            where('assignedTo', '==', currentUser.id),
            where('type', 'in', [TaskType.PROCUREMENT_AUDIT, TaskType.PROCUREMENT_BIDDING])
        );

        const unsubscribe = onSnapshot(taskQuery, async (snapshot) => {
            const tasksData: TaskWithCase[] = [];

            for (const taskDoc of snapshot.docs) {
                const taskData = taskDoc.data() as CaseTask;
                let projectName = 'Unknown Project';
                let clientName = 'N/A';

                try {
                    const caseDoc = await getDoc(doc(db, FIRESTORE_COLLECTIONS.CASES, taskData.caseId));
                    if (caseDoc.exists()) {
                        const caseData = caseDoc.data() as Case;
                        projectName = caseData.title || projectName;
                        clientName = caseData.clientName || clientName;
                    }
                } catch {
                    // ignore
                }

                tasksData.push({
                    ...taskData,
                    id: taskDoc.id,
                    projectName,
                    clientName,
                    createdAt: taskData.createdAt instanceof Timestamp
                        ? taskData.createdAt.toDate()
                        : new Date(taskData.createdAt),
                    startedAt: taskData.startedAt instanceof Timestamp
                        ? taskData.startedAt.toDate()
                        : taskData.startedAt ? new Date(taskData.startedAt) : undefined,
                    completedAt: taskData.completedAt instanceof Timestamp
                        ? taskData.completedAt.toDate()
                        : taskData.completedAt ? new Date(taskData.completedAt) : undefined,
                } as TaskWithCase);
            }

            setTasks(tasksData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    const filteredTasks = useMemo(() => {
        let filtered = [...tasks];
        if (statusFilter !== 'ALL') {
            filtered = filtered.filter((t) => t.status === statusFilter);
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (t) =>
                    (t.projectName || '').toLowerCase().includes(q) ||
                    (t.clientName || '').toLowerCase().includes(q)
            );
        }
        return filtered;
    }, [tasks, statusFilter, searchQuery]);

    const taskSummary = useMemo(
        () => ({
            pending: tasks.filter((t) => t.status === TaskStatus.PENDING).length,
            inProgress: tasks.filter((t) => t.status === TaskStatus.STARTED).length,
            completed: tasks.filter((t) => t.status === TaskStatus.COMPLETED).length,
        }),
        [tasks]
    );

    const handleStartTask = async (task: TaskWithCase) => {
        try {
            const taskRef = doc(
                db!,
                FIRESTORE_COLLECTIONS.CASES,
                task.caseId,
                FIRESTORE_COLLECTIONS.TASKS,
                task.id
            );
            await updateDoc(taskRef, {
                status: TaskStatus.STARTED,
                startedAt: serverTimestamp(),
            });
            await addDoc(
                collection(db!, FIRESTORE_COLLECTIONS.CASES, task.caseId, FIRESTORE_COLLECTIONS.ACTIVITIES),
                {
                    caseId: task.caseId,
                    action: `Procurement task started by ${currentUser!.name || currentUser!.email}`,
                    by: currentUser!.id,
                    timestamp: serverTimestamp(),
                }
            );
        } catch (error) {
            console.error('[Procurement Work Queue] Error starting task:', error);
            alert('Failed to start task. Please try again.');
        }
    };

    const handleCompleteTask = async (task: TaskWithCase) => {
        try {
            const taskRef = doc(
                db!,
                FIRESTORE_COLLECTIONS.CASES,
                task.caseId,
                FIRESTORE_COLLECTIONS.TASKS,
                task.id
            );
            await updateDoc(taskRef, {
                status: TaskStatus.COMPLETED,
                completedAt: serverTimestamp(),
            });
            await addDoc(
                collection(db!, FIRESTORE_COLLECTIONS.CASES, task.caseId, FIRESTORE_COLLECTIONS.ACTIVITIES),
                {
                    caseId: task.caseId,
                    action: `Procurement task completed by ${currentUser!.name || currentUser!.email}`,
                    by: currentUser!.id,
                    timestamp: serverTimestamp(),
                }
            );
        } catch (error) {
            console.error('[Procurement Work Queue] Error completing task:', error);
            alert('Failed to complete task. Please try again.');
        }
    };

    const handleOpenAudit = () => setCurrentPage('audit');
    const handleOpenBidding = () => setCurrentPage('bidding');

    if (loading) {
        return (
            <div className="p-8">
                <div className="flex justify-center h-64 items-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4" />
                        <p className="text-gray-600">Loading procurement tasks...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Procurement Work Queue</h1>
                <p className="text-gray-600">Manage your assigned audit and bidding tasks</p>
            </div>

            <div className="bg-white border-2 border-gray-200 rounded-xl p-6 mb-8">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        >
                            <option value="ALL">All Statuses</option>
                            <option value={TaskStatus.PENDING}>Pending</option>
                            <option value={TaskStatus.STARTED}>In Progress</option>
                            <option value={TaskStatus.COMPLETED}>Completed</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                        <div className="relative">
                            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                            <input
                                type="text"
                                placeholder="Search by project or client..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-6 mb-6">
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6">
                    <div className="flex items-center gap-3">
                        <ClockIcon className="w-8 h-8 text-yellow-600" />
                        <div>
                            <p className="text-3xl font-bold text-yellow-900">{taskSummary.pending}</p>
                            <p className="text-sm font-medium text-yellow-700 uppercase">Pending</p>
                        </div>
                    </div>
                </div>
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
                    <div className="flex items-center gap-3">
                        <PlayIcon className="w-8 h-8 text-green-600" />
                        <div>
                            <p className="text-3xl font-bold text-green-900">{taskSummary.inProgress}</p>
                            <p className="text-sm font-medium text-green-700 uppercase">In Progress</p>
                        </div>
                    </div>
                </div>
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                    <div className="flex items-center gap-3">
                        <CheckCircleIcon className="w-8 h-8 text-blue-600" />
                        <div>
                            <p className="text-3xl font-bold text-blue-900">{taskSummary.completed}</p>
                            <p className="text-sm font-medium text-blue-700 uppercase">Completed</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {filteredTasks.length === 0 ? (
                    <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-8 text-center">
                        <DocumentTextIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No procurement tasks assigned</p>
                        <p className="text-sm text-gray-400 mt-2">
                            Quotation audit tasks appear when quotations are submitted for audit.
                        </p>
                    </div>
                ) : (
                    filteredTasks.map((task) => (
                        <ProcurementTaskCard
                            key={task.id}
                            task={task}
                            onStart={handleStartTask}
                            onComplete={handleCompleteTask}
                            onOpenAudit={handleOpenAudit}
                            onOpenBidding={handleOpenBidding}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

const ProcurementTaskCard: React.FC<{
    task: TaskWithCase;
    onStart: (task: TaskWithCase) => void;
    onComplete: (task: TaskWithCase) => void;
    onOpenAudit: () => void;
    onOpenBidding: () => void;
}> = ({ task, onStart, onComplete, onOpenAudit, onOpenBidding }) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
        [TaskStatus.PENDING]: { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', label: 'PENDING' },
        [TaskStatus.STARTED]: { color: 'bg-green-100 text-green-800 border-green-300', label: 'IN PROGRESS' },
        [TaskStatus.COMPLETED]: { color: 'bg-blue-100 text-blue-800 border-blue-300', label: 'COMPLETED' },
    };
    const config = statusConfig[task.status] || statusConfig[TaskStatus.PENDING];
    const isAuditTask = task.type === TaskType.PROCUREMENT_AUDIT;
    const isBiddingTask = task.type === TaskType.PROCUREMENT_BIDDING;

    return (
        <div className="border-2 border-gray-200 rounded-xl p-6 bg-white hover:border-green-400 transition-all">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-xl font-bold text-gray-900">{task.projectName}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${config.color}`}>
                            {config.label}
                        </span>
                        <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">
                            {isAuditTask ? 'Audit' : isBiddingTask ? 'Bidding' : task.type}
                        </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                        <p>
                            <span className="font-medium">Client:</span> {task.clientName}
                        </p>
                        {task.createdAt && (
                            <p>
                                <span className="font-medium">Created:</span>{' '}
                                {task.createdAt.toLocaleDateString()}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex gap-2">
                    {task.status === TaskStatus.PENDING && (
                        <button
                            onClick={() => onStart(task)}
                            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 font-medium"
                        >
                            <PlayIcon className="w-5 h-5" />
                            Start Task
                        </button>
                    )}

                    {task.status === TaskStatus.STARTED && (
                        <>
                            {isAuditTask && (
                                <button
                                    onClick={onOpenAudit}
                                    className="px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:from-green-700 hover:to-teal-700 flex items-center gap-2 font-medium"
                                >
                                    <DocumentTextIcon className="w-5 h-5" />
                                    Open Audit
                                </button>
                            )}
                            {isBiddingTask && (
                                <button
                                    onClick={onOpenBidding}
                                    className="px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:from-green-700 hover:to-teal-700 flex items-center gap-2 font-medium"
                                >
                                    <ArrowTopRightOnSquareIcon className="w-5 h-5" />
                                    Open Bidding
                                </button>
                            )}
                            <button
                                onClick={() => onComplete(task)}
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium"
                            >
                                <CheckCircleIcon className="w-5 h-5" />
                                Complete Task
                            </button>
                        </>
                    )}

                    {task.status === TaskStatus.COMPLETED && (
                        <div className="px-6 py-3 bg-blue-100 text-blue-800 rounded-lg flex items-center gap-2 font-medium">
                            <CheckCircleIcon className="w-5 h-5" />
                            Completed
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProcurementWorkQueuePage;
