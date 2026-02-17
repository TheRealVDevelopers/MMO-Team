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
        
        <div className="bg-surface border border-border rounded-xl p-8 text-center">
          <LockClosedIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-text-primary mb-2">Project Completed – Read Only Mode</h2>
          <p className="text-text-secondary mb-6">This project is locked and cannot be modified.</p>
          
          {/* Show summary sections in read-only mode */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto text-left">
            <div className="bg-background/50 p-4 rounded-lg">
              <h3 className="font-semibold text-text-primary mb-2">Project Summary</h3>
              <p className="text-sm text-text-secondary">Title: {caseData.title}</p>
              <p className="text-sm text-text-secondary">Client: {caseData.clientName || '—'}</p>
              <p className="text-sm text-text-secondary">Status: {status}</p>
            </div>
            
            <div className="bg-background/50 p-4 rounded-lg">
              <h3 className="font-semibold text-text-primary mb-2">Documents</h3>
              <p className="text-sm text-text-secondary">View project documents in read-only mode</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

      {/* Section 2 — Planning (only if not fully approved and not locked) */}
      {showPlanning && !isPlanningLocked && (
        <ExecutionPlanningNew
          caseId={caseId}
          onBack={() => {}}
        />
      )}
      
      {/* Show planning as read-only when locked */}
      {showPlanning && isPlanningLocked && (
        <section className="bg-surface border border-border rounded-xl p-6">
          <h2 className="text-lg font-bold text-text-primary mb-4">2. Planning</h2>
          <div className="flex items-center gap-3 p-4 rounded-lg bg-gray-50 border border-gray-200">
            <LockClosedIcon className="w-5 h-5 text-gray-500" />
            <div>
              <p className="font-medium text-gray-700">Planning Locked</p>
              <p className="text-sm text-gray-600">Planning is read-only after submission. Contact admin for changes.</p>
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
        <section className="bg-surface border border-border rounded-xl p-6">
          <h2 className="text-lg font-bold text-text-primary mb-4">Materials Management</h2>
          <div className="flex items-center gap-3 p-4 rounded-lg bg-gray-50 border border-gray-200">
            <LockClosedIcon className="w-5 h-5 text-gray-500" />
            <div>
              <p className="font-medium text-gray-700">Materials Locked</p>
              <p className="text-sm text-gray-600">Cannot modify materials for completed projects.</p>
            </div>
          </div>
        </section>
      )}

      {/* Section 6 — Documents (read-only) */}
      <ExecutionDocumentsReadOnlySection caseId={caseId} /> 
      
      {/* Documents Management - Show locked for completed */}
      {isCompleted && (
        <section className="bg-surface border border-border rounded-xl p-6">
          <h2 className="text-lg font-bold text-text-primary mb-4">Documents Management</h2>
          <div className="flex items-center gap-3 p-4 rounded-lg bg-gray-50 border border-gray-200">
            <LockClosedIcon className="w-5 h-5 text-gray-500" />
            <div>
              <p className="font-medium text-gray-700">Documents Locked</p>
              <p className="text-sm text-gray-600">Cannot upload documents for completed projects.</p>
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
