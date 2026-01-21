import React from 'react';
import {
    CheckCircleIcon,
    ClockIcon,
    LockClosedIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/solid';
import RoleAvatar from '../RoleAvatars/RoleAvatar';
import { JourneyStage, StageStatus } from '../types';

interface JourneyNodeProps {
    stage: JourneyStage;
    isActive?: boolean;
    onClick?: () => void;
    position: 'left' | 'center' | 'right';
    isLast?: boolean;
}

const getStatusStyles = (status: StageStatus) => {
    switch (status) {
        case 'completed':
            return {
                ring: 'ring-emerald-400',
                bg: 'bg-gradient-to-br from-emerald-50 to-emerald-100',
                glow: 'shadow-[0_0_20px_rgba(16,185,129,0.3)]',
                icon: <CheckCircleIcon className="w-5 h-5 text-emerald-500" />,
                labelColor: 'text-emerald-700',
                animation: ''
            };
        case 'in-progress':
            return {
                ring: 'ring-primary',
                bg: 'bg-gradient-to-br from-primary/10 to-primary/20',
                glow: 'shadow-[0_0_25px_rgba(var(--color-primary-rgb),0.4)]',
                icon: <ClockIcon className="w-5 h-5 text-primary animate-pulse" />,
                labelColor: 'text-primary',
                animation: 'animate-pulse'
            };
        case 'locked':
            return {
                ring: 'ring-gray-300',
                bg: 'bg-gradient-to-br from-gray-50 to-gray-100',
                glow: '',
                icon: <LockClosedIcon className="w-4 h-4 text-gray-400" />,
                labelColor: 'text-gray-400',
                animation: ''
            };
        case 'issue':
            return {
                ring: 'ring-amber-400',
                bg: 'bg-gradient-to-br from-amber-50 to-amber-100',
                glow: 'shadow-[0_0_20px_rgba(245,158,11,0.3)]',
                icon: <ExclamationTriangleIcon className="w-5 h-5 text-amber-500" />,
                labelColor: 'text-amber-700',
                animation: ''
            };
    }
};

const JourneyNode: React.FC<JourneyNodeProps> = ({
    stage,
    isActive = false,
    onClick,
    position,
    isLast = false
}) => {
    const styles = getStatusStyles(stage.status);
    const isClickable = stage.status !== 'locked';

    return (
        <div
            className={`
                relative flex flex-col items-center
                ${position === 'left' ? 'items-start' : position === 'right' ? 'items-end' : 'items-center'}
            `}
        >
            {/* Main Node */}
            <button
                onClick={isClickable ? onClick : undefined}
                disabled={!isClickable}
                className={`
                    relative group
                    w-20 h-20 md:w-24 md:h-24
                    rounded-2xl ${styles.bg}
                    ring-4 ${styles.ring}
                    ${styles.glow}
                    transition-all duration-500 ease-out
                    ${isClickable ? 'cursor-pointer hover:scale-105 hover:ring-opacity-100' : 'cursor-default opacity-60'}
                    ${isActive ? 'scale-105 ring-opacity-100' : 'ring-opacity-70'}
                    flex flex-col items-center justify-center gap-1
                    backdrop-blur-sm
                `}
            >
                {/* Role Avatar */}
                <RoleAvatar
                    role={stage.responsibleRole}
                    size="md"
                    showTooltip={false}
                />

                {/* Status Badge */}
                <div className={`
                    absolute -top-2 -right-2
                    w-7 h-7 rounded-full
                    bg-white shadow-lg
                    flex items-center justify-center
                    ${styles.animation}
                `}>
                    {styles.icon}
                </div>

                {/* Progress indicator for in-progress stages */}
                {stage.status === 'in-progress' && stage.progressPercent !== undefined && (
                    <div className="absolute -bottom-1 left-2 right-2">
                        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary rounded-full transition-all duration-1000"
                                style={{ width: `${stage.progressPercent}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Hover glow effect */}
                {isClickable && (
                    <div className="
                        absolute inset-0 rounded-2xl
                        bg-gradient-to-br from-white/0 to-white/0
                        group-hover:from-white/20 group-hover:to-transparent
                        transition-all duration-300
                        pointer-events-none
                    " />
                )}
            </button>

            {/* Stage Label */}
            <div className={`
                mt-3 text-center max-w-[100px] md:max-w-[120px]
                transition-all duration-300
                ${isActive ? 'scale-105' : ''}
            `}>
                <p className={`
                    text-xs md:text-sm font-bold leading-tight
                    ${styles.labelColor}
                `}>
                    {stage.name}
                </p>
                {stage.status === 'in-progress' && stage.expectedEndDate && (
                    <p className="text-[10px] text-gray-500 mt-1">
                        Expected: {new Date(stage.expectedEndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                )}
                {stage.status === 'completed' && stage.actualEndDate && (
                    <p className="text-[10px] text-emerald-600 mt-1 flex items-center justify-center gap-1">
                        <CheckCircleIcon className="w-3 h-3" />
                        {new Date(stage.actualEndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                )}
            </div>
        </div>
    );
};

export default JourneyNode;
