// @deprecated – legacy execution component. Not used in workspace architecture.
/**
 * EXECUTION PLANNING - COMPLETE REBUILD
 * 
 * CRITICAL FLOW (STRICT ORDER):
 * 1. Financial Planning (MANDATORY FIRST) - Budget + Installments
 * 2. Load Approved Quotation (NOT CATALOG) - Auto-pull quotation items
 * 3. Phase + Labor Planning - Assign quotation items to phases
 * 4. Atomic Save - Update executionPlan + Initialize costCenter
 * 5. Submit for Admin Approval - Status = PLANNING_SUBMITTED
 * 
 * RULES:
 * - Budget MUST be filled first (all other UI locked until done)
 * - Materials ONLY from approved quotation (NO catalog)
 * - Execution ONLY sets: deliveryDate, laborCount per phase
 * - Single atomic save (no partial saves)
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
import { Case, CaseQuotation, QuotationItemData } from '../../../types';
import { FIRESTORE_COLLECTIONS, formatCurrencyINR } from '../../../constants';
import {
    CheckCircleIcon,
    ExclamationTriangleIcon,
    CalendarIcon,
    CurrencyDollarIcon,
    TruckIcon,
    UsersIcon
} from '@heroicons/react/24/outline';

interface Props {
    caseId: string;
    onBack: () => void;
}

interface Installment {
    label: 'Advance' | 'Second' | 'Final';
    amount: number;
    dueDate: string;
    paid: boolean;
}

interface FinancialPlan {
    totalBudget: number;
    installments: Installment[];
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

const ExecutionPlanningNew: React.FC<Props> = ({ caseId, onBack }) => {
    const { currentUser } = useAuth();

    // Data loading
    const [caseData, setCaseData] = useState<Case | null>(null);
    const [approvedQuotation, setApprovedQuotation] = useState<CaseQuotation | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // STEP 1: Financial Planning
    const [financialPlan, setFinancialPlan] = useState<FinancialPlan>({
        totalBudget: 0,
        installments: [
            { label: 'Advance', amount: 0, dueDate: '', paid: false },
            { label: 'Second', amount: 0, dueDate: '', paid: false },
            { label: 'Final', amount: 0, dueDate: '', paid: false }
        ]
    });
    const [financialPlanComplete, setFinancialPlanComplete] = useState(false);

    // STEP 3: Phase Planning
    const [phases, setPhases] = useState<Phase[]>([]);

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
                    
                    if (plan.financialPlan) {
                        setFinancialPlan(plan.financialPlan);
                        setFinancialPlanComplete(true);
                    }

                    if (plan.phases) {
                        setPhases(plan.phases);
                    }
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

    // Validate financial plan
    const validateFinancialPlan = (): boolean => {
        if (financialPlan.totalBudget <= 0) {
            alert('❌ Please enter total project budget');
            return false;
        }

        const totalInstallments = financialPlan.installments.reduce((sum, inst) => sum + inst.amount, 0);
        if (Math.abs(totalInstallments - financialPlan.totalBudget) > 1) {
            alert(`❌ Installments (₹${totalInstallments.toLocaleString('en-IN')}) must equal Total Budget (₹${financialPlan.totalBudget.toLocaleString('en-IN')})`);
            return false;
        }

        for (const inst of financialPlan.installments) {
            if (!inst.dueDate) {
                alert(`❌ Please set due date for ${inst.label} installment`);
                return false;
            }
        }

        return true;
    };

    const handleSaveFinancialPlan = () => {
        if (validateFinancialPlan()) {
            setFinancialPlanComplete(true);
            alert('✅ Financial plan saved! You can now proceed with phase planning.');
        }
    };

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

        const newMaterial: PhaseMaterial = {
            quotationItemId: quotItem.catalogItemId, // Use as reference
            catalogItemId: quotItem.catalogItemId,
            name: quotItem.name,
            quantity: quotItem.quantity,
            unit: quotItem.unit,
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

        // Validate financial plan
        if (!financialPlanComplete || !validateFinancialPlan()) {
            alert('❌ Please complete financial planning first');
            return;
        }

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
            `Submit execution plan for admin approval?\n\n` +
            `Total Budget: ₹${financialPlan.totalBudget.toLocaleString('en-IN')}\n` +
            `Phases: ${phases.length}\n` +
            `This will lock the plan for admin review.`
        );

        if (!confirmSubmit) return;

        setSaving(true);

        try {
            const batch = writeBatch(db);

            // Update case with execution plan
            const caseRef = doc(db, FIRESTORE_COLLECTIONS.CASES, caseId);
            
            const executionPlan = {
                financialPlan,
                phases,
                startDate: phases[0]?.startDate || '',
                endDate: phases[phases.length - 1]?.endDate || '',
                createdBy: currentUser.id,
                createdAt: serverTimestamp(),
                approvedByAdmin: false
            };

            // Initialize cost center
            const costCenter = {
                totalBudget: financialPlan.totalBudget,
                spentAmount: 0,
                remainingAmount: financialPlan.totalBudget,
                expenses: 0,
                materials: 0,
                salaries: 0
            };

            batch.update(caseRef, {
                executionPlan,
                costCenter,
                status: 'PLANNING_SUBMITTED',
                updatedAt: serverTimestamp()
            });

            // Log activity
            const activityRef = doc(collection(db, FIRESTORE_COLLECTIONS.CASES, caseId, FIRESTORE_COLLECTIONS.ACTIVITIES));
            batch.set(activityRef, {
                caseId,
                action: `Execution plan submitted for admin approval (Budget: ₹${financialPlan.totalBudget.toLocaleString('en-IN')}, ${phases.length} phases)`,
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

    // TEMPORARILY: Allow planning without quotation for testing
    const hasQuotation = !!approvedQuotation;
    const quotationItems = approvedQuotation?.items || [];

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

            {/* Progress Indicator */}
            <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
                <div className={`flex items-center gap-2 ${financialPlanComplete ? 'text-green-600' : 'text-blue-600'}`}>
                    {financialPlanComplete ? (
                        <CheckCircleIcon className="w-6 h-6" />
                    ) : (
                        <div className="w-6 h-6 border-2 border-blue-600 rounded-full flex items-center justify-center text-xs font-bold">1</div>
                    )}
                    <span className="font-medium">Financial Plan</span>
                </div>
                <div className="flex-1 h-1 bg-gray-300" />
                <div className={`flex items-center gap-2 ${financialPlanComplete ? 'text-blue-600' : 'text-gray-400'}`}>
                    <div className="w-6 h-6 border-2 border-current rounded-full flex items-center justify-center text-xs font-bold">2</div>
                    <span className="font-medium">Phase Planning</span>
                </div>
            </div>

            {/* STEP 1: FINANCIAL PLANNING */}
            <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <CurrencyDollarIcon className="w-8 h-8 text-green-600" />
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Step 1: Financial Planning</h2>
                            <p className="text-gray-600 text-sm">Budget and payment schedule (MANDATORY)</p>
                        </div>
                    </div>
                    {financialPlanComplete && (
                        <button
                            onClick={() => setFinancialPlanComplete(false)}
                            className="text-sm text-blue-600 hover:text-blue-800"
                        >
                            Edit Financial Plan
                        </button>
                    )}
                </div>

                <div className="space-y-6">
                    {/* Total Budget */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Total Project Budget *
                        </label>
                        <input
                            type="number"
                            min="0"
                            value={financialPlan.totalBudget || ''}
                            onChange={(e) => setFinancialPlan({
                                ...financialPlan,
                                totalBudget: parseFloat(e.target.value) || 0
                            })}
                            disabled={financialPlanComplete}
                            className="w-full px-4 py-3 border rounded-lg text-lg font-bold disabled:bg-gray-100"
                            placeholder="Enter total budget"
                        />
                    </div>

                    {/* Installments */}
                    <div>
                        <h3 className="font-bold text-gray-900 mb-3">Payment Installments</h3>
                        <div className="space-y-4">
                            {financialPlan.installments.map((inst, index) => (
                                <div key={index} className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            {inst.label} Payment *
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={inst.amount || ''}
                                            onChange={(e) => {
                                                const updated = [...financialPlan.installments];
                                                updated[index].amount = parseFloat(e.target.value) || 0;
                                                setFinancialPlan({ ...financialPlan, installments: updated });
                                            }}
                                            disabled={financialPlanComplete}
                                            className="w-full px-3 py-2 border rounded-lg disabled:bg-gray-100"
                                            placeholder="Amount"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Due Date *
                                        </label>
                                        <input
                                            type="date"
                                            value={inst.dueDate}
                                            onChange={(e) => {
                                                const updated = [...financialPlan.installments];
                                                updated[index].dueDate = e.target.value;
                                                setFinancialPlan({ ...financialPlan, installments: updated });
                                            }}
                                            disabled={financialPlanComplete}
                                            className="w-full px-3 py-2 border rounded-lg disabled:bg-gray-100"
                                        />
                                    </div>
                                    <div className="flex items-end">
                                        <div className="text-sm text-gray-600">
                                            {inst.amount > 0 && financialPlan.totalBudget > 0 && (
                                                <span className="font-medium">
                                                    {((inst.amount / financialPlan.totalBudget) * 100).toFixed(1)}% of total
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Validation Summary */}
                        {financialPlan.totalBudget > 0 && (
                            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                                <div className="flex justify-between text-sm">
                                    <span>Total Installments:</span>
                                    <span className="font-bold">
                                        ₹{financialPlan.installments.reduce((sum, inst) => sum + inst.amount, 0).toLocaleString('en-IN')}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm mt-1">
                                    <span>Total Budget:</span>
                                    <span className="font-bold">₹{financialPlan.totalBudget.toLocaleString('en-IN')}</span>
                                </div>
                                {Math.abs(financialPlan.installments.reduce((sum, inst) => sum + inst.amount, 0) - financialPlan.totalBudget) > 1 && (
                                    <p className="text-red-600 text-sm mt-2">
                                        ⚠️ Installments must equal total budget
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {!financialPlanComplete && (
                        <button
                            onClick={handleSaveFinancialPlan}
                            className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold"
                        >
                            ✓ Save Financial Plan & Continue
                        </button>
                    )}
                </div>
            </div>

            {/* STEP 2: APPROVED QUOTATION (READ-ONLY) - OPTIONAL */}
            {financialPlanComplete && hasQuotation && (
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
            {financialPlanComplete && !hasQuotation && (
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

            {/* STEP 3: PHASE PLANNING */}
            {financialPlanComplete && (
                <div className="bg-white rounded-xl shadow-md p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <CalendarIcon className="w-8 h-8 text-blue-600" />
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Step 2: Phase Planning</h2>
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
                                                {phase.materials.map((material, matIndex) => (
                                                    <div key={matIndex} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                                        <div className="flex-1">
                                                            <p className="font-medium">{material.name}</p>
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
                                                ))}
                                            </div>
                                        )}

                                        <select
                                            onChange={(e) => {
                                                if (e.target.value) {
                                                    const item = quotationItems.find(i => i.catalogItemId === e.target.value);
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
                                                <option key={idx} value={item.catalogItemId}>
                                                    {item.name} ({item.quantity} {item.unit})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

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
