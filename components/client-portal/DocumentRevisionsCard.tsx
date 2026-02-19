/**
 * Revision system: Drawing / BOQ / Quotation versions with date, uploader, approval status.
 * Client can approve/reject via Pending Approvals; this card shows version history.
 */

import React, { useMemo } from 'react';
import { DocumentTextIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import type { ClientDocument } from './types';
import { formatDate } from '../../constants';

interface DocumentRevisionsCardProps {
  documents: ClientDocument[];
  isDark?: boolean;
  onViewDocument?: (doc: ClientDocument) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  Drawing: 'Drawings',
  Contract: 'BOQ / Quotation',
  Other: 'Other',
  Invoice: 'Invoices',
  Report: 'Reports',
};

const DocumentRevisionsCard: React.FC<DocumentRevisionsCardProps> = ({ documents, isDark, onViewDocument }) => {
  const byCategory = useMemo(() => {
    const map: Record<string, ClientDocument[]> = {};
    documents.forEach((d) => {
      const cat = d.category in CATEGORY_LABELS ? d.category : 'Other';
      if (!map[cat]) map[cat] = [];
      map[cat].push(d);
    });
    Object.keys(map).forEach((k) => {
      map[k].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });
    return map;
  }, [documents]);

  const categories = Object.keys(byCategory).filter((k) => ['Drawing', 'Contract'].includes(k) || byCategory[k].length > 0);
  if (categories.length === 0) {
    return (
      <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
        No drawings or BOQ/Quotation documents yet.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {categories.map((cat) => (
        <div key={cat}>
          <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-amber-400/80' : 'text-slate-500'}`}>
            {CATEGORY_LABELS[cat] || cat}
          </h4>
          <div className="space-y-2">
            {byCategory[cat].map((doc, idx) => (
              <div
                key={doc.id}
                className={`flex items-center gap-3 p-3 rounded-xl border ${
                  isDark ? 'bg-white/5 border-amber-500/20' : 'bg-slate-50 border-slate-100'
                }`}
              >
                <DocumentTextIcon className="w-5 h-5 text-slate-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Version {byCategory[cat].length - idx} — {doc.name}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {formatDate(doc.date)}
                    {doc.uploadedBy && ` · Uploaded by team`}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {doc.approvalStatus === 'approved' && (
                    <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      <CheckCircleIcon className="w-4 h-4" /> Approved
                    </span>
                  )}
                  {doc.approvalStatus === 'rejected' && (
                    <span className="flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400">
                      <XCircleIcon className="w-4 h-4" /> Rejected
                    </span>
                  )}
                  {doc.approvalStatus === 'pending' && (
                    <span className="flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                      <ClockIcon className="w-4 h-4" /> Pending
                    </span>
                  )}
                </div>
                {doc.url && (
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-primary hover:text-secondary"
                  >
                    View
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default DocumentRevisionsCard;
