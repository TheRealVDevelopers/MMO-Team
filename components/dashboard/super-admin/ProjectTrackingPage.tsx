import React, { useState } from 'react';
import Card from '../../shared/Card';
import { PROJECTS } from '../../../constants';
import { Project, ProjectStatus } from '../../../types';
import ProgressBar from '../../shared/ProgressBar';
import StatusPill from '../../shared/StatusPill';

const getStatusPillColor = (status: ProjectStatus): 'blue' | 'amber' | 'green' | 'red' | 'slate' | 'purple' => {
    switch (status) {
        case ProjectStatus.IN_EXECUTION: return 'amber';
        case ProjectStatus.COMPLETED: return 'green';
        case ProjectStatus.ON_HOLD: return 'slate';
        case ProjectStatus.PENDING_REVIEW: return 'purple';
        case ProjectStatus.REJECTED: return 'red';
        default: return 'blue';
    }
}

const ProjectTrackingPage: React.FC = () => {
    const [view, setView] = useState<'list' | 'gantt'>('list');

    return (
        <div className="space-y-6">
            <div className="sm:flex justify-between items-center">
                <h2 className="text-2xl font-bold text-text-primary">Project Tracking</h2>
                <div className="flex space-x-1 p-1 bg-subtle-background rounded-lg mt-2 sm:mt-0">
                    <button onClick={() => setView('list')} className={`px-3 py-1 text-sm font-medium rounded-md ${view === 'list' ? 'bg-surface shadow' : 'text-text-secondary'}`}>List View</button>
                    <button onClick={() => setView('gantt')} className={`px-3 py-1 text-sm font-medium rounded-md ${view === 'gantt' ? 'bg-surface shadow' : 'text-text-secondary'}`}>Gantt View</button>
                </div>
            </div>
            
            {view === 'list' && (
                <Card>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-border">
                            <thead className="bg-subtle-background">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Project Name</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Status</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Progress</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Timeline</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Budget</th>
                                </tr>
                            </thead>
                            <tbody className="bg-surface divide-y divide-border">
                                {PROJECTS.map((project) => (
                                    <tr key={project.id} className="hover:bg-subtle-background cursor-pointer">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-text-primary">{project.projectName}</div>
                                            <div className="text-xs text-text-secondary">{project.clientName}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <StatusPill color={getStatusPillColor(project.status)}>{project.status}</StatusPill>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="w-32">
                                                   <ProgressBar progress={project.progress} />
                                                </div>
                                                <span className="text-sm ml-2 text-text-secondary">{project.progress}%</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                                            {project.startDate.toLocaleDateString()} - {project.endDate.toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">
                                            ${project.budget.toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {view === 'gantt' && (
                <Card>
                    <h3 className="text-lg font-bold">Gantt Chart</h3>
                    <div className="mt-4 h-96 bg-subtle-background rounded-md flex items-center justify-center">
                         <p className="text-text-secondary">Gantt Chart Visualization Coming Soon</p>
                    </div>
                </Card>
            )}
        </div>
    );
};

export default ProjectTrackingPage;
