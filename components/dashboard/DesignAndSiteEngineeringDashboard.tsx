import React, { useState, useEffect } from 'react';
import { UserRole, TaskType, TaskStatus } from '../../types';
import { useAuth } from '../../context/AuthContext';
import MyDayPage from './shared/MyDayPage';
import CommunicationDashboard from '../communication/CommunicationDashboard';
import EscalateIssuePage from '../escalation/EscalateIssuePage';
import SiteEngineerWorkQueuePage from './site-engineer/SiteEngineerWorkQueuePage';
import DrawingWorkQueuePage from './drawing-team/DrawingWorkQueuePage';
import { db } from '../../firebase';
import { collectionGroup, query, where, onSnapshot, doc, getDoc, Timestamp } from 'firebase/firestore';
import { FIRESTORE_COLLECTIONS } from '../../constants';
import type { CaseTask, Case } from '../../types';
import { ClockIcon, CheckCircleIcon, PlayIcon } from '@heroicons/react/24/outline';

interface TaskWithCase extends CaseTask {
    projectName?: string;
    clientName?: string;
}

const DesignAndSiteEngineeringDashboard: React.FC<{ currentPage: string, setCurrentPage: (page: string) => void }> = ({ currentPage, setCurrentPage }) => {
    const { currentUser } = useAuth();
    const [siteVisitTasks, setSiteVisitTasks] = useState<TaskWithCase[]>([]);
    const [drawingTasks, setDrawingTasks] = useState<TaskWithCase[]>([]);
    const [loading, setLoading] = useState(true);

    // FETCH BOTH SITE_VISIT AND DRAWING_TASK
    useEffect(() => {
        if (!db || !currentUser?.id) {
            setLoading(false);
            return;
        } // Never pass undefined to where()

        const siteQuery = query(
            collectionGroup(db, FIRESTORE_COLLECTIONS.TASKS),
            where('assignedTo', '==', currentUser.id),
            where('type', '==', TaskType.SITE_VISIT)
        );

        const drawingQuery = query(
            collectionGroup(db, FIRESTORE_COLLECTIONS.TASKS),
            where('assignedTo', '==', currentUser.id),
            where('type', '==', TaskType.DRAWING_TASK)
        );

        const unsubscribeSite = onSnapshot(siteQuery, async (snapshot) => {
            const tasks: TaskWithCase[] = [];
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
                    console.error('Error fetching case:', err);
                }

                tasks.push({
                    ...taskData,
                    id: taskDoc.id,
                    projectName,
                    clientName,
                    createdAt: taskData.createdAt instanceof Timestamp ? taskData.createdAt.toDate() : new Date(taskData.createdAt),
                    startedAt: taskData.startedAt instanceof Timestamp ? taskData.startedAt.toDate() : taskData.startedAt ? new Date(taskData.startedAt) : undefined,
                    completedAt: taskData.completedAt instanceof Timestamp ? taskData.completedAt.toDate() : taskData.completedAt ? new Date(taskData.completedAt) : undefined
                });
            }
            setSiteVisitTasks(tasks);
            setLoading(false);
        });

        const unsubscribeDrawing = onSnapshot(drawingQuery, async (snapshot) => {
            const tasks: TaskWithCase[] = [];
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
                    console.error('Error fetching case:', err);
                }

                tasks.push({
                    ...taskData,
                    id: taskDoc.id,
                    projectName,
                    clientName,
                    createdAt: taskData.createdAt instanceof Timestamp ? taskData.createdAt.toDate() : new Date(taskData.createdAt),
                    deadline: taskData.deadline instanceof Timestamp ? taskData.deadline.toDate() : taskData.deadline ? new Date(taskData.deadline) : undefined,
                    startedAt: taskData.startedAt instanceof Timestamp ? taskData.startedAt.toDate() : taskData.startedAt ? new Date(taskData.startedAt) : undefined,
                    completedAt: taskData.completedAt instanceof Timestamp ? taskData.completedAt.toDate() : taskData.completedAt ? new Date(taskData.completedAt) : undefined
                });
            }
            setDrawingTasks(tasks);
        });

        return () => {
            unsubscribeSite();
            unsubscribeDrawing();
        };
    }, [currentUser]);

    const renderPage = () => {
        switch (currentPage) {
            case 'my-day':
                return <MyDayPage />;
            case 'work-queue':
                // Route based on user role
                if (currentUser?.role === UserRole.SITE_ENGINEER) {
                    return <SiteEngineerWorkQueuePage />;
                } else if (currentUser?.role === UserRole.DRAWING_TEAM) {
                    return <DrawingWorkQueuePage />;
                }
                return <SiteEngineerWorkQueuePage />; // Default fallback
            case 'communication':
                return <CommunicationDashboard />;
            case 'escalate-issue':
                return <EscalateIssuePage setCurrentPage={setCurrentPage} />;
            default:
                // DASHBOARD HOME - SHOW BOTH SECTIONS
                return (
                    <div className="p-8 max-w-7xl mx-auto space-y-8">
                        {/* Site Visits Section */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">Site Visits</h2>
                                    <p className="text-gray-600 text-sm">Your assigned site visit tasks</p>
                                </div>
                                <button
                                    onClick={() => setCurrentPage('work-queue')}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                                >
                                    View All
                                </button>
                            </div>

                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                    <div className="flex items-center gap-2">
                                        <ClockIcon className="w-6 h-6 text-yellow-600" />
                                        <div>
                                            <p className="text-2xl font-bold text-yellow-900">
                                                {siteVisitTasks.filter(t => t.status === TaskStatus.PENDING).length}
                                            </p>
                                            <p className="text-xs text-yellow-700">Pending</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <div className="flex items-center gap-2">
                                        <PlayIcon className="w-6 h-6 text-blue-600" />
                                        <div>
                                            <p className="text-2xl font-bold text-blue-900">
                                                {siteVisitTasks.filter(t => t.status === TaskStatus.STARTED).length}
                                            </p>
                                            <p className="text-xs text-blue-700">In Progress</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <div className="flex items-center gap-2">
                                        <CheckCircleIcon className="w-6 h-6 text-green-600" />
                                        <div>
                                            <p className="text-2xl font-bold text-green-900">
                                                {siteVisitTasks.filter(t => t.status === TaskStatus.COMPLETED).length}
                                            </p>
                                            <p className="text-xs text-green-700">Completed</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {loading ? (
                                <div className="text-center py-8 text-gray-500">Loading site visits...</div>
                            ) : siteVisitTasks.length === 0 ? (
                                <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-8 text-center">
                                    <p className="text-gray-500">No site visit tasks assigned</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {siteVisitTasks.slice(0, 5).map((task) => (
                                        <div key={task.id} className="bg-white border border-gray-200 rounded-lg p-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h3 className="font-bold text-gray-900">{task.projectName}</h3>
                                                    <p className="text-sm text-gray-600">Client: {task.clientName}</p>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                    task.status === TaskStatus.PENDING ? 'bg-yellow-100 text-yellow-800' :
                                                    task.status === TaskStatus.STARTED ? 'bg-blue-100 text-blue-800' :
                                                    'bg-green-100 text-green-800'
                                                }`}>
                                                    {task.status.toUpperCase()}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Drawing Tasks Section */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">Drawing Tasks</h2>
                                    <p className="text-gray-600 text-sm">Your assigned drawing tasks</p>
                                </div>
                                <button
                                    onClick={() => setCurrentPage('work-queue')}
                                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                                >
                                    View All
                                </button>
                            </div>

                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                    <div className="flex items-center gap-2">
                                        <ClockIcon className="w-6 h-6 text-yellow-600" />
                                        <div>
                                            <p className="text-2xl font-bold text-yellow-900">
                                                {drawingTasks.filter(t => t.status === TaskStatus.PENDING).length}
                                            </p>
                                            <p className="text-xs text-yellow-700">Pending</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <div className="flex items-center gap-2">
                                        <PlayIcon className="w-6 h-6 text-blue-600" />
                                        <div>
                                            <p className="text-2xl font-bold text-blue-900">
                                                {drawingTasks.filter(t => t.status === TaskStatus.STARTED).length}
                                            </p>
                                            <p className="text-xs text-blue-700">In Progress</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <div className="flex items-center gap-2">
                                        <CheckCircleIcon className="w-6 h-6 text-green-600" />
                                        <div>
                                            <p className="text-2xl font-bold text-green-900">
                                                {drawingTasks.filter(t => t.status === TaskStatus.COMPLETED).length}
                                            </p>
                                            <p className="text-xs text-green-700">Completed</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {loading ? (
                                <div className="text-center py-8 text-gray-500">Loading drawing tasks...</div>
                            ) : drawingTasks.length === 0 ? (
                                <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-8 text-center">
                                    <p className="text-gray-500">No drawing tasks assigned</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {drawingTasks.slice(0, 5).map((task) => {
                                        const isOverdue = task.deadline && new Date() > task.deadline && task.status !== TaskStatus.COMPLETED;
                                        return (
                                            <div key={task.id} className={`border rounded-lg p-4 ${
                                                isOverdue ? 'bg-red-50 border-red-300' : 'bg-white border-gray-200'
                                            }`}>
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h3 className="font-bold text-gray-900">{task.projectName}</h3>
                                                        <p className="text-sm text-gray-600">Client: {task.clientName}</p>
                                                        {task.deadline && (
                                                            <p className={`text-xs mt-1 ${isOverdue ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                                                                Deadline: {task.deadline.toLocaleString()}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                        task.status === TaskStatus.PENDING ? 'bg-yellow-100 text-yellow-800' :
                                                        task.status === TaskStatus.STARTED ? 'bg-blue-100 text-blue-800' :
                                                        'bg-green-100 text-green-800'
                                                    }`}>
                                                        {task.status.toUpperCase()}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                );
        }
    };

    return renderPage();
};

export default DesignAndSiteEngineeringDashboard;
