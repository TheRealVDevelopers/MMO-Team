/**
 * Phase 1 – Lead Journey (Client Side)
 * Full gated approval workflow visible to the client.
 *
 * The client can:
 * - See all milestones (Call, Site Visit)
 * - See each document stage with revision history
 * - Approve or Reject (with mandatory remark) each submission
 * - View / download submitted documents
 * - Track which stage is current
 */

import React, { useState } from 'react';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../../firebase';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  XCircleIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  LockClosedIcon,
  ChatBubbleLeftEllipsisIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckSolid, ClockIcon as ClockSolid } from '@heroicons/react/24/solid';
import { formatDate } from '../../../constants';

/** Ordered stages that require client approval */
const LEAD_STAGES = [
  { key: 'recce_report', label: 'Recce / Site Measurement Report' },
  { key: '2d_drawing', label: '2D Layout / Floor Plan' },
  { key: '3d_drawing', label: '3D Visualization / Renders' },
  { key: 'boq', label: 'Bill of Quantities (BOQ)' },
  { key: 'quotation', label: 'Quotation / Proposal' },
  { key: 'purchase_order', label: 'Purchase Order (PO)' },
] as const;

const MILESTONE_STEPS = [
  { key: 'callInitiated', label: 'Inquiry Initiated' },
  { key: 'siteVisitScheduled', label: 'Site Visit Scheduled' },
  { key: 'siteVisitCompleted', label: 'Site Visit Completed' },
] as const;

interface Phase1LeadSectionProps {
  caseId: string;
  leadJourney: any;
  clientName?: string;
  isDark?: boolean;
  defaultExpanded?: boolean;
}

const Phase1LeadSection: React.FC<Phase1LeadSectionProps> = ({
  caseId,
  leadJourney,
  clientName,
  isDark = true,
  defaultExpanded = true,
}) => {
  const [collapsed, setCollapsed] = useState(!defaultExpanded);
  const [expandedStage, setExpandedStage] = useState<string | null>(null);
  const [reviewingSubmission, setReviewingSubmission] = useState<{ stageKey: string; subId: string } | null>(null);
  const [remarks, setRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const journey = leadJourney || {};
  const stages = journey.stages || {};

  const textP = isDark ? 'text-white' : 'text-slate-900';
  const textS = isDark ? 'text-slate-400' : 'text-slate-500';
  const bgCard = isDark ? 'bg-white/[0.04] border-white/10' : 'bg-white border-slate-200';
  const bgHover = isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50';

  // Check milestone status
  const isMilestoneDone = (key: string) => !!journey[key];
  const getDate = (v: any): Date | null => {
    if (!v) return null;
    if (v.seconds) return new Date(v.seconds * 1000);
    if (v instanceof Date) return v;
    return new Date(v);
  };
  const allMilestonesDone = MILESTONE_STEPS.every(m => isMilestoneDone(m.key));

  // Get stage info
  const getStage = (key: string) => stages[key] || { label: '', status: 'not_started', submissions: [] };
  const isStageUnlocked = (idx: number): boolean => {
    if (!allMilestonesDone) return false;
    if (idx === 0) return true;
    const prevStage = getStage(LEAD_STAGES[idx - 1].key);
    return prevStage.status === 'approved';
  };

  // Handle approve / reject
  const handleApproval = async (stageKey: string, subId: string, action: 'approved' | 'rejected') => {
    if (action === 'rejected' && !remarks.trim()) {
      alert('Please provide remarks when rejecting a document.');
      return;
    }
    setActionLoading(true);
    try {
      const stage = getStage(stageKey);
      const updatedSubmissions = (stage.submissions || []).map((s: any) => {
        if (s.id === subId) {
          return {
            ...s,
            approvalStatus: action,
            reviewedAt: new Date().toISOString(),
            reviewedBy: clientName || 'Client',
            clientRemarks: remarks.trim() || undefined,
          };
        }
        return s;
      });

      const newStageStatus = action === 'approved' ? 'approved' : 'rejected';

      const caseRef = doc(db as any, 'cases', caseId);
      await updateDoc(caseRef, {
        [`leadJourney.stages.${stageKey}.submissions`]: updatedSubmissions,
        [`leadJourney.stages.${stageKey}.status`]: newStageStatus,
        updatedAt: Timestamp.now(),
      });

      setReviewingSubmission(null);
      setRemarks('');
    } catch (error) {
      console.error('Error updating approval:', error);
      alert('Failed to submit review. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Status badge
  const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const configs: Record<string, { bg: string; text: string; label: string }> = {
      not_started: { bg: isDark ? 'bg-white/10' : 'bg-slate-100', text: isDark ? 'text-slate-400' : 'text-slate-500', label: 'Not Started' },
      awaiting_upload: { bg: isDark ? 'bg-yellow-500/20' : 'bg-yellow-100', text: isDark ? 'text-yellow-300' : 'text-yellow-700', label: 'In Progress' },
      awaiting_approval: { bg: isDark ? 'bg-blue-500/20' : 'bg-blue-100', text: isDark ? 'text-blue-300' : 'text-blue-700', label: 'Your Review Needed' },
      approved: { bg: isDark ? 'bg-emerald-500/20' : 'bg-green-100', text: isDark ? 'text-emerald-300' : 'text-green-700', label: 'Approved' },
      rejected: { bg: isDark ? 'bg-red-500/20' : 'bg-red-100', text: isDark ? 'text-red-300' : 'text-red-700', label: 'Changes Requested' },
      pending: { bg: isDark ? 'bg-amber-500/20' : 'bg-amber-100', text: isDark ? 'text-amber-300' : 'text-amber-700', label: 'Pending Review' },
    };
    const c = configs[status] || configs.not_started;
    return (
      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${c.bg} ${c.text}`}>
        {c.label}
      </span>
    );
  };

  return (
    <div className={`rounded-2xl border overflow-hidden shadow-sm transition-all duration-300 ${bgCard}`}>
      {/* Header */}
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className={`w-full flex items-center justify-between px-5 py-4 text-left transition-colors ${bgHover}`}
      >
        <div className="flex items-center gap-3">
          <span className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-amber-400' : 'text-slate-800'}`}>
            Phase 1 — Lead Journey
          </span>
          {/* Progress indicator */}
          {allMilestonesDone && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${isDark ? 'bg-white/10 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
              {LEAD_STAGES.filter(s => getStage(s.key).status === 'approved').length}/{LEAD_STAGES.length} completed
            </span>
          )}
        </div>
        {collapsed ? <ChevronRightIcon className={`w-5 h-5 ${textS}`} /> : <ChevronDownIcon className={`w-5 h-5 ${textS}`} />}
      </button>

      {!collapsed && (
        <div className="px-5 pb-5 space-y-6">
          {/* ── Milestones ── */}
          <div className="space-y-2">
            <p className={`text-[10px] font-bold uppercase tracking-wider ${textS}`}>Initial Contact</p>
            <div className="relative pl-8 space-y-0">
              {/* Vertical line */}
              <div className={`absolute left-3 top-2 bottom-2 w-0.5 ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />

              {MILESTONE_STEPS.map((ms) => {
                const done = isMilestoneDone(ms.key);
                const date = getDate(journey[ms.key]);
                return (
                  <div key={ms.key} className="relative flex items-center gap-3 py-2.5">
                    {/* Circle */}
                    <div className={`absolute -left-5 w-6 h-6 rounded-full border-2 flex items-center justify-center ${done
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : isDark ? 'bg-[#111] border-white/20' : 'bg-white border-slate-300'
                      }`}>
                      {done ? <CheckSolid className="w-3.5 h-3.5" /> : <ClockSolid className={`w-3 h-3 ${isDark ? 'text-white/30' : 'text-slate-300'}`} />}
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${done ? textP : textS}`}>{ms.label}</p>
                      {done && date && (
                        <p className="text-[10px] text-emerald-500 font-medium">{formatDate(date)}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Document Stages ── */}
          <div className="space-y-2">
            <p className={`text-[10px] font-bold uppercase tracking-wider ${textS}`}>Documents & Approvals</p>

            {!allMilestonesDone && (
              <div className={`text-xs p-3 rounded-lg ${isDark ? 'bg-white/5 text-slate-500' : 'bg-slate-50 text-slate-400'}`}>
                Document stages will be available after initial contact is completed.
              </div>
            )}

            {LEAD_STAGES.map((stg, idx) => {
              const stage = getStage(stg.key);
              const unlocked = isStageUnlocked(idx);
              const isExpanded = expandedStage === stg.key;
              const submissions = stage.submissions || [];
              const latestSub = submissions[submissions.length - 1];
              const isApproved = stage.status === 'approved';
              const needsReview = latestSub?.approvalStatus === 'pending';
              const isReviewing = reviewingSubmission?.stageKey === stg.key;

              return (
                <div key={stg.key} className={`rounded-xl border transition-all overflow-hidden ${isApproved
                  ? isDark ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-emerald-200 bg-emerald-50/30'
                  : needsReview
                    ? isDark ? 'border-blue-500/30 bg-blue-500/5' : 'border-blue-200 bg-blue-50/30'
                    : !unlocked
                      ? isDark ? 'border-white/5 bg-white/[0.02] opacity-50' : 'border-slate-100 bg-slate-50/30 opacity-50'
                      : isDark ? 'border-white/10 bg-white/[0.03]' : 'border-slate-200 bg-white'
                  }`}>
                  {/* Stage header */}
                  <button
                    onClick={() => unlocked && submissions.length > 0 && setExpandedStage(isExpanded ? null : stg.key)}
                    className={`w-full flex items-center gap-3 p-4 text-left transition-colors ${unlocked && submissions.length > 0 ? 'cursor-pointer' : 'cursor-default'} ${bgHover}`}
                    disabled={!unlocked || submissions.length === 0}
                  >
                    {/* Status circle */}
                    <div className={`p-2 rounded-lg flex-shrink-0 ${isApproved
                      ? isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600'
                      : needsReview
                        ? isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'
                        : !unlocked
                          ? isDark ? 'bg-white/5 text-white/20' : 'bg-slate-100 text-slate-300'
                          : isDark ? 'bg-white/5 text-white/40' : 'bg-slate-100 text-slate-400'
                      }`}>
                      {isApproved ? <CheckSolid className="w-5 h-5" />
                        : !unlocked ? <LockClosedIcon className="w-5 h-5" />
                          : needsReview ? <ClockIcon className="w-5 h-5 animate-pulse" />
                            : <DocumentTextIcon className="w-5 h-5" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-semibold text-sm ${unlocked ? textP : textS}`}>
                          {stg.label}
                        </span>
                        {unlocked && <StatusBadge status={needsReview ? 'awaiting_approval' : stage.status} />}
                      </div>
                      {submissions.length > 0 && (
                        <p className={`text-xs mt-0.5 ${textS}`}>
                          {submissions.length} revision{submissions.length !== 1 ? 's' : ''}
                          {needsReview && (
                            <span className={isDark ? 'text-blue-400 ml-2' : 'text-blue-600 ml-2'}>
                              · Action required
                            </span>
                          )}
                        </p>
                      )}
                    </div>

                    {unlocked && submissions.length > 0 && (
                      <span>
                        {isExpanded ? <ChevronDownIcon className={`w-4 h-4 ${textS}`} /> : <ChevronRightIcon className={`w-4 h-4 ${textS}`} />}
                      </span>
                    )}
                  </button>

                  {/* Expanded: Revision list + review actions */}
                  {isExpanded && unlocked && (
                    <div className={`px-4 pb-4 border-t ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
                      <div className="space-y-3 mt-3">
                        <p className={`text-[10px] font-bold uppercase tracking-wider ${textS}`}>Revision History</p>

                        {[...submissions].reverse().map((sub: any, rIdx: number) => {
                          const rev = submissions.length - rIdx;
                          const isLatest = rIdx === 0;
                          const canReview = isLatest && sub.approvalStatus === 'pending';
                          const isThisReviewing = isReviewing && reviewingSubmission?.subId === sub.id;

                          return (
                            <div key={sub.id} className={`rounded-lg border p-3 transition-all ${sub.approvalStatus === 'approved'
                              ? isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'
                              : sub.approvalStatus === 'rejected'
                                ? isDark ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-200'
                                : isDark ? 'bg-white/[0.03] border-white/10' : 'bg-white border-slate-100'
                              }`}>
                              {/* Revision header */}
                              <div className="flex items-start gap-3">
                                <div className={`p-1.5 rounded-full flex-shrink-0 ${sub.approvalStatus === 'approved'
                                  ? isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600'
                                  : sub.approvalStatus === 'rejected'
                                    ? isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-600'
                                    : isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-600'
                                  }`}>
                                  {sub.approvalStatus === 'approved' ? <CheckCircleIcon className="w-4 h-4" />
                                    : sub.approvalStatus === 'rejected' ? <XCircleIcon className="w-4 h-4" />
                                      : <ClockSolid className="w-4 h-4" />}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`font-bold text-sm ${textP}`}>Rev {rev}</span>
                                    <span className={`text-xs ${textS}`}>·</span>
                                    <span className={`text-xs truncate ${textS}`}>{sub.fileName}</span>
                                    {isLatest && <StatusBadge status={sub.approvalStatus} />}
                                  </div>
                                  <p className={`text-[10px] mt-0.5 ${textS}`}>
                                    Submitted {sub.uploadedAt ? formatDate(new Date(sub.uploadedAt)) : '—'}
                                    {sub.fileSize && ` · ${sub.fileSize}`}
                                  </p>
                                </div>

                                {/* View / Download buttons */}
                                {sub.fileUrl && (
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    <a href={sub.fileUrl} target="_blank" rel="noopener noreferrer"
                                      className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg transition-colors ${isDark ? 'text-amber-400 hover:bg-white/5' : 'text-emerald-600 hover:bg-emerald-50'}`}>
                                      <EyeIcon className="w-3.5 h-3.5" /> View
                                    </a>
                                    <a href={sub.fileUrl} download target="_blank" rel="noopener noreferrer"
                                      className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg transition-colors ${isDark ? 'text-slate-400 hover:bg-white/5' : 'text-slate-500 hover:bg-slate-50'}`}>
                                      <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                                    </a>
                                  </div>
                                )}
                              </div>

                              {/* Client remarks (for reviewed submissions) */}
                              {sub.clientRemarks && (
                                <div className={`mt-2 flex items-start gap-2 px-3 py-2 rounded-lg text-xs ${sub.approvalStatus === 'rejected'
                                  ? isDark ? 'bg-red-500/10 text-red-300' : 'bg-red-100/50 text-red-700'
                                  : isDark ? 'bg-emerald-500/10 text-emerald-300' : 'bg-emerald-100/50 text-emerald-700'
                                  }`}>
                                  <ChatBubbleLeftEllipsisIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                  <span>Your feedback: "{sub.clientRemarks}"</span>
                                </div>
                              )}

                              {/* ── Review Actions (only for latest pending submission) ── */}
                              {canReview && !isThisReviewing && (
                                <div className="mt-3 flex items-center gap-2">
                                  <button
                                    onClick={() => {
                                      setRemarks('');
                                      handleApproval(stg.key, sub.id, 'approved');
                                    }}
                                    disabled={actionLoading}
                                    className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-white font-semibold text-sm hover:bg-emerald-600 disabled:opacity-50 transition-colors"
                                  >
                                    ✓ Approve
                                  </button>
                                  <button
                                    onClick={() => setReviewingSubmission({ stageKey: stg.key, subId: sub.id })}
                                    className={`flex-1 py-2.5 rounded-xl border font-semibold text-sm transition-colors ${isDark
                                      ? 'border-red-500/30 text-red-400 hover:bg-red-500/10'
                                      : 'border-red-200 text-red-600 hover:bg-red-50'
                                      }`}
                                  >
                                    ✕ Request Changes
                                  </button>
                                </div>
                              )}

                              {/* Rejection remarks form */}
                              {isThisReviewing && (
                                <div className="mt-3 space-y-3">
                                  <div>
                                    <label className={`text-[10px] font-bold uppercase tracking-wider ${textS} block mb-1.5`}>
                                      What changes do you need? <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                      value={remarks}
                                      onChange={(e) => setRemarks(e.target.value)}
                                      placeholder="Please describe the changes needed..."
                                      rows={3}
                                      className={`w-full rounded-xl border px-3 py-2.5 text-sm resize-none outline-none transition-all ${isDark
                                        ? 'bg-white/5 border-white/10 text-white placeholder-slate-600 focus:border-red-500/50'
                                        : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-red-400 focus:ring-2 focus:ring-red-100'
                                        }`}
                                    />
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleApproval(stg.key, sub.id, 'rejected')}
                                      disabled={actionLoading || !remarks.trim()}
                                      className="flex-1 py-2 rounded-xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600 disabled:opacity-50 transition-colors"
                                    >
                                      {actionLoading ? 'Submitting...' : 'Submit Feedback'}
                                    </button>
                                    <button
                                      onClick={() => { setReviewingSubmission(null); setRemarks(''); }}
                                      className={`px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${isDark ? 'border-white/10 text-slate-400 hover:bg-white/5' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* PO Status */}
          {journey.poStatus && (
            <div className={`p-4 rounded-xl ${isDark ? 'bg-violet-500/10 border border-violet-500/20' : 'bg-violet-50 border border-violet-200'}`}>
              <div className="flex items-center gap-2">
                <CheckSolid className={`w-5 h-5 ${isDark ? 'text-violet-400' : 'text-violet-600'}`} />
                <span className={`font-bold text-sm ${isDark ? 'text-violet-300' : 'text-violet-800'}`}>
                  Purchase Order: {journey.poStatus}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Phase1LeadSection;
