/**
 * Phase 1 – Lead Journey: gamified vertical step wizard.
 * Each step: large icon, title, date, status (Completed / In progress / Pending), expand arrow.
 * Connecting vertical animated line. Slide-over for document review (Drawing/BOQ/Quotation).
 */

import React, { useState } from 'react';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckSolid } from '@heroicons/react/24/solid';
import type { LeadJourneyStep } from '../types';
import type { ClientDocument } from '../types';
import { formatDate } from '../../../constants';

const STEP_KEYS_WITH_DOCS = ['drawing_upload', 'drawing_approve', 'boq_upload', 'boq_approve', 'quot_upload', 'quot_approve'];

const STEP_ICONS: Record<string, typeof DocumentTextIcon> = {
  drawing_upload: DocumentTextIcon,
  drawing_approve: CheckSolid,
  boq_upload: DocumentTextIcon,
  boq_approve: CheckSolid,
  quot_upload: DocumentTextIcon,
  quot_approve: CheckSolid,
};

interface Phase1LeadSectionProps {
  steps: LeadJourneyStep[];
  documents: ClientDocument[];
  isDark?: boolean;
  defaultExpanded?: boolean;
}

const Phase1LeadSection: React.FC<Phase1LeadSectionProps> = ({
  steps,
  documents,
  isDark,
  defaultExpanded = true,
}) => {
  const [collapsed, setCollapsed] = useState(!defaultExpanded);
  const [expandedStepKey, setExpandedStepKey] = useState<string | null>(null);
  const [slideOverDoc, setSlideOverDoc] = useState<ClientDocument | null>(null);

  const getDocsForStep = (key: string) => {
    if (key.includes('drawing')) return documents.filter((d) => d.category === 'Drawing' || d.documentType === '2d' || d.documentType === '3d' || d.documentType === 'recce');
    if (key.includes('boq')) return documents.filter((d) => d.documentType === 'boq' || d.category === 'Contract');
    if (key.includes('quot')) return documents.filter((d) => d.documentType === 'quotation' || (d.category === 'Contract' && d.documentType !== 'boq'));
    return [];
  };

  const textPrimary = isDark ? 'text-white' : 'text-[#111111]';
  const textMuted = isDark ? 'text-slate-400' : 'text-[#111111]';

  return (
    <>
      <div className={`rounded-2xl border overflow-hidden shadow-sm transition-all duration-300 ${isDark ? 'bg-white/[0.06] border-amber-500/20' : 'bg-white border-slate-200/80'}`}>
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className={`w-full flex items-center justify-between px-5 py-4 text-left transition-colors ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}
        >
          <span className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-amber-400' : 'text-[#111111]'}`}>
            Phase 1 — Lead Journey
          </span>
          {collapsed ? <ChevronRightIcon className={`w-5 h-5 ${textMuted}`} /> : <ChevronDownIcon className={`w-5 h-5 ${textMuted}`} />}
        </button>
        {!collapsed && (
          <div className="px-5 pb-5">
            <div className="relative pl-8 border-l-2 border-slate-200 dark:border-amber-500/30 space-y-0">
              {steps.map((step, index) => {
                const isDone = step.status === 'completed';
                const isCurrent = step.status === 'in-progress';
                const hasDetail = STEP_KEYS_WITH_DOCS.includes(step.key);
                const stepDocs = hasDetail ? getDocsForStep(step.key) : [];
                const isDrawerOpen = expandedStepKey === step.key;
                const StepIcon = STEP_ICONS[step.key] ?? DocumentTextIcon;

                return (
                  <div key={step.key} className="relative pb-6 last:pb-0">
                    {/* Connecting line */}
                    {index < steps.length - 1 && (
                      <div className="absolute left-[-9px] top-8 bottom-0 w-0.5 bg-gradient-to-b from-slate-200 to-slate-100 dark:from-amber-500/30 dark:to-transparent" />
                    )}
                    {/* Step circle + icon */}
                    <span
                      className={`absolute -left-8 w-10 h-10 rounded-full border-2 flex items-center justify-center ${
                        isDone
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : isCurrent
                            ? 'bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-500/30'
                            : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-500'
                      }`}
                    >
                      {isDone ? <CheckSolid className="w-5 h-5" /> : <StepIcon className={`w-5 h-5 ${isDone ? 'text-white' : isCurrent ? 'text-white' : textMuted}`} />}
                    </span>
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => hasDetail && setExpandedStepKey(isDrawerOpen ? null : step.key)}
                        className={`flex flex-wrap items-center gap-2 text-left w-full rounded-lg px-3 py-2 transition-all ${hasDetail ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5' : ''}`}
                      >
                        <span className={`font-semibold ${textPrimary}`}>{step.label}</span>
                        {step.date && <span className={`text-xs ${textMuted}`}>{formatDate(step.date)}</span>}
                        {isDone && <CheckCircleIcon className="w-4 h-4 text-emerald-500" />}
                        {isCurrent && <ClockIcon className="w-4 h-4 text-blue-500" />}
                        {hasDetail && stepDocs.length > 0 && (
                          <span className={`text-xs ${textMuted}`}>({stepDocs.length} doc{stepDocs.length !== 1 ? 's' : ''})</span>
                        )}
                        {hasDetail && (
                          <span className="ml-auto">
                            {isDrawerOpen ? <ChevronDownIcon className={`w-4 h-4 ${textMuted}`} /> : <ChevronRightIcon className={`w-4 h-4 ${textMuted}`} />}
                          </span>
                        )}
                      </button>
                      {(step.description || step.revisionInfo) && (
                        <p className={`text-xs pl-3 ${textMuted} opacity-90`}>{step.description || step.revisionInfo}</p>
                      )}
                      {isDrawerOpen && stepDocs.length > 0 && (
                        <div className="mt-3 pl-4 space-y-2 border-l-2 border-slate-100 dark:border-amber-500/20">
                          <p className={`text-xs font-bold uppercase tracking-wider ${textMuted}`}>Revision history</p>
                          {stepDocs.map((doc, idx) => (
                            <div
                              key={doc.id}
                              className={`flex items-center gap-3 p-3 rounded-xl transition-all hover:shadow-md ${isDark ? 'bg-white/5' : 'bg-slate-50'} border ${isDark ? 'border-amber-500/20' : 'border-slate-100'}`}
                            >
                              <DocumentTextIcon className={`w-5 h-5 flex-shrink-0 ${textMuted}`} />
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium truncate ${textPrimary}`}>Rev {stepDocs.length - idx} — {doc.name}</p>
                                <p className={`text-xs ${textMuted}`}>{formatDate(doc.date)} · {doc.approvalStatus ?? 'pending'}</p>
                              </div>
                              {doc.approvalStatus === 'approved' && <CheckCircleIcon className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
                              {doc.approvalStatus === 'rejected' && <XCircleIcon className="w-4 h-4 text-red-500 flex-shrink-0" />}
                              {doc.url && (
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <button type="button" onClick={() => setSlideOverDoc(doc)} className="text-sm font-semibold text-primary hover:underline">
                                    View
                                  </button>
                                  <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-primary hover:underline">
                                    Download
                                  </a>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Document review slide-over */}
      {slideOverDoc && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSlideOverDoc(null)} />
          <div className={`relative w-full max-w-md shadow-2xl overflow-y-auto ${isDark ? 'bg-[#111] border-l border-amber-500/20' : 'bg-white border-l border-slate-200'}`}>
            <div className="sticky top-0 flex items-center justify-between p-4 border-b border-slate-200 dark:border-amber-500/20 bg-inherit">
              <h3 className={`text-lg font-bold ${textPrimary}`}>Document Review</h3>
              <button type="button" onClick={() => setSlideOverDoc(null)} className={`p-2 rounded-lg ${isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'}`} aria-label="Close">
                ×
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <p className={`text-sm font-semibold ${textPrimary}`}>{slideOverDoc.name}</p>
                <p className={`text-xs ${textMuted} mt-1`}>{formatDate(slideOverDoc.date)}</p>
                {slideOverDoc.uploadedBy && <p className={`text-xs ${textMuted}`}>Uploaded by {slideOverDoc.uploadedBy}</p>}
              </div>
              {slideOverDoc.url && (
                <div className="rounded-xl border border-slate-200 dark:border-amber-500/20 overflow-hidden bg-slate-50 dark:bg-white/5">
                  <iframe title="Preview" src={slideOverDoc.url} className="w-full h-64" />
                </div>
              )}
              <div className="flex gap-2">
                <button type="button" className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors">
                  Approve
                </button>
                <button type="button" className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-amber-500/30 font-semibold hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                  Request changes
                </button>
              </div>
              <textarea
                placeholder="Add review comment (optional)..."
                className={`w-full rounded-xl border px-3 py-2 text-sm min-h-[80px] ${isDark ? 'bg-white/5 border-amber-500/20 text-white placeholder-slate-500' : 'bg-white border-slate-200 text-[#111111] placeholder-slate-400'}`}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Phase1LeadSection;
