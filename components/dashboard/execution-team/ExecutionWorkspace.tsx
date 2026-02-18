/**
 * Execution Workspace — single vertical page, no side panel.
 * Sections 1–7 in order; show/hide by case.status and executionPlan.
 * Skeleton only: headings and placeholders (no forms yet).
 */

import React, { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../../firebase';
import { FIRESTORE_COLLECTIONS } from '../../../constants';
import { Case, CaseStatus } from '../../../types';
import { ArrowLeftIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import ExecutionPlanningNew from './ExecutionPlanningNew';
import ExecutionApprovalsSection from './ExecutionApprovalsSection';
import ExecutionDailyLogSection from './ExecutionDailyLogSection';
import ExecutionJMSSection from './ExecutionJMSSection';
import ExecutionMaterialsReadOnlySection from './ExecutionMaterialsReadOnlySection';
import ExecutionDocumentsReadOnlySection from './ExecutionDocumentsReadOnlySection';
import { isCaseCompleted, isPlanningLocked } from '../../../services/executionStatusService';

interface Props {
  caseId: string;
  onBack: () => void;
}

const ExecutionWorkspace: React.FC<Props> = ({ caseId, onBack }) => {
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db || !caseId) {
      setLoading(false);
      return;
    }
    const ref = doc(db, FIRESTORE_COLLECTIONS.CASES, caseId);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setCaseData({ id: snap.id, ...data } as Case);
        } else {
          setCaseData(null);
        }
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, [caseId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-slate-600 mt-4 font-medium">Loading workspace...</p>
      </div>
    );
  }
  if (!caseData) {
    return (
      <div className="text-center py-16 px-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <p className="text-slate-600">Project not found.</p>
        <button type="button" onClick={onBack} className="mt-6 px-5 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors">
          Back to Projects
        </button>
      </div>
    );
  }

  const status = caseData.status;
  const plan = caseData.executionPlan as
    | {
        days?: unknown[];
        approvalStatus?: string;
        executionMarkedComplete?: boolean;
        startDate?: Date;
        endDate?: Date;
      }
    | undefined;
  const hasPlan = !!plan && (!!plan.days?.length || !!(plan as any).phases?.length);
  const planApproved = plan?.approvalStatus === 'approved';
  const isExecutionActive = status === CaseStatus.EXECUTION_ACTIVE;
  const showPlanning =
    status === CaseStatus.WAITING_FOR_PLANNING || status === CaseStatus.PLANNING_SUBMITTED;
  const showJMS = isExecutionActive;
  const isCompleted = isCaseCompleted(status);
  const isPlanningLocked = status !== CaseStatus.WAITING_FOR_PLANNING;

  const totalPlannedDays = Array.isArray(plan?.days) ? plan.days.length : 0;

  // Show read-only mode for completed projects
  if (isCompleted) {
    return (
      <div className="space-y-8 pb-12">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors font-medium"
            aria-label="Back to projects"
          >
            <ArrowLeftIcon className="w-5 h-5" /> Back
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-800">Execution Workspace</h1>
            <p className="text-slate-500 mt-0.5">{caseData.title}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <LockClosedIcon className="w-8 h-8 text-slate-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Project Completed – Read Only Mode</h2>
          <p className="text-slate-600 mb-8">This project is locked and cannot be modified.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto text-left">
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
              <h3 className="font-semibold text-slate-800 mb-2">Project Summary</h3>
              <p className="text-sm text-slate-600">Title: {caseData.title}</p>
              <p className="text-sm text-slate-600">Client: {caseData.clientName || '—'}</p>
              <p className="text-sm text-slate-600">Status: {status}</p>
            </div>
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
              <h3 className="font-semibold text-slate-800 mb-2">Documents</h3>
              <p className="text-sm text-slate-600">View project documents in read-only mode</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors font-medium"
          aria-label="Back to projects"
        >
          <ArrowLeftIcon className="w-5 h-5" /> Back
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-800">Execution Workspace</h1>
          <p className="text-slate-500 mt-0.5">{caseData.title}</p>
        </div>
      </div>

      {/* Section 1 — Project Summary (read-only) */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary text-white text-sm font-bold">1</span>
          <h2 className="text-lg font-bold text-slate-800">Project Summary</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
          <div className="p-3 rounded-xl bg-slate-50/80">
            <span className="text-slate-500 block text-xs font-medium uppercase tracking-wider mb-1">Project name</span>
            <p className="font-medium text-slate-800">{caseData.title}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50/80">
            <span className="text-slate-500 block text-xs font-medium uppercase tracking-wider mb-1">Client</span>
            <p className="font-medium text-slate-800">{caseData.clientName || '—'}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50/80">
            <span className="text-slate-500 block text-xs font-medium uppercase tracking-wider mb-1">Planned start / end</span>
            <p className="font-medium text-slate-800">
              {plan?.startDate && plan?.endDate
                ? `${new Date(plan.startDate).toLocaleDateString()} – ${new Date(plan.endDate).toLocaleDateString()}`
                : '—'}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50/80">
            <span className="text-slate-500 block text-xs font-medium uppercase tracking-wider mb-1">Current status</span>
            <p className="font-medium text-slate-800">{status}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50/80">
            <span className="text-slate-500 block text-xs font-medium uppercase tracking-wider mb-1">Total planned days</span>
            <p className="font-medium text-slate-800">{totalPlannedDays || '—'}</p>
          </div>
        </div>
      </section>

      {/* Section 2 — Planning (only if not fully approved and not locked) */}
      {showPlanning && !isPlanningLocked && (
        <ExecutionPlanningNew
          caseId={caseId}
          onBack={() => {}}
        />
      )}
      
      {/* Show planning as read-only when locked */}
      {showPlanning && isPlanningLocked && (
        <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-500 text-white text-sm font-bold">2</span>
            <h2 className="text-lg font-bold text-slate-800">Planning</h2>
          </div>
          <div className="flex items-center gap-4 p-5 rounded-xl bg-slate-50 border border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center">
              <LockClosedIcon className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-700">Planning Locked</p>
              <p className="text-sm text-slate-600 mt-0.5">Planning is read-only after submission. Contact admin for changes.</p>
            </div>
          </div>
        </section>
      )}

      {/* Section 3 — Approvals (when plan exists) */}
      {hasPlan && (
        <ExecutionApprovalsSection
          caseId={caseId}
          caseData={caseData}
          plan={plan || {}}
          onApproved={() => {}}
        />
      )}

      {/* Section 4 — Daily Execution Log (when EXECUTION_ACTIVE) */}
      {isExecutionActive && (
        <ExecutionDailyLogSection
          caseId={caseId}
          planDays={Array.isArray(plan?.days) ? plan.days.map((d: any) => ({ date: d.date?.toDate?.() ?? d.date })) : []}
          isCompleted={isCompleted}
        />
      )}

      {/* Section 5 — Materials Tracker (when plan exists) */}
      {hasPlan && (
        <ExecutionMaterialsReadOnlySection
          planDays={Array.isArray(plan?.days) ? plan.days : []}
        />
      )}
      
      {/* Materials Management (separate page/component) - Show locked for completed */}
      {isCompleted && (
        <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Materials Management</h2>
          <div className="flex items-center gap-4 p-5 rounded-xl bg-slate-50 border border-slate-100">
            <LockClosedIcon className="w-5 h-5 text-slate-500" />
            <div>
              <p className="font-semibold text-slate-700">Materials Locked</p>
              <p className="text-sm text-slate-600 mt-0.5">Cannot modify materials for completed projects.</p>
            </div>
          </div>
        </section>
      )}

      {/* Section 6 — Documents (read-only) */}
      <ExecutionDocumentsReadOnlySection caseId={caseId} />

      {/* Documents Management - Show locked for completed */}
      {isCompleted && (
        <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Documents Management</h2>
          <div className="flex items-center gap-4 p-5 rounded-xl bg-slate-50 border border-slate-100">
            <LockClosedIcon className="w-5 h-5 text-slate-500" />
            <div>
              <p className="font-semibold text-slate-700">Documents Locked</p>
              <p className="text-sm text-slate-600 mt-0.5">Cannot upload documents for completed projects.</p>
            </div>
          </div>
        </section>
      )}

      {/* Section 7 — Project Closure (JMS) (when execution active: Mark Complete → Launch JMS) */}
      {showJMS && (
        <ExecutionJMSSection
          caseId={caseId}
          caseData={caseData}
          plan={plan || {}}
          onUpdated={() => {}}
          isCompleted={isCompleted}
        />
      )}
    </div>
  );
};

export default ExecutionWorkspace;
