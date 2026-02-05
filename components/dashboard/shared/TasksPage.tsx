import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ClipboardDocumentCheckIcon,
    PlayIcon,
    CheckCircleIcon,
    ClockIcon,
    CalendarDaysIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../../context/AuthContext';
import { useAssignedApprovalRequests, startRequest, completeRequest } from '../../../hooks/useApprovalSystem';
import { ApprovalStatus, ApprovalRequestType } from '../../../types';
import { ContentCard, staggerContainer, SectionHeader, cn, StatCard } from './DashboardUI';
import { formatDateTime } from '../../../constants';

const TasksPage: React.FC = () => {
    const { currentUser } = useAuth();
    const { assignedRequests, loading } = useAssignedApprovalRequests(currentUser?.id || '');
    const [processingId, setProcessingId] = useState<string | null>(null);

    const tasks = useMemo(() => {
        // Filter out staff registrations as they are not "tasks"
        return assignedRequests.filter(r => r.requestType !== ApprovalRequestType.STAFF_REGISTRATION);
    }, [assignedRequests]);

    const assignedTasks = tasks.filter(t => t.status === ApprovalStatus.ASSIGNED);
    const ongoingTasks = tasks.filter(t => t.status === ApprovalStatus.ONGOING);
    const completedTasks = tasks.filter(t => t.status === ApprovalStatus.COMPLETED);

    const handleStart = async (taskId: string) => {
        if (!currentUser) return;
        setProcessingId(taskId);
        try {
            await startRequest(taskId, currentUser.id);
        } catch (error) {
            console.error(error);
            alert('Failed to start task.');
        } finally {
            setProcessingId(null);
        }
    };

    const handleComplete = async (taskId: string) => {
        if (!currentUser) return;
        if (!confirm('Are you sure you want to mark this task as completed? The admin will be notified to acknowledge it.')) return;

        setProcessingId(taskId);
        try {
            await completeRequest(taskId, currentUser.id);
        } catch (error) {
            console.error(error);
            alert('Failed to complete task.');
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                <p className="text-xs text-text-tertiary font-bold uppercase tracking-widest">Loading Tasks...</p>
            </div>
        );
    }

    return (
        <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="space-y-8"
        >
            <SectionHeader
                title="My Tasks"
                subtitle="Manage your assigned requests and track progress."
            />

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Assigned Pending"
                    value={assignedTasks.length}
                    icon={<ClipboardDocumentCheckIcon className="w-6 h-6" />}
                    trend={{ value: 'Action Required', positive: false }}
                    className="ring-1 ring-blue-500/20"
                />
                <StatCard
                    title="In Progress"
                    value={ongoingTasks.length}
                    icon={<PlayIcon className="w-6 h-6" />}
                    trend={{ value: 'Active', positive: true }}
                    className="ring-1 ring-yellow-500/20"
                />
                <StatCard
                    title="Completed"
                    value={completedTasks.length}
                    icon={<CheckCircleIcon className="w-6 h-6" />}
                    trend={{ value: 'Awaiting Ack.', positive: true }}
                    className="ring-1 ring-green-500/20"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Column 1: Assigned */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-border">
                        <h3 className="font-bold text-text-primary flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500" />
                            Assigned
                            <span className="text-text-tertiary text-xs bg-surface px-2 py-0.5 rounded-full border border-border">{assignedTasks.length}</span>
                        </h3>
                    </div>

                    <AnimatePresence>
                        {assignedTasks.map(task => (
                            <motion.div
                                key={task.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                            >
                                <ContentCard className="group hover:border-blue-500/30 transition-all">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 text-[9px] font-black uppercase tracking-widest border border-blue-500/20">
                                            {task.requestType}
                                        </span>
                                        {task.priority === 'High' && (
                                            <ExclamationTriangleIcon className="w-4 h-4 text-error" />
                                        )}
                                    </div>

                                    <h4 className="font-bold text-text-primary mb-1 line-clamp-1" title={task.title}>{task.title}</h4>
                                    <p className="text-xs text-text-secondary line-clamp-2 mb-3">{task.description}</p>

                                    <div className="flex items-center gap-2 text-[10px] text-text-tertiary font-medium mb-4">
                                        <CalendarDaysIcon className="w-3.5 h-3.5" />
                                        <span>Due: {task.endDate ? formatDateTime(task.endDate).split(',')[0] : 'No deadline'}</span>
                                    </div>

                                    <button
                                        onClick={() => handleStart(task.id)}
                                        disabled={processingId === task.id}
                                        className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                                    >
                                        {processingId === task.id ? 'Starting...' : (
                                            <>
                                                <PlayIcon className="w-3.5 h-3.5" />
                                                Start Work
                                            </>
                                        )}
                                    </button>
                                </ContentCard>
                            </motion.div>
                        ))}
                        {assignedTasks.length === 0 && (
                            <div className="text-center py-8 text-text-tertiary/50 text-sm">No new assignments</div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Column 2: Ongoing */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-border">
                        <h3 className="font-bold text-text-primary flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-yellow-500" />
                            Ongoing
                            <span className="text-text-tertiary text-xs bg-surface px-2 py-0.5 rounded-full border border-border">{ongoingTasks.length}</span>
                        </h3>
                    </div>

                    <AnimatePresence>
                        {ongoingTasks.map(task => (
                            <motion.div
                                key={task.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                            >
                                <ContentCard className="group hover:border-yellow-500/30 transition-all ring-1 ring-yellow-500/10">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="px-2 py-0.5 rounded-md bg-yellow-500/10 text-yellow-600 text-[9px] font-black uppercase tracking-widest border border-yellow-500/20 animate-pulse">
                                            In Progress
                                        </span>
                                        <ClockIcon className="w-4 h-4 text-yellow-600" />
                                    </div>

                                    <h4 className="font-bold text-text-primary mb-1 line-clamp-1">{task.title}</h4>

                                    {task.startedAt && (
                                        <p className="text-[10px] text-text-tertiary mb-3">
                                            Started: {formatDateTime(task.startedAt)}
                                        </p>
                                    )}

                                    <button
                                        onClick={() => handleComplete(task.id)}
                                        disabled={processingId === task.id}
                                        className="w-full py-2 bg-success hover:bg-success/90 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                                    >
                                        {processingId === task.id ? 'Completing...' : (
                                            <>
                                                <CheckCircleIcon className="w-3.5 h-3.5" />
                                                Complete
                                            </>
                                        )}
                                    </button>
                                </ContentCard>
                            </motion.div>
                        ))}
                        {ongoingTasks.length === 0 && (
                            <div className="text-center py-8 text-text-tertiary/50 text-sm">No active tasks</div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Column 3: Completed */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-border">
                        <h3 className="font-bold text-text-primary flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500" />
                            Completed
                            <span className="text-text-tertiary text-xs bg-surface px-2 py-0.5 rounded-full border border-border">{completedTasks.length}</span>
                        </h3>
                    </div>

                    <AnimatePresence>
                        {completedTasks.map(task => (
                            <motion.div
                                key={task.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                            >
                                <ContentCard className="opacity-75 hover:opacity-100 transition-opacity bg-subtle-background/50">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="px-2 py-0.5 rounded-md bg-green-500/10 text-green-600 text-[9px] font-black uppercase tracking-widest border border-green-500/20">
                                            Completed
                                        </span>
                                        <CheckCircleIcon className="w-4 h-4 text-green-600" />
                                    </div>

                                    <h4 className="font-bold text-text-primary mb-1 line-clamp-1 strike-through">{task.title}</h4>
                                    <p className="text-[10px] text-text-tertiary font-medium">
                                        Wait for Acknowledgement
                                    </p>
                                </ContentCard>
                            </motion.div>
                        ))}
                        {completedTasks.length === 0 && (
                            <div className="text-center py-8 text-text-tertiary/50 text-sm">No completed tasks pending approval</div>
                        )}
                    </AnimatePresence>
                </div>

            </div>
        </motion.div>
    );
};

export default TasksPage;
