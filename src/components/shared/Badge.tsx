import React from 'react';
import { LeadPipelineStatus } from '../../types';

interface BadgeProps {
  status: LeadPipelineStatus;
}

const statusClasses: Record<LeadPipelineStatus, { container: string, dot: string }> = {
  [LeadPipelineStatus.NEW_NOT_CONTACTED]: { container: 'bg-error-subtle-background text-error-subtle-text', dot: 'bg-error' },
  [LeadPipelineStatus.CONTACTED_CALL_DONE]: { container: 'bg-accent-subtle-background text-accent-subtle-text', dot: 'bg-accent' },
  [LeadPipelineStatus.SITE_VISIT_SCHEDULED]: { container: 'bg-purple-subtle-background text-purple-subtle-text', dot: 'bg-purple' },
  [LeadPipelineStatus.WAITING_FOR_DRAWING]: { container: 'bg-slate-subtle-background text-slate-subtle-text', dot: 'bg-text-secondary' },
  [LeadPipelineStatus.QUOTATION_SENT]: { container: 'bg-primary-subtle-background text-primary-subtle-text', dot: 'bg-primary' },
  [LeadPipelineStatus.NEGOTIATION]: { container: 'bg-accent-subtle-background text-accent-subtle-text', dot: 'bg-accent' },
  [LeadPipelineStatus.IN_PROCUREMENT]: { container: 'bg-purple-subtle-background text-purple-subtle-text', dot: 'bg-purple' },
  [LeadPipelineStatus.IN_EXECUTION]: { container: 'bg-accent-subtle-background text-accent-subtle-text', dot: 'bg-accent' },
  [LeadPipelineStatus.WON]: { container: 'bg-secondary-subtle-background text-secondary-subtle-text', dot: 'bg-secondary' },
  [LeadPipelineStatus.LOST]: { container: 'bg-slate-subtle-background text-slate-subtle-text', dot: 'bg-text-secondary' },
};


const Badge: React.FC<BadgeProps> = ({ status }) => {
  const classes = statusClasses[status];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${classes.container}`}>
      <span className={`w-2 h-2 mr-1.5 rounded-full ${classes.dot}`}></span>
      {status}
    </span>
  );
};

export default Badge;