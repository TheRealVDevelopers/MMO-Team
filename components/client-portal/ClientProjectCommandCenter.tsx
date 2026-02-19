/**
 * Client Project Command Center — premium redesign.
 * 3 zones: Top Header Bar | Left Main Panel (70%) | Right Side Panel (30%).
 * All data synced from staff-side Firestore (cases, subcollections). No backend structure change.
 */

import React, { useState, useMemo } from 'react';
import {
  ArrowLeftIcon,
  PhoneIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  DocumentArrowDownIcon,
  KeyIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { useTheme } from '../../context/ThemeContext';
import StageBottomSheet from './JourneyMap/StageBottomSheet';
import TodaysWork from './TodaysWork';
import PaymentWidget from './PaymentMilestones/PaymentWidget';
import PendingApprovalsWidget from './PendingApprovalsWidget';
import PayAdvanceSection from './PayAdvanceSection';
import ClientDailyUpdatesReadOnly from './ClientDailyUpdatesReadOnly';
import ClientJMSForm from './ClientJMSForm';
import GanttView from './GanttView';
import ProjectIntelligenceHeader from './ProjectIntelligenceHeader';
import Phase1LeadSection from './PhaseTimeline/Phase1LeadSection';
import Phase2ExecutionSection from './PhaseTimeline/Phase2ExecutionSection';
import DocumentIntelligencePanel from './DocumentIntelligencePanel';
import CaseChat from './CaseChat';
import WarrantyClosureSection from './WarrantyClosureSection';
import type { ClientProject, JourneyStage, ProjectHealth } from './types';
import type { Invoice } from '../../types';
import { formatCurrencyINR, formatDate } from '../../constants';

const MOCK_COMPANY = {
  name: 'Make My Office',
  gstin: '29ABCDE1234F1Z5',
  supportEmail: 'support@makemyoffice.com',
  supportPhone: '+91 98765 43210',
  logoUrl: '/mmo-logo.png',
};

const healthConfig: Record<ProjectHealth, { icon: typeof CheckCircleIcon; label: string; bg: string; text: string }> = {
  'on-track': { icon: CheckCircleIcon, label: 'On Track', bg: 'bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-400' },
  'minor-delay': { icon: ClockIcon, label: 'Minor Delay', bg: 'bg-amber-500/10', text: 'text-amber-700 dark:text-amber-400' },
  'at-risk': { icon: ExclamationTriangleIcon, label: 'At Risk', bg: 'bg-red-500/10', text: 'text-red-700 dark:text-red-400' },
};

export interface ClientProjectCommandCenterProps {
  project: ClientProject;
  invoices: Invoice[];
  invoicesLoading: boolean;
  pendingJMS: any;
  signedJMS: any;
  jmsLoading: boolean;
  clientUser: { uid: string; email: string } | null;
  isReadOnly?: boolean;
  onBack?: () => void;
  onLogout: () => void;
  onResetPassword?: () => void;
  onStageClick: (stage: JourneyStage) => void;
  onApprove: (requestId: string) => void;
  onReject: (requestId: string, reason: string) => void;
  onPayClick: (amount: number, name: string) => void;
  onSignJMS: () => void;
  selectedStage: JourneyStage | null;
  isSheetOpen: boolean;
  onCloseSheet: () => void;
  nextUnpaidMilestone: { amount: number; stageName: string; dueDate?: Date } | null;
}

const ClientProjectCommandCenter: React.FC<ClientProjectCommandCenterProps> = (props) => {
  const {
    project,
    invoices,
    invoicesLoading,
    pendingJMS,
    signedJMS,
    jmsLoading,
    clientUser,
    isReadOnly,
    onBack,
    onLogout,
    onResetPassword,
    onStageClick,
    onApprove,
    onReject,
    onPayClick,
    onSignJMS,
    selectedStage,
    isSheetOpen,
    onCloseSheet,
    nextUnpaidMilestone,
  } = props;

  const { isDark } = useTheme();
  const [timelineView, setTimelineView] = useState<'vertical' | 'gantt'>('vertical');

  const health = project.transparency?.projectHealth ?? 'on-track';
  const healthStyle = healthConfig[health];
  const HealthIcon = healthStyle.icon;

  const currentStage = useMemo(
    () => project.stages.find((s) => s.id === project.currentStageId) || project.stages[0],
    [project.stages, project.currentStageId]
  );
  const paidCount = project.paymentMilestones.filter((m) => m.isPaid).length;
  const unlockedUntilStage =
    paidCount > 0 && project.paymentMilestones[paidCount - 1]
      ? project.paymentMilestones[paidCount - 1].unlocksStage + 1
      : Math.max(2, project.stages?.length ?? 10);

  const pendingAmount = Math.max(0, (project.totalBudget || 0) - (project.totalPaid || 0));
  const completionPercent =
    project.totalBudget && project.totalBudget > 0
      ? Math.round(((project.totalPaid || 0) / project.totalBudget) * 100)
      : 0;
  const daysRemaining = project.daysRemaining ?? project.transparency?.daysRemaining ?? 0;
  const budgetUtilizationPercent = project.budgetUtilizationPercent ?? completionPercent;
  const warrantyDocs = project.documents?.filter((d) => d.documentType === 'warranty' || d.name?.toLowerCase().includes('warranty')) ?? [];
  const isJMSCompleted = !!signedJMS && !pendingJMS;

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0a0a0a] text-gray-100' : 'bg-slate-50/80'}`}>
      {/* Zone A – Project Intelligence Header (full width, sticky) */}
      <div className="relative z-50">
        <div className={`absolute top-0 left-0 right-0 h-16 border-b ${isDark ? 'bg-[#0c0c0c] border-amber-500/20' : 'bg-white/90 border-slate-200'} backdrop-blur-md flex items-center justify-between px-4 sm:px-6 z-50`}>
          <div className="flex items-center gap-4 min-w-0">
            <img src={MOCK_COMPANY.logoUrl} alt={MOCK_COMPANY.name} className="h-9 w-auto flex-shrink-0" />
            <div className="hidden sm:block border-l pl-4 border-slate-200 dark:border-amber-500/30">
              <p className={`text-sm font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{MOCK_COMPANY.name}</p>
              <p className={`text-xs ${isDark ? 'text-amber-200/90' : 'text-slate-600'}`}>GST: {MOCK_COMPANY.gstin}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            <a href={`mailto:${MOCK_COMPANY.supportEmail}`} className="hidden md:flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-amber-200/90">Support</a>
            <a href={`tel:${MOCK_COMPANY.supportPhone}`} className="hidden md:flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-amber-200/90">Phone</a>
            {onResetPassword && !isReadOnly && <button type="button" onClick={onResetPassword} className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-amber-200/90"><KeyIcon className="w-4 h-4" /> Reset</button>}
            {onBack && <button type="button" onClick={onBack} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-slate-100 dark:bg-amber-500/10 text-slate-700 dark:text-amber-200"><ArrowLeftIcon className="w-4 h-4" /><span className="hidden sm:inline">Back</span></button>}
            {!onBack && <button type="button" onClick={onLogout} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400">Logout</button>}
          </div>
        </div>
        <div className="pt-16">
          <ProjectIntelligenceHeader
            projectName={project.projectName ?? 'Project'}
            clientName={project.clientName}
            projectCode={project.projectId}
            health={health}
            completionPercent={completionPercent}
            daysRemaining={daysRemaining}
            budgetUtilizationPercent={budgetUtilizationPercent}
            totalBudget={project.totalBudget ?? 0}
            totalPaid={project.totalPaid ?? 0}
            nextMilestoneName={nextUnpaidMilestone?.stageName}
            nextPaymentDueDate={nextUnpaidMilestone?.dueDate ?? null}
            nextPaymentAmount={nextUnpaidMilestone?.amount}
            projectHeadName={project.consultant?.name}
            isDark={isDark}
          />
        </div>
      </div>

      {/* Zones B–D: Main content */}
      <main className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
          {/* Zone B – Phase-based Timeline (70%) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Timeline</h2>
              <div className="flex rounded-xl bg-slate-100 dark:bg-white/5 p-1">
                <button type="button" onClick={() => setTimelineView('vertical')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${timelineView === 'vertical' ? 'bg-white dark:bg-amber-500/20 text-slate-900 dark:text-amber-200 shadow-sm' : 'text-slate-600 dark:text-slate-400'}`}>Timeline</button>
                <button type="button" onClick={() => setTimelineView('gantt')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${timelineView === 'gantt' ? 'bg-white dark:bg-amber-500/20 text-slate-900 dark:text-amber-200 shadow-sm' : 'text-slate-600 dark:text-slate-400'}`}>Gantt</button>
              </div>
            </div>

            {timelineView === 'vertical' && (
              <div className="space-y-6">
                {project.leadJourneySteps && project.leadJourneySteps.length > 0 && (
                  <Phase1LeadSection steps={project.leadJourneySteps} documents={project.documents} isDark={isDark} defaultExpanded />
                )}
                <Phase2ExecutionSection stages={project.stages} dailyUpdates={project.dailyUpdates ?? []} isDark={isDark} defaultExpanded onStageClick={onStageClick} />
              </div>
            )}
            {timelineView === 'gantt' && (
              <div className={`rounded-2xl border ${isDark ? 'bg-white/5 border-amber-500/20' : 'bg-white border-slate-200'} shadow-lg p-6 backdrop-blur-sm`}>
                {project.leadJourneySteps && project.leadJourneySteps.length > 0 && <Phase1LeadSection steps={project.leadJourneySteps} documents={project.documents} isDark={isDark} defaultExpanded={false} />}
                <h3 className={`text-sm font-bold uppercase tracking-wider mt-6 mb-4 ${isDark ? 'text-amber-400/90' : 'text-slate-600'}`}>Phase 2 — Gantt</h3>
                <GanttView stages={project.stages} paymentMilestones={project.paymentMilestones} isDark={isDark} />
              </div>
            )}

            <div className={`rounded-2xl border ${isDark ? 'bg-white/5 border-amber-500/20' : 'bg-white border-slate-200'} shadow-lg p-6 backdrop-blur-sm transition-shadow hover:shadow-xl`}>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Today&apos;s Work</h3>
              <TodaysWork currentStage={currentStage} />
            </div>
            <div className={`rounded-2xl border ${isDark ? 'bg-white/5 border-amber-500/20' : 'bg-white border-slate-200'} shadow-lg p-6 backdrop-blur-sm`}>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Daily Progress</h3>
              <ClientDailyUpdatesReadOnly caseId={project.projectId} planDays={project.planDays ?? []} />
            </div>
          </div>

          {/* RIGHT: 30% — Payment, Approvals, Vault, Chat */}
          <div className="lg:col-span-3 space-y-6">
            {nextUnpaidMilestone && nextUnpaidMilestone.dueDate && new Date() > nextUnpaidMilestone.dueDate && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 flex items-center gap-3">
                <ExclamationTriangleIcon className="w-8 h-8 text-red-500 flex-shrink-0" />
                <div>
                  <p className="font-bold text-red-700 dark:text-red-400">Payment overdue</p>
                  <p className="text-sm text-red-600 dark:text-red-300">Please clear pending amount to avoid delays.</p>
                </div>
              </div>
            )}
            {nextUnpaidMilestone && (
              <PayAdvanceSection
                amount={nextUnpaidMilestone.amount}
                milestoneName={nextUnpaidMilestone.stageName}
                dueDate={nextUnpaidMilestone.dueDate}
                isOverdue={nextUnpaidMilestone.dueDate ? new Date() > nextUnpaidMilestone.dueDate : false}
                onPayNow={() => !isReadOnly && onPayClick(nextUnpaidMilestone!.amount, nextUnpaidMilestone!.stageName)}
              />
            )}

            <div className={`rounded-2xl border ${isDark ? 'bg-white/5 border-amber-500/20' : 'bg-white border-slate-200'} shadow-lg p-6 backdrop-blur-sm transition-shadow hover:shadow-xl`}>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Payment Summary</h3>
              <PaymentWidget
                milestones={project.paymentMilestones}
                totalPaid={project.totalPaid ?? 0}
                totalBudget={project.totalBudget ?? 0}
              />
            </div>

            <div className={`rounded-2xl border ${isDark ? 'bg-white/5 border-amber-500/20' : 'bg-white border-slate-200'} shadow-lg p-6 backdrop-blur-sm transition-shadow hover:shadow-xl`}>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Pending Approvals</h3>
              {project.requests.filter((r) => r.status === 'open').length > 0 ? (
                <PendingApprovalsWidget
                  requests={project.requests}
                  onApprove={onApprove}
                  onReject={onReject}
                />
              ) : (
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>No pending approvals. You’re all set.</p>
              )}
            </div>

            <div className={`rounded-2xl border ${isDark ? 'bg-white/5 border-amber-500/20' : 'bg-white border-slate-200'} shadow-lg p-6 backdrop-blur-sm transition-shadow hover:shadow-xl`}>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Billing & Invoices</h3>
              {invoicesLoading ? (
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Loading...</p>
              ) : invoices.length === 0 ? (
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>No invoices yet.</p>
              ) : (
                <div className="space-y-3">
                  {invoices.slice(0, 5).map((inv: any) => (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/5"
                    >
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{inv.invoiceNumber}</p>
                        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{formatDate(inv.issueDate || inv.issuedAt)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {formatCurrencyINR(inv.totalAmount ?? inv.total ?? 0)}
                        </span>
                        {inv.attachments?.[0]?.url && (
                          <a
                            href={inv.attachments[0].url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:text-secondary"
                          >
                            <DocumentArrowDownIcon className="w-5 h-5" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={`rounded-2xl border ${isDark ? 'bg-white/5 border-amber-500/20' : 'bg-white border-slate-200'} shadow-lg p-6 backdrop-blur-sm transition-shadow hover:shadow-xl`}>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Document Intelligence</h3>
              <DocumentIntelligencePanel documents={project.documents} isDark={isDark} />
            </div>

            <div className={`rounded-2xl border ${isDark ? 'bg-white/5 border-amber-500/20' : 'bg-white border-slate-200'} shadow-lg p-6 backdrop-blur-sm transition-shadow hover:shadow-xl`}>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Project Chat</h3>
              <CaseChat caseId={project.projectId} clientUserId={clientUser?.uid ?? ''} clientUserName={project.clientName} isReadOnly={isReadOnly} isDark={isDark} />
            </div>

            {isJMSCompleted && (
              <WarrantyClosureSection isCompleted={true} completedAt={signedJMS?.signedAt ? new Date(signedJMS.signedAt) : undefined} warrantyDocuments={warrantyDocs} warrantyEndDate={project.transparency?.estimatedCompletion ? new Date(project.transparency.estimatedCompletion.getTime() + 365 * 24 * 60 * 60 * 1000) : undefined} isDark={isDark} />
            )}

            <div className={`rounded-2xl border ${isDark ? 'bg-white/5 border-amber-500/20' : 'bg-white border-slate-200'} shadow-lg p-6 backdrop-blur-sm transition-shadow hover:shadow-xl`}>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Project Health</h3>
              <div className={`flex items-center gap-3 p-4 rounded-xl ${healthStyle.bg}`}>
                <HealthIcon className={`w-8 h-8 ${healthStyle.text}`} />
                <div>
                  <p className={`font-bold ${healthStyle.text}`}>{healthStyle.label}</p>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {project.transparency?.nextAction?.description ?? 'Work in progress'}
                  </p>
                </div>
              </div>
            </div>


            {/* JMS */}
            {!jmsLoading && pendingJMS && (
              <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-white shadow-xl">
                <h3 className="text-lg font-bold mb-2">Project Completion – JMS</h3>
                <p className="text-emerald-100 text-sm mb-4">Sign off the Joint Measurement Sheet.</p>
                <ClientJMSForm
                  caseId={project.projectId}
                  jmsDoc={pendingJMS}
                  clientId={clientUser?.uid ?? 'viewer'}
                  clientName={project.clientName}
                  onSuccess={() => {}}
                  onError={(msg) => alert(msg)}
                />
              </div>
            )}
            {!jmsLoading && signedJMS && !pendingJMS && (
              <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-white text-center">
                <h3 className="text-lg font-bold mb-2">Project Completed</h3>
                <p className="text-emerald-100 text-sm">JMS signed. Thank you.</p>
              </div>
            )}
            {!jmsLoading && !pendingJMS && !signedJMS && project.stages.length > 0 && project.currentStageId >= project.stages.length && (
              <button
                type="button"
                onClick={onSignJMS}
                disabled={isReadOnly}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl disabled:opacity-50"
              >
                Sign Off Project (JMS)
              </button>
            )}
          </div>
        </div>
      </main>

      <StageBottomSheet stage={selectedStage} isOpen={isSheetOpen} onClose={onCloseSheet} />
    </div>
  );
};

export default ClientProjectCommandCenter;
