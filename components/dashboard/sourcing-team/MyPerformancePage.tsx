import React, { useMemo } from 'react';
import Card from '../../shared/Card';
import { MATERIAL_REQUESTS, VENDORS } from '../../../constants';
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

    const metrics = useMemo(() => {
        const costSavings = 12; // %
        const qualityCompliance = 1; // % rejection
        const inventory = 1; // 1 for good

        const onTimeRequests = MATERIAL_REQUESTS.filter(r => new Date(r.requiredBy) >= new Date()).length;
        const onTimeDelivery = MATERIAL_REQUESTS.length > 0 ? (onTimeRequests / MATERIAL_REQUESTS.length) * 100 : 0;

        const avgVendorRating = VENDORS.reduce((sum, v) => sum + v.rating, 0) / VENDORS.length;

        return {
            costSavings: { value: costSavings, status: getStatus(costSavings, 15, 5) },
            onTimeDelivery: { value: onTimeDelivery, status: getStatus(onTimeDelivery, 95, 85) },
            qualityCompliance: { value: qualityCompliance, status: getStatusInverted(qualityCompliance, 0, 2) },
            vendorManagement: { value: avgVendorRating, status: getStatus(avgVendorRating, 4.5, 4.0) },
            inventory: { value: inventory, status: getStatus(inventory, 1, 0) },
        };
    }, []);

    const overallScore =
        (metrics.costSavings.status === 'green' ? 100 : metrics.costSavings.status === 'yellow' ? 60 : 20) * 0.30 +
        (metrics.onTimeDelivery.status === 'green' ? 100 : metrics.onTimeDelivery.status === 'yellow' ? 60 : 20) * 0.25 +
        (metrics.qualityCompliance.status === 'green' ? 100 : metrics.qualityCompliance.status === 'yellow' ? 60 : 20) * 0.20 +
        (metrics.vendorManagement.status === 'green' ? 100 : metrics.vendorManagement.status === 'yellow' ? 60 : 20) * 0.15 +
        (metrics.inventory.status === 'green' ? 100 : metrics.inventory.status === 'yellow' ? 60 : 20) * 0.10;

    const overallStatus = getStatus(overallScore, 80, 50);
    const overallLabel = overallStatus === 'green' ? 'High Performer' : overallStatus === 'yellow' ? 'Solid Performer' : 'Needs Improvement';
    const overallColor = overallStatus === 'green' ? 'text-secondary' : overallStatus === 'yellow' ? 'text-accent' : 'text-error';

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <button onClick={() => setCurrentPage('overview')} className="flex items-center space-x-2 text-sm font-medium text-text-secondary hover:text-text-primary">
                    <ArrowLeftIcon className="w-5 h-5" /><span>Back</span>
                </button>
                <h2 className="text-2xl font-bold text-text-primary">Sourcing Performance</h2>
            </div>

            <Card className={`text-center p-4 rounded-lg ${overallStatus === 'green' ? 'bg-secondary/10' : overallStatus === 'yellow' ? 'bg-accent/10' : 'bg-error/10'}`}>
                <p className={`text-sm font-bold ${overallColor}`}>OVERALL RATING</p>
                <p className={`text-3xl font-bold ${overallColor}`}>{overallLabel}</p>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <PerformanceCard metricName="Cost Savings" metricValue={`${metrics.costSavings.value}%`} weightage={30} status={metrics.costSavings.status} description="Savings vs. budget" />
                <PerformanceCard metricName="On-Time Delivery" metricValue={`${metrics.onTimeDelivery.value.toFixed(0)}%`} weightage={25} status={metrics.onTimeDelivery.status} description="Materials delivered as needed" />
                <PerformanceCard metricName="Quality Compliance" metricValue={`${metrics.qualityCompliance.value}%`} weightage={20} status={metrics.qualityCompliance.status} description="Material rejection rate" />
                <PerformanceCard metricName="Vendor Management" metricValue={`${metrics.vendorManagement.value.toFixed(1)}/5`} weightage={15} status={metrics.vendorManagement.status} description="Average vendor rating" />
                <PerformanceCard metricName="Inventory Efficiency" metricValue="Good" weightage={10} status={metrics.inventory.status} description="Optimal inventory levels" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <h3 className="text-lg font-bold flex items-center"><TrophyIcon className="w-5 h-5 mr-2 text-accent" /> Achievements</h3>
                    <ul className="mt-4 list-disc pl-5 space-y-1 text-sm text-text-secondary">
                        <li>'Master Negotiator' badge for achieving 12% cost savings.</li>
                        <li>'Quality Guardian' for maintaining a low 1% rejection rate.</li>
                    </ul>
                </Card>
                <Card>
                    <h3 className="text-lg font-bold flex items-center"><SparklesIcon className="w-5 h-5 mr-2 text-primary" /> Improvement Suggestions</h3>
                    <ul className="mt-4 list-disc pl-5 space-y-1 text-sm text-text-secondary">
                        <li>Focus on improving on-time delivery from 92% to over 95%.</li>
                    </ul>
                </Card>
            </div>
        </div>
    );
};

export default MyPerformancePage;
