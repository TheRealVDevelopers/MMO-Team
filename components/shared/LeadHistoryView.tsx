import React from 'react';
import { Lead } from '../../types';
import { DocumentCheckIcon } from '../icons/IconComponents';
import { formatDateTime } from '../../constants';

const LeadHistoryView: React.FC<{ lead: Lead }> = ({ lead }) => (
    <div className="flow-root">
      <ul role="list" className="-mb-8">
        {[...lead.history].reverse().map((item, itemIdx) => (
          <li key={item.timestamp.toISOString() + item.action}>
            <div className="relative pb-8">
              {itemIdx !== lead.history.length - 1 ? (
                <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-border" aria-hidden="true" />
              ) : null}
              <div className="relative flex space-x-3">
                <div>
                  <span className="h-8 w-8 rounded-full bg-primary-subtle-background flex items-center justify-center ring-8 ring-surface">
                    <DocumentCheckIcon className="h-5 w-5 text-primary" aria-hidden="true" />
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                  <div>
                    <p className="text-sm text-text-primary">
                      {item.action} by <span className="font-medium">{item.user}</span>
                    </p>
                    {item.notes && <p className="mt-1 text-sm text-text-secondary italic">"{item.notes}"</p>}
                  </div>
                  <div className="whitespace-nowrap text-right text-sm text-text-secondary">
                    <time dateTime={item.timestamp.toISOString()}>{formatDateTime(item.timestamp)}</time>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
);

export default LeadHistoryView;