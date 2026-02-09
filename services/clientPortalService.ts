import {
    collection,
    addDoc,
    updateDoc,
    doc,
    serverTimestamp,
    getDoc,
    setDoc,
    getDocs,
    query,
    where
} from 'firebase/firestore';
import { db, storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ApprovalStatus, CaseStatus } from '../types';

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
     * Sign off JMS: update JMS doc with client data and set case to COMPLETED.
     * If jmsDocId is provided, updates that doc; otherwise finds first pending doc in jms subcollection, or falls back to 'completion' doc.
     */
    signJMS: async (
        caseId: string,
        payload: {
            jmsDocId?: string;
            signatureUrl: string;
            itemsDelivered?: string;
            quantitiesReceived?: string;
            missingItems?: string;
        },
        clientId: string
    ) => {
        try {
            const caseRef = doc(db, 'cases', caseId);
            const jmsCol = collection(caseRef, 'jms');
            let jmsDocId = payload.jmsDocId;

            if (!jmsDocId) {
                const pendingSnap = await getDocs(query(jmsCol, where('status', '==', 'pending')));
                if (!pendingSnap.empty) {
                    jmsDocId = pendingSnap.docs[0].id;
                } else {
                    jmsDocId = 'completion';
                }
            }

            const jmsRef = doc(jmsCol, jmsDocId);
            await setDoc(jmsRef, {
                caseId,
                clientSignedAt: serverTimestamp(),
                clientSignature: payload.signatureUrl,
                signedBy: clientId,
                status: 'signed',
                ...(payload.itemsDelivered != null && { itemsDelivered: payload.itemsDelivered }),
                ...(payload.quantitiesReceived != null && { quantitiesReceived: payload.quantitiesReceived }),
                ...(payload.missingItems != null && { missingItems: payload.missingItems }),
            }, { merge: true });

            await updateDoc(caseRef, {
                status: CaseStatus.COMPLETED,
                'closure.jmsSigned': true,
                'closure.jmsSignedAt': serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            return true;
        } catch (error) {
            console.error('Error signing JMS:', error);
            throw error;
        }
    }
};
