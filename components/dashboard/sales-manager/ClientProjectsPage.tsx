import React, { useState } from 'react';
import {
    MagnifyingGlassIcon,
    FunnelIcon,
    EyeIcon,
    CurrencyRupeeIcon,
    UserCircleIcon,
    MapPinIcon,
    TagIcon,
} from '@heroicons/react/24/outline';
import { useCases } from '../../../hooks/useCases';
import { Case, CaseStatus } from '../../../types';
import { formatCurrencyINR } from '../../../constants';
import { useAuth } from '../../../context/AuthContext';
import SalesManagerCaseDetailModal from './SalesManagerCaseDetailModal';

// ─── Status Badge ─────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
    [CaseStatus.LEAD]: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Lead' },
    [CaseStatus.SITE_VISIT]: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Site Visit' },
    [CaseStatus.DRAWING]: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Drawing' },
    [CaseStatus.BOQ]: { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'BOQ' },
    [CaseStatus.QUOTATION]: { bg: 'bg-teal-100', text: 'text-teal-700', label: 'Quotation' },
    [CaseStatus.NEGOTIATION]: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Negotiation' },
    [CaseStatus.WAITING_FOR_PAYMENT]: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Awaiting Payment' },
    [CaseStatus.WAITING_FOR_PLANNING]: { bg: 'bg-cyan-100', text: 'text-cyan-700', label: 'Planning' },
    [CaseStatus.EXECUTION_ACTIVE]: { bg: 'bg-green-100', text: 'text-green-700', label: 'Execution Active' },
    [CaseStatus.COMPLETED]: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Completed' },
};

function StatusBadge({ status }: { status?: string }) {
    if (!status) return null;
    const cfg = STATUS_COLORS[status] ?? { bg: 'bg-slate-100', text: 'text-slate-600', label: status };
    return (
        <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-full ${cfg.bg} ${cfg.text}`}>
            {cfg.label}
        </span>
    );
}

// ─── Safe value display ───────────────────────────────────────────────────────
const d = (v: unknown): string => {
    if (v == null || v === '' || v === 0) return '—';
    return String(v);
};

const curr = (v: unknown): string => {
    const n = Number(v);
    if (!v || isNaN(n) || n === 0) return '—';
    return formatCurrencyINR(n);
};

// ─── Main component ───────────────────────────────────────────────────────────
const ClientProjectsPage: React.FC = () => {
    const { currentUser } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    // ── Fetch all cases that are projects ──────────────────────────────────────
    const { cases, loading, error } = useCases({ isProject: true });

    const filtered = cases.filter((c) => {
        const q = searchTerm.toLowerCase();
        const matchesSearch =
            (c.clientName ?? '').toLowerCase().includes(q) ||
            (c.title ?? '').toLowerCase().includes(q) ||
            (c.id ?? '').toLowerCase().includes(q) ||
            (c.siteAddress ?? '').toLowerCase().includes(q);

        const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const openDetail = (caseId: string) => {
        console.log('[ClientProjectsPage] Opening detail for caseId:', caseId);
        setSelectedCaseId(caseId);
        setIsDetailOpen(true);
    };

    const statuses = Object.entries(STATUS_COLORS).map(([value, cfg]) => ({ value, label: cfg.label }));

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Client Projects</h1>
                    <p className="text-text-secondary text-sm mt-1">Live data from Firestore · {cases.length} projects</p>
                </div>
                <div className="text-sm text-text-secondary">
                    Showing <span className="font-bold text-text-primary">{filtered.length}</span> of {cases.length}
                </div>
            </div>

            {/* Loading */}
            {loading && (
                <div className="flex justify-center py-16">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                    <p className="text-red-800 font-medium">Error: {error}</p>
                </div>
            )}

            {/* Filters */}
            {!loading && !error && (
                <>
                    <div className="bg-surface rounded-xl border border-border p-4 flex flex-col md:flex-row gap-3">
                        <div className="flex-1 relative">
                            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                            <input
                                type="text"
                                placeholder="Search by client, project name, or ID…"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                            />
                        </div>
                        <div className="relative md:w-56">
                            <FunnelIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                            <select
                                value={filterStatus}
                                onChange={e => setFilterStatus(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm appearance-none"
                            >
                                <option value="all">All Statuses</option>
                                {statuses.map(s => (
                                    <option key={s.value} value={s.value}>{s.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Project Cards */}
                    <div className="grid grid-cols-1 gap-4">
                        {filtered.length === 0 ? (
                            <div className="bg-surface rounded-xl border border-border p-12 text-center">
                                <p className="text-text-secondary">No projects found.</p>
                            </div>
                        ) : (
                            filtered.map(c => {
                                const budget = c.financial?.totalBudget ?? (typeof c.budget === 'number' ? c.budget : null);
                                const collected = c.financial?.totalCollected ?? null;
                                const projectVal = c.projectValue ?? c.leadValue ?? null;

                                return (
                                    <div key={c.id} className="bg-surface rounded-2xl border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-200">
                                        <div className="p-6">
                                            {/* Title row */}
                                            <div className="flex items-start justify-between gap-4 mb-4">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                        <h3 className="text-base font-bold text-text-primary truncate">
                                                            {d(c.clientName)}
                                                        </h3>
                                                        <StatusBadge status={c.status} />
                                                        {c.leadType && (
                                                            <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-widest bg-primary/10 text-primary rounded-full">
                                                                {c.leadType}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-text-secondary truncate">
                                                        {d(c.title)} {c.siteAddress ? `· ${c.siteAddress}` : ''}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => openDetail(c.id)}
                                                    className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/90 transition-colors"
                                                >
                                                    <EyeIcon className="w-4 h-4" />
                                                    View Details
                                                </button>
                                            </div>

                                            {/* Data grid */}
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border">
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-1 flex items-center gap-1">
                                                        <CurrencyRupeeIcon className="w-3 h-3" /> Project Value
                                                    </p>
                                                    <p className={`text-sm font-bold ${projectVal ? 'text-primary' : 'text-text-secondary'}`}>
                                                        {curr(projectVal)}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-1 flex items-center gap-1">
                                                        <CurrencyRupeeIcon className="w-3 h-3" /> Budget
                                                    </p>
                                                    <p className="text-sm font-bold text-text-primary">
                                                        {curr(budget)}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-1 flex items-center gap-1">
                                                        <CurrencyRupeeIcon className="w-3 h-3" /> Collected
                                                    </p>
                                                    <p className={`text-sm font-bold ${collected ? 'text-green-600' : 'text-text-secondary'}`}>
                                                        {curr(collected)}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-1 flex items-center gap-1">
                                                        <UserCircleIcon className="w-3 h-3" /> Sales Owner
                                                    </p>
                                                    <p className="text-sm font-bold text-text-primary">
                                                        {d(c.assignedSales)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </>
            )}

            {/* Case Detail Modal */}
            <SalesManagerCaseDetailModal
                caseId={selectedCaseId}
                isOpen={isDetailOpen}
                onClose={() => {
                    setIsDetailOpen(false);
                    setSelectedCaseId(null);
                }}
            />
        </div>
    );
};

export default ClientProjectsPage;
