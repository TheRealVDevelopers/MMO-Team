import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { db } from '../../../firebase';
import DrawingCompletionModal from './DrawingCompletionModal';
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
    getDoc
} from 'firebase/firestore';
import {
    CaseTask,
    TaskType,
    TaskStatus,
    Case
} from '../../../types';
import { FIRESTORE_COLLECTIONS } from '../../../constants';
import {
    ClockIcon,
    CheckCircleIcon,
    PlayIcon,
    StopIcon,
    MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { Dialog } from '@headlessui/react';

interface TaskWithCase extends CaseTask {
    projectName?: string;
    clientName?: string;
}

const DrawingWorkQueuePage: React.FC = () => {
    const { currentUser } = useAuth();
    const [siteVisitTasks, setSiteVisitTasks] = useState<TaskWithCase[]>([]);
    const [drawingTasks, setDrawingTasks] = useState<TaskWithCase[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | TaskStatus>('ALL');
    const [selectedTask, setSelectedTask] = useState<TaskWithCase | null>(null);
    const [showEndVisitModal, setShowEndVisitModal] = useState(false);
    const [showDrawingCompletionModal, setShowDrawingCompletionModal] = useState(false);

    // FETCH BOTH SITE_VISIT AND DRAWING_TASK
    useEffect(() => {
        if (!db || !currentUser?.id) {
            setLoading(false);
            return;
        } // Never pass undefined to where()

        console.log('[Work Queue] Setting up listeners for user:', currentUser.id);

        // Site Visit Tasks Query
        const siteVisitQuery = query(
            collectionGroup(db, FIRESTORE_COLLECTIONS.TASKS),
            where('assignedTo', '==', currentUser.id),
            where('type', '==', TaskType.SITE_VISIT)
        );

        // Drawing Tasks Query
        const drawingQuery = query(
            collectionGroup(db, FIRESTORE_COLLECTIONS.TASKS),
            where('assignedTo', '==', currentUser.id),
            where('type', '==', TaskType.DRAWING_TASK)
        );

        const processTasks = async (snapshot: any, setTasksFn: any) => {
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
                } catch (err) {
                    console.error('[Work Queue] Error fetching case:', err);
                }

                const task: TaskWithCase = {
                    ...taskData,
                    id: taskDoc.id,
                    projectName,
                    clientName,
                    createdAt: taskData.createdAt instanceof Timestamp
                        ? taskData.createdAt.toDate()
                        : new Date(taskData.createdAt),
                    deadline: taskData.deadline instanceof Timestamp
                        ? taskData.deadline.toDate()
                        : taskData.deadline ? new Date(taskData.deadline) : undefined,
                    startedAt: taskData.startedAt instanceof Timestamp
                        ? taskData.startedAt.toDate()
                        : taskData.startedAt ? new Date(taskData.startedAt) : undefined,
                    completedAt: taskData.completedAt instanceof Timestamp
                        ? taskData.completedAt.toDate()
                        : taskData.completedAt ? new Date(taskData.completedAt) : undefined
                };

                tasksData.push(task);
            }

            setTasksFn(tasksData);
        };

        const unsubscribeSiteVisit = onSnapshot(siteVisitQuery, async (snapshot) => {
            console.log('[Work Queue] Received', snapshot.docs.length, 'site visit tasks');
            await processTasks(snapshot, setSiteVisitTasks);
            setLoading(false);
        });

        const unsubscribeDrawing = onSnapshot(drawingQuery, async (snapshot) => {
            console.log('[Work Queue] Received', snapshot.docs.length, 'drawing tasks');
            await processTasks(snapshot, setDrawingTasks);
        });

        return () => {
            unsubscribeSiteVisit();
            unsubscribeDrawing();
        };
    }, [currentUser]);

    // Combined filtered tasks
    const allTasks = useMemo(() => [...siteVisitTasks, ...drawingTasks], [siteVisitTasks, drawingTasks]);

    const filteredSiteVisits = useMemo(() => {
        let filtered = [...siteVisitTasks];

        if (statusFilter !== 'ALL') {
            filtered = filtered.filter(t => t.status === statusFilter);
        }

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(t =>
                t.projectName?.toLowerCase().includes(query) ||
                t.clientName?.toLowerCase().includes(query)
            );
        }

        return filtered.sort((a, b) => {
            const statusOrder = {
                [TaskStatus.STARTED]: 1,
                [TaskStatus.PENDING]: 2,
                [TaskStatus.COMPLETED]: 3
            };
            return (statusOrder[a.status] || 999) - (statusOrder[b.status] || 999);
        });
    }, [siteVisitTasks, statusFilter, searchQuery]);

    const filteredDrawingTasks = useMemo(() => {
        let filtered = [...drawingTasks];

        if (statusFilter !== 'ALL') {
            filtered = filtered.filter(t => t.status === statusFilter);
        }

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(t =>
                t.projectName?.toLowerCase().includes(query) ||
                t.clientName?.toLowerCase().includes(query)
            );
        }

        return filtered.sort((a, b) => {
            const statusOrder = {
                [TaskStatus.STARTED]: 1,
                [TaskStatus.PENDING]: 2,
                [TaskStatus.COMPLETED]: 3
            };
            return (statusOrder[a.status] || 999) - (statusOrder[b.status] || 999);
        });
    }, [drawingTasks, statusFilter, searchQuery]);

    const taskSummary = useMemo(() => ({
        siteVisit: {
            pending: siteVisitTasks.filter(t => t.status === TaskStatus.PENDING).length,
            inProgress: siteVisitTasks.filter(t => t.status === TaskStatus.STARTED).length,
            completed: siteVisitTasks.filter(t => t.status === TaskStatus.COMPLETED).length
        },
        drawing: {
            pending: drawingTasks.filter(t => t.status === TaskStatus.PENDING).length,
            inProgress: drawingTasks.filter(t => t.status === TaskStatus.STARTED).length,
            completed: drawingTasks.filter(t => t.status === TaskStatus.COMPLETED).length
        }
    }), [siteVisitTasks, drawingTasks]);

    // SITE VISIT: Start Task
    const handleStartSiteVisit = async (task: TaskWithCase) => {
        console.log('[Work Queue] Starting site visit:', task.id);

        try {
            const taskRef = doc(db!, FIRESTORE_COLLECTIONS.CASES, task.caseId, FIRESTORE_COLLECTIONS.TASKS, task.id);

            await updateDoc(taskRef, {
                status: TaskStatus.STARTED,
                startedAt: serverTimestamp()
            });

            await addDoc(
                collection(db!, FIRESTORE_COLLECTIONS.CASES, task.caseId, FIRESTORE_COLLECTIONS.ACTIVITIES),
                {
                    caseId: task.caseId,
                    action: `Site visit started by ${currentUser!.name || currentUser!.email}`,
                    by: currentUser!.id,
                    timestamp: serverTimestamp()
                }
            );

            console.log('[Work Queue] ✅ Site visit started');
        } catch (error) {
            console.error('[Work Queue] Error starting site visit:', error);
            alert('Failed to start site visit. Please try again.');
        }
    };

    // SITE VISIT: End Task (with modal)
    const handleEndSiteVisit = (task: TaskWithCase) => {
        setSelectedTask(task);
        setShowEndVisitModal(true);
    };

    // DRAWING: Start Task
    const handleStartDrawing = async (task: TaskWithCase) => {
        console.log('[Work Queue] Starting drawing task:', task.id);

        try {
            const taskRef = doc(db!, FIRESTORE_COLLECTIONS.CASES, task.caseId, FIRESTORE_COLLECTIONS.TASKS, task.id);

            await updateDoc(taskRef, {
                status: TaskStatus.STARTED,
                startedAt: serverTimestamp()
            });

            await addDoc(
                collection(db!, FIRESTORE_COLLECTIONS.CASES, task.caseId, FIRESTORE_COLLECTIONS.ACTIVITIES),
                {
                    caseId: task.caseId,
                    action: `Drawing task started by ${currentUser!.name || currentUser!.email}`,
                    by: currentUser!.id,
                    timestamp: serverTimestamp()
                }
            );

            console.log('[Work Queue] ✅ Drawing task started');
        } catch (error) {
            console.error('[Work Queue] Error starting drawing task:', error);
            alert('Failed to start drawing task. Please try again.');
        }
    };

    // DRAWING: End Task (open modal with BOQ requirement)
    const handleEndDrawing = (task: TaskWithCase) => {
        console.log('[Work Queue] Opening drawing completion modal:', task.id);
        setSelectedTask(task);
        setShowDrawingCompletionModal(true);
    };

    if (loading) {
        return (
            <div className="p-8">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading tasks...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Work Queue</h1>
                <p className="text-gray-600">Manage site visits and drawing tasks</p>
            </div>

            {/* Filters */}
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6 mb-8">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* SITE VISITS SECTION */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-gray-900">Site Visits</h2>
                </div>

                {/* Site Visit Summary */}
                <div className="grid grid-cols-3 gap-6 mb-6">
                    <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6">
                        <div className="flex items-center gap-3">
                            <ClockIcon className="w-8 h-8 text-yellow-600" />
                            <div>
                                <p className="text-3xl font-bold text-yellow-900">{taskSummary.siteVisit.pending}</p>
                                <p className="text-sm font-medium text-yellow-700 uppercase">Pending</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                        <div className="flex items-center gap-3">
                            <PlayIcon className="w-8 h-8 text-blue-600" />
                            <div>
                                <p className="text-3xl font-bold text-blue-900">{taskSummary.siteVisit.inProgress}</p>
                                <p className="text-sm font-medium text-blue-700 uppercase">In Progress</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
                        <div className="flex items-center gap-3">
                            <CheckCircleIcon className="w-8 h-8 text-green-600" />
                            <div>
                                <p className="text-3xl font-bold text-green-900">{taskSummary.siteVisit.completed}</p>
                                <p className="text-sm font-medium text-green-700 uppercase">Completed</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Site Visit Tasks */}
                <div className="space-y-4 mb-8">
                    {filteredSiteVisits.length === 0 ? (
                        <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-8 text-center">
                            <p className="text-gray-500">No site visit tasks</p>
                        </div>
                    ) : (
                        filteredSiteVisits.map((task) => (
                            <SiteVisitCard
                                key={task.id}
                                task={task}
                                onStart={handleStartSiteVisit}
                                onEnd={handleEndSiteVisit}
                            />
                        ))
                    )}
                </div>
            </div>

            {/* DRAWING TASKS SECTION */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-gray-900">Drawing Tasks</h2>
                </div>

                {/* Drawing Summary */}
                <div className="grid grid-cols-3 gap-6 mb-6">
                    <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-6">
                        <div className="flex items-center gap-3">
                            <ClockIcon className="w-8 h-8 text-purple-600" />
                            <div>
                                <p className="text-3xl font-bold text-purple-900">{taskSummary.drawing.pending}</p>
                                <p className="text-sm font-medium text-purple-700 uppercase">Pending</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-6">
                        <div className="flex items-center gap-3">
                            <PlayIcon className="w-8 h-8 text-indigo-600" />
                            <div>
                                <p className="text-3xl font-bold text-indigo-900">{taskSummary.drawing.inProgress}</p>
                                <p className="text-sm font-medium text-indigo-700 uppercase">In Progress</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
                        <div className="flex items-center gap-3">
                            <CheckCircleIcon className="w-8 h-8 text-green-600" />
                            <div>
                                <p className="text-3xl font-bold text-green-900">{taskSummary.drawing.completed}</p>
                                <p className="text-sm font-medium text-green-700 uppercase">Completed</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Drawing Tasks */}
                <div className="space-y-4">
                    {filteredDrawingTasks.length === 0 ? (
                        <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-8 text-center">
                            <p className="text-gray-500">No drawing tasks</p>
                        </div>
                    ) : (
                        filteredDrawingTasks.map((task) => (
                            <DrawingTaskCard
                                key={task.id}
                                task={task}
                                onStart={handleStartDrawing}
                                onEnd={handleEndDrawing}
                            />
                        ))
                    )}
                </div>
            </div>

            {/* End Visit Modal */}
            {selectedTask && showEndVisitModal && (
                <EndVisitModal
                    isOpen={showEndVisitModal}
                    onClose={() => {
                        setShowEndVisitModal(false);
                        setSelectedTask(null);
                    }}
                    task={selectedTask}
                    currentUser={currentUser}
                />
            )}

            {/* Drawing Completion Modal */}
            {selectedTask && showDrawingCompletionModal && (
                <DrawingCompletionModal
                    isOpen={showDrawingCompletionModal}
                    onClose={() => {
                        setShowDrawingCompletionModal(false);
                        setSelectedTask(null);
                    }}
                    task={selectedTask}
                    currentUser={currentUser}
                />
            )}
        </div>
    );
};

// SITE VISIT CARD
const SiteVisitCard: React.FC<{
    task: TaskWithCase;
    onStart: (task: TaskWithCase) => void;
    onEnd: (task: TaskWithCase) => void;
}> = ({ task, onStart, onEnd }) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
        [TaskStatus.PENDING]: { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', label: 'PENDING' },
        [TaskStatus.STARTED]: { color: 'bg-blue-100 text-blue-800 border-blue-300', label: 'IN PROGRESS' },
        [TaskStatus.COMPLETED]: { color: 'bg-green-100 text-green-800 border-green-300', label: 'COMPLETED' },
        [TaskStatus.IN_PROGRESS]: { color: 'bg-blue-100 text-blue-800 border-blue-300', label: 'IN PROGRESS' }
    };

    const config = statusConfig[task.status] || { color: 'bg-gray-100 text-gray-800 border-gray-300', label: task.status?.toUpperCase() || 'UNKNOWN' };

    return (
        <div className="border-2 rounded-xl p-6 border-gray-200 bg-white hover:border-blue-300 transition-all">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-xl font-bold text-gray-900">{task.projectName}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${config.color}`}>
                            {config.label}
                        </span>
                    </div>
                    <div className="text-sm text-gray-600">
                        <span className="font-medium">Client:</span> {task.clientName}
                    </div>
                </div>

                <div className="flex gap-2 ml-6">
                    {task.status === TaskStatus.PENDING && (
                        <button
                            onClick={() => onStart(task)}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium"
                        >
                            <PlayIcon className="w-5 h-5" />
                            Start Visit
                        </button>
                    )}

                    {task.status === TaskStatus.STARTED && (
                        <button
                            onClick={() => onEnd(task)}
                            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 font-medium"
                        >
                            <StopIcon className="w-5 h-5" />
                            End Visit
                        </button>
                    )}

                    {task.status === TaskStatus.COMPLETED && (
                        <div className="px-6 py-3 bg-green-100 text-green-800 rounded-lg flex items-center gap-2 font-medium">
                            <CheckCircleIcon className="w-5 h-5" />
                            Completed
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// DRAWING TASK CARD
const DrawingTaskCard: React.FC<{
    task: TaskWithCase;
    onStart: (task: TaskWithCase) => void;
    onEnd: (task: TaskWithCase) => void;
}> = ({ task, onStart, onEnd }) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
        [TaskStatus.PENDING]: { color: 'bg-purple-100 text-purple-800 border-purple-300', label: 'PENDING' },
        [TaskStatus.STARTED]: { color: 'bg-indigo-100 text-indigo-800 border-indigo-300', label: 'IN PROGRESS' },
        [TaskStatus.COMPLETED]: { color: 'bg-green-100 text-green-800 border-green-300', label: 'COMPLETED' },
        [TaskStatus.IN_PROGRESS]: { color: 'bg-indigo-100 text-indigo-800 border-indigo-300', label: 'IN PROGRESS' }
    };

    const config = statusConfig[task.status] || { color: 'bg-gray-100 text-gray-800 border-gray-300', label: task.status?.toUpperCase() || 'UNKNOWN' };
    const isOverdue = task.deadline && new Date() > task.deadline && task.status !== TaskStatus.COMPLETED;

    return (
        <div className={`border-2 rounded-xl p-6 transition-all ${isOverdue ? 'border-red-300 bg-red-50' : 'border-purple-200 bg-white hover:border-purple-400'
            }`}>
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-xl font-bold text-gray-900">{task.projectName}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${config.color}`}>
                            {config.label}
                        </span>
                    </div>
                    <div className="text-sm text-gray-600">
                        <span className="font-medium">Client:</span> {task.clientName}
                        {task.deadline && (
                            <span className={`ml-4 ${isOverdue ? 'text-red-600 font-bold' : ''}`}>
                                <span className="font-medium">Deadline:</span> {task.deadline.toLocaleString()}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex gap-2 ml-6">
                    {task.status === TaskStatus.PENDING && (
                        <button
                            onClick={() => onStart(task)}
                            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 font-medium"
                        >
                            <PlayIcon className="w-5 h-5" />
                            Start Task
                        </button>
                    )}

                    {task.status === TaskStatus.STARTED && (
                        <button
                            onClick={() => onEnd(task)}
                            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 font-medium"
                        >
                            <StopIcon className="w-5 h-5" />
                            End Task
                        </button>
                    )}

                    {task.status === TaskStatus.COMPLETED && (
                        <div className="px-6 py-3 bg-green-100 text-green-800 rounded-lg flex items-center gap-2 font-medium">
                            <CheckCircleIcon className="w-5 h-5" />
                            Completed
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// END VISIT MODAL
const EndVisitModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    task: TaskWithCase;
    currentUser: any;
}> = ({ isOpen, onClose, task, currentUser }) => {
    const [kmTravelled, setKmTravelled] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!kmTravelled || parseFloat(kmTravelled) <= 0) {
            alert('❌ Distance travelled is required and must be greater than 0');
            return;
        }

        setSubmitting(true);

        try {
            const taskRef = doc(db!, FIRESTORE_COLLECTIONS.CASES, task.caseId, FIRESTORE_COLLECTIONS.TASKS, task.id);
            const caseRef = doc(db!, FIRESTORE_COLLECTIONS.CASES, task.caseId);

            // Complete site visit task
            await updateDoc(taskRef, {
                status: TaskStatus.COMPLETED,
                completedAt: serverTimestamp(),
                kmTravelled: parseFloat(kmTravelled)
            });

            // Update case status to WAITING_FOR_DRAWING
            await updateDoc(caseRef, {
                status: 'WAITING_FOR_DRAWING',
                updatedAt: serverTimestamp()
            });

            await addDoc(
                collection(db!, FIRESTORE_COLLECTIONS.CASES, task.caseId, FIRESTORE_COLLECTIONS.ACTIVITIES),
                {
                    caseId: task.caseId,
                    action: `Site visit completed (${kmTravelled} km) by ${currentUser.name || currentUser.email}`,
                    by: currentUser.id,
                    timestamp: serverTimestamp()
                }
            );

            // Create DRAWING_TASK with 4-hour deadline
            const deadline = new Date();
            deadline.setHours(deadline.getHours() + 4);

            const caseDoc = await getDoc(doc(db!, FIRESTORE_COLLECTIONS.CASES, task.caseId));
            if (caseDoc.exists()) {
                const caseData = caseDoc.data() as Case;
                const drawingTeamId = (caseData as any).assignedDrawingTeam || currentUser.id;

                await addDoc(
                    collection(db!, FIRESTORE_COLLECTIONS.CASES, task.caseId, FIRESTORE_COLLECTIONS.TASKS),
                    {
                        caseId: task.caseId,
                        type: TaskType.DRAWING_TASK,
                        assignedTo: drawingTeamId,
                        assignedBy: currentUser.id,
                        status: TaskStatus.PENDING,
                        deadline: Timestamp.fromDate(deadline),
                        createdAt: serverTimestamp()
                    }
                );

                await addDoc(
                    collection(db!, FIRESTORE_COLLECTIONS.CASES, task.caseId, FIRESTORE_COLLECTIONS.ACTIVITIES),
                    {
                        caseId: task.caseId,
                        action: `Drawing task created with 4-hour deadline`,
                        by: currentUser.id,
                        timestamp: serverTimestamp()
                    }
                );

                console.log('[Work Queue] ✅ Site visit completed → DRAWING_TASK created');
            }

            onClose();
        } catch (error) {
            console.error('[Work Queue] Error:', error);
            alert('Failed to complete visit. Please try again.');
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-black/30" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                    <Dialog.Title className="text-2xl font-bold text-gray-900 mb-4">
                        End Site Visit
                    </Dialog.Title>

                    <div className="mb-6">
                        <p className="text-gray-600 mb-2">
                            <span className="font-medium">Project:</span> {task.projectName}
                        </p>
                        <p className="text-gray-600">
                            <span className="font-medium">Client:</span> {task.clientName}
                        </p>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Distance Travelled (km) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            min="0"
                            step="0.1"
                            value={kmTravelled}
                            onChange={(e) => setKmTravelled(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                            placeholder="Enter distance in km"
                            autoFocus
                        />
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            disabled={submitting}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                            {submitting ? 'Completing...' : 'Complete Visit'}
                        </button>
                    </div>
                </Dialog.Panel>
            </div>
        </Dialog>
    );
};

export default DrawingWorkQueuePage;
