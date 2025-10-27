
import React from 'react';
import Card from '../../shared/Card';
import { CheckCircleIcon, ClockIcon, BanknotesIcon, ChartBarIcon, ArrowLeftIcon } from '../../icons/IconComponents';

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
                <h2 className="text-2xl font-bold text-text-primary">Procurement Performance</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard title="Total Savings (YTD)" value="$85,210" icon={<BanknotesIcon />} />
                <KpiCard title="On-Time Delivery Rate" value="96.5%" icon={<ClockIcon />} />
                <KpiCard title="Quality Rejection Rate" value="1.2%" icon={<CheckCircleIcon />} />
                <KpiCard title="Avg. Vendor Rating" value="4.6/5" icon={<ChartBarIcon />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <h3 className="text-lg font-bold">Monthly Cost Savings</h3>
                    <div className="mt-4 h-72 bg-subtle-background rounded-md flex items-center justify-center">
                        <p className="text-text-secondary">Chart Placeholder</p>
                    </div>
                </Card>
                 <Card>
                    <h3 className="text-lg font-bold">Vendor Performance Breakdown</h3>
                    <div className="mt-4 h-72 bg-subtle-background rounded-md flex items-center justify-center">
                        <p className="text-text-secondary">Chart Placeholder</p>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default MyPerformancePage;