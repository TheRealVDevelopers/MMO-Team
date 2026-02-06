import { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import {
    collection,
    onSnapshot,
    query,
    where,
    addDoc,
    updateDoc,
    doc,
    Timestamp,
    serverTimestamp,
    getDoc,
    getDocs,
    setDoc,
    orderBy
} from 'firebase/firestore';
import {
    Case,
    CaseDrawing,
    CaseBOQ,
    CaseQuotation,
    Lead,
    Project,
    LeadHistory,
    ProjectStatus,
    UserRole,
    TaskStatus
} from '../types';
import { FIRESTORE_COLLECTIONS } from '../constants';
import { createNotification, logActivity } from '../services/liveDataService';

// ========================================
// TYPE CONVERTERS
// ========================================

// Convert Firestore timestamps to Date objects
const safeToDate = (value: any): Date | undefined => {
    if (!value) return undefined;
    if (value instanceof Date) return value;
    if (typeof value === 'object' && typeof value.toDate === 'function') {
        return value.toDate();
    }
    if (typeof value === 'string') {
        const parsed = new Date(value);
        return isNaN(parsed.getTime()) ? undefined : parsed;
    }
    if (typeof value === 'number') {
        return new Date(value);
    }
    return undefined;
};

// Helper to remove undefined values
const removeUndefinedValues = (obj: any): any => {
    if (Array.isArray(obj)) {
        return obj.map(item => removeUndefinedValues(item));
    } else if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
        const cleaned: any = {};
        Object.keys(obj).forEach(key => {
            const value = obj[key];
            if (value !== undefined) {
                cleaned[key] = removeUndefinedValues(value);
            }
        });
        return cleaned;
    }
    return obj;
};

// Convert Case from Firestore to frontend format
const caseFromFirestore = (docData: any, id: string): Case => {
    return {
        ...docData,
        id,
        inquiryDate: safeToDate(docData.inquiryDate) || new Date(),
        startDate: safeToDate(docData.startDate),
        endDate: safeToDate(docData.endDate),
        createdAt: safeToDate(docData.createdAt) || new Date(),
        updatedAt: safeToDate(docData.updatedAt),
        convertedToProjectAt: safeToDate(docData.convertedToProjectAt),
        history: docData.history?.map((h: any) => ({
            ...h,
            timestamp: safeToDate(h.timestamp) || new Date(),
        })) || [],
        documents: docData.documents?.map((d: any) => ({
            ...d,
            uploaded: safeToDate(d.uploaded) || new Date(),
        })) || [],
        stages: docData.stages?.map((s: any) => ({
            ...s,
            deadline: safeToDate(s.deadline),
        })) || [],
    } as Case;
};

// Convert Lead to Case format
const leadToCase = (lead: Lead): Case => {
    return {
        id: lead.id,
        isProject: false,
        clientName: lead.clientName,
        projectName: lead.projectName,
        contact: {
            name: lead.clientName,
            phone: lead.clientMobile,
            email: lead.clientEmail,
        },
        status: lead.status,
        priority: lead.priority,
        value: lead.value,
        source: lead.source,
        assignedTo: lead.assignedTo,
        inquiryDate: lead.inquiryDate,
        lastContacted: lead.lastContacted,
        clientEmail: lead.clientEmail,
        reminders: lead.reminders,
        tasks: lead.tasks,
        currentStage: lead.currentStage,
        deadline: lead.deadline,
        communicationMessages: lead.communicationMessages,
        files: lead.files,
        createdBy: lead.assignedTo || 'system',
        createdAt: lead.inquiryDate,
        history: lead.history || [],
        clientMobile: lead.clientMobile,
        documents: lead.files?.map(f => ({
            id: f.id,
            name: f.fileName,
            type: 'pdf',
            url: f.fileUrl,
            uploaded: f.uploadedAt,
        })) || [],
        is_demo: lead.is_demo,
    };
};

// Convert Project to Case format
const projectToCase = (project: Project): Case => {
    return {
        id: project.id,
        isProject: true,
        clientName: project.clientName,
        projectName: project.projectName,
        contact: {
            name: project.clientContact?.name || project.clientName,
            phone: project.clientContact?.phone || '',
        },
        status: project.status,
        priority: project.priority,
        budget: project.budget,
        advancePaid: project.advancePaid,
        startDate: project.startDate,
        endDate: project.endDate,
        progress: project.progress,
        assignedTeam: project.assignedTeam,
        milestones: project.milestones,
        stages: project.stages,
        createdBy: project.salespersonId || 'system',
        createdAt: project.startDate,
        inquiryDate: project.startDate, // Use start date as inquiry date
        history: project.history || [],
        clientAddress: project.clientAddress,
        clientContact: project.clientContact,
        salespersonId: project.salespersonId,
        totalExpenses: project.totalExpenses,
        documents: project.documents,
        communication: project.communication,
        items: project.items,
        counterOffers: project.counterOffers,
        paymentTerms: project.paymentTerms,
        ganttData: project.ganttData,
        issues: project.issues,
        lifecycleStatus: project.lifecycleStatus,
        organizationId: project.organizationId,
        is_demo: project.is_demo,
    };
};

// ========================================
// MAIN HOOKS
// ========================================

export interface UseCasesFilters {
    isProject?: boolean;
    userId?: string;
    organizationId?: string;
}

export const useCases = (filters?: UseCasesFilters) => {
    const [cases, setCases] = useState<Case[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    // ✅ FIX: Use refs instead of window caches to avoid race conditions
    const casesDataRef = useRef<Case[]>([]);
    const leadsDataRef = useRef<Case[]>([]);
    const projectsDataRef = useRef<Case[]>([]);
    const isInitializedRef = useRef({ cases: false, leads: false, projects: false });

    useEffect(() => {
        setLoading(true);
        setError(null);

        // Reset refs on filter change
        casesDataRef.current = [];
        leadsDataRef.current = [];
        projectsDataRef.current = [];
        isInitializedRef.current = { cases: false, leads: false, projects: false };

        const unsubscribers: Array<() => void> = [];

        // ✅ Atomic merge function - only runs when we have initial data from all active sources
        const mergeCases = () => {
            // Determine which sources should be tracked
            const expectingLeads = filters?.isProject !== true;
            const expectingProjects = filters?.isProject !== false;

            // Wait until all expected sources have loaded at least once
            const casesReady = isInitializedRef.current.cases;
            const leadsReady = !expectingLeads || isInitializedRef.current.leads;
            const projectsReady = !expectingProjects || isInitializedRef.current.projects;

            if (!casesReady || !leadsReady || !projectsReady) {
                // Still waiting for initial data - don't update state yet
                return;
            }

            let merged = [
                ...casesDataRef.current,
                ...leadsDataRef.current,
                ...projectsDataRef.current
            ];

            // Remove duplicates (prefer cases collection over legacy)
            const seenIds = new Set<string>();
            merged = merged.filter(c => {
                if (seenIds.has(c.id)) return false;
                seenIds.add(c.id);
                return true;
            });

            // Apply sorting (descending by createdAt/inquiryDate)
            merged.sort((a, b) => {
                const dateA = a.createdAt?.getTime() || a.inquiryDate?.getTime() || 0;
                const dateB = b.createdAt?.getTime() || b.inquiryDate?.getTime() || 0;
                return dateB - dateA;
            });

            // Apply organization filter (if specified)
            if (filters?.organizationId) {
                merged = merged.filter(c => c.organizationId === filters.organizationId);
            }

            // ✅ Server-side filtering is now primary - this is backup only
            // Note: Server-side WHERE clause applied below for leads/projects

            setCases(merged);
            setLoading(false);
        };

        try {
            // 1. Listen to cases collection
            const casesCollection = collection(db, FIRESTORE_COLLECTIONS.CASES);
            let casesQuery = query(casesCollection);

            // ✅ Add server-side filtering for cases
            if (filters?.isProject !== undefined) {
                if (filters?.userId && filters.isProject === false) {
                    // For leads in cases collection, filter by assignedTo
                    casesQuery = query(casesCollection,
                        where('isProject', '==', filters.isProject),
                        where('assignedTo', '==', filters.userId)
                    );
                } else {
                    casesQuery = query(casesCollection, where('isProject', '==', filters.isProject));
                }
            }

            const casesUnsub = onSnapshot(casesQuery, (snapshot) => {
                const casesData: Case[] = [];
                snapshot.forEach((doc) => {
                    casesData.push(caseFromFirestore(doc.data(), doc.id));
                });

                casesDataRef.current = casesData;
                isInitializedRef.current.cases = true;
                mergeCases();
            }, (err) => {
                console.error("Error fetching cases:", err);
                setError(err);
                isInitializedRef.current.cases = true; // Mark as initialized even on error
                mergeCases();
            });
            unsubscribers.push(casesUnsub);

            // 2. Listen to legacy leads collection (if not filtering for projects only)
            if (filters?.isProject !== true) {
                const leadsCollection = collection(db, FIRESTORE_COLLECTIONS.LEADS);

                // ✅ FIX: Add server-side WHERE clause for userId filtering
                const leadsQuery = filters?.userId
                    ? query(leadsCollection, where('assignedTo', '==', filters.userId))
                    : query(leadsCollection);

                console.log('[useCases] Leads query with userId filter:', filters?.userId || 'ALL');

                const leadsUnsub = onSnapshot(leadsQuery, (snapshot) => {
                    const leadsData: Lead[] = [];
                    snapshot.forEach((doc) => {
                        const data = doc.data();
                        leadsData.push({
                            ...data,
                            id: doc.id,
                            inquiryDate: safeToDate(data.inquiryDate) || new Date(),
                            history: data.history?.map((h: any) => ({
                                ...h,
                                timestamp: safeToDate(h.timestamp) || new Date(),
                            })) || [],
                        } as Lead);
                    });

                    console.log('[useCases] Leads fetched:', leadsData.length, 'for user:', filters?.userId);
                    leadsDataRef.current = leadsData.map(leadToCase);
                    isInitializedRef.current.leads = true;
                    mergeCases();
                }, (err) => {
                    console.error("Error fetching legacy leads:", err);
                    isInitializedRef.current.leads = true;
                    mergeCases();
                });
                unsubscribers.push(leadsUnsub);
            } else {
                // Not expecting leads, mark as ready
                isInitializedRef.current.leads = true;
            }

            // 3. Listen to legacy projects collection (if not filtering for leads only)
            if (filters?.isProject !== false) {
                const projectsCollection = collection(db, FIRESTORE_COLLECTIONS.PROJECTS);
                const projectsQuery = filters?.userId
                    ? query(projectsCollection, where('assignedTeam.drawing', '==', filters.userId))
                    : query(projectsCollection);

                const projectsUnsub = onSnapshot(projectsQuery, (snapshot) => {
                    const projectsData: Project[] = [];
                    snapshot.forEach((doc) => {
                        const data = doc.data();
                        projectsData.push({
                            ...data,
                            id: doc.id,
                            startDate: safeToDate(data.startDate) || new Date(),
                            endDate: safeToDate(data.endDate) || new Date(),
                            history: data.history?.map((h: any) => ({
                                ...h,
                                timestamp: safeToDate(h.timestamp) || new Date(),
                            })) || [],
                            documents: data.documents?.map((d: any) => ({
                                ...d,
                                uploaded: safeToDate(d.uploaded) || new Date(),
                            })) || [],
                        } as Project);
                    });

                    projectsDataRef.current = projectsData.map(projectToCase);
                    isInitializedRef.current.projects = true;
                    mergeCases();
                }, (err) => {
                    console.error("Error fetching legacy projects:", err);
                    isInitializedRef.current.projects = true;
                    mergeCases();
                });
                unsubscribers.push(projectsUnsub);
            } else {
                // Not expecting projects, mark as ready
                isInitializedRef.current.projects = true;
            }

        } catch (err) {
            console.error("Error setting up cases listeners:", err);
            setError(err as Error);
            setLoading(false);
        }

        return () => {
            unsubscribers.forEach(unsub => unsub());
        };
    }, [filters?.isProject, filters?.userId, filters?.organizationId]);

    return { cases, loading, error };
};

// ========================================
// CRUD OPERATIONS
// ========================================

export const addCase = async (caseData: Omit<Case, 'id'>) => {
    try {
        const cleanData = removeUndefinedValues(caseData);
        const docRef = await addDoc(collection(db, FIRESTORE_COLLECTIONS.CASES), {
            ...cleanData,
            inquiryDate: Timestamp.fromDate(caseData.inquiryDate),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        await createNotification({
            title: caseData.isProject ? 'New Project Created' : 'New Lead Added',
            message: `${caseData.projectName} - ${caseData.clientName}`,
            user_id: caseData.assignedTo || caseData.createdBy,
            entity_type: caseData.isProject ? 'project' : 'lead',
            entity_id: docRef.id,
            type: 'info'
        });

        return docRef.id;
    } catch (error) {
        console.error("Error adding case:", error);
        throw error;
    }
};

export const updateCase = async (caseId: string, updates: Partial<Case>) => {
    try {
        const cleanData = removeUndefinedValues(updates);
        const caseRef = doc(db, FIRESTORE_COLLECTIONS.CASES, caseId);

        await updateDoc(caseRef, {
            ...cleanData,
            updatedAt: serverTimestamp(),
        });

        console.log(`✅ Case ${caseId} updated successfully`);
    } catch (error) {
        console.error("Error updating case:", error);
        throw error;
    }
};

export const convertLeadToProject = async (caseId: string, paymentData: any) => {
    try {
        const caseRef = doc(db, FIRESTORE_COLLECTIONS.CASES, caseId);
        const caseSnap = await getDoc(caseRef);

        if (!caseSnap.exists()) {
            throw new Error(`Case ${caseId} not found`);
        }

        const caseData = caseSnap.data();

        await updateDoc(caseRef, {
            isProject: true,
            status: ProjectStatus.PENDING_EXECUTION_APPROVAL, // STRICT WORKFLOW: Pending Execution Approval
            advancePaid: paymentData.amount,
            convertedToProjectAt: serverTimestamp(),
            convertedBy: paymentData.verifiedBy,
            updatedAt: serverTimestamp(),
            history: [
                ...(caseData.history || []),
                {
                    action: 'Converted to Project',
                    user: 'Accounts Team',
                    timestamp: new Date(),
                    notes: `Advance payment of ₹${paymentData.amount} verified. Project awaiting Execution Approval.`
                }
            ]
        });

        await createNotification({
            title: 'Lead Converted to Project',
            message: `${caseData.projectName} is now a project!`,
            user_id: caseData.assignedTo || caseData.createdBy,
            entity_type: 'project',
            entity_id: caseId,
            type: 'success'
        });

        console.log(`✅ Case ${caseId} converted to project`);
    } catch (error) {
        console.error("Error converting lead to project:", error);
        throw error;
    }
};

export const getCase = async (caseId: string): Promise<Case | null> => {
    try {
        const caseRef = doc(db, FIRESTORE_COLLECTIONS.CASES, caseId);
        const caseSnap = await getDoc(caseRef);

        if (caseSnap.exists()) {
            return caseFromFirestore(caseSnap.data(), caseSnap.id);
        }

        // Check legacy collections
        const leadRef = doc(db, FIRESTORE_COLLECTIONS.LEADS, caseId);
        const leadSnap = await getDoc(leadRef);
        if (leadSnap.exists()) {
            return leadToCase({ ...leadSnap.data(), id: leadSnap.id } as Lead);
        }

        const projectRef = doc(db, FIRESTORE_COLLECTIONS.PROJECTS, caseId);
        const projectSnap = await getDoc(projectRef);
        if (projectSnap.exists()) {
            return projectToCase({ ...projectSnap.data(), id: projectSnap.id } as Project);
        }

        return null;
    } catch (error) {
        console.error("Error getting case:", error);
        throw error;
    }
};

// ========================================
// SUBCOLLECTION OPERATIONS
// ========================================

// DRAWINGS
export const addCaseDrawing = async (caseId: string, drawing: Omit<CaseDrawing, 'id'>) => {
    try {
        const docRef = await addDoc(collection(db, FIRESTORE_COLLECTIONS.CASES, caseId, 'drawings'), {
            ...drawing,
            uploadedAt: Timestamp.fromDate(drawing.uploadedAt),
        });

        await updateDoc(doc(db, FIRESTORE_COLLECTIONS.CASES, caseId), {
            updatedAt: serverTimestamp()
        });

        return docRef.id;
    } catch (error) {
        console.error("Error adding case drawing:", error);
        throw error;
    }
};

export const useCaseDrawings = (caseId: string) => {
    const [drawings, setDrawings] = useState<CaseDrawing[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!caseId) {
            setLoading(false);
            return;
        }

        const drawingsRef = collection(db, FIRESTORE_COLLECTIONS.CASES, caseId, 'drawings');
        const unsubscribe = onSnapshot(drawingsRef, (snapshot) => {
            const drawingsData: CaseDrawing[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                drawingsData.push({
                    ...data,
                    id: doc.id,
                    uploadedAt: safeToDate(data.uploadedAt) || new Date(),
                } as CaseDrawing);
            });
            setDrawings(drawingsData);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching case drawings:", err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [caseId]);

    return { drawings, loading };
};

// BOQs
export const addCaseBOQ = async (caseId: string, boq: Omit<CaseBOQ, 'id'>) => {
    try {
        const docRef = await addDoc(collection(db, FIRESTORE_COLLECTIONS.CASES, caseId, 'boqs'), {
            ...boq,
            submittedAt: Timestamp.fromDate(boq.submittedAt),
        });

        await updateDoc(doc(db, FIRESTORE_COLLECTIONS.CASES, caseId), {
            updatedAt: serverTimestamp()
        });

        return docRef.id;
    } catch (error) {
        console.error("Error adding case BOQ:", error);
        throw error;
    }
};

export const useCaseBOQs = (caseId: string) => {
    const [boqs, setBoqs] = useState<CaseBOQ[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!caseId) {
            setLoading(false);
            return;
        }

        const boqsRef = collection(db, FIRESTORE_COLLECTIONS.CASES, caseId, 'boqs');
        const unsubscribe = onSnapshot(boqsRef, (snapshot) => {
            const boqsData: CaseBOQ[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                boqsData.push({
                    ...data,
                    id: doc.id,
                    submittedAt: safeToDate(data.submittedAt) || new Date(),
                } as CaseBOQ);
            });
            setBoqs(boqsData);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching case BOQs:", err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [caseId]);

    return { boqs, loading };
};

// QUOTATIONS
export const addCaseQuotation = async (caseId: string, quotation: Omit<CaseQuotation, 'id'>) => {
    try {
        // Check if case document exists
        const caseRef = doc(db, FIRESTORE_COLLECTIONS.CASES, caseId);
        const caseSnap = await getDoc(caseRef);

        if (!caseSnap.exists()) {
            const errorMsg = `❌ Case document not found: ${caseId}\n\n🔄 MIGRATION REQUIRED\n\nTo save quotations, you must first migrate all leads and projects to the unified cases collection.\n\n👉 Steps:\n1. Go to Super Admin dashboard\n2. Click the "🔄 Migrate to Cases" button\n3. Wait for migration to complete\n4. Try saving the quotation again\n\n💻 Alternative: Run in browser console:\nwindow.migrateAllToCases()`;
            console.error(errorMsg);
            alert(errorMsg);
            throw new Error(`Case document not found: ${caseId}. Please run migration first.`);
        }

        // Save the quotation to subcollection
        const docRef = await addDoc(collection(db, FIRESTORE_COLLECTIONS.CASES, caseId, 'quotations'), {
            ...quotation,
            submittedAt: Timestamp.fromDate(quotation.submittedAt),
        });

        // Update parent case status
        await updateDoc(caseRef, {
            quotationStatus: 'PENDING_APPROVAL', // Changed from CREATED to PENDING_APPROVAL
            updatedAt: serverTimestamp()
        });

        console.log(`✅ Quotation ${docRef.id} saved successfully to cases/${caseId}/quotations`);
        return docRef.id;
    } catch (error) {
        console.error("Error adding case quotation:", error);
        throw error;
    }
};

export const useCaseQuotations = (caseId: string) => {
    const [quotations, setQuotations] = useState<CaseQuotation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!caseId) {
            setLoading(false);
            return;
        }

        const quotationsRef = collection(db, FIRESTORE_COLLECTIONS.CASES, caseId, 'quotations');
        const unsubscribe = onSnapshot(quotationsRef, (snapshot) => {
            const quotationsData: CaseQuotation[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                quotationsData.push({
                    ...data,
                    id: doc.id,
                    submittedAt: safeToDate(data.submittedAt) || new Date(),
                } as CaseQuotation);
            });
            setQuotations(quotationsData);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching case quotations:", err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [caseId]);

    return { quotations, loading };
};

// ========================================
// QUOTATION APPROVAL FUNCTIONS
// ========================================

/**
 * Approve a quotation
 * Only Admin and Sales Manager can approve
 */
export const approveQuotation = async (
    caseId: string,
    quotationId: string,
    approvedBy: string,
    approvedByName: string
) => {
    try {
        const quotationRef = doc(db, FIRESTORE_COLLECTIONS.CASES, caseId, 'quotations', quotationId);
        const caseRef = doc(db, FIRESTORE_COLLECTIONS.CASES, caseId);

        // Update quotation status
        await updateDoc(quotationRef, {
            status: 'Approved',
            approvedBy,
            approvedByName,
            approvedAt: serverTimestamp(),
        });

        // Update case quotation status
        await updateDoc(caseRef, {
            quotationStatus: 'APPROVED',
            updatedAt: serverTimestamp(),
        });

        // Get case data for notification
        const caseSnap = await getDoc(caseRef);
        const caseData = caseSnap.data();

        // Get quotation data
        const quotSnap = await getDoc(quotationRef);
        const quotData = quotSnap.data();

        // Notify quotation team who submitted it
        if (quotData?.submittedBy) {
            await createNotification({
                user_id: quotData.submittedBy,
                title: 'Quotation Approved',
                message: `Your quotation for ${caseData?.projectName || 'project'} has been approved by ${approvedByName}`,
                type: 'success',
                entity_type: 'project',
                entity_id: caseId,
            });
        }

        // Log activity
        await logActivity({
            description: `Approved quotation for ${caseData?.projectName || 'project'}`,
            team: UserRole.SUPER_ADMIN, // Placeholder, adjust based on approver role
            userId: approvedBy,
            status: 'completed' as any,
            projectId: caseId,
        });

        console.log(`✅ Quotation ${quotationId} approved successfully`);
    } catch (error) {
        console.error('Error approving quotation:', error);
        throw error;
    }
};

/**
 * Reject a quotation
 * Only Admin and Sales Manager can reject
 */
export const rejectQuotation = async (
    caseId: string,
    quotationId: string,
    rejectedBy: string,
    rejectedByName: string,
    reason: string
) => {
    try {
        const quotationRef = doc(db, FIRESTORE_COLLECTIONS.CASES, caseId, 'quotations', quotationId);
        const caseRef = doc(db, FIRESTORE_COLLECTIONS.CASES, caseId);

        // Update quotation status
        await updateDoc(quotationRef, {
            status: 'Rejected',
            rejectedBy,
            rejectedByName,
            rejectedAt: serverTimestamp(),
            rejectionReason: reason,
        });

        // Update case quotation status
        await updateDoc(caseRef, {
            quotationStatus: 'REJECTED',
            updatedAt: serverTimestamp(),
        });

        // Get case data for notification
        const caseSnap = await getDoc(caseRef);
        const caseData = caseSnap.data();

        // Get quotation data
        const quotSnap = await getDoc(quotationRef);
        const quotData = quotSnap.data();

        // Notify quotation team who submitted it
        if (quotData?.submittedBy) {
            await createNotification({
                user_id: quotData.submittedBy,
                title: 'Quotation Rejected',
                message: `Your quotation for ${caseData?.projectName || 'project'} was rejected: ${reason}`,
                type: 'error',
                entity_type: 'project',
                entity_id: caseId,
            });
        }

        // Log activity
        await logActivity({
            description: `Rejected quotation for ${caseData?.projectName || 'project'}: ${reason}`,
            team: UserRole.SUPER_ADMIN,
            userId: rejectedBy,
            status: 'completed' as any,
            projectId: caseId,
        });

        console.log(`✅ Quotation ${quotationId} rejected successfully`);
    } catch (error) {
        console.error('Error rejecting quotation:', error);
        throw error;
    }
};

// ========================================
// TASK CREATION WITH FEEDBACK LOOP
// ========================================

/**
 * Create a task with proper feedback loop setup
 * Automatically sets up notifications for creator and project head
 */
export const createCaseTask = async (
    caseId: string,
    taskData: {
        title: string;
        description?: string;
        assignedTo: string;
        assignedToName: string;
        createdBy: string;
        createdByName: string;
        taskType: 'BOQ' | 'Drawing' | 'Quotation' | 'Site Visit' | 'Procurement' | 'Execution' | 'General';
        relatedDocumentId?: string;
        deadline?: string;
        priority?: 'High' | 'Medium' | 'Low';
    }
) => {
    try {
        // Get case data to find project head
        const caseRef = doc(db, FIRESTORE_COLLECTIONS.CASES, caseId);
        const caseSnap = await getDoc(caseRef);

        if (!caseSnap.exists()) {
            throw new Error(`Case not found: ${caseId}`);
        }

        const caseData = caseSnap.data();

        // Build notify list: creator + project head
        const notifyOnComplete: string[] = [taskData.createdBy];
        if (caseData.projectHead && caseData.projectHead !== taskData.createdBy) {
            notifyOnComplete.push(caseData.projectHead);
        }

        // Create task in myDayTasks collection
        const tasksRef = collection(db, 'myDayTasks');
        const taskDoc = await addDoc(tasksRef, {
            title: taskData.title,
            description: taskData.description || '',
            userId: taskData.assignedTo,
            assignedTo: taskData.assignedTo,
            assignedToName: taskData.assignedToName,
            createdBy: taskData.createdBy,
            createdByName: taskData.createdByName,
            caseId: caseId,
            taskType: taskData.taskType,
            relatedDocumentId: taskData.relatedDocumentId,
            notifyOnComplete,
            status: TaskStatus.ASSIGNED,
            priority: taskData.priority || 'Medium',
            deadline: taskData.deadline,
            dueAt: taskData.deadline ? new Date(taskData.deadline) : undefined,
            isPaused: false,
            timeSpent: 0,
            date: new Date().toISOString().split('T')[0],
            createdAt: new Date(),
            targetName: caseData.projectName || caseData.clientName,
        });

        // Notify assigned user
        await createNotification({
            user_id: taskData.assignedTo,
            title: `New ${taskData.taskType} Task Assigned`,
            message: `${taskData.createdByName} assigned you: "${taskData.title}" for ${caseData.projectName}`,
            entity_type: 'project',
            entity_id: caseId,
            type: 'info',
        });

        // Log activity
        await logActivity({
            description: `${taskData.taskType} task created: "${taskData.title}"`,
            team: UserRole.SUPER_ADMIN,
            userId: taskData.createdBy,
            status: 'pending' as any,
            projectId: caseId,
        });

        console.log(`✅ Task ${taskDoc.id} created with feedback loop for case ${caseId}`);
        return taskDoc.id;
    } catch (error) {
        console.error('Error creating case task:', error);
        throw error;
    }
};

/**
 * Hook to fetch tasks for a specific case
 */
export const useCaseTasks = (caseId: string) => {
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!caseId) {
            setLoading(false);
            return;
        }

        const tasksRef = collection(db, 'myDayTasks');
        const q = query(tasksRef, where('caseId', '==', caseId), orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const tasksData: any[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                tasksData.push({
                    ...data,
                    id: doc.id,
                    createdAt: safeToDate(data.createdAt) || new Date(),
                    dueAt: safeToDate(data.dueAt),
                    completedAt: safeToDate(data.completedAt),
                });
            });
            setTasks(tasksData);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching case tasks:", err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [caseId]);

    return { tasks, loading };
};

// SITE VISITS
export const useCaseSiteVisits = (caseId: string) => {
    const [siteVisits, setSiteVisits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!caseId) {
            setLoading(false);
            return;
        }

        const siteVisitsRef = collection(db, FIRESTORE_COLLECTIONS.CASES, caseId, 'siteVisits');
        const q = query(siteVisitsRef, orderBy('startedAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const visitsData: any[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                visitsData.push({
                    ...data,
                    id: doc.id,
                    startedAt: safeToDate(data.startedAt),
                    endedAt: safeToDate(data.endedAt),
                    date: safeToDate(data.date),
                });
            });
            setSiteVisits(visitsData);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching case site visits:", err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [caseId]);

    return { siteVisits, loading };
};
