import React from 'react';
import {
    CheckCircleIcon,
    ClockIcon,
    ExclamationTriangleIcon,
    ArrowRightIcon
} from '@heroicons/react/24/outline';
import { TransparencyData, ProjectHealth } from '../types';

interface SimpleStatusPanelProps {
    data: TransparencyData;
    className?: string;
}

const getHealthConfig = (health: ProjectHealth) => {
    switch (health) {
        case 'on-track':
            return {
                icon: <CheckCircleIcon className="w-5 h-5 text-emerald-500" />,
                label: 'On Track',
                color: 'text-emerald-600',
                bg: 'bg-emerald-50 border-emerald-200'
            };
        case 'minor-delay':
            return {
                icon: <ClockIcon className="w-5 h-5 text-amber-500" />,
                label: 'Minor Delay',
                color: 'text-amber-600',
                bg: 'bg-amber-50 border-amber-200'
            };
        case 'at-risk':
            return {
                icon: <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />,
                label: 'At Risk',
                color: 'text-red-600',
                bg: 'bg-red-50 border-red-200'
            };
    }
};

const SimpleStatusPanel: React.FC<SimpleStatusPanelProps> = ({
    data,
    className = ''
}) => {
    const healthConfig = getHealthConfig(data.projectHealth);
    const progressPercent = Math.round((data.daysCompleted / data.totalDurationDays) * 100);

    return (
        <div className={`bg-white rounded-2xl shadow-lg overflow-hidden ${className}`}>
            {/* Project Status - Main Focus */}
            <div className={`p-5 border ${healthConfig.bg}`}>
                <div className="flex items-center gap-3">
                    {healthConfig.icon}
                    <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Project Status</p>
                        <p className={`text-lg font-bold ${healthConfig.color}`}>
                            {healthConfig.label}
                        </p>
                    </div>
                </div>
            </div>

            {/* Timeline Progress */}
            <div className="p-5 border-b border-gray-100">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-600">Timeline</span>
                    <span className="text-sm font-bold text-gray-800">{progressPercent}%</span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-emerald-400 to-primary rounded-full transition-all duration-1000"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-500">
                    <span>{data.daysCompleted} days done</span>
                    <span>{data.daysRemaining} days left</span>
                </div>
            </div>

            {/* Next Action - Highlighted */}
            <div className="p-5 bg-gradient-to-r from-primary/5 to-transparent">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                    Next Action
                </p>
                <div className={`
                    flex items-center gap-3 p-3 rounded-xl border-2 
                    ${data.nextAction.actor === 'client'
                        ? 'bg-primary/10 border-primary border-dashed'
                        : 'bg-gray-50 border-gray-200'
                    }
                `}>
                    <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold
                        ${data.nextAction.actor === 'client'
                            ? 'bg-primary text-white'
                            : 'bg-gray-200 text-gray-600'
                        }
                    `}>
                        {data.nextAction.actor === 'client' ? 'You' : 'Us'}
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-800">
                            {data.nextAction.action}
                        </p>
                        {data.nextAction.deadline && (
                            <p className="text-xs text-gray-500 mt-0.5">
                                By {new Date(data.nextAction.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </p>
                        )}
                    </div>
                    <ArrowRightIcon className={`w-4 h-4 ${data.nextAction.actor === 'client' ? 'text-primary' : 'text-gray-400'}`} />
                </div>
            </div>
        </div>
    );
};

export default SimpleStatusPanel;
