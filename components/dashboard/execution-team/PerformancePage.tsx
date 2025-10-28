import React, { useMemo } from 'react';
import Card from '../../shared/Card';
import { PROJECTS, ISSUES, EXPENSES } from '../../../constants';
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

const PerformancePage: React.FC<{ setCurrentPage: (page: string) => void }> = ({ setCurrentPage }) => {
    const { currentUser } = useAuth();
    if (!currentUser) return null;

    const myProjects = useMemo(() => PROJECTS.filter(p => p.assignedTeam.execution?.includes(currentUser.id)), [currentUser.id]);

    const metrics = useMemo(() => {
        const safety = 0;
        const clientSatisfaction = 1;

        const onTimeProjects = myProjects.filter(p => new Date(p.endDate) >= new Date()).length;
        const projectTimeline = myProjects.length > 0 ? (onTimeProjects / myProjects.length) * 100 : 0;
        
        const myIssues = myProjects.flatMap(p => p.issues || []).length;
        
        const totalBudget = myProjects.reduce((sum, p) => sum + p.budget, 0);
        const totalExpenses = myProjects.reduce((sum, p) => sum + (p.totalExpenses || 0), 0);
        const budgetAdherence = totalBudget > 0 ? ((totalBudget - totalExpenses) / totalBudget) * 100 : 0;
        
        return {
            projectTimeline: { value: projectTimeline, status: getStatus(projectTimeline, 90, 80) },
            qualityStandards: { value: myIssues, status: getStatusInverted(myIssues, 0, 2) },
            budgetAdherence: { value: budgetAdherence, status: getStatus(budgetAdherence, 0, -10) },
            safetyCompliance: { value: safety, status: getStatusInverted(safety, 0, 1) },
            clientSatisfaction: { value: clientSatisfaction, status: getStatus(clientSatisfaction, 1, 0) },
        };
    }, [myProjects]);
    
    const overallScore =
        (metrics.projectTimeline.status === 'green' ? 100 : metrics.projectTimeline.status === 'yellow' ? 60 : 20) * 0.30 +
        (metrics.qualityStandards.status === 'green' ? 100 : metrics.qualityStandards.status === 'yellow' ? 60 : 20) * 0.25 +
        (metrics.budgetAdherence.status === 'green' ? 100 : metrics.budgetAdherence.status === 'yellow' ? 60 : 20) * 0.20 +
        (metrics.safetyCompliance.status === 'green' ? 100 : metrics.safetyCompliance.status === 'yellow' ? 60 : 20) * 0.15 +
        (metrics.clientSatisfaction.status === 'green' ? 100 : metrics.clientSatisfaction.status === 'yellow' ? 60 : 20) * 0.10;
        
    const overallStatus = getStatus(overallScore, 80, 50);
    const overallLabel = overallStatus === 'green' ? 'High Performer' : overallStatus === 'yellow' ? 'Solid Performer' : 'Needs Improvement';
    const overallColor = overallStatus === 'green' ? 'text-secondary' : overallStatus === 'yellow' ? 'text-accent' : 'text-error';

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            <div className="flex items-center gap-4">
                <button onClick={() => setCurrentPage('board')} className="flex items-center space-x-2 text-sm font-medium text-text-secondary hover:text-text-primary">
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
                <PerformanceCard metricName="Project Timeline" metricValue={`${metrics.projectTimeline.value.toFixed(0)}%`} weightage={30} status={metrics.projectTimeline.status} description="Projects completed on schedule" />
                <PerformanceCard metricName="Quality Standards" metricValue={`${metrics.qualityStandards.value} issues`} weightage={25} status={metrics.qualityStandards.status} description="Total quality issues reported" />
                <PerformanceCard metricName="Budget Adherence" metricValue={`${metrics.budgetAdherence.value.toFixed(0)}%`} weightage={20} status={metrics.budgetAdherence.status} description="Projects completed within budget" />
                <PerformanceCard metricName="Safety Compliance" metricValue={`${metrics.safetyCompliance.value} incidents`} weightage={15} status={metrics.safetyCompliance.status} description="Zero is the goal" />
                <PerformanceCard metricName="Client Satisfaction" metricValue="High" weightage={10} status={metrics.clientSatisfaction.status} description="Feedback on workmanship" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <Card>
                    <h3 className="text-lg font-bold flex items-center"><TrophyIcon className="w-5 h-5 mr-2 text-accent"/> Achievements</h3>
                    <ul className="mt-4 list-disc pl-5 space-y-1 text-sm text-text-secondary">
                        <li>'Zero Defect' badge for no quality issues this quarter.</li>
                        <li>'Safety First' award for maintaining a perfect safety record.</li>
                    </ul>
                </Card>
                 <Card>
                    <h3 className="text-lg font-bold flex items-center"><SparklesIcon className="w-5 h-5 mr-2 text-primary"/> Improvement Suggestions</h3>
                    <ul className="mt-4 list-disc pl-5 space-y-1 text-sm text-text-secondary">
                        <li>Focus on completing projects ahead of schedule to move from Yellow to Green on timeline metric.</li>
                    </ul>
                </Card>
            </div>
        </div>
    );
};

export default PerformancePage;
