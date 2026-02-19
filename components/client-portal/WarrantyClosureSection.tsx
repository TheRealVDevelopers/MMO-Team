/**
 * After JMS signed: Project Completed badge, Warranty Certificates, warranty period countdown, downloads.
 */

import React from 'react';
import { CheckBadgeIcon, ShieldCheckIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import type { ClientDocument } from './types';
import { formatDate } from '../../constants';

interface WarrantyClosureSectionProps {
  isCompleted: boolean;
  completedAt?: Date;
  warrantyDocuments: ClientDocument[];
  warrantyEndDate?: Date;
  isDark?: boolean;
}

const WarrantyClosureSection: React.FC<WarrantyClosureSectionProps> = ({
  isCompleted,
  completedAt,
  warrantyDocuments,
  warrantyEndDate,
  isDark,
}) => {
  if (!isCompleted) return null;

  const daysLeft = warrantyEndDate
    ? Math.max(0, Math.ceil((new Date(warrantyEndDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
    : null;

  return (
    <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'} shadow-lg`}>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center text-white">
            <CheckBadgeIcon className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-emerald-900 dark:text-emerald-100">Project Completed</h3>
            {completedAt && <p className="text-sm text-emerald-700 dark:text-emerald-300">Signed off on {formatDate(completedAt)}</p>}
          </div>
        </div>

        {warrantyEndDate && daysLeft != null && (
          <div className={`flex items-center gap-3 p-4 rounded-xl mb-4 ${isDark ? 'bg-white/5' : 'bg-white/80'}`}>
            <ShieldCheckIcon className="w-6 h-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-emerald-800 dark:text-emerald-200">Warranty period</p>
              <p className="text-sm text-emerald-700 dark:text-emerald-300">
                {daysLeft > 0 ? `${daysLeft} days remaining` : 'Warranty period ended'} · Until {formatDate(warrantyEndDate)}
              </p>
            </div>
          </div>
        )}

        {warrantyDocuments.length > 0 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 mb-2">Warranty certificates</p>
            <div className="space-y-2">
              {warrantyDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className={`flex items-center justify-between p-3 rounded-xl ${isDark ? 'bg-white/5' : 'bg-white'}`}
                >
                  <span className="text-sm font-medium text-slate-900 dark:text-white truncate">{doc.name}</span>
                  {doc.url && (
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      <DocumentArrowDownIcon className="w-4 h-4" /> Download
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WarrantyClosureSection;
