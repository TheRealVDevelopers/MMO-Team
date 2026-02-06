import React from 'react';
import { Lead } from '../../types';
import { CheckCircleIcon } from '../icons/IconComponents';
import { formatDateTime, safeDate } from '../../constants';

import { DocumentTextIcon, CameraIcon } from '../icons/IconComponents';
import { LeadHistoryAttachment } from '../../types';

const AttachmentItem: React.FC<{ attachment: LeadHistoryAttachment }> = ({ attachment }) => {
  const isImage = attachment.fileType === 'image';

  return (
    <a
      href={attachment.fileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center p-2 rounded-md border border-border/50 bg-surface/50 hover:bg-surface transition-colors group"
    >
      <div className="flex-shrink-0 h-8 w-8 rounded bg-subtle-background flex items-center justify-center text-text-tertiary group-hover:text-primary transition-colors">
        {isImage ? <CameraIcon className="w-5 h-5" /> : <DocumentTextIcon className="w-5 h-5" />}
      </div>
      <div className="ml-3 min-w-0 flex-1">
        <p className="text-xs font-medium text-text-primary truncate">{attachment.fileName}</p>
        <p className="text-[10px] text-text-tertiary">
          {safeDate(attachment.uploadedAt)}
        </p>
      </div>
    </a>
  );
};

const LeadHistoryView: React.FC<{ lead: Lead }> = ({ lead }) => {
  const getTimestamp = (ts: any) => {
    if (!ts) return 0;
    if (ts instanceof Date) return ts.getTime();
    if (typeof ts === 'number') return ts;
    if (ts.toDate) return ts.toDate().getTime();
    if (ts.seconds) return ts.seconds * 1000;
    return 0;
  };

  const history = lead.history || [];
  const sortedHistory = [...history].sort((a, b) => getTimestamp(b.timestamp) - getTimestamp(a.timestamp));

  return (
    <div className="flow-root">
      <ul role="list" className="-mb-8">
        {sortedHistory.map((item, itemIdx) => (
          <li key={getTimestamp(item.timestamp) + item.action + itemIdx}>
            <div className="relative pb-8">
              {itemIdx !== sortedHistory.length - 1 ? (
                <span className="absolute left-[15px] top-6 -ml-px h-full w-[1.5px] bg-border/60" aria-hidden="true" />
              ) : null}
              <div className="relative flex items-start space-x-4">
                <div>
                  <span className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center ring-4 ring-surface">
                    <CheckCircleIcon className="h-5 w-5 text-primary" aria-hidden="true" />
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 justify-between items-start pt-1.5">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text-primary">
                      {item.action} <span className="text-text-secondary font-normal">by</span> <span className="font-semibold text-text-primary">{item.user}</span>
                    </p>
                    {item.notes && (
                      <p className="mt-1.5 text-sm text-text-secondary italic bg-subtle-background/50 p-2 rounded-lg border-l-2 border-primary/20">
                        "{item.notes}"
                      </p>
                    )}
                    {item.attachments && item.attachments.length > 0 && (
                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {item.attachments.map((att) => (
                          <AttachmentItem key={att.id} attachment={att} />
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="whitespace-nowrap text-right text-[11px] font-semibold text-text-tertiary bg-subtle-background px-2 py-1 rounded-md ml-4">
                    {formatDateTime(item.timestamp)}
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default LeadHistoryView;
