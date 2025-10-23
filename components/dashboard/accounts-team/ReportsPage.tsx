import React from 'react';
import Card from '../../shared/Card';
import { ArrowDownTrayIcon } from '../../icons/IconComponents';

const ReportsPage: React.FC = () => {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-text-primary">Financial Reports</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <h3 className="text-lg font-bold">Report Generator</h3>
                    <p className="mt-2 text-sm text-text-secondary">Generate and export detailed financial reports.</p>
                    <div className="mt-4 space-y-4">
                        <div>
                            <label htmlFor="report-type" className="block text-sm font-medium text-text-primary">Report Type</label>
                            <select id="report-type" className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-border bg-surface text-text-primary focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md">
                                <option>Profit & Loss Statement</option>
                                <option>Project Profitability</option>
                                <option>Invoice Aging Report</option>
                                <option>Expense by Category</option>
                                <option>Vendor Payment History</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="report-period" className="block text-sm font-medium text-text-primary">Period</label>
                            <select id="report-period" className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-border bg-surface text-text-primary focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md">
                                <option>Last 30 Days</option>
                                <option>This Month</option>
                                <option>Last Quarter</option>
                                <option>This Year</option>
                            </select>
                        </div>
                        <button className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:opacity-90">
                            <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                            Generate & Export (.pdf)
                        </button>
                    </div>
                </Card>
                <Card>
                    <h3 className="text-lg font-bold">Cash Flow Overview</h3>
                    <div className="mt-4 h-64 bg-subtle-background rounded-md flex items-center justify-center">
                        <p className="text-text-secondary">Cash Flow Chart Placeholder</p>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default ReportsPage;