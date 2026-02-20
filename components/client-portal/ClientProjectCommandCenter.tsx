/**
 * Client Project Command Center — premium redesign.
 * 3 zones: Top Header Bar | Left Main Panel (70%) | Right Side Panel (30%).
 * All data synced from staff-side Firestore (cases, subcollections). No backend structure change.
 */

import React, { useState, useMemo } from 'react';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  KeyIcon,
  CalendarDaysIcon,
  CurrencyRupeeIcon,
  ClipboardDocumentCheckIcon,
  FolderOpenIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { useTheme } from '../../context/ThemeContext';
import StageBottomSheet from './JourneyMap/StageBottomSheet';
import TodaysWork from './TodaysWork';
import PaymentWidget from './PaymentMilestones/PaymentWidget';
import PendingApprovalsWidget from './PendingApprovalsWidget';
import PayAdvanceSection from './PayAdvanceSection';
import ClientDailyUpdatesReadOnly from './ClientDailyUpdatesReadOnly';
import GanttView from './GanttView';
import ProjectIntelligenceHeader from './ProjectIntelligenceHeader';
import Phase1LeadSection from './PhaseTimeline/Phase1LeadSection';
import Phase2ExecutionSection from './PhaseTimeline/Phase2ExecutionSection';
import DocumentIntelligencePanel from './DocumentIntelligencePanel';
import CaseChat from './CaseChat';

import WarrantyClosureSection from './WarrantyClosureSection';
import type { ClientProject, JourneyStage, ProjectHealth } from './types';
import type { Invoice } from '../../types';

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

  const currentStage = useMemo(
    () => project.stages?.find((s) => s.id === project.currentStageId) || project.stages?.[0] || null,
    [project.stages, project.currentStageId]
  );

  const completionPercent =
    project.totalBudget && project.totalBudget > 0
      ? Math.round(((project.totalPaid || 0) / project.totalBudget) * 100)
      : 0;
  const daysRemaining = project.daysRemaining ?? project.transparency?.daysRemaining ?? 0;
  const budgetUtilizationPercent = project.budgetUtilizationPercent ?? completionPercent;
  const isJMSCompleted = !!signedJMS && !pendingJMS;



  const cardBase = `rounded-2xl border shadow-sm transition-all duration-300 ${isDark
    ? 'bg-[#151515] border-white/5 hover:border-amber-500/30'
    : 'bg-white border-slate-200/60 hover:shadow-xl hover:shadow-slate-200/40'
    }`;
  const cardPadding = 'p-6 sm:p-8';
  const textPrimary = isDark ? 'text-white' : 'text-slate-900';
  const textSecondary = isDark ? 'text-slate-400' : 'text-slate-600';
  const sectionTitle = `flex items-center gap-3 text-xl font-black tracking-tight ${textPrimary} mb-6`;

  return (
    <div className={`min-h-screen font-sans selection:bg-amber-500/30 ${isDark ? 'bg-[#0a0a0a] text-gray-100' : 'bg-[#f8fafc]'}`}>
      {/* Top nav bar */}
      <nav className={`fixed top-0 left-0 right-0 h-16 border-b z-50 ${isDark ? 'bg-[#0c0c0c]/80 border-white/10' : 'bg-white/80 border-slate-200'} backdrop-blur-xl flex items-center justify-between px-6 sm:px-10`}>
        <div className="flex items-center gap-6 min-w-0">
          <img src={MOCK_COMPANY.logoUrl} alt={MOCK_COMPANY.name} className="h-9 w-auto flex-shrink-0" />
          <div className="hidden lg:block h-6 w-px bg-slate-200 dark:bg-white/10" />
          <div className="hidden lg:block min-w-0">
            <p className={`text-sm font-black tracking-tight truncate ${textPrimary}`}>{MOCK_COMPANY.name}</p>
            <p className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-amber-500/80' : 'text-slate-500'}`}>Premium Project Experience</p>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-6 flex-shrink-0">
          <div className="hidden md:flex items-center gap-4 border-r dark:border-white/10 pr-6 mr-3">
            <a href={`mailto:${MOCK_COMPANY.supportEmail}`} className={`text-xs font-bold uppercase tracking-wider hover:text-amber-500 transition-colors ${textSecondary}`}>Support</a>
            <a href={`tel:${MOCK_COMPANY.supportPhone}`} className={`text-xs font-bold uppercase tracking-wider hover:text-amber-500 transition-colors ${textSecondary}`}>Call Direct</a>
          </div>
          {onResetPassword && !isReadOnly && (
            <button type="button" onClick={onResetPassword} className={`p-2 rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-white/10 transition-all ${textSecondary}`}>
              <KeyIcon className="w-5 h-5" />
            </button>
          )}
          {onBack ? (
            <button type="button" onClick={onBack} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${isDark ? 'bg-amber-500 text-black hover:bg-amber-400' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/20'}`}>
              <ArrowLeftIcon className="w-4 h-4 stroke-[3]" />
              <span className="hidden sm:inline">Project Hub</span>
            </button>
          ) : (
            <button type="button" onClick={onLogout} className="px-5 py-2.5 rounded-xl text-sm font-bold bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all">Logout</button>
          )}
        </div>
      </nav>

      {/* Hero Intelligence Section */}
      <div className="pt-16">
        <div className={`w-full ${isDark ? 'bg-gradient-to-b from-[#0c0c0c] to-[#0a0a0a]' : 'bg-white shadow-sm'}`}>
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
      </div>

      {/* Enhanced Today's Snapshot */}
      <div className="max-w-[1700px] mx-auto px-6 sm:px-10 py-8">
        <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
          {currentStage ? (
            <TodaysWork currentStage={currentStage} isDark={isDark} onViewDetails={() => onStageClick(currentStage)} />
          ) : (
            <div className={`rounded-3xl border p-8 text-center ${isDark ? 'bg-[#151515] border-white/5' : 'bg-white border-slate-200/60'}`}>
              <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>No active work items yet. Your project stages will appear here once set up.</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Content Area (8/12) */}
          <div className="lg:col-span-8 space-y-12">

            {/* Timeline Header with Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-2">
              <div>
                <h2 className={`text-3xl sm:text-4xl font-black tracking-tight ${textPrimary}`}>
                  Project Roadmap
                </h2>
                <p className={`text-sm mt-1 font-medium ${textSecondary}`}>Track milestones, documents, and execution stages in real-time.</p>
              </div>

              <div className={`inline-flex p-1.5 rounded-2xl ${isDark ? 'bg-white/5 border border-white/5' : 'bg-slate-100 border border-slate-200'}`}>
                <button
                  type="button"
                  onClick={() => setTimelineView('vertical')}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${timelineView === 'vertical'
                    ? (isDark ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'bg-white text-slate-900 shadow-md')
                    : (isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-900')
                    }`}
                >
                  <CalendarDaysIcon className="w-5 h-5" />
                  Journey
                </button>
                <button
                  type="button"
                  onClick={() => setTimelineView('gantt')}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${timelineView === 'gantt'
                    ? (isDark ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'bg-white text-slate-900 shadow-md')
                    : (isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-900')
                    }`}
                >
                  <ChartBarIcon className="w-5 h-5" />
                  Gantt
                </button>
              </div>
            </div>

            {/* Dynamic Timeline Content */}
            <div className="animate-in fade-in duration-500">
              {timelineView === 'vertical' ? (
                <div className="space-y-8">
                  {(project.leadJourney || project.leadJourneySteps?.length) && (
                    <Phase1LeadSection
                      caseId={project.projectId}
                      leadJourney={project.leadJourney}
                      clientName={project.clientName}
                      isDark={isDark}
                      defaultExpanded
                    />
                  )}
                  <Phase2ExecutionSection stages={project.stages ?? []} dailyUpdates={project.dailyUpdates ?? []} isDark={isDark} defaultExpanded onStageClick={onStageClick} />
                </div>
              ) : (
                <div className={`${cardBase} ${cardPadding} space-y-8`}>
                  <div className="flex items-center gap-4 pb-4 border-b dark:border-white/5">
                    <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500">
                      <ChartBarIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className={`text-lg font-black tracking-tight ${textPrimary}`}>Execution Gantt Chart</h3>
                      <p className={`text-xs ${textSecondary}`}>Visualizing project phases, dependencies, and payment milestones.</p>
                    </div>
                  </div>
                  <GanttView stages={project.stages ?? []} paymentMilestones={project.paymentMilestones ?? []} isDark={isDark} />
                </div>
              )}
            </div>

            {/* Daily Progress Section */}
            <section className={`${cardBase} ${cardPadding} relative overflow-hidden`}>
              {/* Background accent */}
              <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
              <h3 className={sectionTitle}>
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                  <ChartBarIcon className="w-6 h-6" />
                </div>
                Daily Progress Stream
              </h3>
              <ClientDailyUpdatesReadOnly
                caseId={project.projectId}
                planDays={project.planDays ?? []}
                updates={project.dailyUpdates ?? []}
              />
            </section>
          </div>

          {/* Right Sidebar Area (4/12) */}
          <aside className="lg:col-span-4 space-y-10">

            {/* Payment Urgency Notification */}
            {nextUnpaidMilestone && nextUnpaidMilestone.dueDate && new Date() > nextUnpaidMilestone.dueDate && (
              <div className="rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 p-6 text-white shadow-xl shadow-red-500/20 border border-white/10 animate-pulse">
                <div className="flex items-start gap-4">
                  <ExclamationTriangleIcon className="w-8 h-8 flex-shrink-0" />
                  <div>
                    <h4 className="font-black text-lg">Action Required: Payment Overdue</h4>
                    <p className="text-white/80 text-sm mt-1 leading-relaxed">Your current milestone payment is overdue. Please settle to ensure zero interruptions in site activity.</p>
                    <button
                      onClick={() => onPayClick(nextUnpaidMilestone!.amount, nextUnpaidMilestone!.stageName)}
                      className="mt-4 px-6 py-2.5 bg-white text-red-600 rounded-xl text-sm font-black hover:bg-slate-100 transition-all active:scale-95"
                    >
                      Pay Securely Now
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Next Milestone Quick Pay */}
            {nextUnpaidMilestone && (
              <PayAdvanceSection
                amount={nextUnpaidMilestone.amount}
                milestoneName={nextUnpaidMilestone.stageName}
                dueDate={nextUnpaidMilestone.dueDate}
                isOverdue={nextUnpaidMilestone.dueDate ? new Date() > nextUnpaidMilestone.dueDate : false}
                onPayNow={() => !isReadOnly && onPayClick(nextUnpaidMilestone!.amount, nextUnpaidMilestone!.stageName)}
              />
            )}

            {/* Financial Overview Groups */}
            <div className="space-y-6">
              <h4 className={`text-xs font-black uppercase tracking-[0.2em] ${isDark ? 'text-amber-500/60' : 'text-slate-400'} px-1`}>Financials & Audit</h4>

              <div className={`${cardBase} p-6 border-l-4 ${isDark ? 'border-l-emerald-500/50' : 'border-l-emerald-500'}`}>
                <h5 className="flex items-center gap-3 font-black text-sm uppercase tracking-wider mb-6">
                  <CurrencyRupeeIcon className="w-5 h-5 text-emerald-500" />
                  Payment Lifecycle
                </h5>
                <PaymentWidget
                  milestones={project.paymentMilestones}
                  totalPaid={project.totalPaid ?? 0}
                  totalBudget={project.totalBudget ?? 0}
                  nextDueDate={nextUnpaidMilestone?.dueDate ?? null}
                  isOverdue={nextUnpaidMilestone?.dueDate ? new Date() > nextUnpaidMilestone.dueDate : false}
                  onPayClick={!isReadOnly ? onPayClick : undefined}
                />
              </div>

              <div className={`${cardBase} p-6 border-l-4 ${isDark ? 'border-l-amber-500/50' : 'border-l-amber-500'}`}>
                <h5 className="flex items-center gap-3 font-black text-sm uppercase tracking-wider mb-6">
                  <ClipboardDocumentCheckIcon className="w-5 h-5 text-amber-500" />
                  Pending approvals
                </h5>
                <PendingApprovalsWidget
                  requests={project.requests}
                  onApprove={onApprove}
                  onReject={onReject}
                  isDark={isDark}
                />
              </div>
            </div>

            {/* Intelligence & Collaboration */}
            <div className="space-y-6">
              <h4 className={`text-xs font-black uppercase tracking-[0.2em] ${isDark ? 'text-amber-500/60' : 'text-slate-400'} px-1`}>Communication Hub</h4>

              <div className={`${cardBase} overflow-hidden`}>
                <CaseChat
                  caseId={project.projectId}
                  messages={project.chat || []}
                  clientUserId={clientUser?.uid ?? ''}
                  clientName={project.clientName}
                  isReadOnly={isReadOnly}
                  isDark={isDark}
                />
              </div>

              <div className={`${cardBase} p-6 overflow-hidden`}>
                <h5 className="flex items-center gap-3 font-black text-sm uppercase tracking-wider mb-6">
                  <FolderOpenIcon className="w-5 h-5 text-blue-500" />
                  Project Documents
                </h5>
                <DocumentIntelligencePanel documents={project.documents} isDark={isDark} />
              </div>
            </div>

            {/* Warranty & Closure (Only if active) */}
            {isJMSCompleted && (
              <div className="animate-in zoom-in-95 duration-500">
                <WarrantyClosureSection isCompleted={true} completedAt={signedJMS?.signedAt ? new Date(signedJMS.signedAt) : undefined} warrantyDocuments={project.documents?.filter(d => d.documentType === 'warranty')} isDark={isDark} />
              </div>
            )}

            {/* Completion Buttons */}
            {!jmsLoading && !pendingJMS && !signedJMS && (project.stages?.length ?? 0) > 0 && project.currentStageId >= (project.stages?.length ?? 0) && (
              <button
                type="button"
                onClick={onSignJMS}
                disabled={isReadOnly}
                className="w-full py-5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black rounded-2xl shadow-xl shadow-emerald-500/20 active:scale-95 transition-all"
              >
                Launch Final Step: JMS Review
              </button>
            )}
          </aside>
        </div>
      </div>

      {/* Dynamic Detail Sheet */}
      <StageBottomSheet stage={selectedStage} isOpen={isSheetOpen} onClose={onCloseSheet} />

      {/* Footer bar */}
      <footer className={`py-12 mt-20 border-t ${isDark ? 'bg-[#080808] border-white/5' : 'bg-white border-slate-200'} text-center px-6`}>
        <img src={MOCK_COMPANY.logoUrl} alt="Logo" className="h-6 mx-auto opacity-30 grayscale mb-4" />
        <p className={`text-xs font-bold uppercase tracking-[0.3em] ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
          &copy; {new Date().getFullYear()} Make My Office. All Rights Reserved.
        </p>
      </footer>
    </div>
  );
};

export default ClientProjectCommandCenter;
