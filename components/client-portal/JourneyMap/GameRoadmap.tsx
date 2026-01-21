import React, { useState, useEffect } from 'react';
import {
    CheckCircleIcon,
    LockClosedIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/solid';
import { JourneyStage, StageStatus } from '../types';

interface GameRoadmapProps {
    stages: JourneyStage[];
    currentStageId: number;
    onStageClick: (stage: JourneyStage) => void;
    unlockedUntilStage: number; // Payment unlocks stages
}

// Stage scene icons/illustrations
const STAGE_SCENES: Record<string, { emoji: string; bg: string }> = {
    'Consultation': { emoji: '💬', bg: 'from-indigo-400 to-indigo-600' },
    'Site Survey': { emoji: '📐', bg: 'from-amber-400 to-amber-600' },
    'Design Phase': { emoji: '🎨', bg: 'from-pink-400 to-pink-600' },
    'Quotation': { emoji: '📝', bg: 'from-purple-400 to-purple-600' },
    'Material Selection': { emoji: '🪵', bg: 'from-orange-400 to-orange-600' },
    'Manufacturing': { emoji: '🏭', bg: 'from-emerald-400 to-emerald-600' },
    'Site Execution': { emoji: '🔨', bg: 'from-blue-400 to-blue-600' },
    'Installation': { emoji: '🪑', bg: 'from-teal-400 to-teal-600' },
    'Handover': { emoji: '🔑', bg: 'from-green-400 to-green-600' }
};

const getStageScene = (name: string) => {
    return STAGE_SCENES[name] || { emoji: '📍', bg: 'from-gray-400 to-gray-600' };
};

const GameRoadmap: React.FC<GameRoadmapProps> = ({
    stages,
    currentStageId,
    onStageClick,
    unlockedUntilStage
}) => {
    const [progressOffset, setProgressOffset] = useState(0);

    // Animate the progress indicator position
    useEffect(() => {
        const completedCount = stages.filter(s => s.status === 'completed').length;
        const inProgressIndex = stages.findIndex(s => s.status === 'in-progress');
        const targetOffset = inProgressIndex >= 0 ? inProgressIndex : completedCount;

        // Smooth animation
        const timer = setTimeout(() => {
            setProgressOffset(targetOffset);
        }, 500);

        return () => clearTimeout(timer);
    }, [stages]);

    const getNodeStatus = (stage: JourneyStage, index: number): 'completed' | 'current' | 'locked' | 'upcoming' | 'issue' => {
        if (stage.status === 'issue') return 'issue';
        if (stage.status === 'completed') return 'completed';
        if (stage.status === 'in-progress') return 'current';
        if (index > unlockedUntilStage - 1) return 'locked';
        return 'upcoming';
    };

    return (
        <div className="relative bg-gradient-to-br from-slate-50 via-white to-blue-50 rounded-3xl p-6 md:p-8 overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-10 left-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
                <div className="absolute bottom-10 right-10 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl" />
            </div>

            {/* Title */}
            <div className="text-center mb-8 relative z-10">
                <h3 className="text-xl md:text-2xl font-bold text-gray-800">
                    Your Project Journey
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                    Tap any stage to see details
                </p>
            </div>

            {/* Scrollable Roadmap Container */}
            <div className="overflow-x-auto pb-4 -mx-2 px-2">
                <div className="min-w-[800px] relative py-8">

                    {/* Curved Path SVG */}
                    <svg
                        className="absolute inset-0 w-full h-full pointer-events-none"
                        viewBox="0 0 800 200"
                        preserveAspectRatio="none"
                    >
                        {/* Background path (gray) */}
                        <path
                            d="M 40 100 Q 100 40 180 100 T 340 100 T 500 100 T 660 100 T 760 100"
                            fill="none"
                            stroke="#E5E7EB"
                            strokeWidth="8"
                            strokeLinecap="round"
                        />

                        {/* Progress path (colored) */}
                        <path
                            d="M 40 100 Q 100 40 180 100 T 340 100 T 500 100 T 660 100 T 760 100"
                            fill="none"
                            stroke="url(#progressGradient)"
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray="1000"
                            strokeDashoffset={1000 - (progressOffset / (stages.length - 1)) * 1000}
                            style={{ transition: 'stroke-dashoffset 1.5s ease-out' }}
                        />

                        <defs>
                            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#10B981" />
                                <stop offset="50%" stopColor="#3B82F6" />
                                <stop offset="100%" stopColor="#8B5CF6" />
                            </linearGradient>
                        </defs>
                    </svg>

                    {/* Moving Progress Indicator (Chair icon moving along path) */}
                    <div
                        className="absolute z-20 transition-all duration-1000 ease-out"
                        style={{
                            left: `${40 + (progressOffset / (stages.length - 1)) * 720}px`,
                            top: '50%',
                            transform: 'translate(-50%, -100%)'
                        }}
                    >
                        <div className="relative">
                            <div className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center animate-bounce">
                                <span className="text-xl">🪑</span>
                            </div>
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45 shadow-sm" />
                        </div>
                    </div>

                    {/* Stage Nodes */}
                    <div className="relative flex justify-between items-center px-4">
                        {stages.map((stage, index) => {
                            const status = getNodeStatus(stage, index);
                            const scene = getStageScene(stage.name);
                            const isClickable = status !== 'locked';

                            // Calculate vertical offset for wave effect
                            const yOffset = Math.sin((index / (stages.length - 1)) * Math.PI * 2) * 30;

                            return (
                                <button
                                    key={stage.id}
                                    onClick={() => isClickable && onStageClick(stage)}
                                    disabled={!isClickable}
                                    className={`
                                        relative group flex flex-col items-center
                                        transition-all duration-300
                                        ${isClickable ? 'cursor-pointer hover:scale-110' : 'cursor-not-allowed'}
                                    `}
                                    style={{ transform: `translateY(${yOffset}px)` }}
                                >
                                    {/* Stage Node Circle */}
                                    <div className={`
                                        relative w-16 h-16 md:w-20 md:h-20 rounded-2xl
                                        flex items-center justify-center
                                        transition-all duration-500
                                        ${status === 'completed'
                                            ? `bg-gradient-to-br ${scene.bg} shadow-lg shadow-emerald-500/30`
                                            : status === 'current'
                                                ? `bg-gradient-to-br ${scene.bg} shadow-xl shadow-primary/40 ring-4 ring-white ring-offset-2`
                                                : status === 'locked'
                                                    ? 'bg-gray-200'
                                                    : status === 'issue'
                                                        ? 'bg-gradient-to-br from-red-400 to-red-600 shadow-lg shadow-red-500/30'
                                                        : 'bg-gray-100 border-2 border-dashed border-gray-300'
                                        }
                                    `}>
                                        {/* Scene Emoji or Lock */}
                                        {status === 'locked' ? (
                                            <LockClosedIcon className="w-6 h-6 text-gray-400" />
                                        ) : (
                                            <span className={`text-2xl md:text-3xl ${status === 'completed' || status === 'current' || status === 'issue' ? '' : 'grayscale opacity-50'}`}>
                                                {scene.emoji}
                                            </span>
                                        )}

                                        {/* Status Badge */}
                                        {status === 'completed' && (
                                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center">
                                                <CheckCircleIcon className="w-5 h-5 text-emerald-500" />
                                            </div>
                                        )}
                                        {status === 'current' && (
                                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center">
                                                <div className="w-3 h-3 bg-primary rounded-full animate-pulse" />
                                            </div>
                                        )}
                                        {status === 'issue' && (
                                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center">
                                                <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
                                            </div>
                                        )}

                                        {/* Pulse animation for current */}
                                        {status === 'current' && (
                                            <div className="absolute inset-0 rounded-2xl bg-primary/20 animate-ping" />
                                        )}
                                    </div>

                                    {/* Stage Label */}
                                    <div className="mt-3 text-center max-w-[80px] md:max-w-[100px]">
                                        <p className={`
                                            text-xs md:text-sm font-semibold leading-tight
                                            ${status === 'completed' ? 'text-emerald-700'
                                                : status === 'current' ? 'text-primary'
                                                    : status === 'locked' ? 'text-gray-400'
                                                        : status === 'issue' ? 'text-red-600'
                                                            : 'text-gray-500'
                                            }
                                        `}>
                                            {stage.name}
                                        </p>
                                        {status === 'locked' && (
                                            <p className="text-[10px] text-gray-400 mt-0.5">
                                                🔒 Locked
                                            </p>
                                        )}
                                    </div>

                                    {/* Hover tooltip */}
                                    {isClickable && (
                                        <div className="
                                            absolute -bottom-16 left-1/2 -translate-x-1/2
                                            opacity-0 group-hover:opacity-100
                                            transition-opacity duration-200
                                            pointer-events-none z-30
                                        ">
                                            <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-xl whitespace-nowrap">
                                                Tap to view details
                                            </div>
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 mt-4 text-xs text-gray-500">
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span>Completed</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                    <span>In Progress</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <LockClosedIcon className="w-3 h-3 text-gray-400" />
                    <span>Locked</span>
                </div>
            </div>
        </div>
    );
};

export default GameRoadmap;
