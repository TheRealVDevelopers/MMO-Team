import React, { useMemo } from 'react';
import Card from '../../shared/Card';
import { LEADS } from '../../../constants';
import { LeadPipelineStatus } from '../../../types';
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

    const myLeads = useMemo(() => LEADS.filter(l => l.assignedTo === currentUser.id), [currentUser.id]);

    const metrics = useMemo(() => {
        // MOCK data where not available
        const responseTime = 1.5; // hours
        const clientSatisfaction = 4.7; // out of 5
        const taskCompletion = 85; // percentage

        // CALCULATED data
        const totalLeads = myLeads.length;
        const siteVisitLeads = myLeads.filter(l => l.history.some(h => h.action.includes('Site Visit'))).length;
        const conversionRate = totalLeads > 0 ? (siteVisitLeads / totalLeads) * 100 : 0;
        const revenueGenerated = myLeads.filter(l => l.status === LeadPipelineStatus.WON).reduce((sum, l) => sum + l.value, 0);
        
        // Target is mocked for this example
        const revenueTarget = 5000000;
        const revenuePercentage = revenueTarget > 0 ? (revenueGenerated / revenueTarget) * 100 : 0;

        return {
            responseTime: { value: responseTime, status: getStatusInverted(responseTime, 2, 6) },
            conversionRate: { value: conversionRate, status: getStatus(conversionRate, 25, 15) },
            clientSatisfaction: { value: clientSatisfaction, status: getStatus(clientSatisfaction, 4.5, 3.5) },
            taskCompletion: { value: taskCompletion, status: getStatus(taskCompletion, 90, 75) },
            revenueGenerated: { value: revenuePercentage, status: getStatus(revenuePercentage, 120, 80) },
        };
    }, [myLeads]);

    const overallScore =
        (metrics.responseTime.status === 'green' ? 100 : metrics.responseTime.status === 'yellow' ? 60 : 20) * 0.25 +
        (metrics.conversionRate.status === 'green' ? 100 : metrics.conversionRate.status === 'yellow' ? 60 : 20) * 0.30 +
        (metrics.clientSatisfaction.status === 'green' ? 100 : metrics.clientSatisfaction.status === 'yellow' ? 60 : 20) * 0.20 +
        (metrics.taskCompletion.status === 'green' ? 100 : metrics.taskCompletion.status === 'yellow' ? 60 : 20) * 0.15 +
        (metrics.revenueGenerated.status === 'green' ? 100 : metrics.revenueGenerated.status === 'yellow' ? 60 : 20) * 0.10;
        
    const overallStatus = getStatus(overallScore, 80, 50);
    const overallLabel = overallStatus === 'green' ? 'High Performer' : overallStatus === 'yellow' ? 'Solid Performer' : 'Needs Improvement';
    const overallColor = overallStatus === 'green' ? 'text-secondary' : overallStatus === 'yellow' ? 'text-accent' : 'text-error';

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            <div className="flex items-center gap-4">
                <button onClick={() => setCurrentPage('leads')} className="flex items-center space-x-2 text-sm font-medium text-text-secondary hover:text-text-primary">
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
                 <PerformanceCard 
                    metricName="Response Time"
                    metricValue={`${metrics.responseTime.value.toFixed(1)} hrs`}
                    weightage={25}
                    status={metrics.responseTime.status}
                    description={<>🟢 &lt; 2h, 🟡 2-6h, 🔴 &gt; 6h</>}
                 />
                 <PerformanceCard 
                    metricName="Lead Conversion"
                    metricValue={`${metrics.conversionRate.value.toFixed(1)}%`}
                    weightage={30}
                    status={metrics.conversionRate.status}
                    description={<>🟢 &gt; 25%, 🟡 15-25%, 🔴 &lt; 15%</>}
                 />
                 <PerformanceCard 
                    metricName="Client Satisfaction"
                    metricValue={`${metrics.clientSatisfaction.value.toFixed(1)}/5`}
                    weightage={20}
                    status={metrics.clientSatisfaction.status}
                    description={<>🟢 &gt; 4.5, 🟡 3.5-4.5, 🔴 &lt; 3.5</>}
                 />
                 <PerformanceCard 
                    metricName="Task Completion"
                    metricValue={`${metrics.taskCompletion.value}%`}
                    weightage={15}
                    status={metrics.taskCompletion.status}
                    description={<>🟢 &gt; 90%, 🟡 75-90%, 🔴 &lt; 75%</>}
                 />
                 <PerformanceCard 
                    metricName="Revenue Target"
                    metricValue={`${metrics.revenueGenerated.value.toFixed(0)}%`}
                    weightage={10}
                    status={metrics.revenueGenerated.status}
                    description={<>🟢 &gt; 120%, 🟡 80-120%, 🔴 &lt; 80%</>}
                 />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <Card>
                    <h3 className="text-lg font-bold flex items-center"><TrophyIcon className="w-5 h-5 mr-2 text-accent"/> Achievements</h3>
                    <ul className="mt-4 list-disc pl-5 space-y-1 text-sm text-text-secondary">
                        <li>'Rapid Responder' badge for consistent &lt; 2-hour response times.</li>
                        <li>'Top Converter' for Q2 with a 28% conversion rate.</li>
                    </ul>
                </Card>
                 <Card>
                    <h3 className="text-lg font-bold flex items-center"><SparklesIcon className="w-5 h-5 mr-2 text-primary"/> Improvement Suggestions</h3>
                    <ul className="mt-4 list-disc pl-5 space-y-1 text-sm text-text-secondary">
                        <li>Focus on completing tasks on time to move from Yellow to Green.</li>
                        <li>Explore upselling opportunities to exceed revenue targets.</li>
                    </ul>
                </Card>
            </div>

        </div>
    );
};

export default MyPerformancePage;
