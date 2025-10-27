
import React from 'react';
import Card from '../../shared/Card';
import { PROJECTS, USERS } from '../../../constants';
import { Project, ProjectStatus } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { FireIcon, ClockIcon, ChartBarSquareIcon, PaintBrushIcon } from '../../icons/IconComponents';

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
    if (!currentUser) return null;

    const myProjects = PROJECTS.filter(p => p.assignedTeam.drawing === currentUser.id);
    
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
        ProjectStatus.AWAITING_DESIGN, 
        ProjectStatus.DESIGN_IN_PROGRESS, 
        ProjectStatus.PENDING_REVIEW, 
        ProjectStatus.REVISIONS_REQUESTED
    ].includes(p.status)).sort((a,b) => (a.priority === 'High' ? -1 : 1) - (b.priority === 'High' ? -1 : 1));

    const priorityTasks = myProjects.filter(p => p.priority === 'High' || p.status === ProjectStatus.REVISIONS_REQUESTED).slice(0,3);

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-text-primary">Design Dashboard</h2>

            {/* KPIs */}
            <div className="flex flex-col md:flex-row gap-4">
                <KpiCard title="Projects This Month" value={projectsThisMonth} icon={<PaintBrushIcon />} />
                <KpiCard title="On-Time Delivery" value={onTimeDelivery} icon={<ClockIcon className="w-6 h-6"/>} />
                <KpiCard title="Avg. Design Time" value={avgDesignTimeString} icon={<ChartBarSquareIcon />} />
                <KpiCard title="Due This Week" value={dueThisWeek} icon={<FireIcon className="w-6 h-6"/>} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Design Queue */}
                <div className="lg:col-span-2">
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
                                                        {project.priority === 'High' && <FireIcon className="w-5 h-5 text-error mr-2 flex-shrink-0" title="High Priority"/>}
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