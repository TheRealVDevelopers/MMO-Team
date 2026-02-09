import React, { useState } from 'react';
import { useCases, useCaseQuotations } from '../../../hooks/useCases';
import { useAuth } from '../../../context/AuthContext';
import { Case, CaseQuotation } from '../../../types';
import { formatCurrencyINR, formatDateTime } from '../../../constants';
import { DocumentTextIcon, CheckCircleIcon, ClockIcon, XCircleIcon } from '../../icons/IconComponents';
import Card from '../../shared/Card';

interface QuotationWithCase {
    quotation: CaseQuotation;
    case: Case;
}

const QuotationsListPage: React.FC = () => {
    const { currentUser } = useAuth();
    const { cases, loading: casesLoading } = useCases();
    const [selectedCase, setSelectedCase] = useState<Case | null>(null);
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

    // Component to display quotations for a specific case
    const CaseQuotations: React.FC<{ caseItem: Case }> = ({ caseItem }) => {
        const { quotations, loading } = useCaseQuotations(caseItem.id);

        if (loading) return <div className="text-sm text-text-secondary">Loading quotations...</div>;
        if (quotations.length === 0) return null;

        return (
            <div className="space-y-2">
                {quotations.map(quotation => (
                    <div
                        key={quotation.id}
                        className="p-4 bg-subtle-background rounded-lg border border-border hover:border-primary transition-all cursor-pointer"
                        onClick={() => handleViewQuotation(quotation, caseItem)}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h4 className="font-bold text-text-primary">{quotation.quotationNumber}</h4>
                                    {getStatusBadge(quotation.status)}
                                </div>
                                <p className="text-sm text-text-secondary mb-2">
                                    {quotation.items.length} items • {formatCurrencyINR(quotation.finalAmount)}
                                </p>
                                <p className="text-xs text-text-tertiary">
                                    Created {formatDateTime(quotation.submittedAt)}
                                </p>
                            </div>
                            <button className="p-2 hover:bg-background rounded-lg transition-colors">
                                <DocumentTextIcon className="w-5 h-5 text-text-secondary" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const handleViewQuotation = (quotation: CaseQuotation, caseItem: Case) => {
        // TODO: Open detailed quotation modal
        console.log('View quotation:', quotation, 'for case:', caseItem);
    };

    const getStatusBadge = (status: string) => {
        const configs: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
            'Draft': { color: 'bg-gray-100 text-gray-700', icon: <ClockIcon className="w-4 h-4" />, label: 'Draft' },
            'Pending Approval': { color: 'bg-yellow-100 text-yellow-700', icon: <ClockIcon className="w-4 h-4" />, label: 'Pending' },
            'Approved': { color: 'bg-green-100 text-green-700', icon: <CheckCircleIcon className="w-4 h-4" />, label: 'Approved' },
            'Rejected': { color: 'bg-red-100 text-red-700', icon: <XCircleIcon className="w-4 h-4" />, label: 'Rejected' },
        };

        const config = configs[status] || configs['Draft'];
        return (
            <span className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${config.color}`}>
                {config.icon}
                {config.label}
            </span>
        );
    };

    const filteredCases = cases.filter(c => {
        // Apply filter logic if needed
        return true;
    });

    if (casesLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <ClockIcon className="w-12 h-12 text-text-tertiary mx-auto mb-4 animate-spin" />
                    <p className="text-text-secondary">Loading cases and quotations...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-text-primary">Quotations</h2>
                    <p className="text-text-secondary">View and manage all quotations across cases</p>
                </div>

                <div className="flex gap-2">
                    {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                                filter === f
                                    ? 'bg-primary text-white'
                                    : 'bg-surface text-text-secondary hover:bg-subtle-background'
                            }`}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid gap-4">
                {filteredCases.map(caseItem => (
                    <Card key={caseItem.id}>
                        <div className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-lg font-bold text-text-primary">
                                            {caseItem.projectName}
                                        </h3>
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                                            caseItem.isProject 
                                                ? 'bg-green-100 text-green-700' 
                                                : 'bg-blue-100 text-blue-700'
                                        }`}>
                                            {caseItem.isProject ? 'PROJECT' : 'LEAD'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-text-secondary">
                                        {caseItem.clientName} • {caseItem.clientPhone || '—'}
                                    </p>
                                </div>
                            </div>

                            <CaseQuotations caseItem={caseItem} />
                        </div>
                    </Card>
                ))}

                {filteredCases.length === 0 && (
                    <Card>
                        <div className="p-12 text-center">
                            <DocumentTextIcon className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-text-primary mb-2">No Cases Found</h3>
                            <p className="text-text-secondary">There are no cases to display quotations for.</p>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default QuotationsListPage;
