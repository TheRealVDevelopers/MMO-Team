

import React, { useRef, useEffect } from 'react';
import Card from '../../shared/Card';
import { formatCurrencyINR } from '../../../constants';
import { Invoice, PaymentStatus, Project, Expense, VendorBill } from '../../../types';
import { ExclamationTriangleIcon } from '../../icons/IconComponents';
import ProgressBar from '../../shared/ProgressBar';
import { useFinance } from '../../../hooks/useFinance';
import { useTimeEntries } from '../../../hooks/useTimeTracking';

const KpiCard: React.FC<{ title: string; value: string; color?: string }> = ({ title, value, color }) => (
    <Card>
        <p className="text-sm font-medium text-text-secondary">{title}</p>
        <p className={`text-3xl font-bold tracking-tight ${color || 'text-text-primary'}`}>{value}</p>
    </Card>
);

interface AccountsOverviewPageProps {
    setCurrentPage: (page: string) => void;
    // Data is now fetched internally using hooks for real-time updates
    invoices?: Invoice[];
    projects?: Project[];
    expenses?: Expense[];
    vendorBills?: VendorBill[];
}

const AccountsOverviewPage: React.FC<AccountsOverviewPageProps> = ({ setCurrentPage, invoices, projects = [], expenses, vendorBills }) => {
    // Use Real-time hooks - NOT useProjects since projects come from props
    const { transactions, costCenters, salaries, loading: financeLoading } = useFinance();

    // PRESERVE last valid data to prevent zeros when hooks re-render
    const lastValidProjectsRef = useRef<Project[]>([]);

    // Update ref when we have valid project data
    useEffect(() => {
        if (projects.length > 0) {
            lastValidProjectsRef.current = projects;
        }
    }, [projects]);

    // Use the last valid projects if current is empty
    const stableProjects = projects.length > 0 ? projects : lastValidProjectsRef.current;

    // 1. Pay In / Pay Out Calculations
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const isToday = (date: Date) => date.toDateString() === today.toDateString();
    const isThisMonth = (date: Date) => date >= startOfMonth;

    const payInToday = transactions.filter(t => t.type === 'PAY_IN' && isToday(t.date)).reduce((sum, t) => sum + t.amount, 0);
    const payInMonth = transactions.filter(t => t.type === 'PAY_IN' && isThisMonth(t.date)).reduce((sum, t) => sum + t.amount, 0);

    const payOutToday = transactions.filter(t => t.type === 'PAY_OUT' && isToday(t.date)).reduce((sum, t) => sum + t.amount, 0);
    const payOutMonth = transactions.filter(t => t.type === 'PAY_OUT' && isThisMonth(t.date)).reduce((sum, t) => sum + t.amount, 0);

    // 2. Active Projects & Budgets - use stableProjects (last valid data)
    const activeProjectsList = stableProjects.filter(p => p.status !== 'Completed' && p.status !== 'On Hold');
    const activeProjectsCount = activeProjectsList.length;

    // Sum from Cost Centers if they exist, otherwise use stableProjects for budget
    const totalProjectBudget = (costCenters.length > 0)
        ? costCenters.reduce((sum, cc) => sum + cc.totalBudget, 0)
        : stableProjects.reduce((sum, p) => sum + (p.budget || 0), 0);

    const totalUsedBudget = (costCenters.length > 0)
        ? costCenters.reduce((sum, cc) => sum + cc.totalPayOut, 0)
        : stableProjects.reduce((sum, p) => sum + (p.totalExpenses || 0), 0);

    // 3. Pending Payments
    const pendingPaymentsAmount = vendorBills?.filter(b => b.status === 'Pending Approval').reduce((sum, b) => sum + b.amount, 0) || 0;

    // 4. Salary Payables
    const salaryPayables = salaries.filter(s => s.status === 'PENDING').reduce((sum, s) => sum + s.totalPayable, 0);

    // 5. Build Cost Center display data - use stableProjects
    const displayCostCenters = (costCenters.length > 0)
        ? costCenters
        : stableProjects.slice(0, 5).map(p => ({
            id: p.id,
            projectId: p.id,
            totalBudget: p.budget || 0,
            totalPayIn: p.totalCollected || p.advancePaid || 0,
            totalPayOut: p.totalExpenses || 0,
            remainingBudget: (p.budget || 0) - (p.totalExpenses || 0),
            profit: (p.totalCollected || 0) - (p.totalExpenses || 0),
            status: 'Active' as const,
            lastUpdated: new Date()
        }));

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-8">
            <h2 className="text-2xl font-bold text-text-primary">Financial Command Center</h2>

            {/* Pay In / Pay Out Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard title="Pay In (Today)" value={formatCurrencyINR(payInToday)} color="text-secondary" />
                <KpiCard title="Pay In (Month)" value={formatCurrencyINR(payInMonth)} color="text-secondary" />
                <KpiCard title="Pay Out (Today)" value={formatCurrencyINR(payOutToday)} color="text-error" />
                <KpiCard title="Pay Out (Month)" value={formatCurrencyINR(payOutMonth)} color="text-error" />
            </div>

            {/* Project Financials */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <KpiCard title="Active Projects" value={activeProjectsCount.toString()} />
                <KpiCard title="Total Project Budget" value={formatCurrencyINR(totalProjectBudget)} />
                <KpiCard title="Budget Utilized" value={formatCurrencyINR(totalUsedBudget)} />
                <KpiCard title="Salary Payables" value={formatCurrencyINR(salaryPayables)} />
            </div>

            {/* Cost Center / Project List */}
            <Card>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold">Live Cost Centers</h3>
                    <button className="text-sm text-primary hover:underline">View All</button>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                        <thead className="bg-subtle-background">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-bold uppercase">Project</th>
                                <th className="px-4 py-2 text-right text-xs font-bold uppercase">Inflow (Pay In)</th>
                                <th className="px-4 py-2 text-right text-xs font-bold uppercase">Outflow (Pay Out)</th>
                                <th className="px-4 py-2 text-right text-xs font-bold uppercase">Balance</th>
                                <th className="px-4 py-2 text-center text-xs font-bold uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {displayCostCenters.slice(0, 5).map(cc => {
                                const project = projects.find(p => p.id === cc.projectId);
                                return (
                                    <tr key={cc.id} className="hover:bg-subtle-background/50">
                                        <td className="px-4 py-3 font-medium text-sm">{project?.projectName || 'Unknown'}</td>
                                        <td className="px-4 py-3 text-right text-sm text-secondary font-mono">{formatCurrencyINR(cc.totalPayIn)}</td>
                                        <td className="px-4 py-3 text-right text-sm text-error font-mono">{formatCurrencyINR(cc.totalPayOut)}</td>
                                        <td className="px-4 py-3 text-right text-sm font-bold font-mono">{formatCurrencyINR(cc.remainingBudget)}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`px-2 py-1 rounded-full text-[10px] uppercase font-bold ${cc.remainingBudget > 0 ? 'bg-secondary/10 text-secondary' : 'bg-error/10 text-error'
                                                }`}>
                                                {cc.remainingBudget > 0 ? 'Healthy' : 'Overrun'}
                                            </span>
                                        </td>
                                    </tr>
                                )
                            })}
                            {displayCostCenters.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-text-secondary italic">
                                        No active projects or cost centers found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default AccountsOverviewPage;