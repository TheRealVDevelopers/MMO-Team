import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { FIRESTORE_COLLECTIONS } from '../constants';

interface SiteVisitRequest {
  id: string;
  caseId: string;
  type: 'SITE_VISIT_REQUEST';
  requestedBy: string;
  requestedByName: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  visibleTo: string[];
  createdAt: any;
  organizationId: string;
}

interface UseRequestInboxReturn {
  requests: SiteVisitRequest[];
  loading: boolean;
  error: string | null;
}

/**
 * Hook for listening to request inbox entries
 * Used by Admin/Managers to see pending site visit requests
 */
export const useRequestInbox = (currentUserRole: string | null, organizationId: string): UseRequestInboxReturn => {
  const [requests, setRequests] = useState<SiteVisitRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUserRole || !organizationId) {
      setLoading(false);
      return;
    }

    // Only listen if user is authorized to see requests
    const authorizedRoles = ['SUPER_ADMIN', 'SALES_MANAGER', 'MANAGER'];
    if (!authorizedRoles.includes(currentUserRole)) {
      setLoading(false);
      return;
    }

    setLoading(true);
    
    console.log('[useRequestInbox] Setting up listener for:', {
      currentUserRole,
      organizationId,
      authorized: authorizedRoles.includes(currentUserRole)
    });

    try {
      const requestsRef = collection(
        db!,
        FIRESTORE_COLLECTIONS.ORGANIZATIONS,
        organizationId,
        'requests'
      );
      
      const q = query(
        requestsRef,
        where('status', '==', 'PENDING'),
        where('type', '==', 'SITE_VISIT_REQUEST'),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const requestList: SiteVisitRequest[] = [];
          console.log(`[useRequestInbox] Found ${snapshot.size} documents`);
          snapshot.forEach((doc) => {
            console.log('[useRequestInbox] Document data:', {
              id: doc.id,
              data: doc.data()
            });
            requestList.push({
              id: doc.id,
              ...doc.data()
            } as SiteVisitRequest);
          });
      
          console.log('[useRequestInbox] Final requests:', requestList);
          setRequests(requestList);
          setLoading(false);
        },
        (err) => {
          console.error('[useRequestInbox] Error listening to requests:', err);
          setError('Failed to load requests');
          setLoading(false);
        }
      );

      return () => unsubscribe();
      
    } catch (err: any) {
      console.error('[useRequestInbox] Error setting up listener:', err);
      setError(err.message || 'Failed to initialize request inbox');
      setLoading(false);
    }
  }, [currentUserRole, organizationId]);

  return {
    requests,
    loading,
    error
  };
};