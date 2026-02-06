import React, { useMemo } from 'react';
import Card from '../../shared/Card';
import { useAuth } from '../../../context/AuthContext';
import { SiteVisit, SiteVisitStatus, ExpenseClaim } from '../../../types';
import { ArrowLeftIcon, TrophyIcon, SparklesIcon } from '../../icons/IconComponents';
import PerformanceCard from '../../shared/PerformanceCard';
import { EXPENSE_CLAIMS, PROJECTS } from '../../../constants';

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


interface SiteEngineerKPIPageProps {
    visits: SiteVisit[];
    setCurrentPage: (page: string) => void;
}

const SiteEngineerKPIPage: React.FC<SiteEngineerKPIPageProps> = ({ visits, setCurrentPage }) => {
    const { currentUser } = useAuth();
    if (!currentUser) return null;

    const myClaims = useMemo(() => EXPENSE_CLAIMS.filter(e => e.engineerId === currentUser.id), [currentUser.id]);

    const metrics = useMemo(() => {
        const reportQuality = 1; // 1 for good
        const measurementAccuracy = 1; // % error
        const teamFeedback = 1; // 1 for positive

        const completedVisits = visits.filter(v => v.completionTime).length;
        const onTimeCompletion = visits.length > 0 ? (completedVisits / visits.length) * 100 : 0;
        
        // Mock expense calculation
        const totalBudget = 50000;
        const totalExpenses = myClaims.reduce((sum, c) => sum + c.totalAmount, 0);
        const expenseManagement = totalBudget > 0 ? ((totalBudget - totalExpenses) / totalBudget) * 100 : 0;
        
        return {
            reportQuality: { value: reportQuality, status: getStatus(reportQuality, 1, 0) },
            onTimeCompletion: { value: onTimeCompletion, status: getStatus(onTimeCompletion, 95, 85) },
            measurementAccuracy: { value: measurementAccuracy, status: getStatusInverted(measurementAccuracy, 0, 2) },
            expenseManagement: { value: expenseManagement, status: getStatus(expenseManagement, 10, 0) },
            teamFeedback: { value: teamFeedback, status: getStatus(teamFeedback, 1, 0) },
        };
    }, [visits, myClaims]);
    
    const overallScore =
        (metrics.reportQuality.status === 'green' ? 100 : metrics.reportQuality.status === 'yellow' ? 60 : 20) * 0.30 +
        (metrics.onTimeCompletion.status === 'green' ? 100 : metrics.onTimeCompletion.status === 'yellow' ? 60 : 20) * 0.25 +
        (metrics.measurementAccuracy.status === 'green' ? 100 : metrics.measurementAccuracy.status === 'yellow' ? 60 : 20) * 0.20 +
        (metrics.expenseManagement.status === 'green' ? 100 : metrics.expenseManagement.status === 'yellow' ? 60 : 20) * 0.15 +
        (metrics.teamFeedback.status === 'green' ? 100 : metrics.teamFeedback.status === 'yellow' ? 60 : 20) * 0.10;
        
    const overallStatus = getStatus(overallScore, 80, 50);
    const overallLabel = overallStatus === 'green' ? 'High Performer' : overallStatus === 'yellow' ? 'Solid Performer' : 'Needs Improvement';
    const overallColor = overallStatus === 'green' ? 'text-secondary' : overallStatus === 'yellow' ? 'text-accent' : 'text-error';

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            <h2 className="text-2xl font-bold text-text-primary">My Performance Scorecard</h2>
            
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
                <PerformanceCard metricName="Report Quality" metricValue="Good" weightage={30} status={metrics.reportQuality.status} description="Comprehensive with photos" />
                <PerformanceCard metricName="On-Time Completion" metricValue={`${metrics.onTimeCompletion.value.toFixed(0)}%`} weightage={25} status={metrics.onTimeCompletion.status} description="Visits completed as scheduled" />
                <PerformanceCard metricName="Measurement Accuracy" metricValue={`${metrics.measurementAccuracy.value}%`} weightage={20} status={metrics.measurementAccuracy.status} description="Error rate reported" />
                <PerformanceCard metricName="Expense Management" metricValue={`${metrics.expenseManagement.value.toFixed(0)}%`} weightage={15} status={metrics.expenseManagement.status} description="Below budget" />
                <PerformanceCard metricName="Team Feedback" metricValue="Positive" weightage={10} status={metrics.teamFeedback.status} description="Feedback from other teams" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <Card>
                    <h3 className="text-lg font-bold flex items-center"><TrophyIcon className="w-5 h-5 mr-2 text-accent"/> Achievements</h3>
                    <ul className="mt-4 list-disc pl-5 space-y-1 text-sm text-text-secondary">
                        <li>'Detail Dynamo' for consistently submitting high-quality reports.</li>
                        <li>'Budget Saver' for keeping expenses 5% under budget this quarter.</li>
                    </ul>
                </Card>
                 <Card>
                    <h3 className="text-lg font-bold flex items-center"><SparklesIcon className="w-5 h-5 mr-2 text-primary"/> Improvement Suggestions</h3>
                    <ul className="mt-4 list-disc pl-5 space-y-1 text-sm text-text-secondary">
                        <li>Aim to improve on-time completion from 92% to over 95%.</li>
                    </ul>
                </Card>
            </div>
        </div>
    );
};

export default SiteEngineerKPIPage;