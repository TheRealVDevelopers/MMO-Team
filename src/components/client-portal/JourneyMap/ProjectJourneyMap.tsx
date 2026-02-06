import React, { useState, useRef } from 'react';
import JourneyNode from './JourneyNode';
import StageDetailPanel from './StageDetailPanel';
import { JourneyStage } from '../types';

interface ProjectJourneyMapProps {
    stages: JourneyStage[];
    currentStageId: number;
    onStageAction?: (stageId: number, action: string) => void;
}

const ProjectJourneyMap: React.FC<ProjectJourneyMapProps> = ({
    stages,
    currentStageId,
    onStageAction
}) => {
    const [selectedStage, setSelectedStage] = useState<JourneyStage | null>(null);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const handleStageClick = (stage: JourneyStage) => {
        setSelectedStage(stage);
        setIsPanelOpen(true);
    };

    const handleClosePanel = () => {
        setIsPanelOpen(false);
        setTimeout(() => setSelectedStage(null), 300);
    };

    const handleStageAction = (action: string) => {
        if (selectedStage && onStageAction) {
            onStageAction(selectedStage.id, action);
        }
    };

    // Calculate path positions for the serpentine layout
    const getNodePosition = (index: number): 'left' | 'center' | 'right' => {
        const row = Math.floor(index / 3);
        const posInRow = index % 3;

        if (row % 2 === 0) {
            // Left to right
            return posInRow === 0 ? 'left' : posInRow === 2 ? 'right' : 'center';
        } else {
            // Right to left
            return posInRow === 0 ? 'right' : posInRow === 2 ? 'left' : 'center';
        }
    };

    // Group stages into rows of 3 for serpentine layout
    const rows: JourneyStage[][] = [];
    for (let i = 0; i < stages.length; i += 3) {
        const row = stages.slice(i, i + 3);
        // Reverse odd rows for serpentine effect
        if (Math.floor(i / 3) % 2 === 1) {
            rows.push([...row].reverse());
        } else {
            rows.push(row);
        }
    }

    return (
        <div className="relative">
            {/* Journey Map Container */}
            <div
                ref={scrollRef}
                className="
                    relative bg-gradient-to-br from-gray-50 via-white to-gray-50
                    rounded-3xl p-6 md:p-8
                    overflow-x-auto
                    border border-gray-100
                    shadow-inner
                "
            >
                {/* Decorative background pattern */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,gray_1px,transparent_1px)] bg-[size:24px_24px]" />
                </div>

                {/* Title */}
                <div className="text-center mb-8">
                    <h3 className="text-xl md:text-2xl font-serif font-bold text-text-primary mb-2">
                        Your Project Journey
                    </h3>
                    <p className="text-sm text-text-secondary">
                        Click on any stage to view details and actions
                    </p>
                </div>

                {/* Progress Overview */}
                <div className="flex items-center justify-center gap-6 mb-8">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        <span className="text-xs font-medium text-gray-600">Completed</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--color-primary-rgb),0.5)]" />
                        <span className="text-xs font-medium text-gray-600">In Progress</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-gray-300" />
                        <span className="text-xs font-medium text-gray-600">Upcoming</span>
                    </div>
                </div>

                {/* Serpentine Journey Path */}
                <div className="relative min-w-[600px] md:min-w-0">
                    {rows.map((row, rowIndex) => (
                        <div key={rowIndex} className="relative">
                            {/* Row of nodes */}
                            <div className={`
                                flex justify-between items-start
                                ${rowIndex > 0 ? 'mt-8' : ''}
                                px-4 md:px-8
                            `}>
                                {row.map((stage, nodeIndex) => {
                                    const originalIndex = rowIndex * 3 + (rowIndex % 2 === 1 ? 2 - nodeIndex : nodeIndex);
                                    return (
                                        <JourneyNode
                                            key={stage.id}
                                            stage={stage}
                                            isActive={stage.id === currentStageId}
                                            onClick={() => handleStageClick(stage)}
                                            position={getNodePosition(originalIndex)}
                                            isLast={originalIndex === stages.length - 1}
                                        />
                                    );
                                })}

                                {/* Fill empty spaces in last row */}
                                {row.length < 3 && Array(3 - row.length).fill(null).map((_, i) => (
                                    <div key={`empty-${i}`} className="w-20 md:w-24" />
                                ))}
                            </div>

                            {/* Connecting paths */}
                            <svg
                                className="absolute inset-0 pointer-events-none overflow-visible"
                                style={{ zIndex: -1 }}
                            >
                                {/* Horizontal connections within row */}
                                {row.length > 1 && row.slice(0, -1).map((stage, i) => {
                                    const startX = (i + 0.5) * (100 / 3) + '%';
                                    const endX = (i + 1.5) * (100 / 3) + '%';
                                    const y = '50px';
                                    const nextStage = row[i + 1];
                                    const isCompleted = stage.status === 'completed' && nextStage.status === 'completed';
                                    const isActive = stage.status === 'completed' && nextStage.status === 'in-progress';

                                    return (
                                        <line
                                            key={`h-${stage.id}-${nextStage.id}`}
                                            x1={startX}
                                            y1={y}
                                            x2={endX}
                                            y2={y}
                                            stroke={isCompleted ? '#10B981' : isActive ? 'url(#activeGradient)' : '#E5E7EB'}
                                            strokeWidth="3"
                                            strokeLinecap="round"
                                            strokeDasharray={isActive ? '8 4' : 'none'}
                                        />
                                    );
                                })}

                                <defs>
                                    <linearGradient id="activeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#10B981" />
                                        <stop offset="100%" stopColor="var(--color-primary)" />
                                    </linearGradient>
                                </defs>
                            </svg>

                            {/* Vertical connector to next row */}
                            {rowIndex < rows.length - 1 && (
                                <div className={`
                                    absolute ${rowIndex % 2 === 0 ? 'right-12 md:right-16' : 'left-12 md:left-16'}
                                    bottom-0 translate-y-full
                                    w-0.5 h-8
                                    ${stages[Math.min((rowIndex + 1) * 3, stages.length - 1)].status !== 'locked'
                                        ? 'bg-gradient-to-b from-emerald-500 to-primary'
                                        : 'bg-gray-200'
                                    }
                                `} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Journey End Flag */}
                <div className="flex justify-center mt-8">
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-full border border-emerald-200">
                        <span className="text-lg">🎉</span>
                        <span className="text-sm font-bold text-emerald-700">Project Handover</span>
                    </div>
                </div>
            </div>

            {/* Stage Detail Panel */}
            <StageDetailPanel
                stage={selectedStage}
                isOpen={isPanelOpen}
                onClose={handleClosePanel}
                onAction={handleStageAction}
            />
        </div>
    );
};

export default ProjectJourneyMap;
