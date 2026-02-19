/**
 * Action Required panel: Drawing / BOQ / Quotation / Payment requests awaiting approval.
 * Each as a card with icon, submitted date, by, View, Approve/Reject.
 * Empty state: green success card "Everything is up to date."
 */

import React, { useState } from 'react';
import { CheckCircleIcon, XCircleIcon, ExclamationCircleIcon, DocumentTextIcon, ClipboardDocumentIcon, BanknotesIcon } from '@heroicons/react/24/outline';
import { ClientRequest } from './types';
import { formatDate } from '../../constants';

interface PendingApprovalsWidgetProps {
  requests: ClientRequest[];
  onApprove: (requestId: string) => void;
  onReject: (requestId: string, reason: string) => void;
  isDark?: boolean;
}

const typeConfig: Record<string, { icon: typeof DocumentTextIcon; label: string }> = {
  approval: { icon: CheckCircleIcon, label: 'Approval' },
  change_request: { icon: ExclamationCircleIcon, label: 'Change request' },
  question: { icon: DocumentTextIcon, label: 'Question' },
  concern: { icon: ExclamationCircleIcon, label: 'Concern' },
};

function getCategoryLabel(req: ClientRequest): string {
  const t = (req.title || '').toLowerCase();
  if (t.includes('drawing')) return 'Drawing';
  if (t.includes('boq')) return 'BOQ';
  if (t.includes('quotation') || t.includes('quote')) return 'Quotation';
  if (t.includes('payment')) return 'Payment';
  return typeConfig[req.type]?.label ?? req.type;
}

function getCategoryIcon(req: ClientRequest) {
  const label = getCategoryLabel(req);
  if (label === 'Drawing') return DocumentTextIcon;
  if (label === 'BOQ') return ClipboardDocumentIcon;
  if (label === 'Quotation') return DocumentTextIcon;
  if (label === 'Payment') return BanknotesIcon;
  return typeConfig[req.type]?.icon ?? DocumentTextIcon;
}

const PendingApprovalsWidget: React.FC<PendingApprovalsWidgetProps> = ({ requests, onApprove, onReject, isDark }) => {
  const pendingRequests = requests.filter((r) => r.status === 'open');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const handleRejectClick = (id: string) => {
    setRejectingId(id);
    setRejectReason('');
  };

  const submitReject = (id: string) => {
    if (!rejectReason.trim()) return;
    onReject(id, rejectReason);
    setRejectingId(null);
  };

  const textPrimary = isDark ? 'text-white' : 'text-[#111111]';
  const textMuted = isDark ? 'text-slate-400' : 'text-[#111111]';

  if (pendingRequests.length === 0) {
    return (
      <div className={`rounded-xl border p-5 text-center ${isDark ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'}`}>
        <CheckCircleIcon className={`w-12 h-12 mx-auto mb-2 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
        <p className={`font-semibold ${textPrimary}`}>Everything is up to date.</p>
        <p className={`text-sm ${textMuted} mt-0.5`}>No pending approvals. You're all set.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className={`flex items-center gap-3 mb-3 ${isDark ? 'text-amber-400/90' : 'text-[#111111]'}`}>
        <ExclamationCircleIcon className="w-5 h-5" />
        <span className="text-xs font-bold uppercase tracking-wider">{pendingRequests.length} action{pendingRequests.length !== 1 ? 's' : ''} required</span>
      </div>
      {pendingRequests.map((req) => {
        const Icon = getCategoryIcon(req);
        const categoryLabel = getCategoryLabel(req);
        return (
          <div
            key={req.id}
            className={`rounded-xl border p-4 transition-all hover:shadow-md ${
              isDark ? 'bg-white/5 border-amber-500/20' : 'bg-amber-50/50 border-amber-200'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-amber-500/20' : 'bg-amber-100'}`}>
                <Icon className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${textMuted}`}>{categoryLabel}</span>
                <h4 className={`font-bold text-sm mt-0.5 ${textPrimary}`}>{req.title}</h4>
                <p className={`text-xs ${textMuted} mt-0.5`}>{formatDate(req.createdAt)}</p>
                {req.owner && <p className={`text-xs ${textMuted}`}>Submitted by {req.owner}</p>}
              </div>
            </div>
            <p className={`text-sm ${textMuted} mt-2 line-clamp-2`}>{req.description}</p>
            {rejectingId === req.id ? (
              <div className={`mt-3 p-3 rounded-lg border ${isDark ? 'bg-white/5 border-amber-500/20' : 'bg-white border-slate-200'}`}>
                <label className={`block text-xs font-bold uppercase tracking-wider ${textMuted} mb-1`}>Reason for rejection / changes</label>
                <textarea
                  className={`w-full text-sm rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-amber-500 ${isDark ? 'bg-white/5 border-amber-500/20 text-white' : 'border-slate-200 text-[#111111]'}`}
                  rows={2}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Describe what changes are needed..."
                />
                <div className="flex gap-2 justify-end mt-2">
                  <button type="button" onClick={() => setRejectingId(null)} className={`text-xs font-bold px-3 py-1.5 rounded-lg ${isDark ? 'text-slate-400 hover:bg-white/10' : 'text-[#111111] hover:bg-slate-100'}`}>
                    Cancel
                  </button>
                  <button type="button" onClick={() => submitReject(req.id)} className="text-xs font-bold text-white bg-red-500 px-3 py-1.5 rounded-lg hover:bg-red-600">
                    Submit
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => onApprove(req.id)}
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-600 transition-all"
                >
                  <CheckCircleIcon className="w-5 h-5" />
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => handleRejectClick(req.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                    isDark ? 'border-amber-500/30 text-amber-200 hover:bg-amber-500/10' : 'border-slate-200 text-[#111111] hover:bg-slate-50 hover:border-red-200 hover:text-red-600'
                  }`}
                >
                  <XCircleIcon className="w-5 h-5" />
                  Request changes
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default PendingApprovalsWidget;
