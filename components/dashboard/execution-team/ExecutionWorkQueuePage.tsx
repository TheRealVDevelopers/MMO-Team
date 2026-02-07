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

interface TaskWithCase extends CaseTask {
    projectName?: string;
    clientName?: string;
}

const ExecutionWorkQueuePage: React.FC = () => {
    const { currentUser } = useAuth();
    const [tasks, setTasks] = useState<TaskWithCase[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | TaskStatus>('ALL');

    // FETCH EXECUTION_TASK ONLY
    useEffect(() => {
        if (!db || !currentUser) {
            setLoading(false);
            return;
        }

        console.log('[Execution Team Work Queue] Setting up listener for user:', currentUser.id);

        try {
            const tasksQuery = query(
                collectionGroup(db, FIRESTORE_COLLECTIONS.TASKS),
                where('assignedTo', '==', currentUser.id),
                where('type', '==', TaskType.EXECUTION_TASK)
            );

            const unsubscribe = onSnapshot(tasksQuery, async (snapshot) => {
                console.log('[Execution Team] Received snapshot with', snapshot.docs.length, 'tasks');
                
                const tasksData: TaskWithCase[] = [];

                for (const taskDoc of snapshot.docs) {
                    const taskData = taskDoc.data() as CaseTask;
                    
                    // Fetch case details
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
                        console.error('[Execution Team] Error fetching case:', err);
                    }

                    const task: TaskWithCase = {
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
                            : taskData.completedAt ? new Date(taskData.completedAt) : undefined
                    };

                    tasksData.push(task);
                }

                console.log('[Execution Team] Processed tasks:', tasksData.length);
                setTasks(tasksData);
                setLoading(false);
            }, (error) => {
                console.error('[Execution Team] Error in snapshot listener:', error);
                setLoading(false);
            });

            return () => unsubscribe();
        } catch (error) {
            console.error('[Execution Team] Error setting up listener:', error);
            setLoading(false);
        }
    }, [currentUser]);

    // FILTERED TASKS
    const filteredTasks = useMemo(() => {
        let filtered = [...tasks];

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
    }, [tasks, statusFilter, searchQuery]);

    const taskSummary = useMemo(() => ({
        pending: tasks.filter(t => t.status === TaskStatus.PENDING).length,
        inProgress: tasks.filter(t => t.status === TaskStatus.STARTED).length,
        completed: tasks.filter(t => t.status === TaskStatus.COMPLETED).length
    }), [tasks]);

    // START EXECUTION TASK
    const handleStartTask = async (task: TaskWithCase) => {
        console.log('[Execution Team] Starting task:', task.id);
        
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
                startedAt: serverTimestamp()
            });

            await addDoc(
                collection(db!, FIRESTORE_COLLECTIONS.CASES, task.caseId, FIRESTORE_COLLECTIONS.ACTIVITIES),
                {
                    caseId: task.caseId,
                    action: `Execution task started by ${currentUser!.name || currentUser!.email}`,
                    by: currentUser!.id,
                    timestamp: serverTimestamp()
                }
            );

            console.log('[Execution Team] ✅ Task started successfully');
        } catch (error) {
            console.error('[Execution Team] Error starting task:', error);
            alert('Failed to start task. Please try again.');
        }
    };

    // END EXECUTION TASK (NO MODAL, DIRECT COMPLETE)
    const handleEndTask = async (task: TaskWithCase) => {
        console.log('[Execution Team] Completing task:', task.id);
        
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
                completedAt: serverTimestamp()
            });

            await addDoc(
                collection(db!, FIRESTORE_COLLECTIONS.CASES, task.caseId, FIRESTORE_COLLECTIONS.ACTIVITIES),
                {
                    caseId: task.caseId,
                    action: `Execution task completed by ${currentUser!.name || currentUser!.email}`,
                    by: currentUser!.id,
                    timestamp: serverTimestamp()
                }
            );

            console.log('[Execution Team] ✅ EXECUTION_TASK completed (no automation)');
        } catch (error) {
            console.error('[Execution Team] Error ending task:', error);
            alert('Failed to end task. Please try again.');
        }
    };

    if (loading) {
        return (
            <div className="p-8">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading execution tasks...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Execution Tasks</h1>
                <p className="text-gray-600">Manage your execution work</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-6 mb-8">
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6">
                    <div className="flex items-center gap-3">
                        <ClockIcon className="w-8 h-8 text-yellow-600" />
                        <div>
                            <p className="text-3xl font-bold text-yellow-900">{taskSummary.pending}</p>
                            <p className="text-sm font-medium text-yellow-700 uppercase tracking-wide">Pending</p>
                        </div>
                    </div>
                </div>

                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                    <div className="flex items-center gap-3">
                        <PlayIcon className="w-8 h-8 text-blue-600" />
                        <div>
                            <p className="text-3xl font-bold text-blue-900">{taskSummary.inProgress}</p>
                            <p className="text-sm font-medium text-blue-700 uppercase tracking-wide">In Progress</p>
                        </div>
                    </div>
                </div>

                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
                    <div className="flex items-center gap-3">
                        <CheckCircleIcon className="w-8 h-8 text-green-600" />
                        <div>
                            <p className="text-3xl font-bold text-green-900">{taskSummary.completed}</p>
                            <p className="text-sm font-medium text-green-700 uppercase tracking-wide">Completed</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6 mb-8">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        >
                            <option value="ALL">All</option>
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
                                placeholder="Project or Client"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Task Cards */}
            <div className="space-y-4">
                {filteredTasks.length === 0 ? (
                    <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
                        <CheckCircleIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-700 mb-2">No Execution Tasks</h3>
                        <p className="text-gray-500">
                            {statusFilter !== 'ALL' || searchQuery ? 'No tasks match your filters.' : 'You have no execution tasks at the moment.'}
                        </p>
                    </div>
                ) : (
                    filteredTasks.map((task) => (
                        <ExecutionTaskCard
                            key={task.id}
                            task={task}
                            onStart={handleStartTask}
                            onEnd={handleEndTask}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

// EXECUTION TASK CARD COMPONENT
const ExecutionTaskCard: React.FC<{
    task: TaskWithCase;
    onStart: (task: TaskWithCase) => void;
    onEnd: (task: TaskWithCase) => void;
}> = ({ task, onStart, onEnd }) => {
    const statusColors = {
        [TaskStatus.PENDING]: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        [TaskStatus.STARTED]: 'bg-blue-100 text-blue-800 border-blue-300',
        [TaskStatus.COMPLETED]: 'bg-green-100 text-green-800 border-green-300'
    };

    return (
        <div className="border-2 rounded-xl p-6 border-gray-200 bg-white">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">{task.projectName}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusColors[task.status]}`}>
                            {task.status.toUpperCase()}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div><span className="font-medium">Client:</span> {task.clientName}</div>
                        {task.startedAt && (
                            <div><span className="font-medium">Started:</span> {task.startedAt.toLocaleString()}</div>
                        )}
                    </div>
                </div>

                <div className="flex gap-2">
                    {task.status === TaskStatus.PENDING && (
                        <button
                            onClick={() => onStart(task)}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                        >
                            <PlayIcon className="w-5 h-5" />
                            Start Task
                        </button>
                    )}

                    {task.status === TaskStatus.STARTED && (
                        <button
                            onClick={() => onEnd(task)}
                            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                        >
                            <StopIcon className="w-5 h-5" />
                            End Task
                        </button>
                    )}

                    {task.status === TaskStatus.COMPLETED && (
                        <div className="px-6 py-3 bg-green-100 text-green-800 rounded-lg flex items-center gap-2">
                            <CheckCircleIcon className="w-5 h-5" />
                            Completed
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ExecutionWorkQueuePage;
