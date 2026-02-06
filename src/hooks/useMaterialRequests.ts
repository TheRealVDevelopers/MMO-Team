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

// Hook to fetch pending material requests across ALL projects (for Execution Head)
export function useAllExecutionMaterialRequests() {
    const [requests, setRequests] = useState<MaterialRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        setError(null);

        // Try a simpler query first to avoid index issues
        // Just get all material requests and filter client-side
        const q = query(
            collectionGroup(db, 'materialRequests')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetched: MaterialRequest[] = snapshot.docs
                .map(doc => {
                    const data = doc.data();
                    // When using collectionGroup, doc.ref.parent.parent.id is the projectId
                    const projectId = doc.ref.parent.parent?.id || data.projectId;

                    return {
                        id: doc.id,
                        projectId: projectId,
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

    const approveRequest = async (projectId: string, requestId: string) => {
        const ref = doc(db, 'projects', projectId, 'materialRequests', requestId);
        await updateDoc(ref, {
            executionApproval: 'approved',
            status: MaterialRequestStatus.APPROVED,
            targetRole: 'accounts', // Move to accounts team
            accountsStatus: 'pending'
        });
    };

    const rejectRequest = async (projectId: string, requestId: string) => {
        const ref = doc(db, 'projects', projectId, 'materialRequests', requestId);
        await updateDoc(ref, {
            executionApproval: 'rejected',
            status: MaterialRequestStatus.REJECTED
        });
    };

    return { requests, loading, error, approveRequest, rejectRequest };
}

export function useMaterialRequests(projectId: string): UseMaterialRequestsReturn {
    const [requests, setRequests] = useState<MaterialRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!projectId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        // Query material requests for this project
        const requestsRef = collection(db, 'projects', projectId, 'materialRequests');
        const q = query(requestsRef, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const fetchedRequests: MaterialRequest[] = snapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        projectId: data.projectId || projectId,
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
    }, [projectId]);

    const addRequest = async (request: Omit<MaterialRequest, 'id' | 'createdAt'>) => {
        try {
            const requestsRef = collection(db, 'projects', projectId, 'materialRequests');
            await addDoc(requestsRef, {
                ...request,
                projectId,
                // Defaults for new workflow
                targetRole: request.targetRole || 'execution',
                urgency: request.urgency || 'Normal',
                executionApproval: 'pending',
                accountsStatus: 'pending',
                createdAt: serverTimestamp()
            });
            console.log('Material request added successfully');
        } catch (err) {
            console.error('Error adding material request:', err);
            throw err;
        }
    };

    const updateRequestStatus = async (requestId: string, status: MaterialRequest['status']) => {
        try {
            const requestRef = doc(db, 'projects', projectId, 'materialRequests', requestId);
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
