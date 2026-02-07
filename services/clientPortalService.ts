import {
    collection,
    addDoc,
    updateDoc,
    doc,
    serverTimestamp,
    getDoc,
    setDoc
} from 'firebase/firestore';
import { db, storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ApprovalStatus } from '../types';

export const ClientPortalService = {
    /**
     * Upload a file to storage
     */
    uploadFile: async (path: string, file: File): Promise<string> => {
        if (!storage) throw new Error("Firebase Storage not initialized");
        const storageRef = ref(storage, path);
        await uploadBytes(storageRef, file);
        return await getDownloadURL(storageRef);
    },

    /**
     * Submit a payment record (UTR or Screenshot)
     */
    submitPayment: async (
        caseId: string,
        organizationId: string, // Needed if we want to duplicate to org-level collection, but for now case-level
        amount: number,
        method: 'UTR' | 'Screenshot',
        value: string // UTR number or File URL
    ) => {
        try {
            // If method is Screenshot, 'value' should be the DOWNLOAD URL from Storage.
            // The UI should handle the upload to Storage first, then pass the URL here.

            const paymentData = {
                caseId,
                amount,
                method, // 'UTR' or 'Screenshot' - might need to map to our CasePayment type fields
                utr: method === 'UTR' ? value : '',
                receiptUrl: method === 'Screenshot' ? value : '',
                submittedAt: serverTimestamp(),
                submittedBy: 'CLIENT', // Or actual Client ID if available
                verified: false,
                status: 'pending_verification'
            };

            // Add to Case Subcollection
            const caseRef = doc(db, 'cases', caseId);
            const paymentsRef = collection(caseRef, 'payments');
            await addDoc(paymentsRef, paymentData);

            console.log('Payment submitted successfully');
            return true;
        } catch (error) {
            console.error('Error submitting payment:', error);
            throw error;
        }
    },

    /**
     * Approve an approval request
     */
    approveRequest: async (
        caseId: string,
        requestId: string,
        clientId: string,
        notes?: string
    ) => {
        try {
            const caseRef = doc(db, 'cases', caseId);
            const requestRef = doc(collection(caseRef, 'approvals'), requestId);

            await updateDoc(requestRef, {
                status: 'approved', // Lowercase per types.ts
                resolvedBy: clientId,
                resolvedAt: serverTimestamp(),
                'payload.notes': notes || '', // Append or overwrite notes?
                clientAction: {
                    action: 'APPROVE',
                    timestamp: serverTimestamp(),
                    actor: clientId
                }
            });
            return true;
        } catch (error) {
            console.error('Error approving request:', error);
            throw error;
        }
    },

    /**
     * Reject (Request Changes) an approval request
     */
    rejectRequest: async (
        caseId: string,
        requestId: string,
        clientId: string,
        reason: string
    ) => {
        try {
            const caseRef = doc(db, 'cases', caseId);
            const requestRef = doc(collection(caseRef, 'approvals'), requestId);

            await updateDoc(requestRef, {
                status: 'rejected',
                resolvedBy: clientId,
                resolvedAt: serverTimestamp(),
                rejectionReason: reason,
                clientAction: {
                    action: 'REJECT',
                    timestamp: serverTimestamp(),
                    actor: clientId,
                    reason: reason
                }
            });
            return true;
        } catch (error) {
            console.error('Error rejecting request:', error);
            throw error;
        }
    },

    /**
     * Sign off JMS
     */
    signJMS: async (
        caseId: string,
        signatureUrl: string,
        clientId: string
    ) => {
        try {
            const caseRef = doc(db, 'cases', caseId);
            const jmsRef = doc(collection(caseRef, 'jms'), 'completion');

            // Upsert JMS doc
            await setDoc(jmsRef, {
                caseId,
                clientSignedAt: serverTimestamp(),
                clientSignature: signatureUrl,
                signedBy: clientId,
                status: 'SIGNED'
            }, { merge: true });

            // Also update main case closure status if needed
            await updateDoc(caseRef, {
                'closure.jmsSigned': true,
                'closure.jmsSignedAt': serverTimestamp()
            });

            return true;
        } catch (error) {
            console.error('Error signing JMS:', error);
            throw error;
        }
    }
};
