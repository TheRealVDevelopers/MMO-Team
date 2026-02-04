import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, Timestamp, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

export interface EditRequest {
    id: string;
    projectId: string;
    requesterId: string;
    requesterName?: string;
    editType: 'task' | 'deadline' | 'gantt' | 'milestone' | 'other';
    targetId?: string; // e.g., task ID being edited
    targetName?: string; // e.g., task name for display
    originalData: any;
    proposedData: any;
    description?: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: Date;
    reviewedAt?: Date;
    reviewedBy?: string;
    reviewerNotes?: string;
}

interface UseEditApprovalReturn {
    pendingRequests: EditRequest[];
    loading: boolean;
    error: string | null;
    submitEditRequest: (request: Omit<EditRequest, 'id' | 'createdAt' | 'status'>) => Promise<string>;
    approveRequest: (requestId: string, reviewerNotes?: string) => Promise<void>;
    rejectRequest: (requestId: string, reviewerNotes?: string) => Promise<void>;
    getUserPendingCount: () => number;
}

export function useEditApproval(projectId?: string): UseEditApprovalReturn {
    const [pendingRequests, setPendingRequests] = useState<EditRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        setError(null);

        // Query all edit requests without composite index requirements
        // Filter and sort client-side to avoid index issues
        const requestsRef = collection(db, 'editRequests');

        const unsubscribe = onSnapshot(
            requestsRef,
            (snapshot) => {
                let fetchedRequests: EditRequest[] = snapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        projectId: data.projectId || '',
                        requesterId: data.requesterId || '',
                        requesterName: data.requesterName,
                        editType: data.editType || 'other',
                        targetId: data.targetId,
                        targetName: data.targetName,
                        originalData: data.originalData,
                        proposedData: data.proposedData,
                        description: data.description,
                        status: data.status || 'pending',
                        createdAt: data.createdAt instanceof Timestamp
                            ? data.createdAt.toDate()
                            : new Date(data.createdAt || Date.now()),
                        reviewedAt: data.reviewedAt instanceof Timestamp
                            ? data.reviewedAt.toDate()
                            : data.reviewedAt ? new Date(data.reviewedAt) : undefined,
                        reviewedBy: data.reviewedBy,
                        reviewerNotes: data.reviewerNotes
                    };
                });

                // Filter client-side for pending requests
                fetchedRequests = fetchedRequests.filter(r => r.status === 'pending');

                // Filter by project if provided
                if (projectId) {
                    fetchedRequests = fetchedRequests.filter(r => r.projectId === projectId);
                }

                // Sort by createdAt descending
                fetchedRequests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

                setPendingRequests(fetchedRequests);
                setLoading(false);
            },
            (err) => {
                console.error('Error fetching edit requests:', err);
                setError('Failed to load edit requests');
                setPendingRequests([]);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [projectId]);

    const submitEditRequest = async (request: Omit<EditRequest, 'id' | 'createdAt' | 'status'>): Promise<string> => {
        try {
            const requestsRef = collection(db, 'editRequests');
            const docRef = await addDoc(requestsRef, {
                ...request,
                status: 'pending',
                createdAt: serverTimestamp()
            });
            console.log('Edit request submitted:', docRef.id);

            // Notify all admins about the new approval request
            const { notifyAdminsOfApproval } = await import('./useNotifications');
            await notifyAdminsOfApproval(
                `New ${request.editType} Edit Request`,
                `${request.requesterName || 'Execution Team'} submitted a ${request.editType} edit: ${request.description || request.targetName || 'Project update'}`,
                request.projectId,
                'editRequest'
            );

            return docRef.id;
        } catch (err) {
            console.error('Error submitting edit request:', err);
            throw err;
        }
    };

    const approveRequest = async (requestId: string, reviewerNotes?: string) => {
        try {
            const requestRef = doc(db, 'editRequests', requestId);

            // Get the request data to apply changes
            const request = pendingRequests.find(r => r.id === requestId);
            if (!request) throw new Error('Request not found');

            // Apply the proposed changes to the actual data
            // This would vary based on editType
            // For now, just mark as approved
            await updateDoc(requestRef, {
                status: 'approved',
                reviewedAt: serverTimestamp(),
                reviewerNotes: reviewerNotes || ''
            });

            console.log('Edit request approved:', requestId);
        } catch (err) {
            console.error('Error approving edit request:', err);
            throw err;
        }
    };

    const rejectRequest = async (requestId: string, reviewerNotes?: string) => {
        try {
            const requestRef = doc(db, 'editRequests', requestId);
            await updateDoc(requestRef, {
                status: 'rejected',
                reviewedAt: serverTimestamp(),
                reviewerNotes: reviewerNotes || ''
            });
            console.log('Edit request rejected:', requestId);
        } catch (err) {
            console.error('Error rejecting edit request:', err);
            throw err;
        }
    };

    const getUserPendingCount = () => {
        return pendingRequests.length;
    };

    return {
        pendingRequests,
        loading,
        error,
        submitEditRequest,
        approveRequest,
        rejectRequest,
        getUserPendingCount
    };
}

export default useEditApproval;
