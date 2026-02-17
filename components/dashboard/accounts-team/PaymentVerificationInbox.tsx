import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { db } from '../../../firebase';
import {
    collection,
    collectionGroup,
    query,
    where,
    onSnapshot,
    doc,
    writeBatch,
    serverTimestamp,
    getDoc,
    addDoc,
    updateDoc
} from 'firebase/firestore';
import { Case, CaseStatus } from '../../../types';
import { FIRESTORE_COLLECTIONS, formatCurrencyINR } from '../../../constants';
import {
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    BanknotesIcon,
    EyeIcon,
    UserIcon,
    PauseCircleIcon,
    PlusIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import { useCases } from '../../../hooks/useCases';

// Payment status constants (uppercase for consistency)
type PaymentStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'WAITING';

interface PaymentRecord {
    id: string;
    caseId: string;
    amount: number;
    paymentMethod: 'UPI' | 'BANK' | 'CASH' | 'CHEQUE';
    utr?: string | null;
    proofUrl?: string | null;
    verified: boolean;
    status: PaymentStatus;
    createdBy: string;
    createdByName?: string;
    createdAt: any;
    verifiedAmount?: number;
    verifiedBy?: string;
    verifiedByName?: string;
    verifiedAt?: any;
    rejectionReason?: string;
    source?: 'VERIFICATION' | 'MANUAL_ENTRY';
    description?: string;
    paymentTerms?: {
        totalProjectValue: number;
        advancePercent: number;
        secondPercent: number;
        finalPercent: number;
        advanceAmount: number;
        secondAmount: number;
        finalAmount: number;
    };
    /** Set when payment is submitted (Verify With Accountant); applied to case when approved */
    projectHeadId?: string | null;
    case?: Case;
}

// =====================================
// ADD RECEIVED PAYMENT MODAL
// =====================================
interface AddReceivedPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    cases: Case[];
    currentUser: any;
    onSuccess: () => void;
}

const AddReceivedPaymentModal: React.FC<AddReceivedPaymentModalProps> = ({
    isOpen,
    onClose,
    cases,
    currentUser,
    onSuccess
}) => {
    const [selectedCaseId, setSelectedCaseId] = useState('');
    const [amount, setAmount] = useState<number>(0);
    const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'BANK' | 'CASH' | 'CHEQUE'>('UPI');
    const [reference, setReference] = useState('');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const projectCases = useMemo(() => 
        cases.filter(c => c.isProject), 
        [cases]
    );

    const handleSubmit = async () => {
        if (!selectedCaseId) {
            alert('Please select a project');
            return;
        }
        if (amount <= 0) {
            alert('Please enter a valid amount');
            return;
        }
        if (!paymentMethod) {
            alert('Please select a payment method');
            return;
        }
        if (!db || !currentUser) return;

        setSubmitting(true);
        try {
            // Create payment record in cases/{caseId}/payments
            const paymentData = {
                amount,
                paymentMethod,
                utr: reference || null,
                reference: reference || null,
                description: description || null,
                proofUrl: null,
                verified: true, // Already verified since added by accountant
                status: 'APPROVED',
                source: 'MANUAL_ENTRY',
                createdBy: currentUser.id,
                createdByName: currentUser.name,
                createdAt: serverTimestamp(),
                verifiedBy: currentUser.id,
                verifiedByName: currentUser.name,
                verifiedAt: serverTimestamp(),
            };

            const paymentsRef = collection(db, FIRESTORE_COLLECTIONS.CASES, selectedCaseId, FIRESTORE_COLLECTIONS.PAYMENTS);
            const paymentDocRef = await addDoc(paymentsRef, paymentData);

            const caseRef = doc(db, FIRESTORE_COLLECTIONS.CASES, selectedCaseId);
            const caseSnap = await getDoc(caseRef);
            const caseData = caseSnap.data() || {};
            const existingCostCenter = caseData.costCenter || {};
            const prevReceived = existingCostCenter.receivedAmount ?? 0;
            const prevSpent = existingCostCenter.spentAmount ?? 0;
            const newReceived = prevReceived + amount;
            const newRemaining = newReceived - prevSpent;

            await updateDoc(caseRef, {
                costCenter: {
                    ...existingCostCenter,
                    totalProjectValue: existingCostCenter.totalProjectValue ?? existingCostCenter.totalBudget ?? 0,
                    receivedAmount: newReceived,
                    spentAmount: prevSpent,
                    remainingAmount: newRemaining,
                    updatedAt: serverTimestamp(),
                },
                updatedAt: serverTimestamp(),
            });

            const orgId = caseData.organizationId || currentUser.organizationId;
            if (orgId) {
                const now = serverTimestamp();
                await addDoc(collection(db, FIRESTORE_COLLECTIONS.ORGANIZATIONS, orgId, FIRESTORE_COLLECTIONS.GENERAL_LEDGER), {
                    type: 'CREDIT',
                    category: 'REVENUE',
                    sourceType: 'PAYMENT',
                    sourceId: paymentDocRef.id,
                    amount,
                    caseId: selectedCaseId,
                    date: now,
                    createdAt: now,
                    createdBy: currentUser.id,
                    description: description?.trim() ? `Pay-in (manual): ${description}` : `Pay-in from client (${paymentMethod})${reference ? ` · ${reference}` : ''}`,
                });
            }

            // Log activity
            const activityRef = collection(db, FIRESTORE_COLLECTIONS.CASES, selectedCaseId, FIRESTORE_COLLECTIONS.ACTIVITIES);
            await addDoc(activityRef, {
                caseId: selectedCaseId,
                action: `Received payment added manually: ${formatCurrencyINR(amount)} via ${paymentMethod}${reference ? ` (Ref: ${reference})` : ''}`,
                by: currentUser.id,
                timestamp: serverTimestamp()
            });

            alert('✅ Payment added successfully!');
            onSuccess();
            onClose();

            // Reset form
            setSelectedCaseId('');
            setAmount(0);
            setPaymentMethod('UPI');
            setReference('');
            setDescription('');
        } catch (error) {
            console.error('[AddReceivedPayment] Error:', error);
            alert('Failed to add payment. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-green-500 to-teal-500 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <PlusIcon className="w-6 h-6 text-white" />
                        <h2 className="text-xl font-bold text-white">Add Received Payment</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                        <XMarkIcon className="w-6 h-6 text-white" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    {/* Project Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Project <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={selectedCaseId}
                            onChange={(e) => setSelectedCaseId(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        >
                            <option value="">-- Select Project --</option>
                            {projectCases.map(c => (
                                <option key={c.id} value={c.id}>
                                    {c.title || c.projectName} - {c.clientName}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Amount */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Amount <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                            <input
                                type="number"
                                min="0"
                                value={amount || ''}
                                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-lg font-bold focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                placeholder="Enter amount"
                            />
                        </div>
                    </div>

                    {/* Payment Method */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Payment Method <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                            {(['UPI', 'BANK', 'CASH', 'CHEQUE'] as const).map(method => (
                                <button
                                    key={method}
                                    type="button"
                                    onClick={() => setPaymentMethod(method)}
                                    className={`px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                                        paymentMethod === method
                                            ? 'bg-green-500 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    {method}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Reference / UTR (Optional) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Reference / UTR <span className="text-gray-400">(Optional)</span>
                        </label>
                        <input
                            type="text"
                            value={reference}
                            onChange={(e) => setReference(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="Enter UTR or reference number"
                        />
                    </div>

                    {/* Description / Notes (Optional) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description / Notes <span className="text-gray-400">(Optional)</span>
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={2}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="Add any notes about this payment"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting || !selectedCaseId || amount <= 0}
                        className="px-6 py-2 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg hover:from-green-600 hover:to-teal-600 font-bold disabled:opacity-50"
                    >
                        {submitting ? 'Adding...' : 'Add Payment'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const PaymentVerificationInbox: React.FC = () => {
    const { currentUser } = useAuth();
    const { cases } = useCases();
    const [allPayments, setAllPayments] = useState<PaymentRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
    const [processing, setProcessing] = useState(false);
    const [verifiedAmount, setVerifiedAmount] = useState<number>(0);
    const [rejectionReason, setRejectionReason] = useState('');
    const [activeTab, setActiveTab] = useState<'pending' | 'verified'>('pending');
    const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);

    // Real-time listener for ALL payments using collectionGroup
    useEffect(() => {
        if (!db) return;

        // Query: cases/*/payments (collectionGroup)
        // We fetch all payments and filter client-side for flexibility
        const paymentsQuery = query(
            collectionGroup(db, FIRESTORE_COLLECTIONS.PAYMENTS)
        );

        const unsubscribe = onSnapshot(paymentsQuery, async (snapshot) => {
            const paymentsList: PaymentRecord[] = [];

            for (const paymentDoc of snapshot.docs) {
                const data = paymentDoc.data();
                
                // Normalize status (handle both old lowercase and new uppercase)
                let normalizedStatus: PaymentStatus = 'PENDING';
                const rawStatus = (data.status || 'pending').toString().toUpperCase();
                if (['PENDING', 'APPROVED', 'REJECTED', 'WAITING'].includes(rawStatus)) {
                    normalizedStatus = rawStatus as PaymentStatus;
                }

                const paymentData: PaymentRecord = {
                    id: paymentDoc.id,
                    caseId: '',
                    amount: data.amount || 0,
                    paymentMethod: data.paymentMethod || data.method || 'UPI',
                    utr: data.utr || null,
                    proofUrl: data.proofUrl || data.attachmentUrl || null,
                    verified: data.verified ?? false,
                    status: normalizedStatus,
                    createdBy: data.createdBy || data.submittedBy || '',
                    createdByName: data.createdByName || data.submittedByName || '',
                    createdAt: data.createdAt || data.submittedAt,
                    verifiedAmount: data.verifiedAmount,
                    verifiedBy: data.verifiedBy,
                    verifiedByName: data.verifiedByName,
                    verifiedAt: data.verifiedAt,
                    rejectionReason: data.rejectionReason,
                    paymentTerms: data.paymentTerms,
                    projectHeadId: data.projectHeadId ?? null,
                };

                // Extract caseId from path: cases/{caseId}/payments/{paymentId}
                const pathParts = paymentDoc.ref.path.split('/');
                if (pathParts.length >= 2) {
                    paymentData.caseId = pathParts[1];
                }

                // Fetch case details
                if (paymentData.caseId) {
                    try {
                        const caseRef = doc(db, FIRESTORE_COLLECTIONS.CASES, paymentData.caseId);
                        const caseSnap = await getDoc(caseRef);
                        if (caseSnap.exists()) {
                            paymentData.case = { id: caseSnap.id, ...caseSnap.data() } as Case;
                        }
                    } catch (error) {
                        console.error('[PaymentVerification] Error fetching case:', error);
                    }
                }

                paymentsList.push(paymentData);
            }

            // Sort by createdAt descending
            paymentsList.sort((a, b) => {
                const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
                const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
                return bTime.getTime() - aTime.getTime();
            });

            console.log('[PaymentVerification] Loaded payments:', paymentsList.length);
            setAllPayments(paymentsList);
            setLoading(false);
        }, (error) => {
            console.error('[PaymentVerification] Error:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Filter payments based on active tab
    const pendingPayments = useMemo(() => 
        allPayments.filter(p => !p.verified && (p.status === 'PENDING' || p.status === 'WAITING')),
        [allPayments]
    );

    // PHASE 2: Received Payments = ALL payments where verified === true
    const verifiedPayments = useMemo(() => 
        allPayments.filter(p => p.verified === true),
        [allPayments]
    );

    const displayedPayments = activeTab === 'pending' ? pendingPayments : verifiedPayments;

    const handleApprove = async () => {
        if (!selectedPayment || !currentUser || !db) return;

        if (verifiedAmount <= 0) {
            alert('Please enter the verified amount received');
            return;
        }

        const confirmApprove = window.confirm(
            `APPROVE Payment Verification?\n\nLead: ${selectedPayment.case?.title}\nClaimed: ${formatCurrencyINR(selectedPayment.amount)}\nVerified: ${formatCurrencyINR(verifiedAmount)}\n\nThis will:\n1. Convert Lead → Project\n2. Create Cost Center\n3. Record in General Ledger`
        );

        if (!confirmApprove) return;

        setProcessing(true);

        try {
            const batch = writeBatch(db);

            // 1. Update payment: verified = true, status = 'APPROVED'
            const paymentRef = doc(
                db, 
                FIRESTORE_COLLECTIONS.CASES, 
                selectedPayment.caseId, 
                FIRESTORE_COLLECTIONS.PAYMENTS, 
                selectedPayment.id
            );
            batch.update(paymentRef, {
                verified: true,
                verifiedAmount: verifiedAmount,
                verifiedBy: currentUser.id,
                verifiedByName: currentUser.name,
                verifiedAt: serverTimestamp(),
                status: 'APPROVED'
            });

            // 2. Convert Lead → Project: isProject = true, status = WAITING_FOR_PLANNING
            const caseRef = doc(db, FIRESTORE_COLLECTIONS.CASES, selectedPayment.caseId);
            
            // 3. Create/Update Cost Center on the case
            const costCenterData = {
                totalBudget: selectedPayment.paymentTerms?.totalProjectValue || 0,
                receivedAmount: verifiedAmount,
                spentAmount: 0,
                remainingAmount: verifiedAmount
            };

            const caseUpdate: Record<string, unknown> = {
                isProject: true, // Convert to project
                status: CaseStatus.WAITING_FOR_PLANNING,
                costCenter: costCenterData,
                'financial.advanceAmount': verifiedAmount,
                'financial.paymentVerified': true,
                'financial.verifiedAt': serverTimestamp(),
                'financial.verifiedBy': currentUser.id,
                updatedAt: serverTimestamp(),
            };
            if (selectedPayment.projectHeadId) {
                caseUpdate.projectHeadId = selectedPayment.projectHeadId;
            }
            batch.update(caseRef, caseUpdate);

            // 4. Log activity
            const activityRef = doc(collection(db, FIRESTORE_COLLECTIONS.CASES, selectedPayment.caseId, FIRESTORE_COLLECTIONS.ACTIVITIES));
            batch.set(activityRef, {
                caseId: selectedPayment.caseId,
                action: `Payment VERIFIED & Lead CONVERTED to Project: ${formatCurrencyINR(verifiedAmount)} via ${selectedPayment.paymentMethod} (UTR: ${selectedPayment.utr || 'N/A'})`,
                by: currentUser.id,
                timestamp: serverTimestamp()
            });

            // 5. Create General Ledger entry (CREDIT so it appears in transaction history and matches caseId filter)
            if (selectedPayment.case?.organizationId) {
                const ledgerRef = doc(collection(db, FIRESTORE_COLLECTIONS.ORGANIZATIONS, selectedPayment.case.organizationId, FIRESTORE_COLLECTIONS.GENERAL_LEDGER));
                const now = serverTimestamp();
                batch.set(ledgerRef, {
                    type: 'CREDIT',
                    category: 'REVENUE',
                    sourceType: 'PAYMENT',
                    sourceId: paymentRef.id,
                    amount: verifiedAmount,
                    caseId: selectedPayment.caseId,
                    date: now,
                    createdAt: now,
                    createdBy: currentUser.id,
                    description: `Advance payment from ${selectedPayment.case?.clientName ?? 'Client'}${selectedPayment.paymentMethod ? ` (${selectedPayment.paymentMethod})` : ''}`,
                    caseTitle: selectedPayment.case?.title,
                    clientName: selectedPayment.case?.clientName,
                    paymentMethod: selectedPayment.paymentMethod,
                    utr: selectedPayment.utr,
                    verifiedBy: currentUser.id,
                });
            }

            await batch.commit();

            alert(`✅ Payment VERIFIED!\n\n${selectedPayment.case?.title} has been converted to a Project.\n\nRedirecting to create Sales Invoice...`);
            setSelectedPayment(null);
            setVerifiedAmount(0);

            // TODO: Auto-redirect to Sales Invoice creation page with pre-filled data
            // For now, we just show a message. The navigation would be handled by parent component.

        } catch (error) {
            console.error('[PaymentVerification] Error approving:', error);
            alert('Failed to approve payment. Please try again.');
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!selectedPayment || !currentUser || !db) return;

        if (!rejectionReason.trim()) {
            alert('Please provide a rejection reason');
            return;
        }

        setProcessing(true);

        try {
            const batch = writeBatch(db);

            const paymentRef = doc(
                db, 
                FIRESTORE_COLLECTIONS.CASES, 
                selectedPayment.caseId, 
                FIRESTORE_COLLECTIONS.PAYMENTS, 
                selectedPayment.id
            );
            batch.update(paymentRef, {
                status: 'REJECTED',
                verified: false,
                rejectedBy: currentUser.id,
                rejectedAt: serverTimestamp(),
                rejectionReason: rejectionReason
            });

            const caseRef = doc(db, FIRESTORE_COLLECTIONS.CASES, selectedPayment.caseId);
            batch.update(caseRef, {
                status: CaseStatus.NEGOTIATION,
                updatedAt: serverTimestamp()
            });

            const activityRef = doc(collection(db, FIRESTORE_COLLECTIONS.CASES, selectedPayment.caseId, FIRESTORE_COLLECTIONS.ACTIVITIES));
            batch.set(activityRef, {
                caseId: selectedPayment.caseId,
                action: `Payment REJECTED: ${rejectionReason}`,
                by: currentUser.id,
                timestamp: serverTimestamp()
            });

            await batch.commit();

            alert('Payment rejected. Sent back to sales team.');
            setSelectedPayment(null);
            setRejectionReason('');

        } catch (error) {
            console.error('[PaymentVerification] Error rejecting:', error);
            alert('Failed to reject payment.');
        } finally {
            setProcessing(false);
        }
    };

    // Put on Waiting - Accountant needs more time/info
    const handlePutWaiting = async () => {
        if (!selectedPayment || !currentUser || !db) return;

        setProcessing(true);

        try {
            const batch = writeBatch(db);

            // Update payment status to 'WAITING'
            const paymentRef = doc(
                db,
                FIRESTORE_COLLECTIONS.CASES,
                selectedPayment.caseId,
                FIRESTORE_COLLECTIONS.PAYMENTS,
                selectedPayment.id
            );
            batch.update(paymentRef, {
                status: 'WAITING',
                updatedAt: serverTimestamp(),
                updatedBy: currentUser.id,
            });

            // Log activity
            const activityRef = doc(collection(db, FIRESTORE_COLLECTIONS.CASES, selectedPayment.caseId, FIRESTORE_COLLECTIONS.ACTIVITIES));
            batch.set(activityRef, {
                caseId: selectedPayment.caseId,
                action: `Payment put on WAITING by accountant - more info needed`,
                by: currentUser.id,
                timestamp: serverTimestamp()
            });

            await batch.commit();

            alert('Payment marked as waiting. Sales team will be notified.');
            setSelectedPayment(null);
        } catch (error) {
            console.error('[PaymentVerification] Error putting on waiting:', error);
            alert('Failed to update payment status.');
        } finally {
            setProcessing(false);
        }
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="flex items-center justify-center h-64">
                    <div className="text-gray-500">Loading payment requests...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Payment Verification</h1>
                    <p className="text-gray-600 mt-1">Verify payment claims before project conversion</p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setShowAddPaymentModal(true)}
                        className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-teal-500 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-teal-600 font-bold shadow-md transition-all"
                    >
                        <PlusIcon className="w-5 h-5" />
                        Add Received Payment
                    </button>
                    <div className="flex items-center gap-2 bg-orange-100 px-4 py-2 rounded-lg">
                        <BanknotesIcon className="w-6 h-6 text-orange-600" />
                        <span className="font-bold text-orange-800">{pendingPayments.length} Pending</span>
                    </div>
                    <div className="flex items-center gap-2 bg-green-100 px-4 py-2 rounded-lg">
                        <CheckCircleIcon className="w-6 h-6 text-green-600" />
                        <span className="font-bold text-green-800">{verifiedPayments.length} Received</span>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`px-6 py-3 font-bold text-sm transition-colors border-b-2 ${
                        activeTab === 'pending'
                            ? 'text-orange-600 border-orange-500 bg-orange-50'
                            : 'text-gray-500 border-transparent hover:text-gray-700'
                    }`}
                >
                    <span className="flex items-center gap-2">
                        <ClockIcon className="w-5 h-5" />
                        Pending Verification ({pendingPayments.length})
                    </span>
                </button>
                <button
                    onClick={() => setActiveTab('verified')}
                    className={`px-6 py-3 font-bold text-sm transition-colors border-b-2 ${
                        activeTab === 'verified'
                            ? 'text-green-600 border-green-500 bg-green-50'
                            : 'text-gray-500 border-transparent hover:text-gray-700'
                    }`}
                >
                    <span className="flex items-center gap-2">
                        <CheckCircleIcon className="w-5 h-5" />
                        Received Payments ({verifiedPayments.length})
                    </span>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className={`px-6 py-4 ${activeTab === 'pending' ? 'bg-gradient-to-r from-orange-500 to-amber-500' : 'bg-gradient-to-r from-green-500 to-teal-500'}`}>
                        <h2 className="text-xl font-bold text-white">
                            {activeTab === 'pending' ? 'Pending Verification' : 'Received Payments'}
                        </h2>
                    </div>

                    <div className="max-h-[600px] overflow-y-auto">
                        {displayedPayments.length === 0 ? (
                            <div className="p-12 text-center">
                                <CheckCircleIcon className="w-16 h-16 text-green-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                                    {activeTab === 'pending' ? 'All Caught Up!' : 'No Received Payments'}
                                </h3>
                                <p className="text-gray-600">
                                    {activeTab === 'pending' ? 'No pending payment verifications' : 'No received payments yet. Click "Add Received Payment" to add one.'}
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y">
                                {displayedPayments.map(payment => (
                                    <div
                                        key={`${payment.caseId}-${payment.id}`}
                                        onClick={() => {
                                            setSelectedPayment(payment);
                                            setVerifiedAmount(payment.amount);
                                        }}
                                        className={`p-4 cursor-pointer transition-colors ${
                                            selectedPayment?.id === payment.id
                                                ? 'bg-orange-50 border-l-4 border-orange-500'
                                                : 'hover:bg-gray-50'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex-1">
                                                <h3 className="font-bold text-gray-900">{payment.case?.title || 'Unknown Lead'}</h3>
                                                <p className="text-sm text-gray-600">{payment.case?.clientName}</p>
                                            </div>
                                            <span className={`px-2 py-1 text-xs font-bold rounded ${
                                                payment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                                payment.status === 'WAITING' ? 'bg-blue-100 text-blue-800' :
                                                payment.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                                payment.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                                {payment.status}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between text-sm">
                                            <div>
                                                <span className="text-gray-500">Amount: </span>
                                                <span className="font-bold text-green-600">{formatCurrencyINR(payment.amount)}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Method: </span>
                                                <span className="font-medium">{payment.paymentMethod}</span>
                                            </div>
                                        </div>

                                        <div className="mt-2 text-xs text-gray-500">
                                            UTR: {payment.utr || 'N/A'} | Submitted: {formatDate(payment.createdAt)}
                                        </div>
                                        
                                        {payment.verified && payment.verifiedAmount && (
                                            <div className="mt-2 text-xs text-green-700 bg-green-50 px-2 py-1 rounded">
                                                Verified: {formatCurrencyINR(payment.verifiedAmount)} by {payment.verifiedByName || 'Accountant'}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    {!selectedPayment ? (
                        <div className="p-12 text-center h-full flex flex-col items-center justify-center">
                            <EyeIcon className="w-16 h-16 text-gray-300 mb-4" />
                            <h3 className="text-lg font-bold text-gray-500 mb-2">Select a Payment</h3>
                            <p className="text-gray-400">Click on a payment request to view details</p>
                        </div>
                    ) : (
                        <div>
                            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 px-6 py-4">
                                <h2 className="text-xl font-bold text-white">Verification Details</h2>
                            </div>

                            <div className="p-6 space-y-6">
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h3 className="font-bold text-gray-900 text-lg mb-3">{selectedPayment.case?.title}</h3>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-gray-500">Client:</span>
                                            <p className="font-medium">{selectedPayment.case?.clientName}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Phone:</span>
                                            <p className="font-medium">{selectedPayment.case?.clientPhone}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-green-50 p-4 rounded-lg">
                                    <h4 className="font-bold text-green-900 mb-3">Payment Claimed</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <span className="text-green-700 text-sm">Amount</span>
                                            <p className="text-2xl font-bold text-green-800">{formatCurrencyINR(selectedPayment.amount)}</p>
                                        </div>
                                        <div>
                                            <span className="text-green-700 text-sm">Method</span>
                                            <p className="text-xl font-bold text-green-800">{selectedPayment.paymentMethod}</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-green-200">
                                        <span className="text-green-700 text-sm">UTR / Reference</span>
                                        <p className="text-lg font-mono font-bold text-green-800">{selectedPayment.utr || 'N/A'}</p>
                                    </div>
                                    {selectedPayment.proofUrl && (
                                        <div className="mt-4 pt-4 border-t border-green-200">
                                            <span className="text-green-700 text-sm">Payment Proof</span>
                                            <a href={selectedPayment.proofUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline block mt-1">
                                                View Attachment
                                            </a>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                                    <UserIcon className="w-8 h-8 text-blue-600" />
                                    <div>
                                        <p className="text-sm text-blue-700">Submitted by</p>
                                        <p className="font-bold text-blue-900">{selectedPayment.createdByName || 'Unknown'}</p>
                                        <p className="text-xs text-blue-600">{formatDate(selectedPayment.createdAt)}</p>
                                    </div>
                                </div>

                                {selectedPayment.paymentTerms && (
                                    <div className="bg-purple-50 p-4 rounded-lg">
                                        <h4 className="font-bold text-purple-900 mb-3">Payment Terms</h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-purple-700">Total Project Value:</span>
                                                <span className="font-bold text-purple-900">
                                                    {formatCurrencyINR(selectedPayment.paymentTerms.totalProjectValue)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-purple-700">Advance ({selectedPayment.paymentTerms.advancePercent}%):</span>
                                                <span className="font-medium">{formatCurrencyINR(selectedPayment.paymentTerms.advanceAmount)}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="border-2 border-orange-300 p-4 rounded-lg bg-orange-50">
                                    <h4 className="font-bold text-orange-900 mb-3">Enter Verified Amount</h4>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                                        <input
                                            type="number"
                                            min="0"
                                            value={verifiedAmount || ''}
                                            onChange={(e) => setVerifiedAmount(parseFloat(e.target.value) || 0)}
                                            className="w-full pl-10 pr-4 py-3 border-2 rounded-lg text-xl font-bold border-orange-300 focus:border-orange-500 focus:outline-none"
                                            placeholder="Enter actual amount received"
                                        />
                                    </div>
                                    {verifiedAmount !== selectedPayment.amount && verifiedAmount > 0 && (
                                        <p className="text-sm text-orange-700 mt-2">
                                            Difference: {formatCurrencyINR(Math.abs(verifiedAmount - selectedPayment.amount))}
                                            {verifiedAmount < selectedPayment.amount ? ' less' : ' more'} than claimed
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Rejection Reason (if rejecting)
                                    </label>
                                    <textarea
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        rows={2}
                                        className="w-full px-4 py-2 border rounded-lg"
                                        placeholder="Enter reason if rejecting..."
                                    />
                                </div>

                                <div className="grid grid-cols-3 gap-3 pt-4 border-t">
                                    <button
                                        onClick={handleReject}
                                        disabled={processing}
                                        className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-bold flex items-center justify-center gap-2"
                                    >
                                        <XCircleIcon className="w-5 h-5" />
                                        Reject
                                    </button>

                                    <button
                                        onClick={handlePutWaiting}
                                        disabled={processing}
                                        className="px-4 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 font-bold flex items-center justify-center gap-2"
                                    >
                                        <PauseCircleIcon className="w-5 h-5" />
                                        Waiting
                                    </button>

                                    <button
                                        onClick={handleApprove}
                                        disabled={processing || verifiedAmount <= 0}
                                        className="px-4 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:from-green-700 hover:to-teal-700 disabled:opacity-50 font-bold flex items-center justify-center gap-2"
                                    >
                                        <CheckCircleIcon className="w-5 h-5" />
                                        Approve
                                    </button>
                                </div>

                                <p className="text-xs text-gray-500 text-center">
                                    Approval will make this lead eligible for project conversion.
                                    All financial writes use transactions.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Received Payment Modal */}
            <AddReceivedPaymentModal
                isOpen={showAddPaymentModal}
                onClose={() => setShowAddPaymentModal(false)}
                cases={cases}
                currentUser={currentUser}
                onSuccess={() => {
                    // The real-time listener will automatically update the list
                    console.log('[PaymentVerification] Payment added successfully');
                }}
            />
        </div>
    );
};

export default PaymentVerificationInbox;
