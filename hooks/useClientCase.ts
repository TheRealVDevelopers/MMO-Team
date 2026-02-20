import { useState, useEffect } from 'react';
import {
    doc,
    onSnapshot,
    Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import {
    Case
} from '../types';
import {
    ClientProject,
    JourneyStage,
    PaymentMilestone,
    ClientRequest,
    ClientDailyUpdateItem,
    LeadJourneyStep,
    ClientDocument
} from '../components/client-portal/types';

type ClientCaseInput = string | { type: 'caseId' | 'clientUid'; value: string } | undefined;

export const useClientCase = (input: ClientCaseInput, clientUserId?: string) => {
    const [project, setProject] = useState<ClientProject | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Safe extraction of caseId
        let caseId: string | undefined;

        if (typeof input === 'string') {
            caseId = input;
        } else if (input && typeof input === 'object' && input.type === 'caseId') {
            caseId = input.value;
        }

        if (!caseId || caseId === '') {
            setLoading(false);
            return;
        }

        console.log('useClientCase: fetching case', caseId);
        const caseRef = doc(db, 'cases', caseId);

        const unsubCase = onSnapshot(caseRef, (docSnap) => {
            if (!docSnap.exists()) {
                setError('Project not found');
                setLoading(false);
                return;
            }

            const data = docSnap.data() as Case;

            // --- Mappers ---

            // 1. Payment Milestones (from financial.installmentSchedule)
            const paymentMilestones: PaymentMilestone[] = (data.financial?.installmentSchedule || []).map((inst: any) => ({
                id: inst.id,
                stageName: inst.milestoneName,
                stageId: 0, // Generic
                amount: inst.amount,
                percentage: inst.percentage,
                isPaid: inst.status === 'Paid',
                paidAt: inst.paidAt instanceof Timestamp ? inst.paidAt.toDate() : inst.paidAt ? new Date(inst.paidAt) : undefined,
                dueDate: inst.dueDate instanceof Timestamp ? inst.dueDate.toDate() : inst.dueDate ? new Date(inst.dueDate) : undefined,
                unlocksStage: 0,
                description: inst.status
            }));

            // 2. Journey Stages (Execution Plan Phases -> JourneyStage)
            const stages: JourneyStage[] = (data.executionPlan?.phases || []).map((phase: any, index: number) => ({
                id: index + 1,
                name: phase.name,
                description: `Phase ${index + 1}`,
                status: phase.status === 'completed' ? 'completed' : phase.status === 'in_progress' ? 'in-progress' : 'locked',
                responsibleRole: 'designer', // Default
                progressPercent: phase.completionPercent || 0,
                startDate: phase.startDate instanceof Timestamp ? phase.startDate.toDate() : phase.startDate ? new Date(phase.startDate) : undefined,
                expectedEndDate: phase.endDate instanceof Timestamp ? phase.endDate.toDate() : phase.endDate ? new Date(phase.endDate) : undefined,
            }));

            // 3. Lead Journey Steps (LeadJourney -> LeadJourneyStep)
            const leadJourneySteps: LeadJourneyStep[] = [];
            if (data.leadJourney) {
                if (data.leadJourney.callInitiated) leadJourneySteps.push({ key: 'call', label: 'Intro Call', status: 'completed', date: toDate(data.leadJourney.callInitiated) });
                if (data.leadJourney.siteVisitCompleted) leadJourneySteps.push({ key: 'site_visit', label: 'Site Visit', status: 'completed', date: toDate(data.leadJourney.siteVisitCompleted) });
            }

            // 4. Daily Updates (data.dailyLogs -> ClientDailyUpdateItem)
            const dailyUpdates: ClientDailyUpdateItem[] = (data.dailyLogs || []).map((log: any) => ({
                id: log.id,
                date: toDate(log.date) || new Date(),
                workDescription: log.workDescription,
                completionPercent: log.completionPercent,
                manpowerCount: log.manpowerCount,
                photos: log.photos || [],
                blocker: log.blocker
            }));

            // 5. Chat (data.chat -> ClientProject.chat)
            const chatMessages = (data.chat || []).map((msg: any) => ({
                ...msg,
                timestamp: toDate(msg.timestamp) || new Date()
            }));

            // 6. Documents (data.documents -> ClientDocument)
            const documents: ClientDocument[] = [];

            // 7. Requests / Approvals (data.approvals -> ClientRequest)
            const requests: ClientRequest[] = (data.approvals || []).map((app: any) => ({
                id: app.id || 'unknown',
                type: 'approval',
                title: app.type,
                description: app.payload?.notes || 'Please review',
                status: app.status === 'pending' ? 'open' : app.status === 'approved' ? 'resolved' : 'in-progress',
                priority: 'high',
                createdAt: toDate(app.createdAt) || new Date(),
                updatedAt: new Date(),
                conversation: []
            }));

            // Compute paid total from milestones
            const totalPaid = paymentMilestones
                .filter(m => m.isPaid)
                .reduce((sum, m) => sum + m.amount, 0);
            const totalBudget = data.financial?.totalBudget || 0;
            const budgetUtil = totalBudget > 0 ? Math.round((totalPaid / totalBudget) * 100) : 0;

            // Compute days remaining
            const endDate = toDate(data.executionPlan?.endDate);
            const startDate = toDate(data.executionPlan?.startDate);
            const now = new Date();
            const daysRemaining = endDate ? Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : (data.health?.daysRemaining || 0);
            const totalDuration = startDate && endDate ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
            const daysCompleted = totalDuration - daysRemaining;

            // Current stage: find active in-progress, or last completed
            const activeIdx = stages.findIndex(s => s.status === 'in-progress');
            const currentStageId = activeIdx >= 0 ? stages[activeIdx].id : (stages.length > 0 ? stages[stages.length - 1].id : 1);

            const clientProject: ClientProject = {
                projectId: docSnap.id,
                clientName: data.clientName || 'Valued Client',
                clientEmail: data.clientEmail || '',
                projectType: (data as any).projectType || 'Commercial',
                projectName: data.projectName || data.title || 'Project',
                area: (data as any).area || '',
                budget: totalBudget.toString(),
                startDate: startDate || new Date(),
                expectedCompletion: endDate || new Date(),
                currentStageId,
                stages,
                consultant: {
                    id: data.assignedSales || 'sales',
                    name: (data as any).consultantName || 'Relationship Manager',
                    phone: (data as any).consultantPhone || '',
                    email: (data as any).consultantEmail || ''
                },
                paymentMilestones,
                activities: [],
                requests,
                transparency: {
                    totalDurationDays: totalDuration,
                    daysCompleted: Math.max(0, daysCompleted),
                    daysRemaining,
                    projectHealth: (data.health?.status?.toLowerCase().replace(' ', '-') as any) || 'on-track',
                    healthReason: (data.health as any)?.reason || '',
                    delays: ((data as any).delays || []).map((d: any) => ({
                        stageId: 0,
                        stageName: d.stageName || '',
                        days: d.days || 0,
                        reason: d.reason || '',
                    })),
                    nextAction: {
                        actor: (data as any).nextAction?.actor || 'company',
                        action: (data as any).nextAction?.action || 'Update in progress',
                    },
                    estimatedCompletion: endDate || new Date(),
                },
                documents,
                leadJourneySteps,
                leadJourney: data.leadJourney || {},
                dailyUpdates,
                chat: chatMessages,
                totalPaid,
                totalBudget,
                budgetUtilizationPercent: budgetUtil,
            };

            setProject(clientProject);
            setLoading(false);
            setError(null);
        }, (err) => {
            console.error(err);
            setError(err.message);
            setLoading(false);
        });

        return () => unsubCase();
    }, [input]);

    return { project, loading, error };
};

// Helper
function toDate(val: any): Date | undefined {
    if (!val) return undefined;
    if (val instanceof Timestamp) return val.toDate();
    if (val instanceof Date) return val;
    if (typeof val === 'string') return new Date(val);
    return undefined;
}
