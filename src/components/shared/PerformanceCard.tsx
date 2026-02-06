import React from 'react';

type Status = 'green' | 'yellow' | 'red';

interface PerformanceCardProps {
    metricName: string;
    metricValue: string;
    weightage: number;
    status: Status;
    description: React.ReactNode;
}

const statusConfig: Record<Status, { ring: string; text: string; bg: string }> = {
    green: { ring: 'ring-secondary', text: 'text-secondary', bg: 'bg-secondary/10' },
    yellow: { ring: 'ring-accent', text: 'text-accent', bg: 'bg-accent/10' },
    red: { ring: 'ring-error', text: 'text-error', bg: 'bg-error/10' },
};

const PerformanceCard: React.FC<PerformanceCardProps> = ({ metricName, metricValue, weightage, status, description }) => {
    const config = statusConfig[status];

    return (
        <div className={`p-4 rounded-lg flex flex-col h-full ${config.bg} border border-current ${config.text}`}>
            <div className="flex justify-between items-start">
                <h4 className="font-bold">{metricName}</h4>
                <div className="text-xs font-semibold px-2 py-0.5 rounded-full bg-surface/50">{weightage}%</div>
            </div>
            <div className="flex-grow flex items-center justify-center my-4">
                <span className="text-4xl font-bold">{metricValue}</span>
            </div>
            <div className="text-xs text-center">{description}</div>
        </div>
    );
};
export default PerformanceCard;
