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
    ExclamationTriangleIcon
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

    // Fetch tasks using collectionGroup
    useEffect(() => {
        if (!db || !currentUser) {
            setLoading(false);
            return;
        }

        try {
            // CRITICAL: collectionGroup query with assignedTo filter
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

            {/* Task Cards */}
            <div className="space-y-4">
                {tasks.length === 0 ? (
                    <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
                        <CheckCircleIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-700 mb-2">No Tasks Assigned</h3>
                        <p className="text-gray-500">You have no tasks in your work queue at the moment.</p>
                    </div>
                ) : (
                    tasks
                        .sort((a, b) => {
                            // Sort: Started > Pending > Completed
                            const statusOrder = { [TaskStatus.STARTED]: 1, [TaskStatus.PENDING]: 2, [TaskStatus.COMPLETED]: 3 };
                            return (statusOrder[a.status] || 999) - (statusOrder[b.status] || 999);
                        })
                        .map((task) => (
                            <TaskCard
                                key={task.id}
                                task={task}
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
    onStart: (task: TaskWithCase) => void;
    onEnd: (task: TaskWithCase) => void;
}> = ({ task, onStart, onEnd }) => {
    const isOverdue = task.deadline && new Date() > task.deadline;
    const statusColors = {
        [TaskStatus.PENDING]: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        [TaskStatus.STARTED]: 'bg-blue-100 text-blue-800 border-blue-300',
        [TaskStatus.COMPLETED]: 'bg-green-100 text-green-800 border-green-300'
    };

    return (
        <div className={`border-2 rounded-xl p-6 ${
            isOverdue && task.status !== TaskStatus.COMPLETED
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
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                        <div>
                            <span className="font-medium">Client:</span> {task.clientName || 'N/A'}
                        </div>
                        <div>
                            <span className="font-medium">Task Type:</span> {task.type.replace('_', ' ').toUpperCase()}
                        </div>
                        {task.deadline && (
                            <div className={isOverdue && task.status !== TaskStatus.COMPLETED ? 'text-red-600 font-bold' : ''}>
                                <span className="font-medium">Deadline:</span> {task.deadline.toLocaleString()}
                                {isOverdue && task.status !== TaskStatus.COMPLETED && (
                                    <ExclamationTriangleIcon className="w-4 h-4 inline ml-2" />
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
                    {task.status === TaskStatus.PENDING && (
                        <button
                            onClick={() => onStart(task)}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                            <PlayIcon className="w-5 h-5" />
                            Start Task
                        </button>
                    )}

                    {task.status === TaskStatus.STARTED && (
                        <button
                            onClick={() => onEnd(task)}
                            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
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

// Continue in next part...

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
            // ROLE 1: SALES_TEAM - SALES_CONTACT
            if (
                currentUser.role === UserRole.SALES_TEAM_MEMBER &&
                task.type === TaskType.SALES_CONTACT
            ) {
                await completeSalesContact(task);
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

            // ROLE 2: DRAWING TEAM - DRAWING_TASK
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

            // ROLE 3: QUOTATION TEAM - QUOTATION_TASK
            else if (
                currentUser.role === UserRole.QUOTATION_TEAM &&
                task.type === TaskType.QUOTATION_TASK
            ) {
                await completeQuotationTask(task);
            }

            // ROLE 4: PROCUREMENT TEAM - PROCUREMENT_AUDIT or PROCUREMENT_BIDDING
            else if (
                currentUser.role === UserRole.PROCUREMENT_TEAM &&
                (task.type === TaskType.PROCUREMENT_AUDIT || task.type === TaskType.PROCUREMENT_BIDDING)
            ) {
                await completeProcurementTask(task);
            }

            // ROLE 5: EXECUTION TEAM - EXECUTION_TASK
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

    // AUTOMATION 1: SALES_CONTACT → SITE_INSPECTION
    const completeSalesContact = async (task: TaskWithCase) => {
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
        await logActivity(task.caseId, 'Sales contact completed', currentUser.id);

        // Get case to find site engineer
        const caseDoc = await getDoc(doc(db!, FIRESTORE_COLLECTIONS.CASES, task.caseId));
        if (!caseDoc.exists()) throw new Error('Case not found');

        const caseData = caseDoc.data() as Case;

        // Find a site engineer (you may need to adjust this logic based on your assignment strategy)
        // For now, we'll need the case to have an assignedSiteEngineer field
        const siteEngineerId = (caseData as any).assignedSiteEngineer || currentUser.id; // Fallback

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

        // Log activity
        await logActivity(task.caseId, 'Site inspection task created', currentUser.id);

        // Notify site engineer
        await sendNotification(
            siteEngineerId,
            'New Site Inspection Task',
            `Site inspection assigned for: ${task.projectName}`,
            `/cases/${task.caseId}`
        );

        console.log('✅ SALES_CONTACT completed → SITE_INSPECTION created');
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

        // Log activity
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
        const drawingTeamId = (caseData as any).assignedDrawingTeam || currentUser.id; // Fallback

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

        // Log activity
        await logActivity(task.caseId, 'Drawing task created', currentUser.id);

        // Notify drawing team
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

        // Log activity
        await logActivity(task.caseId, 'Drawing task completed (BOQ uploaded)', currentUser.id);

        // Get case to find quotation team member
        const caseDoc = await getDoc(doc(db!, FIRESTORE_COLLECTIONS.CASES, task.caseId));
        if (!caseDoc.exists()) throw new Error('Case not found');

        const caseData = caseDoc.data() as Case;
        const quotationTeamId = (caseData as any).assignedQuotationTeam || currentUser.id; // Fallback

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

        // Log activity
        await logActivity(task.caseId, 'Quotation task created', currentUser.id);

        // Notify quotation team
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

        // Mark task as completed
        await updateDoc(taskRef, {
            status: TaskStatus.COMPLETED,
            completedAt: serverTimestamp()
        });

        // Log activity
        await logActivity(task.caseId, 'Quotation task completed', currentUser.id);

        // Get case to find procurement team member
        const caseDoc = await getDoc(doc(db!, FIRESTORE_COLLECTIONS.CASES, task.caseId));
        if (!caseDoc.exists()) throw new Error('Case not found');

        const caseData = caseDoc.data() as Case;
        const procurementTeamId = (caseData as any).assignedProcurementTeam || currentUser.id; // Fallback

        // Auto-create PROCUREMENT_AUDIT
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

        // Log activity
        await logActivity(task.caseId, 'Procurement audit task created', currentUser.id);

        // Notify procurement team
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

        // Mark task as completed
        await updateDoc(taskRef, {
            status: TaskStatus.COMPLETED,
            completedAt: serverTimestamp()
        });

        // Log activity
        await logActivity(task.caseId, `${task.type} completed`, currentUser.id);

        // Find admin user to notify
        // TODO: Replace with actual admin lookup logic
        const adminId = 'admin-user-id'; // Placeholder

        // Notify admin
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

        // Mark task as completed
        await updateDoc(taskRef, {
            status: TaskStatus.COMPLETED,
            completedAt: serverTimestamp()
        });

        // Log activity
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

            // Working hours: 10:00-19:00
            const hour = deadline.getHours();
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

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                    <Dialog.Title className="text-2xl font-bold text-gray-900 mb-4">
                        Complete Task
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
                            </div>
                        )}

                    {/* DRAWING TASK: Upload Checklist */}
                    {currentUser.role === UserRole.DRAWING_TEAM &&
                        task.type === TaskType.DRAWING_TASK && (
                            <div className="mb-6 space-y-3">
                                <p className="text-sm font-medium text-gray-700 mb-2">Upload Requirements:</p>
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
                            {submitting ? 'Submitting...' : 'Complete Task'}
                        </button>
                    </div>
                </Dialog.Panel>
            </div>
        </Dialog>
    );
};

export default WorkQueuePage;

