/**
 * Project Reference Page – Execution control panel & full timeline.
 * Loads case from cases/{caseId}. Displays payment verification, planning, phases,
 * fund requests, vendor deliveries, and status/delay indicators in a vertical timeline.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, collection, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase';
import { FIRESTORE_COLLECTIONS } from '../../../constants';
import { formatCurrencyINR, formatDate } from '../../../constants';
import { Case } from '../../../types';
import { Timestamp } from 'firebase/firestore';
import type { ProcurementPlanDoc } from '../../../types';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

type TimelineStatus = 'completed' | 'in_progress' | 'upcoming' | 'delayed' | 'rejected';

interface TimelineEvent {
  date: Date | string;
  type: string;
  title: string;
  description?: string;
  status: TimelineStatus;
  sortKey: number;
}

function toDate(v: unknown): Date | null {
  if (v == null) return null;
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
  if (typeof v === 'number') { const d = new Date(v); return isNaN(d.getTime()) ? null : d; }
  if (typeof v === 'string') { const d = new Date(v); return isNaN(d.getTime()) ? null : d; }
  if (v && typeof v === 'object') {
    if ('toDate' in v && typeof (v as any).toDate === 'function') {
      try { return (v as Timestamp).toDate(); } catch { return null; }
    }
    if ('seconds' in v && typeof (v as any).seconds === 'number') return new Date((v as any).seconds * 1000);
  }
  return null;
}

function toSortKey(d: Date | string | null): number {
  if (!d) return 0;
  const t = d instanceof Date ? d : new Date(d);
  return isNaN(t.getTime()) ? 0 : t.getTime();
}

function calculatePhaseStatus(phase: { startDate?: unknown; endDate?: unknown; completed?: boolean }): TimelineStatus {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = toDate(phase.startDate);
  const end = toDate(phase.endDate);
  if (phase.completed) return 'completed';
  if (end && today > end) return 'delayed';
  if (start && end && today >= start && today <= end) return 'in_progress';
  if (start && today < start) return 'upcoming';
  return 'completed';
}

const statusColor: Record<TimelineStatus, string> = {
  completed: 'bg-green-500',
  in_progress: 'bg-blue-500',
  upcoming: 'bg-gray-400',
  delayed: 'bg-red-500',
  rejected: 'bg-orange-500',
};

function formatDateSafe(date: Date | string | null): string {
  if (!date) return '—';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '—';
  return formatDate(d);
}

const STATUS_LABELS: Record<string, string> = {
  waiting_for_planning: 'Waiting for Planning',
  planning_submitted: 'Planning Submitted',
  execution_active: 'Execution Active',
  completed: 'Completed',
  lead: 'Lead',
  waiting_for_payment: 'Waiting for Payment',
};

const ProjectReferencePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const projectId = searchParams.get('project');

  const [caseData, setCaseData] = useState<Case | null>(null);
  const [procurementPlans, setProcurementPlans] = useState<ProcurementPlanDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!db || !projectId) {
      setLoading(false);
      setError(!projectId ? 'No project ID in URL' : null);
      return;
    }
    const caseRef = doc(db, FIRESTORE_COLLECTIONS.CASES, projectId);
    const unsub = onSnapshot(
      caseRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as any;
          const normalized: Case = {
            ...data,
            id: snap.id,
            title: data?.title ?? data?.projectName ?? 'Project',
            projectName: data?.title ?? data?.projectName ?? 'Project',
            clientName: data?.clientName ?? '—',
            status: data?.status ?? '—',
            createdAt: data?.createdAt instanceof Timestamp ? data.createdAt.toDate() : data?.createdAt ? new Date(data.createdAt) : new Date(),
            updatedAt: data?.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data?.updatedAt ? new Date(data.updatedAt) : undefined,
          };
          if (data?.financial && typeof data.financial === 'object') {
            (normalized as any).financial = {
              ...data.financial,
              verifiedAt: data.financial.verifiedAt != null ? toDate(data.financial.verifiedAt) ?? data.financial.verifiedAt : undefined,
              advanceAmount: data.financial.advanceAmount ?? 0,
            };
          }
          if (data?.executionPlan && typeof data.executionPlan === 'object') {
            const plan = data.executionPlan;
            const phases = (plan.phases || []).map((p: any) => ({
              ...p,
              startDate: p.startDate != null ? (toDate(p.startDate) ?? p.startDate) : p.startDate,
              endDate: p.endDate != null ? (toDate(p.endDate) ?? p.endDate) : p.endDate,
            }));
            (normalized as any).executionPlan = {
              ...plan,
              createdAt: plan.createdAt != null ? (toDate(plan.createdAt) ?? plan.createdAt) : plan.createdAt,
              startDate: plan.startDate != null ? (toDate(plan.startDate) ?? plan.startDate) : plan.startDate,
              endDate: plan.endDate != null ? (toDate(plan.endDate) ?? plan.endDate) : plan.endDate,
              phases,
            };
          }
          if (Array.isArray(data?.executionFundRequests)) {
            (normalized as any).executionFundRequests = data.executionFundRequests.map((r: any) => ({
              ...r,
              requiredOn: r.requiredOn != null ? (typeof r.requiredOn === 'string' ? r.requiredOn : toDate(r.requiredOn)?.toISOString?.()?.slice(0, 10) ?? r.requiredOn) : r.requiredOn,
            }));
          }
          setCaseData(normalized);
        } else {
          setCaseData(null);
        }
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [projectId]);

  useEffect(() => {
    if (!db || !projectId) return;
    const plansRef = collection(db, FIRESTORE_COLLECTIONS.CASES, projectId, FIRESTORE_COLLECTIONS.PROCUREMENT_PLANS);
    getDocs(plansRef).then((snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ProcurementPlanDoc));
      setProcurementPlans(list);
    }).catch(() => setProcurementPlans([]));
  }, [projectId]);

  const timelineEvents = useMemo((): TimelineEvent[] => {
    const events: TimelineEvent[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!caseData) return events;

    const fin = caseData.financial;
    const plan = caseData.executionPlan as any;
    const fundRequests = (caseData.executionFundRequests || []) as Array<{ requiredOn: string; amount: number; reason: string; status: string }>;

    const paymentVerifiedAt = (fin as any)?.verifiedAt != null ? toDate((fin as any).verifiedAt) : null;
    if (paymentVerifiedAt) {
      const amount = Number((fin as any)?.advanceAmount) || 0;
      events.push({
        date: paymentVerifiedAt,
        type: 'payment_verified',
        title: 'Payment Verified',
        description: `Advance received: ${formatCurrencyINR(amount)}`,
        status: 'completed',
        sortKey: toSortKey(paymentVerifiedAt),
      });
    }

    const submittedAt = plan?.createdAt != null ? toDate(plan.createdAt) : null;
    if (submittedAt) {
      const approvalStatus = plan?.approvalStatus;
      events.push({
        date: submittedAt,
        type: 'planning_submitted',
        title: 'Planning Submitted for Approval',
        description: approvalStatus === 'approved' ? 'Approved' : approvalStatus === 'rejected' ? 'Rejected' : 'Pending',
        status: approvalStatus === 'approved' ? 'completed' : approvalStatus === 'rejected' ? 'rejected' : 'in_progress',
        sortKey: toSortKey(submittedAt),
      });
    }

    const startDate = plan?.startDate ? toDate(plan.startDate) : null;
    if (startDate) {
      events.push({
        date: startDate,
        type: 'execution_start',
        title: 'Execution Start Date',
        status: today >= startDate ? 'in_progress' : 'upcoming',
        sortKey: toSortKey(startDate),
      });
    }

    const phases = (plan?.phases || []) as Array<{ id?: string; name?: string; startDate?: unknown; endDate?: unknown; completed?: boolean }>;
    phases.forEach((phase) => {
      const start = toDate(phase.startDate);
      if (start) {
        events.push({
          date: start,
          type: 'phase_start',
          title: `Phase: ${phase.name ?? 'Unnamed'}`,
          description: phase.endDate ? `End: ${formatDateSafe(toDate(phase.endDate))}` : undefined,
          status: calculatePhaseStatus(phase),
          sortKey: toSortKey(start),
        });
      }
    });

    fundRequests.forEach((req) => {
      const d = toDate(req.requiredOn) || (typeof req.requiredOn === 'string' ? new Date(req.requiredOn) : null);
      if (!d || isNaN(d.getTime())) return;
      const amount = Number(req.amount) || 0;
      const reason = String(req.reason ?? '—');
      events.push({
        date: d,
        type: 'fund_request',
        title: 'Execution Fund Required',
        description: `${formatCurrencyINR(amount)} - ${reason}`,
        status: (req.status === 'approved' ? 'completed' : req.status === 'rejected' ? 'rejected' : 'in_progress') as TimelineStatus,
        sortKey: toSortKey(d),
      });
    });

    procurementPlans.forEach((p) => {
      const d = toDate(p.expectedDeliveryDate);
      if (d) {
        events.push({
          date: d,
          type: 'vendor_delivery',
          title: 'Material Delivery',
          description: p.itemName || p.vendorName,
          status: p.status === 'DELIVERED' ? 'completed' : today > d ? 'delayed' : 'upcoming',
          sortKey: toSortKey(d),
        });
      }
    });

    const endDate = plan?.endDate ? toDate(plan.endDate) : null;
    if (endDate) {
      events.push({
        date: endDate,
        type: 'project_completion_expected',
        title: 'Expected Completion Date',
        status: today > endDate ? 'delayed' : 'upcoming',
        sortKey: toSortKey(endDate),
      });
    }

    events.sort((a, b) => a.sortKey - b.sortKey);
    return events;
  }, [caseData, procurementPlans]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="p-6">
        <button type="button" onClick={() => navigate(-1)} className="flex items-center gap-2 text-text-secondary hover:text-text-primary mb-4">
          <ArrowLeftIcon className="w-5 h-5" /> Back
        </button>
        <div className="rounded-xl border border-border bg-surface p-6 text-center">
          <p className="text-error">{error || 'Project not found.'}</p>
          <p className="text-sm text-text-tertiary mt-1">Use the View button from Approvals with a valid project.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-text-secondary hover:text-text-primary mb-6"
      >
        <ArrowLeftIcon className="w-5 h-5" /> Back
      </button>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">{(caseData as any).title ?? (caseData as any).projectName ?? 'Project Reference'}</h1>
        <p className="text-text-secondary text-sm mt-1">{(caseData as any).clientName ?? '—'} · Status: {STATUS_LABELS[(caseData as any).status] ?? (caseData as any).status ?? '—'}</p>
      </div>

      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" aria-hidden />
        <ul className="space-y-0">
          {timelineEvents.map((evt, idx) => {
            const d = toDate(evt.date);
            const dateStr = formatDateSafe(d);
            const color = statusColor[evt.status] || statusColor.upcoming;
            return (
              <li key={`${evt.type}-${idx}`} className="relative flex gap-4 pb-8">
                <div className={`relative z-10 w-8 h-8 rounded-full ${color} flex-shrink-0 mt-0.5`} aria-hidden />
                <div className="flex-1 min-w-0 pt-0">
                  <p className="text-xs text-text-tertiary font-medium">{dateStr}</p>
                  <p className="font-semibold text-text-primary mt-0.5">{evt.title}</p>
                  {evt.description && <p className="text-sm text-text-secondary mt-1">{evt.description}</p>}
                  <span className={`inline-block mt-2 px-2 py-0.5 rounded text-xs font-medium capitalize ${
                    evt.status === 'completed' ? 'bg-green-100 text-green-800' :
                    evt.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    evt.status === 'delayed' ? 'bg-red-100 text-red-800' :
                    evt.status === 'rejected' ? 'bg-orange-100 text-orange-800' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {evt.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {timelineEvents.length === 0 && (
        <div className="rounded-xl border border-border bg-surface p-8 text-center text-text-secondary">
          No timeline events yet. Payment verification and execution planning will appear here.
        </div>
      )}
    </div>
  );
};

export default ProjectReferencePage;
