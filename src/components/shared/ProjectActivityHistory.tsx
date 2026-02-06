import React from 'react';
import { Activity } from '../../types';
import { DocumentCheckIcon } from '../icons/IconComponents';
import { formatDateTime } from '../../constants';
import { useUsers } from '../../hooks/useUsers';

const ProjectActivityHistory: React.FC<{ activities: Activity[] }> = ({ activities }) => {
  const { users } = useUsers();
  return (
    <div className="flow-root max-h-64 overflow-y-auto pr-2">
      <ul role="list" className="-mb-8">
        {[...activities].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).map((item, itemIdx) => {
          const user = users.find(u => u.id === item.userId);
          return (
            <li key={item.id}>
              <div className="relative pb-8">
                {itemIdx !== activities.length - 1 ? (
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
                        {item.description}
                      </p>
                      <p className="text-xs text-text-secondary">by <span className="font-medium">{user?.name || 'System'}</span></p>
                    </div>
                    <div className="whitespace-nowrap text-right text-sm text-text-secondary">
                      <time dateTime={item.timestamp.toISOString()}>{formatDateTime(item.timestamp)}</time>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  );
};

export default ProjectActivityHistory;