/**
 * Execution Timeline Page – READ-ONLY monitor for approved plan.
 * Data from: cases/{caseId}, cases/{caseId}/dailyUpdates, cases/{caseId}/procurementPlans.
 * Dual view: Timeline (vertical) | Gantt (horizontal bars).
 */

import React, { useState, useEffect, useMemo } from 'react';
import { doc, onSnapshot, collection, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase';
import { FIRESTORE_COLLECTIONS } from '../../../constants';
import { formatDate, formatCurrencyINR } from '../../../constants';
import { ArrowLeftIcon, CalendarIcon, ChartBarIcon, UserGroupIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

type TimelineStatus = 'completed' | 'in_progress' | 'upcoming' | 'delayed';

interface TimelineEvent {
  date: Date;
  endDate?: Date;
  type: string;
  title: string;
  description?: string;
  labor?: number;
  manpower?: number;
  status: TimelineStatus;
  sortKey: number;
  dailyUpdateId?: string;
}

function toDate(v: unknown): Date | null {
  if (v == null) return null;
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
  if (typeof v === 'number') { const d = new Date(v); return isNaN(d.getTime()) ? null : d; }
  if (typeof v === 'string') { const d = new Date(v); return isNaN(d.getTime()) ? null : d; }
  if (v && typeof v === 'object') {
    if ('toDate' in v && typeof (v as any).toDate === 'function') return (v as any).toDate();
    if ('seconds' in v) return new Date((v as any).seconds * 1000);
  }
  return null;
}

function differenceInDays(a: Date, b: Date): number {
  const ms = a.getTime() - b.getTime();
  return Math.round(ms / (24 * 60 * 60 * 1000));
}

function calculateStatus(event: { date: Date; endDate?: Date; completed?: boolean }): TimelineStatus {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(event.date);
  start.setHours(0, 0, 0, 0);
  const end = event.endDate ? new Date(event.endDate) : null;
  if (end) end.setHours(0, 0, 0, 0);
  if (event.completed) return 'completed';
  if (end && today > end) return 'delayed';
  if (today >= start && (!end || today <= end)) return 'in_progress';
  if (today < start) return 'upcoming';
  return 'completed';
}

const statusColor: Record<TimelineStatus, string> = {
  completed: 'bg-green-500',
  in_progress: 'bg-blue-500',
  upcoming: 'bg-gray-400',
  delayed: 'bg-red-500',
};

interface Props {
  caseId: string | null;
  onSelectProject: (caseId: string) => void;
  onBack?: () => void;
}

const ExecutionTimelinePage: React.FC<Props> = ({ caseId, onSelectProject, onBack }) => {
  const [viewMode, setViewMode] = useState<'timeline' | 'gantt'>('timeline');
  const [caseData, setCaseData] = useState<any>(null);
  const [dailyUpdates, setDailyUpdates] = useState<Array<{ id: string; date: any; workDescription: string; manpowerCount: number }>>([]);
  const [procurementPlans, setProcurementPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dailyLogModal, setDailyLogModal] = useState<{ updates: typeof dailyUpdates } | null>(null);

  useEffect(() => {
    if (!db || !caseId) {
      setLoading(false);
      setCaseData(null);
      setDailyUpdates([]);
      setProcurementPlans([]);
      return;
    }
    setLoading(true);
    const caseRef = doc(db, FIRESTORE_COLLECTIONS.CASES, caseId);
    const unsubCase = onSnapshot(caseRef, (snap) => {
      setCaseData(snap.exists() ? { id: snap.id, ...snap.data() } : null);
    });
    const dailyRef = collection(db, FIRESTORE_COLLECTIONS.CASES, caseId, FIRESTORE_COLLECTIONS.DAILY_UPDATES);
    const unsubDaily = onSnapshot(dailyRef, (snap) => {
      setDailyUpdates(
        snap.docs.map((d) => {
          const data = d.data();
          const date = data.date?.toDate?.() ?? data.date;
          return {
            id: d.id,
            date,
            workDescription: data.workDescription ?? '',
            manpowerCount: data.manpowerCount ?? 0,
          };
        })
      );
    });
    const plansRef = collection(db, FIRESTORE_COLLECTIONS.CASES, caseId, FIRESTORE_COLLECTIONS.PROCUREMENT_PLANS);
    getDocs(plansRef).then((snap) => {
      setProcurementPlans(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }).catch(() => setProcurementPlans([]));
    setLoading(false);
    return () => {
      unsubCase();
      unsubDaily();
    };
  }, [caseId]);

  const timelineEvents = useMemo((): TimelineEvent[] => {
    const events: TimelineEvent[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!caseData) return events;

    const plan = caseData.executionPlan;
    const fundRequests = caseData.executionFundRequests || [];

    if (plan?.startDate) {
      const d = toDate(plan.startDate);
      if (d) {
        events.push({
          date: d,
          type: 'project_start',
          title: 'Execution Start',
          description: 'Execution officially begins',
          status: today >= d ? 'completed' : 'upcoming',
          sortKey: d.getTime(),
        });
      }
    }

    (plan?.phases || []).forEach((phase: any) => {
      const start = toDate(phase.startDate);
      if (start) {
        const end = toDate(phase.endDate);
        const evt: TimelineEvent = {
          date: start,
          endDate: end ?? undefined,
          type: 'phase',
          title: phase.name ?? 'Phase',
          description: phase.description,
          labor: phase.laborCount,
          status: calculateStatus({ date: start, endDate: end ?? undefined, completed: phase.completed }),
          sortKey: start.getTime(),
        };
        events.push(evt);
      }
    });

    fundRequests.forEach((req: any) => {
      const d = toDate(req.requiredOn);
      if (d) {
        events.push({
          date: d,
          type: 'fund_request',
          title: 'Funds Required',
          description: `${formatCurrencyINR(Number(req.amount) || 0)} - ${req.reason ?? ''}`,
          status: req.status === 'approved' ? 'completed' : req.status === 'rejected' ? 'completed' : today >= d ? 'in_progress' : 'upcoming',
          sortKey: d.getTime(),
        });
      }
    });

    procurementPlans.forEach((plan: any) => {
      const d = toDate(plan.expectedDeliveryDate);
      if (d) {
        events.push({
          date: d,
          type: 'material_delivery',
          title: `Material Delivery - ${plan.itemName ?? 'Item'}`,
          description: `Vendor: ${plan.vendorName ?? '—'}`,
          status: plan.status === 'DELIVERED' ? 'completed' : today > d ? 'delayed' : 'upcoming',
          sortKey: d.getTime(),
        });
      }
    });

    dailyUpdates.forEach((update) => {
      const d = toDate(update.date);
      if (d) {
        events.push({
          date: d,
          type: 'daily_update',
          title: 'Daily Work Log',
          description: update.workDescription,
          manpower: update.manpowerCount,
          status: today > d ? 'completed' : today.getTime() === d.getTime() ? 'in_progress' : 'upcoming',
          sortKey: d.getTime(),
          dailyUpdateId: update.id,
        });
      }
    });

    events.sort((a, b) => a.sortKey - b.sortKey);
    return events;
  }, [caseData, dailyUpdates, procurementPlans]);

  const phaseEvents = useMemo(() => timelineEvents.filter((e) => e.type === 'phase'), [timelineEvents]);
  const minDate = useMemo(() => {
    const starts = phaseEvents.map((e) => e.date.getTime());
    return starts.length ? new Date(Math.min(...starts)) : new Date();
  }, [phaseEvents]);
  const maxDate = useMemo(() => {
    const ends = phaseEvents.flatMap((e) => (e.endDate ? [e.endDate.getTime()] : [e.date.getTime()]));
    return ends.length ? new Date(Math.max(...ends)) : new Date();
  }, [phaseEvents]);
  const totalDays = useMemo(() => Math.max(1, differenceInDays(maxDate, minDate)), [minDate, maxDate]);

  if (!caseId) {
    return (
      <div className="p-6 max-w-xl mx-auto">
        {onBack && (
          <button type="button" onClick={onBack} className="flex items-center gap-2 text-text-secondary hover:text-text-primary mb-6">
            <ArrowLeftIcon className="w-5 h-5" /> Back
          </button>
        )}
        <div className="rounded-xl border border-border bg-surface p-12 text-center">
          <CalendarIcon className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
          <h2 className="text-xl font-bold text-text-primary mb-2">Select a project</h2>
          <p className="text-text-secondary mb-6">Choose a project from the Projects page to view its timeline.</p>
          <button
            type="button"
            onClick={() => onSelectProject('')}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 font-medium"
          >
            Go to Projects
          </button>
        </div>
      </div>
    );
  }

  if (loading && !caseData) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {onBack && (
        <button type="button" onClick={onBack} className="flex items-center gap-2 text-text-secondary hover:text-text-primary mb-4">
          <ArrowLeftIcon className="w-5 h-5" /> Back
        </button>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Timeline</h1>
          <p className="text-text-secondary text-sm mt-0.5">{caseData?.title ?? caseData?.projectName ?? 'Project'}</p>
        </div>
        <div className="flex rounded-lg border border-border overflow-hidden">
          <button
            type="button"
            onClick={() => setViewMode('timeline')}
            className={`px-4 py-2 text-sm font-medium flex items-center gap-2 ${viewMode === 'timeline' ? 'bg-primary text-white' : 'bg-surface text-text-secondary hover:bg-background-hover'}`}
          >
            <CalendarIcon className="w-4 h-4" /> Timeline View
          </button>
          <button
            type="button"
            onClick={() => setViewMode('gantt')}
            className={`px-4 py-2 text-sm font-medium flex items-center gap-2 ${viewMode === 'gantt' ? 'bg-primary text-white' : 'bg-surface text-text-secondary hover:bg-background-hover'}`}
          >
            <ChartBarIcon className="w-4 h-4" /> Gantt View
          </button>
        </div>
      </div>

      {viewMode === 'timeline' && (
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" aria-hidden />
          <ul className="space-y-0">
            {timelineEvents.map((evt, idx) => {
              const color = statusColor[evt.status] ?? statusColor.upcoming;
              const dateStr = formatDate(evt.date);
              return (
                <li key={`${evt.type}-${idx}`} className="relative flex gap-4 pb-6">
                  <div className={`relative z-10 w-8 h-8 rounded-full flex-shrink-0 mt-0.5 ${color}`} aria-hidden />
                  <div className="flex-1 min-w-0 pt-0">
                    <p className="text-xs text-text-tertiary font-medium">{dateStr}</p>
                    <p className="font-semibold text-text-primary mt-0.5">{evt.title}</p>
                    {evt.description && <p className="text-sm text-text-secondary mt-1">{evt.description}</p>}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(evt.labor != null && evt.labor > 0) && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">
                          <UserGroupIcon className="w-3.5 h-3.5" /> {evt.labor} Workers
                        </span>
                      )}
                      {(evt.manpower != null && evt.manpower > 0) && evt.type === 'daily_update' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-700">
                          <UserGroupIcon className="w-3.5 h-3.5" /> {evt.manpower} workers
                        </span>
                      )}
                      {evt.type === 'daily_update' && (
                        <button
                          type="button"
                          onClick={() => setDailyLogModal({ updates: dailyUpdates })}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-primary/10 text-primary hover:bg-primary/20"
                        >
                          <DocumentTextIcon className="w-3.5 h-3.5" /> Daily update added
                        </button>
                      )}
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium capitalize ${
                        evt.status === 'completed' ? 'bg-green-100 text-green-800' :
                        evt.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        evt.status === 'delayed' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {evt.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {viewMode === 'gantt' && (
        <div className="space-y-4">
          {phaseEvents.map((evt, idx) => {
            const start = evt.date;
            const end = evt.endDate ?? evt.date;
            const duration = Math.max(1, differenceInDays(end, start));
            const offsetDays = differenceInDays(start, minDate);
            const widthPct = Math.min(100, (duration / totalDays) * 100);
            const leftPct = totalDays > 0 ? (offsetDays / totalDays) * 100 : 0;
            const barColor = evt.status === 'completed' ? 'bg-green-500' : evt.status === 'delayed' ? 'bg-red-500' : 'bg-blue-500';
            return (
              <div key={`gantt-${idx}`} className="flex items-center gap-4">
                <div className="w-32 flex-shrink-0">
                  <p className="font-medium text-text-primary truncate" title={evt.title}>{evt.title}</p>
                  {evt.labor != null && evt.labor > 0 && (
                    <p className="text-xs text-text-tertiary flex items-center gap-1">
                      <UserGroupIcon className="w-3 h-3" /> {evt.labor} workers
                    </p>
                  )}
                </div>
                <div className="flex-1 h-8 bg-gray-100 rounded relative overflow-hidden">
                  <div
                    className={`absolute h-full rounded ${barColor}`}
                    style={{ left: `${leftPct}%`, width: `${widthPct}%`, minWidth: '4px' }}
                  />
                </div>
                <div className="w-24 text-right text-xs text-text-tertiary flex-shrink-0">
                  {formatDate(start)} – {formatDate(end)}
                </div>
              </div>
            );
          })}
          {phaseEvents.length === 0 && (
            <p className="text-text-secondary text-center py-8">No phases in plan. Add phases in Planning to see Gantt.</p>
          )}
        </div>
      )}

      {timelineEvents.length === 0 && viewMode === 'timeline' && (
        <div className="rounded-xl border border-border bg-surface p-8 text-center text-text-secondary">
          No timeline events yet. Execution plan and daily updates will appear here.
        </div>
      )}

      {dailyLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setDailyLogModal(null)}>
          <div className="bg-surface border border-border rounded-xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="text-lg font-semibold text-text-primary">Daily logs</h3>
              <button type="button" onClick={() => setDailyLogModal(null)} className="p-2 rounded-lg hover:bg-background-hover text-text-secondary">✕</button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              {dailyLogModal.updates.length === 0 ? (
                <p className="text-text-secondary">No daily updates yet.</p>
              ) : (
                <ul className="space-y-3">
                  {dailyLogModal.updates
                    .sort((a, b) => (toDate(b.date)?.getTime() ?? 0) - (toDate(a.date)?.getTime() ?? 0))
                    .map((u) => (
                      <li key={u.id} className="p-3 rounded-lg bg-background-hover border border-border">
                        <p className="text-xs text-text-tertiary font-medium">{formatDate(toDate(u.date) ?? new Date())}</p>
                        <p className="text-text-primary mt-1 whitespace-pre-wrap">{u.workDescription || '—'}</p>
                        {u.manpowerCount > 0 && <p className="text-sm text-text-secondary mt-1 flex items-center gap-1"><UserGroupIcon className="w-4 h-4" /> {u.manpowerCount} workers</p>}
                      </li>
                    ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExecutionTimelinePage;
