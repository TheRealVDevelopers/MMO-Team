/**
 * Document Intelligence Panel: Drawings, BOQ, Quotations, Execution, Warranty, JMS.
 * Version, upload date, approved by, revision history, download. Uses existing document collections.
 */

import React, { useMemo } from 'react';
import { DocumentTextIcon, CheckCircleIcon, ClockIcon, XCircleIcon } from '@heroicons/react/24/outline';
import type { ClientDocument } from './types';
import { formatDate } from '../../constants';

const SECTIONS: { key: string; label: string; filter: (d: ClientDocument) => boolean }[] = [
  { key: 'drawings', label: 'Drawings', filter: (d) => d.category === 'Drawing' || ['2d', '3d', 'recce'].includes(d.documentType ?? '') },
  { key: 'boq', label: 'BOQ', filter: (d) => d.documentType === 'boq' || (d.category === 'Contract' && d.name?.toLowerCase().includes('boq')) },
  { key: 'quotations', label: 'Quotations', filter: (d) => d.documentType === 'quotation' || (d.category === 'Contract' && !d.name?.toLowerCase().includes('boq')) },
  { key: 'execution', label: 'Execution Documents', filter: (d) => d.category === 'Report' || d.documentType === 'execution' || d.documentType === 'plan' },
  { key: 'warranty', label: 'Warranty Certificates', filter: (d) => d.documentType === 'warranty' || (d.category === 'Other' && d.name?.toLowerCase().includes('warranty')) },
  { key: 'jms', label: 'JMS', filter: (d) => d.documentType === 'jms' || d.name?.toLowerCase().includes('jms') },
];

interface DocumentIntelligencePanelProps {
  documents: ClientDocument[];
  isDark?: boolean;
}

const DocumentIntelligencePanel: React.FC<DocumentIntelligencePanelProps> = ({ documents, isDark }) => {
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

  const hasAny = Object.keys(bySection).length > 0;
  if (!hasAny) {
    return (
      <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
        No documents shared yet. They will appear here when uploaded by the team.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {SECTIONS.map((section) => {
        const list = bySection[section.key];
        if (!list || list.length === 0) return null;
        return (
          <div key={section.key}>
            <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 ${isDark ? 'text-amber-400/90' : 'text-slate-600'}`}>
              {section.label}
            </h4>
            <div className="space-y-2">
              {list.map((doc, idx) => (
                <div
                  key={doc.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all hover:shadow-md ${
                    isDark ? 'bg-white/5 border-amber-500/20' : 'bg-slate-50/80 border-slate-100'
                  }`}
                >
                  <DocumentTextIcon className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Version {list.length - idx} — {doc.name}
                    </p>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {formatDate(doc.date)}
                      {doc.uploadedBy && ' · Uploaded by team'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {doc.approvalStatus === 'approved' && <CheckCircleIcon className="w-4 h-4 text-emerald-500" title="Approved" />}
                    {doc.approvalStatus === 'rejected' && <XCircleIcon className="w-4 h-4 text-red-500" title="Rejected" />}
                    {doc.approvalStatus === 'pending' && <ClockIcon className="w-4 h-4 text-amber-500" title="Pending" />}
                  </div>
                  {doc.url && (
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-primary hover:underline flex-shrink-0"
                    >
                      Download
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DocumentIntelligencePanel;
