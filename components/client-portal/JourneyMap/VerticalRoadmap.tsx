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

// Stage scene icons (full journey: call → site → BOQ → project → execution phases)
const STAGE_SCENES: Record<string, { emoji: string; color: string }> = {
    'Call connected': { emoji: '📞', color: 'from-indigo-400 to-indigo-600' },
    'Site inspection': { emoji: '📐', color: 'from-amber-400 to-amber-600' },
    'BOQ & Quotation': { emoji: '📝', color: 'from-violet-400 to-violet-600' },
    'Project initiated': { emoji: '🚀', color: 'from-emerald-400 to-emerald-600' },
    'Execution': { emoji: '🔨', color: 'from-blue-400 to-blue-600' },
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
    return STAGE_SCENES[name] || { emoji: '📍', color: 'from-slate-400 to-slate-600' };
};

const formatStageDate = (stage: JourneyStage, status: string): string => {
    const d = (v: Date | undefined) => v ? new Date(v).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
    if (status === 'completed' && stage.actualEndDate) return `Done on ${d(stage.actualEndDate)}`;
    if (stage.startDate && stage.expectedEndDate && stage.startDate !== stage.expectedEndDate) return `${d(stage.startDate)} – ${d(stage.expectedEndDate)}`;
    if (stage.expectedEndDate) return `Target: ${d(stage.expectedEndDate)}`;
    if (stage.startDate) return `From ${d(stage.startDate)}`;
    if (status === 'locked') return 'Waiting for unlock';
    return 'Scheduled';
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
        if (stage.status === 'locked') return 'locked';
        if (index > unlockedUntilStage - 1) return 'locked';
        return 'upcoming';
    };

    return (
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-br from-slate-50 to-slate-100/80 px-6 py-5 border-b border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 tracking-tight">Your Journey</h3>
                <p className="text-sm text-gray-500 mt-0.5">From first call to handover — full project timeline with dates</p>
            </div>

            {/* Vertical Timeline */}
            <div className="relative px-4 py-6">
                {stages.map((stage, index) => {
                    const status = getNodeStatus(stage, index);
                    const scene = getStageScene(stage.name);
                    const isClickable = status !== 'locked';
                    const roleConfig = ROLE_CONFIGS[stage.responsibleRole];
                    const dateText = formatStageDate(stage, status);

                    return (
                        <div key={stage.id} className="relative pb-10 last:pb-0">
                            {/* Connector Line */}
                            {index < stages.length - 1 && (
                                <div className={`
                                    absolute left-[2.4rem] top-16 w-0.5 h-[calc(100%-1.5rem)]
                                    ${status === 'completed' ? 'bg-emerald-300' : 'bg-gray-200'}
                                    transition-colors duration-500
                                `} />
                            )}

                            {/* Stage Row */}
                            <button
                                onClick={() => isClickable && onStageClick(stage)}
                                disabled={!isClickable}
                                className={`
                                    w-full flex items-start gap-5 p-5 rounded-2xl text-left
                                    transition-all duration-300
                                    ${status === 'current'
                                        ? 'bg-white border-2 border-primary shadow-lg shadow-primary/10 ring-2 ring-primary/5'
                                        : status === 'completed'
                                            ? 'bg-emerald-50/70 hover:bg-emerald-50 border border-emerald-100/50'
                                            : status === 'locked'
                                                ? 'bg-gray-50/60 opacity-70 cursor-not-allowed border border-gray-100'
                                                : 'bg-gray-50/60 hover:bg-gray-50 border border-gray-100'
                                    }
                                    ${isClickable ? 'cursor-pointer' : ''}
                                `}
                            >
                                {/* Stage Icon */}
                                <div className={`
                                    relative w-14 h-14 rounded-xl flex-shrink-0 mt-0.5
                                    flex items-center justify-center
                                    transition-all duration-500
                                    ${status === 'completed'
                                        ? `bg-gradient-to-br ${scene.color} shadow-md`
                                        : status === 'current'
                                            ? `bg-gradient-to-br ${scene.color} ring-4 ring-primary/20 shadow-lg`
                                            : 'bg-white border border-gray-200 shadow-sm'
                                    }
                                `}>
                                    {status === 'locked' ? (
                                        <LockClosedIcon className="w-6 h-6 text-gray-300" />
                                    ) : (
                                        <span className="text-2xl">{scene.emoji}</span>
                                    )}
                                    {status === 'completed' && (
                                        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white rounded-full shadow flex items-center justify-center">
                                            <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
                                        </div>
                                    )}
                                    {status === 'current' && (
                                        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white rounded-full shadow flex items-center justify-center">
                                            <div className="w-2.5 h-2.5 bg-primary rounded-full animate-pulse" />
                                        </div>
                                    )}
                                </div>

                                {/* Stage Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h4 className={`text-base font-bold tracking-tight ${status === 'completed' ? 'text-emerald-800'
                                            : status === 'current' ? 'text-gray-900'
                                                : status === 'locked' ? 'text-gray-400'
                                                    : 'text-gray-700'
                                            }`}>
                                            {stage.name}
                                        </h4>
                                        {status === 'current' && (
                                            <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-md uppercase tracking-wider">
                                                In Progress
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs font-medium text-gray-500 mt-1">
                                        {dateText}
                                    </p>
                                    {stage.description && (
                                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                                            {stage.description}
                                        </p>
                                    )}

                                    {status === 'current' && stage.progressPercent !== undefined && stage.progressPercent > 0 && (
                                        <div className="mt-3 max-w-xs">
                                            <div className="flex items-center justify-between text-[10px] font-bold text-primary uppercase tracking-wider mb-1">
                                                <span>Progress</span>
                                                <span>{stage.progressPercent}%</span>
                                            </div>
                                            <div className="h-1.5 bg-primary/10 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary rounded-full transition-all duration-1000"
                                                    style={{ width: `${stage.progressPercent}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {(status === 'completed' || status === 'current') && stage.assigneeName && (
                                        <div className="flex items-center gap-2 mt-2">
                                            <div className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: roleConfig.color }}>
                                                {stage.assigneeName.charAt(0)}
                                            </div>
                                            <span className="text-xs font-medium text-gray-500">{stage.assigneeName}</span>
                                        </div>
                                    )}
                                </div>

                                {isClickable && (
                                    <div className="text-gray-300 flex-shrink-0 mt-2">
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
            <div className="px-6 py-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-t border-gray-100 flex items-center justify-center gap-2">
                <span className="text-base">🎉</span>
                <span className="text-sm font-semibold text-gray-700">Project Complete</span>
            </div>
        </div>
    );
};

export default VerticalRoadmap;
