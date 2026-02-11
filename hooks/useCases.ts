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

      // OPTIONAL: Filter by organizationId (include null for individual leads)
      if (options.organizationId) {
        constraints.push(where('organizationId', 'in', [options.organizationId, null]));
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
              projectName: data.title ?? data.projectName,
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
        // Firestore does not allow undefined; strip undefined values from payload
        const cleanUpdates: Record<string, unknown> = { updatedAt: serverTimestamp() };
        for (const [key, value] of Object.entries(updates)) {
          if (value !== undefined) {
            cleanUpdates[key] = value;
          }
        }

        const caseRef = doc(db, FIRESTORE_COLLECTIONS.CASES, caseId);
        await updateDoc(caseRef, cleanUpdates);

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
  // HARD RULE: Only converts if payment has been verified (status === WAITING_FOR_PLANNING)
  const convertToProject = useCallback(
    async (caseId: string, userId: string) => {
      if (!db || !options.organizationId) throw new Error('Database or organization not initialized');

      // HARD RULE: Verify the case is in WAITING_FOR_PLANNING status
      const targetCase = cases.find((c) => c.id === caseId);
      if (!targetCase) throw new Error('Case not found');
      
      if (targetCase.status !== CaseStatus.WAITING_FOR_PLANNING) {
        throw new Error(`BLOCKED: Cannot convert to project. Status must be WAITING_FOR_PLANNING, but is ${targetCase.status}`);
      }
      
      if (!targetCase.financial?.paymentVerified) {
        throw new Error('BLOCKED: Cannot convert to project - payment not verified by accountant');
      }

      try {
        await updateCase(caseId, {
          isProject: true,
          status: CaseStatus.ACTIVE,
          workflow: {
            ...targetCase.workflow,
            paymentVerified: true,
          },
        });

        await logActivity(caseId, 'Converted to project (payment-gated)', userId);
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

export const useCaseQuotations = (caseId?: string) => {
  const [quotations, setQuotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db || !caseId) {
      setQuotations([]);
      setLoading(false);
      return;
    }

    const quotationsRef = collection(db, FIRESTORE_COLLECTIONS.CASES, caseId, FIRESTORE_COLLECTIONS.QUOTATIONS);
    const q = query(quotationsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt instanceof Timestamp ? doc.data().createdAt.toDate() : new Date(doc.data().createdAt || Date.now())
      }));
      console.log(`[useCaseQuotations] Loaded ${data.length} quotations for case ${caseId}`, data);
      setQuotations(data);
      setLoading(false);
    }, (error) => {
      console.error('[useCaseQuotations] Error:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [caseId]);

  return { quotations, loading };
};

export const useCaseBOQs = (caseId?: string) => {
  const [boqs, setBOQs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db || !caseId) {
      setBOQs([]);
      setLoading(false);
      return;
    }

    const boqsRef = collection(db, FIRESTORE_COLLECTIONS.CASES, caseId, 'boq');
    const q = query(boqsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt instanceof Timestamp ? doc.data().createdAt.toDate() : new Date(doc.data().createdAt || Date.now())
      }));
      console.log(`[useCaseBOQs] Loaded ${data.length} BOQs for case ${caseId}`, data);
      setBOQs(data);
      setLoading(false);
    }, (error) => {
      console.error('[useCaseBOQs] Error:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [caseId]);

  return { boqs, loading };
};

export const useCaseDrawings = (caseId?: string) => {
  const [drawings, setDrawings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db || !caseId) {
      setDrawings([]);
      setLoading(false);
      return;
    }

    const drawingsRef = collection(db, FIRESTORE_COLLECTIONS.CASES, caseId, 'drawings');
    const q = query(drawingsRef, orderBy('uploadedAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        uploadedAt: doc.data().uploadedAt instanceof Timestamp ? doc.data().uploadedAt.toDate() : new Date(doc.data().uploadedAt || Date.now())
      }));
      console.log(`[useCaseDrawings] Loaded ${data.length} drawings for case ${caseId}`, data);
      setDrawings(data);
      setLoading(false);
    }, (error) => {
      console.error('[useCaseDrawings] Error:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [caseId]);

  return { drawings, loading };
};

/** Summary of BOQ, quotations, documents, drawings per case for Reference list */
export interface CaseReferenceSummary {
  boqCount: number;
  quotationCount: number;
  documentsCount: number;
  drawingsCount: number;
}

/** Fetch counts of BOQ, quotations, documents, drawings for multiple cases (for Reference page). */
export const useCasesReferenceSummary = (caseIds: string[]): Record<string, CaseReferenceSummary> => {
  const [summary, setSummary] = useState<Record<string, CaseReferenceSummary>>({});

  useEffect(() => {
    if (!db || caseIds.length === 0) {
      setSummary({});
      return;
    }

    const fetchCount = async (caseId: string, subcollection: string): Promise<number> => {
      try {
        const ref = collection(db, FIRESTORE_COLLECTIONS.CASES, caseId, subcollection);
        const snap = await getDocs(ref);
        return snap.size;
      } catch {
        return 0;
      }
    };

    let cancelled = false;
    const run = async () => {
      const result: Record<string, CaseReferenceSummary> = {};
      for (const id of caseIds) {
        if (cancelled) return;
        const [boqCount, quotationCount, documentsCount, drawingsCount] = await Promise.all([
          fetchCount(id, FIRESTORE_COLLECTIONS.BOQ),
          fetchCount(id, FIRESTORE_COLLECTIONS.QUOTATIONS),
          fetchCount(id, FIRESTORE_COLLECTIONS.DOCUMENTS),
          fetchCount(id, 'drawings'),
        ]);
        result[id] = { boqCount, quotationCount, documentsCount, drawingsCount };
      }
      if (!cancelled) setSummary(result);
    };
    run();
    return () => { cancelled = true; };
  }, [caseIds.join(',')]);

  return summary;
};

export const useCaseSiteVisits = (caseId?: string) => {
  const [siteVisits, setSiteVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db || !caseId) {
      setSiteVisits([]);
      setLoading(false);
      return;
    }

    const siteVisitsRef = collection(db, FIRESTORE_COLLECTIONS.CASES, caseId, 'siteVisits');
    const q = query(siteVisitsRef, orderBy('scheduledDate', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        scheduledDate: doc.data().scheduledDate instanceof Timestamp ? doc.data().scheduledDate.toDate() : new Date(doc.data().scheduledDate || Date.now())
      }));
      console.log(`[useCaseSiteVisits] Loaded ${data.length} site visits for case ${caseId}`, data);
      setSiteVisits(data);
      setLoading(false);
    }, (error) => {
      console.error('[useCaseSiteVisits] Error:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [caseId]);

  return { siteVisits, loading };
};

export const useCaseTasks = (caseId?: string) => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db || !caseId) {
      setTasks([]);
      setLoading(false);
      return;
    }

    const tasksRef = collection(db, FIRESTORE_COLLECTIONS.CASES, caseId, FIRESTORE_COLLECTIONS.TASKS);
    const q = query(tasksRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt instanceof Timestamp ? doc.data().createdAt.toDate() : new Date(doc.data().createdAt || Date.now())
      }));
      console.log(`[useCaseTasks] Loaded ${data.length} tasks for case ${caseId}`, data);
      setTasks(data);
      setLoading(false);
    }, (error) => {
      console.error('[useCaseTasks] Error:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [caseId]);

  return { tasks, loading };
};

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
