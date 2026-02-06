import React, { useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useMyDayTasks, updateTask } from '../../../hooks/useMyDayTasks';
import { Task, TaskStatus } from '../../../types';
import { ClockIcon, CheckCircleIcon, PlayIcon } from '../../icons/IconComponents';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { FIRESTORE_COLLECTIONS, safeDate } from '../../../constants';

const QuotationRequestInbox: React.FC = () => {
    const { currentUser } = useAuth();
    const { tasks } = useMyDayTasks(currentUser?.id);

    // Filter tasks for quotation team
    const quotationTasks = useMemo(() => {
        if (!currentUser) return [];

        return tasks.filter(task =>
            task.assignedTo === currentUser.id &&
            task.taskType === 'Quotation' &&
            task.status !== TaskStatus.ACKNOWLEDGED
        ).sort((a, b) => {
            // Sort by status priority, then by created date
            const statusOrder = {
                [TaskStatus.ASSIGNED]: 1,
                [TaskStatus.ONGOING]: 2,
                [TaskStatus.COMPLETED]: 3,
            };

            const aOrder = statusOrder[a.status as keyof typeof statusOrder] || 99;
            const bOrder = statusOrder[b.status as keyof typeof statusOrder] || 99;

            if (aOrder !== bOrder) return aOrder - bOrder;

            const getTime = (d: any) => d?.toMillis ? d.toMillis() : d?.toDate ? d.toDate().getTime() : new Date(d || 0).getTime();
            return getTime(b.createdAt) - getTime(a.createdAt);
        });
    }, [tasks, currentUser]);

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
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
                        {status}
                    </span>
                );
        }
    };

    const handleStartTask = async (task: Task) => {
        if (task.status !== TaskStatus.ASSIGNED) return;

        try {
            await updateTask(task.id, {
                status: TaskStatus.ONGOING,
                startedAt: new Date(),
            });
            alert('✅ Task started! Status updated to ONGOING.');
        } catch (error) {
            console.error('Error starting task:', error);
            alert('❌ Failed to start task. Please try again.');
        }
    };

    const handleCompleteTask = async (task: Task) => {
        if (task.status !== TaskStatus.ONGOING) {
            alert('⚠️ Please start the task first before marking it complete.');
            return;
        }

        if (!task.relatedDocumentId) {
            alert('⚠️ Please upload the quotation first before marking complete.\n\nGo to Quotation Builder and submit the quotation for this project.');
            return;
        }

        try {
            await updateTask(task.id, {
                status: TaskStatus.COMPLETED,
                completedAt: new Date(),
            });
            alert('✅ Task completed! Admin/Sales Manager has been notified.');
        } catch (error) {
            console.error('Error completing task:', error);
            alert('❌ Failed to complete task. Please try again.');
        }
    };

    const getTaskActions = (task: Task) => {
        switch (task.status) {
            case TaskStatus.ASSIGNED:
                return (
                    <button
                        onClick={() => handleStartTask(task)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                        Start Task
                    </button>
                );
            case TaskStatus.ONGOING:
                return (
                    <button
                        onClick={() => handleCompleteTask(task)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                        Mark Complete
                    </button>
                );
            case TaskStatus.COMPLETED:
                return (
                    <div className="text-sm text-green-700 font-medium">
                        ✔ Awaiting Admin Review
                    </div>
                );
            default:
                return null;
        }
    };


    if (!currentUser) {
        return <div className="p-6">Loading...</div>;
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-text-primary mb-2">
                    Request Inbox
                </h1>
                <p className="text-text-secondary">
                    Quotation requests assigned to you
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="text-3xl font-bold text-blue-700">
                        {quotationTasks.filter(t => t.status === TaskStatus.ASSIGNED).length}
                    </div>
                    <div className="text-sm text-blue-600 font-medium mt-1">
                        Assigned
                    </div>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                    <div className="text-3xl font-bold text-orange-700">
                        {quotationTasks.filter(t => t.status === TaskStatus.ONGOING).length}
                    </div>
                    <div className="text-sm text-orange-600 font-medium mt-1">
                        Ongoing
                    </div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <div className="text-3xl font-bold text-green-700">
                        {quotationTasks.filter(t => t.status === TaskStatus.COMPLETED).length}
                    </div>
                    <div className="text-sm text-green-600 font-medium mt-1">
                        Completed
                    </div>
                </div>
            </div>

            {/* Task List */}
            <div className="space-y-4">
                {quotationTasks.length === 0 ? (
                    <div className="bg-surface rounded-xl border border-border p-12 text-center">
                        <div className="text-4xl mb-4">📭</div>
                        <h3 className="text-lg font-semibold text-text-primary mb-2">
                            No Requests
                        </h3>
                        <p className="text-text-secondary">
                            You don't have any quotation requests at the moment.
                        </p>
                    </div>
                ) : (
                    quotationTasks.map(task => (
                        <div
                            key={task.id}
                            className="bg-surface rounded-xl border border-border p-6 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        {getStatusBadge(task.status)}
                                        {task.priority === 'High' && (
                                            <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-semibold">
                                                HIGH PRIORITY
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-xl font-bold text-text-primary mb-1">
                                        {task.title}
                                    </h3>
                                    <p className="text-text-secondary text-sm">
                                        {task.description || 'No description provided'}
                                    </p>
                                </div>
                                <div className="ml-4">
                                    {getTaskActions(task)}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border">
                                <div>
                                    <div className="text-xs text-text-tertiary font-medium mb-1">
                                        REQUESTED BY
                                    </div>
                                    <div className="text-sm font-semibold text-text-primary">
                                        {task.createdByName || 'Admin'}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-text-tertiary font-medium mb-1">
                                        PROJECT
                                    </div>
                                    <div className="text-sm font-semibold text-text-primary">
                                        {task.targetName || 'N/A'}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-text-tertiary font-medium mb-1">
                                        DUE DATE
                                    </div>
                                    <div className="text-sm font-semibold text-text-primary">
                                        {safeDate(task.dueAt || task.deadline)}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-text-tertiary font-medium mb-1">
                                        CREATED
                                    </div>
                                    <div className="text-sm font-semibold text-text-primary">
                                        {safeDate(task.createdAt)}
                                    </div>
                                </div>
                            </div>

                            {task.status === TaskStatus.COMPLETED && (
                                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                                    <p className="text-sm text-green-700">
                                        ✔ Completed on {safeDate(task.completedAt)} - Awaiting admin acknowledgement
                                    </p>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default QuotationRequestInbox;
