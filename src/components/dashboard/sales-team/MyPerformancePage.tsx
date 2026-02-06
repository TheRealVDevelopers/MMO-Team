import React, { useMemo } from 'react';
import { LeadPipelineStatus } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import {
    ArrowLeftIcon,
    TrophyIcon,
    SparklesIcon,
    PresentationChartLineIcon,
    ClockIcon,
    FaceSmileIcon,
    CheckBadgeIcon,
    CurrencyRupeeIcon,
    UserCircleIcon
} from '@heroicons/react/24/outline';
import { ContentCard, cn, staggerContainer } from '../shared/DashboardUI';
import { motion } from 'framer-motion';

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

const PerformanceMetric: React.FC<{
    name: string;
    value: string;
    status: 'green' | 'yellow' | 'red';
    icon: React.ElementType;
    description: string;
}> = ({ name, value, status, icon: Icon, description }) => {
    const statusConfig = {
        green: 'text-green-500 bg-green-500/10 border-green-500/20',
        yellow: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
        red: 'text-error bg-error/10 border-error/20',
    };

    return (
        <ContentCard className="relative overflow-hidden group">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1">{name}</p>
                    <h3 className="text-2xl font-serif font-black text-text-primary">{value}</h3>
                </div>
                <div className={cn("p-3 rounded-xl", statusConfig[status])}>
                    <Icon className="w-5 h-5" />
                </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
                <div className="flex-1 h-1 bg-border/40 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: status === 'green' ? '100%' : status === 'yellow' ? '60%' : '30%' }}
                        className={cn(
                            "h-full rounded-full",
                            status === 'green' ? 'bg-green-500' : status === 'yellow' ? 'bg-amber-500' : 'bg-error'
                        )}
                    />
                </div>
                <span className="text-[10px] font-medium text-text-tertiary italic">{description}</span>
            </div>
        </ContentCard>
    );
};

import { useLeads } from '../../../hooks/useLeads';

const MyPerformancePage: React.FC<{ setCurrentPage: (page: string) => void }> = ({ setCurrentPage }) => {
    const { currentUser } = useAuth();
    const { leads: myLeads, loading } = useLeads(currentUser?.id);

    const metrics = useMemo(() => {
        if (loading) return null;
        const responseTime = 1.5;
        const clientSatisfaction = 4.7;
        const taskCompletion = 85;

        const totalLeads = myLeads.length;
        const siteVisitLeads = myLeads.filter(l => l.history.some(h => h.action.includes('Site Visit'))).length;
        const conversionRate = totalLeads > 0 ? (siteVisitLeads / totalLeads) * 100 : 0;
        const revenueGenerated = myLeads.filter(l => l.status === LeadPipelineStatus.WON).reduce((sum, l) => sum + l.value, 0);

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

    if (loading || !metrics || !currentUser) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

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
        <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="space-y-8"
        >
            <ContentCard className="bg-gradient-to-br from-surface to-subtle-background border-primary/20">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <img src={currentUser.avatar} alt={currentUser.name} className="w-20 h-20 rounded-2xl object-cover ring-4 ring-primary/20 shadow-xl" />
                            <div className="absolute -bottom-2 -right-2 bg-secondary text-white p-1.5 rounded-lg shadow-lg">
                                <CheckBadgeIcon className="w-4 h-4" />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-2xl font-serif font-black text-text-primary">{currentUser.name}</h3>
                            <p className="text-sm font-medium text-text-tertiary flex items-center gap-2 mt-1">
                                <UserCircleIcon className="w-4 h-4" />
                                {currentUser.role}
                            </p>
                        </div>
                    </div>

                    <div className={cn(
                        "text-center p-6 rounded-3xl border min-w-[200px] transition-all",
                        overallStatus === 'green' ? 'bg-secondary/5 border-secondary/20 shadow-lg shadow-secondary/5' :
                            overallStatus === 'yellow' ? 'bg-accent/5 border-accent/20 shadow-lg shadow-accent/5' :
                                'bg-error/5 border-error/20 shadow-lg shadow-error/5'
                    )}>
                        <p className={cn("text-[10px] font-black uppercase tracking-[0.2em] mb-1", overallColor)}>Overall Index</p>
                        <p className={cn("text-2xl font-black", overallColor)}>{overallLabel}</p>
                    </div>
                </div>
            </ContentCard>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <PerformanceMetric
                    name="Pulse Period"
                    value={`${metrics.responseTime.value.toFixed(1)} hrs`}
                    status={metrics.responseTime.status}
                    icon={ClockIcon}
                    description="Response time metric"
                />
                <PerformanceMetric
                    name="Conversion Velocity"
                    value={`${metrics.conversionRate.value.toFixed(1)}%`}
                    status={metrics.conversionRate.status}
                    icon={PresentationChartLineIcon}
                    description="Lead to site visit ratio"
                />
                <PerformanceMetric
                    name="Client Sentiment"
                    value={`${metrics.clientSatisfaction.value.toFixed(1)}/5`}
                    status={metrics.clientSatisfaction.status}
                    icon={FaceSmileIcon}
                    description="Post-interaction feedback"
                />
                <PerformanceMetric
                    name="Objective Completion"
                    value={`${metrics.taskCompletion.value}%`}
                    status={metrics.taskCompletion.status}
                    icon={CheckBadgeIcon}
                    description="Task fulfillment rate"
                />
                <PerformanceMetric
                    name="Fiscal Contribution"
                    value={`${metrics.revenueGenerated.value.toFixed(0)}%`}
                    status={metrics.revenueGenerated.status}
                    icon={CurrencyRupeeIcon}
                    description="Quarterly revenue target"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <ContentCard>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                            <TrophyIcon className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-serif font-bold text-text-primary">Accolades</h3>
                    </div>
                    <ul className="space-y-4">
                        {[
                            "'Rapid Responder' for consistent < 2-hour response times.",
                            "'Top Converter' for Q2 with a 28% conversion excellence."
                        ].map((achievement, i) => (
                            <li key={i} className="flex items-start gap-3 group">
                                <div className="mt-1 w-1.5 h-1.5 rounded-full bg-accent group-hover:scale-150 transition-transform" />
                                <span className="text-sm text-text-secondary leading-relaxed font-medium italic">{achievement}</span>
                            </li>
                        ))}
                    </ul>
                </ContentCard>

                <ContentCard>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <SparklesIcon className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-serif font-bold text-text-primary">Growth Trajectory</h3>
                    </div>
                    <ul className="space-y-4">
                        {[
                            "Optimize task synchronization to elevate completion metrics.",
                            "Leverage strategic cross-selling to surpass fiscal targets."
                        ].map((suggestion, i) => (
                            <li key={i} className="flex items-start gap-3 group">
                                <div className="mt-1 w-1.5 h-1.5 rounded-full bg-primary group-hover:scale-150 transition-transform" />
                                <span className="text-sm text-text-secondary leading-relaxed font-medium italic">{suggestion}</span>
                            </li>
                        ))}
                    </ul>
                </ContentCard>
            </div>
        </motion.div>
    );
};

export default MyPerformancePage;
