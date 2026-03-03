/**
 * Execution Timeline Page – READ-ONLY monitor for approved plan.
 * Data from: cases/{caseId}, cases/{caseId}/dailyUpdates, cases/{caseId}/procurementPlans.
 * Dual view: Timeline (vertical) | Gantt (horizontal bars).
 *
 * UI: Modern project selector grid → vertical milestone timeline → animated Gantt with today indicator.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { doc, onSnapshot, collection, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase';
import { FIRESTORE_COLLECTIONS } from '../../../constants';
import { formatDate, formatCurrencyINR } from '../../../constants';
import {
  ArrowLeftIcon,
  CalendarIcon,
  ChartBarIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  BuildingOfficeIcon,
  CurrencyRupeeIcon,
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { useProjects, Project } from '../../../hooks/useProjects';
import { CaseStatus } from '../../../types';

// ─── Types ───────────────────────────────────────────────────────────────────
type TimelineStatus = 'completed' | 'in_progress' | 'upcoming' | 'delayed';

interface TimelineEvent {
  date: Date;
  endDate?: Date;
  type: string;
  title: string;
  description?: string;
  labor?: number;
  manpower?: number;
  completedByName?: string;
  status: TimelineStatus;
  sortKey: number;
  dailyUpdateId?: string;
}

interface Props {
  caseId: string | null;
  onSelectProject: (caseId: string) => void;
  onBack?: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
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
  return Math.round((a.getTime() - b.getTime()) / (24 * 60 * 60 * 1000));
}

function safeFormatDate(v: unknown): string {
  const d = toDate(v);
  if (!d) return '—';
  try { return formatDate(d); } catch { return '—'; }
}

function calculateStatus(event: { date: Date; endDate?: Date; completed?: boolean }): TimelineStatus {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const start = new Date(event.date); start.setHours(0, 0, 0, 0);
  const end = event.endDate ? new Date(event.endDate) : null;
  if (end) end.setHours(0, 0, 0, 0);
  if (event.completed) return 'completed';
  if (end && today > end) return 'delayed';
  if (today >= start && (!end || today <= end)) return 'in_progress';
  if (today < start) return 'upcoming';
  return 'completed';
}

function getStatusLabel(status: TimelineStatus): string {
  switch (status) {
    case 'completed': return 'Completed';
    case 'in_progress': return 'In Progress';
    case 'delayed': return 'Delayed';
    default: return 'Upcoming';
  }
}

function getCompletionFromStatus(status: CaseStatus | string): number {
  switch (status) {
    case CaseStatus.COMPLETED: return 100;
    case CaseStatus.EXECUTION_ACTIVE: return 65;
    case CaseStatus.WAITING_FOR_PLANNING: return 55;
    case CaseStatus.WAITING_FOR_PAYMENT: return 50;
    case CaseStatus.NEGOTIATION: return 40;
    case CaseStatus.QUOTATION: return 35;
    case CaseStatus.BOQ: return 25;
    case CaseStatus.DRAWING: return 20;
    case CaseStatus.SITE_VISIT: return 15;
    case CaseStatus.CONTACTED: return 8;
    default: return 5;
  }
}

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<TimelineStatus, { bg: string; border: string; text: string; icon: React.FC<any> }> = {
  completed: { bg: 'bg-emerald-500', border: 'border-emerald-500', text: 'text-emerald-700', icon: CheckCircleIcon },
  in_progress: { bg: 'bg-blue-500', border: 'border-blue-500', text: 'text-blue-700', icon: ClockIcon },
  delayed: { bg: 'bg-amber-500', border: 'border-amber-500', text: 'text-amber-700', icon: ExclamationTriangleIcon },
  upcoming: { bg: 'bg-slate-400', border: 'border-slate-400', text: 'text-slate-600', icon: CalendarIcon },
};

const STATUS_BADGE: Record<TimelineStatus, string> = {
  completed: 'bg-emerald-100 text-emerald-800',
  in_progress: 'bg-blue-100 text-blue-800',
  delayed: 'bg-amber-100 text-amber-800',
  upcoming: 'bg-slate-100 text-slate-700',
};

// ─── Subcomponents ────────────────────────────────────────────────────────────
// Project Selector Card
const ProjectCard: React.FC<{ project: Project; onClick: () => void }> = ({ project, onClick }) => {
  const completion = getCompletionFromStatus(project.status);
  const budget = (project as any).financial?.totalBudget || (project as any).budget || 0;

  return (
    <motion.button
      type="button"
      whileHover={{ y: -4, boxShadow: '0 12px 40px rgba(0,0,0,0.12)' }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className="w-full text-left bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-primary/40 transition-colors group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-800 truncate group-hover:text-primary transition-colors">
            {project.title || (project as any).projectName || 'Unnamed Project'}
          </p>
          <div className="flex items-center gap-1 mt-1">
            <BuildingOfficeIcon className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <p className="text-xs text-slate-500 truncate">{project.clientName || '—'}</p>
          </div>
        </div>
        <span className={`ml-3 text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg flex-shrink-0 ${project.status === CaseStatus.COMPLETED
            ? 'bg-emerald-100 text-emerald-700'
            : project.status === CaseStatus.EXECUTION_ACTIVE
              ? 'bg-blue-100 text-blue-700'
              : 'bg-slate-100 text-slate-600'
          }`}>
          {project.status?.replace(/_/g, ' ') || 'Active'}
        </span>
      </div>

      {/* Budget */}
      {budget > 0 && (
        <div className="flex items-center gap-1 mb-3">
          <CurrencyRupeeIcon className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-semibold text-slate-600">{formatCurrencyINR(budget)}</span>
        </div>
      )}

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between">
          <span className="text-[10px] text-slate-400 font-medium">Completion</span>
          <span className="text-[10px] font-bold text-slate-600">{completion}%</span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${completion}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={`h-full rounded-full ${completion === 100 ? 'bg-emerald-500' : 'bg-primary'}`}
          />
        </div>
      </div>

      {/* Arrow */}
      <div className="flex justify-end mt-3">
        <span className="text-[10px] font-bold uppercase tracking-wider text-primary opacity-0 group-hover:opacity-100 transition-opacity">
          View Timeline →
        </span>
      </div>
    </motion.button>
  );
};

// Timeline Event Card
const TimelineCard: React.FC<{ event: TimelineEvent; index: number }> = ({ event, index }) => {
  const [expanded, setExpanded] = useState(false);
  const config = STATUS_CONFIG[event.status];
  const Icon = config.icon;

  return (
    <motion.li
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      className="relative flex gap-4"
    >
      {/* Icon dot */}
      <div className={`relative z-10 w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center ${config.bg} shadow-md`}>
        <Icon className="w-5 h-5 text-white" />
      </div>

      {/* Card */}
      <div className="flex-1 min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div
          className="p-4 cursor-pointer select-none"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide mb-0.5">
                {safeFormatDate(event.date)}
                {event.endDate && ` → ${safeFormatDate(event.endDate)}`}
              </p>
              <p className="font-bold text-slate-800">{event.title}</p>
              {event.completedByName && (
                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                  {event.completedByName}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg ${STATUS_BADGE[event.status]}`}>
                {getStatusLabel(event.status)}
              </span>
              <div className="text-slate-400">
                {expanded ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {expanded && (event.description || event.labor != null || event.manpower != null) && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t border-slate-100 px-4 py-3 bg-slate-50/60"
            >
              {event.description && (
                <p className="text-sm text-slate-600 mb-2">{event.description}</p>
              )}
              <div className="flex flex-wrap gap-2">
                {event.labor != null && event.labor > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-white border border-slate-200 text-slate-600">
                    <UserGroupIcon className="w-3.5 h-3.5" /> {event.labor} Workers
                  </span>
                )}
                {event.manpower != null && event.manpower > 0 && event.type === 'daily_update' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-blue-50 text-blue-700">
                    <UserGroupIcon className="w-3.5 h-3.5" /> {event.manpower} on-site
                  </span>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.li>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const ExecutionTimelinePage: React.FC<Props> = ({ caseId, onSelectProject, onBack }) => {
  const [viewMode, setViewMode] = useState<'timeline' | 'gantt'>('timeline');
  const [caseData, setCaseData] = useState<any>(null);
  const [dailyUpdates, setDailyUpdates] = useState<Array<{ id: string; date: any; workDescription: string; manpowerCount: number }>>([]);
  const [procurementPlans, setProcurementPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tooltipIdx, setTooltipIdx] = useState<number | null>(null);

  const { projects, loading: projectsLoading } = useProjects();

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
      setLoading(false);
    });
    const dailyRef = collection(db, FIRESTORE_COLLECTIONS.CASES, caseId, FIRESTORE_COLLECTIONS.DAILY_UPDATES);
    const unsubDaily = onSnapshot(dailyRef, (snap) => {
      setDailyUpdates(snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          date: data.date?.toDate?.() ?? data.date,
          workDescription: data.workDescription ?? '',
          manpowerCount: data.manpowerCount ?? 0,
        };
      }));
    });
    const plansRef = collection(db, FIRESTORE_COLLECTIONS.CASES, caseId, FIRESTORE_COLLECTIONS.PROCUREMENT_PLANS);
    getDocs(plansRef)
      .then((snap) => setProcurementPlans(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
      .catch(() => setProcurementPlans([]));
    return () => { unsubCase(); unsubDaily(); };
  }, [caseId]);

  const timelineEvents = useMemo((): TimelineEvent[] => {
    const events: TimelineEvent[] = [];
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (!caseData) return events;

    const plan = caseData.executionPlan;
    const fundRequests = caseData.executionFundRequests || [];

    if (plan?.startDate) {
      const d = toDate(plan.startDate);
      if (d) events.push({ date: d, type: 'project_start', title: 'Execution Start', description: 'Execution officially begins', status: today >= d ? 'completed' : 'upcoming', sortKey: d.getTime() });
    }

    (plan?.phases || []).forEach((phase: any) => {
      const start = toDate(phase.startDate);
      if (start) {
        const end = toDate(phase.endDate);
        events.push({
          date: start,
          endDate: end ?? undefined,
          type: 'phase',
          title: phase.name ?? 'Phase',
          description: phase.description,
          labor: phase.laborCount,
          completedByName: phase.completedByName,
          status: calculateStatus({ date: start, endDate: end ?? undefined, completed: phase.completed }),
          sortKey: start.getTime(),
        });
      }
    });

    fundRequests.forEach((req: any) => {
      const d = toDate(req.requiredOn);
      if (d) {
        events.push({
          date: d,
          type: 'fund_request',
          title: 'Funds Required',
          description: `${formatCurrencyINR(Number(req.amount) || 0)} — ${req.reason ?? ''}`,
          status: req.status === 'approved' ? 'completed' : today >= d ? 'in_progress' : 'upcoming',
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
          title: `Material Delivery — ${plan.itemName ?? 'Item'}`,
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

  // Today indicator position on Gantt
  const todayPct = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const offset = differenceInDays(today, minDate);
    return Math.min(100, Math.max(0, (offset / totalDays) * 100));
  }, [minDate, totalDays]);

  // ─── Project Selector ───────────────────────────────────────────────────
  if (!caseId) {
    return (
      <div className="p-6 max-w-6xl mx-auto min-h-screen">
        {onBack && (
          <button type="button" onClick={onBack}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 mb-8 transition-colors shadow-sm">
            <ArrowLeftIcon className="w-4 h-4" /> Back
          </button>
        )}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Execution Timeline</h1>
          <p className="text-slate-500 mt-1">Select a project to view its execution timeline and Gantt chart.</p>
        </div>

        {projectsLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
          </div>
        ) : projects.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center shadow-sm">
            <CalendarIcon className="w-14 h-14 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">No projects found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={() => onSelectProject(project.id)}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // ─── Loading ────────────────────────────────────────────────────────────
  if (loading && !caseData) {
    return (
      <div className="flex flex-col items-center justify-center py-24 min-h-[40vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent" />
        <p className="text-slate-500 mt-4 font-medium">Loading timeline…</p>
      </div>
    );
  }

  // ─── Timeline + Gantt ───────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-5xl mx-auto min-h-screen">
      {onBack && (
        <button type="button" onClick={onBack}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 mb-6 transition-colors shadow-sm">
          <ArrowLeftIcon className="w-4 h-4" /> Back
        </button>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {caseData?.title ?? caseData?.projectName ?? 'Project'}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">{caseData?.clientName ?? '—'}</p>
        </div>
        {/* View toggle */}
        <div className="flex rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
          <button type="button" onClick={() => setViewMode('timeline')}
            className={`px-5 py-2.5 text-sm font-bold flex items-center gap-2 rounded-xl transition-all ${viewMode === 'timeline' ? 'bg-primary text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>
            <CalendarIcon className="w-4 h-4" /> Timeline
          </button>
          <button type="button" onClick={() => setViewMode('gantt')}
            className={`px-5 py-2.5 text-sm font-bold flex items-center gap-2 rounded-xl transition-all ${viewMode === 'gantt' ? 'bg-primary text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>
            <ChartBarIcon className="w-4 h-4" /> Gantt
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* ── TIMELINE VIEW ── */}
        {viewMode === 'timeline' && (
          <motion.div key="tl" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            {timelineEvents.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
                <CalendarIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No timeline events yet. Execution plan and daily updates will appear here.</p>
              </div>
            ) : (
              <div className="relative">
                {/* Vertical spine */}
                <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-slate-200 rounded-full" aria-hidden />
                <ul className="space-y-4">
                  {timelineEvents.map((evt, idx) => (
                    <TimelineCard key={`${evt.type}-${idx}`} event={evt} index={idx} />
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}

        {/* ── GANTT VIEW ── */}
        {viewMode === 'gantt' && (
          <motion.div key="gantt" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm overflow-x-auto">
              {phaseEvents.length === 0 ? (
                <div className="text-center py-12">
                  <ChartBarIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No phases in plan. Add phases in Planning to see Gantt.</p>
                </div>
              ) : (
                <div className="space-y-5 min-w-[600px]">
                  {phaseEvents.map((evt, idx) => {
                    const start = evt.date;
                    const end = evt.endDate ?? evt.date;
                    const duration = Math.max(1, differenceInDays(end, start));
                    const offsetDays = differenceInDays(start, minDate);
                    const widthPct = Math.min(100, (duration / totalDays) * 100);
                    const leftPct = totalDays > 0 ? (offsetDays / totalDays) * 100 : 0;
                    const barColor =
                      evt.status === 'completed' ? 'bg-emerald-500' :
                        evt.status === 'delayed' ? 'bg-amber-500' :
                          evt.status === 'in_progress' ? 'bg-blue-500' : 'bg-slate-400';

                    // Fund request markers within this phase
                    const fundMarkers = timelineEvents.filter(
                      (e) => e.type === 'fund_request' &&
                        e.date >= start && e.date <= end
                    );

                    return (
                      <div key={`gantt-${idx}`} className="flex items-center gap-4">
                        {/* Label */}
                        <div className="w-32 flex-shrink-0">
                          <p className="font-semibold text-slate-800 text-sm truncate" title={evt.title}>{evt.title}</p>
                          {evt.labor != null && evt.labor > 0 && (
                            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                              <UserGroupIcon className="w-3 h-3" /> {evt.labor}
                            </p>
                          )}
                        </div>

                        {/* Bar track */}
                        <div
                          className="flex-1 h-10 bg-slate-100 rounded-xl relative overflow-visible"
                          onMouseEnter={() => setTooltipIdx(idx)}
                          onMouseLeave={() => setTooltipIdx(null)}
                        >
                          {/* TODAY indicator */}
                          <div
                            className="absolute top-0 bottom-0 w-0.5 bg-red-400 z-20"
                            style={{ left: `${todayPct}%` }}
                            title="Today"
                          >
                            <div className="w-2 h-2 bg-red-400 rounded-full absolute -top-1 -translate-x-[3px]" />
                          </div>

                          {/* Phase bar */}
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${widthPct}%` }}
                            transition={{ duration: 0.6, ease: 'easeOut', delay: idx * 0.05 }}
                            className={`absolute h-full rounded-lg ${barColor} opacity-90`}
                            style={{ left: `${leftPct}%`, minWidth: '8px' }}
                          />

                          {/* Payment milestone markers */}
                          {fundMarkers.map((fm, fi) => {
                            const markerPct = totalDays > 0
                              ? (differenceInDays(fm.date, minDate) / totalDays) * 100
                              : 0;
                            return (
                              <div
                                key={fi}
                                className="absolute top-0 z-10"
                                style={{ left: `${markerPct}%` }}
                                title={fm.title}
                              >
                                <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-b-[10px] border-l-transparent border-r-transparent border-b-amber-400 -translate-x-1.5 -translate-y-2" />
                              </div>
                            );
                          })}

                          {/* Hover tooltip */}
                          <AnimatePresence>
                            {tooltipIdx === idx && (
                              <motion.div
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 4 }}
                                className="absolute bottom-12 left-0 bg-slate-800 text-white text-xs rounded-xl px-3 py-2 z-30 shadow-xl whitespace-nowrap pointer-events-none"
                              >
                                <p className="font-bold">{evt.title}</p>
                                <p className="opacity-70">{safeFormatDate(start)} → {safeFormatDate(end)}</p>
                                <p className={`mt-0.5 font-medium ${evt.status === 'completed' ? 'text-emerald-400' : evt.status === 'delayed' ? 'text-amber-400' : 'text-blue-400'}`}>
                                  {getStatusLabel(evt.status)}
                                </p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Dates */}
                        <div className="w-32 text-right text-xs text-slate-400 flex-shrink-0">
                          {safeFormatDate(start)} → {safeFormatDate(end)}
                        </div>
                      </div>
                    );
                  })}

                  {/* Legend */}
                  <div className="flex items-center gap-4 pt-2 border-t border-slate-100 text-[10px] font-semibold text-slate-500">
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500" /> Completed</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-500" /> In Progress</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-500" /> Delayed</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-slate-400" /> Upcoming</span>
                    <span className="flex items-center gap-1"><span className="w-2 border-l-4 border-r-4 border-b-6 border-transparent border-b-amber-400" /> Payment</span>
                    <span className="flex items-center gap-1"><span className="w-0.5 h-3 bg-red-400" /> Today</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ExecutionTimelinePage;
