import React from 'react';

type PillColor = 'red' | 'amber' | 'green' | 'slate' | 'blue' | 'purple';

interface StatusPillProps {
  children: React.ReactNode;
  color: PillColor;
}

const colorClasses: Record<PillColor, { bg: string, text: string, dot: string, border: string }> = {
  red: { bg: 'bg-error-subtle-background', text: 'text-error-subtle-text', dot: 'bg-error', border: 'border-error/20' },
  amber: { bg: 'bg-accent-subtle-background', text: 'text-accent-subtle-text', dot: 'bg-accent', border: 'border-accent/20' },
  green: { bg: 'bg-secondary-subtle-background', text: 'text-secondary-subtle-text', dot: 'bg-secondary', border: 'border-secondary/20' },
  slate: { bg: 'bg-slate-subtle-background', text: 'text-slate-subtle-text', dot: 'bg-text-secondary', border: 'border-slate-300' },
  blue: { bg: 'bg-primary-subtle-background', text: 'text-primary-subtle-text', dot: 'bg-primary', border: 'border-primary/20' },
  purple: { bg: 'bg-purple-subtle-background', text: 'text-purple-subtle-text', dot: 'bg-purple', border: 'border-purple/20' },
};

const StatusPill: React.FC<StatusPillProps> = ({ children, color }) => {
  const classes = colorClasses[color];
  return (
    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border ${classes.bg} ${classes.text} ${classes.border} shadow-sm`}>
        <span className={`w-2 h-2 mr-2 rounded-full ${classes.dot} shadow-sm`}></span>
        {children}
    </span>
  );
};

export default StatusPill;