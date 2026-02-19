/**
 * Phase 1 – Lead Journey: collapsible section with expandable step drawers.
 * Drawing/BOQ/Quotation steps show revision history and file attachments.
 */

import React, { useState } from 'react';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import type { LeadJourneyStep } from '../types';
import type { ClientDocument } from '../types';
import { formatDate } from '../../../constants';

interface Phase1LeadSectionProps {
  steps: LeadJourneyStep[];
  documents: ClientDocument[];
  isDark?: boolean;
  defaultExpanded?: boolean;
}

const STEP_KEYS_WITH_DOCS = ['drawing_upload', 'drawing_approve', 'boq_upload', 'boq_approve', 'quot_upload', 'quot_approve'];

const Phase1LeadSection: React.FC<Phase1LeadSectionProps> = ({
  steps,
  documents,
  isDark,
  defaultExpanded = true,
}) => {
  const [collapsed, setCollapsed] = useState(!defaultExpanded);
  const [expandedStepKey, setExpandedStepKey] = useState<string | null>(null);

  const getDocsForStep = (key: string) => {
    if (key.includes('drawing')) return documents.filter((d) => d.category === 'Drawing' || d.documentType === '2d' || d.documentType === '3d' || d.documentType === 'recce');
    if (key.includes('boq')) return documents.filter((d) => d.documentType === 'boq' || d.category === 'Contract');
    if (key.includes('quot')) return documents.filter((d) => d.documentType === 'quotation' || (d.category === 'Contract' && d.documentType !== 'boq'));
    return [];
  };

  return (
    <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-white/5 border-amber-500/20' : 'bg-white border-slate-200'} shadow-lg`}>
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className={`w-full flex items-center justify-between px-5 py-4 text-left ${
          isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'
        } transition-colors`}
      >
        <span className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-amber-400' : 'text-slate-600'}`}>
          Phase 1 — Lead Journey
        </span>
        {collapsed ? <ChevronRightIcon className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} /> : <ChevronDownIcon className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />}
      </button>
      {!collapsed && (
        <div className="px-5 pb-5">
          <div className="relative pl-6 border-l-2 border-slate-200 dark:border-amber-500/30 space-y-0">
            {steps.map((step) => {
              const isDone = step.status === 'completed';
              const isCurrent = step.status === 'in-progress';
              const hasDetail = STEP_KEYS_WITH_DOCS.includes(step.key);
              const stepDocs = hasDetail ? getDocsForStep(step.key) : [];
              const isDrawerOpen = expandedStepKey === step.key;

              return (
                <div key={step.key} className="relative pb-5 last:pb-0">
                  <span
                    className={`absolute -left-6 w-4 h-4 rounded-full border-2 ${
                      isDone ? 'bg-emerald-500 border-emerald-500' : isCurrent ? 'bg-blue-500 border-blue-500' : 'bg-slate-200 dark:bg-slate-600 border-slate-300'
                    }`}
                  />
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => hasDetail && setExpandedStepKey(isDrawerOpen ? null : step.key)}
                      className={`flex flex-wrap items-center gap-2 text-left ${hasDetail ? 'cursor-pointer' : ''}`}
                    >
                      <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{step.label}</span>
                      {step.date && <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{formatDate(step.date)}</span>}
                      {isDone && <CheckCircleIcon className="w-4 h-4 text-emerald-500" />}
                      {isCurrent && <ClockIcon className="w-4 h-4 text-blue-500" />}
                      {hasDetail && stepDocs.length > 0 && (
                        <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>({stepDocs.length} doc{stepDocs.length !== 1 ? 's' : ''})</span>
                      )}
                    </button>
                    {(step.description || step.revisionInfo) && (
                      <p className={`text-xs pl-0 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{step.description || step.revisionInfo}</p>
                    )}
                    {isDrawerOpen && stepDocs.length > 0 && (
                      <div className="mt-3 pl-4 space-y-2 border-l-2 border-slate-100 dark:border-amber-500/20">
                        <p className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Revision history</p>
                        {stepDocs.map((doc, idx) => (
                          <div
                            key={doc.id}
                            className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}
                          >
                            <DocumentTextIcon className="w-5 h-5 text-slate-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-900 dark:text-white truncate">Rev {stepDocs.length - idx} — {doc.name}</p>
                              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{formatDate(doc.date)} · {doc.approvalStatus ?? 'pending'}</p>
                            </div>
                            {doc.url && (
                              <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline flex-shrink-0">
                                Download
                              </a>
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
  );
};

export default Phase1LeadSection;
