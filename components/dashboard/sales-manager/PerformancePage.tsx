
import React, { useMemo } from 'react';
import Card from '../../shared/Card';
import { USERS } from '../../../constants';
import { LeadPipelineStatus, UserRole, User } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { useLeads } from '../../../hooks/useLeads';
import { TrophyIcon, SparklesIcon } from '../../icons/IconComponents';
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

const PerformancePage: React.FC<{ users: User[] }> = ({ users }) => {
    const { currentUser } = useAuth();
    const { leads: teamLeads, loading } = useLeads(); // Fetch all leads for manager
    if (!currentUser) return null;

    const salesTeamIds = useMemo(() => users.filter(u => u.role === UserRole.SALES_TEAM_MEMBER).map(u => u.id), [users]);

    const metrics = useMemo(() => {
        // MOCK data where not available
        const teamResponseTime = 4.5; // hours avg
        const leadDistribution = 1; // 1 for good
        const teamGrowth = 1; // 1 for good

        // CALCULATED data
        const totalLeads = teamLeads.length;
        const wonLeads = teamLeads.filter(l => l.status === LeadPipelineStatus.WON).length;
        const teamConversionRate = totalLeads > 0 ? (wonLeads / totalLeads) * 100 : 0;

        const teamRevenue = teamLeads.filter(l => l.status === LeadPipelineStatus.WON).reduce((sum, l) => sum + l.value, 0);
        const teamRevenueTarget = 20000000; // Mocked target
        const teamRevenuePercentage = teamRevenueTarget > 0 ? (teamRevenue / teamRevenueTarget) * 100 : 0;

        return {
            teamConversionRate: { value: teamConversionRate, status: getStatus(teamConversionRate, 20, 10) },
            teamRevenueTarget: { value: teamRevenuePercentage, status: getStatus(teamRevenuePercentage, 110, 90) },
            teamResponseTime: { value: teamResponseTime, status: getStatusInverted(teamResponseTime, 3, 8) },
            leadDistribution: { value: leadDistribution, status: getStatus(leadDistribution, 1, 0) },
            teamGrowth: { value: teamGrowth, status: getStatus(teamGrowth, 1, 0) },
        };
    }, [teamLeads]);

    const overallScore =
        (metrics.teamConversionRate.status === 'green' ? 100 : metrics.teamConversionRate.status === 'yellow' ? 60 : 20) * 0.30 +
        (metrics.teamRevenueTarget.status === 'green' ? 100 : metrics.teamRevenueTarget.status === 'yellow' ? 60 : 20) * 0.30 +
        (metrics.teamResponseTime.status === 'green' ? 100 : metrics.teamResponseTime.status === 'yellow' ? 60 : 20) * 0.15 +
        (metrics.leadDistribution.status === 'green' ? 100 : metrics.leadDistribution.status === 'yellow' ? 60 : 20) * 0.15 +
        (metrics.teamGrowth.status === 'green' ? 100 : metrics.teamGrowth.status === 'yellow' ? 60 : 20) * 0.10;

    const overallStatus = getStatus(overallScore, 80, 50);
    const overallLabel = overallStatus === 'green' ? 'High Performer' : overallStatus === 'yellow' ? 'Solid Performer' : 'Needs Improvement';
    const overallColor = overallStatus === 'green' ? 'text-secondary' : overallStatus === 'yellow' ? 'text-accent' : 'text-error';

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                <p className="text-text-secondary animate-pulse">Calculating team performance...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Card className={`bg-gradient-to-br from-surface to-subtle-background`}>
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <img src={currentUser.avatar} alt={currentUser.name} className="w-16 h-16 rounded-full ring-4 ring-primary/20" />
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
                    metricName="Team Conversion Rate"
                    metricValue={`${metrics.teamConversionRate.value.toFixed(1)}%`}
                    weightage={30}
                    status={metrics.teamConversionRate.status}
                    description={<>🟢 &gt;20%, 🟡 10-20%, 🔴 &lt;10%</>}
                />
                <PerformanceCard
                    metricName="Team Revenue Target"
                    metricValue={`${metrics.teamRevenueTarget.value.toFixed(0)}%`}
                    weightage={30}
                    status={metrics.teamRevenueTarget.status}
                    description={<>🟢 &gt;110%, 🟡 90-110%, 🔴 &lt;90%</>}
                />
                <PerformanceCard
                    metricName="Team Response Time"
                    metricValue={`${metrics.teamResponseTime.value.toFixed(1)} hrs`}
                    weightage={15}
                    status={metrics.teamResponseTime.status}
                    description={<>🟢 &lt;3h, 🟡 3-8h, 🔴 &gt;8h</>}
                />
                <PerformanceCard
                    metricName="Lead Distribution"
                    metricValue="Fair"
                    weightage={15}
                    status={metrics.leadDistribution.status}
                    description="Fairness of lead assignment"
                />
                <PerformanceCard
                    metricName="Team Growth"
                    metricValue="Positive"
                    weightage={10}
                    status={metrics.teamGrowth.status}
                    description="Training & performance trends"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <h3 className="text-lg font-bold flex items-center"><TrophyIcon className="w-5 h-5 mr-2 text-accent" /> Manager Achievements</h3>
                    <ul className="mt-4 list-disc pl-5 space-y-1 text-sm text-text-secondary">
                        <li>Led team to exceed quarterly revenue target by 15%.</li>
                        <li>Successfully onboarded and trained two new sales members.</li>
                    </ul>
                </Card>
                <Card>
                    <h3 className="text-lg font-bold flex items-center"><SparklesIcon className="w-5 h-5 mr-2 text-primary" /> Areas for Focus</h3>
                    <ul className="mt-4 list-disc pl-5 space-y-1 text-sm text-text-secondary">
                        <li>Implement strategies to reduce average team response time.</li>
                        <li>Organize a workshop on advanced negotiation tactics.</li>
                    </ul>
                </Card>
            </div>

        </div>
    );
};

export default PerformancePage;
