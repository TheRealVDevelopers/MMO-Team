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
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 overflow-hidden">
            <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4 sm:mb-6">
                Your Project Journey
            </h3>

            {/* Vertical Timeline */}
            <div className="relative px-2">
                {stages.map((stage, index) => {
                    const status = getNodeStatus(stage, index);
                    const scene = getStageScene(stage.name);
                    const isClickable = status !== 'locked';
                    const roleConfig = ROLE_CONFIGS[stage.responsibleRole];

                    return (
                        <div key={stage.id} className="relative pb-12 last:pb-0">
                            {/* Connector Line */}
                            {index < stages.length - 1 && (
                                <div className={`
                                    absolute left-[1.5rem] sm:left-[2.25rem] top-[3rem] sm:top-[4rem] w-0.5 h-[calc(100%-1.5rem)] sm:h-[calc(100%-2rem)]
                                    ${status === 'completed' ? 'bg-emerald-400' : 'bg-gray-100'}
                                    transition-colors duration-500
                                `} />
                            )}

                            {/* Stage Row */}
                            <button
                                onClick={() => isClickable && onStageClick(stage)}
                                disabled={!isClickable}
                                className={`
                                    w-full flex items-center gap-3 sm:gap-6 p-3 sm:p-5 rounded-xl sm:rounded-[1.5rem]
                                    transition-all duration-300
                                    ${status === 'current'
                                        ? 'bg-white border-2 border-primary shadow-xl shadow-primary/10'
                                        : status === 'completed'
                                            ? 'bg-emerald-50/50 hover:bg-emerald-50 border border-transparent'
                                            : status === 'locked'
                                                ? 'bg-gray-50/50 opacity-40 cursor-not-allowed border border-transparent'
                                                : 'bg-gray-50/50 hover:bg-gray-50 border border-transparent'
                                    }
                                    ${isClickable ? 'cursor-pointer' : ''}
                                `}
                            >
                                {/* Stage Icon */}
                                <div className={`
                                    relative w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex-shrink-0
                                    flex items-center justify-center
                                    transition-all duration-500
                                    ${status === 'completed'
                                        ? `bg-gradient-to-br ${scene.color} shadow-lg shadow-emerald-200`
                                        : status === 'current'
                                            ? `bg-gradient-to-br ${scene.color} ring-4 ring-primary/10 shadow-xl`
                                            : 'bg-white border border-gray-100 shadow-sm'
                                    }
                                `}>
                                    {status === 'locked' ? (
                                        <LockClosedIcon className="w-6 h-6 text-gray-300" />
                                    ) : (
                                        <span className="text-xl sm:text-3xl">{scene.emoji}</span>
                                    )}

                                    {/* Status Badge */}
                                    {status === 'completed' && (
                                        <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-5 h-5 sm:w-6 sm:h-6 bg-white rounded-full shadow-md flex items-center justify-center">
                                            <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
                                        </div>
                                    )}
                                    {status === 'current' && (
                                        <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-5 h-5 sm:w-6 sm:h-6 bg-white rounded-full shadow-md flex items-center justify-center">
                                            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-primary rounded-full animate-pulse" />
                                        </div>
                                    )}
                                </div>

                                {/* Stage Info */}
                                <div className="flex-1 text-left min-w-0">
                                    <div className="flex items-center gap-3">
                                        <h4 className={`text-sm sm:text-lg font-bold tracking-tight ${status === 'completed' ? 'text-emerald-800'
                                            : status === 'current' ? 'text-gray-900'
                                                : status === 'locked' ? 'text-gray-400'
                                                    : 'text-gray-700'
                                            }`}>
                                            {stage.name}
                                        </h4>
                                        {status === 'current' && (
                                            <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-black rounded-md uppercase tracking-wider">
                                                In Progress
                                            </span>
                                        )}
                                    </div>

                                    {/* Date info */}
                                    <div className="flex items-center gap-2 mt-1">
                                        <p className="text-xs font-medium text-gray-400">
                                            {status === 'completed' && stage.actualEndDate && (
                                                <>Finished on {new Date(stage.actualEndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</>
                                            )}
                                            {status === 'current' && stage.expectedEndDate && (
                                                <>Target: {new Date(stage.expectedEndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</>
                                            )}
                                            {status === 'upcoming' && stage.expectedEndDate && (
                                                <>Scheduled: {new Date(stage.expectedEndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</>
                                            )}
                                            {status === 'locked' && 'Waiting for unlock'}
                                        </p>
                                    </div>

                                    {/* Progress for current */}
                                    {status === 'current' && stage.progressPercent !== undefined && (
                                        <div className="mt-4 max-w-xs">
                                            <div className="flex items-center justify-between text-[10px] font-bold text-primary uppercase tracking-[0.1em] mb-1.5">
                                                <span>Completion Status</span>
                                                <span>{stage.progressPercent}%</span>
                                            </div>
                                            <div className="h-1.5 bg-primary/5 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary rounded-full transition-all duration-1000"
                                                    style={{ width: `${stage.progressPercent}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Assignee for current/completed */}
                                    {(status === 'completed' || status === 'current') && stage.assigneeName && (
                                        <div className="flex items-center gap-2 mt-3">
                                            <div className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black text-white" style={{ backgroundColor: roleConfig.color }}>
                                                {stage.assigneeName.charAt(0)}
                                            </div>
                                            <span className="text-xs font-semibold text-gray-500">
                                                {stage.assigneeName}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Arrow for clickable */}
                                {isClickable && (
                                    <div className="text-gray-300 flex-shrink-0">
                                        <svg className="w-6 h-6 opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
