// @deprecated – legacy execution component. Not used in workspace architecture.
/**
 * EXECUTION PLANNING
 *
 * Flow: Approved Quotation (read-only) -> Phase + Labor Planning -> Submit for Admin Approval.
 * Execution team does NOT define client finance; cost center is set at payment verification.
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { db } from '../../../firebase';
import {
    doc,
    getDoc,
    updateDoc,
    serverTimestamp,
    collection,
    query,
    where,
    getDocs,
    writeBatch
} from 'firebase/firestore';
import { Case, CaseQuotation, QuotationItemData, CaseStatus } from '../../../types';
import { FIRESTORE_COLLECTIONS, formatCurrencyINR } from '../../../constants';
import {
    CheckCircleIcon,
    ExclamationTriangleIcon,
    CalendarIcon,
    TruckIcon,
    UsersIcon
} from '@heroicons/react/24/outline';

interface Props {
    caseId: string;
    onBack: () => void;
}

interface PhaseMaterial {
    quotationItemId: string;
    catalogItemId: string;
    name: string;
    quantity: number;
    unit: string;
    deliveryDate: string;
}

interface Phase {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    laborCount: number;
    materials: PhaseMaterial[];
}

export interface ExecutionFundRequest {
    id: string;
    requestedDate?: string;
    amount: number;
    reason: string;
    requiredOn: string;
    status: 'pending' | 'approved' | 'rejected';
    requestedBy?: string;
    createdAt?: unknown;
    note?: string;
}

const ExecutionPlanningNew: React.FC<Props> = ({ caseId, onBack }) => {
    const { currentUser } = useAuth();

    // Data loading
    const [caseData, setCaseData] = useState<Case | null>(null);
    const [approvedQuotation, setApprovedQuotation] = useState<CaseQuotation | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Phase Planning
    const [phases, setPhases] = useState<Phase[]>([]);

    // Execution Fund Requests (money required for execution expenses; not client payment)
    const [executionFundRequests, setExecutionFundRequests] = useState<ExecutionFundRequest[]>([]);

    // Load case and approved quotation
    useEffect(() => {
        const loadData = async () => {
            if (!caseId || !db) return;

            try {
                // Load case
                const caseRef = doc(db, FIRESTORE_COLLECTIONS.CASES, caseId);
                const caseSnap = await getDoc(caseRef);

                if (!caseSnap.exists()) {
                    alert('Case not found');
                    return;
                }

                const caseDataLoaded = { id: caseSnap.id, ...caseSnap.data() } as Case;
                setCaseData(caseDataLoaded);

                // Load existing execution plan if any
                if (caseDataLoaded.executionPlan) {
                    const plan = caseDataLoaded.executionPlan as any;
                    if (plan.phases) {
                        setPhases(plan.phases);
                    }
                }
                if ((caseDataLoaded as any).executionFundRequests?.length) {
                    setExecutionFundRequests((caseDataLoaded as any).executionFundRequests);
                }

                // Load approved quotation
                const quotationsRef = collection(db, FIRESTORE_COLLECTIONS.CASES, caseId, FIRESTORE_COLLECTIONS.QUOTATIONS);
                const quotQuery = query(quotationsRef, where('auditStatus', '==', 'approved'));
                const quotSnap = await getDocs(quotQuery);

                if (!quotSnap.empty) {
                    const quotData = { id: quotSnap.docs[0].id, ...quotSnap.docs[0].data() } as CaseQuotation;
                    setApprovedQuotation(quotData);
                    console.log('[Execution Planning] ✅ Loaded approved quotation:', quotData);
                } else {
                    console.warn('[Execution Planning] ⚠️ No approved quotation found');
                }

            } catch (error) {
                console.error('[Execution Planning] Error loading data:', error);
                alert('Failed to load planning data');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [caseId]);

    const addPhase = () => {
        const newPhase: Phase = {
            id: Date.now().toString(),
            name: '',
            startDate: '',
            endDate: '',
            laborCount: 0,
            materials: []
        };
        setPhases([...phases, newPhase]);
    };

    const removePhase = (phaseId: string) => {
        setPhases(phases.filter(p => p.id !== phaseId));
    };

    const updatePhase = (phaseId: string, updates: Partial<Phase>) => {
        setPhases(phases.map(p => p.id === phaseId ? { ...p, ...updates } : p));
    };

    const assignMaterialToPhase = (phaseId: string, quotItem: QuotationItemData) => {
        const phase = phases.find(p => p.id === phaseId);
        if (!phase) return;

        const materialExists = phase.materials.some(m => m.catalogItemId === quotItem.catalogItemId);
        if (materialExists) {
            alert('This item is already assigned to this phase');
            return;
        }

        const displayName = quotItem.name || (quotItem as any).itemName || 'Unnamed';
        const newMaterial: PhaseMaterial = {
            quotationItemId: quotItem.catalogItemId ?? (quotItem as any).itemId ?? '',
            catalogItemId: quotItem.catalogItemId ?? (quotItem as any).itemId ?? '',
            name: displayName,
            quantity: quotItem.quantity,
            unit: quotItem.unit ?? 'pcs',
            deliveryDate: ''
        };

        updatePhase(phaseId, {
            materials: [...phase.materials, newMaterial]
        });
    };

    const removeMaterialFromPhase = (phaseId: string, materialIndex: number) => {
        const phase = phases.find(p => p.id === phaseId);
        if (!phase) return;

        updatePhase(phaseId, {
            materials: phase.materials.filter((_, i) => i !== materialIndex)
        });
    };

    const updateMaterialDeliveryDate = (phaseId: string, materialIndex: number, deliveryDate: string) => {
        const phase = phases.find(p => p.id === phaseId);
        if (!phase) return;

        const updatedMaterials = phase.materials.map((m, i) =>
            i === materialIndex ? { ...m, deliveryDate } : m
        );

        updatePhase(phaseId, { materials: updatedMaterials });
    };

    // Validate and submit planning
    const handleSubmitPlanning = async () => {
        if (!caseData || !currentUser || !db) return;

        // Validate phases
        if (phases.length === 0) {
            alert('❌ Please add at least one phase');
            return;
        }

        for (const phase of phases) {
            if (!phase.name) {
                alert(`❌ Please name all phases`);
                return;
            }
            if (!phase.startDate || !phase.endDate) {
                alert(`❌ Please set dates for phase: ${phase.name}`);
                return;
            }
            if (phase.laborCount === 0) {
                alert(`❌ Please set labor count for phase: ${phase.name}`);
                return;
            }
            for (const material of phase.materials) {
                if (!material.deliveryDate) {
                    alert(`❌ Please set delivery date for ${material.name} in phase: ${phase.name}`);
                    return;
                }
            }
        }

        const confirmSubmit = window.confirm(
            `Submit execution plan for admin approval?\n\nPhases: ${phases.length}\nThis will lock the plan for admin review.`
        );

        if (!confirmSubmit) return;

        setSaving(true);

        try {
            const batch = writeBatch(db);

            // Update case with execution plan
            const caseRef = doc(db, FIRESTORE_COLLECTIONS.CASES, caseId);
            
            const executionPlan = {
                phases,
                startDate: phases[0]?.startDate || '',
                endDate: phases[phases.length - 1]?.endDate || '',
                createdBy: currentUser.id,
                createdAt: serverTimestamp(),
                approvalStatus: 'pending'
            };

            // Firestore does not allow serverTimestamp() inside arrays; use client timestamp for array items
            const fundRequestsToSave = executionFundRequests.map((req) => ({
                ...req,
                id: req.id || `fr-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                status: 'pending' as const,
                requestedBy: currentUser.id,
                requestedDate: req.requestedDate || new Date().toISOString(),
                createdAt: req.createdAt ?? new Date(),
            }));

            batch.update(caseRef, {
                executionPlan,
                executionFundRequests: fundRequestsToSave,
                status: CaseStatus.PLANNING_SUBMITTED,
                updatedAt: serverTimestamp()
            });

            // Log activity
            const activityRef = doc(collection(db, FIRESTORE_COLLECTIONS.CASES, caseId, FIRESTORE_COLLECTIONS.ACTIVITIES));
            batch.set(activityRef, {
                caseId,
                action: `Execution plan submitted for admin approval (${phases.length} phases)`,
                by: currentUser.id,
                timestamp: serverTimestamp()
            });

            await batch.commit();

            console.log('[Execution Planning] ✅ Plan submitted successfully');
            alert('✅ Execution plan submitted for admin approval!');
            onBack();

        } catch (error) {
            console.error('[Execution Planning] Error submitting plan:', error);
            alert('Failed to submit execution plan. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    // Hooks must run unconditionally (before any early return)
    const hasQuotation = !!approvedQuotation;
    const quotationItems = React.useMemo(() => {
        const raw = approvedQuotation?.items || [];
        return raw.map((item: QuotationItemData & { itemName?: string }, index: number) => {
            const displayName = item.name || (item as any).itemName || 'Unnamed item';
            const value = item.catalogItemId ?? (item as any).itemId ?? `q-${index}`;
            return {
                ...item,
                name: displayName,
                catalogItemId: value,
            };
        });
    }, [approvedQuotation?.items]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">Loading execution planning...</div>
            </div>
        );
    }

    if (!caseData) {
        return (
            <div className="p-6 bg-red-50 rounded-lg">
                <p className="text-red-700">Case not found</p>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Execution Planning</h1>
                    <p className="text-gray-600 mt-1">{caseData.title}</p>
                </div>
                <button
                    onClick={onBack}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                    ← Back
                </button>
            </div>

            {/* Approved Quotation (read-only) */}
            {hasQuotation && (
                <div className="bg-white rounded-xl shadow-md p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <CheckCircleIcon className="w-8 h-8 text-purple-600" />
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Approved Quotation Items</h2>
                            <p className="text-gray-600 text-sm">Materials available for execution (from quotation)</p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-purple-100">
                                <tr>
                                    <th className="p-3 text-left">#</th>
                                    <th className="p-3 text-left">Item Name</th>
                                    <th className="p-3 text-right">Quantity</th>
                                    <th className="p-3 text-center">Unit</th>
                                    <th className="p-3 text-right">Rate</th>
                                    <th className="p-3 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {approvedQuotation.items.map((item, index) => (
                                    <tr key={index} className="border-b">
                                        <td className="p-3">{index + 1}</td>
                                        <td className="p-3 font-medium">{item.name}</td>
                                        <td className="p-3 text-right">{item.quantity}</td>
                                        <td className="p-3 text-center">{item.unit}</td>
                                        <td className="p-3 text-right">₹{item.rate.toLocaleString('en-IN')}</td>
                                        <td className="p-3 text-right font-bold">₹{item.total.toLocaleString('en-IN')}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="bg-purple-50 font-bold">
                                    <td colSpan={5} className="p-3 text-right">Grand Total:</td>
                                    <td className="p-3 text-right text-purple-700">
                                        ₹{approvedQuotation.grandTotal.toLocaleString('en-IN')}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            )}

            {/* Warning if no quotation */}
            {!hasQuotation && (
                <div className="bg-yellow-50 rounded-xl p-6 border-2 border-yellow-300">
                    <div className="flex items-start gap-3">
                        <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
                        <div>
                            <h3 className="font-bold text-yellow-900 mb-2">⚠️ No Approved Quotation Found</h3>
                            <p className="text-yellow-800 text-sm">
                                You can proceed with planning, but quotation items won't be available for material assignment.
                                For production use, ensure quotation is created and approved first.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Phase Planning */}
            {(
                <div className="bg-white rounded-xl shadow-md p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <CalendarIcon className="w-8 h-8 text-blue-600" />
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Phase Planning</h2>
                                <p className="text-gray-600 text-sm">Timeline, labor, and material delivery</p>
                            </div>
                        </div>
                        <button
                            onClick={addPhase}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            + Add Phase
                        </button>
                    </div>

                    {phases.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-lg">
                            <p className="text-gray-500">No phases added yet. Click "Add Phase" to start.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {phases.map((phase, phaseIndex) => (
                                <div key={phase.id} className="border-2 border-gray-200 rounded-lg p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-lg font-bold text-gray-900">Phase {phaseIndex + 1}</h3>
                                        <button
                                            onClick={() => removePhase(phase.id)}
                                            className="text-red-600 hover:text-red-800 text-sm"
                                        >
                                            Remove
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Phase Name *</label>
                                            <input
                                                type="text"
                                                value={phase.name}
                                                onChange={(e) => updatePhase(phase.id, { name: e.target.value })}
                                                className="w-full px-3 py-2 border rounded-lg"
                                                placeholder="e.g., Carpentry, Electrical"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Labor Count *</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={phase.laborCount || ''}
                                                onChange={(e) => updatePhase(phase.id, { laborCount: parseInt(e.target.value) || 0 })}
                                                className="w-full px-3 py-2 border rounded-lg"
                                                placeholder="Number of workers"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                                            <input
                                                type="date"
                                                value={phase.startDate}
                                                onChange={(e) => updatePhase(phase.id, { startDate: e.target.value })}
                                                className="w-full px-3 py-2 border rounded-lg"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                                            <input
                                                type="date"
                                                value={phase.endDate}
                                                onChange={(e) => updatePhase(phase.id, { endDate: e.target.value })}
                                                className="w-full px-3 py-2 border rounded-lg"
                                            />
                                        </div>
                                    </div>

                                    {/* Assign Materials */}
                                    <div className="mt-4">
                                        <h4 className="font-bold text-gray-900 mb-2">Assign Materials from Quotation</h4>
                                        
                                        {phase.materials.length === 0 ? (
                                            <p className="text-sm text-gray-500 mb-2">No materials assigned yet</p>
                                        ) : (
                                            <div className="space-y-2 mb-4">
                                                {phase.materials.map((material, matIndex) => {
                                                    const fromQuotation = quotationItems.find(
                                                        (q) =>
                                                            (q.catalogItemId ?? (q as any).itemId) === material.catalogItemId ||
                                                            (q.catalogItemId ?? (q as any).itemId) === material.quotationItemId
                                                    );
                                                    const displayName = (fromQuotation && (fromQuotation.name || (fromQuotation as any).itemName)) || material.name || 'Unnamed item';
                                                    return (
                                                    <div key={matIndex} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                                        <div className="flex-1">
                                                            <p className="font-medium">{displayName}</p>
                                                            <p className="text-sm text-gray-600">{material.quantity} {material.unit}</p>
                                                        </div>
                                                        <div>
                                                            <label className="text-xs text-gray-600">Delivery Date *</label>
                                                            <input
                                                                type="date"
                                                                value={material.deliveryDate}
                                                                onChange={(e) => updateMaterialDeliveryDate(phase.id, matIndex, e.target.value)}
                                                                className="px-2 py-1 border rounded text-sm"
                                                            />
                                                        </div>
                                                        <button
                                                            onClick={() => removeMaterialFromPhase(phase.id, matIndex)}
                                                            className="text-red-600 hover:text-red-800"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        <select
                                            onChange={(e) => {
                                                if (e.target.value) {
                                                    const item = quotationItems.find((i, idx) =>
                                                        (i.catalogItemId ?? (i as any).itemId ?? `q-${idx}`) === e.target.value
                                                    );
                                                    if (item) {
                                                        assignMaterialToPhase(phase.id, item);
                                                        e.target.value = '';
                                                    }
                                                }
                                            }}
                                            className="w-full px-3 py-2 border rounded-lg bg-white"
                                            disabled={!hasQuotation}
                                        >
                                            <option value="">
                                                {hasQuotation ? '+ Select material from quotation' : 'No quotation available'}
                                            </option>
                                            {quotationItems.map((item, idx) => (
                                                <option key={idx} value={item.catalogItemId ?? (item as any).itemId ?? `q-${idx}`}>
                                                    {item.name} ({item.quantity} {item.unit ?? 'pcs'})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Execution Fund Requests */}
                    <div className="mt-6 pt-6 border-t">
                        <h4 className="font-bold text-gray-900 mb-2">Execution Fund Requests</h4>
                        <p className="text-sm text-gray-600 mb-3">Money required for execution expenses (not client payment). Approval handled separately.</p>
                        {executionFundRequests.map((req, idx) => (
                            <div key={req.id || idx} className="flex flex-wrap items-center gap-3 p-3 bg-gray-50 rounded-lg mb-2">
                                <input
                                    type="date"
                                    value={req.requiredOn || ''}
                                    onChange={(e) => {
                                        const next = [...executionFundRequests];
                                        next[idx] = { ...next[idx], requiredOn: e.target.value };
                                        setExecutionFundRequests(next);
                                    }}
                                    className="px-2 py-1.5 border rounded text-sm"
                                    placeholder="Date required"
                                />
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={req.amount || ''}
                                    onChange={(e) => {
                                        const next = [...executionFundRequests];
                                        next[idx] = { ...next[idx], amount: parseFloat(e.target.value) || 0 };
                                        setExecutionFundRequests(next);
                                    }}
                                    className="w-28 px-2 py-1.5 border rounded text-sm"
                                    placeholder="Amount"
                                />
                                <input
                                    type="text"
                                    value={req.reason || ''}
                                    onChange={(e) => {
                                        const next = [...executionFundRequests];
                                        next[idx] = { ...next[idx], reason: e.target.value };
                                        setExecutionFundRequests(next);
                                    }}
                                    className="flex-1 min-w-[120px] px-2 py-1.5 border rounded text-sm"
                                    placeholder="Reason"
                                />
                                <input
                                    type="text"
                                    value={req.note || ''}
                                    onChange={(e) => {
                                        const next = [...executionFundRequests];
                                        next[idx] = { ...next[idx], note: e.target.value };
                                        setExecutionFundRequests(next);
                                    }}
                                    className="flex-1 min-w-[100px] px-2 py-1.5 border rounded text-sm"
                                    placeholder="Note (optional)"
                                />
                                <button
                                    type="button"
                                    onClick={() => setExecutionFundRequests(executionFundRequests.filter((_, i) => i !== idx))}
                                    className="text-red-600 hover:text-red-800 text-sm"
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={() => setExecutionFundRequests([...executionFundRequests, { id: '', amount: 0, reason: '', requiredOn: '', status: 'pending' }])}
                            className="mt-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium"
                        >
                            + Add Fund Request
                        </button>
                    </div>

                    {/* Submit Button */}
                    {phases.length > 0 && (
                        <div className="mt-6 pt-6 border-t">
                            <button
                                onClick={handleSubmitPlanning}
                                disabled={saving}
                                className="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:from-green-700 hover:to-teal-700 font-bold text-lg disabled:opacity-50"
                            >
                                {saving ? 'Submitting...' : '✓ Submit Execution Plan for Admin Approval'}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ExecutionPlanningNew;
