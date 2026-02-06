import React, { useState, useEffect } from 'react';
import { GanttTask, UserRole } from '../../../types';
import { useProjects } from '../../../hooks/useProjects'; // ✅ Remove standalone import
import { useAuth } from '../../../context/AuthContext';
import { format } from 'date-fns';
import {
    PlusIcon,
    CalendarIcon,
    CheckCircleIcon,
    ClockIcon
} from '@heroicons/react/24/outline';

const ExecutionGanttPage: React.FC = () => {
    const { projects, updateProject: updateProjectHook } = useProjects(); // ✅ Use hook's updateProject
    const { currentUser } = useAuth();
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [tasks, setTasks] = useState<GanttTask[]>([]);
    const [isEditing, setIsEditing] = useState(false);

    const selectedProject = projects.find(p => p.id === selectedProjectId);

    useEffect(() => {
        console.log('🔄 [GanttPage] Project selected/changed:', {
            selectedProjectId,
            hasProject: !!selectedProject,
            ganttDataLength: selectedProject?.ganttData?.length || 0,
            ganttData: selectedProject?.ganttData
        });

        if (selectedProject?.ganttData) {
            setTasks(selectedProject.ganttData);
            console.log('✅ [GanttPage] Loaded', selectedProject.ganttData.length, 'tasks from project');
        } else {
            setTasks([]);
            console.log('⚠️ [GanttPage] No ganttData found for this project');
        }
    }, [selectedProject]);

    const handleAddTask = () => {
        const newTask: GanttTask = {
            id: `task-${Date.now()}`,
            name: 'New Phase',
            start: new Date(),
            end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week
            progress: 0,
            status: 'Pending',
            type: 'project',
            dependencies: []
        };
        setTasks([...tasks, newTask]);
        setIsEditing(true);
    };

    const handleSaveGantt = async () => {
        if (!selectedProjectId) return;
        
        console.log('💾 [GanttSave] Saving tasks to Firestore:', {
            projectId: selectedProjectId,
            taskCount: tasks.length,
            tasks: tasks.map(t => ({ id: t.id, name: t.name, start: t.start, end: t.end }))
        });
        
        try {
            // ✅ Save ganttData to Firestore using hook
            await updateProjectHook(selectedProjectId, {
                ganttData: tasks
            });
            
            setIsEditing(false);
            console.log('✅ [GanttSave] Tasks saved successfully to Firestore');
            alert('Timeline saved successfully!');
        } catch (err) {
            console.error('❌ [GanttSave] Failed to save tasks:', err);
            alert('Failed to save timeline: ' + (err as Error).message);
        }
    };

    const handleApprovalRequest = async () => {
        if (!selectedProjectId) return;
        alert('Sent for Admin/GM Approval');
    };

    return (
        <div className="p-6 space-y-6 bg-subtle-background min-h-full">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Project Timelines (Gantt)</h1>
                    <p className="text-text-secondary">Manage project schedules, phases, and dependencies.</p>
                </div>
                {selectedProjectId && (
                    <div className="flex gap-2">
                        <button
                            onClick={handleAddTask}
                            className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-lg text-text-primary hover:bg-subtle-background"
                        >
                            <PlusIcon className="w-4 h-4" /> Add Phase
                        </button>
                        <button
                            onClick={handleSaveGantt}
                            disabled={!isEditing}
                            className={`px-4 py-2 rounded-lg text-white transition-colors ${isEditing ? 'bg-primary hover:bg-primary/90' : 'bg-text-tertiary cursor-not-allowed'}`}
                        >
                            Save Changes
                        </button>
                        {(currentUser?.role === UserRole.PROJECT_HEAD || currentUser?.role === UserRole.EXECUTION_TEAM) && (
                            <button
                                onClick={handleApprovalRequest}
                                className="flex items-center gap-2 px-4 py-2 bg-warning-subtle text-warning-dark rounded-lg hover:bg-warning/20 border border-warning/30"
                            >
                                <CheckCircleIcon className="w-4 h-4" /> Request Approval
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Project Selector */}
            <div className="bg-surface p-4 rounded-xl border border-border flex items-center gap-4">
                <label className="text-sm font-medium text-text-secondary">Select Project:</label>
                <select
                    className="flex-1 max-w-md p-2 border border-border rounded-lg bg-surface text-text-primary focus:ring-2 focus:ring-primary focus:outline-none"
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    value={selectedProjectId || ''}
                >
                    <option value="">-- Select a Project --</option>
                    {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.projectName} ({p.status})</option>
                    ))}
                </select>
                {selectedProject && (
                    <div className="text-sm text-text-secondary">
                        <span className="font-semibold">Context:</span> Timeline for {selectedProject.clientName}
                    </div>
                )}
            </div>

            {selectedProjectId ? (
                <div className="space-y-6">
                    {/* Gantt / Task List View */}
                    <div className="bg-surface rounded-xl border border-border overflow-hidden">
                        <div className="p-4 border-b border-border bg-subtle-background/50 flex justify-between items-center">
                            <h3 className="font-bold text-text-primary">Timeline Phases & Tasks</h3>
                            <div className="text-xs text-text-secondary flex gap-4">
                                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-subtle-background border border-text-tertiary"></div> Pending</span>
                                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-primary"></div> In Progress</span>
                                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-success"></div> Completed</span>
                            </div>
                        </div>

                        {tasks.length === 0 ? (
                            <div className="p-12 text-center text-text-secondary">
                                <CalendarIcon className="w-12 h-12 mx-auto text-text-tertiary mb-3" />
                                <p>No timeline defined yet.</p>
                                <button onClick={handleAddTask} className="text-primary hover:underline mt-2 text-sm">Start by adding a phase</button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-sm">
                                    <thead>
                                        <tr className="bg-subtle-background border-b border-border text-xs uppercase text-text-secondary font-semibold">
                                            <th className="p-4 w-1/3">Task / Phase Name</th>
                                            <th className="p-4">Start Date</th>
                                            <th className="p-4">End Date</th>
                                            <th className="p-4">Duration</th>
                                            <th className="p-4">Progress</th>
                                            <th className="p-4">Predecessors</th>
                                            <th className="p-4 w-20">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {tasks.map((task, index) => (
                                            <tr key={task.id} className="hover:bg-subtle-background/30 group">
                                                <td className="p-4">
                                                    <input
                                                        type="text"
                                                        value={task.name}
                                                        onChange={(e) => {
                                                            const newTasks = [...tasks];
                                                            newTasks[index].name = e.target.value;
                                                            setTasks(newTasks);
                                                            setIsEditing(true);
                                                        }}
                                                        className="w-full bg-transparent border-none focus:ring-0 p-0 font-medium text-text-primary"
                                                        placeholder="Enter phase name..."
                                                    />
                                                </td>
                                                <td className="p-4">
                                                    <input
                                                        type="date"
                                                        value={task.start ? format(new Date(task.start), 'yyyy-MM-dd') : ''}
                                                        onChange={(e) => {
                                                            const newTasks = [...tasks];
                                                            newTasks[index].start = new Date(e.target.value);
                                                            setTasks(newTasks);
                                                            setIsEditing(true);
                                                        }}
                                                        className="bg-transparent border border-transparent hover:border-border rounded px-2 py-1 focus:border-primary focus:ring-1 focus:ring-primary w-32"
                                                    />
                                                </td>
                                                <td className="p-4">
                                                    <input
                                                        type="date"
                                                        value={task.end ? format(new Date(task.end), 'yyyy-MM-dd') : ''}
                                                        onChange={(e) => {
                                                            const newTasks = [...tasks];
                                                            newTasks[index].end = new Date(e.target.value);
                                                            setTasks(newTasks);
                                                            setIsEditing(true);
                                                        }}
                                                        className="bg-transparent border border-transparent hover:border-border rounded px-2 py-1 focus:border-primary focus:ring-1 focus:ring-primary w-32"
                                                    />
                                                </td>
                                                <td className="p-4 text-text-secondary">
                                                    {Math.ceil((new Date(task.end).getTime() - new Date(task.start).getTime()) / (1000 * 60 * 60 * 24))} days
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex-1 h-2 bg-subtle-background rounded-full overflow-hidden w-24">
                                                            <div className="h-full bg-primary" style={{ width: `${task.progress}%` }} />
                                                        </div>
                                                        <span className="text-xs">{task.progress}%</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-text-secondary">
                                                    {task.dependencies?.length ? task.dependencies.length : '-'}
                                                </td>
                                                <td className="p-4 text-right">
                                                    <button
                                                        onClick={() => {
                                                            const newTasks = tasks.filter((_, i) => i !== index);
                                                            setTasks(newTasks);
                                                            setIsEditing(true);
                                                        }}
                                                        className="text-error hover:text-error-dark opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        Remove
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Visual Gantt Bar Chart */}
                        {tasks.length > 0 && (
                            <div className="p-6 border-t border-border bg-subtle-background/20">
                                <h4 className="font-semibold text-sm text-text-secondary mb-4 uppercase tracking-wider">Visual Timeline</h4>
                                <div className="space-y-2">
                                    {tasks.map(task => {
                                        const projectStart = new Date(Math.min(...tasks.map(t => new Date(t.start).getTime())));
                                        const projectEnd = new Date(Math.max(...tasks.map(t => new Date(t.end).getTime())));
                                        const totalDuration = projectEnd.getTime() - projectStart.getTime();

                                        const left = ((new Date(task.start).getTime() - projectStart.getTime()) / totalDuration) * 100;
                                        const width = ((new Date(task.end).getTime() - new Date(task.start).getTime()) / totalDuration) * 100;

                                        return (
                                            <div key={task.id} className="relative h-8 flex items-center group">
                                                <div className="w-32 text-xs truncate pr-2 text-right">{task.name}</div>
                                                <div className="flex-1 relative h-6 bg-surface rounded-full">
                                                    <div
                                                        className={`absolute h-4 top-1 rounded-full ${task.progress === 100 ? 'bg-success' : 'bg-primary'} opacity-80 group-hover:opacity-100 transition-opacity`}
                                                        style={{
                                                            left: `${left}%`,
                                                            width: `${width}%`,
                                                            minWidth: '10px'
                                                        }}
                                                        title={`${task.name}: ${format(new Date(task.start), 'MMM d')} - ${format(new Date(task.end), 'MMM d')}`}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            ) : (
                <div className="bg-surface p-12 rounded-xl border border-border text-center">
                    <div className="w-16 h-16 bg-primary-subtle rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                        <ClockIcon className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-text-primary">No Project Selected</h3>
                    <p className="text-text-secondary mt-2 max-w-md mx-auto">
                        Please select a project from the dropdown above to view and manage its Gantt chart, timeline phases, and dependencies.
                    </p>
                </div>
            )}
        </div>
    );
};

export default ExecutionGanttPage;
