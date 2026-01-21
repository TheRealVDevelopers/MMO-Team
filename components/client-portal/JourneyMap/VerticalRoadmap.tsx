import React, { useState, useEffect } from 'react';
import {
    CheckCircleIcon,
    LockClosedIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/solid';
import { JourneyStage, StageStatus, ROLE_CONFIGS } from '../types';

interface VerticalRoadmapProps {
    stages: JourneyStage[];
    currentStageId: number;
    onStageClick: (stage: JourneyStage) => void;
    unlockedUntilStage: number;
}

// Stage scene icons
const STAGE_SCENES: Record<string, { emoji: string; color: string }> = {
    'Consultation': { emoji: '💬', color: 'from-indigo-400 to-indigo-600' },
    'Site Survey': { emoji: '📐', color: 'from-amber-400 to-amber-600' },
    'Design Phase': { emoji: '🎨', color: 'from-pink-400 to-pink-600' },
    'Quotation': { emoji: '📝', color: 'from-purple-400 to-purple-600' },
    'Material Selection': { emoji: '🪵', color: 'from-orange-400 to-orange-600' },
    'Manufacturing': { emoji: '🏭', color: 'from-emerald-400 to-emerald-600' },
    'Site Execution': { emoji: '🔨', color: 'from-blue-400 to-blue-600' },
    'Installation': { emoji: '🪑', color: 'from-teal-400 to-teal-600' },
    'Handover': { emoji: '🔑', color: 'from-green-400 to-green-600' }
};

const getStageScene = (name: string) => {
    return STAGE_SCENES[name] || { emoji: '📍', color: 'from-gray-400 to-gray-600' };
};

const VerticalRoadmap: React.FC<VerticalRoadmapProps> = ({
    stages,
    currentStageId,
    onStageClick,
    unlockedUntilStage
}) => {
    const getNodeStatus = (stage: JourneyStage, index: number): 'completed' | 'current' | 'locked' | 'upcoming' => {
        if (stage.status === 'completed') return 'completed';
        if (stage.status === 'in-progress') return 'current';
        if (index > unlockedUntilStage - 1) return 'locked';
        return 'upcoming';
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-6">
                Your Project Journey
            </h3>

            {/* Vertical Timeline */}
            <div className="relative">
                {stages.map((stage, index) => {
                    const status = getNodeStatus(stage, index);
                    const scene = getStageScene(stage.name);
                    const isClickable = status !== 'locked';
                    const roleConfig = ROLE_CONFIGS[stage.responsibleRole];

                    return (
                        <div key={stage.id} className="relative">
                            {/* Connector Line */}
                            {index < stages.length - 1 && (
                                <div className={`
                                    absolute left-7 top-16 w-0.5 h-16
                                    ${status === 'completed' ? 'bg-emerald-400' : 'bg-gray-200'}
                                `} />
                            )}

                            {/* Stage Row */}
                            <button
                                onClick={() => isClickable && onStageClick(stage)}
                                disabled={!isClickable}
                                className={`
                                    w-full flex items-center gap-4 p-4 rounded-xl mb-3
                                    transition-all duration-200
                                    ${status === 'current'
                                        ? 'bg-primary/5 border-2 border-primary shadow-sm'
                                        : status === 'completed'
                                            ? 'bg-emerald-50 hover:bg-emerald-100'
                                            : status === 'locked'
                                                ? 'bg-gray-50 opacity-60 cursor-not-allowed'
                                                : 'bg-gray-50 hover:bg-gray-100'
                                    }
                                    ${isClickable ? 'cursor-pointer' : ''}
                                `}
                            >
                                {/* Stage Icon */}
                                <div className={`
                                    relative w-14 h-14 rounded-xl flex-shrink-0
                                    flex items-center justify-center
                                    ${status === 'completed'
                                        ? `bg-gradient-to-br ${scene.color}`
                                        : status === 'current'
                                            ? `bg-gradient-to-br ${scene.color} ring-4 ring-white shadow-lg`
                                            : 'bg-gray-200'
                                    }
                                `}>
                                    {status === 'locked' ? (
                                        <LockClosedIcon className="w-5 h-5 text-gray-400" />
                                    ) : (
                                        <span className="text-2xl">{scene.emoji}</span>
                                    )}

                                    {/* Status Badge */}
                                    {status === 'completed' && (
                                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full shadow flex items-center justify-center">
                                            <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
                                        </div>
                                    )}
                                    {status === 'current' && (
                                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full shadow flex items-center justify-center">
                                            <div className="w-2.5 h-2.5 bg-primary rounded-full animate-pulse" />
                                        </div>
                                    )}
                                </div>

                                {/* Stage Info */}
                                <div className="flex-1 text-left min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h4 className={`font-semibold ${status === 'completed' ? 'text-emerald-700'
                                                : status === 'current' ? 'text-primary'
                                                    : status === 'locked' ? 'text-gray-400'
                                                        : 'text-gray-600'
                                            }`}>
                                            {stage.name}
                                        </h4>
                                        {status === 'current' && (
                                            <span className="px-2 py-0.5 bg-primary text-white text-[10px] font-bold rounded-full uppercase">
                                                Now
                                            </span>
                                        )}
                                    </div>

                                    {/* Date info */}
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {status === 'completed' && stage.actualEndDate && (
                                            <>Completed {new Date(stage.actualEndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</>
                                        )}
                                        {status === 'current' && stage.expectedEndDate && (
                                            <>Expected {new Date(stage.expectedEndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</>
                                        )}
                                        {status === 'upcoming' && stage.expectedEndDate && (
                                            <>Starts {new Date(stage.expectedEndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</>
                                        )}
                                        {status === 'locked' && '🔒 Locked'}
                                    </p>

                                    {/* Assignee for current/completed */}
                                    {(status === 'completed' || status === 'current') && stage.assigneeName && (
                                        <p className="text-xs mt-1" style={{ color: roleConfig.color }}>
                                            👤 {stage.assigneeName}
                                        </p>
                                    )}

                                    {/* Progress for current */}
                                    {status === 'current' && stage.progressPercent !== undefined && (
                                        <div className="mt-2">
                                            <div className="flex items-center justify-between text-xs mb-1">
                                                <span className="text-gray-500">Progress</span>
                                                <span className="font-semibold text-primary">{stage.progressPercent}%</span>
                                            </div>
                                            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary rounded-full"
                                                    style={{ width: `${stage.progressPercent}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Arrow for clickable */}
                                {isClickable && (
                                    <div className="text-gray-300">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                )}
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* End marker */}
            <div className="flex items-center justify-center mt-4 pt-4 border-t border-gray-100">
                <span className="text-sm text-gray-500">🎉 Project Complete</span>
            </div>
        </div>
    );
};

export default VerticalRoadmap;
