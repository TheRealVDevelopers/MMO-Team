import React from 'react';
import Card from '../../shared/Card';
import { INVOICES, PROJECTS, formatCurrencyINR } from '../../../constants';
import { PaymentStatus, Project } from '../../../types';
import { ExclamationTriangleIcon, BanknotesIcon } from '../../icons/IconComponents';
import ProgressBar from '../../shared/ProgressBar';

const KpiCard: React.FC<{ title: string; value: string; }> = ({ title, value }) => (
    <Card>
      <p className="text-sm font-medium text-text-secondary">{title}</p>
      <p className="text-3xl font-bold text-text-primary tracking-tight">{value}</p>
    </Card>
);

const AccountsOverviewPage: React.FC<{ setCurrentPage: (page: string) => void }> = ({ setCurrentPage }) => {
    const totalInvoiced = INVOICES.reduce((sum, inv) => sum + inv.amount, 0);
    const totalPaid = INVOICES.reduce((sum, inv) => sum + inv.paidAmount, 0);
    const outstanding = totalInvoiced - totalPaid;
    const overdue = INVOICES.filter(i => i.status === PaymentStatus.OVERDUE).reduce((sum, inv) => sum + (inv.amount - inv.paidAmount), 0);

    const getProfitability = (project: Project) => {
        const totalRevenue = INVOICES.filter(i => i.projectId === project.id).reduce((sum, i) => sum + i.paidAmount, 0);
        const profit = totalRevenue - (project.totalExpenses || 0);
        const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
        return { profit, margin };
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-text-primary">Financial Overview</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard title="Total Invoiced (YTD)" value={formatCurrencyINR(totalInvoiced)} />
                <KpiCard title="Revenue Received" value={formatCurrencyINR(totalPaid)} />
                <KpiCard title="Total Outstanding" value={formatCurrencyINR(outstanding)} />
                <KpiCard title="Amount Overdue" value={formatCurrencyINR(overdue)} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Card>
                        <h3 className="text-lg font-bold">Project Profitability</h3>
                        <div className="mt-4 overflow-x-auto">
                            <table className="min-w-full divide-y divide-border">
                                <thead className="bg-subtle-background">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Project</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Budget</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Profit</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Margin</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-surface divide-y divide-border">
                                    {PROJECTS.slice(0, 5).map(project => {
                                        const { profit, margin } = getProfitability(project);
                                        return (
                                            <tr key={project.id}>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <p className="text-sm font-bold text-text-primary">{project.projectName}</p>
                                                    <p className="text-xs text-text-secondary">{project.clientName}</p>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-text-secondary">{formatCurrencyINR(project.budget)}</td>
                                                <td className={`px-4 py-3 text-sm font-bold ${profit > 0 ? 'text-secondary' : 'text-error'}`}>{formatCurrencyINR(profit)}</td>
                                                <td className="px-4 py-3"><ProgressBar progress={margin} colorClass={margin > 15 ? 'bg-secondary' : 'bg-accent'} /></td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <h3 className="text-lg font-bold text-error flex items-center"><ExclamationTriangleIcon className="w-5 h-5 mr-2"/> Urgent Alerts</h3>
                        <ul className="mt-4 space-y-3">
                            {INVOICES.filter(i => i.status === PaymentStatus.OVERDUE).map(alert => (
                                <li key={alert.id} className="text-sm cursor-pointer hover:bg-subtle-background p-1 rounded-md" onClick={() => setCurrentPage('invoices')}>
                                    <p className="font-medium text-text-primary">Invoice {alert.id} Overdue</p>
                                    <p className="text-xs text-text-secondary">{alert.clientName} - {formatCurrencyINR(alert.amount - alert.paidAmount)}</p>
                                </li>
                            ))}
                        </ul>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default AccountsOverviewPage;