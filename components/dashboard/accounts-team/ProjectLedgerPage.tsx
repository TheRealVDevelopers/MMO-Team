import React, { useMemo } from 'react';
import { Project } from '../../../types';
import { useTransactions } from '../../../hooks/useTransactions';
import { formatCurrencyINR, formatDate } from '../../../constants';
import { ArrowLeftIcon, ArrowDownIcon, ArrowUpIcon } from '../../icons/IconComponents';
import Card from '../../shared/Card';
import StatusPill from '../../shared/StatusPill';
import { TrashIcon } from '@heroicons/react/24/outline';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../../firebase';

interface ProjectLedgerPageProps {
    project: Project;
    onBack: () => void;
}

const ProjectLedgerPage: React.FC<ProjectLedgerPageProps> = ({ project, onBack }) => {
    const { transactions, loading } = useTransactions(project.id);
    const [deletingTransaction, setDeletingTransaction] = React.useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = React.useState<string | null>(null);

    const transactionsWithBalance = useMemo(() => {
        // Sort by date ascending to calculate balance correctly
        const sorted = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        let runningBalance = 0;
        return sorted.map(t => {
            if (t.type === 'INFLOW' && t.status === 'Completed') runningBalance += t.amount;
            if (t.type === 'OUTFLOW' && t.status === 'Completed') runningBalance -= t.amount;
            return { ...t, balance: runningBalance };
        }).reverse(); // Reverse back to show newest first
    }, [transactions]);

    const handleDeleteTransaction = async (e: React.MouseEvent, transactionId: string) => {
        e.stopPropagation();
        if (confirmDelete !== transactionId) {
            setConfirmDelete(transactionId);
            return;
        }

        try {
            setDeletingTransaction(transactionId);
            const transactionRef = doc(db, 'transactions', transactionId);
            await deleteDoc(transactionRef);
            setConfirmDelete(null);
        } catch (error) {
            console.error("Error deleting transaction:", error);
            alert("Failed to delete transaction");
        } finally {
            setDeletingTransaction(null);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading Ledger...</div>;

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-subtle-background min-h-screen">
            <div className="flex items-center gap-4">
                <button
                    onClick={onBack}
                    className="flex items-center space-x-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
                >
                    <ArrowLeftIcon className="w-5 h-5" />
                    <span>Back to Cost Centers</span>
                </button>
                <div>
                    <h2 className="text-2xl font-bold text-text-primary">{project.projectName} - Ledger</h2>
                    <p className="text-sm text-text-secondary">{project.clientName}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-white p-6 rounded-xl border border-border shadow-sm">
                    <p className="text-sm text-text-secondary mb-1">Total Contract Value</p>
                    <p className="text-2xl font-bold text-text-primary">{formatCurrencyINR(project.budget)}</p>
                </Card>
                <Card className="bg-white p-6 rounded-xl border border-border shadow-sm">
                    <p className="text-sm text-text-secondary mb-1">Total Received</p>
                    <p className="text-2xl font-bold text-success">{formatCurrencyINR(project.totalCollected || 0)}</p>
                </Card>
                <Card className="bg-white p-6 rounded-xl border border-border shadow-sm">
                    <p className="text-sm text-text-secondary mb-1">Total Expenses</p>
                    <p className="text-2xl font-bold text-error">{formatCurrencyINR(project.totalExpenses || 0)}</p>
                </Card>
            </div>

            <Card className="overflow-hidden">
                <div className="p-4 border-b border-border bg-subtle-background">
                    <h3 className="font-bold text-text-primary">Transaction History</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                        <thead className="bg-subtle-background/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Description</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Category</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase">Inflow</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase">Outflow</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase">Balance</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-text-secondary uppercase">Status</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-text-secondary uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-surface divide-y divide-border">
                            {transactionsWithBalance.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-8 text-center text-text-secondary italic">
                                        No transactions recorded yet.
                                    </td>
                                </tr>
                            ) : (
                                transactionsWithBalance.map((t) => (
                                    <tr key={t.id} className="hover:bg-subtle-background/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                                            {formatDate(t.date)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-text-primary">
                                            <div className="font-medium">{t.description}</div>
                                            <div className="text-xs text-text-secondary font-mono">{t.referenceId}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                                {t.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-success">
                                            {t.type === 'INFLOW' ? formatCurrencyINR(t.amount) : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-error">
                                            {t.type === 'OUTFLOW' ? formatCurrencyINR(t.amount) : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-primary">
                                            {formatCurrencyINR(t.balance)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <StatusPill color={t.status === 'Completed' ? 'green' : 'amber'}>
                                                {t.status}
                                            </StatusPill>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <button
                                                onClick={(e) => handleDeleteTransaction(e, t.id)}
                                                disabled={deletingTransaction === t.id}
                                                className={`p-1 rounded hover:bg-red-100 transition-colors ${confirmDelete === t.id ? 'bg-red-100' : ''
                                                    }`}
                                                title={confirmDelete === t.id ? 'Click again to confirm' : 'Delete transaction'}
                                            >
                                                <TrashIcon className={`h-4 w-4 ${confirmDelete === t.id ? 'text-red-600' : 'text-gray-400 hover:text-red-600'
                                                    }`} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default ProjectLedgerPage;
