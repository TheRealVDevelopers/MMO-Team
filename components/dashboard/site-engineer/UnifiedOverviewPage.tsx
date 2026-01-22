import React, { useState } from 'react';
import { ClipboardList, Pencil, FileText, Calendar } from 'lucide-react';
import { DrawingTask, SiteVisit } from '../../../types';
import Card from '../../shared/Card';
import { useAuth } from '../../../context/AuthContext';
import { useAutomatedTaskCreation } from '../../../hooks/useAutomatedTaskCreation';

interface UnifiedOverviewPageProps {
    visits: SiteVisit[];
    drawingTasks: DrawingTask[];
    onSelectVisit: (visit: SiteVisit) => void;
    onSelectDrawingTask: (task: DrawingTask) => void;
    setCurrentPage: (page: string) => void;
}

const UnifiedOverviewPage: React.FC<UnifiedOverviewPageProps> = ({
    visits,
    drawingTasks,
    onSelectVisit,
    onSelectDrawingTask,
    setCurrentPage
}) => {
    const { currentUser } = useAuth();

    const pendingVisits = visits.filter(v => v.status !== 'Report Submitted' && v.status !== 'Completed');
    const pendingDrawings = drawingTasks.filter(d => d.status !== 'Completed');
    const overdueDrawings = pendingDrawings.filter(d => new Date(d.deadline) < new Date());

    const getDeadlineColor = (deadline: Date) => {
        const hoursLeft = (new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60);
        if (hoursLeft < 0) return 'text-error';
        if (hoursLeft < 6) return 'text-warning';
        return 'text-success';
    };

    const formatTimeLeft = (deadline: Date) => {
        const hoursLeft = Math.floor((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60));
        if (hoursLeft < 0) return `${Math.abs(hoursLeft)}h overdue`;
        if (hoursLeft < 24) return `${hoursLeft}h left`;
        const daysLeft = Math.floor(hoursLeft / 24);
        return `${daysLeft}d left`;
    };

    return (
        <div className="space-y-6">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-text-secondary">Pending Visits</p>
                            <p className="text-2xl font-bold text-text-primary">{pendingVisits.length}</p>
                        </div>
                        <ClipboardList className="w-8 h-8 text-primary" />
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-text-secondary">Drawing Tasks</p>
                            <p className="text-2xl font-bold text-text-primary">{pendingDrawings.length}</p>
                        </div>
                        <Pencil className="w-8 h-8 text-primary" />
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-text-secondary">Overdue Drawings</p>
                            <p className="text-2xl font-bold text-error">{overdueDrawings.length}</p>
                        </div>
                        <Calendar className="w-8 h-8 text-error" />
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-text-secondary">Total Completed</p>
                            <p className="text-2xl font-bold text-success">
                                {visits.filter(v => v.status === 'Report Submitted').length + drawingTasks.filter(d => d.status === 'Completed').length}
                            </p>
                        </div>
                        <FileText className="w-8 h-8 text-success" />
                    </div>
                </Card>
            </div>

            {/* Urgent Drawings (< 6 hours left) */}
            {overdueDrawings.length > 0 && (
                <Card className="p-6 bg-error-subtle-background border-error">
                    <h3 className="text-lg font-bold text-error mb-4">⚠️ Urgent: Overdue Drawings</h3>
                    <div className="space-y-3">
                        {overdueDrawings.map(task => (
                            <div
                                key={task.id}
                                onClick={() => onSelectDrawingTask(task)}
                                className="p-4 bg-surface rounded-lg cursor-pointer hover:bg-subtle-background transition-colors"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-text-primary">{task.projectName}</h4>
                                        <p className="text-sm text-text-secondary">{task.clientName}</p>
                                        <p className="text-xs text-text-secondary mt-1">
                                            {task.metadata?.siteAddress || 'No address'}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-sm font-semibold ${getDeadlineColor(task.deadline)}`}>
                                            {formatTimeLeft(task.deadline)}
                                        </span>
                                        <p className="text-xs text-text-secondary mt-1">
                                            {task.taskType}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Site Inspections */}
                <Card className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-text-primary">Site Inspections</h3>
                        <button
                            onClick={() => setCurrentPage('schedule')}
                            className="text-sm text-primary hover:underline"
                        >
                            View All
                        </button>
                    </div>
                    <div className="space-y-3">
                        {pendingVisits.length === 0 ? (
                            <p className="text-sm text-text-secondary text-center py-8">No pending site visits</p>
                        ) : (
                            pendingVisits.slice(0, 5).map(visit => (
                                <div
                                    key={visit.id}
                                    onClick={() => onSelectVisit(visit)}
                                    className="p-4 bg-subtle-background rounded-lg cursor-pointer hover:bg-surface transition-colors"
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-medium text-text-primary">{visit.projectName}</h4>
                                            <p className="text-sm text-text-secondary">{visit.clientName}</p>
                                            <p className="text-xs text-text-secondary mt-1">{visit.siteAddress}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`text-xs px-2 py-1 rounded ${visit.status === 'Scheduled' ? 'bg-primary-subtle text-primary' :
                                                    visit.status === 'Traveling' ? 'bg-warning-subtle text-warning' :
                                                        visit.status === 'On Site' ? 'bg-success-subtle text-success' :
                                                            'bg-subtle-background text-text-secondary'
                                                }`}>
                                                {visit.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </Card>

                {/* Drawing Tasks */}
                <Card className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-text-primary">Drawing Tasks</h3>
                        <button
                            onClick={() => setCurrentPage('drawings')}
                            className="text-sm text-primary hover:underline"
                        >
                            View All
                        </button>
                    </div>
                    <div className="space-y-3">
                        {pendingDrawings.length === 0 ? (
                            <p className="text-sm text-text-secondary text-center py-8">No pending drawing tasks</p>
                        ) : (
                            pendingDrawings.slice(0, 5).map(task => (
                                <div
                                    key={task.id}
                                    onClick={() => onSelectDrawingTask(task)}
                                    className="p-4 bg-subtle-background rounded-lg cursor-pointer hover:bg-surface transition-colors"
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <h4 className="font-medium text-text-primary">{task.projectName}</h4>
                                            <p className="text-sm text-text-secondary">{task.clientName}</p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className={`text-xs px-2 py-1 rounded ${task.status === 'Pending' ? 'bg-warning-subtle text-warning' :
                                                        task.status === 'In Progress' ? 'bg-primary-subtle text-primary' :
                                                            'bg-success-subtle text-success'
                                                    }`}>
                                                    {task.status}
                                                </span>
                                                <span className={`text-xs px-2 py-1 rounded ${task.priority === 'High' ? 'bg-error-subtle text-error' :
                                                        task.priority === 'Medium' ? 'bg-warning-subtle text-warning' :
                                                            'bg-subtle-background text-text-secondary'
                                                    }`}>
                                                    {task.priority}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className={`text-sm font-semibold ${getDeadlineColor(task.deadline)}`}>
                                                {formatTimeLeft(task.deadline)}
                                            </span>
                                            <p className="text-xs text-text-secondary mt-1">
                                                Due: {new Date(task.deadline).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </Card>
            </div>

            {/* Workflow Info */}
            <Card className="p-6 bg-primary-subtle-background border-primary">
                <h3 className="font-semibold text-primary mb-2">📋 Unified Workflow</h3>
                <p className="text-sm text-text-secondary">
                    Complete site inspections → System auto-creates drawing task (24hr deadline) → Submit drawings → Submit BOQ → Process complete
                </p>
            </Card>
        </div>
    );
};

export default UnifiedOverviewPage;
