import React from 'react';
import Card from '../../shared/Card';
import { ArrowLeftIcon, BanknotesIcon, ChartBarIcon, ChartPieIcon, PresentationChartLineIcon } from '../../icons/IconComponents';
import { formatCurrencyINR } from '../../../constants';

const KpiCard: React.FC<{ title: string; value: string; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <Card>
        <div className="flex items-center">
            <div className="p-3 rounded-full bg-primary-subtle-background text-primary">{icon}</div>
            <div className="ml-4">
                <p className="text-sm font-medium text-text-secondary">{title}</p>
                <p className="text-2xl font-bold text-text-primary">{value}</p>
            </div>
        </div>
    </Card>
);

const PriceTrendChart: React.FC = () => (
    <div className="h-64 flex items-center justify-center bg-subtle-background rounded-md p-4">
        <p className="text-text-secondary">Line Chart: Price Trend Analysis</p>
    </div>
);

const ProfitabilityChart: React.FC = () => (
    <div className="h-64 flex items-center justify-center bg-subtle-background rounded-md p-4">
        <p className="text-text-secondary">Bar Chart: Profitability by Project Type</p>
    </div>
);


const PriceAnalyticsPage: React.FC<{ setCurrentPage: (page: string) => void }> = ({ setCurrentPage }) => {
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
                <h2 className="text-2xl font-bold text-text-primary">Price Analytics</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <KpiCard title="Avg. Quote Value" value={formatCurrencyINR(2250000)} icon={<BanknotesIcon />} />
                <KpiCard title="Win Rate (vs. Target)" value="68%" icon={<ChartPieIcon />} />
                <KpiCard title="Most Profitable Item" value="Ergonomic Chairs" icon={<ChartBarIcon />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <h3 className="text-lg font-bold">Price Trend Analysis</h3>
                    <p className="text-sm text-text-secondary mb-4">Tracking cost of common items over time.</p>
                    <PriceTrendChart />
                </Card>
                <Card>
                    <h3 className="text-lg font-bold">Profitability by Project Type</h3>
                    <p className="text-sm text-text-secondary mb-4">Comparing profit margins across different types of projects.</p>
                    <ProfitabilityChart />
                </Card>
            </div>
        </div>
    );
};

export default PriceAnalyticsPage;