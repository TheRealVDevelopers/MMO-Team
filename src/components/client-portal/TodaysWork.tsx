import React from 'react';
import { ClockIcon } from '@heroicons/react/24/outline';
import { JourneyStage, ROLE_CONFIGS } from './types';

interface TodaysWorkProps {
    currentStage: JourneyStage;
    className?: string;
}

const TodaysWork: React.FC<TodaysWorkProps> = ({
    currentStage,
    className = ''
}) => {
    const roleConfig = ROLE_CONFIGS[currentStage.responsibleRole];

    return (
        <div className={`bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-5 border border-primary/20 ${className}`}>
            <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <ClockIcon className="w-6 h-6 text-primary" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                            Today's Work
                        </h3>
                        <span className="px-2 py-0.5 bg-primary text-white text-[10px] font-bold rounded-full">
                            LIVE
                        </span>
                    </div>

                    <p className="text-lg font-bold text-gray-900 mb-1">
                        {currentStage.name}
                    </p>

                    <p className="text-sm text-gray-600 leading-relaxed">
                        {currentStage.description}
                    </p>

                    {/* Assignee & Progress */}
                    <div className="flex items-center gap-4 mt-3">
                        {currentStage.assigneeName && (
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                    style={{ backgroundColor: roleConfig.color }}
                                >
                                    {currentStage.assigneeName.charAt(0)}
                                </div>
                                <span className="text-sm text-gray-600">
                                    {currentStage.assigneeName}
                                </span>
                            </div>
                        )}

                        {currentStage.progressPercent !== undefined && (
                            <div className="flex items-center gap-2">
                                <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary rounded-full"
                                        style={{ width: `${currentStage.progressPercent}%` }}
                                    />
                                </div>
                                <span className="text-sm font-semibold text-primary">
                                    {currentStage.progressPercent}%
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TodaysWork;
