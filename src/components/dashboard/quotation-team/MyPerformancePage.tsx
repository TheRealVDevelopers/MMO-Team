import React, { useMemo } from 'react';
import Card from '../../shared/Card';
import { PROJECTS } from '../../../constants';
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

    const myProjects = useMemo(() => PROJECTS.filter(p => p.assignedTeam.quotation === currentUser.id), [currentUser.id]);

    const metrics = useMemo(() => {
        const quoteAccuracy = 1.5; // % variation
        const responseTime = 20; // hours
        const profitMargin = 23; // %
        const negotiation = 1; // 1 for good

        const totalQuotes = myProjects.length;
        const wonQuotes = myProjects.filter(p => p.status === ProjectStatus.APPROVED).length;
        const conversionRate = totalQuotes > 0 ? (wonQuotes / totalQuotes) * 100 : 0;
        
        return {
            quoteAccuracy: { value: quoteAccuracy, status: getStatusInverted(quoteAccuracy, 2, 5) },
            conversionRate: { value: conversionRate, status: getStatus(conversionRate, 40, 25) },
            responseTime: { value: responseTime, status: getStatusInverted(responseTime, 24, 48) },
            profitMargin: { value: profitMargin, status: getStatus(profitMargin, 25, 20) },
            negotiation: { value: negotiation, status: getStatus(negotiation, 1, 0) },
        };
    }, [myProjects]);
    
    const overallScore =
        (metrics.quoteAccuracy.status === 'green' ? 100 : metrics.quoteAccuracy.status === 'yellow' ? 60 : 20) * 0.30 +
        (metrics.conversionRate.status === 'green' ? 100 : metrics.conversionRate.status === 'yellow' ? 60 : 20) * 0.25 +
        (metrics.responseTime.status === 'green' ? 100 : metrics.responseTime.status === 'yellow' ? 60 : 20) * 0.20 +
        (metrics.profitMargin.status === 'green' ? 100 : metrics.profitMargin.status === 'yellow' ? 60 : 20) * 0.15 +
        (metrics.negotiation.status === 'green' ? 100 : metrics.negotiation.status === 'yellow' ? 60 : 20) * 0.10;
        
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
                <PerformanceCard metricName="Quote Accuracy" metricValue={`${metrics.quoteAccuracy.value}%`} weightage={30} status={metrics.quoteAccuracy.status} description="Final project price variation" />
                <PerformanceCard metricName="Conversion Rate" metricValue={`${metrics.conversionRate.value.toFixed(0)}%`} weightage={25} status={metrics.conversionRate.status} description="Quotes converted to projects" />
                <PerformanceCard metricName="Response Time" metricValue={`${metrics.responseTime.value} hrs`} weightage={20} status={metrics.responseTime.status} description="Avg. time to deliver quote" />
                <PerformanceCard metricName="Profit Margin" metricValue={`${metrics.profitMargin.value}%`} weightage={15} status={metrics.profitMargin.status} description="Maintained profit margin" />
                <PerformanceCard metricName="Negotiation Skills" metricValue="Good" weightage={10} status={metrics.negotiation.status} description="Maintains premium pricing" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <Card>
                    <h3 className="text-lg font-bold flex items-center"><TrophyIcon className="w-5 h-5 mr-2 text-accent"/> Achievements</h3>
                    <ul className="mt-4 list-disc pl-5 space-y-1 text-sm text-text-secondary">
                        <li>'Speedy Gonzales' award for fastest average quote delivery time.</li>
                        <li>'Pinpoint Pricer' badge for exceptional quote accuracy.</li>
                    </ul>
                </Card>
                 <Card>
                    <h3 className="text-lg font-bold flex items-center"><SparklesIcon className="w-5 h-5 mr-2 text-primary"/> Improvement Suggestions</h3>
                    <ul className="mt-4 list-disc pl-5 space-y-1 text-sm text-text-secondary">
                        <li>Focus on improving conversion rate from 35% to over 40%.</li>
                        <li>Aim for an average profit margin above 25%.</li>
                    </ul>
                </Card>
            </div>
        </div>
    );
};

export default MyPerformancePage;
