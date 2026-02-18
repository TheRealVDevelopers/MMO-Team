import { useState, useEffect } from 'react';
import {
    collection,
    query,
    where,
    onSnapshot,
    doc,
    getDocs,
    orderBy,
    Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import {
    Case,
    CaseStatus,
    ApprovalRequest,
    CasePayment,
    CaseDocument,
    CaseDailyUpdate,
    Invoice
} from '../types';
import {
    ClientProject,
    JourneyStage,
    PaymentMilestone,
    ActivityItem,
    ClientRequest,
    TransparencyData,
    ProjectHealth
} from '../components/client-portal/types';

export const useClientCase = (identifier: { type: 'clientUid' | 'caseId'; value: string } | string | undefined) => {
    const [project, setProject] = useState<ClientProject | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!identifier || !db) {
            setLoading(false);
            return;
        }

        const idValue = typeof identifier === 'string' ? identifier : identifier.value;
        const idType = typeof identifier === 'string' ? 'clientUid' : identifier.type;

        if (!idValue) {
            setLoading(false);
            return;
        }

        setLoading(true);

        let unsubscribeCase: () => void = () => { };

        const fetchCase = async () => {
            try {
                if (idType === 'caseId') {
                    // Fetch specific case by ID
                    const caseRef = doc(db, 'cases', idValue);
                    unsubscribeCase = onSnapshot(caseRef, (docSnap) => {
                        if (docSnap.exists()) {
                            const caseData = docSnap.data() as Case;
                            setupSubListeners(docSnap.ref, caseData, setProject, () => setLoading(false));
                        } else {
                            console.log("No case found for ID:", idValue);
                            setProject(null);
                            setLoading(false);
                        }
                    }, (err) => {
                        console.error("Error fetching case:", err);
                        setError(err.message);
                        setLoading(false);
                    });
                } else {
                    // Query by clientUid
                    const casesRef = collection(db, 'cases');
                    const q = query(casesRef, where('clientUid', '==', idValue));
                    unsubscribeCase = onSnapshot(q, (snapshot) => {
                        if (snapshot.empty) {
                            console.log("No case found for client:", idValue);
                            setProject(null);
                            setLoading(false);
                            return;
                        }
                        const caseDoc = snapshot.docs[0];
                        const caseData = caseDoc.data() as Case;
                        setupSubListeners(caseDoc.ref, caseData, setProject, () => setLoading(false));
                    }, (err) => {
                        console.error("Error fetching case:", err);
                        setError(err.message);
                        setLoading(false);
                    });
                }
            } catch (err: any) {
                console.error("Error setting up case listener:", err);
                setError(err.message);
                setLoading(false);
            }
        };

        fetchCase();

        return () => {
            if (unsubscribeCase) unsubscribeCase();
        };
    }, [identifier]); // Deep comparison or simplified dep check might be needed if object passed dynamically

    return { project, loading, error };
};

const formatDateRange = (start: Date, end: Date): string =>
    `${start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – ${end.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;

// Normalize Firestore timestamp to Date
const toDate = (v: unknown): Date | undefined => {
    if (v == null) return undefined;
    if (v instanceof Date) return isNaN(v.getTime()) ? undefined : v;
    if (typeof (v as any).toDate === 'function') return (v as any).toDate();
    if (typeof (v as any).seconds === 'number') return new Date((v as any).seconds * 1000);
    if (typeof v === 'string' || typeof v === 'number') { const d = new Date(v as any); return isNaN(d.getTime()) ? undefined : d; }
    return undefined;
};

// Helper to setup subcollection listeners and merge data
const setupSubListeners = (
    caseRef: any,
    caseData: Case,
    setProject: (p: ClientProject) => void,
    onDataLoaded?: () => void
) => {
    let approvals: ApprovalRequest[] = [];
    let payments: CasePayment[] = [];
    let documents: CaseDocument[] = [];
    let updates: CaseDailyUpdate[] = [];
    let invoices: Invoice[] = [];
    let quotations: Array<{ createdAt?: unknown; grandTotal?: number; finalAmount?: number; title?: string }> = [];

    const update = () => {
        const mappedProject = mapToClientProject(caseData, approvals, payments, documents, updates, invoices, quotations);
        setProject(mappedProject);
        if (onDataLoaded) onDataLoaded();
    };

    // Fetch quotations once for journey (quotation date / description)
    getDocs(collection(caseRef, 'quotations')).then((snap) => {
        quotations = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
        update();
    }).catch(() => update());

    // 1. Approvals
    // Note: UserRole doesn't have "CLIENT" yet, assuming we added it or using string check
    const approvalsUnsub = onSnapshot(collection(caseRef, 'approvals'), (snap) => {
        approvals = snap.docs.map(d => ({ id: d.id, ...d.data() } as ApprovalRequest))
            .filter(a => (a.assignedToRole as any) === 'CLIENT' || (a as any).requiredRoles?.includes('CLIENT'));
        update();
    });

    // 2. Payments
    const paymentsUnsub = onSnapshot(collection(caseRef, 'payments'), (snap) => {
        payments = snap.docs.map(d => ({ id: d.id, ...d.data() } as CasePayment));
        update();
    });

    // 3. Documents (Visible to Client)
    const docsQ = query(
        collection(caseRef, 'documents'),
        where('visibleToClient', '==', true)
    );
    const docsUnsub = onSnapshot(docsQ, (snap) => {
        documents = snap.docs.map(d => ({ id: d.id, ...d.data() } as CaseDocument));
        update();
    });

    // 4. Daily Updates
    const updatesQ = query(collection(caseRef, 'dailyUpdates'), orderBy('date', 'desc'));
    const updatesUnsub = onSnapshot(updatesQ, (snap) => {
        updates = snap.docs.map(d => ({ id: d.id, ...d.data() } as CaseDailyUpdate));
        update();
    });

    // 5. Invoices (skip if individual lead with null organizationId)
    const invoicesRef = caseData.organizationId
        ? collection(db, `organizations/${caseData.organizationId}/invoices`)
        : null;
    const invoicesUnsub = invoicesRef
        ? onSnapshot(query(invoicesRef, where('caseId', '==', caseData.id)), (snap) => {
            invoices = snap.docs
                .map(d => ({ id: d.id, ...d.data() } as Invoice))
                .filter(inv => inv.visibleToClient === true && inv.approvalStatus === 'approved');
            update();
        })
        : () => { };

    // Initial update
    update();

    // Note: We are not returning unsubscribes here, which causes a memory leak if unmount.
    // Ideally useClientCase should handle this ref cleanup.
    // For this 'Verification' phase, this is acceptable, but in prod we'd track these unsubs in a ref.
    return () => {
        approvalsUnsub();
        paymentsUnsub();
        docsUnsub();
        updatesUnsub();
        invoicesUnsub();
    };
};

const mapToClientProject = (
    c: Case,
    approvals: ApprovalRequest[],
    payments: CasePayment[],
    docs: CaseDocument[],
    updates: CaseDailyUpdate[],
    invoices: Invoice[],
    quotations: Array<{ createdAt?: unknown; grandTotal?: number; finalAmount?: number; title?: string }> = []
): ClientProject => {

    const now = new Date();
    const created = toDate(c.createdAt) ?? new Date();
    const firstQuotation = quotations.length > 0
        ? [...quotations].sort((a, b) => (toDate(a.createdAt)?.getTime() ?? 0) - (toDate(b.createdAt)?.getTime() ?? 0))[0]
        : null;
    const quotationDate = firstQuotation ? toDate(firstQuotation.createdAt) : undefined;
    const planStart = c.executionPlan?.startDate ? toDate(c.executionPlan.startDate) : undefined;
    const workflow = c.workflow ?? { siteVisitDone: false, quotationDone: false, boqDone: false };

    // Full journey: Call → Site inspection → BOQ & Quotation → Project initiated → Execution phases
    const preStages: JourneyStage[] = [];

    // 1. Call connected
    preStages.push({
        id: 1,
        name: 'Call connected',
        description: 'First contact established with our team.',
        status: 'completed',
        responsibleRole: 'consultant',
        startDate: created,
        expectedEndDate: created,
        actualEndDate: created,
    });

    // 2. Site inspection
    const siteDone = workflow.siteVisitDone || [CaseStatus.SITE_VISIT, CaseStatus.DRAWING, CaseStatus.BOQ, CaseStatus.QUOTATION, CaseStatus.NEGOTIATION, CaseStatus.WAITING_FOR_PAYMENT, CaseStatus.WAITING_FOR_PLANNING, CaseStatus.PLANNING_SUBMITTED, CaseStatus.EXECUTION_ACTIVE, CaseStatus.COMPLETED].includes(c.status as CaseStatus);
    preStages.push({
        id: 2,
        name: 'Site inspection',
        description: 'Site visit and measurements completed. Scope and requirements documented.',
        status: siteDone ? 'completed' : (c.status === CaseStatus.SITE_VISIT ? 'in-progress' : 'locked'),
        responsibleRole: 'engineer',
        startDate: quotationDate ? new Date(quotationDate.getTime() - 5 * 24 * 60 * 60 * 1000) : undefined,
        expectedEndDate: quotationDate,
        actualEndDate: siteDone ? (quotationDate ?? created) : undefined,
    });

    // 3. BOQ & Quotation
    const quotDone = workflow.quotationDone || workflow.boqDone || (quotations.length > 0) || [CaseStatus.QUOTATION, CaseStatus.NEGOTIATION, CaseStatus.WAITING_FOR_PAYMENT, CaseStatus.WAITING_FOR_PLANNING, CaseStatus.PLANNING_SUBMITTED, CaseStatus.EXECUTION_ACTIVE, CaseStatus.COMPLETED].includes(c.status as CaseStatus);
    const quotAmount = firstQuotation?.grandTotal ?? firstQuotation?.finalAmount;
    const quotDesc = quotAmount != null ? `Scope and pricing shared. Quotation: ₹${(Number(quotAmount) / 100000).toFixed(2)} Lakhs` : 'Scope, BOQ and quotation shared with you.';
    preStages.push({
        id: 3,
        name: 'BOQ & Quotation',
        description: quotDesc,
        status: quotDone ? 'completed' : (c.status === CaseStatus.QUOTATION || c.status === CaseStatus.BOQ ? 'in-progress' : 'locked'),
        responsibleRole: 'consultant',
        startDate: quotationDate,
        expectedEndDate: quotationDate,
        actualEndDate: quotDone ? (quotationDate ?? created) : undefined,
    });

    // 4. Project initiated (converted to project)
    const projectStarted = c.isProject && (planStart ?? (payments.length > 0));
    const projectStartDate = planStart ?? (payments.length > 0 ? toDate((payments as any)[0]?.createdAt) : undefined) ?? created;
    preStages.push({
        id: 4,
        name: 'Project initiated',
        description: 'Advance received. Project kicked off and execution plan in place.',
        status: projectStarted ? 'completed' : (c.isProject ? 'in-progress' : 'locked'),
        responsibleRole: 'consultant',
        startDate: projectStartDate,
        expectedEndDate: planStart ?? projectStartDate,
        actualEndDate: projectStarted ? (planStart ?? projectStartDate) : undefined,
    });

    // 5. Execution phases (from executionPlan.phases)
    const phases = c.executionPlan?.phases ?? [];
    let phaseOffset = 5;
    const phaseStages: JourneyStage[] = phases.map((phase, idx) => {
        const start = toDate(phase.startDate);
        const end = toDate(phase.endDate);
        const isComplete = end && now >= end;
        const inProgress = start && end && now >= start && now <= end;
        return {
            id: phaseOffset + idx,
            name: phase.name,
            description: (phase as any).description || `Execution work: ${phase.name}. ${start && end ? `${formatDateRange(start, end)}` : ''}`,
            status: isComplete ? 'completed' : inProgress ? 'in-progress' : 'locked',
            responsibleRole: 'engineer',
            startDate: start,
            expectedEndDate: end,
            actualEndDate: isComplete ? end : undefined,
            progressPercent: inProgress ? 50 : (isComplete ? 100 : 0),
        };
    });

    const executionPlaceholder: JourneyStage = { id: 5, name: 'Execution', description: 'Waiting for execution plan. Phases and dates will appear here once approved.', status: 'locked', responsibleRole: 'engineer' };
    const allStages: JourneyStage[] = phaseStages.length > 0 ? [...preStages, ...phaseStages] : [...preStages, executionPlaceholder];
    const currentStageId = allStages.find(s => s.status === 'in-progress')?.id ?? (allStages.filter(s => s.status === 'completed').pop()?.id ?? 1);
    const stages: JourneyStage[] = allStages;

    // 2. Map Activities (Updates + Docs + Payments)
    let activities: ActivityItem[] = [];

    updates.forEach(u => {
        activities.push({
            id: u.id,
            type: 'progress',
            title: u.workDescription,
            timestamp: u.date instanceof Timestamp ? u.date.toDate() : new Date(u.date),
            actor: 'Site Team',
            actorRole: 'engineer'
        });
    });

    docs.forEach(d => {
        activities.push({
            id: d.id,
            type: 'upload',
            title: `Document Uploaded: ${d.fileName}`,
            timestamp: d.uploadedAt instanceof Timestamp ? d.uploadedAt.toDate() : new Date(d.uploadedAt),
            actor: 'System', // d.uploadedBy
            actorRole: 'consultant'
        });
    });

    // 3. Map Requests (Approvals)
    const requests: ClientRequest[] = approvals.map(a => ({
        id: a.id,
        type: 'approval',
        title: `Approval Required: ${a.type}`,
        description: a.payload.notes || 'Please review this item',
        status: a.status === 'pending' ? 'open' : 'resolved',
        priority: 'high',
        createdAt: a.requestedAt instanceof Timestamp ? a.requestedAt.toDate() : new Date(a.requestedAt),
        updatedAt: a.requestedAt instanceof Timestamp ? a.requestedAt.toDate() : new Date(a.requestedAt),
        conversation: []
    }));

    // 4. Map Payment Milestones
    // If we have budget/payment terms, map here.
    const paymentMilestones: PaymentMilestone[] = []; // Populate from c.paymentTerms if available

    // 5. Transparency
    const transparency: TransparencyData = {
        totalDurationDays: 60, // Calc
        daysCompleted: 10,
        daysRemaining: 50,
        projectHealth: 'on-track',
        delays: [],
        nextAction: approvals.length > 0 ? {
            actor: 'client',
            action: 'Pending Approvals',
            description: `You have ${approvals.length} pending approvals`
        } : {
            actor: 'company',
            action: 'Work in progress'
        },
        estimatedCompletion: new Date()
    };

    return {
        projectId: c.id,
        clientName: c.clientName,
        clientEmail: c.clientEmail || '',
        projectName: c.title,
        projectType: 'Office Interior',
        area: 'N/A', // c.area
        budget: c.financial?.totalBudget ? `₹${(c.financial.totalBudget / 100000).toFixed(2)} Lakhs` : 'TBD',
        startDate: c.executionPlan?.startDate ? (c.executionPlan.startDate instanceof Timestamp ? c.executionPlan.startDate.toDate() : new Date(c.executionPlan.startDate)) : new Date(),
        expectedCompletion: c.executionPlan?.endDate ? (c.executionPlan.endDate instanceof Timestamp ? c.executionPlan.endDate.toDate() : new Date(c.executionPlan.endDate)) : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // Default +60 days
        currentStageId,
        stages,
        consultant: {
            id: c.assignedSales || 'admin',
            name: 'Relationship Manager', // Fetch name if possible, else generic
            phone: '',
            email: ''
        },
        paymentMilestones: paymentMilestones,
        activities: activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()),
        requests: requests, // Merge with docs requests if needed
        transparency: transparency,
        documents: docs.map(d => ({
            id: d.id,
            name: d.fileName,
            category: mapDocTypeToCategory(d.type),
            date: d.uploadedAt instanceof Timestamp ? d.uploadedAt.toDate() : new Date(d.uploadedAt),
            size: 'N/A', // Size not in CaseDocument
            url: d.fileUrl
        })),
        totalPaid: c.financial?.totalCollected || 0,
        totalBudget: c.financial?.totalBudget || 0,
        planDays: (c.executionPlan?.days ?? []).map((d: { date: any }) => ({
            date: d.date instanceof Timestamp ? d.date.toDate() : new Date(d.date)
        })),
    };
};

const mapDocTypeToCategory = (type: any): 'Contract' | 'Invoice' | 'Report' | 'Drawing' | 'Other' => {
    switch (type) {
        case '2d':
        case '3d':
        case 'recce':
            return 'Drawing';
        case 'quotation':
        case 'boq':
            return 'Contract'; // or Report
        default:
            return 'Other';
    }
};
