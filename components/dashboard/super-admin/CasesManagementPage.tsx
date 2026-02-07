import React, { useState, useEffect } from 'react';
import { useCases } from '../../../hooks/useCases';
import { useOrganizations } from '../../../hooks/useOrganizations';
import { useApprovalRequests } from '../../../hooks/useApprovalSystem';
import { db } from '../../../firebase';
import { doc, deleteDoc, collection, query, where, getDocs, writeBatch, onSnapshot, orderBy } from 'firebase/firestore';
import { FIRESTORE_COLLECTIONS } from '../../../constants';
import {
    TrashIcon,
    ExclamationTriangleIcon,
    BeakerIcon,
    BuildingOfficeIcon,
    RectangleStackIcon,
    CheckCircleIcon,
    ArrowPathIcon,
    FunnelIcon,
    MagnifyingGlassIcon,
    ShieldCheckIcon,
    ListBulletIcon,
    ClockIcon,
    UserIcon
} from '../../icons/IconComponents';
import { Case, Organization, ApprovalRequest, Task } from '../../../types';
import { formatCurrencyINR, formatDateTime } from '../../../constants';
import { motion, AnimatePresence } from 'framer-motion';

type TabType = 'cases' | 'organizations' | 'approvals' | 'tasks';

const CasesManagementPage: React.FC = () => {
    const { cases, loading: casesLoading } = useCases();
    const { organizations, loading: orgsLoading } = useOrganizations();
    const { requests: approvals, loading: approvalsLoading } = useApprovalRequests();

    const [tasks, setTasks] = useState<Task[]>([]);
    const [tasksLoading, setTasksLoading] = useState(true);

    const [activeTab, setActiveTab] = useState<TabType>('cases');
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [isNuking, setIsNuking] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Selection States
    const [selectedCaseIds, setSelectedCaseIds] = useState<Set<string>>(new Set());
    const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
    const [selectedOrgIds, setSelectedOrgIds] = useState<Set<string>>(new Set());
    const [selectedApprovalIds, setSelectedApprovalIds] = useState<Set<string>>(new Set());

    // Fetch all tasks
    useEffect(() => {
        const q = query(collection(db, 'myDayTasks'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const tasksData: Task[] = [];
            snapshot.forEach((doc) => {
                tasksData.push({ id: doc.id, ...doc.data() } as Task);
            });
            setTasks(tasksData);
            setTasksLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const loading = casesLoading || orgsLoading || approvalsLoading || tasksLoading;

    // Selection Handlers
    const toggleSelection = (id: string, type: TabType) => {
        const updateSet = (prev: Set<string>) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        };

        if (type === 'cases') setSelectedCaseIds(updateSet);
        if (type === 'tasks') setSelectedTaskIds(updateSet);
        if (type === 'organizations') setSelectedOrgIds(updateSet);
        if (type === 'approvals') setSelectedApprovalIds(updateSet);
    };

    const toggleSelectAll = (ids: string[], type: TabType) => {
        const allSelected = ids.every(id => {
            if (type === 'cases') return selectedCaseIds.has(id);
            if (type === 'tasks') return selectedTaskIds.has(id);
            if (type === 'organizations') return selectedOrgIds.has(id);
            if (type === 'approvals') return selectedApprovalIds.has(id);
            return false;
        });

        if (allSelected) {
            if (type === 'cases') setSelectedCaseIds(new Set());
            if (type === 'tasks') setSelectedTaskIds(new Set());
            if (type === 'organizations') setSelectedOrgIds(new Set());
            if (type === 'approvals') setSelectedApprovalIds(new Set());
        } else {
            if (type === 'cases') setSelectedCaseIds(new Set(ids));
            if (type === 'tasks') setSelectedTaskIds(new Set(ids));
            if (type === 'organizations') setSelectedOrgIds(new Set(ids));
            if (type === 'approvals') setSelectedApprovalIds(new Set(ids));
        }
    };

    const performDeleteCase = async (caseItem: Case, batch: any) => {
        // 1. Delete the case document (case-centric: lead/project are the same case; no separate leads/projects collections)
        batch.delete(doc(db, FIRESTORE_COLLECTIONS.CASES, caseItem.id));

        // 2. Delete subcollections of cases
        const subcollections = ['drawings', 'boqs', 'quotations', 'milestones'];
        for (const sub of subcollections) {
            const subSnap = await getDocs(collection(db, FIRESTORE_COLLECTIONS.CASES, caseItem.id, sub));
            subSnap.forEach(sDoc => batch.delete(sDoc.ref));
        }

        // 3. Delete related standalone items
        const tasksQuery = query(collection(db, 'myDayTasks'), where('caseId', '==', caseItem.id));
        const tasksSnap = await getDocs(tasksQuery);
        tasksSnap.forEach(tDoc => batch.delete(tDoc.ref));

        const notificationsQuery = query(collection(db, FIRESTORE_COLLECTIONS.NOTIFICATIONS), where('entity_id', '==', caseItem.id));
        const notificationsSnap = await getDocs(notificationsQuery);
        notificationsSnap.forEach(nDoc => batch.delete(nDoc.ref));

        const activitiesQuery = query(collection(db, FIRESTORE_COLLECTIONS.ACTIVITIES), where('projectId', '==', caseItem.id));
        const activitiesSnap = await getDocs(activitiesQuery);
        activitiesSnap.forEach(aDoc => batch.delete(aDoc.ref));

        const approvalsQuery = query(collection(db, 'approvalRequests'), where('contextId', '==', caseItem.id));
        const approvalsSnap = await getDocs(approvalsQuery);
        approvalsSnap.forEach(aDoc => batch.delete(aDoc.ref));
    };

    const handleDeleteCase = async (caseItem: Case) => {
        if (!window.confirm(`Delete "${caseItem.projectName}"? This will delete all associated data.`)) return;
        setIsDeleting(caseItem.id);
        try {
            const batch = writeBatch(db);
            await performDeleteCase(caseItem, batch);
            await batch.commit();
        } catch (err) {
            console.error(err);
        } finally {
            setIsDeleting(null);
        }
    };

    const handleBulkDeleteCases = async () => {
        const selected = Array.from(selectedCaseIds);
        if (selected.length === 0) return;
        if (!window.confirm(`Delete ${selected.length} selected cases and all their data?`)) return;

        setIsNuking(true);
        try {
            for (const id of selected) {
                const caseItem = cases.find(c => c.id === id);
                if (caseItem) {
                    const batch = writeBatch(db);
                    await performDeleteCase(caseItem, batch);
                    await batch.commit();
                }
            }
            setSelectedCaseIds(new Set());
            alert(`Deleted ${selected.length} cases.`);
        } catch (err) {
            console.error(err);
        } finally {
            setIsNuking(false);
        }
    };

    const handleBulkDeleteTasks = async () => {
        const selected = Array.from(selectedTaskIds);
        if (selected.length === 0) return;
        if (!window.confirm(`Delete ${selected.length} selected tasks?`)) return;

        setIsNuking(true);
        try {
            const batch = writeBatch(db);
            selected.forEach(id => {
                batch.delete(doc(db, 'myDayTasks', id));
            });
            await batch.commit();
            setSelectedTaskIds(new Set());
            alert(`Deleted ${selected.length} tasks.`);
        } catch (err) {
            console.error(err);
        } finally {
            setIsNuking(false);
        }
    };

    const handleDeleteOrg = async (org: Organization) => {
        if (!window.confirm(`Delete organization "${org.name}"?`)) return;
        setIsDeleting(org.id);
        try {
            await deleteDoc(doc(db, FIRESTORE_COLLECTIONS.ORGANIZATIONS, org.id));
        } catch (err) {
            console.error(err);
        } finally {
            setIsDeleting(null);
        }
    };

    const handleDeleteApproval = async (req: ApprovalRequest) => {
        if (!window.confirm(`Delete approval request "${req.title}"?`)) return;
        setIsDeleting(req.id);
        try {
            await deleteDoc(doc(db, 'approvalRequests', req.id));
        } catch (err) {
            console.error(err);
        } finally {
            setIsDeleting(null);
        }
    };

    const handleResetGlobalRedFlags = async () => {
        if (!window.confirm("☢️ EXECUTIVE RESET: This will clear all existing Red Flags from the database and reset all team member performance flags to Green. This action is intended to 'start fresh' as requested. Continue?")) {
            return;
        }

        setIsNuking(true);
        try {
            // 1. Delete all redFlags collection items
            const redFlagsSnap = await getDocs(collection(db, 'redFlags'));
            const batch = writeBatch(db);
            redFlagsSnap.forEach(d => batch.delete(d.ref));
            await batch.commit();

            // 2. Reset all users
            const usersSnap = await getDocs(collection(db, 'staffUsers'));
            const userBatch = writeBatch(db);
            usersSnap.forEach(u => {
                userBatch.update(u.ref, {
                    performanceFlag: 'green',
                    flagReason: null,
                    flagUpdatedAt: new Date()
                });
            });
            await userBatch.commit();

            alert("System Sanitization Complete. All active red flags have been purged and workforce velocity has been reset to Green.");
        } catch (err) {
            console.error("Reset failed:", err);
            alert("Reset failed: " + (err as any).message);
        } finally {
            setIsNuking(false);
        }
    };

    const handleNukeAllDemo = async () => {
        const demoCount =
            cases.filter(c => c.is_demo).length +
            organizations.filter(o => o.is_demo).length +
            approvals.filter(a => (a as any).is_demo).length +
            tasks.filter(t => (t as any).is_demo).length;

        if (demoCount === 0) {
            alert("No demo data found.");
            return;
        }

        if (!window.confirm(`☢️ Bulk delete ${demoCount} demo items?`)) return;

        setIsNuking(true);
        try {
            let totalDeleted = 0;

            // Cases
            for (const c of cases.filter(c => c.is_demo)) {
                const batch = writeBatch(db);
                await performDeleteCase(c, batch);
                await batch.commit();
                totalDeleted++;
            }

            // Orgs
            for (const o of organizations.filter(o => o.is_demo)) {
                await deleteDoc(doc(db, FIRESTORE_COLLECTIONS.ORGANIZATIONS, o.id));
                totalDeleted++;
            }

            // Approvals
            for (const a of approvals.filter(a => (a as any).is_demo)) {
                await deleteDoc(doc(db, 'approvalRequests', a.id));
                totalDeleted++;
            }

            // Tasks
            const demoTasks = tasks.filter(t => (t as any).is_demo);
            const taskBatch = writeBatch(db);
            demoTasks.forEach(t => taskBatch.delete(doc(db, 'myDayTasks', t.id)));
            await taskBatch.commit();
            totalDeleted += demoTasks.length;

            // Chat
            const channelsSnap = await getDocs(query(collection(db, 'chatChannels'), where('is_demo', '==', true)));
            for (const chan of channelsSnap.docs) {
                const msgsSnap = await getDocs(collection(db, 'chatChannels', chan.id, 'chatMessages'));
                msgsSnap.forEach(async (m) => await deleteDoc(m.ref));
                await deleteDoc(chan.ref);
                totalDeleted++;
            }

            alert(`Nuked ${totalDeleted} demo items.`);
        } catch (err) {
            console.error(err);
        } finally {
            setIsNuking(false);
        }
    };

    if (loading && !isNuking) return (
        <div className="p-12 flex flex-col items-center justify-center space-y-4">
            <ArrowPathIcon className="w-10 h-10 text-primary animate-spin" />
            <p className="text-sm font-bold text-text-tertiary uppercase tracking-widest">Scanning Registry...</p>
        </div>
    );

    const filteredCases = cases.filter(c =>
        c.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.clientName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredOrgs = organizations.filter(o =>
        o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.contactPerson.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredApprovals = approvals.filter(a =>
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.requesterName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredTasks = tasks.filter(t =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.assignedToName?.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a, b) => a.title.localeCompare(b.title));

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h1 className="text-4xl font-serif font-black text-text-primary tracking-tighter">System Sanitization</h1>
                    <p className="text-text-tertiary text-sm font-bold uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                        <ShieldCheckIcon className="w-4 h-4 text-primary" />
                        Admin Repository Control & Data Cleanup
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={handleResetGlobalRedFlags}
                        disabled={isNuking}
                        className="bg-accent/10 text-accent hover:bg-accent hover:text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 border border-accent/20 shadow-lg shadow-accent/10 group"
                    >
                        <ExclamationTriangleIcon className="w-4 h-4" />
                        Executive Red Flag Reset
                    </button>
                    <button
                        onClick={handleNukeAllDemo}
                        disabled={isNuking}
                        className="bg-error/10 text-error hover:bg-error hover:text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 border border-error/20 shadow-lg shadow-error/10 group"
                    >
                        {isNuking ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <ExclamationTriangleIcon className="w-4 h-4 group-hover:animate-pulse" />}
                        Bulk Purge Demo Data
                    </button>
                </div>
            </div>

            {/* Navigation & Search */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-surface/50 p-2 rounded-[2rem] border border-border/60 shadow-sm">
                <div className="flex flex-wrap gap-1">
                    {(['cases', 'tasks', 'organizations', 'approvals'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab
                                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                : 'text-text-tertiary hover:bg-subtle-background hover:text-text-primary'
                                }`}
                        >
                            {tab === 'cases' && <RectangleStackIcon className="w-4 h-4 inline-block mr-2 mb-0.5" />}
                            {tab === 'tasks' && <ListBulletIcon className="w-4 h-4 inline-block mr-2 mb-0.5" />}
                            {tab === 'organizations' && <BuildingOfficeIcon className="w-4 h-4 inline-block mr-2 mb-0.5" />}
                            {tab === 'approvals' && <CheckCircleIcon className="w-4 h-4 inline-block mr-2 mb-0.5" />}
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="relative w-full md:w-80 px-2 lg:px-4">
                    <MagnifyingGlassIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                    <input
                        type="text"
                        placeholder="Search registry..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-subtle-background border-none rounded-2xl py-3 pl-10 pr-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-text-tertiary/50"
                    />
                </div>
            </div>

            {/* Bulk Actions Bar */}
            <AnimatePresence>
                {((activeTab === 'cases' && selectedCaseIds.size > 0) ||
                    (activeTab === 'tasks' && selectedTaskIds.size > 0)) && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="bg-error text-white p-4 rounded-3xl flex items-center justify-between shadow-xl shadow-error/20"
                        >
                            <div className="flex items-center gap-4 px-4">
                                <ExclamationTriangleIcon className="w-6 h-6" />
                                <span className="font-black text-xs uppercase tracking-widest">
                                    {activeTab === 'cases' ? selectedCaseIds.size : selectedTaskIds.size} Items Selected for Destruction
                                </span>
                            </div>
                            <button
                                onClick={activeTab === 'cases' ? handleBulkDeleteCases : handleBulkDeleteTasks}
                                className="bg-white text-error px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-error-dark hover:text-white transition-all shadow-lg"
                            >
                                Confirm Purege
                            </button>
                        </motion.div>
                    )}
            </AnimatePresence>

            {/* Content Table */}
            <div className="bg-surface rounded-[2.5rem] border border-border/80 overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-subtle-background/50 border-b border-border">
                                <th className="px-6 py-6 w-12">
                                    <input
                                        type="checkbox"
                                        className="w-5 h-5 rounded-lg border-border text-primary focus:ring-primary/20 transition-all cursor-pointer"
                                        checked={
                                            activeTab === 'cases' ? (filteredCases.length > 0 && Array.from(selectedCaseIds).length === filteredCases.length) :
                                                activeTab === 'tasks' ? (filteredTasks.length > 0 && Array.from(selectedTaskIds).length === filteredTasks.length) : false
                                        }
                                        onChange={() => {
                                            if (activeTab === 'cases') toggleSelectAll(filteredCases.map(c => c.id), 'cases');
                                            if (activeTab === 'tasks') toggleSelectAll(filteredTasks.map(t => t.id), 'tasks');
                                        }}
                                    />
                                </th>
                                <th className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-text-tertiary">Subject Entity</th>
                                <th className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-text-tertiary">Attributes</th>
                                <th className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-text-tertiary">Status / Origin</th>
                                <th className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-text-tertiary text-right">Sanitization</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                            {activeTab === 'cases' && filteredCases.map((c) => (
                                <tr key={c.id} className={`group hover:bg-subtle-background/50 transition-all ${selectedCaseIds.has(c.id) ? 'bg-primary/5' : ''} ${c.is_demo ? 'bg-error/[0.02]' : ''}`}>
                                    <td className="px-6 py-6">
                                        <input
                                            type="checkbox"
                                            className="w-5 h-5 rounded-lg border-border text-primary focus:ring-primary/20 transition-all cursor-pointer"
                                            checked={selectedCaseIds.has(c.id)}
                                            onChange={() => toggleSelection(c.id, 'cases')}
                                        />
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${c.isProject ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'} border border-current/10`}>
                                                {c.is_demo ? <BeakerIcon className="w-6 h-6" /> : <RectangleStackIcon className="w-6 h-6" />}
                                            </div>
                                            <div>
                                                <div className="text-base font-bold text-text-primary group-hover:text-primary transition-colors">{c.projectName}</div>
                                                <div className="text-xs text-text-tertiary font-medium">{c.clientName}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="flex flex-col gap-1">
                                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded w-fit ${c.isProject ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'}`}>
                                                {c.isProject ? 'Reference' : 'Sales Lead'}
                                            </span>
                                            <span className="text-sm font-bold text-text-secondary">
                                                {formatCurrencyINR(c.isProject ? (c.budget || 0) : (c.value || 0))}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="text-sm font-medium text-text-secondary">{c.status}</div>
                                        <div className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider mt-1">{c.source || 'Direct Entry'}</div>
                                    </td>
                                    <td className="px-6 py-6 text-right">
                                        <button
                                            onClick={() => handleDeleteCase(c)}
                                            disabled={isDeleting === c.id}
                                            className="p-3 text-text-tertiary hover:text-error hover:bg-error/10 rounded-2xl transition-all disabled:opacity-50"
                                            title="Permanently Delete Project"
                                        >
                                            {isDeleting === c.id ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : <TrashIcon className="w-5 h-5" />}
                                        </button>
                                    </td>
                                </tr>
                            ))}

                            {activeTab === 'tasks' && filteredTasks.map((t) => (
                                <tr key={t.id} className={`group hover:bg-subtle-background/50 transition-all ${selectedTaskIds.has(t.id) ? 'bg-primary/5' : ''} ${(t as any).is_demo ? 'bg-error/[0.02]' : ''}`}>
                                    <td className="px-6 py-6">
                                        <input
                                            type="checkbox"
                                            className="w-5 h-5 rounded-lg border-border text-primary focus:ring-primary/20 transition-all cursor-pointer"
                                            checked={selectedTaskIds.has(t.id)}
                                            onChange={() => toggleSelection(t.id, 'tasks')}
                                        />
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-secondary/5 text-secondary flex items-center justify-center border border-secondary/10">
                                                <ListBulletIcon className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <div className="text-base font-bold text-text-primary group-hover:text-secondary transition-colors line-clamp-1">{t.title}</div>
                                                <div className="text-xs text-text-tertiary font-medium line-clamp-1">{t.targetName || 'General Task'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2 text-xs font-bold text-text-secondary">
                                                <UserIcon className="w-3 h-3" />
                                                {t.assignedToName || 'Unassigned'}
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] text-text-tertiary uppercase tracking-wider">
                                                <ClockIcon className="w-3 h-3" />
                                                Due: {t.deadline ? formatDateTime(t.deadline) : 'No Deadline'}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${t.status === 'Completed' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                                            }`}>
                                            {t.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-6 text-right">
                                        <button
                                            onClick={async () => {
                                                if (window.confirm(`Delete Task: ${t.title}?`)) {
                                                    await deleteDoc(doc(db, 'myDayTasks', t.id));
                                                }
                                            }}
                                            className="p-3 text-text-tertiary hover:text-error hover:bg-error/10 rounded-2xl transition-all"
                                        >
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}

                            {activeTab === 'organizations' && filteredOrgs.map((o) => (
                                <tr key={o.id} className={`group hover:bg-subtle-background/50 transition-all ${o.is_demo ? 'bg-error/[0.02]' : ''}`}>
                                    <td className="px-6 py-6"></td>
                                    <td className="px-6 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-primary/5 text-primary flex items-center justify-center border border-primary/10">
                                                {o.is_demo ? <BeakerIcon className="w-6 h-6" /> : <BuildingOfficeIcon className="w-6 h-6" />}
                                            </div>
                                            <div>
                                                <div className="text-base font-bold text-text-primary group-hover:text-primary transition-colors">{o.name}</div>
                                                <div className="text-xs text-text-tertiary font-medium">{o.contactPerson}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="text-sm font-bold text-text-secondary">{o.projects?.length || 0} Projects Linked</div>
                                        <div className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider">{o.contactEmail}</div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="text-sm font-medium text-text-secondary">{o.address || 'No Address'}</div>
                                        <div className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider mt-1">Created: {formatDateTime(o.createdAt)}</div>
                                    </td>
                                    <td className="px-6 py-6 text-right">
                                        <button
                                            onClick={() => handleDeleteOrg(o)}
                                            disabled={isDeleting === o.id}
                                            className="p-3 text-text-tertiary hover:text-error hover:bg-error/10 rounded-2xl transition-all disabled:opacity-50"
                                            title="Delete Organization"
                                        >
                                            {isDeleting === o.id ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : <TrashIcon className="w-5 h-5" />}
                                        </button>
                                    </td>
                                </tr>
                            ))}

                            {activeTab === 'approvals' && filteredApprovals.map((a) => (
                                <tr key={a.id} className={`group hover:bg-subtle-background/50 transition-all ${(a as any).is_demo ? 'bg-error/[0.02]' : ''}`}>
                                    <td className="px-6 py-6"></td>
                                    <td className="px-6 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-accent/5 text-accent flex items-center justify-center border border-accent/10">
                                                {(a as any).is_demo ? <BeakerIcon className="w-6 h-6" /> : <CheckCircleIcon className="w-6 h-6" />}
                                            </div>
                                            <div>
                                                <div className="text-base font-bold text-text-primary group-hover:text-accent transition-colors">{a.title}</div>
                                                <div className="text-xs text-text-tertiary font-medium">{a.requestType}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="text-sm font-bold text-text-secondary">{a.requesterName}</div>
                                        <div className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider underline">{a.priority} Priority</div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="text-sm font-medium text-text-secondary">{a.status}</div>
                                        <div className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider mt-1">{formatDateTime(a.requestedAt)}</div>
                                    </td>
                                    <td className="px-6 py-6 text-right">
                                        <button
                                            onClick={() => handleDeleteApproval(a)}
                                            disabled={isDeleting === a.id}
                                            className="p-3 text-text-tertiary hover:text-error hover:bg-error/10 rounded-2xl transition-all disabled:opacity-50"
                                            title="Delete Request"
                                        >
                                            {isDeleting === a.id ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : <TrashIcon className="w-5 h-5" />}
                                        </button>
                                    </td>
                                </tr>
                            ))}

                            {!loading && (
                                (activeTab === 'cases' && filteredCases.length === 0) ||
                                (activeTab === 'tasks' && filteredTasks.length === 0) ||
                                (activeTab === 'organizations' && filteredOrgs.length === 0) ||
                                (activeTab === 'approvals' && filteredApprovals.length === 0)
                            ) && (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <FunnelIcon className="w-12 h-12 text-text-tertiary opacity-10" />
                                                <p className="text-lg font-serif italic text-text-tertiary">"No matching entities found in the vault."</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Empty States & Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="p-6 bg-surface rounded-[2rem] border border-border/60 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-tertiary mb-1">Lead & Project Registry</p>
                    <p className="text-2xl font-black text-text-primary">{cases.length} <span className="text-sm font-bold text-text-tertiary ml-1">Entries</span></p>
                </div>
                <div className="p-6 bg-surface rounded-[2rem] border border-border/60 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-tertiary mb-1">Operational Tasks</p>
                    <p className="text-2xl font-black text-text-primary">{tasks.length} <span className="text-sm font-bold text-text-tertiary ml-1">Assigned</span></p>
                </div>
                <div className="p-6 bg-surface rounded-[2rem] border border-border/60 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-tertiary mb-1">Strategic Organizations</p>
                    <p className="text-2xl font-black text-text-primary">{organizations.length} <span className="text-sm font-bold text-text-tertiary ml-1">Partners</span></p>
                </div>
                <div className="p-6 bg-surface rounded-[2rem] border border-border/60 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-tertiary mb-1">Operational Requests</p>
                    <p className="text-2xl font-black text-text-primary">{approvals.length} <span className="text-sm font-bold text-text-tertiary ml-1">Protocols</span></p>
                </div>
            </div>
        </div>
    );
};

export default CasesManagementPage;
