import React, { useState, useEffect } from 'react';
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
    getDoc
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
    PauseCircleIcon
} from '@heroicons/react/24/outline';

interface PaymentRequest {
    id: string;
    caseId: string;
    amount: number;
    method: string;
    utr: string;
    attachmentUrl?: string;
    submittedBy: string;
    submittedByName: string;
    submittedAt: any;
    verified: boolean;
    verifiedAmount?: number;
    verifiedBy?: string;
    verifiedAt?: any;
    status: 'pending' | 'approved' | 'rejected' | 'waiting';
    paymentTerms?: {
        totalProjectValue: number;
        advancePercent: number;
        secondPercent: number;
        finalPercent: number;
        advanceAmount: number;
        secondAmount: number;
        finalAmount: number;
    };
    case?: Case;
}

const PaymentVerificationInbox: React.FC = () => {
    const { currentUser } = useAuth();
    const [payments, setPayments] = useState<PaymentRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPayment, setSelectedPayment] = useState<PaymentRequest | null>(null);
    const [processing, setProcessing] = useState(false);
    const [verifiedAmount, setVerifiedAmount] = useState<number>(0);
    const [rejectionReason, setRejectionReason] = useState('');

    useEffect(() => {
        if (!db) return;

        const paymentsQuery = query(
            collectionGroup(db, FIRESTORE_COLLECTIONS.PAYMENTS),
            where('verified', '==', false)
        );

        const unsubscribe = onSnapshot(paymentsQuery, async (snapshot) => {
            const paymentsList: PaymentRequest[] = [];

            for (const paymentDoc of snapshot.docs) {
                const paymentData = {
                    id: paymentDoc.id,
                    ...paymentDoc.data()
                } as PaymentRequest;

                const pathParts = paymentDoc.ref.path.split('/');
                const caseId = pathParts[1];
                paymentData.caseId = caseId;

                try {
                    const caseRef = doc(db, FIRESTORE_COLLECTIONS.CASES, caseId);
                    const caseSnap = await getDoc(caseRef);
                    if (caseSnap.exists()) {
                        paymentData.case = { id: caseSnap.id, ...caseSnap.data() } as Case;
                    }
                } catch (error) {
                    console.error('[PaymentVerification] Error fetching case:', error);
                }

                paymentsList.push(paymentData);
            }

            console.log('[PaymentVerification] Loaded pending payments:', paymentsList.length);
            setPayments(paymentsList);
            setLoading(false);
        }, (error) => {
            console.error('[PaymentVerification] Error:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleApprove = async () => {
        if (!selectedPayment || !currentUser || !db) return;

        if (verifiedAmount <= 0) {
            alert('Please enter the verified amount received');
            return;
        }

        const confirmApprove = window.confirm(
            `APPROVE Payment Verification?\n\nLead: ${selectedPayment.case?.title}\nClaimed: ${formatCurrencyINR(selectedPayment.amount)}\nVerified: ${formatCurrencyINR(verifiedAmount)}\n\nThis will make lead eligible for project conversion.`
        );

        if (!confirmApprove) return;

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
                verified: true,
                verifiedAmount: verifiedAmount,
                verifiedBy: currentUser.id,
                verifiedByName: currentUser.name,
                verifiedAt: serverTimestamp(),
                status: 'approved'
            });

            const caseRef = doc(db, FIRESTORE_COLLECTIONS.CASES, selectedPayment.caseId);
            batch.update(caseRef, {
                status: CaseStatus.WAITING_FOR_PLANNING,
                'financial.advanceAmount': verifiedAmount,
                'financial.paymentVerified': true,
                'financial.verifiedAt': serverTimestamp(),
                'financial.verifiedBy': currentUser.id,
                updatedAt: serverTimestamp()
            });

            const activityRef = doc(collection(db, FIRESTORE_COLLECTIONS.CASES, selectedPayment.caseId, FIRESTORE_COLLECTIONS.ACTIVITIES));
            batch.set(activityRef, {
                caseId: selectedPayment.caseId,
                action: `Payment VERIFIED: ${formatCurrencyINR(verifiedAmount)} via ${selectedPayment.method} (UTR: ${selectedPayment.utr})`,
                by: currentUser.id,
                timestamp: serverTimestamp()
            });

            if (selectedPayment.case?.organizationId) {
                const ledgerRef = doc(collection(db, FIRESTORE_COLLECTIONS.ORGANIZATIONS, selectedPayment.case.organizationId, FIRESTORE_COLLECTIONS.GENERAL_LEDGER));
                batch.set(ledgerRef, {
                    type: 'INFLOW',
                    category: 'ADVANCE_PAYMENT',
                    amount: verifiedAmount,
                    caseId: selectedPayment.caseId,
                    caseTitle: selectedPayment.case?.title,
                    clientName: selectedPayment.case?.clientName,
                    paymentMethod: selectedPayment.method,
                    utr: selectedPayment.utr,
                    verifiedBy: currentUser.id,
                    createdAt: serverTimestamp(),
                    description: `Advance payment from ${selectedPayment.case?.clientName}`
                });
            }

            await batch.commit();

            alert(`Payment VERIFIED! ${selectedPayment.case?.title} is now eligible for project conversion.`);
            setSelectedPayment(null);
            setVerifiedAmount(0);

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
                status: 'rejected',
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

            // Update payment status to 'waiting'
            const paymentRef = doc(
                db,
                FIRESTORE_COLLECTIONS.CASES,
                selectedPayment.caseId,
                FIRESTORE_COLLECTIONS.PAYMENTS,
                selectedPayment.id
            );
            batch.update(paymentRef, {
                status: 'waiting',
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
                <div className="flex items-center gap-2 bg-orange-100 px-4 py-2 rounded-lg">
                    <BanknotesIcon className="w-6 h-6 text-orange-600" />
                    <span className="font-bold text-orange-800">{payments.filter(p => p.status === 'pending').length} Pending</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-4">
                        <h2 className="text-xl font-bold text-white">Pending Verification</h2>
                    </div>

                    <div className="max-h-[600px] overflow-y-auto">
                        {payments.length === 0 ? (
                            <div className="p-12 text-center">
                                <CheckCircleIcon className="w-16 h-16 text-green-400 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-gray-900 mb-2">All Caught Up!</h3>
                                <p className="text-gray-600">No pending payment verifications</p>
                            </div>
                        ) : (
                            <div className="divide-y">
                                {payments.map(payment => (
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
                                                payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                payment.status === 'waiting' ? 'bg-blue-100 text-blue-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                                {payment.status.toUpperCase()}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between text-sm">
                                            <div>
                                                <span className="text-gray-500">Amount: </span>
                                                <span className="font-bold text-green-600">{formatCurrencyINR(payment.amount)}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Method: </span>
                                                <span className="font-medium">{payment.method}</span>
                                            </div>
                                        </div>

                                        <div className="mt-2 text-xs text-gray-500">
                                            UTR: {payment.utr} | Submitted: {formatDate(payment.submittedAt)}
                                        </div>
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
                                            <p className="text-xl font-bold text-green-800">{selectedPayment.method}</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-green-200">
                                        <span className="text-green-700 text-sm">UTR / Reference</span>
                                        <p className="text-lg font-mono font-bold text-green-800">{selectedPayment.utr}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                                    <UserIcon className="w-8 h-8 text-blue-600" />
                                    <div>
                                        <p className="text-sm text-blue-700">Submitted by</p>
                                        <p className="font-bold text-blue-900">{selectedPayment.submittedByName}</p>
                                        <p className="text-xs text-blue-600">{formatDate(selectedPayment.submittedAt)}</p>
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
        </div>
    );
};

export default PaymentVerificationInbox;
