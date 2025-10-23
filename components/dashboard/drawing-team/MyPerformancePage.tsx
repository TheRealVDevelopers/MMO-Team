import React from 'react';
import Card from '../../shared/Card';
import { PROJECTS } from '../../../constants';
import { ProjectStatus } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { CheckCircleIcon, ClockIcon } from '../../icons/IconComponents';

const KpiCard: React.FC<{ title: string; value: string; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <Card>
        <div className="flex items-center">
            <div className="p-3 rounded-full bg-primary-subtle-background text-primary">
                {icon}
            </div>
            <div className="ml-4">
                <p className="text-sm font-medium text-text-secondary">{title}</p>
                <p className="text-2xl font-bold text-text-primary">{value}</p>
            </div>
        </div>
    </Card>
);

const MyPerformancePage: React.FC = () => {
    const { currentUser } = useAuth();
    if (!currentUser) return null;

    const myProjects = PROJECTS.filter(p => p.assignedTeam.drawing === currentUser.id);
    const completed = myProjects.filter(p => p.status === ProjectStatus.COMPLETED).length;
    const revisions = myProjects.filter(p => p.status === ProjectStatus.REVISIONS_REQUESTED).length;
    const revisionRate = myProjects.length > 0 ? ((revisions / myProjects.length) * 100).toFixed(1) : 0;
    
    // Mock data for other metrics
    const onTimeDelivery = '92%';
    const avgDesignTme = '3.5 Days';

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-text-primary">My Performance</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard title="Projects Completed" value={completed.toString()} icon={<CheckCircleIcon />} />
                <KpiCard title="On-Time Delivery" value={onTimeDelivery} icon={<ClockIcon />} />
                <KpiCard title="Revision Rate" value={`${revisionRate}%`} icon={<CheckCircleIcon />} />
                <KpiCard title="Avg. Design Time" value={avgDesignTme} icon={<ClockIcon />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <h3 className="text-lg font-bold">Monthly Completion Rate</h3>
                    <div className="mt-4 h-72 bg-subtle-background rounded-md flex items-center justify-center">
                        <p className="text-text-secondary">Chart Placeholder</p>
                    </div>
                </Card>
                 <Card>
                    <h3 className="text-lg font-bold">Project Status Breakdown</h3>
                    <div className="mt-4 h-72 bg-subtle-background rounded-md flex items-center justify-center">
                        <p className="text-text-secondary">Pie Chart Placeholder</p>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default MyPerformancePage;
