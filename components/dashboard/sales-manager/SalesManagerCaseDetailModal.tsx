/**
 * SalesManagerCaseDetailModal
 *
 * Correct modal for Sales Manager project/lead detail.
 * Reads LIVE from cases/{caseId} via onSnapshot.
 * Maps correct Case fields — no Lead type confusion, no || 0 fallbacks.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    XMarkIcon,
    UserCircleIcon,
    CalendarIcon,
    PhoneIcon,
    EnvelopeIcon,
    MapPinIcon,
    CurrencyRupeeIcon,
    ClockIcon,
    ExclamationTriangleIcon,
    TagIcon,
    ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { doc, onSnapshot, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase';
import { FIRESTORE_COLLECTIONS } from '../../../constants';
import { formatCurrencyINR, safeDate, safeDateTime } from '../../../constants';
import { Case, CaseStatus } from '../../../types';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Activity {
    id: string;
    action: string;
    type?: string;
    userName?: string;
    userId?: string;
    by?: string;
    timestamp?: any;
    createdAt?: any;
}

interface Props {
    caseId: string | null;
    isOpen: boolean;
    onClose: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const safeNum = (v: unknown): number | null => {
    if (v == null) return null;
    const n = Number(v);
    return isNaN(n) ? null : n;
};

const displayVal = (v: unknown): string => {
    if (v == null || v === '' || v === 0) return '—';
    return String(v);
};

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
    [CaseStatus.LEAD]: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Lead' },
    [CaseStatus.SITE_VISIT]: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Site Visit' },
    [CaseStatus.DRAWING]: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Drawing' },
    [CaseStatus.BOQ]: { bg: 'bg-indigo-100', text: 'text-indigo-800', label: 'BOQ' },
    [CaseStatus.QUOTATION]: { bg: 'bg-teal-100', text: 'text-teal-800', label: 'Quotation' },
    [CaseStatus.NEGOTIATION]: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Negotiation' },
    [CaseStatus.WAITING_FOR_PAYMENT]: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Awaiting Payment' },
    [CaseStatus.WAITING_FOR_PLANNING]: { bg: 'bg-cyan-100', text: 'text-cyan-800', label: 'Planning' },
    [CaseStatus.EXECUTION_ACTIVE]: { bg: 'bg-green-100', text: 'text-green-800', label: 'Execution Active' },
    [CaseStatus.COMPLETED]: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Completed' },
};

function StatusBadge({ status }: { status: string }) {
    const cfg = STATUS_CONFIG[status] ?? { bg: 'bg-slate-100', text: 'text-slate-600', label: status };
    return (
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${cfg.bg} ${cfg.text}`}>
            {cfg.label || status}
        </span>
    );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionTitle({ icon: Icon, children }: { icon: React.FC<any>; children: React.ReactNode }) {
    return (
        <div className="flex items-center gap-2 mb-4">
            <Icon className="w-4 h-4 text-primary" />
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">{children}</h4>
        </div>
    );
}

// ─── Info Row ─────────────────────────────────────────────────────────────────
function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
    return (
        <div className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
            <span className="text-xs text-slate-400 font-medium">{label}</span>
            <span className={`text-sm font-semibold ${highlight ? 'text-primary' : 'text-slate-800'} text-right max-w-[200px] truncate`}>
                {value}
            </span>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
const SalesManagerCaseDetailModal: React.FC<Props> = ({ caseId, isOpen, onClose }) => {
    const [caseData, setCaseData] = useState<Case | null>(null);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(false);

    // Live case listener
    useEffect(() => {
        if (!isOpen || !caseId || !db) {
            setCaseData(null);
            setActivities([]);
            return;
        }

        console.log('[SalesManagerCaseDetailModal] Fetching caseId:', caseId);
        setLoading(true);

        const caseRef = doc(db, FIRESTORE_COLLECTIONS.CASES, caseId);
        const unsubCase = onSnapshot(caseRef, (snap) => {
            if (snap.exists()) {
                const data = { id: snap.id, ...snap.data() } as Case;
                console.log('[SalesManagerCaseDetailModal] Fetched caseData:', data);
                setCaseData(data);
            } else {
                console.warn('[SalesManagerCaseDetailModal] Case document not found:', caseId);
                setCaseData(null);
            }
            setLoading(false);
        }, (err) => {
            console.error('[SalesManagerCaseDetailModal] Error fetching case:', err);
            setLoading(false);
        });

        // Fetch recent activities
        const activitiesRef = collection(db, FIRESTORE_COLLECTIONS.CASES, caseId, FIRESTORE_COLLECTIONS.ACTIVITIES);
        const actQuery = query(activitiesRef, orderBy('timestamp', 'desc'), limit(10));
        getDocs(actQuery).then((snap) => {
            setActivities(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Activity)));
        }).catch(() => {
            // Activities optional — don't block render
        });

        return () => unsubCase();
    }, [caseId, isOpen]);

    const c = caseData;

    // Derived values — safe, no || 0
    const leadValue = safeNum(c?.leadValue);
    const projectValue = safeNum(c?.projectValue);
    const budget = safeNum(c?.financial?.totalBudget);
    const collected = safeNum(c?.financial?.totalCollected);
    const expenses = safeNum(c?.financial?.totalExpenses);
    const pending = safeNum(c?.financial?.totalPending);

    const getActivityTime = (act: Activity): string => {
        const ts = act.timestamp || act.createdAt;
        return ts ? safeDateTime(ts) : '—';
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 16 }}
                        transition={{ duration: 0.22 }}
                        className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col z-10"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-5 flex-shrink-0">
                            <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                    {loading ? (
                                        <div className="flex items-center gap-2 text-white/60 text-sm">
                                            <ArrowPathIcon className="w-4 h-4 animate-spin" />
                                            Loading...
                                        </div>
                                    ) : (
                                        <>
                                            <h2 className="text-lg font-black text-white truncate">
                                                {c?.title || c?.projectName || '—'}
                                            </h2>
                                            <p className="text-sm text-white/60 mt-0.5 truncate">
                                                {c?.clientName || '—'}
                                            </p>
                                        </>
                                    )}
                                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                                        {c?.status && <StatusBadge status={c.status} />}
                                        {c?.isProject && (
                                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                                                Project
                                            </span>
                                        )}
                                        {c?.leadType && (
                                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300">
                                                {c.leadType}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="ml-4 p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
                                >
                                    <XMarkIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="overflow-y-auto flex-1 p-6 space-y-6">
                            {loading && !c ? (
                                <div className="flex justify-center py-16">
                                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
                                </div>
                            ) : !c ? (
                                <div className="text-center py-16">
                                    <ExclamationTriangleIcon className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                                    <p className="text-slate-500 font-medium">Case not found or access denied.</p>
                                    <p className="text-xs text-slate-400 mt-1">ID: {caseId}</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* LEFT COLUMN */}
                                    <div className="space-y-6">

                                        {/* Financials */}
                                        <div className="bg-slate-50 rounded-2xl p-5">
                                            <SectionTitle icon={CurrencyRupeeIcon}>Financial</SectionTitle>
                                            <div className="space-y-1">
                                                <InfoRow
                                                    label="Lead Value"
                                                    value={leadValue != null ? formatCurrencyINR(leadValue) : '—'}
                                                    highlight={leadValue != null}
                                                />
                                                <InfoRow
                                                    label="Project Value"
                                                    value={projectValue != null ? formatCurrencyINR(projectValue) : '—'}
                                                    highlight={projectValue != null}
                                                />
                                                <InfoRow
                                                    label="Approved Budget"
                                                    value={budget != null ? formatCurrencyINR(budget) : '—'}
                                                />
                                                <InfoRow
                                                    label="Collected"
                                                    value={collected != null ? formatCurrencyINR(collected) : '—'}
                                                />
                                                <InfoRow
                                                    label="Expenses"
                                                    value={expenses != null ? formatCurrencyINR(expenses) : '—'}
                                                />
                                                <InfoRow
                                                    label="Pending"
                                                    value={pending != null ? formatCurrencyINR(pending) : '—'}
                                                />
                                            </div>

                                            {/* Payment Schedule */}
                                            {(c.financial?.installmentSchedule?.length ?? 0) > 0 && (
                                                <div className="mt-4 pt-4 border-t border-slate-200">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
                                                        Payment Schedule
                                                    </p>
                                                    <div className="space-y-2">
                                                        {c.financial!.installmentSchedule!.map((inst, i) => (
                                                            <div key={i} className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    <div className={`w-2 h-2 rounded-full ${inst.status === 'Paid' ? 'bg-emerald-500' : inst.status === 'Overdue' ? 'bg-red-500' : 'bg-slate-300'}`} />
                                                                    <span className="text-xs text-slate-600 truncate max-w-[120px]">{inst.milestoneName}</span>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-xs font-bold text-slate-700">{formatCurrencyINR(inst.amount)}</p>
                                                                    <p className={`text-[9px] font-bold uppercase ${inst.status === 'Paid' ? 'text-emerald-600' : inst.status === 'Overdue' ? 'text-red-600' : 'text-slate-400'}`}>
                                                                        {inst.status}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Assignment */}
                                        <div className="bg-slate-50 rounded-2xl p-5">
                                            <SectionTitle icon={UserCircleIcon}>Assignment</SectionTitle>
                                            <div className="space-y-1">
                                                <InfoRow label="Sales Owner" value={displayVal(c.assignedSales)} />
                                                <InfoRow label="Project Head" value={displayVal(c.projectHeadId)} />
                                                <InfoRow label="Created By" value={displayVal(c.createdBy)} />
                                                <InfoRow label="Priority" value={displayVal(c.priority)} />
                                            </div>
                                        </div>

                                        {/* Timeline */}
                                        <div className="bg-slate-50 rounded-2xl p-5">
                                            <SectionTitle icon={CalendarIcon}>Timeline</SectionTitle>
                                            <div className="space-y-1">
                                                <InfoRow label="Created" value={safeDate(c.createdAt)} />
                                                <InfoRow label="Updated" value={safeDate(c.updatedAt)} />
                                                {(c as any).startDate && (
                                                    <InfoRow label="Start Date" value={safeDate((c as any).startDate)} />
                                                )}
                                                {(c as any).endDate && (
                                                    <InfoRow label="End Date" value={safeDate((c as any).endDate)} />
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* RIGHT COLUMN */}
                                    <div className="space-y-6">

                                        {/* Contact */}
                                        <div className="bg-slate-50 rounded-2xl p-5">
                                            <SectionTitle icon={PhoneIcon}>Contact Information</SectionTitle>
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                                                        <PhoneIcon className="w-4 h-4 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-slate-400">Phone</p>
                                                        <p className="text-sm font-semibold text-slate-700">{displayVal(c.clientPhone)}</p>
                                                    </div>
                                                </div>
                                                {c.clientEmail && (
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                                                            <EnvelopeIcon className="w-4 h-4 text-purple-600" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] text-slate-400">Email</p>
                                                            <p className="text-sm font-semibold text-slate-700 break-all">{c.clientEmail}</p>
                                                        </div>
                                                    </div>
                                                )}
                                                {c.siteAddress && (
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                            <MapPinIcon className="w-4 h-4 text-green-600" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] text-slate-400">Site Address</p>
                                                            <p className="text-sm font-semibold text-slate-700 leading-snug">{c.siteAddress}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Case Details */}
                                        <div className="bg-slate-50 rounded-2xl p-5">
                                            <SectionTitle icon={TagIcon}>Case Details</SectionTitle>
                                            <div className="space-y-1">
                                                <InfoRow label="Case ID" value={c.id} />
                                                <InfoRow label="Type" value={c.isProject ? 'Project' : 'Lead'} />
                                                <InfoRow label="Lead Type" value={displayVal(c.leadType)} />
                                                <InfoRow label="Organization" value={displayVal(c.organizationId)} />
                                                {c.quotationStatus && (
                                                    <InfoRow label="Quotation Status" value={c.quotationStatus} />
                                                )}
                                            </div>
                                        </div>

                                        {/* Recent Activity */}
                                        <div className="bg-slate-50 rounded-2xl p-5">
                                            <SectionTitle icon={ClockIcon}>Recent Activity</SectionTitle>
                                            {activities.length === 0 ? (
                                                <p className="text-xs text-slate-400 text-center py-4">No activity logged yet.</p>
                                            ) : (
                                                <div className="space-y-3">
                                                    {activities.slice(0, 5).map((act) => (
                                                        <div key={act.id} className="flex items-start gap-2">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-xs font-semibold text-slate-700 leading-snug">{act.action || '—'}</p>
                                                                <p className="text-[10px] text-slate-400 mt-0.5">
                                                                    {act.userName || act.by || 'System'} · {getActivityTime(act)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex-shrink-0 px-6 py-4 border-t border-slate-100 flex justify-between items-center bg-slate-50">
                            <p className="text-[10px] text-slate-400 font-mono">
                                {caseId ?? '—'}
                            </p>
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-5 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default SalesManagerCaseDetailModal;
