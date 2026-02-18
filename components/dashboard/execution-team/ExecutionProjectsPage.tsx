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
  const { cases, loading } = useCases({ isProject: true, projectHeadId: currentUser?.id ?? undefined });

  const myProjects = useMemo(() => {
    return cases;
  }, [cases]);

  const getStatusBadge = (project: (typeof myProjects)[0]) => {
    if (project.status === CaseStatus.COMPLETED) {
      return { label: 'Completed', color: 'bg-gray-500', textColor: 'text-gray-700', bgLight: 'bg-gray-50' };
    }
    if (project.status === CaseStatus.EXECUTION_ACTIVE) {
      return { label: 'Execution Active', color: 'bg-green-500', textColor: 'text-green-700', bgLight: 'bg-green-50' };
    }
    const plan = project.executionPlan as { approvalStatus?: string } | undefined;
    if (project.status === CaseStatus.PLANNING_SUBMITTED || (project.status === CaseStatus.WAITING_FOR_PLANNING && plan && plan.approvalStatus !== 'approved')) {
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
      project.status === CaseStatus.WAITING_FOR_PLANNING && !(project.executionPlan as any)?.phases?.length;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        onClick={() => onSelectProject(project.id)}
        className={`relative bg-white rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 group shadow-sm hover:shadow-lg border ${
          isPlanningPending ? 'border-amber-300 ring-2 ring-amber-200/50' : 'border-slate-200/80 hover:border-primary/30'
        }`}
      >
        {isPlanningPending && <div className="h-1 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500" />}
        <div className="p-6">
          <div className="flex justify-between items-start gap-3 mb-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-slate-800 truncate group-hover:text-primary transition-colors">{project.title}</h3>
              <p className="text-sm text-slate-500 truncate mt-0.5">{project.clientName}</p>
            </div>
            <span className={`flex-shrink-0 px-3 py-1.5 rounded-full text-white text-xs font-bold uppercase tracking-wide shadow-sm ${config.color}`}>
              {config.label}
            </span>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2.5 text-slate-600">
              <UserIcon className="w-4 h-4 flex-shrink-0 text-slate-400" />
              <span className="truncate">{project.clientPhone || '—'}</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-600">
              <MapPinIcon className="w-4 h-4 flex-shrink-0 text-slate-400" />
              <span className="truncate">{project.siteAddress || '—'}</span>
            </div>
            {project.costCenter?.totalBudget != null && (
              <div className="flex items-center gap-2.5 text-slate-600">
                <CurrencyRupeeIcon className="w-4 h-4 flex-shrink-0 text-slate-400" />
                <span className="font-medium">₹{Number(project.costCenter.totalBudget).toLocaleString()}</span>
              </div>
            )}
          </div>
          <div className="mt-5 pt-5 border-t border-slate-100 flex items-center justify-between">
            <span className="text-sm font-semibold text-primary group-hover:underline">Open Workspace</span>
            <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
              <ArrowRightIcon className="w-4 h-4 text-primary" />
            </span>
          </div>
        </div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-slate-600 mt-4 font-medium">Loading your projects...</p>
      </div>
    );
  }

  const planningPending = myProjects.filter(
    (p) => p.status === CaseStatus.WAITING_FOR_PLANNING && !(p.executionPlan as any)?.phases?.length
  );
  const awaitingApproval = myProjects.filter(
    (p) => p.status === CaseStatus.PLANNING_SUBMITTED || ((p.executionPlan as any)?.phases?.length && (p.executionPlan as any)?.approvalStatus !== 'approved')
  );
  const executionActive = myProjects.filter(
    (p) => p.status === CaseStatus.EXECUTION_ACTIVE
  );
  const completed = myProjects.filter((p) => p.status === CaseStatus.COMPLETED);

  const SectionBlock = ({
    icon: Icon,
    title,
    count,
    accent,
    children,
  }: {
    icon: React.ElementType;
    title: string;
    count: number;
    accent: string;
    children: React.ReactNode;
  }) => (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <span className={`flex items-center justify-center w-10 h-10 rounded-xl ${accent}`}>
          <Icon className="w-5 h-5 text-white" />
        </span>
        <h2 className="text-xl font-bold text-slate-800">{title}</h2>
        <span className={`px-3 py-1 rounded-full text-sm font-bold ${accent} text-white`}>
          {count}
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {children}
      </div>
    </div>
  );

  return (
    <div className="space-y-12">
      {planningPending.length > 0 && (
        <SectionBlock
          icon={ExclamationTriangleIcon}
          title="Planning Pending"
          count={planningPending.length}
          accent="bg-amber-500"
        >
          {planningPending.map((project, index) => (
            <ProjectCard key={project.id} project={project} index={index} />
          ))}
        </SectionBlock>
      )}
      {awaitingApproval.length > 0 && (
        <SectionBlock
          icon={ClockIcon}
          title="Awaiting Approval"
          count={awaitingApproval.length}
          accent="bg-blue-500"
        >
          {awaitingApproval.map((project, index) => (
            <ProjectCard key={project.id} project={project} index={index} />
          ))}
        </SectionBlock>
      )}
      {executionActive.length > 0 && (
        <SectionBlock
          icon={CheckBadgeIcon}
          title="Execution Active"
          count={executionActive.length}
          accent="bg-emerald-500"
        >
          {executionActive.map((project, index) => (
            <ProjectCard key={project.id} project={project} index={index} />
          ))}
        </SectionBlock>
      )}
      {completed.length > 0 && (
        <SectionBlock
          icon={CheckBadgeIcon}
          title="Completed"
          count={completed.length}
          accent="bg-slate-500"
        >
          {completed.map((project, index) => (
            <ProjectCard key={project.id} project={project} index={index} />
          ))}
        </SectionBlock>
      )}
      {myProjects.length === 0 && (
        <div className="text-center py-20 px-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-6">
            <ClipboardDocumentListIcon className="w-10 h-10 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">No Projects Yet</h3>
          <p className="text-slate-600 max-w-md mx-auto leading-relaxed">
            You don&apos;t have any projects assigned to you. When a project is created and you&apos;re set as Project
            Head, it will appear here.
          </p>
        </div>
      )}
    </div>
  );
};

export default ExecutionProjectsPage;
