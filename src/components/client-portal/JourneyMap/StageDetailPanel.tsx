import React from 'react';
import {
    XMarkIcon,
    CalendarIcon,
    ClockIcon,
    DocumentTextIcon,
    PhotoIcon,
    PlayCircleIcon,
    EyeIcon,
    ChatBubbleLeftRightIcon,
    CheckCircleIcon,
    QuestionMarkCircleIcon,
    ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';
import RoleAvatar from '../RoleAvatars/RoleAvatar';
import { JourneyStage, StageOutput, ClientAction, ROLE_CONFIGS } from '../types';

interface StageDetailPanelProps {
    stage: JourneyStage | null;
    isOpen: boolean;
    onClose: () => void;
    onAction?: (action: string) => void;
}

const getOutputIcon = (type: StageOutput['type']) => {
    switch (type) {
        case 'render':
        case 'photo':
            return <PhotoIcon className="w-5 h-5" />;
        case 'video':
            return <PlayCircleIcon className="w-5 h-5" />;
        case 'document':
        default:
            return <DocumentTextIcon className="w-5 h-5" />;
    }
};

const getActionConfig = (action: ClientAction) => {
    const configs: Record<ClientAction, { icon: React.ReactNode; label: string; color: string }> = {
        view: {
            icon: <EyeIcon className="w-4 h-4" />,
            label: 'View Files',
            color: 'bg-blue-500 hover:bg-blue-600'
        },
        comment: {
            icon: <ChatBubbleLeftRightIcon className="w-4 h-4" />,
            label: 'Add Comment',
            color: 'bg-purple-500 hover:bg-purple-600'
        },
        approve: {
            icon: <CheckCircleIcon className="w-4 h-4" />,
            label: 'Approve',
            color: 'bg-emerald-500 hover:bg-emerald-600'
        },
        question: {
            icon: <QuestionMarkCircleIcon className="w-4 h-4" />,
            label: 'Ask Question',
            color: 'bg-amber-500 hover:bg-amber-600'
        }
    };
    return configs[action];
};

const StageDetailPanel: React.FC<StageDetailPanelProps> = ({
    stage,
    isOpen,
    onClose,
    onAction
}) => {
    if (!stage) return null;

    const roleConfig = ROLE_CONFIGS[stage.responsibleRole];

    return (
        <>
            {/* Backdrop */}
            <div
                className={`
                    fixed inset-0 bg-black/40 backdrop-blur-sm z-40
                    transition-opacity duration-300
                    ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
                `}
                onClick={onClose}
            />

            {/* Panel */}
            <div className={`
                fixed top-0 right-0 bottom-0 w-full max-w-md
                bg-white shadow-2xl z-50
                transform transition-transform duration-300 ease-out
                ${isOpen ? 'translate-x-0' : 'translate-x-full'}
                flex flex-col overflow-hidden
            `}>
                {/* Header */}
                <div
                    className="px-6 py-5 border-b border-gray-100"
                    style={{ backgroundColor: roleConfig.bgColor }}
                >
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <RoleAvatar
                                role={stage.responsibleRole}
                                size="lg"
                                showTooltip={false}
                            />
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">
                                    {stage.name}
                                </h2>
                                <p className="text-sm text-gray-600 mt-1">
                                    {roleConfig.label}
                                    {stage.assigneeName && (
                                        <span className="font-medium"> • {stage.assigneeName}</span>
                                    )}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl hover:bg-white/50 transition-colors"
                        >
                            <XMarkIcon className="w-6 h-6 text-gray-500" />
                        </button>
                    </div>

                    {/* Status Badge */}
                    <div className="mt-4">
                        <span className={`
                            inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
                            ${stage.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                stage.status === 'in-progress' ? 'bg-primary/10 text-primary' :
                                    stage.status === 'issue' ? 'bg-amber-100 text-amber-700' :
                                        'bg-gray-100 text-gray-600'}
                        `}>
                            {stage.status === 'completed' && <CheckCircleSolid className="w-4 h-4" />}
                            {stage.status === 'in-progress' && <ClockIcon className="w-4 h-4 animate-pulse" />}
                            {stage.status.charAt(0).toUpperCase() + stage.status.slice(1).replace('-', ' ')}
                        </span>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Description */}
                    <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                            What's Happening
                        </h4>
                        <p className="text-sm text-gray-700 leading-relaxed">
                            {stage.description}
                        </p>
                        {stage.notes && (
                            <p className="text-sm text-gray-600 mt-2 p-3 bg-gray-50 rounded-xl">
                                <span className="font-medium text-gray-800">Note:</span> {stage.notes}
                            </p>
                        )}
                    </div>

                    {/* Timeline */}
                    <div className="grid grid-cols-2 gap-4">
                        {stage.startDate && (
                            <div className="p-4 bg-gray-50 rounded-xl">
                                <div className="flex items-center gap-2 text-gray-500 mb-1">
                                    <CalendarIcon className="w-4 h-4" />
                                    <span className="text-xs font-medium uppercase tracking-wider">Started</span>
                                </div>
                                <p className="text-sm font-bold text-gray-800">
                                    {new Date(stage.startDate).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric'
                                    })}
                                </p>
                            </div>
                        )}

                        {(stage.expectedEndDate || stage.actualEndDate) && (
                            <div className={`p-4 rounded-xl ${stage.actualEndDate ? 'bg-emerald-50' : 'bg-primary/5'}`}>
                                <div className="flex items-center gap-2 mb-1">
                                    <ClockIcon className={`w-4 h-4 ${stage.actualEndDate ? 'text-emerald-500' : 'text-primary'}`} />
                                    <span className={`text-xs font-medium uppercase tracking-wider ${stage.actualEndDate ? 'text-emerald-600' : 'text-primary'}`}>
                                        {stage.actualEndDate ? 'Completed' : 'Expected'}
                                    </span>
                                </div>
                                <p className={`text-sm font-bold ${stage.actualEndDate ? 'text-emerald-700' : 'text-gray-800'}`}>
                                    {new Date(stage.actualEndDate || stage.expectedEndDate!).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric'
                                    })}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Progress (for in-progress stages) */}
                    {stage.status === 'in-progress' && stage.progressPercent !== undefined && (
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Progress
                                </h4>
                                <span className="text-sm font-bold text-primary">{stage.progressPercent}%</span>
                            </div>
                            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-1000 ease-out"
                                    style={{ width: `${stage.progressPercent}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Outputs/Files */}
                    {stage.outputs && stage.outputs.length > 0 && (
                        <div>
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                                Deliverables & Files
                            </h4>
                            <div className="space-y-2">
                                {stage.outputs.map((output) => (
                                    <div
                                        key={output.id}
                                        className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer group"
                                    >
                                        {output.thumbnail ? (
                                            <img
                                                src={output.thumbnail}
                                                alt={output.name}
                                                className="w-12 h-12 rounded-lg object-cover"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center text-gray-500">
                                                {getOutputIcon(output.type)}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-800 truncate">
                                                {output.name}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {new Date(output.uploadedAt).toLocaleDateString()} • {output.type}
                                            </p>
                                        </div>
                                        <button className="p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <ArrowDownTrayIcon className="w-5 h-5 text-gray-400 hover:text-primary" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions Footer */}
                {stage.clientActions && stage.clientActions.length > 0 && (
                    <div className="p-6 border-t border-gray-100 bg-gray-50">
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                            Actions Available
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                            {stage.clientActions.map((action) => {
                                const config = getActionConfig(action);
                                return (
                                    <button
                                        key={action}
                                        onClick={() => onAction?.(action)}
                                        className={`
                                            flex items-center justify-center gap-2
                                            px-4 py-3 rounded-xl text-white text-sm font-medium
                                            transition-all duration-200
                                            ${config.color}
                                        `}
                                    >
                                        {config.icon}
                                        {config.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default StageDetailPanel;
