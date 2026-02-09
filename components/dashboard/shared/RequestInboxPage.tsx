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
    collection,
    getDocs,
    getDoc,
    Timestamp
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
    UserGroupIcon,
    ChartBarIcon,
    XMarkIcon,
    UserCircleIcon
} from '@heroicons/react/24/outline';

interface TaskWithCase extends CaseTask {
    caseName?: string;
    clientName?: string;
}

interface StaffUser {
    id: string;
    name: string;
    role: UserRole;
    email?: string;
    profilePicture?: string;
}

const RequestInboxPage: React.FC = () => {
    const { currentUser } = useAuth();
    const [tasks, setTasks] = useState<TaskWithCase[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTask, setSelectedTask] = useState<TaskWithCase | null>(null);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [editedNotes, setEditedNotes] = useState('');
    const [editedDeadline, setEditedDeadline] = useState('');

    // Permission check - only Admin and Manager can access
    const hasAccess = currentUser?.role === UserRole.SUPER_ADMIN || 
                      currentUser?.role === UserRole.SALES_GENERAL_MANAGER;

    // Fetch staff users only when assign modal opens (deferred for faster initial load)
    useEffect(() => {
        if (!showAssignModal || !db || staffUsers.length > 0) return;
        let cancelled = false;
        const fetchStaffUsers = async () => {
            try {
                const snapshot = await getDocs(collection(db, FIRESTORE_COLLECTIONS.STAFF_USERS));
                if (cancelled) return;
                const users: StaffUser[] = snapshot.docs.map((d) => {
                    const data = d.data();
                    return {
                        id: d.id,
                        name: data.name,
                        role: data.role,
                        email: data.email,
                        profilePicture: data.profilePicture
                    };
                });
                setStaffUsers(users);
            } catch (err) {
                console.error('Error fetching staff users:', err);
            }
        };
        fetchStaffUsers();
        return () => { cancelled = true; };
    }, [showAssignModal]);

    // Fetch all tasks from cases/{caseId}/tasks
    useEffect(() => {
        if (!db || !hasAccess) {
            setLoading(false);
            return;
        }

        try {
            const tasksQuery = query(
                collectionGroup(db, FIRESTORE_COLLECTIONS.TASKS)
            );

            const unsubscribe = onSnapshot(tasksQuery, async (snapshot) => {
                const docs = snapshot.docs;
                const caseIds = [...new Set(docs.map((d) => d.data().caseId).filter(Boolean))] as string[];

                // Fetch all case details in parallel (one batch instead of N sequential reads)
                const caseMap = new Map<string, Case>();
                if (caseIds.length > 0) {
                    const caseSnaps = await Promise.all(
                        caseIds.map((id) => getDoc(doc(db, FIRESTORE_COLLECTIONS.CASES, id)))
                    );
                    caseSnaps.forEach((snap, i) => {
                        if (snap.exists() && caseIds[i]) {
                            caseMap.set(caseIds[i], snap.data() as Case);
                        }
                    });
                }

                const tasksData: TaskWithCase[] = docs.map((docSnap) => {
                    const data = docSnap.data();
                    const taskData = {
                        ...data,
                        id: docSnap.id,
                        createdAt: data.createdAt instanceof Timestamp
                            ? data.createdAt.toDate()
                            : new Date(data.createdAt),
                        deadline: data.deadline instanceof Timestamp
                            ? data.deadline.toDate()
                            : data.deadline ? new Date(data.deadline) : undefined,
                    } as TaskWithCase;

                    const caseData = data.caseId ? caseMap.get(data.caseId) : undefined;
                    if (caseData) {
                        taskData.caseName = caseData.title;
                        taskData.clientName = caseData.clientName;
                    }

                    return taskData;
                });

                tasksData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
                setTasks(tasksData);
                setLoading(false);
            }, (error) => {
                console.error('Error in tasks snapshot listener:', error);
                console.error('Error code:', error.code);
                console.error('Error message:', error.message);
                setLoading(false);
            });

            return () => unsubscribe();
        } catch (err) {
            console.error('Error fetching tasks:', err);
            setLoading(false);
        }
    }, [hasAccess]);

    // Categorize tasks by status
    const { pendingTasks, ongoingTasks, completedTasks } = useMemo(() => {
        return {
            pendingTasks: tasks.filter(t => t.status === TaskStatus.PENDING),
            ongoingTasks: tasks.filter(t => t.status === TaskStatus.STARTED),
            completedTasks: tasks.filter(t => t.status === TaskStatus.COMPLETED)
        };
    }, [tasks]);

    const handleTaskClick = (task: TaskWithCase) => {
        setSelectedTask(task);
        setEditedNotes(task.notes || '');
        setEditedDeadline(task.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : '');
        setShowAssignModal(true);
    };

    const handleAssignTask = async () => {
        if (!selectedTask || !selectedUserId) {
            alert('Please select a team member to assign');
            return;
        }

        try {
            const taskRef = doc(
                db,
                FIRESTORE_COLLECTIONS.CASES,
                selectedTask.caseId,
                FIRESTORE_COLLECTIONS.TASKS,
                selectedTask.id
            );

            await updateDoc(taskRef, {
                assignedTo: selectedUserId,
                status: TaskStatus.PENDING,
                notes: editedNotes,
                deadline: editedDeadline ? new Date(editedDeadline) : null,
                assignedAt: new Date(),
                startedAt: null,
                completedAt: null
            });

            setShowAssignModal(false);
            setSelectedTask(null);
            setSelectedUserId('');
            setEditedNotes('');
            setEditedDeadline('');
        } catch (err) {
            console.error('Error assigning task:', err);
            alert('Failed to assign task. Please try again.');
        }
    };

    // Get user name by ID
    const getUserName = (userId: string) => {
        const user = staffUsers.find(u => u.id === userId);
        return user ? user.name : 'Unknown';
    };

    // Get role-specific users with prioritization
    const getRoleBasedUsers = (taskType: TaskType): StaffUser[] => {
        const roleMapping: Record<TaskType, UserRole[]> = {
            [TaskType.SITE_VISIT]: [UserRole.SITE_ENGINEER],
            [TaskType.SITE_INSPECTION]: [UserRole.SITE_ENGINEER],
            [TaskType.DRAWING]: [UserRole.DRAWING_TEAM],
            [TaskType.DRAWING_TASK]: [UserRole.DRAWING_TEAM],
            [TaskType.BOQ]: [UserRole.QUOTATION_TEAM],
            [TaskType.QUOTATION]: [UserRole.QUOTATION_TEAM],
            [TaskType.QUOTATION_TASK]: [UserRole.QUOTATION_TEAM],
            [TaskType.PROCUREMENT_AUDIT]: [UserRole.PROCUREMENT_TEAM],
            [TaskType.PROCUREMENT_BIDDING]: [UserRole.PROCUREMENT_TEAM],
            [TaskType.EXECUTION]: [UserRole.EXECUTION_TEAM],
            [TaskType.EXECUTION_TASK]: [UserRole.EXECUTION_TEAM],
            [TaskType.SALES_CONTACT]: [UserRole.SALES_TEAM_MEMBER]
        };

        const relevantRoles = roleMapping[taskType] || [];
        
        // Separate users into priority (matching role) and others
        const priorityUsers = staffUsers.filter(user => relevantRoles.includes(user.role));
        const otherUsers = staffUsers.filter(user => !relevantRoles.includes(user.role));
        
        // Return priority users first, then others
        return [...priorityUsers, ...otherUsers];
    };

    const renderTaskCard = (task: TaskWithCase) => (
        <div 
            key={task.id}
            onClick={() => handleTaskClick(task)}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md cursor-pointer transition-all"
        >
            <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-900">{task.type}</h3>
                <span className="text-xs text-gray-500">
                    {task.createdAt.toLocaleDateString()}
                </span>
            </div>
            
            <p className="text-sm text-gray-600 mb-2">{task.clientName}</p>
            
            {task.notes && (
                <p className="text-sm text-gray-500 line-clamp-2 mb-2">{task.notes}</p>
            )}
            
            {task.assignedTo && (
                <div className="flex items-center text-xs text-gray-500 mt-2">
                    <UserGroupIcon className="w-4 h-4 mr-1" />
                    Assigned to: {getUserName(task.assignedTo)}
                </div>
            )}
            
            {task.deadline && (
                <div className="flex items-center text-xs text-gray-500 mt-1">
                    <ClockIcon className="w-4 h-4 mr-1" />
                    Due: {new Date(task.deadline).toLocaleString()}
                </div>
            )}
        </div>
    );

    if (!hasAccess) {
        return (
            <div className="p-8">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <h2 className="text-xl font-bold text-red-900 mb-2">Access Denied</h2>
                    <p className="text-red-700">Only Admin and Managers can access the Request Inbox.</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Request Inbox</h1>
                <p className="text-gray-600 mt-2">Manage and assign team requests</p>
            </div>

            {/* KPI Buckets */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-yellow-800">Pending Approval</p>
                            <p className="text-3xl font-bold text-yellow-900 mt-2">{pendingTasks.length}</p>
                        </div>
                        <ClockIcon className="w-12 h-12 text-yellow-400" />
                    </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-blue-800">Ongoing</p>
                            <p className="text-3xl font-bold text-blue-900 mt-2">{ongoingTasks.length}</p>
                        </div>
                        <PlayIcon className="w-12 h-12 text-blue-400" />
                    </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-green-800">Completed</p>
                            <p className="text-3xl font-bold text-green-900 mt-2">{completedTasks.length}</p>
                        </div>
                        <CheckCircleIcon className="w-12 h-12 text-green-400" />
                    </div>
                </div>
            </div>

            {/* Task Columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Pending for Approval */}
                <div className="bg-gray-50 rounded-lg p-4">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <ClockIcon className="w-5 h-5 mr-2 text-yellow-500" />
                        Pending for Approval ({pendingTasks.length})
                    </h2>
                    <div className="space-y-3 max-h-[600px] overflow-y-auto">
                        {pendingTasks.length === 0 ? (
                            <p className="text-center text-gray-500 py-8">No pending requests</p>
                        ) : (
                            pendingTasks.map(renderTaskCard)
                        )}
                    </div>
                </div>

                {/* Ongoing */}
                <div className="bg-gray-50 rounded-lg p-4">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <PlayIcon className="w-5 h-5 mr-2 text-blue-500" />
                        Ongoing ({ongoingTasks.length})
                    </h2>
                    <div className="space-y-3 max-h-[600px] overflow-y-auto">
                        {ongoingTasks.length === 0 ? (
                            <p className="text-center text-gray-500 py-8">No ongoing tasks</p>
                        ) : (
                            ongoingTasks.map(renderTaskCard)
                        )}
                    </div>
                </div>

                {/* Completed */}
                <div className="bg-gray-50 rounded-lg p-4">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <CheckCircleIcon className="w-5 h-5 mr-2 text-green-500" />
                        Completed ({completedTasks.length})
                    </h2>
                    <div className="space-y-3 max-h-[600px] overflow-y-auto">
                        {completedTasks.length === 0 ? (
                            <p className="text-center text-gray-500 py-8">No completed tasks</p>
                        ) : (
                            completedTasks.map(renderTaskCard)
                        )}
                    </div>
                </div>
            </div>

            {/* Assignment Modal */}
            {showAssignModal && selectedTask && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="text-xl font-semibold text-gray-900">
                                {selectedTask.status === TaskStatus.PENDING ? 'Assign Task' : 'Task Details'}
                            </h3>
                            <button 
                                onClick={() => {
                                    setShowAssignModal(false);
                                    setSelectedTask(null);
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            {/* Task Details */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Task Type</label>
                                <input 
                                    type="text" 
                                    value={selectedTask.type}
                                    disabled
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
                                <input 
                                    type="text" 
                                    value={selectedTask.clientName || 'N/A'}
                                    disabled
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    value={editedNotes}
                                    onChange={(e) => setEditedNotes(e.target.value)}
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    placeholder="Add task description..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                                <input
                                    type="datetime-local"
                                    value={editedDeadline}
                                    onChange={(e) => setEditedDeadline(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                />
                            </div>

                            {selectedTask.status === TaskStatus.PENDING && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                        Select Team Member *
                                    </label>
                                    
                                    {/* Team Members Grid */}
                                    <div className="max-h-[400px] overflow-y-auto border border-gray-200 rounded-lg p-4 bg-gray-50">
                                        <div className="grid grid-cols-2 gap-3">
                                            {getRoleBasedUsers(selectedTask.type).map((user, index) => {
                                                const isRelevant = getRoleBasedUsers(selectedTask.type).findIndex(u => u.id === user.id) < 
                                                    staffUsers.filter(u => {
                                                        const roleMapping: Record<TaskType, UserRole[]> = {
                                                            [TaskType.SITE_VISIT]: [UserRole.SITE_ENGINEER],
                                                            [TaskType.SITE_INSPECTION]: [UserRole.SITE_ENGINEER],
                                                            [TaskType.DRAWING]: [UserRole.DRAWING_TEAM],
                                                            [TaskType.DRAWING_TASK]: [UserRole.DRAWING_TEAM],
                                                            [TaskType.BOQ]: [UserRole.QUOTATION_TEAM],
                                                            [TaskType.QUOTATION]: [UserRole.QUOTATION_TEAM],
                                                            [TaskType.QUOTATION_TASK]: [UserRole.QUOTATION_TEAM],
                                                            [TaskType.PROCUREMENT_AUDIT]: [UserRole.PROCUREMENT_TEAM],
                                                            [TaskType.PROCUREMENT_BIDDING]: [UserRole.PROCUREMENT_TEAM],
                                                            [TaskType.EXECUTION]: [UserRole.EXECUTION_TEAM],
                                                            [TaskType.EXECUTION_TASK]: [UserRole.EXECUTION_TEAM],
                                                            [TaskType.SALES_CONTACT]: [UserRole.SALES_TEAM_MEMBER]
                                                        };
                                                        const relevantRoles = roleMapping[selectedTask.type] || [];
                                                        return relevantRoles.includes(u.role);
                                                    }).length;
                                                
                                                return (
                                                    <button
                                                        key={user.id}
                                                        type="button"
                                                        onClick={() => setSelectedUserId(user.id)}
                                                        className={`
                                                            relative p-3 rounded-lg border-2 transition-all text-left
                                                            ${selectedUserId === user.id 
                                                                ? 'border-primary bg-primary/10' 
                                                                : 'border-gray-200 hover:border-gray-300 bg-white'
                                                            }
                                                            ${isRelevant ? 'ring-2 ring-blue-200' : ''}
                                                        `}
                                                    >
                                                        {isRelevant && (
                                                            <span className="absolute top-2 right-2 text-xs font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                                                                Priority
                                                            </span>
                                                        )}
                                                        <div className="flex items-center space-x-3">
                                                            {user.profilePicture ? (
                                                                <img 
                                                                    src={user.profilePicture} 
                                                                    alt={user.name}
                                                                    className="w-12 h-12 rounded-full object-cover"
                                                                />
                                                            ) : (
                                                                <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
                                                                    <UserCircleIcon className="w-8 h-8 text-gray-600" />
                                                                </div>
                                                            )}
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-semibold text-gray-900 truncate">
                                                                    {user.name}
                                                                </p>
                                                                <p className="text-xs text-gray-600 truncate">
                                                                    {user.role}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        {selectedUserId === user.id && (
                                                            <div className="absolute top-2 left-2">
                                                                <CheckCircleIcon className="w-5 h-5 text-primary" />
                                                            </div>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    
                                    <p className="text-xs text-gray-500 mt-2">
                                        {staffUsers.filter(u => {
                                            const roleMapping: Record<TaskType, UserRole[]> = {
                                                [TaskType.SITE_VISIT]: [UserRole.SITE_ENGINEER],
                                                [TaskType.SITE_INSPECTION]: [UserRole.SITE_ENGINEER],
                                                [TaskType.DRAWING]: [UserRole.DRAWING_TEAM],
                                                [TaskType.DRAWING_TASK]: [UserRole.DRAWING_TEAM],
                                                [TaskType.BOQ]: [UserRole.QUOTATION_TEAM],
                                                [TaskType.QUOTATION]: [UserRole.QUOTATION_TEAM],
                                                [TaskType.QUOTATION_TASK]: [UserRole.QUOTATION_TEAM],
                                                [TaskType.PROCUREMENT_AUDIT]: [UserRole.PROCUREMENT_TEAM],
                                                [TaskType.PROCUREMENT_BIDDING]: [UserRole.PROCUREMENT_TEAM],
                                                [TaskType.EXECUTION]: [UserRole.EXECUTION_TEAM],
                                                [TaskType.EXECUTION_TASK]: [UserRole.EXECUTION_TEAM],
                                                [TaskType.SALES_CONTACT]: [UserRole.SALES_TEAM_MEMBER]
                                            };
                                            const relevantRoles = roleMapping[selectedTask.type] || [];
                                            return relevantRoles.includes(u.role);
                                        }).length} priority team members available for this task type. Other team members shown below.
                                    </p>
                                </div>
                            )}

                            {selectedTask.status !== TaskStatus.PENDING && (
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="text-sm text-gray-600">
                                        <strong>Assigned to:</strong> {getUserName(selectedTask.assignedTo)}
                                    </p>
                                    <p className="text-sm text-gray-600 mt-1">
                                        <strong>Status:</strong> {selectedTask.status}
                                    </p>
                                </div>
                            )}

                            {/* Action Buttons */}
                            {selectedTask.status === TaskStatus.PENDING && (
                                <div className="flex space-x-3 pt-4 border-t border-gray-200">
                                    <button
                                        onClick={handleAssignTask}
                                        disabled={!selectedUserId}
                                        className="flex-1 bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Assign & Approve
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowAssignModal(false);
                                            setSelectedTask(null);
                                        }}
                                        className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RequestInboxPage;
