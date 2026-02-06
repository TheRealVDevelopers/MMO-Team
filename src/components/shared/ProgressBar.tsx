import React from 'react';

interface ProgressBarProps {
  progress: number; // 0 to 100
  colorClass?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress, colorClass = 'bg-primary' }) => {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className="w-full bg-border rounded-full h-2.5">
      <div className={`${colorClass} h-2.5 rounded-full`} style={{ width: `${clampedProgress}%` }}></div>
    </div>
  );
};

export default ProgressBar;