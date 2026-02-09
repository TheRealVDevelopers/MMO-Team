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
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import ExecutionPlanningSection from './ExecutionPlanningSection';
import ExecutionApprovalsSection from './ExecutionApprovalsSection';
import ExecutionDailyLogSection from './ExecutionDailyLogSection';
import ExecutionJMSSection from './ExecutionJMSSection';
import ExecutionMaterialsReadOnlySection from './ExecutionMaterialsReadOnlySection';
import ExecutionDocumentsReadOnlySection from './ExecutionDocumentsReadOnlySection';

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
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }
  if (!caseData) {
    return (
      <div className="p-6 text-center">
        <p className="text-text-secondary">Project not found.</p>
        <button type="button" onClick={onBack} className="mt-4 text-primary font-semibold">
          Back to Projects
        </button>
      </div>
    );
  }

  const status = caseData.status;
  const plan = caseData.executionPlan as
    | {
        days?: unknown[];
        approvals?: { admin?: boolean; client?: boolean };
        executionMarkedComplete?: boolean;
        startDate?: Date;
        endDate?: Date;
      }
    | undefined;
  const hasPlan = !!plan && (!!plan.days?.length || !!(plan as any).phases?.length);
  const bothApproved = !!plan?.approvals?.admin && !!plan?.approvals?.client;
  const isExecutionActive = status === CaseStatus.EXECUTION_ACTIVE || status === CaseStatus.ACTIVE;
  const showPlanning =
    status === CaseStatus.WAITING_FOR_PLANNING || status === CaseStatus.PLANNING_IN_PROGRESS;
  const showJMS = isExecutionActive;

  const totalPlannedDays = Array.isArray(plan?.days) ? plan.days.length : 0;

  return (
    <div className="space-y-10 pb-12">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onBack}
          className="p-2 rounded-lg border border-border hover:bg-surface text-text-primary"
          aria-label="Back to projects"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Execution Workspace</h1>
          <p className="text-sm text-text-secondary">{caseData.title}</p>
        </div>
      </div>

      {/* Section 1 — Project Summary (read-only) */}
      <section className="bg-surface border border-border rounded-xl p-6">
        <h2 className="text-lg font-bold text-text-primary mb-4">1. Project Summary</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-text-tertiary">Project name</span>
            <p className="font-medium text-text-primary">{caseData.title}</p>
          </div>
          <div>
            <span className="text-text-tertiary">Client</span>
            <p className="font-medium text-text-primary">{caseData.clientName || '—'}</p>
          </div>
          <div>
            <span className="text-text-tertiary">Planned start / end</span>
            <p className="font-medium text-text-primary">
              {plan?.startDate && plan?.endDate
                ? `${new Date(plan.startDate).toLocaleDateString()} – ${new Date(plan.endDate).toLocaleDateString()}`
                : '—'}
            </p>
          </div>
          <div>
            <span className="text-text-tertiary">Current status</span>
            <p className="font-medium text-text-primary">{status}</p>
          </div>
          <div>
            <span className="text-text-tertiary">Total planned days</span>
            <p className="font-medium text-text-primary">{totalPlannedDays || '—'}</p>
          </div>
        </div>
      </section>

      {/* Section 2 — Planning (only if not fully approved) */}
      {showPlanning && (
        <ExecutionPlanningSection
          caseId={caseId}
          caseData={caseData}
          existingPlan={plan}
          onSaved={() => {}}
        />
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
        />
      )}

      {/* Section 5 — Materials Tracker (when plan exists) */}
      {hasPlan && (
        <ExecutionMaterialsReadOnlySection
          planDays={Array.isArray(plan?.days) ? plan.days : []}
        />
      )}

      {/* Section 6 — Documents (read-only) */}
      <ExecutionDocumentsReadOnlySection caseId={caseId} />

      {/* Section 7 — Project Closure (JMS) (when execution active: Mark Complete → Launch JMS) */}
      {showJMS && (
        <ExecutionJMSSection
          caseId={caseId}
          caseData={caseData}
          plan={plan || {}}
          onUpdated={() => {}}
        />
      )}
    </div>
  );
};

export default ExecutionWorkspace;
