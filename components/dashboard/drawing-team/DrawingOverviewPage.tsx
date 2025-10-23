import React from 'react';
import Card from '../../shared/Card';
import { PROJECTS } from '../../../constants';
import { Project, ProjectStatus } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { FireIcon, ClockIcon, ArchiveBoxIcon, PaintBrushIcon } from '../../icons/IconComponents';
import StatusPill from '../../shared/StatusPill';

const PriorityIndicator: React.FC<{ priority: 'High' | 'Medium' | 'Low' }> = ({ priority }) => {
    if (priority === 'High') return <div className="flex items-center text-sm text-error"><FireIcon className="w-4 h-4 mr-1" /> High</div>;
    return null;
};

const KpiCard: React.FC<{ title: string; value: string }> = ({ title, value }) => (
    <Card>
      <p className="text-sm font-medium text-text-secondary">{title}</p>
      <p className="text-2xl font-bold text-text-primary tracking-tight">{value}</p>
    </Card>
);

const DrawingOverviewPage: React.FC<{ onProjectSelect: (project: Project) => void }> = ({ onProjectSelect }) => {
    const { currentUser } = useAuth();
    if (!currentUser) return null;

    const myProjects = PROJECTS.filter(p => p.assignedTeam.drawing === currentUser.id);
    const designQueue = myProjects.filter(p => [ProjectStatus.AWAITING_DESIGN, ProjectStatus.REVISIONS_REQUESTED].includes(p.status));
    const activeProjects = myProjects.filter(p => p.status === ProjectStatus.DESIGN_IN_PROGRESS).length;
    const completedThisMonth = myProjects.filter(p => p.status === ProjectStatus.COMPLETED && p.endDate > new Date(new Date().setDate(1))).length;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-text-primary">Welcome, {currentUser.name.split(' ')[0]}</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard title="Projects in Queue" value={designQueue.length.toString()} />
                <KpiCard title="Active Designs" value={activeProjects.toString()} />
                <KpiCard title="Completed (Month)" value={completedThisMonth.toString()} />
                <KpiCard title="Avg. Revision Rate" value="12%" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Card>
                        <h3 className="text-lg font-bold">My Design Queue</h3>
                        <p className="text-sm text-text-secondary mt-1">Projects awaiting your action.</p>
                        <div className="mt-4 overflow-x-auto">
                            <table className="min-w-full divide-y divide-border">
                                <thead className="bg-subtle-background">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Project</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Status</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Deadline</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Priority</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-surface divide-y divide-border">
                                    {designQueue.map(project => (
                                        <tr key={project.id} onClick={() => onProjectSelect(project)} className="cursor-pointer hover:bg-subtle-background">
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <p className="text-sm font-bold text-text-primary">{project.projectName}</p>
                                                <p className="text-xs text-text-secondary">{project.clientName}</p>
                                            </td>
                                            <td className="px-4 py-3"><StatusPill color={project.status === ProjectStatus.REVISIONS_REQUESTED ? 'amber' : 'blue'}>{project.status}</StatusPill></td>
                                            <td className="px-4 py-3 text-sm text-text-secondary flex items-center"><ClockIcon className="w-4 h-4 mr-1.5"/>{project.deadline}</td>
                                            <td className="px-4 py-3"><PriorityIndicator priority={project.priority} /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
                <div className="space-y-6">
                    <Card>
                        <h3 className="text-lg font-bold flex items-center"><PaintBrushIcon className="w-5 h-5 mr-2" /> Design Tools</h3>
                         <ul className="mt-4 space-y-2 text-sm">
                            <li><a href="#" className="text-primary hover:underline">Standard Template Library</a></li>
                            <li><a href="#" className="text-primary hover:underline">Material Catalog & Specs</a></li>
                            <li><a href="#" className="text-primary hover:underline">Company Design Guidelines</a></li>
                        </ul>
                    </Card>
                     <Card>
                        <h3 className="text-lg font-bold flex items-center"><ArchiveBoxIcon className="w-5 h-5 mr-2" /> Quick Access</h3>
                         <ul className="mt-4 space-y-2 text-sm">
                            <li><a href="#" className="text-primary hover:underline">Previous Project Archives</a></li>
                            <li><a href="#" className="text-primary hover:underline">Launch AutoCAD</a></li>
                            <li><a href="#" className="text-primary hover:underline">Launch SketchUp</a></li>
                        </ul>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default DrawingOverviewPage;
