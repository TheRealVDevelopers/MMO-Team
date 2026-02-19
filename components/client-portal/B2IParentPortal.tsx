import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BuildingOfficeIcon,
    ArrowRightIcon,
    ArrowLeftIcon,
    ArrowRightOnRectangleIcon,
    ChartBarSquareIcon,
    FolderIcon,
    CheckCircleIcon,
    ClockIcon,
    ExclamationTriangleIcon,
    CurrencyRupeeIcon,
    BanknotesIcon,
} from '@heroicons/react/24/outline';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore';
import { FIRESTORE_COLLECTIONS, formatCurrencyINR } from '../../constants';
import { CaseStatus } from '../../types';

// Human-readable status labels
const STATUS_LABELS: Record<string, string> = {
    [CaseStatus.LEAD]: 'Lead',
    [CaseStatus.CONTACTED]: 'Contacted',
    [CaseStatus.SITE_VISIT]: 'Site Visit',
    [CaseStatus.DRAWING]: 'Drawing',
    [CaseStatus.BOQ]: 'BOQ',
    [CaseStatus.QUOTATION]: 'Quotation',
    [CaseStatus.NEGOTIATION]: 'Negotiation',
    [CaseStatus.WAITING_FOR_PAYMENT]: 'Waiting for Payment',
    [CaseStatus.WAITING_FOR_PLANNING]: 'Waiting for Planning',
    [CaseStatus.PLANNING_SUBMITTED]: 'Planning Submitted',
    [CaseStatus.EXECUTION_ACTIVE]: 'Execution Active',
    [CaseStatus.COMPLETED]: 'Completed',
};
import ClientDashboardPage from '../landing/ClientDashboardPage';

interface B2IParentPortalProps {
    b2iId: string;
    clientName: string;
    onLogout: () => void;
}

// Active statuses for determining org status
const ACTIVE_STATUSES: string[] = [
    CaseStatus.EXECUTION_ACTIVE,
    CaseStatus.PLANNING_SUBMITTED,
    CaseStatus.DRAWING,
    CaseStatus.BOQ,
    CaseStatus.QUOTATION,
    CaseStatus.NEGOTIATION,
    CaseStatus.WAITING_FOR_PAYMENT,
    CaseStatus.WAITING_FOR_PLANNING,
];

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.07 },
    },
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, bounce: 0.3 } },
};

const B2IParentPortal: React.FC<B2IParentPortalProps> = ({ b2iId, clientName, onLogout }) => {
    const [b2iData, setB2IData] = useState<any>(null);
    const [childOrgs, setChildOrgs] = useState<any[]>([]);
    const [allProjects, setAllProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);

    // Fetch B2I client data
    useEffect(() => {
        if (!b2iId || !db) return;
        const unsub = onSnapshot(doc(db, FIRESTORE_COLLECTIONS.B2I_CLIENTS, b2iId), (snap) => {
            if (snap.exists()) {
                setB2IData({ id: snap.id, ...snap.data() });
            }
        });
        return () => unsub();
    }, [b2iId]);

    // Fetch child organizations
    useEffect(() => {
        if (!b2iId || !db) return;
        const q = query(
            collection(db, FIRESTORE_COLLECTIONS.ORGANIZATIONS),
            where('b2iParentId', '==', b2iId)
        );
        const unsub = onSnapshot(q, (snap) => {
            setChildOrgs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => unsub();
    }, [b2iId]);

    // Fetch all projects (cases with isProject: true)
    useEffect(() => {
        if (!db) return;
        const q = query(
            collection(db, FIRESTORE_COLLECTIONS.CASES),
            where('isProject', '==', true)
        );
        const unsub = onSnapshot(q, (snap) => {
            setAllProjects(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoading(false);
        });
        return () => unsub();
    }, []);

    // Derived stats & financials
    const { stats, financials, orgProjects: filteredProjects } = useMemo(() => {
        const orgIds = new Set(childOrgs.map(o => o.id));
        const orgProjects = allProjects.filter(p => orgIds.has(p.organizationId));
        const activeProjects = orgProjects.filter(p => ACTIVE_STATUSES.includes(p.status));
        const completedProjects = orgProjects.filter(p => p.status === CaseStatus.COMPLETED);

        // Aggregate financials
        let totalBudget = 0;
        let totalCollected = 0;
        orgProjects.forEach(p => {
            totalBudget += p.financial?.totalBudget || 0;
            totalCollected += p.financial?.totalCollected || 0;
        });

        return {
            stats: {
                totalOrgs: childOrgs.length,
                totalProjects: orgProjects.length,
                activeProjects: activeProjects.length,
                completedProjects: completedProjects.length,
            },
            financials: {
                totalBudget,
                totalCollected,
                totalPending: totalBudget - totalCollected,
                collectionPercent: totalBudget > 0 ? Math.round((totalCollected / totalBudget) * 100) : 0,
            },
            orgProjects,
        };
    }, [childOrgs, allProjects]);

    // Get projects for a specific org
    const getOrgProjects = (orgId: string) =>
        allProjects.filter(p => p.organizationId === orgId);

    const getOrgStatus = (orgId: string): 'active' | 'inactive' | 'none' => {
        const projects = getOrgProjects(orgId);
        if (projects.length === 0) return 'none';
        return projects.some(p => ACTIVE_STATUSES.includes(p.status)) ? 'active' : 'inactive';
    };

    // Handle org click — find project and open dashboard
    const handleOrgClick = (orgId: string) => {
        const projects = getOrgProjects(orgId);
        if (projects.length === 0) return;
        setSelectedCaseId(projects[0].id);
    };

    // If viewing a project detail
    if (selectedCaseId) {
        return (
            <ClientDashboardPage
                clientUser={null}
                onLogout={() => { }}
                caseId={selectedCaseId}
                onBack={() => setSelectedCaseId(null)}
            />
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-green-50/30">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full"
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30">
            {/* Header */}
            <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-200/60">
                <div className="max-w-7xl mx-auto px-6 lg:px-10 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/20">
                            <BuildingOfficeIcon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">
                                {b2iData?.name || 'Enterprise Portal'}
                            </h1>
                            <p className="text-xs text-gray-500 font-medium">
                                {clientName}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onLogout}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 rounded-xl transition-all duration-300 text-sm font-medium group"
                    >
                        <ArrowRightOnRectangleIcon className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        Logout
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 lg:px-10 py-10 space-y-10">
                {/* Welcome */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h2 className="text-3xl font-bold text-gray-900 mb-1">Welcome back</h2>
                    <p className="text-gray-500">Here's an overview of your organizations and projects.</p>
                </motion.div>

                {/* Stats Cards */}
                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-2 lg:grid-cols-4 gap-5"
                >
                    {[
                        {
                            label: 'Organizations',
                            value: stats.totalOrgs,
                            icon: BuildingOfficeIcon,
                            gradient: 'from-blue-500 to-indigo-600',
                            shadow: 'shadow-blue-500/15',
                            bg: 'bg-blue-50',
                        },
                        {
                            label: 'Total Projects',
                            value: stats.totalProjects,
                            icon: FolderIcon,
                            gradient: 'from-violet-500 to-purple-600',
                            shadow: 'shadow-violet-500/15',
                            bg: 'bg-violet-50',
                        },
                        {
                            label: 'Active Projects',
                            value: stats.activeProjects,
                            icon: ClockIcon,
                            gradient: 'from-green-500 to-emerald-600',
                            shadow: 'shadow-green-500/15',
                            bg: 'bg-green-50',
                        },
                        {
                            label: 'Completed',
                            value: stats.completedProjects,
                            icon: CheckCircleIcon,
                            gradient: 'from-amber-500 to-orange-600',
                            shadow: 'shadow-amber-500/15',
                            bg: 'bg-amber-50',
                        },
                    ].map((stat, idx) => (
                        <motion.div
                            key={idx}
                            variants={item}
                            className={`relative overflow-hidden rounded-2xl bg-white border border-gray-100 p-6 ${stat.shadow} shadow-lg hover:shadow-xl transition-shadow duration-300`}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className={`w-11 h-11 rounded-xl ${stat.bg} flex items-center justify-center`}>
                                    <stat.icon className={`w-5 h-5 bg-gradient-to-br ${stat.gradient} bg-clip-text text-transparent`} style={{ color: stat.gradient.includes('blue') ? '#3b82f6' : stat.gradient.includes('violet') ? '#8b5cf6' : stat.gradient.includes('green') ? '#22c55e' : '#f59e0b' }} />
                                </div>
                            </div>
                            <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                            <p className="text-xs font-medium text-gray-500 mt-1 uppercase tracking-wider">{stat.label}</p>
                            {/* Decorative gradient bar */}
                            <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.gradient}`} />
                        </motion.div>
                    ))}
                </motion.div>

                {/* Financial Summary */}
                {financials.totalBudget > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden"
                    >
                        <div className="p-6 pb-4">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                                    <BanknotesIcon className="w-5 h-5 text-emerald-600" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">Financial Overview</h3>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Total Budget</p>
                                    <p className="text-2xl font-bold text-gray-900">{formatCurrencyINR(financials.totalBudget)}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Collected</p>
                                    <p className="text-2xl font-bold text-emerald-600">{formatCurrencyINR(financials.totalCollected)}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Pending</p>
                                    <p className="text-2xl font-bold text-amber-600">{formatCurrencyINR(financials.totalPending)}</p>
                                </div>
                            </div>
                            {/* Progress bar */}
                            <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${financials.collectionPercent}%` }}
                                    transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
                                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full"
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-2 text-right">{financials.collectionPercent}% collected</p>
                        </div>
                    </motion.div>
                )}

                {/* All Projects Table */}
                {filteredProjects.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden"
                    >
                        <div className="p-6 pb-2">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                                        <ChartBarSquareIcon className="w-5 h-5 text-violet-600" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900">All Projects</h3>
                                </div>
                                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-medium">
                                    {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}
                                </span>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-t border-b border-gray-100 bg-gray-50/50">
                                        <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Project</th>
                                        <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Organization</th>
                                        <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Stage</th>
                                        <th className="text-right px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Budget</th>
                                        <th className="text-center px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredProjects.map((proj) => {
                                        const org = childOrgs.find(o => o.id === proj.organizationId);
                                        const isActive = ACTIVE_STATUSES.includes(proj.status);
                                        return (
                                            <tr key={proj.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <p className="font-semibold text-gray-900 truncate max-w-[200px]">{proj.clientName || proj.title || 'Unnamed Project'}</p>
                                                </td>
                                                <td className="px-6 py-4 text-gray-600 truncate max-w-[160px]">{org?.name || '—'}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${proj.status === CaseStatus.COMPLETED
                                                            ? 'bg-emerald-100 text-emerald-700'
                                                            : isActive
                                                                ? 'bg-blue-100 text-blue-700'
                                                                : 'bg-gray-100 text-gray-600'
                                                        }`}>
                                                        {STATUS_LABELS[proj.status] || proj.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right font-semibold text-gray-900">
                                                    {proj.financial?.totalBudget ? formatCurrencyINR(proj.financial.totalBudget) : '—'}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button
                                                        onClick={() => setSelectedCaseId(proj.id)}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                                                    >
                                                        View
                                                        <ArrowRightIcon className="w-3 h-3" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}

                {/* Child Organizations */}
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-gray-900">Your Organizations</h3>
                        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-medium">
                            {childOrgs.length} organization{childOrgs.length !== 1 ? 's' : ''}
                        </span>
                    </div>

                    {childOrgs.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200"
                        >
                            <BuildingOfficeIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-400 font-medium">No organizations linked to your account yet.</p>
                        </motion.div>
                    ) : (
                        <motion.div
                            variants={container}
                            initial="hidden"
                            animate="show"
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
                        >
                            {childOrgs.map((org) => {
                                const orgStatus = getOrgStatus(org.id);
                                const projectCount = getOrgProjects(org.id).length;
                                const hasProjects = projectCount > 0;

                                return (
                                    <motion.div
                                        key={org.id}
                                        variants={item}
                                        onClick={() => hasProjects && handleOrgClick(org.id)}
                                        className={`group relative bg-white rounded-2xl border border-gray-100 p-6 shadow-sm transition-all duration-300 ${hasProjects
                                            ? 'hover:shadow-xl hover:border-green-200 hover:-translate-y-1 cursor-pointer'
                                            : 'opacity-80'
                                            }`}
                                    >
                                        {/* Status indicator dot */}
                                        <div className={`absolute top-4 right-4 w-2.5 h-2.5 rounded-full ${orgStatus === 'active' ? 'bg-green-500 animate-pulse' :
                                            orgStatus === 'inactive' ? 'bg-gray-300' :
                                                'bg-gray-200'
                                            }`} />

                                        <div className="flex items-start gap-4 mb-5">
                                            <div className="w-12 h-12 bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:from-green-100 group-hover:to-emerald-200 transition-colors">
                                                <BuildingOfficeIcon className="w-6 h-6 text-green-600" />
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="text-base font-bold text-gray-900 truncate group-hover:text-green-700 transition-colors">
                                                    {org.name}
                                                </h4>
                                                <p className="text-sm text-gray-500 truncate mt-0.5">
                                                    {org.contactPerson || org.address || 'No details'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Project info */}
                                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                            <div className="flex items-center gap-2">
                                                <FolderIcon className="w-4 h-4 text-gray-400" />
                                                <span className="text-sm font-medium text-gray-600">
                                                    {projectCount} project{projectCount !== 1 ? 's' : ''}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {orgStatus === 'active' && (
                                                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-green-100 text-green-700">
                                                        Active
                                                    </span>
                                                )}
                                                {orgStatus === 'inactive' && (
                                                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">
                                                        Completed
                                                    </span>
                                                )}
                                                {hasProjects && (
                                                    <ArrowRightIcon className="w-4 h-4 text-gray-300 group-hover:text-green-500 group-hover:translate-x-1 transition-all" />
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    )}
                </div>

                {/* Footer */}
                <div className="pt-10 border-t border-gray-200 text-center">
                    <p className="text-xs text-gray-400">
                        © {new Date().getFullYear()} Make My Office — Enterprise Client Portal
                    </p>
                </div>
            </main>
        </div>
    );
};

export default B2IParentPortal;
