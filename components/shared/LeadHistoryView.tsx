import React from 'react';
import { Lead } from '../../types';
import { CheckCircleIcon } from '../icons/IconComponents';
import { formatDateTime } from '../../constants';

const LeadHistoryView: React.FC<{ lead: Lead }> = ({ lead }) => {
  const sortedHistory = [...lead.history].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  return (
    <div className="flow-root">
      <ul role="list" className="-mb-8">
        {sortedHistory.map((item, itemIdx) => (
          <li key={item.timestamp.getTime() + item.action + itemIdx}>
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