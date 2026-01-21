import React from 'react';
import {
    CalendarDaysIcon,
    ClockIcon,
    ExclamationTriangleIcon,
    ArrowRightIcon,
    CheckCircleIcon,
    XCircleIcon
} from '@heroicons/react/24/outline';
import RoleAvatar from '../RoleAvatars/RoleAvatar';
import { TransparencyData, ProjectHealth } from '../types';

interface TransparencyPanelProps {
    data: TransparencyData;
    className?: string;
}

const getHealthConfig = (health: ProjectHealth) => {
    const configs: Record<ProjectHealth, { color: string; bgColor: string; label: string; icon: React.ReactNode }> = {
        'on-track': {
            color: 'text-emerald-600',
            bgColor: 'bg-emerald-50 border-emerald-200',
            label: 'On Track',
            icon: <CheckCircleIcon className="w-5 h-5 text-emerald-500" />
        },
        'minor-delay': {
            color: 'text-amber-600',
            bgColor: 'bg-amber-50 border-amber-200',
            label: 'Minor Delay',
            icon: <ClockIcon className="w-5 h-5 text-amber-500" />
        },
        'at-risk': {
            color: 'text-red-600',
            bgColor: 'bg-red-50 border-red-200',
            label: 'At Risk',
            icon: <XCircleIcon className="w-5 h-5 text-red-500" />
        }
    };
    return configs[health];
};

const TransparencyPanel: React.FC<TransparencyPanelProps> = ({
    data,
    className = ''
}) => {
    const healthConfig = getHealthConfig(data.projectHealth);
    const progressPercent = (data.daysCompleted / data.totalDurationDays) * 100;

    return (
        <div className={`bg-white rounded-2xl shadow-lg overflow-hidden ${className}`}>
            {/* Header with Health Status */}
            <div className={`px-6 py-4 border ${healthConfig.bgColor}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {healthConfig.icon}
                        <div>
                            <h3 className="font-bold text-gray-900">Project Status</h3>
                            <p className={`text-sm font-medium ${healthConfig.color}`}>
                                {healthConfig.label}
                            </p>
                        </div>
                    </div>
                    {data.healthReason && (
                        <span className="text-xs text-gray-500 max-w-[150px] text-right">
                            {data.healthReason}
                        </span>
                    )}
                </div>
            </div>

            {/* Duration Progress */}
            <div className="px-6 py-5 border-b border-gray-100">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-600">Timeline Progress</span>
                    <span className="text-sm font-bold text-primary">{progressPercent.toFixed(0)}%</span>
                </div>

                <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden mb-4">
                    <div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-1000"
                        style={{ width: `${Math.min(progressPercent, 100)}%` }}
                    />
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                        <div className="w-12 h-12 mx-auto bg-emerald-50 rounded-xl flex items-center justify-center mb-2">
                            <CalendarDaysIcon className="w-6 h-6 text-emerald-600" />
                        </div>
                        <p className="text-2xl font-bold text-gray-800">{data.totalDurationDays}</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">Total Days</p>
                    </div>

                    <div className="text-center">
                        <div className="w-12 h-12 mx-auto bg-primary/10 rounded-xl flex items-center justify-center mb-2">
                            <CheckCircleIcon className="w-6 h-6 text-primary" />
                        </div>
                        <p className="text-2xl font-bold text-gray-800">{data.daysCompleted}</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">Completed</p>
                    </div>

                    <div className="text-center">
                        <div className="w-12 h-12 mx-auto bg-amber-50 rounded-xl flex items-center justify-center mb-2">
                            <ClockIcon className="w-6 h-6 text-amber-600" />
                        </div>
                        <p className="text-2xl font-bold text-gray-800">{data.daysRemaining}</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">Remaining</p>
                    </div>
                </div>
            </div>

            {/* Delays (if any) */}
            {data.delays.length > 0 && (
                <div className="px-6 py-4 border-b border-gray-100 bg-amber-50/50">
                    <div className="flex items-center gap-2 mb-3">
                        <ExclamationTriangleIcon className="w-4 h-4 text-amber-600" />
                        <h4 className="text-sm font-bold text-amber-800">Delays</h4>
                    </div>
                    <div className="space-y-2">
                        {data.delays.map((delay, index) => (
                            <div
                                key={index}
                                className="flex items-start gap-3 p-3 bg-white rounded-xl border border-amber-100"
                            >
                                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <span className="text-sm font-bold text-amber-700">+{delay.days}</span>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-800">{delay.stageName}</p>
                                    <p className="text-xs text-gray-500">{delay.reason}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Next Action */}
            <div className="px-6 py-5 bg-gradient-to-r from-primary/5 to-transparent">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                    Next Action Required
                </h4>
                <div className={`
                    flex items-center gap-4 p-4 rounded-xl border-2 
                    ${data.nextAction.actor === 'client'
                        ? 'bg-primary/5 border-primary border-dashed'
                        : 'bg-gray-50 border-gray-200'
                    }
                `}>
                    {data.nextAction.actorRole ? (
                        <RoleAvatar role={data.nextAction.actorRole} size="md" showTooltip={false} />
                    ) : (
                        <div className={`
                            w-10 h-10 rounded-full flex items-center justify-center
                            ${data.nextAction.actor === 'client' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'}
                        `}>
                            <span className="font-bold text-sm">
                                {data.nextAction.actor === 'client' ? 'You' : 'MMO'}
                            </span>
                        </div>
                    )}

                    <div className="flex-1">
                        <p className={`font-medium text-sm ${data.nextAction.actor === 'client' ? 'text-primary' : 'text-gray-700'}`}>
                            {data.nextAction.actor === 'client' ? 'Your action needed:' : 'We are working on:'}
                        </p>
                        <p className="text-sm text-gray-800 font-bold mt-0.5">
                            {data.nextAction.action}
                        </p>
                        {data.nextAction.description && (
                            <p className="text-xs text-gray-500 mt-1">{data.nextAction.description}</p>
                        )}
                    </div>

                    {data.nextAction.deadline && (
                        <div className="text-right flex-shrink-0">
                            <p className="text-xs text-gray-500">Deadline</p>
                            <p className="text-sm font-bold text-gray-800">
                                {new Date(data.nextAction.deadline).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric'
                                })}
                            </p>
                        </div>
                    )}
                </div>

                {/* Expected Completion */}
                <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-gray-500">Expected Completion</span>
                    <span className="font-bold text-gray-800">
                        {new Date(data.estimatedCompletion).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                        })}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default TransparencyPanel;
