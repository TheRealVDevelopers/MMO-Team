import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, addDoc, updateDoc, doc, Timestamp, orderBy } from 'firebase/firestore';
import { FinanceRequest } from '../types';
import { recordOutflow } from '../services/financeService';

type FirestoreFinanceRequest = Omit<FinanceRequest, 'createdAt' | 'adminApproval' | 'accountsApproval'> & {
    createdAt: Timestamp;
    adminApproval?: Omit<FinanceRequest['adminApproval'], 'approvedAt'> & { approvedAt: Timestamp };
    accountsApproval?: Omit<FinanceRequest['accountsApproval'], 'approvedAt'> & { approvedAt: Timestamp };
};

const fromFirestore = (docData: FirestoreFinanceRequest, id: string): FinanceRequest => {
    return {
        ...docData,
        id,
        createdAt: docData.createdAt.toDate(),
        adminApproval: docData.adminApproval ? {
            ...docData.adminApproval,
            approvedAt: docData.adminApproval.approvedAt.toDate()
        } : undefined,
        accountsApproval: docData.accountsApproval ? {
            ...docData.accountsApproval,
            approvedAt: docData.accountsApproval.approvedAt.toDate()
        } : undefined,
    };
};

export const useFinanceRequests = () => {
    const [requests, setRequests] = useState<FinanceRequest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        const q = query(collection(db, 'financeRequests'), orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const data: FinanceRequest[] = [];
            querySnapshot.forEach((doc) => {
                data.push(fromFirestore(doc.data() as FirestoreFinanceRequest, doc.id));
            });
            setRequests(data);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching finance requests:", err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const approveRequest = async (requestId: string, projectId: string, userId: string) => {
        try {
            const requestRef = doc(db, 'financeRequests', requestId);
            const request = requests.find(r => r.id === requestId);
            if (!request) return;

            // Update request status
            await updateDoc(requestRef, {
                status: 'Approved',
                accountsApproval: {
                    approvedBy: userId,
                    approvedAt: Timestamp.now(),
                    assignedProjectId: projectId
                }
            });

            // Record Outflow in Project P&L
            await recordOutflow(
                projectId,
                request.amount,
                request.type,
                requestId,
                `${request.type} - ${request.description}`
            );

            console.log(`Request ${requestId} approved and outflow recorded for project ${projectId}`);
        } catch (error) {
            console.error("Error approving request:", error);
            throw error;
        }
    };

    const rejectRequest = async (requestId: string, reason: string) => {
        try {
            const requestRef = doc(db, 'financeRequests', requestId);
            await updateDoc(requestRef, {
                status: 'Rejected',
                rejectionReason: reason
            });
            console.log(`Request ${requestId} rejected: ${reason}`);
        } catch (error) {
            console.error("Error rejecting request:", error);
            throw error;
        }
    };

    const addRequest = async (requestData: Omit<FinanceRequest, 'id'>) => {
        try {
            await addDoc(collection(db, 'financeRequests'), {
                ...requestData,
                createdAt: Timestamp.fromDate(requestData.createdAt)
            });
        } catch (error) {
            console.error("Error adding finance request:", error);
            throw error;
        }
    };

    return {
        requests,
        loading,
        approveRequest,
        rejectRequest,
        addRequest
    };
};
