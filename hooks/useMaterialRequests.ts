import { useState, useEffect } from 'react';
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    addDoc,
    serverTimestamp,
    Timestamp,
    updateDoc,
    doc,
    collectionGroup,
    where
} from 'firebase/firestore';
import { db } from '../firebase';
import { MaterialRequest, MaterialRequestStatus } from '../types';

interface UseMaterialRequestsReturn {
    requests: MaterialRequest[];
    loading: boolean;
    error: string | null;
    addRequest: (request: Omit<MaterialRequest, 'id' | 'createdAt'>) => Promise<void>;
    updateRequestStatus: (requestId: string, status: MaterialRequest['status']) => Promise<void>;
}

// Hook to fetch pending material requests across ALL cases (for Execution Head)
// CASE-CENTRIC: Uses collectionGroup on cases/{caseId}/materials
export function useAllExecutionMaterialRequests() {
    const [requests, setRequests] = useState<MaterialRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        setError(null);

        // CASE-CENTRIC: Query materials subcollection across all cases
        const q = query(
            collectionGroup(db, 'materials')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetched: MaterialRequest[] = snapshot.docs
                .map(doc => {
                    const data = doc.data();
                    // When using collectionGroup, doc.ref.parent.parent.id is the caseId
                    const caseId = doc.ref.parent.parent?.id || data.caseId;

                    return {
                        id: doc.id,
                        projectId: caseId, // Keep projectId for backward compatibility
                        caseId: caseId, // Add explicit caseId
                        itemId: data.itemId || '',
                        itemName: data.itemName || '',
                        quantityRequested: data.quantityRequested || 0,
                        unit: data.unit || '',
                        requiredDate: data.requiredDate,
                        status: data.status || 'Requested',
                        requestedBy: data.requestedBy || '',
                        createdAt: data.createdAt instanceof Timestamp
                            ? data.createdAt.toDate()
                            : new Date(data.createdAt),
                        notes: data.notes || '',
                        items: data.items || [], // Add items array for MaterialRequest type
                        targetRole: data.targetRole || 'execution',
                        urgency: data.urgency || 'Normal',
                        executionApproval: data.executionApproval || 'pending',
                        accountsStatus: data.accountsStatus || 'pending',
                        projectName: data.projectName
                    };
                })
                // Filter client-side for execution pending requests
                .filter(req =>
                    req.targetRole === 'execution' &&
                    req.executionApproval === 'pending'
                );

            setRequests(fetched);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching all material requests:", err);
            setError('Failed to load material requests. Please try again.');
            setRequests([]);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const approveRequest = async (caseId: string, requestId: string) => {
        // CASE-CENTRIC: Update material in cases/{caseId}/materials
        const ref = doc(db, 'cases', caseId, 'materials', requestId);
        await updateDoc(ref, {
            executionApproval: 'approved',
            status: MaterialRequestStatus.APPROVED,
            targetRole: 'accounts', // Move to accounts team
            accountsStatus: 'pending'
        });
    };

    const rejectRequest = async (caseId: string, requestId: string) => {
        // CASE-CENTRIC: Update material in cases/{caseId}/materials
        const ref = doc(db, 'cases', caseId, 'materials', requestId);
        await updateDoc(ref, {
            executionApproval: 'rejected',
            status: MaterialRequestStatus.REJECTED
        });
    };

    return { requests, loading, error, approveRequest, rejectRequest };
}

// CASE-CENTRIC: Fetch material requests for a specific case
// Changed from projects/{projectId}/materialRequests to cases/{caseId}/materials
export function useMaterialRequests(caseId: string): UseMaterialRequestsReturn {
    const [requests, setRequests] = useState<MaterialRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!caseId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        // CASE-CENTRIC: Query materials subcollection for this case
        const requestsRef = collection(db, 'cases', caseId, 'materials');
        const q = query(requestsRef, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const fetchedRequests: MaterialRequest[] = snapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        projectId: caseId, // Keep projectId for backward compatibility
                        caseId: caseId, // Add explicit caseId
                        itemId: data.itemId || '',
                        itemName: data.itemName || '',
                        quantityRequested: data.quantityRequested || 0,
                        unit: data.unit || '',
                        requiredDate: data.requiredDate,
                        status: data.status || 'Requested',
                        requestedBy: data.requestedBy || '',
                        createdAt: data.createdAt instanceof Timestamp
                            ? data.createdAt.toDate()
                            : new Date(data.createdAt),
                        notes: data.notes || '',
                        items: data.items || [], // Add items array for MaterialRequest type

                        // New fields
                        targetRole: data.targetRole || 'execution',
                        urgency: data.urgency || 'Normal',
                        executionApproval: data.executionApproval || 'pending',
                        accountsStatus: data.accountsStatus || 'pending'
                    };
                });
                setRequests(fetchedRequests);
                setLoading(false);
            },
            (err) => {
                console.error('Error fetching material requests:', err);
                setError('Failed to load material requests');
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [caseId]);

    const addRequest = async (request: Omit<MaterialRequest, 'id' | 'createdAt'>) => {
        try {
            // CASE-CENTRIC: Add to cases/{caseId}/materials
            const requestsRef = collection(db, 'cases', caseId, 'materials');
            await addDoc(requestsRef, {
                ...request,
                caseId: caseId,
                projectId: caseId, // Keep projectId for backward compatibility
                // Defaults for new workflow
                targetRole: request.targetRole || 'execution',
                urgency: request.urgency || 'Normal',
                executionApproval: 'pending',
                accountsStatus: 'pending',
                createdAt: serverTimestamp()
            });
            console.log('Material request added successfully to case:', caseId);
        } catch (err) {
            console.error('Error adding material request:', err);
            throw err;
        }
    };

    const updateRequestStatus = async (requestId: string, status: MaterialRequest['status']) => {
        try {
            // CASE-CENTRIC: Update in cases/{caseId}/materials
            const requestRef = doc(db, 'cases', caseId, 'materials', requestId);
            await updateDoc(requestRef, { status });
            console.log('Material request status updated');
        } catch (err) {
            console.error('Error updating material request status:', err);
            throw err;
        }
    };

    return { requests, loading, error, addRequest, updateRequestStatus };
}

export default useMaterialRequests;
