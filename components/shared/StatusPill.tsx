import React from 'react';

type PillColor = 'red' | 'amber' | 'green' | 'slate' | 'blue' | 'purple';

interface StatusPillProps {
  children: React.ReactNode;
  color: PillColor;
}

const colorClasses: Record<PillColor, { bg: string, text: string, dot: string }> = {
  red: { bg: 'bg-error-subtle-background', text: 'text-error-subtle-text', dot: 'bg-error' },
  amber: { bg: 'bg-accent-subtle-background', text: 'text-accent-subtle-text', dot: 'bg-accent' },
  green: { bg: 'bg-secondary-subtle-background', text: 'text-secondary-subtle-text', dot: 'bg-secondary' },
  slate: { bg: 'bg-slate-subtle-background', text: 'text-slate-subtle-text', dot: 'bg-text-secondary' },
  blue: { bg: 'bg-primary-subtle-background', text: 'text-primary-subtle-text', dot: 'bg-primary' },
  purple: { bg: 'bg-purple-subtle-background', text: 'text-purple-subtle-text', dot: 'bg-purple' },
};

const StatusPill: React.FC<StatusPillProps> = ({ children, color }) => {
  const classes = colorClasses[color];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${classes.bg} ${classes.text}`}>
        <span className={`w-2 h-2 mr-1.5 rounded-full ${classes.dot}`}></span>
        {children}
    </span>
  );
};

export default StatusPill;