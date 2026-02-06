import React from 'react';
import {
    BriefcaseIcon,
    PaintBrushIcon,
    WrenchScrewdriverIcon,
    BuildingOfficeIcon,
    CalculatorIcon,
    WrenchIcon
} from '@heroicons/react/24/outline';
import { ResponsibleRole, ROLE_CONFIGS } from '../types';

interface RoleAvatarProps {
    role: ResponsibleRole;
    name?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    showLabel?: boolean;
    showTooltip?: boolean;
    className?: string;
}

const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
};

const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8'
};

const labelSizeClasses = {
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-sm',
    xl: 'text-base'
};

const getRoleIcon = (role: ResponsibleRole, className: string) => {
    const icons: Record<ResponsibleRole, React.ReactNode> = {
        consultant: <BriefcaseIcon className={className} />,
        designer: <PaintBrushIcon className={className} />,
        engineer: <WrenchScrewdriverIcon className={className} />,
        factory: <BuildingOfficeIcon className={className} />,
        installer: <WrenchIcon className={className} />,
        accounts: <CalculatorIcon className={className} />
    };
    return icons[role];
};

const RoleAvatar: React.FC<RoleAvatarProps> = ({
    role,
    name,
    size = 'md',
    showLabel = false,
    showTooltip = true,
    className = ''
}) => {
    const config = ROLE_CONFIGS[role];

    return (
        <div className={`group relative inline-flex flex-col items-center ${className}`}>
            {/* Avatar Circle */}
            <div
                className={`
                    ${sizeClasses[size]}
                    rounded-full flex items-center justify-center
                    transition-all duration-300 ease-out
                    group-hover:scale-110 group-hover:shadow-lg
                    ring-2 ring-white shadow-md
                `}
                style={{
                    backgroundColor: config.bgColor,
                    boxShadow: `0 4px 12px ${config.color}20`
                }}
            >
                <div style={{ color: config.color }}>
                    {getRoleIcon(role, iconSizeClasses[size])}
                </div>
            </div>

            {/* Label (optional) */}
            {showLabel && (
                <span
                    className={`
                        mt-1.5 font-medium text-center leading-tight
                        ${labelSizeClasses[size]}
                    `}
                    style={{ color: config.color }}
                >
                    {name || config.label}
                </span>
            )}

            {/* Tooltip on hover */}
            {showTooltip && !showLabel && (
                <div className="
                    absolute -bottom-12 left-1/2 -translate-x-1/2
                    opacity-0 group-hover:opacity-100
                    transition-all duration-200
                    pointer-events-none z-50
                ">
                    <div className="
                        bg-gray-900 text-white text-xs font-medium
                        px-3 py-2 rounded-lg shadow-xl
                        whitespace-nowrap
                    ">
                        <p className="font-bold">{config.label}</p>
                        {name && <p className="text-gray-300 text-[10px] mt-0.5">{name}</p>}
                        {/* Tooltip arrow */}
                        <div className="
                            absolute -top-1 left-1/2 -translate-x-1/2
                            w-2 h-2 bg-gray-900 rotate-45
                        " />
                    </div>
                </div>
            )}
        </div>
    );
};

export default RoleAvatar;
