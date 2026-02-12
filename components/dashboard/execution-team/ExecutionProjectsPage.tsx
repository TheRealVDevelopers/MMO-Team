/**
 * Execution Projects Page (default view).
 * Lists projects where projectHeadId === currentUser; click → open Execution Workspace.
 * No tabs; status badges: Planning Pending, Awaiting Approval, Execution Active, Completed.
 */

import React, { useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useCases } from '../../../hooks/useCases';
import { CaseStatus } from '../../../types';
import { motion } from 'framer-motion';
import {
  ClipboardDocumentListIcon,
  ClockIcon,
  CheckBadgeIcon,
  MapPinIcon,
  UserIcon,
  CurrencyRupeeIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

interface Props {
  onSelectProject: (caseId: string) => void;
}

const ExecutionProjectsPage: React.FC<Props> = ({ onSelectProject }) => {
  const { currentUser } = useAuth();
  const { cases, loading } = useCases();

  const myProjects = useMemo(() => {
    return cases.filter((c) => c.isProject && c.projectHeadId === currentUser?.id);
  }, [cases, currentUser?.id]);

  const getStatusBadge = (project: (typeof myProjects)[0]) => {
    if (project.status === CaseStatus.COMPLETED) {
      return { label: 'Completed', color: 'bg-gray-500', textColor: 'text-gray-700', bgLight: 'bg-gray-50' };
    }
    if (project.status === CaseStatus.EXECUTION_ACTIVE) {
      return { label: 'Execution Active', color: 'bg-green-500', textColor: 'text-green-700', bgLight: 'bg-green-50' };
    }
    const plan = project.executionPlan as { approvals?: { admin?: boolean; client?: boolean } } | undefined;
    const bothApproved = plan?.approvals?.admin && plan?.approvals?.client;
    if (
      project.status === CaseStatus.WAITING_FOR_PLANNING &&
      plan &&
      !bothApproved
    ) {
      return { label: 'Awaiting Approval', color: 'bg-blue-500', textColor: 'text-blue-700', bgLight: 'bg-blue-50' };
    }
    if (project.status === CaseStatus.WAITING_FOR_PLANNING && !plan) {
      return { label: 'Planning Pending', color: 'bg-amber-500', textColor: 'text-amber-700', bgLight: 'bg-amber-50' };
    }
    return { label: 'Planning Pending', color: 'bg-amber-500', textColor: 'text-amber-700', bgLight: 'bg-amber-50' };
  };

  const ProjectCard = ({ project, index }: { project: (typeof myProjects)[0]; index: number }) => {
    const config = getStatusBadge(project);
    const isPlanningPending =
      project.status === CaseStatus.WAITING_FOR_PLANNING && !(project.executionPlan as any)?.days?.length;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        onClick={() => onSelectProject(project.id)}
        className={`bg-surface border rounded-xl overflow-hidden cursor-pointer hover:shadow-xl transition-all group ${
          isPlanningPending ? 'border-amber-300 border-2' : 'border-border'
        }`}
      >
        {isPlanningPending && <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-500" />}
        <div className="p-5">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-text-primary truncate">{project.title}</h3>
              <p className="text-sm text-text-secondary truncate">{project.clientName}</p>
            </div>
            <span
              className={`px-3 py-1.5 rounded-full text-white text-xs font-bold uppercase tracking-wide ${config.color}`}
            >
              {config.label}
            </span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-text-secondary">
              <UserIcon className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{project.clientPhone || '—'}</span>
            </div>
            <div className="flex items-center gap-2 text-text-secondary">
              <MapPinIcon className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{project.siteAddress || '—'}</span>
            </div>
            {project.costCenter?.totalBudget != null && (
              <div className="flex items-center gap-2 text-text-secondary">
                <CurrencyRupeeIcon className="w-4 h-4 flex-shrink-0" />
                <span>₹{Number(project.costCenter.totalBudget).toLocaleString()}</span>
              </div>
            )}
          </div>
          <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
            <span className="text-sm font-semibold text-primary">Open Workspace</span>
            <ArrowRightIcon className="w-5 h-5 text-text-tertiary group-hover:text-primary transition-colors" />
          </div>
        </div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-text-secondary mt-4">Loading your projects...</p>
        </div>
      </div>
    );
  }

  const planningPending = myProjects.filter(
    (p) => p.status === CaseStatus.WAITING_FOR_PLANNING && !(p.executionPlan as any)?.days?.length
  );
  const awaitingApproval = myProjects.filter((p) => {
    const plan = p.executionPlan as { approvals?: { admin?: boolean; client?: boolean }; days?: unknown[] } | undefined;
    return plan?.days?.length && !(plan.approvals?.admin && plan.approvals?.client);
  });
  const executionActive = myProjects.filter(
    (p) => p.status === CaseStatus.EXECUTION_ACTIVE
  );
  const completed = myProjects.filter((p) => p.status === CaseStatus.COMPLETED);

  return (
    <div className="space-y-8">
      {planningPending.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <ExclamationTriangleIcon className="w-6 h-6 text-amber-500" />
            <h2 className="text-xl font-bold text-text-primary">Planning Pending</h2>
            <span className="px-2.5 py-0.5 bg-amber-100 text-amber-700 rounded-full text-sm font-bold">
              {planningPending.length}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {planningPending.map((project, index) => (
              <ProjectCard key={project.id} project={project} index={index} />
            ))}
          </div>
        </div>
      )}
      {awaitingApproval.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <ClockIcon className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-bold text-text-primary">Awaiting Approval</h2>
            <span className="px-2.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-sm font-bold">
              {awaitingApproval.length}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {awaitingApproval.map((project, index) => (
              <ProjectCard key={project.id} project={project} index={index} />
            ))}
          </div>
        </div>
      )}
      {executionActive.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <CheckBadgeIcon className="w-6 h-6 text-green-500" />
            <h2 className="text-xl font-bold text-text-primary">Execution Active</h2>
            <span className="px-2.5 py-0.5 bg-green-100 text-green-700 rounded-full text-sm font-bold">
              {executionActive.length}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {executionActive.map((project, index) => (
              <ProjectCard key={project.id} project={project} index={index} />
            ))}
          </div>
        </div>
      )}
      {completed.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <CheckBadgeIcon className="w-6 h-6 text-gray-500" />
            <h2 className="text-xl font-bold text-text-primary">Completed</h2>
            <span className="px-2.5 py-0.5 bg-gray-100 text-gray-600 rounded-full text-sm font-bold">
              {completed.length}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {completed.map((project, index) => (
              <ProjectCard key={project.id} project={project} index={index} />
            ))}
          </div>
        </div>
      )}
      {myProjects.length === 0 && (
        <div className="text-center py-16 bg-surface rounded-xl border border-border">
          <ClipboardDocumentListIcon className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
          <h3 className="text-xl font-bold text-text-primary mb-2">No Projects Yet</h3>
          <p className="text-text-secondary max-w-md mx-auto">
            You don&apos;t have any projects assigned to you. When a project is created and you&apos;re set as Project
            Head, it will appear here.
          </p>
        </div>
      )}
    </div>
  );
};

export default ExecutionProjectsPage;
