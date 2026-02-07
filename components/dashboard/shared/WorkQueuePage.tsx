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
    UserRole,
    Case
} from '../../../types';
import { FIRESTORE_COLLECTIONS } from '../../../constants';
import { 
    ClockIcon, 
    CheckCircleIcon, 
    PlayIcon,
    StopIcon,
    ExclamationTriangleIcon,
    MagnifyingGlassIcon,
    CalendarIcon,
    FunnelIcon
} from '@heroicons/react/24/outline';
import { Dialog } from '@headlessui/react';

// Role-based access control
const ALLOWED_ROLES = [
    UserRole.SALES_TEAM_MEMBER,
    UserRole.DRAWING_TEAM,
    UserRole.SITE_ENGINEER,
    UserRole.QUOTATION_TEAM,
    UserRole.PROCUREMENT_TEAM,
    UserRole.EXECUTION_TEAM
];

interface TaskWithCase extends CaseTask {
    projectName?: string;
    clientName?: string;
}

const WorkQueuePage: React.FC = () => {
    const { currentUser } = useAuth();
    const [tasks, setTasks] = useState<TaskWithCase[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTask, setSelectedTask] = useState<TaskWithCase | null>(null);
    const [showCompletionModal, setShowCompletionModal] = useState(false);

    // FILTERS
    const [statusFilter, setStatusFilter] = useState<'ALL' | TaskStatus>('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [taskTypeFilter, setTaskTypeFilter] = useState<'ALL' | TaskType>('ALL');
    const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | 'OVERDUE'>('ALL');

    // Permission check
    if (!currentUser || !ALLOWED_ROLES.includes(currentUser.role)) {
        return (
            <div className="p-8">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-red-900 mb-2">Access Denied</h2>
                    <p className="text-red-700">You do not have permission to access the Work Queue.</p>
                </div>
            </div>
        );
    }

    // Fetch tasks using collectionGroup - SINGLE SOURCE OF TRUTH
    useEffect(() => {
        if (!db || !currentUser) {
            setLoading(false);
            return;
        }

        try {
            // CRITICAL: collectionGroup query with assignedTo filter
            // NO client-side filtering, NO role-based filtering, NO organization filtering
            const tasksQuery = query(
                collectionGroup(db, FIRESTORE_COLLECTIONS.TASKS),
                where('assignedTo', '==', currentUser.id)
            );

            const unsubscribe = onSnapshot(tasksQuery, async (snapshot) => {
                const tasksData: TaskWithCase[] = [];

                for (const taskDoc of snapshot.docs) {
                    const taskData = taskDoc.data() as CaseTask;
                    const task: TaskWithCase = {
                        ...taskData,
                        id: taskDoc.id,
                        createdAt: taskData.createdAt instanceof Timestamp 
                            ? taskData.createdAt.toDate() 
                            : new Date(taskData.createdAt),
                        startedAt: taskData.startedAt instanceof Timestamp
                            ? taskData.startedAt.toDate()
                            : taskData.startedAt ? new Date(taskData.startedAt) : undefined,
                        completedAt: taskData.completedAt instanceof Timestamp
                            ? taskData.completedAt.toDate()
                            : taskData.completedAt ? new Date(taskData.completedAt) : undefined,
                        deadline: taskData.deadline instanceof Timestamp
                            ? taskData.deadline.toDate()
                            : taskData.deadline ? new Date(taskData.deadline) : undefined
                    };

                    // Fetch case details for project name and client
                    try {
                        const caseDoc = await getDoc(
                            doc(db, FIRESTORE_COLLECTIONS.CASES, task.caseId)
                        );
                        if (caseDoc.exists()) {
                            const caseData = caseDoc.data() as Case;
                            task.projectName = caseData.title;
                            task.clientName = caseData.clientName;
                        }
                    } catch (err) {
                        console.error('Error fetching case:', err);
                    }

                    tasksData.push(task);
                }

                setTasks(tasksData);
                setLoading(false);
            }, (error) => {
                console.error('Error fetching tasks:', error);
                setLoading(false);
            });

            return () => unsubscribe();
        } catch (error) {
            console.error('Error setting up tasks listener:', error);
            setLoading(false);
        }
    }, [currentUser]);

    // FILTERED TASKS (client-side for UI only, NOT for data fetching)
    const filteredTasks = useMemo(() => {
        let filtered = [...tasks];

        // Status filter
        if (statusFilter !== 'ALL') {
            filtered = filtered.filter(t => t.status === statusFilter);
        }

        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(t => 
                t.projectName?.toLowerCase().includes(query) ||
                t.clientName?.toLowerCase().includes(query)
            );
        }

        // Task type filter
        if (taskTypeFilter !== 'ALL') {
            filtered = filtered.filter(t => t.type === taskTypeFilter);
        }

        // Date filter
        if (dateFilter === 'TODAY') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            filtered = filtered.filter(t => 
                (t.deadline && t.deadline >= today && t.deadline < tomorrow) ||
                (t.startedAt && t.startedAt >= today && t.startedAt < tomorrow)
            );
        } else if (dateFilter === 'OVERDUE') {
            const now = new Date();
            filtered = filtered.filter(t => 
                t.deadline && t.deadline < now && t.status !== TaskStatus.COMPLETED
            );
        }

        return filtered;
    }, [tasks, statusFilter, searchQuery, taskTypeFilter, dateFilter]);

    // TODAY'S TASKS (deadline today OR started today)
    const todaysTasks = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        return tasks.filter(t => 
            (t.deadline && t.deadline >= today && t.deadline < tomorrow) ||
            (t.startedAt && t.startedAt >= today && t.startedAt < tomorrow)
        );
    }, [tasks]);

    // Task summaries
    const taskSummary = useMemo(() => {
        return {
            pending: tasks.filter(t => t.status === TaskStatus.PENDING).length,
            inProgress: tasks.filter(t => t.status === TaskStatus.STARTED).length,
            completed: tasks.filter(t => t.status === TaskStatus.COMPLETED).length
        };
    }, [tasks]);

    // Universal START TASK
    const handleStartTask = async (task: TaskWithCase) => {
        // SECURITY: Check ownership
        if (task.assignedTo !== currentUser.id) {
            alert('❌ This task is not assigned to you.');
            return;
        }

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

            // Log activity
            await logActivity(task.caseId, `Task started: ${task.type}`, currentUser!.id);

            console.log('✅ Task started:', task.id);
        } catch (error) {
            console.error('Error starting task:', error);
            alert('Failed to start task. Please try again.');
        }
    };

    // Universal END TASK (opens modal)
    const handleEndTask = (task: TaskWithCase) => {
        // SECURITY: Check ownership
        if (task.assignedTo !== currentUser.id) {
            alert('❌ This task is not assigned to you.');
            return;
        }

        setSelectedTask(task);
        setShowCompletionModal(true);
    };

    // Helper: Log activity
    const logActivity = async (caseId: string, action: string, userId: string) => {
        try {
            await addDoc(
                collection(db!, FIRESTORE_COLLECTIONS.CASES, caseId, FIRESTORE_COLLECTIONS.ACTIVITIES),
                {
                    caseId,
                    action,
                    by: userId,
                    timestamp: serverTimestamp()
                }
            );
        } catch (error) {
            console.error('Error logging activity:', error);
        }
    };

    if (loading) {
        return (
            <div className="p-8">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading work queue...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Work Queue</h1>
                <p className="text-gray-600">Your assigned tasks and active workflows</p>
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

            {/* TODAY'S TASKS */}
            {todaysTasks.length > 0 && (
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                        <CalendarIcon className="w-6 h-6 text-blue-600" />
                        <h2 className="text-xl font-bold text-gray-900">Today's Tasks</h2>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-bold">
                            {todaysTasks.length}
                        </span>
                    </div>
                    <div className="space-y-4">
                        {todaysTasks.map((task) => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                currentUser={currentUser}
                                onStart={handleStartTask}
                                onEnd={handleEndTask}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* FILTERS */}
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6 mb-8">
                <div className="flex items-center gap-2 mb-4">
                    <FunnelIcon className="w-5 h-5 text-gray-600" />
                    <h3 className="font-bold text-gray-900">Filters</h3>
                </div>

                <div className="grid grid-cols-4 gap-4">
                    {/* Status Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="ALL">All</option>
                            <option value={TaskStatus.PENDING}>Pending</option>
                            <option value={TaskStatus.STARTED}>Ongoing</option>
                            <option value={TaskStatus.COMPLETED}>Completed</option>
                        </select>
                    </div>

                    {/* Task Type Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Task Type</label>
                        <select
                            value={taskTypeFilter}
                            onChange={(e) => setTaskTypeFilter(e.target.value as any)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="ALL">All Types</option>
                            <option value={TaskType.SALES_CONTACT}>Sales Contact</option>
                            <option value={TaskType.SITE_INSPECTION}>Site Inspection</option>
                            <option value={TaskType.DRAWING_TASK}>Drawing Task</option>
                            <option value={TaskType.QUOTATION_TASK}>Quotation</option>
                            <option value={TaskType.PROCUREMENT_AUDIT}>Procurement Audit</option>
                            <option value={TaskType.PROCUREMENT_BIDDING}>Procurement Bidding</option>
                            <option value={TaskType.EXECUTION_TASK}>Execution</option>
                        </select>
                    </div>

                    {/* Date Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                        <select
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value as any)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="ALL">All Dates</option>
                            <option value="TODAY">Today</option>
                            <option value="OVERDUE">Overdue</option>
                        </select>
                    </div>

                    {/* Search */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                        <div className="relative">
                            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                            <input
                                type="text"
                                placeholder="Project or Client"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* ALL TASKS */}
            <div className="mb-4">
                <h2 className="text-xl font-bold text-gray-900 mb-4">All Tasks</h2>
            </div>

            {/* Task Cards */}
            <div className="space-y-4">
                {filteredTasks.length === 0 ? (
                    <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
                        <CheckCircleIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-700 mb-2">No Tasks Found</h3>
                        <p className="text-gray-500">
                            {statusFilter !== 'ALL' || searchQuery || taskTypeFilter !== 'ALL' || dateFilter !== 'ALL'
                                ? 'No tasks match your filters. Try adjusting them.'
                                : 'You have no tasks in your work queue at the moment.'}
                        </p>
                    </div>
                ) : (
                    filteredTasks
                        .sort((a, b) => {
                            // Sort: Started > Pending > Completed
                            const statusOrder = { [TaskStatus.STARTED]: 1, [TaskStatus.PENDING]: 2, [TaskStatus.COMPLETED]: 3 };
                            return (statusOrder[a.status] || 999) - (statusOrder[b.status] || 999);
                        })
                        .map((task) => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                currentUser={currentUser}
                                onStart={handleStartTask}
                                onEnd={handleEndTask}
                            />
                        ))
                )}
            </div>

            {/* Completion Modal */}
            {selectedTask && (
                <TaskCompletionModal
                    isOpen={showCompletionModal}
                    onClose={() => {
                        setShowCompletionModal(false);
                        setSelectedTask(null);
                    }}
                    task={selectedTask}
                    currentUser={currentUser}
                />
            )}
        </div>
    );
};

// Task Card Component
const TaskCard: React.FC<{
    task: TaskWithCase;
    currentUser: any;
    onStart: (task: TaskWithCase) => void;
    onEnd: (task: TaskWithCase) => void;
}> = ({ task, currentUser, onStart, onEnd }) => {
    const isOverdue = task.deadline && new Date() > task.deadline && task.status !== TaskStatus.COMPLETED;
    const isOwner = task.assignedTo === currentUser.id;
    
    const statusColors = {
        [TaskStatus.PENDING]: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        [TaskStatus.STARTED]: 'bg-blue-100 text-blue-800 border-blue-300',
        [TaskStatus.COMPLETED]: 'bg-green-100 text-green-800 border-green-300'
    };

    // Calculate time remaining
    const getTimeRemaining = () => {
        if (!task.deadline) return null;
        const now = new Date();
        const diff = task.deadline.getTime() - now.getTime();
        
        if (diff < 0) return 'OVERDUE';
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours > 24) {
            const days = Math.floor(hours / 24);
            return `${days}d ${hours % 24}h`;
        }
        return `${hours}h ${minutes}m`;
    };

    const timeRemaining = getTimeRemaining();

    // SPECIAL: Drawing Team has NO Start button
    const isDrawingTask = task.type === TaskType.DRAWING_TASK && currentUser.role === UserRole.DRAWING_TEAM;

    return (
        <div className={`border-2 rounded-xl p-6 ${
            isOverdue
                ? 'border-red-300 bg-red-50'
                : 'border-gray-200 bg-white'
        }`}>
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">
                            {task.projectName || 'Unknown Project'}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusColors[task.status]}`}>
                            {task.status.toUpperCase()}
                        </span>
                        {!isOwner && (
                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold">
                                NOT YOUR TASK
                            </span>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                        <div>
                            <span className="font-medium">Client:</span> {task.clientName || 'N/A'}
                        </div>
                        <div>
                            <span className="font-medium">Task Type:</span> {task.type.replace('_', ' ').toUpperCase()}
                        </div>
                        {task.deadline && (
                            <div className={isOverdue ? 'text-red-600 font-bold' : ''}>
                                <span className="font-medium">Deadline:</span> {task.deadline.toLocaleString()}
                                {timeRemaining && (
                                    <span className={`ml-2 px-2 py-1 rounded text-xs font-bold ${
                                        timeRemaining === 'OVERDUE' 
                                            ? 'bg-red-100 text-red-800' 
                                            : 'bg-blue-100 text-blue-800'
                                    }`}>
                                        {timeRemaining}
                                    </span>
                                )}
                            </div>
                        )}
                        {task.startedAt && (
                            <div>
                                <span className="font-medium">Started:</span> {task.startedAt.toLocaleString()}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex gap-2">
                    {/* PENDING: Show Start button (except for Drawing Team) */}
                    {task.status === TaskStatus.PENDING && !isDrawingTask && (
                        <button
                            onClick={() => onStart(task)}
                            disabled={!isOwner}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            title={!isOwner ? 'This task is not assigned to you' : ''}
                        >
                            <PlayIcon className="w-5 h-5" />
                            Start Task
                        </button>
                    )}

                    {/* STARTED: Show End button */}
                    {task.status === TaskStatus.STARTED && (
                        <button
                            onClick={() => onEnd(task)}
                            disabled={!isOwner}
                            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            title={!isOwner ? 'This task is not assigned to you' : ''}
                        >
                            <StopIcon className="w-5 h-5" />
                            End Task
                        </button>
                    )}

                    {/* DRAWING TEAM PENDING: Show Submit button instead */}
                    {task.status === TaskStatus.PENDING && isDrawingTask && (
                        <button
                            onClick={() => onEnd(task)}
                            disabled={!isOwner}
                            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            title={!isOwner ? 'This task is not assigned to you' : ''}
                        >
                            <CheckCircleIcon className="w-5 h-5" />
                            Submit Drawing
                        </button>
                    )}

                    {/* COMPLETED: Show badge */}
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

// Task Completion Modal - ROLE-SPECIFIC LOGIC
interface TaskCompletionModalProps {
    isOpen: boolean;
    onClose: () => void;
    task: TaskWithCase;
    currentUser: any;
}

const TaskCompletionModal: React.FC<TaskCompletionModalProps> = ({
    isOpen,
    onClose,
    task,
    currentUser
}) => {
    const [kmTravelled, setKmTravelled] = useState('');
    const [boqUploaded, setBoqUploaded] = useState(false);
    const [twoDUploaded, setTwoDUploaded] = useState(false);
    const [pdfUploaded, setPdfUploaded] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        setSubmitting(true);

        try {
            // ROLE 1: SALES_TEAM - SALES_CONTACT or LEAD_ASSIGNED
            if (
                currentUser.role === UserRole.SALES_TEAM_MEMBER &&
                (task.type === TaskType.SALES_CONTACT || task.type === 'lead_assigned' as TaskType)
            ) {
                await completeSalesTask(task);
            }

            // ROLE 2: SITE ENGINEER - SITE_INSPECTION
            else if (
                currentUser.role === UserRole.SITE_ENGINEER &&
                task.type === TaskType.SITE_INSPECTION
            ) {
                if (!kmTravelled || parseFloat(kmTravelled) <= 0) {
                    alert('❌ Distance travelled is mandatory for site inspection.');
                    setSubmitting(false);
                    return;
                }
                await completeSiteInspection(task, parseFloat(kmTravelled));
            }

            // ROLE 3: DRAWING TEAM - DRAWING_TASK
            else if (
                currentUser.role === UserRole.DRAWING_TEAM &&
                task.type === TaskType.DRAWING_TASK
            ) {
                if (!boqUploaded) {
                    alert('❌ BOQ upload is mandatory for drawing task.');
                    setSubmitting(false);
                    return;
                }
                await completeDrawingTask(task);
            }

            // ROLE 4: QUOTATION TEAM - QUOTATION_TASK
            else if (
                currentUser.role === UserRole.QUOTATION_TEAM &&
                task.type === TaskType.QUOTATION_TASK
            ) {
                await completeQuotationTask(task);
            }

            // ROLE 5: PROCUREMENT TEAM - PROCUREMENT_AUDIT or PROCUREMENT_BIDDING
            else if (
                currentUser.role === UserRole.PROCUREMENT_TEAM &&
                (task.type === TaskType.PROCUREMENT_AUDIT || task.type === TaskType.PROCUREMENT_BIDDING)
            ) {
                await completeProcurementTask(task);
            }

            // ROLE 6: EXECUTION TEAM - EXECUTION_TASK
            else if (
                currentUser.role === UserRole.EXECUTION_TEAM &&
                task.type === TaskType.EXECUTION_TASK
            ) {
                await completeExecutionTask(task);
            }

            // Unknown combination
            else {
                alert('❌ Invalid task type for your role.');
                setSubmitting(false);
                return;
            }

            // Success
            onClose();
        } catch (error) {
            console.error('Error completing task:', error);
            alert('Failed to complete task. Please try again.');
            setSubmitting(false);
        }
    };

    // AUTOMATION 1: SALES_CONTACT or LEAD_ASSIGNED → SITE_INSPECTION
    const completeSalesTask = async (task: TaskWithCase) => {
        const taskRef = doc(
            db!,
            FIRESTORE_COLLECTIONS.CASES,
            task.caseId,
            FIRESTORE_COLLECTIONS.TASKS,
            task.id
        );

        // Mark task as completed
        await updateDoc(taskRef, {
            status: TaskStatus.COMPLETED,
            completedAt: serverTimestamp()
        });

        // Log activity
        await logActivity(task.caseId, `${task.type} completed`, currentUser.id);

        // Get case to find site engineer
        const caseDoc = await getDoc(doc(db!, FIRESTORE_COLLECTIONS.CASES, task.caseId));
        if (!caseDoc.exists()) throw new Error('Case not found');

        const caseData = caseDoc.data() as Case;
        const siteEngineerId = (caseData as any).assignedSiteEngineer || currentUser.id;

        // Auto-create SITE_INSPECTION task
        await addDoc(
            collection(db!, FIRESTORE_COLLECTIONS.CASES, task.caseId, FIRESTORE_COLLECTIONS.TASKS),
            {
                caseId: task.caseId,
                type: TaskType.SITE_INSPECTION,
                assignedTo: siteEngineerId,
                assignedBy: currentUser.id,
                status: TaskStatus.PENDING,
                createdAt: serverTimestamp()
            }
        );

        await logActivity(task.caseId, 'Site inspection task created', currentUser.id);

        await sendNotification(
            siteEngineerId,
            'New Site Inspection Task',
            `Site inspection assigned for: ${task.projectName}`,
            `/cases/${task.caseId}`
        );

        console.log('✅ SALES task completed → SITE_INSPECTION created');
    };

    // AUTOMATION 2: SITE_INSPECTION → DRAWING_TASK
    const completeSiteInspection = async (task: TaskWithCase, km: number) => {
        const taskRef = doc(
            db!,
            FIRESTORE_COLLECTIONS.CASES,
            task.caseId,
            FIRESTORE_COLLECTIONS.TASKS,
            task.id
        );

        // Mark task as completed with KM
        await updateDoc(taskRef, {
            status: TaskStatus.COMPLETED,
            completedAt: serverTimestamp(),
            kmTravelled: km
        });

        await logActivity(
            task.caseId,
            `Site inspection completed (${km} km travelled)`,
            currentUser.id
        );

        // Calculate deadline: +4 working hours from now (10:00-19:00)
        const deadline = calculateDrawingDeadline();

        // Get case to find drawing team member
        const caseDoc = await getDoc(doc(db!, FIRESTORE_COLLECTIONS.CASES, task.caseId));
        if (!caseDoc.exists()) throw new Error('Case not found');

        const caseData = caseDoc.data() as Case;
        const drawingTeamId = (caseData as any).assignedDrawingTeam || currentUser.id;

        // Auto-create DRAWING_TASK
        await addDoc(
            collection(db!, FIRESTORE_COLLECTIONS.CASES, task.caseId, FIRESTORE_COLLECTIONS.TASKS),
            {
                caseId: task.caseId,
                type: TaskType.DRAWING_TASK,
                assignedTo: drawingTeamId,
                assignedBy: currentUser.id,
                status: TaskStatus.PENDING,
                deadline: deadline,
                createdAt: serverTimestamp()
            }
        );

        await logActivity(task.caseId, 'Drawing task created with 4-hour deadline', currentUser.id);

        await sendNotification(
            drawingTeamId,
            'New Drawing Task',
            `Drawing task assigned with 4-hour deadline: ${task.projectName}`,
            `/cases/${task.caseId}`
        );

        console.log('✅ SITE_INSPECTION completed → DRAWING_TASK created');
    };

    // AUTOMATION 3: DRAWING_TASK → QUOTATION_TASK
    const completeDrawingTask = async (task: TaskWithCase) => {
        const taskRef = doc(
            db!,
            FIRESTORE_COLLECTIONS.CASES,
            task.caseId,
            FIRESTORE_COLLECTIONS.TASKS,
            task.id
        );

        // Mark task as completed
        await updateDoc(taskRef, {
            status: TaskStatus.COMPLETED,
            completedAt: serverTimestamp()
        });

        await logActivity(task.caseId, 'Drawing task completed (BOQ uploaded)', currentUser.id);

        // Get case to find quotation team member
        const caseDoc = await getDoc(doc(db!, FIRESTORE_COLLECTIONS.CASES, task.caseId));
        if (!caseDoc.exists()) throw new Error('Case not found');

        const caseData = caseDoc.data() as Case;
        const quotationTeamId = (caseData as any).assignedQuotationTeam || currentUser.id;

        // Auto-create QUOTATION_TASK
        await addDoc(
            collection(db!, FIRESTORE_COLLECTIONS.CASES, task.caseId, FIRESTORE_COLLECTIONS.TASKS),
            {
                caseId: task.caseId,
                type: TaskType.QUOTATION_TASK,
                assignedTo: quotationTeamId,
                assignedBy: currentUser.id,
                status: TaskStatus.PENDING,
                createdAt: serverTimestamp()
            }
        );

        await logActivity(task.caseId, 'Quotation task created', currentUser.id);

        await sendNotification(
            quotationTeamId,
            'New Quotation Task',
            `Quotation task assigned: ${task.projectName}`,
            `/cases/${task.caseId}`
        );

        console.log('✅ DRAWING_TASK completed → QUOTATION_TASK created');
    };

    // AUTOMATION 4: QUOTATION_TASK → PROCUREMENT_AUDIT
    const completeQuotationTask = async (task: TaskWithCase) => {
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

        await logActivity(task.caseId, 'Quotation task completed', currentUser.id);

        const caseDoc = await getDoc(doc(db!, FIRESTORE_COLLECTIONS.CASES, task.caseId));
        if (!caseDoc.exists()) throw new Error('Case not found');

        const caseData = caseDoc.data() as Case;
        const procurementTeamId = (caseData as any).assignedProcurementTeam || currentUser.id;

        await addDoc(
            collection(db!, FIRESTORE_COLLECTIONS.CASES, task.caseId, FIRESTORE_COLLECTIONS.TASKS),
            {
                caseId: task.caseId,
                type: TaskType.PROCUREMENT_AUDIT,
                assignedTo: procurementTeamId,
                assignedBy: currentUser.id,
                status: TaskStatus.PENDING,
                createdAt: serverTimestamp()
            }
        );

        await logActivity(task.caseId, 'Procurement audit task created', currentUser.id);

        await sendNotification(
            procurementTeamId,
            'New Procurement Audit Task',
            `Procurement audit assigned: ${task.projectName}`,
            `/cases/${task.caseId}`
        );

        console.log('✅ QUOTATION_TASK completed → PROCUREMENT_AUDIT created');
    };

    // AUTOMATION 5: PROCUREMENT tasks → Notify Admin
    const completeProcurementTask = async (task: TaskWithCase) => {
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

        await logActivity(task.caseId, `${task.type} completed`, currentUser.id);

        // TODO: Find actual admin to notify
        const adminId = 'admin-user-id';

        await sendNotification(
            adminId,
            'Procurement Task Completed',
            `${task.type} completed for: ${task.projectName}`,
            `/cases/${task.caseId}`
        );

        console.log('✅ PROCUREMENT task completed → Admin notified');
    };

    // AUTOMATION 6: EXECUTION_TASK → No auto-create
    const completeExecutionTask = async (task: TaskWithCase) => {
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

        await logActivity(task.caseId, 'Execution task completed', currentUser.id);

        console.log('✅ EXECUTION_TASK completed (no automation)');
    };

    // Helper: Calculate drawing deadline (+4 working hours, 10:00-19:00)
    const calculateDrawingDeadline = (): Date => {
        const now = new Date();
        let workingHoursToAdd = 4;
        let deadline = new Date(now);

        while (workingHoursToAdd > 0) {
            deadline.setHours(deadline.getHours() + 1);

            const hour = deadline.getHours();
            
            // Count this hour if it's within working hours (10:00-19:00)
            if (hour >= 10 && hour < 19) {
                workingHoursToAdd--;
            }

            // If past 19:00, jump to next day 10:00
            if (hour >= 19) {
                deadline.setDate(deadline.getDate() + 1);
                deadline.setHours(10, 0, 0, 0);
            }

            // If before 10:00, jump to 10:00
            if (hour < 10) {
                deadline.setHours(10, 0, 0, 0);
            }
        }

        return deadline;
    };

    // Helper: Log activity
    const logActivity = async (caseId: string, action: string, userId: string) => {
        try {
            await addDoc(
                collection(db!, FIRESTORE_COLLECTIONS.CASES, caseId, FIRESTORE_COLLECTIONS.ACTIVITIES),
                {
                    caseId,
                    action,
                    by: userId,
                    timestamp: serverTimestamp()
                }
            );
        } catch (error) {
            console.error('Error logging activity:', error);
        }
    };

    // Helper: Send notification
    const sendNotification = async (
        userId: string,
        title: string,
        message: string,
        actionUrl?: string
    ) => {
        try {
            await addDoc(
                collection(db!, FIRESTORE_COLLECTIONS.STAFF_USERS, userId, FIRESTORE_COLLECTIONS.NOTIFICATIONS),
                {
                    userId,
                    title,
                    message,
                    type: 'info',
                    read: false,
                    createdAt: serverTimestamp(),
                    ...(actionUrl && { actionUrl })
                }
            );
        } catch (error) {
            console.error('Error sending notification:', error);
        }
    };

    // DRAWING TEAM: Special UI (no Start/End workflow, direct submit)
    const isDrawingTask = currentUser.role === UserRole.DRAWING_TEAM && task.type === TaskType.DRAWING_TASK;

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                    <Dialog.Title className="text-2xl font-bold text-gray-900 mb-4">
                        {isDrawingTask ? 'Submit Drawing Task' : 'Complete Task'}
                    </Dialog.Title>

                    <div className="mb-6">
                        <p className="text-gray-600 mb-2">
                            <span className="font-medium">Project:</span> {task.projectName}
                        </p>
                        <p className="text-gray-600 mb-2">
                            <span className="font-medium">Task:</span> {task.type.replace('_', ' ').toUpperCase()}
                        </p>
                    </div>

                    {/* SITE INSPECTION: KM Input */}
                    {currentUser.role === UserRole.SITE_ENGINEER &&
                        task.type === TaskType.SITE_INSPECTION && (
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
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Enter distance"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Stored in task.kmTravelled
                                </p>
                            </div>
                        )}

                    {/* DRAWING TASK: Upload Checklist */}
                    {isDrawingTask && (
                            <div className="mb-6 space-y-3">
                                <p className="text-sm font-medium text-gray-700 mb-2">Upload Requirements:</p>
                                <p className="text-xs text-gray-500 mb-3">
                                    Documents stored in cases/{`{caseId}`}/documents
                                </p>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={boqUploaded}
                                        onChange={(e) => setBoqUploaded(e.target.checked)}
                                        className="w-4 h-4 text-blue-600 rounded"
                                    />
                                    <span className="text-sm text-gray-700">
                                        BOQ Uploaded <span className="text-red-500">*</span>
                                    </span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={twoDUploaded}
                                        onChange={(e) => setTwoDUploaded(e.target.checked)}
                                        className="w-4 h-4 text-blue-600 rounded"
                                    />
                                    <span className="text-sm text-gray-700">2D Drawing Uploaded (Optional)</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={pdfUploaded}
                                        onChange={(e) => setPdfUploaded(e.target.checked)}
                                        className="w-4 h-4 text-blue-600 rounded"
                                    />
                                    <span className="text-sm text-gray-700">PDF Uploaded (Optional)</span>
                                </label>
                            </div>
                        )}

                    {/* Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            disabled={submitting}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                            {submitting ? 'Submitting...' : (isDrawingTask ? 'Submit' : 'Complete Task')}
                        </button>
                    </div>
                </Dialog.Panel>
            </div>
        </Dialog>
    );
};

export default WorkQueuePage;
