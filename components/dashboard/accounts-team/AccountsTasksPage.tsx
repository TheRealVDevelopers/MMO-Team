import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { ExecutionTask } from '../../../types';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useExecutionTasks } from '../../../hooks/useExecutionTasks';
import {
    ClockIcon,
    CheckCircleIcon,
    PlayIcon,
    ClipboardDocumentListIcon,
    CalendarIcon,
    UserCircleIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import Card from '../../shared/Card';
import { cn } from '../shared/DashboardUI';

const AccountsTasksPage: React.FC = () => {
    const { currentUser } = useAuth();
    const { tasks: allTasks, loading, updateTaskStatus } = useExecutionTasks();
    const [filter, setFilter] = useState<'all' | 'pending' | 'in-progress' | 'completed'>('all');

    // Filter tasks assigned to current user
    const myTasks = allTasks.filter(task => task.assignedTo === currentUser?.id);

    // Filter by status
    const filteredTasks = myTasks.filter(task => {
        if (filter === 'all') return true;
        if (filter === 'pending') return task.status === 'Pending';
        if (filter === 'in-progress') return task.status === 'In Progress';
        if (filter === 'completed') return task.status === 'Completed';
        return true;
    });

    const handleStatusUpdate = async (taskId: string, newStatus: ExecutionTask['status']) => {
        try {
            await updateTaskStatus(taskId, newStatus);
        } catch (error) {
            console.error('Failed to update task status:', error);
            alert('Failed to update task status');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Completed': return 'bg-success-subtle text-success';
            case 'In Progress': return 'bg-primary-subtle text-primary';
            case 'Pending': return 'bg-warning-subtle text-warning';
            default: return 'bg-subtle-background text-text-secondary';
        }
    };

    const getMissionTypeColor = (type: string) => {
        switch (type) {
            case 'Site Inspection': return 'bg-primary-subtle text-primary';
            case 'Drawing': return 'bg-purple-100 text-purple-700';
            case 'BOQ': return 'bg-warning-subtle text-warning';
            case 'Execution': return 'bg-success-subtle text-success';
            case 'Installation': return 'bg-blue-100 text-blue-700';
            default: return 'bg-subtle-background text-text-secondary';
        }
    };

    // Count tasks by status
    const pendingCount = myTasks.filter(t => t.status === 'Pending').length;
    const inProgressCount = myTasks.filter(t => t.status === 'In Progress').length;
    const completedCount = myTasks.filter(t => t.status === 'Completed').length;

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                <p className="text-text-secondary animate-pulse">Loading tasks...</p>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 bg-subtle-background min-h-full">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-text-primary">My Tasks</h1>
                <p className="text-sm text-text-secondary mt-1">
                    Tasks assigned to you by the Execution Team
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-text-tertiary">Total Tasks</p>
                            <p className="text-2xl font-bold text-text-primary">{myTasks.length}</p>
                        </div>
                        <ClipboardDocumentListIcon className="w-10 h-10 text-text-tertiary" />
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-text-tertiary">Pending</p>
                            <p className="text-2xl font-bold text-warning">{pendingCount}</p>
                        </div>
                        <ClockIcon className="w-10 h-10 text-warning" />
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-text-tertiary">In Progress</p>
                            <p className="text-2xl font-bold text-primary">{inProgressCount}</p>
                        </div>
                        <PlayIcon className="w-10 h-10 text-primary" />
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-text-tertiary">Completed</p>
                            <p className="text-2xl font-bold text-success">{completedCount}</p>
                        </div>
                        <CheckCircleIcon className="w-10 h-10 text-success" />
                    </div>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
                <button
                    onClick={() => setFilter('all')}
                    className={cn(
                        "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                        filter === 'all'
                            ? "bg-primary text-white"
                            : "bg-surface border border-border text-text-secondary hover:bg-subtle-background"
                    )}
                >
                    All ({myTasks.length})
                </button>
                <button
                    onClick={() => setFilter('pending')}
                    className={cn(
                        "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                        filter === 'pending'
                            ? "bg-warning text-white"
                            : "bg-surface border border-border text-text-secondary hover:bg-subtle-background"
                    )}
                >
                    Pending ({pendingCount})
                </button>
                <button
                    onClick={() => setFilter('in-progress')}
                    className={cn(
                        "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                        filter === 'in-progress'
                            ? "bg-primary text-white"
                            : "bg-surface border border-border text-text-secondary hover:bg-subtle-background"
                    )}
                >
                    In Progress ({inProgressCount})
                </button>
                <button
                    onClick={() => setFilter('completed')}
                    className={cn(
                        "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                        filter === 'completed'
                            ? "bg-success text-white"
                            : "bg-surface border border-border text-text-secondary hover:bg-subtle-background"
                    )}
                >
                    Completed ({completedCount})
                </button>
            </div>

            {/* Tasks List */}
            <div className="space-y-4">
                {filteredTasks.length === 0 ? (
                    <Card className="p-12 text-center">
                        <ClipboardDocumentListIcon className="w-12 h-12 mx-auto text-text-tertiary mb-3" />
                        <p className="text-text-primary font-medium">No tasks found</p>
                        <p className="text-sm text-text-secondary">
                            {filter === 'all' 
                                ? "You don't have any tasks assigned yet" 
                                : `No ${filter.replace('-', ' ')} tasks`}
                        </p>
                    </Card>
                ) : (
                    filteredTasks.map(task => (
                        <Card key={task.id} className="p-5 hover:shadow-lg transition-shadow">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="font-semibold text-text-primary">{task.projectName}</h3>
                                        <span className={cn(
                                            "px-2 py-0.5 rounded-full text-xs font-medium",
                                            getMissionTypeColor(task.missionType)
                                        )}>
                                            {task.missionType}
                                        </span>
                                        <span className={cn(
                                            "px-2 py-0.5 rounded-full text-xs font-medium",
                                            getStatusColor(task.status)
                                        )}>
                                            {task.status}
                                        </span>
                                    </div>
                                    <p className="text-sm text-text-secondary mb-3">{task.instructions}</p>
                                    <div className="flex items-center gap-4 text-sm text-text-tertiary">
                                        <span className="flex items-center gap-1">
                                            <CalendarIcon className="w-4 h-4" />
                                            Due: {format(new Date(task.deadline), 'MMM d, yyyy')}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <ClockIcon className="w-4 h-4" />
                                            Created: {format(new Date(task.createdAt), 'MMM d, yyyy')}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 ml-4">
                                    {task.status === 'Pending' && (
                                        <button
                                            onClick={() => handleStatusUpdate(task.id, 'In Progress')}
                                            className="px-3 py-1.5 text-sm border border-primary text-primary rounded-lg hover:bg-primary-subtle transition-all"
                                        >
                                            Start
                                        </button>
                                    )}
                                    {task.status === 'In Progress' && (
                                        <button
                                            onClick={() => handleStatusUpdate(task.id, 'Completed')}
                                            className="px-3 py-1.5 text-sm bg-success text-white rounded-lg hover:bg-success/90 transition-all"
                                        >
                                            Complete
                                        </button>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};

export default AccountsTasksPage;
