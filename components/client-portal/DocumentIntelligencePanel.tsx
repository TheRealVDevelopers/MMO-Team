/**
 * Document Intelligence Panel: category tabs, file icons, version badge, Approved stamp, expandable revision history.
 */

import React, { useMemo, useState } from 'react';
import {
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  PhotoIcon,
  ClipboardDocumentListIcon,
  DocumentChartBarIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import type { ClientDocument } from './types';
import { formatDate } from '../../constants';

const SECTIONS: { key: string; label: string; icon: typeof DocumentTextIcon; filter: (d: ClientDocument) => boolean }[] = [
  { key: 'drawings', label: 'Drawings', icon: PhotoIcon, filter: (d) => d.category === 'Drawing' || ['2d', '3d', 'recce'].includes(d.documentType ?? '') },
  { key: 'boq', label: 'BOQ', icon: ClipboardDocumentListIcon, filter: (d) => d.documentType === 'boq' || (d.category === 'Contract' && d.name?.toLowerCase().includes('boq')) },
  { key: 'quotations', label: 'Quotations', icon: DocumentTextIcon, filter: (d) => d.documentType === 'quotation' || (d.category === 'Contract' && !d.name?.toLowerCase().includes('boq')) },
  { key: 'execution', label: 'Execution', icon: DocumentChartBarIcon, filter: (d) => d.category === 'Report' || d.documentType === 'execution' || d.documentType === 'plan' },
  { key: 'warranty', label: 'Warranty', icon: ShieldCheckIcon, filter: (d) => d.documentType === 'warranty' || (d.category === 'Other' && d.name?.toLowerCase().includes('warranty')) },
  { key: 'jms', label: 'JMS', icon: DocumentTextIcon, filter: (d) => d.documentType === 'jms' || d.name?.toLowerCase().includes('jms') },
];

interface DocumentIntelligencePanelProps {
  documents: ClientDocument[];
  isDark?: boolean;
}

const DocumentIntelligencePanel: React.FC<DocumentIntelligencePanelProps> = ({ documents, isDark }) => {
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const bySection = useMemo(() => {
    const map: Record<string, ClientDocument[]> = {};
    SECTIONS.forEach((s) => {
      const list = documents.filter(s.filter);
      if (list.length > 0) {
        map[s.key] = list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }
    });
    return map;
  }, [documents]);

  const sectionKeys = Object.keys(bySection);
  const firstTab = activeTab ?? sectionKeys[0] ?? null;
  const currentList = firstTab ? bySection[firstTab] : [];
  const currentSection = SECTIONS.find((s) => s.key === firstTab);
  const SectionIcon = currentSection?.icon ?? DocumentTextIcon;
  const isExpanded = firstTab ? isSectionExpanded(firstTab) : true;

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: prev[key] === false }));
  };
  // Default expanded: undefined or true = expanded
  const isSectionExpanded = (key: string) => expandedSections[key] !== false;

  const textPrimary = isDark ? 'text-white' : 'text-[#111111]';
  const textMuted = isDark ? 'text-slate-400' : 'text-[#111111]';

  if (sectionKeys.length === 0) {
    return (
      <p className={`text-sm ${textMuted}`}>
        No documents shared yet. They will appear here when uploaded by the team.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {/* Category tabs */}
      <div className={`flex flex-wrap gap-1 p-1 rounded-xl ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
        {sectionKeys.map((key) => {
          const sec = SECTIONS.find((s) => s.key === key);
          const Icon = sec?.icon ?? DocumentTextIcon;
          const isActive = firstTab === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                isActive ? (isDark ? 'bg-amber-500/20 text-amber-300' : 'bg-white text-[#111111] shadow-sm') : textMuted
              }`}
            >
              <Icon className="w-4 h-4" />
              {sec?.label ?? key}
            </button>
          );
        })}
      </div>

      {/* Current section content */}
      {firstTab && currentList.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => toggleSection(firstTab)}
            className={`w-full flex items-center justify-between py-2 ${textMuted}`}
          >
            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
              <SectionIcon className="w-4 h-4" />
              Revision history ({currentList.length})
            </span>
            {isExpanded ? <ChevronDownIcon className="w-4 h-4" /> : <ChevronRightIcon className="w-4 h-4" />}
          </button>
          {isExpanded && (
            <div className="space-y-2">
              {currentList.map((doc, idx) => {
                const versionNum = currentList.length - idx;
                return (
                  <div
                    key={doc.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all hover:shadow-md ${
                      isDark ? 'bg-white/5 border-amber-500/20' : 'bg-slate-50/80 border-slate-100'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-amber-500/20' : 'bg-slate-200'}`}>
                      <SectionIcon className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-[#111111]'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isDark ? 'bg-white/10 text-amber-300' : 'bg-slate-200 text-[#111111]'}`}>
                          V{versionNum}
                        </span>
                        {doc.approvalStatus === 'approved' && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                            Approved
                          </span>
                        )}
                        {doc.approvalStatus === 'rejected' && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400">
                            Rejected
                          </span>
                        )}
                      </div>
                      <p className={`text-sm font-medium truncate mt-0.5 ${textPrimary}`}>{doc.name}</p>
                      <p className={`text-xs mt-0.5 ${textMuted}`}>
                        {formatDate(doc.date)}
                        {doc.uploadedBy && ' · ' + doc.uploadedBy}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {doc.approvalStatus === 'approved' && <CheckCircleIcon className="w-5 h-5 text-emerald-500" title="Approved" />}
                      {doc.approvalStatus === 'rejected' && <XCircleIcon className="w-5 h-5 text-red-500" title="Rejected" />}
                      {doc.approvalStatus === 'pending' && <ClockIcon className="w-5 h-5 text-amber-500" title="Pending" />}
                      {doc.url && (
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-semibold text-primary hover:underline"
                        >
                          Download
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DocumentIntelligencePanel;
