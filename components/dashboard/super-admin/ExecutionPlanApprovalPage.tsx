/**
 * EXECUTION PLAN APPROVAL PAGE (ADMIN)
 * 
 * Shows all cases with status = PLANNING_SUBMITTED
 * Displays:
 * - Financial Plan (Budget + Installments)
 * - Phases with timeline, labor, materials
 * - Quotation items reference
 * - BOQ reference
 * 
 * Actions:
 * - APPROVE: Generate Master PDF, set status=ACTIVE, approvedByAdmin=true
 * - REJECT: Return to WAITING_FOR_PLANNING, add rejection reason
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { db } from '../../../firebase';
import {
    collection,
    query,
    where,
    onSnapshot,
    doc,
    updateDoc,
    serverTimestamp,
    writeBatch,
    getDocs
} from 'firebase/firestore';
import { Case, CaseQuotation, CaseBOQ } from '../../../types';
import { FIRESTORE_COLLECTIONS, formatCurrencyINR } from '../../../constants';
import {
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    CurrencyDollarIcon,
    CalendarIcon,
    UsersIcon,
    TruckIcon,
    DocumentTextIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { generateMasterProjectPDF } from '../../../services/pdfGenerationService';

const ExecutionPlanApprovalPage: React.FC = () => {
    const { currentUser } = useAuth();
    const [pendingPlans, setPendingPlans] = useState<Case[]>([]);
    const [selectedCase, setSelectedCase] = useState<Case | null>(null);
    const [quotation, setQuotation] = useState<CaseQuotation | null>(null);
    const [boq, setBOQ] = useState<CaseBOQ | null>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');

    // Load all pending execution plans
    useEffect(() => {
        if (!db) return;

        const casesRef = collection(db, FIRESTORE_COLLECTIONS.CASES);
        const q = query(casesRef, where('status', '==', 'PLANNING_SUBMITTED'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const plans = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Case[];
            
            setPendingPlans(plans);
            setLoading(false);
            console.log('[Execution Plan Approval] Loaded pending plans:', plans.length);
        }, (error) => {
            console.error('[Execution Plan Approval] Error:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Load details for selected case
    useEffect(() => {
        const loadDetails = async () => {
            if (!selectedCase || !db) return;

            try {
                // Load approved quotation
                const quotRef = collection(db, FIRESTORE_COLLECTIONS.CASES, selectedCase.id, FIRESTORE_COLLECTIONS.QUOTATIONS);
                const quotQuery = query(quotRef, where('auditStatus', '==', 'approved'));
                const quotSnap = await getDocs(quotQuery);

                if (!quotSnap.empty) {
                    setQuotation({ id: quotSnap.docs[0].id, ...quotSnap.docs[0].data() } as CaseQuotation);
                }

                // Load BOQ
                const boqRef = collection(db, FIRESTORE_COLLECTIONS.CASES, selectedCase.id, 'boq');
                const boqSnap = await getDocs(boqRef);

                if (!boqSnap.empty) {
                    setBOQ({ id: boqSnap.docs[0].id, ...boqSnap.docs[0].data() } as CaseBOQ);
                }

            } catch (error) {
                console.error('[Execution Plan Approval] Error loading details:', error);
            }
        };

        loadDetails();
    }, [selectedCase]);

    const handleApprove = async () => {
        if (!selectedCase || !currentUser || !db) return;

        const confirmApprove = window.confirm(
            `APPROVE execution plan for:\n${selectedCase.title}\n\n` +
            `Budget: ₹${selectedCase.executionPlan?.financialPlan?.totalBudget?.toLocaleString('en-IN')}\n` +
            `Phases: ${selectedCase.executionPlan?.phases?.length || 0}\n\n` +
            `This will:\n` +
            `- Generate Master Project PDF\n` +
            `- Activate the project (status = ACTIVE)\n` +
            `- Allow execution to begin\n\n` +
            `Continue?`
        );

        if (!confirmApprove) return;

        setProcessing(true);

        try {
            const batch = writeBatch(db);

            // Generate Master Project PDF
            console.log('[Execution Plan Approval] Generating Master Project PDF...');
            const masterPdfUrl = await generateMasterProjectPDF(selectedCase, quotation, boq);
            console.log('[Execution Plan Approval] Master PDF generated:', masterPdfUrl);

            // Update case
            const caseRef = doc(db, FIRESTORE_COLLECTIONS.CASES, selectedCase.id);
            batch.update(caseRef, {
                status: 'ACTIVE',
                'executionPlan.approvedByAdmin': true,
                'executionPlan.approvedBy': currentUser.id,
                'executionPlan.approvedAt': serverTimestamp(),
                masterProjectPdfUrl: masterPdfUrl,
                updatedAt: serverTimestamp()
            });

            // Log activity
            const activityRef = doc(collection(db, FIRESTORE_COLLECTIONS.CASES, selectedCase.id, FIRESTORE_COLLECTIONS.ACTIVITIES));
            batch.set(activityRef, {
                caseId: selectedCase.id,
                action: `Execution plan APPROVED by admin. Project is now ACTIVE. Master PDF generated.`,
                by: currentUser.id,
                timestamp: serverTimestamp()
            });

            await batch.commit();

            alert('✅ Execution plan approved! Project is now ACTIVE.');
            setSelectedCase(null);
            setQuotation(null);
            setBOQ(null);

        } catch (error) {
            console.error('[Execution Plan Approval] Error approving:', error);
            alert('Failed to approve execution plan. Please try again.');
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!selectedCase || !currentUser || !db) return;

        if (!rejectionReason.trim()) {
            alert('❌ Please provide a rejection reason');
            return;
        }

        const confirmReject = window.confirm(
            `REJECT execution plan for:\n${selectedCase.title}\n\n` +
            `Reason: ${rejectionReason}\n\n` +
            `This will send the plan back to execution team for revision.\n\n` +
            `Continue?`
        );

        if (!confirmReject) return;

        setProcessing(true);

        try {
            const batch = writeBatch(db);

            // Update case
            const caseRef = doc(db, FIRESTORE_COLLECTIONS.CASES, selectedCase.id);
            batch.update(caseRef, {
                status: 'WAITING_FOR_PLANNING',
                'executionPlan.approvedByAdmin': false,
                'executionPlan.rejectedBy': currentUser.id,
                'executionPlan.rejectedAt': serverTimestamp(),
                'executionPlan.rejectionReason': rejectionReason,
                updatedAt: serverTimestamp()
            });

            // Log activity
            const activityRef = doc(collection(db, FIRESTORE_COLLECTIONS.CASES, selectedCase.id, FIRESTORE_COLLECTIONS.ACTIVITIES));
            batch.set(activityRef, {
                caseId: selectedCase.id,
                action: `Execution plan REJECTED by admin. Reason: ${rejectionReason}`,
                by: currentUser.id,
                timestamp: serverTimestamp()
            });

            await batch.commit();

            alert('✅ Execution plan rejected. Returned to execution team.');
            setSelectedCase(null);
            setRejectionReason('');

        } catch (error) {
            console.error('[Execution Plan Approval] Error rejecting:', error);
            alert('Failed to reject execution plan. Please try again.');
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="flex items-center justify-center h-64">
                    <div className="text-gray-500">Loading execution plans...</div>
                </div>
            </div>
        );
    }

    // List view
    if (!selectedCase) {
        return (
            <div className="p-6 space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Execution Plan Approvals</h1>
                    <p className="text-gray-600 mt-1">
                        Review and approve execution plans submitted by execution team
                    </p>
                </div>

                {pendingPlans.length === 0 ? (
                    <div className="bg-gray-50 rounded-xl p-12 text-center">
                        <ClockIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-gray-900 mb-2">No Pending Plans</h3>
                        <p className="text-gray-600">
                            All execution plans have been reviewed. New submissions will appear here.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {pendingPlans.map(plan => {
                            const financialPlan = plan.executionPlan?.financialPlan as any;
                            const phases = plan.executionPlan?.phases as any[];

                            return (
                                <div
                                    key={plan.id}
                                    onClick={() => setSelectedCase(plan)}
                                    className="bg-white rounded-xl shadow-md p-6 cursor-pointer hover:shadow-xl transition-shadow border-2 border-yellow-400"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <h3 className="font-bold text-gray-900 text-lg mb-1">
                                                {plan.title}
                                            </h3>
                                            <p className="text-sm text-gray-600">
                                                Case ID: {plan.id}
                                            </p>
                                        </div>
                                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full">
                                            PENDING
                                        </span>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-sm">
                                            <CurrencyDollarIcon className="w-5 h-5 text-green-600" />
                                            <span className="font-bold">
                                                ₹{financialPlan?.totalBudget?.toLocaleString('en-IN') || '0'}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2 text-sm">
                                            <CalendarIcon className="w-5 h-5 text-blue-600" />
                                            <span>{phases?.length || 0} phases</span>
                                        </div>

                                        <div className="flex items-center gap-2 text-sm">
                                            <ClockIcon className="w-5 h-5 text-purple-600" />
                                            <span>
                                                {plan.executionPlan?.startDate && plan.executionPlan?.endDate
                                                    ? `${new Date(plan.executionPlan.startDate).toLocaleDateString()} - ${new Date(plan.executionPlan.endDate).toLocaleDateString()}`
                                                    : 'Timeline not set'}
                                            </span>
                                        </div>
                                    </div>

                                    <button className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                                        Review Plan →
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    }

    // Detail view
    const financialPlan = selectedCase.executionPlan?.financialPlan as any;
    const phases = selectedCase.executionPlan?.phases as any[] || [];

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <button
                        onClick={() => {
                            setSelectedCase(null);
                            setQuotation(null);
                            setBOQ(null);
                            setRejectionReason('');
                        }}
                        className="text-blue-600 hover:text-blue-800 mb-2"
                    >
                        ← Back to List
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">{selectedCase.title}</h1>
                    <p className="text-gray-600 mt-1">Case ID: {selectedCase.id}</p>
                </div>
                <span className="px-4 py-2 bg-yellow-100 text-yellow-800 font-bold rounded-full">
                    ⏳ PENDING APPROVAL
                </span>
            </div>

            {/* Financial Plan */}
            <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center gap-3 mb-6">
                    <CurrencyDollarIcon className="w-8 h-8 text-green-600" />
                    <h2 className="text-2xl font-bold text-gray-900">Financial Plan</h2>
                </div>

                <div className="space-y-4">
                    <div className="p-4 bg-green-50 rounded-lg">
                        <p className="text-sm text-gray-600">Total Project Budget</p>
                        <p className="text-3xl font-bold text-green-700">
                            ₹{financialPlan?.totalBudget?.toLocaleString('en-IN') || '0'}
                        </p>
                    </div>

                    <div>
                        <h3 className="font-bold text-gray-900 mb-3">Payment Installments</h3>
                        <div className="space-y-3">
                            {financialPlan?.installments?.map((inst: any, index: number) => (
                                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                    <div>
                                        <p className="font-bold text-gray-900">{inst.label} Payment</p>
                                        <p className="text-sm text-gray-600">
                                            Due: {new Date(inst.dueDate).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xl font-bold text-gray-900">
                                            ₹{inst.amount?.toLocaleString('en-IN') || '0'}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            {financialPlan?.totalBudget > 0 && ((inst.amount / financialPlan.totalBudget) * 100).toFixed(1)}%
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Phases */}
            <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center gap-3 mb-6">
                    <CalendarIcon className="w-8 h-8 text-blue-600" />
                    <h2 className="text-2xl font-bold text-gray-900">Execution Phases ({phases.length})</h2>
                </div>

                <div className="space-y-4">
                    {phases.map((phase, index) => (
                        <div key={phase.id} className="border-2 border-gray-200 rounded-lg p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">
                                        Phase {index + 1}: {phase.name}
                                    </h3>
                                    <p className="text-sm text-gray-600 mt-1">
                                        {new Date(phase.startDate).toLocaleDateString()} - {new Date(phase.endDate).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 text-purple-700">
                                    <UsersIcon className="w-5 h-5" />
                                    <span className="font-bold">{phase.laborCount} workers</span>
                                </div>
                            </div>

                            {phase.materials && phase.materials.length > 0 && (
                                <div>
                                    <h4 className="font-bold text-gray-900 mb-2">Materials</h4>
                                    <div className="space-y-2">
                                        {phase.materials.map((material: any, matIndex: number) => (
                                            <div key={matIndex} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                <div>
                                                    <p className="font-medium">{material.name}</p>
                                                    <p className="text-sm text-gray-600">
                                                        {material.quantity} {material.unit}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <div className="flex items-center gap-2 text-sm text-orange-600">
                                                        <TruckIcon className="w-4 h-4" />
                                                        <span>{new Date(material.deliveryDate).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Quotation Reference (if available) */}
            {quotation && (
                <div className="bg-white rounded-xl shadow-md p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <DocumentTextIcon className="w-8 h-8 text-purple-600" />
                        <h2 className="text-2xl font-bold text-gray-900">Approved Quotation Reference</h2>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                        Grand Total: <span className="font-bold text-purple-700">₹{quotation.grandTotal?.toLocaleString('en-IN')}</span>
                    </p>
                    <p className="text-xs text-gray-500">
                        {quotation.items?.length || 0} items • Created: {quotation.createdAt ? new Date((quotation.createdAt as any).toDate()).toLocaleDateString() : 'N/A'}
                    </p>
                </div>
            )}

            {/* BOQ Reference (if available) */}
            {boq && (
                <div className="bg-white rounded-xl shadow-md p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <DocumentTextIcon className="w-8 h-8 text-teal-600" />
                        <h2 className="text-2xl font-bold text-gray-900">BOQ Reference</h2>
                    </div>
                    <p className="text-xs text-gray-500">
                        {boq.items?.length || 0} items • Created: {boq.createdAt ? new Date((boq.createdAt as any).toDate()).toLocaleDateString() : 'N/A'}
                    </p>
                </div>
            )}

            {/* Warning if no quotation/BOQ */}
            {(!quotation || !boq) && (
                <div className="bg-yellow-50 rounded-xl p-6 border-2 border-yellow-300">
                    <div className="flex items-start gap-3">
                        <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
                        <div>
                            <h3 className="font-bold text-yellow-900 mb-2">⚠️ Missing References</h3>
                            <ul className="text-yellow-800 text-sm space-y-1">
                                {!quotation && <li>• No approved quotation found</li>}
                                {!boq && <li>• No BOQ found</li>}
                            </ul>
                            <p className="text-yellow-700 text-xs mt-2">
                                This is allowed for testing, but production projects should have both.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Approval Actions */}
            <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Approval Decision</h2>

                <div className="space-y-4">
                    {/* Rejection Reason (if rejecting) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Rejection Reason (if rejecting)
                        </label>
                        <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-3 border rounded-lg"
                            placeholder="Enter reason for rejection (required if rejecting)"
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={handleReject}
                            disabled={processing}
                            className="px-6 py-4 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold text-lg disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            <XCircleIcon className="w-6 h-6" />
                            {processing ? 'Processing...' : 'Reject Plan'}
                        </button>

                        <button
                            onClick={handleApprove}
                            disabled={processing}
                            className="px-6 py-4 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:from-green-700 hover:to-teal-700 font-bold text-lg disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            <CheckCircleIcon className="w-6 h-6" />
                            {processing ? 'Processing...' : 'Approve & Activate'}
                        </button>
                    </div>

                    <p className="text-xs text-gray-500 text-center mt-4">
                        ⚠️ Approving will generate Master Project PDF and activate the project for execution
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ExecutionPlanApprovalPage;
