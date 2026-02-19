import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BuildingOfficeIcon, BuildingLibraryIcon, ChartBarIcon, CurrencyRupeeIcon, ClockIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../../context/AuthContext';
import { db } from '../../../firebase';
import { collection, query, where, onSnapshot, collectionGroup } from 'firebase/firestore';
import { FIRESTORE_COLLECTIONS } from '../../../constants';
import { Organization, Case } from '../../../types';
import { formatCurrencyINR } from '../../../constants';

interface B2IDashboardPageProps {
    currentPage: string;
    setCurrentPage: (page: string) => void;
}

const B2IDashboardPage: React.FC<B2IDashboardPageProps> = ({ currentPage, setCurrentPage }) => {
    const { currentUser } = useAuth();
    const [childOrgs, setChildOrgs] = useState<Organization[]>([]);
    const [cases, setCases] = useState<Case[]>([]);
    const [loadingOrgs, setLoadingOrgs] = useState(true);
    const [loadingCases, setLoadingCases] = useState(true);

    const b2iId = currentUser?.b2iId;

    // Fetch child organizations
    useEffect(() => {
        if (!db || !b2iId) {
            setLoadingOrgs(false);
            return;
        }

        const q = query(
            collection(db, FIRESTORE_COLLECTIONS.ORGANIZATIONS),
            where('b2iParentId', '==', b2iId)
        );

        const unsub = onSnapshot(q, (snap) => {
            const orgs: Organization[] = [];
            snap.forEach((d) => {
                const data = d.data();
                orgs.push({
                    ...data,
                    id: d.id,
                    createdAt: data.createdAt?.toDate?.() ?? new Date(),
                } as Organization);
            });
            setChildOrgs(orgs);
            setLoadingOrgs(false);
        });

        return () => unsub();
    }, [b2iId]);

    // Fetch cases for child orgs
    useEffect(() => {
        if (!db || childOrgs.length === 0) {
            setCases([]);
            setLoadingCases(false);
            return;
        }

        // Never pass undefined to Firestore 'in' — filter out falsy ids
        const orgIds = childOrgs.map(o => o.id).filter((id): id is string => id != null && id !== '');
        if (orgIds.length === 0) {
            setCases([]);
            setLoadingCases(false);
            return;
        }

        // Firestore 'in' queries support up to 30 values — batch if needed
        const batches: string[][] = [];
        for (let i = 0; i < orgIds.length; i += 30) {
            batches.push(orgIds.slice(i, i + 30));
        }

        const allCases: Case[] = [];
        let completed = 0;
        const unsubs: (() => void)[] = [];

        batches.forEach((batch) => {
            const q = query(
                collection(db, FIRESTORE_COLLECTIONS.CASES),
                where('organizationId', 'in', batch)
            );

            const unsub = onSnapshot(q, (snap) => {
                // Clear previous results for this batch
                snap.forEach((d) => {
                    const data = d.data();
                    allCases.push({
                        ...data,
                        id: d.id,
                        createdAt: data.createdAt?.toDate?.() ?? new Date(),
                    } as Case);
                });
                completed++;
                if (completed >= batches.length) {
                    // Deduplicate by ID
                    const uniqueMap = new Map<string, Case>();
                    allCases.forEach(c => uniqueMap.set(c.id, c));
                    setCases(Array.from(uniqueMap.values()));
                    setLoadingCases(false);
                }
            });
            unsubs.push(unsub);
        });

        return () => unsubs.forEach(u => u());
    }, [childOrgs]);

    // Derived stats
    const stats = useMemo(() => {
        const activeProjects = cases.filter(c => c.isProject && c.status !== 'completed');
        const completedProjects = cases.filter(c => c.isProject && c.status === 'completed');
        const totalRevenue = cases.reduce((sum, c) => sum + (c.financial?.totalCollected || 0), 0);
        const totalExpenses = cases.reduce((sum, c) => sum + (c.costCenter?.expenses || 0), 0);

        // Status distribution
        const statusCounts: Record<string, number> = {};
        cases.forEach(c => {
            const s = c.status || 'unknown';
            statusCounts[s] = (statusCounts[s] || 0) + 1;
        });

        return {
            totalOrgs: childOrgs.length,
            activeProjects: activeProjects.length,
            completedProjects: completedProjects.length,
            totalRevenue,
            totalExpenses,
            statusCounts,
            totalCases: cases.length,
        };
    }, [childOrgs, cases]);

    const loading = loadingOrgs || loadingCases;

    // Overview page
    if (currentPage === 'organizations') {
        return (
            <div className="space-y-6 p-6">
                <h1 className="text-2xl font-bold text-text-primary">My Organizations</h1>
                <p className="text-text-secondary">Read-only view of all organizations under your B2I account.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {childOrgs.map(org => {
                        const orgCases = cases.filter(c => c.organizationId === org.id);
                        const activeCount = orgCases.filter(c => c.isProject && c.status !== 'completed').length;
                        const completedCount = orgCases.filter(c => c.isProject && c.status === 'completed').length;

                        return (
                            <motion.div
                                key={org.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-surface rounded-xl shadow-sm border border-border p-6"
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                        <BuildingOfficeIcon className="w-6 h-6 text-primary" />
                                    </div>
                                    <h3 className="text-lg font-bold text-text-primary">{org.name}</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                                        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Active</p>
                                        <p className="text-xl font-bold text-blue-800 dark:text-blue-300">{activeCount}</p>
                                    </div>
                                    <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                                        <p className="text-xs text-green-600 dark:text-green-400 font-medium">Completed</p>
                                        <p className="text-xl font-bold text-green-800 dark:text-green-300">{completedCount}</p>
                                    </div>
                                </div>
                                {org.address && (
                                    <p className="mt-3 text-xs text-text-tertiary line-clamp-1">{org.address}</p>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        );
    }

    // Default: Overview dashboard
    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">B2I Dashboard</h1>
                <p className="text-gray-500 dark:text-gray-400">Aggregated view across all your organizations</p>
            </div>

            {loading ? (
                <div className="text-center py-12 text-text-secondary">Loading dashboard data...</div>
            ) : (
                <>
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <StatCard
                            label="Organizations"
                            value={stats.totalOrgs}
                            icon={<BuildingOfficeIcon className="w-6 h-6" />}
                            color="indigo"
                        />
                        <StatCard
                            label="Total Projects"
                            value={stats.totalCases}
                            icon={<ChartBarIcon className="w-6 h-6" />}
                            color="blue"
                        />
                        <StatCard
                            label="Active Projects"
                            value={stats.activeProjects}
                            icon={<ClockIcon className="w-6 h-6" />}
                            color="amber"
                        />
                        <StatCard
                            label="Completed"
                            value={stats.completedProjects}
                            icon={<CheckCircleIcon className="w-6 h-6" />}
                            color="green"
                        />
                        <StatCard
                            label="Total Revenue"
                            value={formatCurrencyINR(stats.totalRevenue)}
                            icon={<CurrencyRupeeIcon className="w-6 h-6" />}
                            color="emerald"
                            isLarge
                        />
                        <StatCard
                            label="Total Expenses"
                            value={formatCurrencyINR(stats.totalExpenses)}
                            icon={<ExclamationTriangleIcon className="w-6 h-6" />}
                            color="red"
                            isLarge
                        />
                    </div>

                    {/* Project Status Distribution */}
                    <div className="bg-surface rounded-xl shadow-sm border border-border p-6">
                        <h2 className="text-lg font-bold text-text-primary mb-4">Project Status Distribution</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                            {Object.entries(stats.statusCounts).map(([status, count]) => (
                                <div key={status} className="bg-subtle-background rounded-lg p-3 text-center">
                                    <p className="text-xs text-text-secondary capitalize">{status.replace(/_/g, ' ')}</p>
                                    <p className="text-2xl font-bold text-text-primary mt-1">{count}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Organizations Summary */}
                    <div className="bg-surface rounded-xl shadow-sm border border-border p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-text-primary">Organizations Overview</h2>
                            <button
                                onClick={() => setCurrentPage('organizations')}
                                className="text-sm font-medium text-primary hover:text-primary/80"
                            >
                                View All →
                            </button>
                        </div>
                        <div className="space-y-3">
                            {childOrgs.slice(0, 5).map(org => {
                                const orgCaseCount = cases.filter(c => c.organizationId === org.id).length;
                                return (
                                    <div key={org.id} className="flex items-center justify-between p-3 bg-subtle-background rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-primary/10 rounded-lg">
                                                <BuildingOfficeIcon className="w-5 h-5 text-primary" />
                                            </div>
                                            <span className="font-medium text-text-primary">{org.name}</span>
                                        </div>
                                        <span className="text-sm text-text-secondary">{orgCaseCount} projects</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

// Stat card component
const StatCard: React.FC<{
    label: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
    isLarge?: boolean;
}> = ({ label, value, icon, color, isLarge }) => {
    const colorMap: Record<string, string> = {
        indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400',
        blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
        amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
        green: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',
        emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
        red: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
    };

    return (
        <div className="bg-surface rounded-xl shadow-sm border border-border p-4">
            <div className={`p-2 rounded-lg w-fit mb-3 ${colorMap[color] || colorMap.blue}`}>
                {icon}
            </div>
            <p className="text-xs text-text-secondary font-medium">{label}</p>
            <p className={`font-bold text-text-primary mt-1 ${isLarge ? 'text-lg' : 'text-2xl'}`}>{value}</p>
        </div>
    );
};

export default B2IDashboardPage;
