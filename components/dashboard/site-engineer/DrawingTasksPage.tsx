import React, { useState } from 'react';
import { DrawingTask } from '../../../types';
import Card from '../../shared/Card';
import { Clock, AlertCircle, CheckCircle2, Pencil } from 'lucide-react';
import { useAutomatedTaskCreation } from '../../../hooks/useAutomatedTaskCreation';
import { useAuth } from '../../../context/AuthContext';
import { safeDate, safeDateTime } from '../../../constants';

interface DrawingTasksPageProps {
    drawingTasks: DrawingTask[];
    onSelectTask: (task: DrawingTask) => void;
    setCurrentPage: (page: string) => void;
}

const DrawingTasksPage: React.FC<DrawingTasksPageProps> = ({
    drawingTasks,
    onSelectTask,
    setCurrentPage
}) => {
    const { currentUser } = useAuth();
    const [filter, setFilter] = useState<'all' | 'pending' | 'in-progress' | 'completed'>('all');

    const filteredTasks = drawingTasks.filter(task => {
        if (filter === 'all') return true;
        if (filter === 'pending') return task.status === 'Pending';
        if (filter === 'in-progress') return task.status === 'In Progress';
        if (filter === 'completed') return task.status === 'Completed';
        return true;
    });

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Pending':
                return <Clock className="w-5 h-5 text-warning" />;
            case 'In Progress':
                return <Pencil className="w-5 h-5 text-primary" />;
            case 'Completed':
                return <CheckCircle2 className="w-5 h-5 text-success" />;
            default:
                return <AlertCircle className="w-5 h-5 text-text-secondary" />;
        }
    };

    const getDeadlineStatus = (deadline: Date) => {
        const hoursLeft = (new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60);
        if (hoursLeft < 0) return { color: 'text-error', label: 'Overdue', bgColor: 'bg-error-subtle' };
        if (hoursLeft < 6) return { color: 'text-warning', label: 'Urgent', bgColor: 'bg-warning-subtle' };
        if (hoursLeft < 24) return { color: 'text-warning', label: 'Due Soon', bgColor: 'bg-warning-subtle' };
        return { color: 'text-success', label: 'On Track', bgColor: 'bg-success-subtle' };
    };

    const formatTimeLeft = (deadline: Date) => {
        const diff = new Date(deadline).getTime() - Date.now();
        const hours = Math.floor(Math.abs(diff) / (1000 * 60 * 60));
        const minutes = Math.floor((Math.abs(diff) % (1000 * 60 * 60)) / (1000 * 60));

        if (diff < 0) {
            return `${hours}h ${minutes}m overdue`;
        }
        if (hours < 24) {
            return `${hours}h ${minutes}m left`;
        }
        const days = Math.floor(hours / 24);
        return `${days}d ${hours % 24}h left`;
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-text-primary">Drawing Tasks</h1>
                <p className="text-text-secondary mt-1">Manage your drawing assignments and submissions</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4">
                    <p className="text-sm text-text-secondary">Total Tasks</p>
                    <p className="text-2xl font-bold text-text-primary">{drawingTasks.length}</p>
                </Card>
                <Card className="p-4">
                    <p className="text-sm text-text-secondary">Pending</p>
                    <p className="text-2xl font-bold text-warning">
                        {drawingTasks.filter(t => t.status === 'Pending').length}
                    </p>
                </Card>
                <Card className="p-4">
                    <p className="text-sm text-text-secondary">In Progress</p>
                    <p className="text-2xl font-bold text-primary">
                        {drawingTasks.filter(t => t.status === 'In Progress').length}
                    </p>
                </Card>
                <Card className="p-4">
                    <p className="text-sm text-text-secondary">Completed</p>
                    <p className="text-2xl font-bold text-success">
                        {drawingTasks.filter(t => t.status === 'Completed').length}
                    </p>
                </Card>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 border-b border-border">
                {['all', 'pending', 'in-progress', 'completed'].map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f as any)}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${filter === f
                            ? 'text-primary border-b-2 border-primary'
                            : 'text-text-secondary hover:text-text-primary'
                            }`}
                    >
                        {f.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </button>
                ))}
            </div>

            {/* Task List */}
            <div className="space-y-4">
                {filteredTasks.length === 0 ? (
                    <Card className="p-12 text-center">
                        <p className="text-text-secondary">No {filter !== 'all' ? filter : ''} drawing tasks found</p>
                    </Card>
                ) : (
                    filteredTasks.map(task => {
                        const deadlineStatus = getDeadlineStatus(task.deadline);
                        return (
                            <Card
                                key={task.id}
                                className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
                                onClick={() => onSelectTask(task)}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            {getStatusIcon(task.status)}
                                            <h3 className="font-semibold text-text-primary">{task.projectName}</h3>
                                            <span className={`text-xs px-2 py-1 rounded ${task.priority === 'High' ? 'bg-error-subtle text-error' :
                                                task.priority === 'Medium' ? 'bg-warning-subtle text-warning' :
                                                    'bg-subtle-background text-text-secondary'
                                                }`}>
                                                {task.priority}
                                            </span>
                                        </div>
                                        <p className="text-sm text-text-secondary mb-1">{task.clientName}</p>
                                        <p className="text-sm text-text-secondary mb-3">
                                            {task.metadata?.siteAddress || 'No address specified'}
                                        </p>
                                        <div className="flex items-center gap-4 text-xs text-text-secondary">
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                Created: {safeDate(task.createdAt)}
                                            </span>
                                            {task.metadata?.measurements && (
                                                <span>📏 Measurements available</span>
                                            )}
                                            {task.siteVisitId && (
                                                <span>✅ Site inspection complete</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right ml-4">
                                        <div className={`${deadlineStatus.bgColor} px-3 py-1 rounded-full mb-2`}>
                                            <span className={`text-sm font-semibold ${deadlineStatus.color}`}>
                                                {deadlineStatus.label}
                                            </span>
                                        </div>
                                        <p className={`text-sm font-semibold ${deadlineStatus.color}`}>
                                            {formatTimeLeft(task.deadline)}
                                        </p>
                                        <p className="text-xs text-text-secondary mt-1">
                                            Due: {safeDateTime(task.deadline)}
                                        </p>
                                        <span className={`inline-block mt-2 text-xs px-2 py-1 rounded ${task.status === 'Pending' ? 'bg-warning-subtle text-warning' :
                                            task.status === 'In Progress' ? 'bg-primary-subtle text-primary' :
                                                'bg-success-subtle text-success'
                                            }`}>
                                            {task.status}
                                        </span>
                                    </div>
                                </div>
                            </Card>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default DrawingTasksPage;
