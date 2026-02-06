import { useState } from 'react';
import { initiateSiteVisitAtomically } from '../services/siteVisitAtomicService';

interface UseSiteVisitInitiationReturn {
  initiateSiteVisit: (params: {
    organizationId: string;
    caseId: string;
    requesterId: string;
    requesterName: string;
  }) => Promise<void>;
  loading: boolean;
  error: string | null;
}

/**
 * Hook for initiating site visits atomically
 * Ensures all workflow steps happen in a single transaction
 */
export const useSiteVisitInitiation = (): UseSiteVisitInitiationReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initiateSiteVisit = async ({
    organizationId,
    caseId,
    requesterId,
    requesterName
  }: {
    organizationId: string;
    caseId: string;
    requesterId: string;
    requesterName: string;
  }): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      await initiateSiteVisitAtomically(
        organizationId,
        caseId,
        requesterId,
        requesterName
      );
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to initiate site visit';
      setError(errorMessage);
      console.error('[useSiteVisitInitiation] Error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    initiateSiteVisit,
    loading,
    error
  };
};