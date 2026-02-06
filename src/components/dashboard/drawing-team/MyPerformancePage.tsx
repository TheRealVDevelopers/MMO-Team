import React, { useMemo } from 'react';
import Card from '../../shared/Card';
import { PROJECTS, formatCurrencyINR } from '../../../constants';
import { ProjectStatus } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { ArrowLeftIcon, TrophyIcon, SparklesIcon } from '../../icons/IconComponents';
import PerformanceCard from '../../shared/PerformanceCard';

const getStatus = (value: number, green: number, yellow: number): 'green' | 'yellow' | 'red' => {
  if (value >= green) return 'green';
  if (value >= yellow) return 'yellow';
  return 'red';
};

const getStatusInverted = (value: number, green: number, yellow: number): 'green' | 'yellow' | 'red' => {
  if (value <= green) return 'green';
  if (value <= yellow) return 'yellow';
  return 'red';
};


const MyPerformancePage: React.FC<{ setCurrentPage: (page: string) => void }> = ({ setCurrentPage }) => {
    const { currentUser } = useAuth();
    if (!currentUser) return null;

    const myProjects = useMemo(() => PROJECTS.filter(p => p.assignedTeam.drawing === currentUser.id), [currentUser.id]);

    const metrics = useMemo(() => {
        const designQuality = 1.2;
        const clientSatisfaction = 4.3;
        const innovation = 1; // 1 for true

        const onTimeProjects = myProjects.filter(p => new Date(p.endDate) >= new Date()).length;
        const onTimeDelivery = myProjects.length > 0 ? (onTimeProjects / myProjects.length) * 100 : 0;
        
        const totalBudget = myProjects.reduce((sum, p) => sum + p.budget, 0);
        const totalExpenses = myProjects.reduce((sum, p) => sum + (p.totalExpenses || 0), 0);
        const costEfficiency = totalBudget > 0 ? ((totalBudget - totalExpenses) / totalBudget) * 100 : 0;
        
        return {
            designQuality: { value: designQuality, status: getStatusInverted(designQuality, 1.5, 3) },
            onTimeDelivery: { value: onTimeDelivery, status: getStatus(onTimeDelivery, 95, 85) },
            clientSatisfaction: { value: clientSatisfaction, status: getStatus(clientSatisfaction, 4.5, 3.5) },
            costEfficiency: { value: costEfficiency, status: getStatus(costEfficiency, 10, 0) },
            innovation: { value: innovation, status: getStatus(innovation, 1, 0) },
        };
    }, [myProjects]);
    
    const overallScore =
        (metrics.designQuality.status === 'green' ? 100 : metrics.designQuality.status === 'yellow' ? 60 : 20) * 0.30 +
        (metrics.onTimeDelivery.status === 'green' ? 100 : metrics.onTimeDelivery.status === 'yellow' ? 60 : 20) * 0.25 +
        (metrics.clientSatisfaction.status === 'green' ? 100 : metrics.clientSatisfaction.status === 'yellow' ? 60 : 20) * 0.20 +
        (metrics.costEfficiency.status === 'green' ? 100 : metrics.costEfficiency.status === 'yellow' ? 60 : 20) * 0.15 +
        (metrics.innovation.status === 'green' ? 100 : metrics.innovation.status === 'yellow' ? 60 : 20) * 0.10;
        
    const overallStatus = getStatus(overallScore, 80, 50);
    const overallLabel = overallStatus === 'green' ? 'High Performer' : overallStatus === 'yellow' ? 'Solid Performer' : 'Needs Improvement';
    const overallColor = overallStatus === 'green' ? 'text-secondary' : overallStatus === 'yellow' ? 'text-accent' : 'text-error';

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <button onClick={() => setCurrentPage('overview')} className="flex items-center space-x-2 text-sm font-medium text-text-secondary hover:text-text-primary">
                    <ArrowLeftIcon className="w-5 h-5" /><span>Back</span>
                </button>
                <h2 className="text-2xl font-bold text-text-primary">My Performance Scorecard</h2>
            </div>
            
            <Card className={`bg-gradient-to-br from-surface to-subtle-background`}>
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <img src={currentUser.avatar} alt={currentUser.name} className="w-16 h-16 rounded-full ring-4 ring-primary/20"/>
                        <div>
                            <h3 className="text-xl font-bold">{currentUser.name}</h3>
                            <p className="text-sm text-text-secondary">{currentUser.role}</p>
                        </div>
                    </div>
                     <div className={`text-center p-4 rounded-lg ${overallStatus === 'green' ? 'bg-secondary/10' : overallStatus === 'yellow' ? 'bg-accent/10' : 'bg-error/10'}`}>
                        <p className={`text-sm font-bold ${overallColor}`}>OVERALL RATING</p>
                        <p className={`text-3xl font-bold ${overallColor}`}>{overallLabel}</p>
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <PerformanceCard metricName="Design Quality" metricValue={`${metrics.designQuality.value} revs`} weightage={30} status={metrics.designQuality.status} description="Avg. revisions per project" />
                <PerformanceCard metricName="On-Time Delivery" metricValue={`${metrics.onTimeDelivery.value.toFixed(0)}%`} weightage={25} status={metrics.onTimeDelivery.status} description="Designs delivered before deadline" />
                <PerformanceCard metricName="Client Satisfaction" metricValue={`${metrics.clientSatisfaction.value}/5`} weightage={20} status={metrics.clientSatisfaction.status} description="Avg. design approval rating" />
                <PerformanceCard metricName="Cost Efficiency" metricValue={`${metrics.costEfficiency.value.toFixed(0)}%`} weightage={15} status={metrics.costEfficiency.status} description="Designs under budget estimate" />
                <PerformanceCard metricName="Innovation" metricValue={metrics.innovation.value > 0 ? 'Yes' : 'No'} weightage={10} status={metrics.innovation.status} description="Suggests improvements" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <Card>
                    <h3 className="text-lg font-bold flex items-center"><TrophyIcon className="w-5 h-5 mr-2 text-accent"/> Achievements</h3>
                    <ul className="mt-4 list-disc pl-5 space-y-1 text-sm text-text-secondary">
                        <li>'Budget Master' badge for consistently designing under budget.</li>
                        <li>'Innovator Award' for suggesting new material usage.</li>
                    </ul>
                </Card>
                 <Card>
                    <h3 className="text-lg font-bold flex items-center"><SparklesIcon className="w-5 h-5 mr-2 text-primary"/> Improvement Suggestions</h3>
                    <ul className="mt-4 list-disc pl-5 space-y-1 text-sm text-text-secondary">
                        <li>Focus on improving on-time delivery from 88% to over 95%.</li>
                        <li>Aim to increase average client satisfaction rating above 4.5.</li>
                    </ul>
                </Card>
            </div>
        </div>
    );
};

export default MyPerformancePage;
