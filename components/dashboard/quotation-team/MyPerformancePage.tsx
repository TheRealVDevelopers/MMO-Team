
import React from 'react';
import Card from '../../shared/Card';
import { PROJECTS } from '../../../constants';
import { ProjectStatus } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { CheckCircleIcon, ClockIcon, XCircleIcon, ChartBarIcon, ArrowLeftIcon } from '../../icons/IconComponents';

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

const MyPerformancePage: React.FC<{ setCurrentPage: (page: string) => void }> = ({ setCurrentPage }) => {
    const { currentUser } = useAuth();
    if (!currentUser) return null;

    const myProjects = PROJECTS.filter(p => p.assignedTeam.quotation === currentUser.id);
    const quotesSent = myProjects.filter(p => p.status !== ProjectStatus.AWAITING_QUOTATION).length;
    const dealsWon = myProjects.filter(p => p.status === ProjectStatus.APPROVED).length;
    const dealsLost = myProjects.filter(p => p.status === ProjectStatus.REJECTED).length;
    const conversionRate = quotesSent > 0 ? ((dealsWon / quotesSent) * 100).toFixed(1) : '0';
    
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => setCurrentPage('overview')}
                    className="flex items-center space-x-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
                >
                    <ArrowLeftIcon className="w-5 h-5" />
                    <span>Back</span>
                </button>
                <h2 className="text-2xl font-bold text-text-primary">My Performance</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard title="Quotes Sent" value={quotesSent.toString()} icon={<ChartBarIcon />} />
                <KpiCard title="Deals Won" value={dealsWon.toString()} icon={<CheckCircleIcon className="text-secondary" />} />
                <KpiCard title="Deals Lost" value={dealsLost.toString()} icon={<XCircleIcon className="text-error"/>} />
                <KpiCard title="Conversion Rate" value={`${conversionRate}%`} icon={<ChartBarIcon />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <h3 className="text-lg font-bold">Win/Loss Ratio</h3>
                    <div className="mt-4 h-72 bg-subtle-background rounded-md flex items-center justify-center">
                        <p className="text-text-secondary">Pie Chart Placeholder</p>
                    </div>
                </Card>
                 <Card>
                    <h3 className="text-lg font-bold">Negotiation Cycle Time</h3>
                    <div className="mt-4 h-72 bg-subtle-background rounded-md flex items-center justify-center">
                        <p className="text-text-secondary">Bar Chart Placeholder</p>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default MyPerformancePage;