/**
 * VERIFY WITH ACCOUNTANT MODAL
 * 
 * CRITICAL: Payment-Gated Project Creation
 * 
 * Flow:
 * 1. User selects a lead (cases where isProject=false AND status != WAITING_FOR_PAYMENT)
 * 2. User enters payment details (method, UTR, amount, receipt)
 * 3. User enters payment terms (total value, installments)
 * 4. Submit creates PAYMENT REQUEST (not project!)
 * 5. Case status → WAITING_FOR_PAYMENT
 * 6. Accountant must approve before conversion
 * 
 * HARD RULES:
 * - NO project created before accountant approval
 * - NO execution before payment verification
 * - NO bypass, NO manual override
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { db } from '../../../firebase';
import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    updateDoc,
    doc,
    serverTimestamp,
    writeBatch
} from 'firebase/firestore';
import { Case, CaseStatus, UserRole, StaffUser } from '../../../types';
import { FIRESTORE_COLLECTIONS, formatCurrencyINR } from '../../../constants';
import { createNotification } from '../../../services/notificationService';
import { useUsers } from '../../../hooks/useUsers';
import {
    XMarkIcon,
    BanknotesIcon,
    DocumentTextIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    CurrencyRupeeIcon,
    CloudArrowUpIcon
} from '@heroicons/react/24/outline';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    organizationId: string;
    onSubmitSuccess?: () => void;
}

interface PaymentDetails {
    method: 'UPI' | 'BANK' | 'CASH' | 'CHEQUE' | '';
    utr: string;
    amount: number;
    attachmentUrl: string;
}

interface PaymentTerms {
    totalProjectValue: number;
    advancePercent: number;
    secondPercent: number;
    finalPercent: number;
}

const VerifyWithAccountantModal: React.FC<Props> = ({
    isOpen,
    onClose,
    organizationId,
    onSubmitSuccess
}) => {
    const { currentUser } = useAuth();
    const { users } = useUsers();

    // Step control
    const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

    // Step 1: Lead Selection
    const [availableLeads, setAvailableLeads] = useState<Case[]>([]);
    const [selectedLead, setSelectedLead] = useState<Case | null>(null);
    const [loadingLeads, setLoadingLeads] = useState(true);

    // Project Head (for when lead converts to project)
    const [projectHeadId, setProjectHeadId] = useState('');

    // Step 2: Payment Details
    const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({
        method: '',
        utr: '',
        amount: 0,
        attachmentUrl: ''
    });

    // Step 3: Payment Terms
    const [paymentTerms, setPaymentTerms] = useState<PaymentTerms>({
        totalProjectValue: 0,
        advancePercent: 30,
        secondPercent: 40,
        finalPercent: 30
    });

    const [submitting, setSubmitting] = useState(false);
    const [uploadingReceipt, setUploadingReceipt] = useState(false);

    // Fetch eligible leads
    useEffect(() => {
        const fetchLeads = async () => {
            if (!db || !isOpen) return;

            setLoadingLeads(true);
            try {
                const casesRef = collection(db, FIRESTORE_COLLECTIONS.CASES);
                
                // Fetch cases where isProject=false
                // We'll filter out WAITING_FOR_PAYMENT status client-side
                const q = query(
                    casesRef,
                    where('isProject', '==', false)
                );

                const snapshot = await getDocs(q);
                const leads = snapshot.docs
                    .map(doc => ({ id: doc.id, ...doc.data() } as Case))
                    .filter(lead => 
                        lead.status !== CaseStatus.WAITING_FOR_PAYMENT &&
                        lead.status !== CaseStatus.WAITING_FOR_PLANNING
                    );

                console.log('[VerifyWithAccountant] Eligible leads:', leads.length);
                setAvailableLeads(leads);
            } catch (error) {
                console.error('[VerifyWithAccountant] Error fetching leads:', error);
            } finally {
                setLoadingLeads(false);
            }
        };

        fetchLeads();
    }, [isOpen]);

    // Handle file upload (placeholder - in production use Firebase Storage)
    const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingReceipt(true);
        try {
            // TODO: Upload to Firebase Storage
            // For now, use a placeholder URL
            const placeholderUrl = `receipt-${Date.now()}-${file.name}`;
            setPaymentDetails(prev => ({ ...prev, attachmentUrl: placeholderUrl }));
            console.log('[VerifyWithAccountant] Receipt uploaded (placeholder):', placeholderUrl);
        } catch (error) {
            console.error('[VerifyWithAccountant] Error uploading receipt:', error);
            alert('Failed to upload receipt');
        } finally {
            setUploadingReceipt(false);
        }
    };

    // Validate and submit
    const handleSubmit = async () => {
        if (!selectedLead || !currentUser || !db) return;

        if (!projectHeadId?.trim()) {
            alert('Please select a Project Head for this project.');
            return;
        }

        // Validate payment details - ONLY amount and method are required
        if (!paymentDetails.method) {
            alert('❌ Please select a payment method');
            return;
        }
        if (paymentDetails.amount <= 0) {
            alert('❌ Please enter a valid payment amount');
            return;
        }

        // UTR and screenshot are OPTIONAL - do NOT require them
        // Payment terms/timeline are NOT asked - simplified flow

        const confirmSubmit = window.confirm(
            `Submit Payment for Verification?\n\n` +
            `Lead: ${selectedLead.title}\n` +
            `Client: ${selectedLead.clientName}\n` +
            `Amount Paid: ₹${paymentDetails.amount.toLocaleString('en-IN')}\n` +
            `Method: ${paymentDetails.method}\n` +
            `UTR: ${paymentDetails.utr || '(not provided)'}\n\n` +
            `This will be sent to Accountant for verification.\n` +
            `Lead will NOT convert to Project until approved.`
        );

        if (!confirmSubmit) return;

        setSubmitting(true);

        try {
            const batch = writeBatch(db);

            // 1. Create Payment Record - SINGLE SOURCE OF TRUTH: cases/{caseId}/payments
            const paymentRef = doc(collection(db, FIRESTORE_COLLECTIONS.CASES, selectedLead.id, FIRESTORE_COLLECTIONS.PAYMENTS));
            const paymentData = {
                // Required fields per spec
                amount: paymentDetails.amount,
                paymentMethod: paymentDetails.method, // Normalized field name
                utr: paymentDetails.utr || null, // Optional
                proofUrl: paymentDetails.attachmentUrl || null, // Optional
                verified: false,
                status: 'PENDING', // UPPERCASE as per spec
                createdBy: currentUser.id,
                createdByName: currentUser.name,
                createdAt: serverTimestamp(),
                // Project head for when lead converts to project (set on case on approval)
                projectHeadId: projectHeadId || null,
                // Legacy fields for backward compatibility
                method: paymentDetails.method,
                attachmentUrl: paymentDetails.attachmentUrl || null,
                submittedBy: currentUser.id,
                submittedByName: currentUser.name,
                submittedAt: serverTimestamp(),
                // Payment terms (optional, for reference only)
                paymentTerms: paymentTerms.totalProjectValue > 0 ? {
                    totalProjectValue: paymentTerms.totalProjectValue,
                    advancePercent: paymentTerms.advancePercent,
                    secondPercent: paymentTerms.secondPercent,
                    finalPercent: paymentTerms.finalPercent,
                    advanceAmount: (paymentTerms.totalProjectValue * paymentTerms.advancePercent) / 100,
                    secondAmount: (paymentTerms.totalProjectValue * paymentTerms.secondPercent) / 100,
                    finalAmount: (paymentTerms.totalProjectValue * paymentTerms.finalPercent) / 100
                } : null
            };
            batch.set(paymentRef, paymentData);

            // 1b. Create PAYMENT approval (Accounts Approval Center source); immutable payloadSnapshot for safe approve
            const payloadSnapshot = { paymentId: paymentRef.id, amount: paymentDetails.amount };
            const approvalRef = doc(collection(db, FIRESTORE_COLLECTIONS.CASES, selectedLead.id, FIRESTORE_COLLECTIONS.APPROVALS));
            batch.set(approvalRef, {
                caseId: selectedLead.id,
                organizationId: selectedLead.organizationId,
                type: 'PAYMENT',
                status: 'pending',
                payload: payloadSnapshot,
                payloadSnapshot,
                requestedBy: currentUser.id,
                requestedAt: serverTimestamp(),
                assignedToRole: UserRole.ACCOUNTS_TEAM,
            });

            // 2. Update Case status to WAITING_FOR_PAYMENT
            const caseRef = doc(db, FIRESTORE_COLLECTIONS.CASES, selectedLead.id);
            batch.update(caseRef, {
                status: CaseStatus.WAITING_FOR_PAYMENT,
                updatedAt: serverTimestamp(),
                // Store payment terms on case for later use
                pendingPayment: {
                    paymentId: paymentRef.id,
                    amount: paymentDetails.amount,
                    method: paymentDetails.method,
                    utr: paymentDetails.utr,
                    submittedAt: serverTimestamp(),
                    submittedBy: currentUser.id
                },
                paymentTerms: {
                    totalProjectValue: paymentTerms.totalProjectValue,
                    advancePercent: paymentTerms.advancePercent,
                    secondPercent: paymentTerms.secondPercent,
                    finalPercent: paymentTerms.finalPercent
                }
            });

            // 3. Log activity
            const activityRef = doc(collection(db, FIRESTORE_COLLECTIONS.CASES, selectedLead.id, FIRESTORE_COLLECTIONS.ACTIVITIES));
            batch.set(activityRef, {
                caseId: selectedLead.id,
                action: `Payment verification request submitted: ₹${paymentDetails.amount.toLocaleString('en-IN')} via ${paymentDetails.method} (UTR: ${paymentDetails.utr})`,
                by: currentUser.id,
                timestamp: serverTimestamp()
            });

            await batch.commit();

            console.log('[VerifyWithAccountant] ✅ Payment request created successfully');

            // 4. Send notifications to all Accounts Team members
            try {
                const staffRef = collection(db, FIRESTORE_COLLECTIONS.STAFF_USERS);
                const accountsQuery = query(
                    staffRef,
                    where('role', '==', UserRole.ACCOUNTS_TEAM),
                    where('isActive', '==', true)
                );
                const accountsSnapshot = await getDocs(accountsQuery);
                
                const notificationPromises = accountsSnapshot.docs.map(doc => {
                    const accountsUser = doc.data() as StaffUser;
                    return createNotification({
                        title: '💰 New Payment Verification Request',
                        message: `${currentUser.name} submitted a payment of ₹${paymentDetails.amount.toLocaleString('en-IN')} for ${selectedLead.clientName} (${selectedLead.title}). UTR: ${paymentDetails.utr}. Please verify.`,
                        user_id: doc.id,
                        entity_type: 'payment_verification',
                        entity_id: selectedLead.id,
                        type: 'warning'
                    });
                });

                await Promise.all(notificationPromises);
                console.log(`[VerifyWithAccountant] ✅ Sent notifications to ${accountsSnapshot.docs.length} accounts team members`);
            } catch (notifError) {
                console.error('[VerifyWithAccountant] Error sending notifications:', notifError);
                // Don't fail the whole operation if notifications fail
            }

            alert('✅ Payment verification request submitted!\n\nAwaiting accountant approval.\nProject will be created after verification.');
            
            onSubmitSuccess?.();
            onClose();

        } catch (error) {
            console.error('[VerifyWithAccountant] Error submitting:', error);
            alert('Failed to submit payment request. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <BanknotesIcon className="w-8 h-8 text-white" />
                        <div>
                            <h2 className="text-xl font-bold text-white">Verify With Accountant</h2>
                            <p className="text-white/80 text-sm">Payment verification required before project creation</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                        <XMarkIcon className="w-6 h-6 text-white" />
                    </button>
                </div>

                {/* Progress Steps */}
                <div className="px-6 py-4 bg-gray-50 border-b">
                    <div className="flex items-center justify-between">
                        {[
                            { step: 1, label: 'Select Lead' },
                            { step: 2, label: 'Payment Details' },
                            { step: 3, label: 'Payment Terms' }
                        ].map(({ step, label }) => (
                            <div key={step} className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                                    currentStep >= step 
                                        ? 'bg-orange-500 text-white' 
                                        : 'bg-gray-300 text-gray-600'
                                }`}>
                                    {currentStep > step ? <CheckCircleIcon className="w-5 h-5" /> : step}
                                </div>
                                <span className={`text-sm font-medium ${
                                    currentStep >= step ? 'text-gray-900' : 'text-gray-500'
                                }`}>{label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[60vh]">
                    {/* Step 1: Select Lead */}
                    {currentStep === 1 && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-gray-900">Select Lead to Convert</h3>
                            <p className="text-sm text-gray-600">
                                Choose a lead that has received payment. Only leads not yet in payment queue are shown.
                            </p>

                            {loadingLeads ? (
                                <div className="text-center py-8">
                                    <p className="text-gray-500">Loading available leads...</p>
                                </div>
                            ) : availableLeads.length === 0 ? (
                                <div className="text-center py-8 bg-yellow-50 rounded-lg">
                                    <ExclamationTriangleIcon className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
                                    <p className="text-yellow-800 font-medium">No eligible leads found</p>
                                    <p className="text-yellow-700 text-sm mt-2">
                                        All leads are either already projects or waiting for payment verification.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                                    {availableLeads.map(lead => (
                                        <div
                                            key={lead.id}
                                            onClick={() => setSelectedLead(lead)}
                                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                                selectedLead?.id === lead.id
                                                    ? 'border-orange-500 bg-orange-50'
                                                    : 'border-gray-200 hover:border-orange-300 hover:bg-gray-50'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <h4 className="font-bold text-gray-900">{lead.title}</h4>
                                                    <p className="text-sm text-gray-600 mt-1">{lead.clientName}</p>
                                                    <p className="text-xs text-gray-500 mt-1">{lead.siteAddress}</p>
                                                </div>
                                                <div className="text-right">
                                                    {lead.budget?.totalBudget && (
                                                        <p className="font-bold text-green-600">
                                                            {formatCurrencyINR(lead.budget.totalBudget)}
                                                        </p>
                                                    )}
                                                    <span className={`inline-block px-2 py-1 text-xs rounded mt-1 ${
                                                        lead.status === CaseStatus.QUOTATION 
                                                            ? 'bg-purple-100 text-purple-800'
                                                            : lead.status === CaseStatus.NEGOTIATION
                                                                ? 'bg-blue-100 text-blue-800'
                                                                : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                        {lead.status}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 2: Payment Details */}
                    {currentStep === 2 && selectedLead && (
                        <div className="space-y-6">
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <p className="text-sm text-blue-800">
                                    <strong>Selected Lead:</strong> {selectedLead.title} ({selectedLead.clientName})
                                </p>
                            </div>

                            <h3 className="text-lg font-bold text-gray-900">Payment Details</h3>
                            <p className="text-sm text-gray-600">
                                Enter the payment received from the client. This will be verified by the accountant.
                            </p>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Payment Method *
                                    </label>
                                    <select
                                        value={paymentDetails.method}
                                        onChange={(e) => setPaymentDetails(prev => ({ 
                                            ...prev, 
                                            method: e.target.value as PaymentDetails['method'] 
                                        }))}
                                        className="w-full px-4 py-3 border rounded-lg bg-white"
                                    >
                                        <option value="">Select Method</option>
                                        <option value="UPI">UPI</option>
                                        <option value="BANK">Bank Transfer</option>
                                        <option value="CASH">Cash</option>
                                        <option value="CHEQUE">Cheque</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        UTR / Reference Number (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={paymentDetails.utr}
                                        onChange={(e) => setPaymentDetails(prev => ({ ...prev, utr: e.target.value }))}
                                        className="w-full px-4 py-3 border rounded-lg"
                                        placeholder="Enter UTR or reference (if available)"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Amount Paid *
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                                    <input
                                        type="number"
                                        min="0"
                                        value={paymentDetails.amount || ''}
                                        onChange={(e) => setPaymentDetails(prev => ({ 
                                            ...prev, 
                                            amount: parseFloat(e.target.value) || 0 
                                        }))}
                                        className="w-full pl-10 pr-4 py-3 border rounded-lg text-lg font-bold"
                                        placeholder="Enter amount"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Receipt Attachment (Optional)
                                </label>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                    {paymentDetails.attachmentUrl ? (
                                        <div className="text-green-600">
                                            <CheckCircleIcon className="w-8 h-8 mx-auto mb-2" />
                                            <p className="font-medium">Receipt uploaded</p>
                                            <button 
                                                onClick={() => setPaymentDetails(prev => ({ ...prev, attachmentUrl: '' }))}
                                                className="text-sm text-red-600 mt-2"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="cursor-pointer">
                                            <CloudArrowUpIcon className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                                            <p className="text-gray-600">Click to upload receipt screenshot</p>
                                            <input
                                                type="file"
                                                accept="image/*,.pdf"
                                                onChange={handleReceiptUpload}
                                                className="hidden"
                                                disabled={uploadingReceipt}
                                            />
                                        </label>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Payment Terms */}
                    {currentStep === 3 && selectedLead && (
                        <div className="space-y-6">
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <p className="text-sm text-blue-800">
                                    <strong>Amount Paid:</strong> {formatCurrencyINR(paymentDetails.amount)} via {paymentDetails.method}
                                </p>
                            </div>

                            <h3 className="text-lg font-bold text-gray-900">Payment Terms</h3>
                            <p className="text-sm text-gray-600">
                                Define the payment installment plan for this project. These are TERMS only, not confirmation.
                            </p>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Project Head *
                                </label>
                                <select
                                    value={projectHeadId}
                                    onChange={(e) => setProjectHeadId(e.target.value)}
                                    className="w-full px-4 py-3 border rounded-lg bg-white"
                                    required
                                >
                                    <option value="">Select Project Head</option>
                                    {users
                                        .filter(u =>
                                            u.role === UserRole.PROJECT_HEAD ||
                                            u.role === UserRole.EXECUTION_TEAM ||
                                            u.role === UserRole.SUPER_ADMIN
                                        )
                                        .map((u) => (
                                            <option key={u.id} value={u.id}>
                                                {u.name} {u.role && `(${u.role})`}
                                            </option>
                                        ))}
                                </select>
                                <p className="text-xs text-gray-500 mt-1">
                                    Who will be the project head when this lead converts to a project.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Total Project Value *
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                                    <input
                                        type="number"
                                        min="0"
                                        value={paymentTerms.totalProjectValue || ''}
                                        onChange={(e) => setPaymentTerms(prev => ({ 
                                            ...prev, 
                                            totalProjectValue: parseFloat(e.target.value) || 0 
                                        }))}
                                        className="w-full pl-10 pr-4 py-3 border rounded-lg text-lg font-bold"
                                        placeholder="Enter total project value"
                                    />
                                </div>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="font-bold text-gray-900 mb-4">Installment Plan (%)</h4>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Advance</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={paymentTerms.advancePercent}
                                            onChange={(e) => setPaymentTerms(prev => ({ 
                                                ...prev, 
                                                advancePercent: parseFloat(e.target.value) || 0 
                                            }))}
                                            className="w-full px-3 py-2 border rounded-lg"
                                        />
                                        {paymentTerms.totalProjectValue > 0 && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                = {formatCurrencyINR((paymentTerms.totalProjectValue * paymentTerms.advancePercent) / 100)}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Second</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={paymentTerms.secondPercent}
                                            onChange={(e) => setPaymentTerms(prev => ({ 
                                                ...prev, 
                                                secondPercent: parseFloat(e.target.value) || 0 
                                            }))}
                                            className="w-full px-3 py-2 border rounded-lg"
                                        />
                                        {paymentTerms.totalProjectValue > 0 && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                = {formatCurrencyINR((paymentTerms.totalProjectValue * paymentTerms.secondPercent) / 100)}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Final</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={paymentTerms.finalPercent}
                                            onChange={(e) => setPaymentTerms(prev => ({ 
                                                ...prev, 
                                                finalPercent: parseFloat(e.target.value) || 0 
                                            }))}
                                            className="w-full px-3 py-2 border rounded-lg"
                                        />
                                        {paymentTerms.totalProjectValue > 0 && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                = {formatCurrencyINR((paymentTerms.totalProjectValue * paymentTerms.finalPercent) / 100)}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Validation */}
                                {(() => {
                                    const total = paymentTerms.advancePercent + paymentTerms.secondPercent + paymentTerms.finalPercent;
                                    const isValid = Math.abs(total - 100) < 0.1;
                                    return (
                                        <div className={`mt-4 p-3 rounded-lg ${isValid ? 'bg-green-100' : 'bg-red-100'}`}>
                                            <p className={`text-sm font-medium ${isValid ? 'text-green-800' : 'text-red-800'}`}>
                                                Total: {total}% {isValid ? '✓' : '(must equal 100%)'}
                                            </p>
                                        </div>
                                    );
                                })()}
                            </div>

                            {/* Summary */}
                            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                                <h4 className="font-bold text-orange-900 mb-3">Summary</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-orange-800">Lead:</span>
                                        <span className="font-medium text-orange-900">{selectedLead.title}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-orange-800">Client:</span>
                                        <span className="font-medium text-orange-900">{selectedLead.clientName}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-orange-800">Amount Claimed:</span>
                                        <span className="font-bold text-green-700">{formatCurrencyINR(paymentDetails.amount)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-orange-800">Payment Method:</span>
                                        <span className="font-medium text-orange-900">{paymentDetails.method}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-orange-800">UTR:</span>
                                        <span className="font-medium text-orange-900">{paymentDetails.utr}</span>
                                    </div>
                                    <hr className="border-orange-200" />
                                    <div className="flex justify-between">
                                        <span className="text-orange-800">Total Project Value:</span>
                                        <span className="font-bold text-orange-900">{formatCurrencyINR(paymentTerms.totalProjectValue)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t flex justify-between items-center">
                    <div>
                        {currentStep > 1 && (
                            <button
                                onClick={() => setCurrentStep((currentStep - 1) as 1 | 2 | 3)}
                                className="px-4 py-2 text-gray-700 hover:text-gray-900"
                            >
                                ← Back
                            </button>
                        )}
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                        >
                            Cancel
                        </button>

                        {currentStep < 3 ? (
                                    <button
                                        onClick={() => {
                                            if (currentStep === 1 && !selectedLead) {
                                                alert('Please select a lead');
                                                return;
                                            }
                                            if (currentStep === 2) {
                                                // Only method and amount are required; UTR is optional
                                                if (!paymentDetails.method || paymentDetails.amount <= 0) {
                                                    alert('Please select payment method and enter amount');
                                                    return;
                                                }
                                            }
                                            setCurrentStep((currentStep + 1) as 1 | 2 | 3);
                                        }}
                                        disabled={currentStep === 1 && !selectedLead}
                                        className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Continue →
                                    </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="px-6 py-2 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-lg hover:from-orange-700 hover:to-amber-700 disabled:opacity-50 font-bold"
                            >
                                {submitting ? 'Submitting...' : '✓ Submit for Verification'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerifyWithAccountantModal;
