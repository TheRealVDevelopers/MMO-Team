import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';
import { Case, CaseStatus, CaseWorkflow, StaffUser } from '../types';
import { FIRESTORE_COLLECTIONS } from '../constants';

interface UseCasesOptions {
  organizationId?: string;
  userId?: string; // Filter by assigned user
  isProject?: boolean; // Filter leads vs projects
  status?: CaseStatus | CaseStatus[];
}

export const useCases = (options: UseCasesOptions = {}) => {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Real-time listener for cases
  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }

    try {
      // FLAT STRUCTURE: cases at root level
      const casesRef = collection(db, FIRESTORE_COLLECTIONS.CASES);

      // Build query with filters
      let constraints = [];

      // OPTIONAL: Filter by organizationId (if not provided, show ALL cases)
      if (options.organizationId) {
        constraints.push(where('organizationId', '==', options.organizationId));
      }

      // Apply isProject filter
      if (options.isProject !== undefined) {
        constraints.push(where('isProject', '==', options.isProject));
      }

      // Apply status filter
      if (options.status) {
        const statuses = Array.isArray(options.status) ? options.status : [options.status];
        if (statuses.length === 1) {
          constraints.push(where('status', '==', statuses[0]));
        }
        // Note: For multiple statuses, we need to filter client-side
      }

      // Always order by createdAt
      constraints.push(orderBy('createdAt', 'desc'));

      const q = query(casesRef, ...constraints);

      // Apply user assignment filter (client-side since Firestore doesn't support OR on different fields)
      // if (options.userId) {
      //   // Filter for assignedSales OR projectHead
      // }

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          let casesData = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              ...data,
              id: doc.id,
              createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
              updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt ? new Date(data.updatedAt) : undefined,
            } as Case;
          });

          // Client-side filtering for userId (assigned sales OR project head)
          if (options.userId) {
            casesData = casesData.filter(
              (c) => c.assignedSales === options.userId || c.projectHeadId === options.userId
            );
          }

          // Client-side filtering for multiple statuses
          if (Array.isArray(options.status) && options.status.length > 1) {
            casesData = casesData.filter((c) => options.status!.includes(c.status));
          }

          setCases(casesData);
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error('Error fetching cases:', err);
          setError(err.message);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err: any) {
      console.error('Error setting up cases listener:', err);
      setError(err.message);
      setLoading(false);
    }
  }, [options.organizationId, options.userId, options.isProject, JSON.stringify(options.status)]);

  // Create new case (lead)
  const createCase = useCallback(
    async (caseData: Omit<Case, 'id' | 'createdAt' | 'updatedAt' | 'workflow'>) => {
      if (!db || !options.organizationId) throw new Error('Database or organization not initialized');

      try {
        // FLAT STRUCTURE: cases at root level
        const casesRef = collection(db, FIRESTORE_COLLECTIONS.CASES);

        const defaultWorkflow: CaseWorkflow = {
          currentStage: CaseStatus.LEAD,
          siteVisitDone: false,
          drawingDone: false,
          boqDone: false,
          quotationDone: false,
          paymentVerified: false,
          executionStarted: false,
        };

        const newCase: Omit<Case, 'id'> = {
          ...caseData,
          workflow: defaultWorkflow,
          financial: {
            totalBudget: 0,
            totalInvoiced: 0,
            totalCollected: 0,
            totalExpenses: 0,
          },
          costCenter: {
            totalBudget: 0,
            spentAmount: 0,
            remainingAmount: 0,
            expenses: 0,
            materials: 0,
            salaries: 0,
          },
          status: CaseStatus.LEAD,
          isProject: false,
          createdAt: new Date(),
        };

        const docRef = await addDoc(casesRef, {
          ...newCase,
          createdAt: serverTimestamp(),
        });

        // Create activity log
        await logActivity(docRef.id, 'Case created', caseData.createdBy);

        return docRef.id;
      } catch (err: any) {
        console.error('Error creating case:', err);
        throw err;
      }
    },
    [options.organizationId]
  );

  // Update case
  const updateCase = useCallback(
    async (caseId: string, updates: Partial<Case>) => {
      if (!db) throw new Error('Database not initialized');

      try {
        // FLAT STRUCTURE: cases at root level
        const caseRef = doc(db, FIRESTORE_COLLECTIONS.CASES, caseId);

        await updateDoc(caseRef, {
          ...updates,
          updatedAt: serverTimestamp(),
        });

        // Log activity
        const action = updates.status
          ? `Status changed to ${updates.status}`
          : 'Case updated';
        await logActivity(caseId, action, updates.createdBy || 'system');
      } catch (err: any) {
        console.error('Error updating case:', err);
        throw err;
      }
    },
    [options.organizationId]
  );

  // Delete case
  const deleteCase = useCallback(
    async (caseId: string) => {
      if (!db || !options.organizationId) throw new Error('Database or organization not initialized');

      try {
        // FLAT STRUCTURE: cases at root level
        const caseRef = doc(db, FIRESTORE_COLLECTIONS.CASES, caseId);

        await deleteDoc(caseRef);
      } catch (err: any) {
        console.error('Error deleting case:', err);
        throw err;
      }
    },
    [options.organizationId]
  );

  // Convert lead to project
  const convertToProject = useCallback(
    async (caseId: string, userId: string) => {
      if (!db || !options.organizationId) throw new Error('Database or organization not initialized');

      try {
        await updateCase(caseId, {
          isProject: true,
          status: CaseStatus.ACTIVE,
          workflow: {
            ...cases.find((c) => c.id === caseId)?.workflow!,
            paymentVerified: true,
          },
        });

        await logActivity(caseId, 'Converted to project', userId);
      } catch (err: any) {
        console.error('Error converting to project:', err);
        throw err;
      }
    },
    [options.organizationId, cases, updateCase]
  );

  // Helper: Log activity (FLAT STRUCTURE)
  const logActivity = async (caseId: string, action: string, userId: string) => {
    if (!db) return;

    try {
      // FLAT STRUCTURE: cases/{caseId}/activities
      const activitiesRef = collection(
        db,
        FIRESTORE_COLLECTIONS.CASES,
        caseId,
        FIRESTORE_COLLECTIONS.ACTIVITIES
      );

      await addDoc(activitiesRef, {
        caseId,
        action,
        by: userId,
        timestamp: serverTimestamp(),
      });
    } catch (err) {
      console.error('Error logging activity:', err);
    }
  };

  return {
    cases,
    loading,
    error,
    createCase,
    updateCase,
    deleteCase,
    convertToProject,
  };
};

// Export convertToProject as standalone for backward compatibility
export const convertLeadToProject = async (
  organizationId: string,
  caseId: string,
  userId: string
): Promise<void> => {
  console.warn('convertLeadToProject: Please use useCases().convertToProject instead');
  // This is a placeholder - components should use the hook
};

// Legacy stub exports for backward compatibility
export const addCaseQuotation = async () => {
  console.warn('addCaseQuotation is deprecated - use useCaseDocuments instead');
};

export const useCaseQuotations = () => ({
  quotations: [],
  loading: false,
});

export const useCaseBOQs = () => ({
  boqs: [],
  loading: false,
});

export const useCaseDrawings = () => ({
  drawings: [],
  loading: false,
});

export const useCaseSiteVisits = () => ({
  siteVisits: [],
  loading: false,
});

export const useCaseTasks = () => ({
  tasks: [],
  loading: false,
});

export const createCaseTask = async () => {
  console.warn('createCaseTask stub - use useCaseTasks hook instead');
};

export const updateCase = async () => {
  console.warn('updateCase stub - use useCases hook instead');
};

export const approveQuotation = async () => {
  console.warn('approveQuotation stub');
};

export const rejectQuotation = async () => {
  console.warn('rejectQuotation stub');
};
