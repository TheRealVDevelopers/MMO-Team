import React from 'react';
import Card from '../../shared/Card';
import { PROJECTS, USERS } from '../../../constants';
import { Project, ProjectStatus } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { useTeamTasks } from '../../../hooks/useTeamTasks'; // Or useMyDayTasks, but assuming we want to see what is assigned
import {
    FireIcon, ClockIcon, ChartBarSquareIcon, PaintBrushIcon,
    ClipboardDocumentCheckIcon, ArrowUpRightIcon
} from '../../icons/IconComponents';

const KpiCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <Card className="flex-1">
        <div className="flex items-center">
            <div className="p-3 rounded-lg bg-primary-subtle-background text-primary">{icon}</div>
            <div className="ml-4">
                <p className="text-sm font-medium text-text-secondary">{title}</p>
                <p className="text-2xl font-bold text-text-primary">{value}</p>
            </div>
        </div>
    </Card>
);

const DrawingOverviewPage: React.FC<{ onProjectSelect: (project: Project) => void }> = ({ onProjectSelect }) => {
    const { currentUser } = useAuth();
    // In a real app, useMyDayTasks would be better, but useTeamTasks allows filtering if needed. 
    // Assuming useTeamTasks returns all tasks, we filter by assignee.
    const { tasks: allTasks } = useTeamTasks();

    if (!currentUser) return null;

    const myProjects = PROJECTS.filter(p => p.assignedTeam.drawing === currentUser.id);

    // Filter tasks assigned to me (Direct Assignments)
    const myTasks = allTasks.filter(t => t.userId === currentUser.id && t.status !== 'Completed');

    // KPIs
    const projectsThisMonth = myProjects.filter(p => new Date(p.startDate).getMonth() === new Date().getMonth()).length;
    const onTimeDelivery = "92%"; // Mock data
    const avgDesignTimeString = "3.5 Days"; // Mock data
    const dueThisWeek = myProjects.filter(p => {
        const due = new Date(p.endDate);
        const now = new Date();
        const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        return due > now && due < oneWeekFromNow;
    }).length;

    const designQueue = myProjects.filter(p => [
        ProjectStatus.SITE_VISIT_PENDING, // New
        ProjectStatus.DRAWING_PENDING,    // New
        ProjectStatus.BOQ_PENDING,        // New
        ProjectStatus.AWAITING_DESIGN,
        ProjectStatus.DESIGN_IN_PROGRESS,
        ProjectStatus.PENDING_REVIEW,
        ProjectStatus.REVISIONS_REQUESTED
    ].includes(p.status)).sort((a, b) => (a.priority === 'High' ? -1 : 1) - (b.priority === 'High' ? -1 : 1));

    const priorityTasks = myProjects.filter(p => p.priority === 'High' || p.status === ProjectStatus.REVISIONS_REQUESTED).slice(0, 3);

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-text-primary">Design Dashboard</h2>

            {/* KPIs */}
            <div className="flex flex-col md:flex-row gap-4">
                <KpiCard title="Projects This Month" value={projectsThisMonth} icon={<PaintBrushIcon />} />
                <KpiCard title="On-Time Delivery" value={onTimeDelivery} icon={<ClockIcon className="w-6 h-6" />} />
                <KpiCard title="Avg. Design Time" value={avgDesignTimeString} icon={<ChartBarSquareIcon />} />
                <KpiCard title="Due This Week" value={dueThisWeek} icon={<FireIcon className="w-6 h-6" />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Design Queue & Tasks */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Direct Assignments (New Task Section) */}
                    <Card>
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <ClipboardDocumentCheckIcon className="w-5 h-5 text-primary" />
                            Assigned Missions
                        </h3>
                        {myTasks.length > 0 ? (
                            <div className="mt-4 grid gap-4">
                                {myTasks.map(task => (
                                    <div key={task.id} className="flex items-center justify-between p-4 bg-subtle-background rounded-xl border border-border/50 hover:border-primary/30 transition-all">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-white rounded-lg shadow-sm">
                                                <FireIcon className={`w-5 h-5 ${task.priority === 'High' ? 'text-error' : 'text-primary'}`} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-text-primary text-sm">{task.title}</h4>
                                                <p className="text-xs text-text-secondary mt-0.5 line-clamp-1">{task.description}</p>
                                                <div className="flex gap-2 mt-2">
                                                    <span className="text-[10px] bg-white px-2 py-0.5 rounded border border-border text-text-secondary">
                                                        Due: {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'N/A'}
                                                    </span>
                                                    {task.priority === 'High' && (
                                                        <span className="text-[10px] bg-error/10 text-error px-2 py-0.5 rounded font-bold uppercase">
                                                            High Priority
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <button className="p-2 hover:bg-white rounded-full transition-colors">
                                            <ArrowUpRightIcon className="w-4 h-4 text-text-secondary" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-8 text-center text-text-tertiary text-sm italic">
                                No direct missions assigned. Standby for directives.
                            </div>
                        )}
                    </Card>

                    <Card className="h-full">
                        <h3 className="text-lg font-bold">My Design Queue</h3>
                        <div className="mt-4 -mx-6 -mb-6 overflow-x-auto">
                            <table className="min-w-full">
                                <thead className="bg-subtle-background">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Project</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Deadline</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Sales Contact</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-surface divide-y divide-border">
                                    {designQueue.map(project => {
                                        const salesperson = USERS.find(u => u.id === project.salespersonId);
                                        return (
                                            <tr key={project.id} onClick={() => onProjectSelect(project)} className="cursor-pointer hover:bg-subtle-background">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        {project.priority === 'High' && <FireIcon className="w-5 h-5 text-error mr-2 flex-shrink-0" />}
                                                        <div>
                                                            <div className="text-sm font-medium text-text-primary">{project.projectName}</div>
                                                            <div className="text-xs text-text-secondary">{project.clientName}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{project.status}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{project.deadline}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{salesperson?.name || 'N/A'}</td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>

                {/* Priority Tasks & Resources */}
                <div className="space-y-6">
                    <Card>
                        <h3 className="text-lg font-bold">Today's Priority Tasks</h3>
                        {priorityTasks.length > 0 ? (
                            <ul className="mt-4 space-y-3">
                                {priorityTasks.map(task => (
                                    <li key={task.id} onClick={() => onProjectSelect(task)} className="p-2 bg-subtle-background rounded-md cursor-pointer hover:bg-border">
                                        <p className="text-sm font-bold">{task.projectName}</p>
                                        <p className="text-xs text-secondary">{task.status === ProjectStatus.REVISIONS_REQUESTED ? 'Revisions Required' : 'High Priority Design'}</p>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-text-secondary mt-4 text-center">No high-priority tasks today.</p>
                        )}
                    </Card>
                    <Card>
                        <h3 className="text-lg font-bold">Resource Library</h3>
                        <ul className="mt-4 space-y-2 text-sm">
                            <li><a href="#" className="text-primary hover:underline">Template Library</a></li>
                            <li><a href="#" className="text-primary hover:underline">Material Catalog</a></li>
                            <li><a href="#" className="text-primary hover:underline">Standard Component Library</a></li>
                            <li><a href="#" className="text-primary hover:underline">Previous Project Archive</a></li>
                        </ul>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default DrawingOverviewPage;