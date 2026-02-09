import React, { useState, useEffect, useMemo } from 'react';
import { doc, getDoc, updateDoc, collection, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase';
import { Case, CaseStatus, UserRole } from '../../../types';
import { FIRESTORE_COLLECTIONS, formatCurrencyINR, formatDate } from '../../../constants';
import { useCatalog } from '../../../hooks/useCatalog';
import { useVendors } from '../../../hooks/useVendors';
import { useAuth } from '../../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CalendarIcon,
    DocumentTextIcon,
    CurrencyRupeeIcon,
    CubeIcon,
    TruckIcon,
    CheckCircleIcon,
    XCircleIcon,
    ArrowDownTrayIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    ClipboardDocumentListIcon,
    UserGroupIcon,
    LockClosedIcon,
    DocumentArrowDownIcon,
} from '@heroicons/react/24/outline';

interface Props {
    caseId: string | null;
    isClientView?: boolean;
}

interface PaymentMilestone {
    id: string;
    title: string;
    amount: number;
    duePhase: string;
    completed?: boolean;
}

interface MaterialScheduleItem {
    id: string;
    catalogItemId: string;
    name: string;
    quantity: number;
    unit: string;
    deliveryDate: string;
    phaseId: string;
}

interface VendorAssignment {
    phaseId: string;
    vendorId: string;
    vendorName?: string;
}

interface ProjectDocument {
    id: string;
    name: string;
    type: 'BOQ' | '2D_DRAWING' | '3D_DRAWING' | 'QUOTATION' | 'OTHER';
    url: string;
    uploadedAt: any;
}

const ExecutionProjectPlanningPanel: React.FC<Props> = ({ caseId, isClientView = false }) => {
    const { currentUser } = useAuth();
    const { items: catalogItems } = useCatalog();

    const [caseData, setCaseData] = useState<Case | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeSection, setActiveSection] = useState<string | null>('budget');

    // Planning state
    const [paymentMilestones, setPaymentMilestones] = useState<PaymentMilestone[]>([]);
    const [materialSchedule, setMaterialSchedule] = useState<MaterialScheduleItem[]>([]);
    const [vendorAssignments, setVendorAssignments] = useState<VendorAssignment[]>([]);
    const [documents, setDocuments] = useState<ProjectDocument[]>([]);

    // Org vendors
    const { vendors } = useVendors(caseData?.organizationId);

    useEffect(() => {
        if (!caseId) {
            setLoading(false);
            return;
        }
        fetchData();
    }, [caseId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const caseRef = doc(db, FIRESTORE_COLLECTIONS.CASES, caseId!);
            const caseSnap = await getDoc(caseRef);

            if (caseSnap.exists()) {
                const data = { id: caseSnap.id, ...caseSnap.data() } as Case;
                setCaseData(data);

                // Load execution plan data
                if (data.executionPlan) {
                    const plan = data.executionPlan as any;
                    setPaymentMilestones(plan.paymentMilestones || []);
                    setMaterialSchedule(plan.materialSchedule || []);
                    setVendorAssignments(plan.vendorAssignments || []);
                }

                // Load documents
                const docsRef = collection(db, FIRESTORE_COLLECTIONS.CASES, caseId!, 'documents');
                const docsSnap = await getDocs(docsRef);
                setDocuments(docsSnap.docs.map(d => ({ id: d.id, ...d.data() } as ProjectDocument)));
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Computed values
    const executionPlan = caseData?.executionPlan as any;
    const totalBudget = executionPlan?.totalBudget || executionPlan?.phases?.reduce((sum: number, p: any) => sum + (p.estimatedCost || 0), 0) || 0;
    const advanceReceived = caseData?.financial?.advanceAmount || 0;
    const remainingAmount = totalBudget - advanceReceived;

    // Visibility check: show for planning and execution states (include new statuses)
    const isVisible = caseData?.isProject &&
        (caseData?.status === CaseStatus.WAITING_FOR_PLANNING ||
            caseData?.status === CaseStatus.PLANNING_IN_PROGRESS ||
            caseData?.status === CaseStatus.ACTIVE ||
            caseData?.status === CaseStatus.EXECUTION_ACTIVE ||
            caseData?.status === CaseStatus.COMPLETED);

    // Approval state
    const approvals = executionPlan?.approvals || { projectHead: false, admin: false, client: false };
    const allApproved = approvals.projectHead && approvals.admin && approvals.client;

    // BOQ items
    const boqItems = useMemo(() => {
        if (!executionPlan?.phases) return [];
        const items: any[] = [];
        executionPlan.phases.forEach((phase: any) => {
            (phase.materials || []).forEach((m: any) => {
                items.push({
                    name: m.name,
                    quantity: m.quantity,
                    unit: m.unit,
                    price: m.unitPrice || m.estimatedCost / (m.quantity || 1),
                    total: m.totalCost || m.estimatedCost || 0,
                    phase: phase.name,
                });
            });
        });
        return items;
    }, [executionPlan]);

    const handleSave = async () => {
        if (!caseId || !caseData) return;
        setSaving(true);
        try {
            const caseRef = doc(db, FIRESTORE_COLLECTIONS.CASES, caseId);
            await updateDoc(caseRef, {
                'executionPlan.paymentMilestones': paymentMilestones,
                'executionPlan.materialSchedule': materialSchedule,
                'executionPlan.vendorAssignments': vendorAssignments,
                updatedAt: serverTimestamp(),
            });
            console.log('✅ Execution plan saved');
        } catch (error) {
            console.error('Error saving:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleApprovalToggle = async (role: 'projectHead' | 'admin' | 'client') => {
        // For client view, allow toggle without currentUser check (or check clientUser if passed - assuming authorized by parent)
        if (!caseId) return;
        if (!isClientView && !currentUser) return;

        // Restriction: Client can only toggle client approval
        if (isClientView && role !== 'client') return;

        // Restriction: Staff can only toggle their role (Project Head or Admin)
        if (!isClientView) {
            if (role === 'client') return; // Staff cannot toggle client approval
            if (role === 'admin' && currentUser?.role !== UserRole.SUPER_ADMIN) return;
        }

        const newApprovals = {
            ...approvals,
            [role]: !approvals[role],
            [`${role}At`]: !approvals[role] ? new Date() : null,
            [`${role}By`]: !approvals[role] ? (isClientView ? 'client' : currentUser?.id) : null,
        };

        try {
            const caseRef = doc(db, FIRESTORE_COLLECTIONS.CASES, caseId);
            await updateDoc(caseRef, {
                'executionPlan.approvals': newApprovals,
                updatedAt: serverTimestamp(),
            });

            // When both admin and client approve → execution active (no projectHead in new spec)
            if (newApprovals.admin && newApprovals.client) {
                await updateDoc(caseRef, {
                    status: CaseStatus.EXECUTION_ACTIVE,
                    'executionPlan.locked': true,
                    ...(totalBudget > 0 && {
                        'costCenter.totalBudget': totalBudget,
                        'costCenter.remainingAmount': totalBudget,
                        'costCenter.spentAmount': 0,
                    }),
                });
                console.log('✅ Execution active!');
            }

            fetchData();
        } catch (error) {
            console.error('Error updating approval:', error);
        }
    };

    const addPaymentMilestone = () => {
        setPaymentMilestones([...paymentMilestones, {
            id: Date.now().toString(),
            title: '',
            amount: 0,
            duePhase: executionPlan?.phases?.[0]?.id || '',
        }]);
    };

    const addMaterialScheduleItem = () => {
        setMaterialSchedule([...materialSchedule, {
            id: Date.now().toString(),
            catalogItemId: '',
            name: '',
            quantity: 1,
            unit: 'Nos',
            deliveryDate: '',
            phaseId: executionPlan?.phases?.[0]?.id || '',
        }]);
    };

    const SectionHeader = ({ title, icon: Icon, section }: { title: string; icon: any; section: string }) => (
        <button
            onClick={() => setActiveSection(activeSection === section ? null : section)}
            className="w-full flex items-center justify-between p-4 bg-surface border border-border rounded-xl hover:bg-background transition-colors"
        >
            <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                    <Icon className="w-5 h-5 text-primary" />
                </div>
                <span className="font-bold text-text-primary">{title}</span>
            </div>
            {activeSection === section ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
        </button>
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!caseId || !caseData) {
        return (
            <div className="p-6 bg-surface border border-border rounded-xl text-center">
                <p className="text-text-secondary">Select a project to view planning details</p>
            </div>
        );
    }

    if (!isVisible) {
        if (isClientView) return null; // Don't show lock message to clients, just hide
        return (
            <div className="p-6 bg-surface border border-border rounded-xl text-center">
                <LockClosedIcon className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
                <p className="text-text-secondary">Planning panel is only available for projects in WAITING_FOR_PLANNING or ACTIVE status</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* 1. HEADER */}
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold text-text-primary">{caseData.title}</h2>
                        <p className="text-text-secondary mt-1">{caseData.clientName}</p>
                        <div className="flex items-center gap-4 mt-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${caseData.status === CaseStatus.ACTIVE ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                {caseData.status}
                            </span>
                            {executionPlan?.startDate && (
                                <span className="flex items-center gap-1 text-sm text-text-secondary">
                                    <CalendarIcon className="w-4 h-4" />
                                    {formatDate(executionPlan.startDate)} → {formatDate(executionPlan.endDate)}
                                </span>
                            )}
                        </div>
                    </div>
                    {executionPlan?.locked && (
                        <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1 rounded-full">
                            <LockClosedIcon className="w-4 h-4" />
                            <span className="text-xs font-bold">LOCKED</span>
                        </div>
                    )}
                </div>
            </div>

            {/* 2. TOTAL BUDGET CARD - Hidden for Client */}
            {!isClientView && (
                <div className="bg-surface border border-border rounded-xl p-6">
                    <h3 className="font-bold text-lg text-text-primary mb-4 flex items-center gap-2">
                        <CurrencyRupeeIcon className="w-5 h-5 text-primary" />
                        Budget Overview
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 bg-primary/5 rounded-xl text-center">
                            <p className="text-xs text-text-tertiary uppercase tracking-wide">Total Budget</p>
                            <p className="text-2xl font-bold text-primary mt-1">{formatCurrencyINR(totalBudget)}</p>
                        </div>
                        <div className="p-4 bg-green-50 rounded-xl text-center">
                            <p className="text-xs text-text-tertiary uppercase tracking-wide">Advance Received</p>
                            <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrencyINR(advanceReceived)}</p>
                        </div>
                        <div className="p-4 bg-orange-50 rounded-xl text-center">
                            <p className="text-xs text-text-tertiary uppercase tracking-wide">Remaining</p>
                            <p className="text-2xl font-bold text-orange-600 mt-1">{formatCurrencyINR(remainingAmount)}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* 3. PAYMENT MILESTONES */}
            <div>
                <SectionHeader title="Payment Milestones" icon={ClipboardDocumentListIcon} section="milestones" />
                <AnimatePresence>
                    {activeSection === 'milestones' && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                            <div className="p-4 bg-background border border-t-0 border-border rounded-b-xl space-y-3">
                                {paymentMilestones.map((milestone, idx) => (
                                    <div key={milestone.id} className="flex items-center gap-3 p-3 bg-surface rounded-lg">
                                        <span className="text-xs text-text-tertiary w-6">{idx + 1}.</span>
                                        {isClientView ? (
                                            <>
                                                <span className="flex-1 text-sm font-medium text-text-primary">{milestone.title}</span>
                                                <span className="w-32 text-sm text-right font-medium text-text-primary">{formatCurrencyINR(milestone.amount)}</span>
                                                <span className="w-40 text-sm text-text-tertiary">{executionPlan?.phases?.find((p: any) => p.id === milestone.duePhase)?.name || 'N/A'}</span>
                                            </>
                                        ) : (
                                            <>
                                                <input
                                                    type="text"
                                                    placeholder="Milestone title"
                                                    value={milestone.title}
                                                    onChange={(e) => {
                                                        const updated = [...paymentMilestones];
                                                        updated[idx].title = e.target.value;
                                                        setPaymentMilestones(updated);
                                                    }}
                                                    className="flex-1 p-2 border border-border rounded-lg text-sm"
                                                />
                                                <input
                                                    type="number"
                                                    placeholder="Amount"
                                                    value={milestone.amount || ''}
                                                    onChange={(e) => {
                                                        const updated = [...paymentMilestones];
                                                        updated[idx].amount = parseFloat(e.target.value) || 0;
                                                        setPaymentMilestones(updated);
                                                    }}
                                                    className="w-32 p-2 border border-border rounded-lg text-sm"
                                                />
                                                <select
                                                    value={milestone.duePhase}
                                                    onChange={(e) => {
                                                        const updated = [...paymentMilestones];
                                                        updated[idx].duePhase = e.target.value;
                                                        setPaymentMilestones(updated);
                                                    }}
                                                    className="w-40 p-2 border border-border rounded-lg text-sm"
                                                >
                                                    {executionPlan?.phases?.map((p: any) => (
                                                        <option key={p.id} value={p.id}>{p.name}</option>
                                                    ))}
                                                </select>
                                                <button
                                                    onClick={() => setPaymentMilestones(paymentMilestones.filter((_, i) => i !== idx))}
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    <XCircleIcon className="w-5 h-5" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                ))}
                                {!isClientView && (
                                    <button onClick={addPaymentMilestone} className="text-sm text-primary font-semibold">+ Add Milestone</button>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* 4. TIMELINE - Visible to Client */}
            <div>
                <SectionHeader title="Project Timeline" icon={CalendarIcon} section="timeline" />
                <AnimatePresence>
                    {activeSection === 'timeline' && executionPlan?.phases && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                            <div className="p-4 bg-background border border-t-0 border-border rounded-b-xl">
                                <div className="relative">
                                    {/* Gantt-style bars */}
                                    <div className="space-y-2">
                                        {executionPlan.phases.map((phase: any, idx: number) => {
                                            const startDate = new Date(phase.startDate);
                                            const endDate = new Date(phase.endDate);
                                            const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

                                            return (
                                                <div key={phase.id} className="flex items-center gap-4">
                                                    <span className="w-32 text-sm font-medium text-text-primary truncate">{phase.name}</span>
                                                    <div className="flex-1 bg-gray-100 rounded-full h-6 relative">
                                                        <div
                                                            className="absolute h-full rounded-full bg-gradient-to-r from-primary to-primary/70 flex items-center justify-center"
                                                            style={{ width: `${Math.min(100, Math.max(10, duration * 3))}%` }}
                                                        >
                                                            <span className="text-xs text-white font-medium">{duration}d</span>
                                                        </div>
                                                    </div>
                                                    <span className="text-xs text-text-tertiary w-24">{formatDate(phase.startDate)}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* 5. DOCUMENT CENTER - Visible to Client */}
            <div>
                <SectionHeader title="Project Documents" icon={DocumentTextIcon} section="documents" />
                <AnimatePresence>
                    {activeSection === 'documents' && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                            <div className="p-4 bg-background border border-t-0 border-border rounded-b-xl">
                                <div className="grid grid-cols-4 gap-4">
                                    {['BOQ', '2D_DRAWING', '3D_DRAWING', 'QUOTATION'].map((docType) => {
                                        const docItem = documents.find(d => d.type === docType);
                                        return (
                                            <div key={docType} className={`p-4 rounded-xl border ${docItem ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                                                <DocumentTextIcon className={`w-8 h-8 mb-2 ${docItem ? 'text-green-600' : 'text-gray-400'}`} />
                                                <p className="text-sm font-bold text-text-primary">{docType.replace('_', ' ')}</p>
                                                {docItem ? (
                                                    <a href={docItem.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary flex items-center gap-1 mt-2">
                                                        <ArrowDownTrayIcon className="w-3 h-3" /> Download
                                                    </a>
                                                ) : (
                                                    <p className="text-xs text-text-tertiary mt-2">Not uploaded</p>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* 6. BOQ VIEWER - Visible to Client */}
            <div>
                <SectionHeader title="Bill of Quantities" icon={ClipboardDocumentListIcon} section="boq" />
                <AnimatePresence>
                    {activeSection === 'boq' && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                            <div className="p-4 bg-background border border-t-0 border-border rounded-b-xl">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border">
                                            <th className="text-left py-2 px-3 font-semibold text-text-secondary">Item</th>
                                            <th className="text-right py-2 px-3 font-semibold text-text-secondary">Qty</th>
                                            <th className="text-left py-2 px-3 font-semibold text-text-secondary">Unit</th>
                                            <th className="text-right py-2 px-3 font-semibold text-text-secondary">Price</th>
                                            <th className="text-right py-2 px-3 font-semibold text-text-secondary">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {boqItems.map((item, idx) => (
                                            <tr key={idx} className="border-b border-border/50">
                                                <td className="py-2 px-3 text-text-primary">{item.name}</td>
                                                <td className="py-2 px-3 text-right text-text-primary">{item.quantity}</td>
                                                <td className="py-2 px-3 text-text-secondary">{item.unit}</td>
                                                <td className="py-2 px-3 text-right text-text-primary">{formatCurrencyINR(item.price)}</td>
                                                <td className="py-2 px-3 text-right font-semibold text-text-primary">{formatCurrencyINR(item.total)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-primary/5">
                                            <td colSpan={4} className="py-2 px-3 font-bold text-text-primary">Grand Total</td>
                                            <td className="py-2 px-3 text-right font-bold text-primary">{formatCurrencyINR(boqItems.reduce((sum, i) => sum + i.total, 0))}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                                <button className="mt-4 flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold">
                                    <DocumentArrowDownIcon className="w-4 h-4" /> Export PDF
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>


            {/* 7. MATERIAL SCHEDULE - Hidden for Client */}
            {!isClientView && (
                <div>
                    <SectionHeader title="Material Schedule" icon={CubeIcon} section="materials" />
                    <AnimatePresence>
                        {activeSection === 'materials' && (
                            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                                <div className="p-4 bg-background border border-t-0 border-border rounded-b-xl space-y-3">
                                    {materialSchedule.map((item, idx) => (
                                        <div key={item.id} className="flex items-center gap-3 p-3 bg-surface rounded-lg">
                                            <select
                                                value={item.catalogItemId}
                                                onChange={(e) => {
                                                    const updated = [...materialSchedule];
                                                    const catalogItem = catalogItems.find(c => c.id === e.target.value);
                                                    updated[idx].catalogItemId = e.target.value;
                                                    updated[idx].name = catalogItem?.name || '';
                                                    updated[idx].unit = catalogItem?.unit || 'Nos';
                                                    setMaterialSchedule(updated);
                                                }}
                                                className="flex-1 p-2 border border-border rounded-lg text-sm"
                                            >
                                                <option value="">Select from catalog</option>
                                                {catalogItems.map(c => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </select>
                                            <input
                                                type="number"
                                                placeholder="Qty"
                                                value={item.quantity}
                                                onChange={(e) => {
                                                    const updated = [...materialSchedule];
                                                    updated[idx].quantity = parseInt(e.target.value) || 1;
                                                    setMaterialSchedule(updated);
                                                }}
                                                className="w-20 p-2 border border-border rounded-lg text-sm"
                                            />
                                            <input
                                                type="date"
                                                value={item.deliveryDate}
                                                onChange={(e) => {
                                                    const updated = [...materialSchedule];
                                                    updated[idx].deliveryDate = e.target.value;
                                                    setMaterialSchedule(updated);
                                                }}
                                                className="p-2 border border-border rounded-lg text-sm"
                                            />
                                            <select
                                                value={item.phaseId}
                                                onChange={(e) => {
                                                    const updated = [...materialSchedule];
                                                    updated[idx].phaseId = e.target.value;
                                                    setMaterialSchedule(updated);
                                                }}
                                                className="w-40 p-2 border border-border rounded-lg text-sm"
                                            >
                                                {executionPlan?.phases?.map((p: any) => (
                                                    <option key={p.id} value={p.id}>{p.name}</option>
                                                ))}
                                            </select>
                                            <button onClick={() => setMaterialSchedule(materialSchedule.filter((_, i) => i !== idx))} className="text-red-500">
                                                <XCircleIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ))}
                                    <button onClick={addMaterialScheduleItem} className="text-sm text-primary font-semibold">+ Add Material</button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {/* 8. VENDOR ASSIGNMENT - Hidden for Client */}
            {!isClientView && (
                <div>
                    <SectionHeader title="Vendor Assignments" icon={UserGroupIcon} section="vendors" />
                    <AnimatePresence>
                        {activeSection === 'vendors' && (
                            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                                <div className="p-4 bg-background border border-t-0 border-border rounded-b-xl space-y-3">
                                    {executionPlan?.phases?.map((phase: any) => {
                                        const assignment = vendorAssignments.find(v => v.phaseId === phase.id);
                                        return (
                                            <div key={phase.id} className="flex items-center gap-4 p-3 bg-surface rounded-lg">
                                                <span className="flex-1 font-medium text-text-primary">{phase.name}</span>
                                                <select
                                                    value={assignment?.vendorId || ''}
                                                    onChange={(e) => {
                                                        const existing = vendorAssignments.filter(v => v.phaseId !== phase.id);
                                                        if (e.target.value) {
                                                            const vendor = vendors.find(v => v.id === e.target.value);
                                                            setVendorAssignments([...existing, { phaseId: phase.id, vendorId: e.target.value, vendorName: vendor?.name }]);
                                                        } else {
                                                            setVendorAssignments(existing);
                                                        }
                                                    }}
                                                    className="w-64 p-2 border border-border rounded-lg text-sm"
                                                >
                                                    <option value="">Assign vendor</option>
                                                    {vendors.map(v => (
                                                        <option key={v.id} value={v.id}>{v.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {/* 9. FINAL APPROVAL PANEL */}
            <div className="bg-surface border border-border rounded-xl p-6">
                <h3 className="font-bold text-lg text-text-primary mb-4 flex items-center gap-2">
                    <CheckCircleIcon className="w-5 h-5 text-primary" />
                    Final Approvals
                </h3>
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { key: 'projectHead', label: 'Project Head', canApprove: !isClientView },
                        { key: 'admin', label: 'Admin', canApprove: !isClientView && currentUser?.role === UserRole.SUPER_ADMIN },
                        { key: 'client', label: 'Client', canApprove: isClientView },
                    ].map(({ key, label, canApprove }) => (
                        <div key={key} className={`p-4 rounded-xl border ${approvals[key as keyof typeof approvals] ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                            <div className="flex items-center justify-between">
                                <span className="font-semibold text-text-primary">{label}</span>
                                {approvals[key as keyof typeof approvals] ? (
                                    <CheckCircleIcon className="w-6 h-6 text-green-600" />
                                ) : (
                                    <XCircleIcon className="w-6 h-6 text-gray-400" />
                                )}
                            </div>
                            {canApprove && !approvals[key as keyof typeof approvals] && (
                                <button
                                    onClick={() => handleApprovalToggle(key as 'projectHead' | 'admin' | 'client')}
                                    className="mt-3 w-full py-2 bg-primary text-white rounded-lg text-sm font-semibold"
                                >
                                    Approve
                                </button>
                            )}
                        </div>
                    ))}
                </div>
                {allApproved && (
                    <div className="mt-4 p-4 bg-green-100 border border-green-300 rounded-xl text-center">
                        <p className="font-bold text-green-800">✅ All approvals complete! Project is now ACTIVE.</p>
                    </div>
                )}
            </div>

            {/* Save Button - Hidden for Client */}
            {!isClientView && (
                <div className="flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={saving || executionPlan?.locked}
                        className="px-6 py-3 bg-primary text-white rounded-xl font-bold disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default ExecutionProjectPlanningPanel;
