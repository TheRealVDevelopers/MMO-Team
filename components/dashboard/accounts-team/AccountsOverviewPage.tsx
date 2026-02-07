import React from 'react';
import { useGeneralLedger } from '../../../hooks/useGeneralLedger';
import { useProjects } from '../../../hooks/useProjects';
import Card from '../../shared/Card';
import { formatCurrencyINR } from '../../../constants';
import { useApprovals } from '../../../hooks/useApprovals';

const AccountsOverviewPage: React.FC = () => {
    // 1. Financial Stats (All Time)
    const { stats: financialStats, loading: ledgerLoading } = useGeneralLedger();

    // 2. Project Stats
    const { projects, loading: projectsLoading } = useProjects();
    // Check for 'Execution' status (CaseStatus) or legacy 'Active' properties
    const activeProjects = projects.filter(p => (p.status as string) === 'Execution' || (p as any).status === 'Active' || (p.status as string) === 'ACTIVE').length;

    // 3. Approval Stats
    // useApprovals returns pendingApprovals directly
    const { pendingApprovals, loading: approvalsLoading } = useApprovals();
    const pendingCount = pendingApprovals.length;

    const loading = ledgerLoading || projectsLoading || approvalsLoading;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Accounts Overview</h1>
                    <p className="text-gray-500">Real-time financial snapshot and pending actions.</p>
                </div>
                <div className="text-sm text-gray-500">
                    Last updated: {new Date().toLocaleTimeString()}
                </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Revenue */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-500 uppercase">Total Revenue</h3>
                        <span className="text-green-600 bg-green-50 p-1 rounded">INR</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrencyINR(financialStats.totalRevenue)}</p>
                    <p className="text-xs text-gray-500 mt-1">Confirmed Inflows</p>
                </div>

                {/* Expenses */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-500 uppercase">Total Expenses</h3>
                        <span className="text-red-600 bg-red-50 p-1 rounded">OUT</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrencyINR(financialStats.totalExpenses)}</p>
                    <p className="text-xs text-gray-500 mt-1">Payments & Salaries</p>
                </div>

                {/* Net Profit */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-500 uppercase">Net Profit</h3>
                        <span className={`p-1 rounded ${financialStats.netProfit >= 0 ? 'text-blue-600 bg-blue-50' : 'text-orange-600 bg-orange-50'}`}>NET</span>
                    </div>
                    <p className={`text-2xl font-bold ${financialStats.netProfit >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                        {formatCurrencyINR(financialStats.netProfit)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Global P&L</p>
                </div>

                {/* Pending Actions */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-amber-400">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-500 uppercase">Pending Approvals</h3>
                        <span className="text-amber-600 bg-amber-50 p-1 rounded">ACTION</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
                    <p className="text-xs text-gray-500 mt-1">Requires Attention</p>
                </div>
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card title="Active Projects">
                    <div className="flex items-center justify-between p-4">
                        <div>
                            <p className="text-3xl font-bold text-gray-900">{activeProjects}</p>
                            <p className="text-sm text-gray-500">Current ongoing cases</p>
                        </div>
                        <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                            📊
                        </div>
                    </div>
                </Card>

                <Card title="System Health">
                    <div className="p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">General Ledger</span>
                            <span className="text-green-600 font-medium">Synced</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Salary Engine</span>
                            <span className="text-green-600 font-medium">Ready</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Approval Workflow</span>
                            <span className="text-green-600 font-medium">Active</span>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default AccountsOverviewPage;