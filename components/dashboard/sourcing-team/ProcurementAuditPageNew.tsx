/**
 * PHASE 3: Procurement Audit Page - COMPLETE REBUILD
 * 
 * Features:
 * - Uses collectionGroup to pull ALL quotations with auditStatus='pending'
 * - Table showing Project Name, Client, Total, Created By
 * - Approve button: Set auditStatus='approved', attach PDF to documents, log activity
 * - Reject button: Set auditStatus='rejected', return to quotation team
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { db } from '../../../firebase';
import {
    collectionGroup,
    query,
    where,
    onSnapshot,
    doc,
    updateDoc,
    addDoc,
    collection,
    serverTimestamp,
    getDoc,
    getDocs,
    writeBatch
} from 'firebase/firestore';
import {
    CaseQuotation,
    Case
} from '../../../types';
import { FIRESTORE_COLLECTIONS } from '../../../constants';
import {
    DocumentTextIcon,
    CheckCircleIcon,
    XMarkIcon,
    ClockIcon,
    EyeIcon
} from '@heroicons/react/24/outline';

interface QuotationWithCase extends CaseQuotation {
    projectName?: string;
    clientName?: string;
}

const ProcurementAuditPageNew: React.FC = () => {
    const { currentUser } = useAuth();
    const [pendingQuotations, setPendingQuotations] = useState<QuotationWithCase[]>([]);
    const [selectedQuotation, setSelectedQuotation] = useState<QuotationWithCase | null>(null);
    const [processing, setProcessing] = useState(false);
    const [queryError, setQueryError] = useState<string | null>(null);

    // Load all pending quotations across all cases (collectionGroup: cases/*/quotations)
    useEffect(() => {
        if (!db || !currentUser) return;

        setQueryError(null);
        console.log('[Procurement Audit] Setting up listener for pending quotations...');
        console.log('[Procurement Audit] Collection name:', FIRESTORE_COLLECTIONS.QUOTATIONS);

        const quotQuery = query(
            collectionGroup(db, FIRESTORE_COLLECTIONS.QUOTATIONS),
            where('auditStatus', '==', 'pending')
        );

        const unsubscribe = onSnapshot(
            quotQuery,
            async (snapshot) => {
                console.log('[Procurement Audit] Query snapshot received:', snapshot.size, 'documents');
                setQueryError(null);

                const quotations: QuotationWithCase[] = [];

                for (const quotDoc of snapshot.docs) {
                    const quotData = { id: quotDoc.id, ...quotDoc.data() } as CaseQuotation;
                    console.log('[Procurement Audit] Found quotation:', quotDoc.id, quotData);

                    // Get case data
                    const caseRef = doc(db, FIRESTORE_COLLECTIONS.CASES, quotData.caseId);
                    const caseSnap = await getDoc(caseRef);

                    if (caseSnap.exists()) {
                        const caseData = caseSnap.data() as Case;
                        quotations.push({
                            ...quotData,
                            projectName: caseData.title,
                            clientName: caseData.clientName
                        });
                    } else {
                        console.warn('[Procurement Audit] Case not found:', quotData.caseId);
                    }
                }

                console.log('[Procurement Audit] Total pending quotations:', quotations.length);
                setPendingQuotations(quotations);
            },
            (error: { message?: string }) => {
                console.error('[Procurement Audit] Query error:', error);
                const msg = error?.message || String(error);
                setQueryError(msg);
                if (msg.includes('index')) {
                    console.error('[Procurement Audit] Deploy indexes: firebase deploy --only firestore:indexes');
                }
            }
        );

        return () => unsubscribe();
    }, [currentUser]);

    const handleApprove = async (quotation: QuotationWithCase) => {
        if (!currentUser) return;

        const confirmApprove = window.confirm(
            `Approve quotation for ${quotation.projectName}?\n\nTotal: ₹${quotation.grandTotal.toLocaleString('en-IN')}`
        );

        if (!confirmApprove) return;

        setProcessing(true);

        try {
            const batch = writeBatch(db!);

            // 1. Update quotation status to approved
            const quotRef = doc(
                db!,
                FIRESTORE_COLLECTIONS.CASES,
                quotation.caseId,
                FIRESTORE_COLLECTIONS.QUOTATIONS,
                quotation.id
            );

            batch.update(quotRef, {
                auditStatus: 'approved',
                auditedBy: currentUser.id,
                auditedAt: serverTimestamp()
            });

            // 2. Attach quotation PDF to case documents
            if (quotation.pdfUrl) {
                const docRef = doc(
                    collection(db!, FIRESTORE_COLLECTIONS.CASES, quotation.caseId, FIRESTORE_COLLECTIONS.DOCUMENTS)
                );
                batch.set(docRef, {
                    type: 'quotation',
                    caseId: quotation.caseId,
                    name: `Quotation - ${quotation.projectName}`,
                    url: quotation.pdfUrl,
                    fileUrl: quotation.pdfUrl,

                    // Visibility & Approval Logic
                    visibleToClient: true,
                    approvalStatus: 'approved',
                    approvedBy: currentUser.id,
                    approvedAt: serverTimestamp(),

                    uploadedBy: currentUser.id,
                    uploadedAt: serverTimestamp(),
                    quotationId: quotation.id,
                    amount: quotation.grandTotal
                });
            }

            // 3. Log activity
            const activityRef = doc(
                collection(db!, FIRESTORE_COLLECTIONS.CASES, quotation.caseId, FIRESTORE_COLLECTIONS.ACTIVITIES)
            );
            batch.set(activityRef, {
                caseId: quotation.caseId,
                action: `Quotation approved by procurement audit (₹${quotation.grandTotal.toLocaleString('en-IN')})`,
                by: currentUser.id,
                timestamp: serverTimestamp()
            });

            if (quotation.boqId?.trim()) {
                const boqRef = doc(db!, FIRESTORE_COLLECTIONS.CASES, quotation.caseId, FIRESTORE_COLLECTIONS.BOQ, quotation.boqId);
                batch.update(boqRef, { locked: true, referencedByQuotation: quotation.id });
            }

            await batch.commit();

            // 4. Complete PROCUREMENT_AUDIT task (single source of truth: cases/{caseId}/tasks)
            const tasksRef = collection(db!, FIRESTORE_COLLECTIONS.CASES, quotation.caseId, FIRESTORE_COLLECTIONS.TASKS);
            const taskQuery = query(tasksRef, where('type', '==', 'procurement_audit'));
            const taskSnap = await getDocs(taskQuery);
            for (const t of taskSnap.docs) {
                const data = t.data();
                if (data.status === 'pending' || data.status === 'started') {
                    await updateDoc(t.ref, { status: 'completed', completedAt: serverTimestamp() });
                }
            }

            console.log('[Procurement Audit] ✅ Quotation approved:', quotation.id);
            alert('✅ Quotation approved successfully!');
            setSelectedQuotation(null);
        } catch (error) {
            console.error('[Procurement Audit] Error approving:', error);
            alert('Failed to approve quotation. Please try again.');
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = async (quotation: QuotationWithCase) => {
        if (!currentUser) return;

        const reason = window.prompt('Enter reason for rejection:');
        if (!reason || reason.trim() === '') {
            alert('Rejection reason is required');
            return;
        }

        setProcessing(true);

        try {
            // 1. Update quotation status to rejected
            const quotRef = doc(
                db!,
                FIRESTORE_COLLECTIONS.CASES,
                quotation.caseId,
                FIRESTORE_COLLECTIONS.QUOTATIONS,
                quotation.id
            );

            await updateDoc(quotRef, {
                auditStatus: 'rejected',
                auditedBy: currentUser.id,
                auditedAt: serverTimestamp(),
                rejectionReason: reason
            });

            // 2. Log activity
            await addDoc(
                collection(db!, FIRESTORE_COLLECTIONS.CASES, quotation.caseId, FIRESTORE_COLLECTIONS.ACTIVITIES),
                {
                    caseId: quotation.caseId,
                    action: `Quotation rejected by procurement audit. Reason: ${reason}`,
                    by: currentUser.id,
                    timestamp: serverTimestamp()
                }
            );

            console.log('[Procurement Audit] ❌ Quotation rejected:', quotation.id);
            alert('❌ Quotation rejected. Quotation team will be notified.');
            setSelectedQuotation(null);
        } catch (error) {
            console.error('[Procurement Audit] Error rejecting:', error);
            alert('Failed to reject quotation. Please try again.');
        } finally {
            setProcessing(false);
        }
    };

    // List View
    if (!selectedQuotation) {
        return (
            <div className="p-6">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Procurement Audit - Quotations</h1>
                    <p className="text-gray-600 mt-2">Review and approve/reject quotations</p>
                </div>

                {queryError && (
                    <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-amber-800 font-medium">Could not load pending quotations</p>
                        <p className="text-amber-700 text-sm mt-1">{queryError}</p>
                        {queryError.includes('index') && (
                            <p className="text-amber-700 text-sm mt-2">
                                Deploy Firestore indexes: <code className="bg-amber-100 px-1">firebase deploy --only firestore:indexes</code>
                            </p>
                        )}
                    </div>
                )}
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    {queryError ? (
                        <div className="text-center py-12">
                            <p className="text-amber-700">Cannot load list. See the message above and fix the issue (e.g. deploy Firestore indexes).</p>
                        </div>
                    ) : pendingQuotations.length === 0 ? (
                        <div className="text-center py-12">
                            <CheckCircleIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                            <p className="text-gray-500">No quotations pending audit</p>
                            <p className="text-gray-400 text-sm mt-2">Quotation team submits via &quot;Submit to Audit&quot; on a quotation task.</p>
                            <p className="text-gray-400 text-xs mt-1">After submitting, refresh this page. Ensure Firestore index is deployed: <code className="bg-gray-200 px-1 rounded">firebase deploy --only firestore:indexes</code></p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-gradient-to-r from-green-600 to-teal-600 text-white">
                                <tr>
                                    <th className="px-6 py-4 text-left font-semibold">Project</th>
                                    <th className="px-6 py-4 text-left font-semibold">Client</th>
                                    <th className="px-6 py-4 text-right font-semibold">Total Amount</th>
                                    <th className="px-6 py-4 text-left font-semibold">Created</th>
                                    <th className="px-6 py-4 text-center font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pendingQuotations.map((quot, index) => (
                                    <tr key={quot.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                                        <td className="px-6 py-4 font-medium text-gray-900">{quot.projectName}</td>
                                        <td className="px-6 py-4 text-gray-700">{quot.clientName}</td>
                                        <td className="px-6 py-4 text-right font-bold text-green-700">
                                            ₹{quot.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 text-sm">
                                            {new Date(quot.createdAt).toLocaleDateString('en-IN')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center gap-2">
                                                <button
                                                    onClick={() => setSelectedQuotation(quot)}
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
                                                >
                                                    <EyeIcon className="w-4 h-4 inline mr-1" />
                                                    View Details
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        );
    }

    // Detail View with Approve/Reject
    return (
        <div className="p-6">
            <div className="mb-6">
                <button
                    onClick={() => setSelectedQuotation(null)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 mb-4"
                >
                    ← Back to List
                </button>
                <h1 className="text-3xl font-bold text-gray-900">{selectedQuotation.projectName}</h1>
                <p className="text-gray-600 mt-1">Client: {selectedQuotation.clientName}</p>
            </div>

            <div className="grid grid-cols-3 gap-6">
                {/* Quotation Details */}
                <div className="col-span-2 bg-white rounded-xl shadow-md p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <DocumentTextIcon className="w-6 h-6 text-green-600" />
                        Quotation Details
                    </h2>

                    {/* Items Table */}
                    <div className="mb-6 overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-green-100">
                                <tr>
                                    <th className="p-3 text-left">#</th>
                                    <th className="p-3 text-left">Item</th>
                                    <th className="p-3 text-right">Qty</th>
                                    <th className="p-3 text-center">Unit</th>
                                    <th className="p-3 text-right">Rate</th>
                                    <th className="p-3 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedQuotation.items.map((item, index) => (
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
                        </table>
                    </div>

                    {/* Summary */}
                    <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                        <div className="flex justify-between text-sm">
                            <span>Subtotal:</span>
                            <span className="font-medium">₹{selectedQuotation.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between text-sm text-red-600">
                            <span>Discount ({selectedQuotation.discount}%):</span>
                            <span className="font-medium">-₹{selectedQuotation.discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span>GST ({selectedQuotation.taxRate}%):</span>
                            <span className="font-medium">₹{selectedQuotation.taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between pt-3 border-t-2 text-lg font-bold text-green-700">
                            <span>Grand Total:</span>
                            <span>₹{selectedQuotation.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                    </div>

                    {/* Notes */}
                    {selectedQuotation.notes && (
                        <div className="mt-6">
                            <h3 className="font-bold text-gray-900 mb-2">Notes:</h3>
                            <p className="text-gray-700 bg-yellow-50 p-3 rounded-lg">{selectedQuotation.notes}</p>
                        </div>
                    )}
                </div>

                {/* Action Panel */}
                <div className="col-span-1 space-y-4">
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <h3 className="font-bold text-gray-900 mb-4">Audit Actions</h3>

                        <div className="space-y-3">
                            <button
                                onClick={() => handleApprove(selectedQuotation)}
                                disabled={processing}
                                className="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:from-green-700 hover:to-teal-700 font-bold disabled:opacity-50"
                            >
                                <CheckCircleIcon className="w-5 h-5 inline mr-2" />
                                {processing ? 'Processing...' : 'Approve Quotation'}
                            </button>

                            <button
                                onClick={() => handleReject(selectedQuotation)}
                                disabled={processing}
                                className="w-full px-6 py-4 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-lg hover:from-red-700 hover:to-pink-700 font-bold disabled:opacity-50"
                            >
                                <XMarkIcon className="w-5 h-5 inline mr-2" />
                                {processing ? 'Processing...' : 'Reject Quotation'}
                            </button>
                        </div>

                        {/* Info */}
                        <div className="mt-6 p-3 bg-blue-50 rounded-lg text-sm text-blue-900">
                            <p className="font-medium mb-2">What happens next?</p>
                            <ul className="space-y-1 text-xs">
                                <li>✓ <strong>Approve:</strong> PDF attached to project documents, visible to admin for final approval</li>
                                <li>✗ <strong>Reject:</strong> Returns to quotation team for revision</li>
                            </ul>
                        </div>
                    </div>

                    {/* Quotation Info */}
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <h3 className="font-bold text-gray-900 mb-3">Quotation Info</h3>
                        <div className="space-y-2 text-sm">
                            <div>
                                <span className="text-gray-600">ID:</span>
                                <p className="font-mono font-medium">{selectedQuotation.id.slice(-8).toUpperCase()}</p>
                            </div>
                            <div>
                                <span className="text-gray-600">Created:</span>
                                <p className="font-medium">{new Date(selectedQuotation.createdAt).toLocaleString('en-IN')}</p>
                            </div>
                            <div>
                                <span className="text-gray-600">Status:</span>
                                <p>
                                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">
                                        <ClockIcon className="w-3 h-3 inline mr-1" />
                                        PENDING AUDIT
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProcurementAuditPageNew;
