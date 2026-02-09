import React, { useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useGeneralLedger } from '../../../hooks/useGeneralLedger';
import { useProjects } from '../../../hooks/useProjects';
import { useInventoryOrg } from '../../../hooks/useInventoryOrg';
import { useSalaryLedger } from '../../../hooks/useSalaryLedger';
import Card from '../../shared/Card';
import { formatCurrencyINR } from '../../../constants';
import { useApprovals } from '../../../hooks/useApprovals';
import { useCases } from '../../../hooks/useCases';

interface AccountsOverviewPageProps {
    setCurrentPage?: (page: string) => void;
}

const AccountsOverviewPage: React.FC<AccountsOverviewPageProps> = () => {
    const { currentUser } = useAuth();
    const orgId = currentUser?.organizationId;

    const { stats: financialStats, loading: ledgerLoading } = useGeneralLedger();
    const { projects, loading: projectsLoading } = useProjects();
    const { pendingApprovals, loading: approvalsLoading } = useApprovals();
    const { inventoryValue, loading: inventoryLoading } = useInventoryOrg(orgId);
    const { salaryPayable, loading: salaryLedgerLoading } = useSalaryLedger(orgId);
    const { cases, loading: casesLoading } = useCases();

    const activeProjects = projects.filter(p => (p.status as string) === 'Execution' || (p as any).status === 'Active' || (p.status as string) === 'ACTIVE').length;
    const pendingCount = pendingApprovals.length;

    // Aggregate Cost Center data from all cases
    const costCenterStats = useMemo(() => {
        const projectCases = cases.filter(c => c.isProject);
        let totalBudget = 0;
        let totalReceived = 0;
        let totalSpent = 0;

        projectCases.forEach(c => {
            const cc = (c as any).costCenter;
            if (cc) {
                totalBudget += cc.totalBudget || 0;
                totalReceived += cc.receivedAmount || 0;
                totalSpent += cc.spentAmount || 0;
            }
        });

        return {
            totalBudget,
            totalReceived,
            totalSpent,
            remainingBalance: totalReceived - totalSpent,
            projectCount: projectCases.length
        };
    }, [cases]);

    const loading = ledgerLoading || projectsLoading || approvalsLoading || inventoryLoading || salaryLedgerLoading || casesLoading;

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

            {/* Cost Center Summary */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-200">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-indigo-900">Cost Center Summary (All Projects)</h2>
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
                        {costCenterStats.projectCount} Projects
                    </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-lg border border-indigo-100">
                        <h3 className="text-xs font-medium text-gray-500 uppercase mb-1">Total Budget</h3>
                        <p className="text-xl font-bold text-gray-900">{formatCurrencyINR(costCenterStats.totalBudget)}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-green-100">
                        <h3 className="text-xs font-medium text-gray-500 uppercase mb-1">Total Received</h3>
                        <p className="text-xl font-bold text-green-600">{formatCurrencyINR(costCenterStats.totalReceived)}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-red-100">
                        <h3 className="text-xs font-medium text-gray-500 uppercase mb-1">Total Spent</h3>
                        <p className="text-xl font-bold text-red-600">{formatCurrencyINR(costCenterStats.totalSpent)}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-blue-100">
                        <h3 className="text-xs font-medium text-gray-500 uppercase mb-1">Remaining Balance</h3>
                        <p className={`text-xl font-bold ${costCenterStats.remainingBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                            {formatCurrencyINR(costCenterStats.remainingBalance)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Inventory Value & Salary Payable */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">Inventory Value</h3>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrencyINR(inventoryValue)}</p>
                    <p className="text-xs text-gray-500 mt-1">Sum (qty × avgCost) from org inventory</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">Salary Payable</h3>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrencyINR(salaryPayable)}</p>
                    <p className="text-xs text-gray-500 mt-1">Unpaid salaryLedger entries only</p>
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