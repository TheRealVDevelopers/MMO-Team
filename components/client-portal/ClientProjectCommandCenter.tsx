/**
 * Client Project Command Center â€” premium redesign.
 * 3 zones: Top Header Bar | Left Main Panel (70%) | Right Side Panel (30%).
 * All data synced from staff-side Firestore (cases, subcollections). No backend structure change.
 */

import React, { useState, useMemo } from 'react';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  DocumentArrowDownIcon,
  KeyIcon,
  CalendarDaysIcon,
  CurrencyRupeeIcon,
  ClipboardDocumentCheckIcon,
  DocumentTextIcon,
  FolderOpenIcon,
  ChatBubbleLeftRightIcon,
  HeartIcon,
  BriefcaseIcon,
  ChartBarIcon,
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

  const cardBase = `rounded-2xl border shadow-sm transition-all duration-300 ${isDark ? 'bg-white/[0.06] border-amber-500/20 hover:border-amber-500/30 hover:shadow-lg' : 'bg-white border-slate-200/80 hover:shadow-md hover:ring-2 hover:ring-slate-200/50'}`;
  const cardPadding = 'p-6';
  const textPrimary = isDark ? 'text-white' : 'text-[#111111]';
  const sectionTitle = `flex items-center gap-2.5 text-lg font-bold ${textPrimary} mb-4`;

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0a0a0a] text-gray-100' : 'bg-gradient-to-b from-slate-50 via-slate-50/95 to-slate-100/80'}`}>
      {/* Top nav bar */}
      <div className={`fixed top-0 left-0 right-0 h-14 border-b z-50 ${isDark ? 'bg-[#0c0c0c] border-amber-500/20' : 'bg-white border-slate-200 shadow-sm'} backdrop-blur-md flex items-center justify-between px-4 sm:px-6`}>
        <div className="flex items-center gap-4 min-w-0">
          <img src={MOCK_COMPANY.logoUrl} alt={MOCK_COMPANY.name} className="h-8 w-auto flex-shrink-0" />
          <div className="hidden sm:block border-l pl-4 border-slate-200 dark:border-amber-500/30">
            <p className={`text-sm font-bold truncate ${textPrimary}`}>{MOCK_COMPANY.name}</p>
            <p className={`text-xs ${isDark ? 'text-amber-200/90' : 'text-[#111111]'}`}>GST: {MOCK_COMPANY.gstin}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
          <a href={`mailto:${MOCK_COMPANY.supportEmail}`} className={`hidden md:flex items-center gap-1.5 text-xs font-medium ${isDark ? 'text-amber-200/90' : 'text-[#111111]'}`}>Support</a>
          <a href={`tel:${MOCK_COMPANY.supportPhone}`} className={`hidden md:flex items-center gap-1.5 text-xs font-medium ${isDark ? 'text-amber-200/90' : 'text-[#111111]'}`}>Phone</a>
          {onResetPassword && !isReadOnly && <button type="button" onClick={onResetPassword} className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium ${isDark ? 'text-amber-200/90' : 'text-[#111111]'}`}><KeyIcon className="w-4 h-4" /> Reset</button>}
          {onBack && <button type="button" onClick={onBack} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium ${isDark ? 'bg-amber-500/10 text-amber-200' : 'bg-slate-100 text-[#111111]'}`}><ArrowLeftIcon className="w-4 h-4" /><span className="hidden sm:inline">Back</span></button>}
          {!onBack && <button type="button" onClick={onLogout} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400">Logout</button>}
        </div>
      </div>

      {/* Project Intelligence Header (3-row) â€“ below nav */}
      <div className="pt-14">
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
          projectHeadPhone={project.consultant?.phone}
          projectHeadEmail={project.consultant?.email}
          isDark={isDark}
        />
      </div>

      {/* Today's Work â€“ full width panel just below header */}
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <TodaysWork currentStage={currentStage} isDark={isDark} onViewDetails={() => onStageClick(currentStage)} />
      </div>

      {/* Main content */}
      <main className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-8 lg:gap-10">
          {/* Left: Timeline (70%) */}
          <div className="lg:col-span-7 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className={`flex items-center gap-2.5 text-2xl font-bold tracking-tight ${textPrimary}`}>
                <span className={`p-2 rounded-xl ${isDark ? 'bg-amber-500/20' : 'bg-slate-100'}`}>
                  <CalendarDaysIcon className={`w-6 h-6 ${isDark ? 'text-amber-400' : 'text-[#111111]'}`} />
                </span>
                Timeline
              </h2>
              <div className="flex rounded-xl bg-slate-100 dark:bg-white/5 p-1.5 border border-slate-200/80 dark:border-amber-500/20">
                <button type="button" onClick={() => setTimelineView('vertical')} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${timelineView === 'vertical' ? 'bg-white dark:bg-amber-500/20 shadow-sm ' + textPrimary : (isDark ? 'text-slate-400 hover:text-slate-300' : 'text-[#111111] hover:opacity-80')}`}>
                  <CalendarDaysIcon className="w-4 h-4" /> Timeline
                </button>
                <button type="button" onClick={() => setTimelineView('gantt')} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${timelineView === 'gantt' ? 'bg-white dark:bg-amber-500/20 shadow-sm ' + textPrimary : (isDark ? 'text-slate-400 hover:text-slate-300' : 'text-[#111111] hover:opacity-80')}`}>
                  <ChartBarIcon className="w-4 h-4" /> Gantt
                </button>
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
              <div className={`${cardBase} ${cardPadding} border-l-4 ${isDark ? 'border-l-amber-500/50' : 'border-l-slate-300'}`}>
                {project.leadJourneySteps && project.leadJourneySteps.length > 0 && <Phase1LeadSection steps={project.leadJourneySteps} documents={project.documents} isDark={isDark} defaultExpanded={false} />}
                <h3 className={`flex items-center gap-2 text-sm font-bold uppercase tracking-wider mt-6 mb-4 ${isDark ? 'text-amber-400/90' : 'text-[#111111]'}`}>
                  <ChartBarIcon className="w-4 h-4" /> Phase 2 â€” Gantt
                </h3>
                <GanttView stages={project.stages} paymentMilestones={project.paymentMilestones} isDark={isDark} />
              </div>
            )}

            <div className={`${cardBase} ${cardPadding} border-l-4 ${isDark ? 'border-l-emerald-500/50' : 'border-l-emerald-400'}`}>
              <h3 className={sectionTitle}>
                <ChartBarIcon className={`w-5 h-5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} /> Daily Progress
              </h3>
              <ClientDailyUpdatesReadOnly caseId={project.projectId} planDays={project.planDays ?? []} />
            </div>
          </div>

          {/* RIGHT: 30% â€” Payment, Approvals, Documents, Chat */}
          <aside className="lg:col-span-3 space-y-8">
            {nextUnpaidMilestone && nextUnpaidMilestone.dueDate && new Date() > nextUnpaidMilestone.dueDate && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 flex items-center gap-3 shadow-sm">
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

            <div className="space-y-4">
              <p className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-amber-400/80' : 'text-[#111111]'}`}>Payments & Billing</p>
              <div className={`${cardBase} ${cardPadding} border-l-4 ${isDark ? 'border-l-emerald-500/50' : 'border-l-emerald-500'}`}>
                <h3 className={sectionTitle}>
                  <CurrencyRupeeIcon className={`w-5 h-5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} /> Payment Summary
                </h3>
                <PaymentWidget
                  milestones={project.paymentMilestones}
                  totalPaid={project.totalPaid ?? 0}
                  totalBudget={project.totalBudget ?? 0}
                  nextDueDate={nextUnpaidMilestone?.dueDate ?? null}
                  isOverdue={nextUnpaidMilestone?.dueDate ? new Date() > nextUnpaidMilestone.dueDate : false}
                  onPayClick={!isReadOnly ? onPayClick : undefined}
                />
              </div>

              <div className={`${cardBase} ${cardPadding} border-l-4 ${isDark ? 'border-l-amber-500/50' : 'border-l-amber-500'}`}>
                <h3 className={sectionTitle}>
                  <ClipboardDocumentCheckIcon className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} /> Pending Approvals
                </h3>
                <PendingApprovalsWidget
                  requests={project.requests}
                  onApprove={onApprove}
                  onReject={onReject}
                  isDark={isDark}
                />
              </div>

              <div className={`${cardBase} ${cardPadding} border-l-4 ${isDark ? 'border-l-slate-400/50' : 'border-l-slate-400'}`}>
                <h3 className={sectionTitle}>
                  <DocumentTextIcon className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-[#111111]'}`} /> Billing & Invoices
                </h3>
                {invoicesLoading ? (
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-[#111111]'}`}>Loading...</p>
                ) : invoices.length === 0 ? (
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-[#111111]'}`}>No invoices yet.</p>
                ) : (
                  <div className="space-y-3">
                    {invoices.slice(0, 5).map((inv: any) => (
                      <div
                        key={inv.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10"
                      >
                        <div>
                          <p className={`text-sm font-bold ${textPrimary}`}>{inv.invoiceNumber}</p>
                          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-[#111111]'}`}>{formatDate(inv.issueDate || inv.issuedAt)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold ${textPrimary}`}>
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
            </div>

            <div className="space-y-4">
              <p className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-amber-400/80' : 'text-[#111111]'}`}>Project & Team</p>
              <div className={`${cardBase} ${cardPadding} border-l-4 ${isDark ? 'border-l-blue-500/50' : 'border-l-blue-500'}`}>
                <h3 className={sectionTitle}>
                  <FolderOpenIcon className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} /> Document Intelligence
                </h3>
                <DocumentIntelligencePanel documents={project.documents} isDark={isDark} />
              </div>

              <div className={`${cardBase} ${cardPadding} border-l-4 ${isDark ? 'border-l-violet-500/50' : 'border-l-violet-500'}`}>
                <h3 className={sectionTitle}>
                  <ChatBubbleLeftRightIcon className={`w-5 h-5 ${isDark ? 'text-violet-400' : 'text-violet-600'}`} /> Project Chat
                </h3>
                <CaseChat caseId={project.projectId} clientUserId={clientUser?.uid ?? ''} clientUserName={project.clientName} isReadOnly={isReadOnly} isDark={isDark} />
              </div>

              {isJMSCompleted && (
                <WarrantyClosureSection isCompleted={true} completedAt={signedJMS?.signedAt ? new Date(signedJMS.signedAt) : undefined} warrantyDocuments={warrantyDocs} warrantyEndDate={project.transparency?.estimatedCompletion ? new Date(project.transparency.estimatedCompletion.getTime() + 365 * 24 * 60 * 60 * 1000) : undefined} isDark={isDark} />
              )}

              <div className={`${cardBase} ${cardPadding} border-l-4 ${health === 'on-track' ? (isDark ? 'border-l-emerald-500/50' : 'border-l-emerald-500') : health === 'minor-delay' ? (isDark ? 'border-l-amber-500/50' : 'border-l-amber-500') : (isDark ? 'border-l-red-500/50' : 'border-l-red-500')}`}>
                <h3 className={sectionTitle}>
                  <HeartIcon className={`w-5 h-5 ${healthStyle.text}`} /> Project Health
                </h3>
                <div className={`flex items-center gap-3 p-4 rounded-xl ${healthStyle.bg} border border-transparent`}>
                  <HealthIcon className={`w-8 h-8 ${healthStyle.text}`} />
                  <div>
                    <p className={`font-bold ${healthStyle.text}`}>{healthStyle.label}</p>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-[#111111]'}`}>
                      {project.transparency?.nextAction?.description ?? 'Work in progress'}
                    </p>
                  </div>
                </div>
              </div>
            </div>


            {/* JMS */}
            {!jmsLoading && pendingJMS && (
              <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-white shadow-lg border border-emerald-400/20">
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
              <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-white text-center shadow-lg border border-emerald-400/20">
                <h3 className="text-lg font-bold mb-2">Project Completed</h3>
                <p className="text-emerald-100 text-sm">JMS signed. Thank you.</p>
              </div>
            )}
            {!jmsLoading && !pendingJMS && !signedJMS && project.stages.length > 0 && project.currentStageId >= project.stages.length && (
              <button
                type="button"
                onClick={onSignJMS}
                disabled={isReadOnly}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl disabled:opacity-50 shadow-md hover:shadow-lg transition-shadow"
              >
                Sign Off Project (JMS)
              </button>
            )}
          </aside>
        </div>
      </main>

      <StageBottomSheet stage={selectedStage} isOpen={isSheetOpen} onClose={onCloseSheet} />
    </div>
  );
};

export default ClientProjectCommandCenter;
