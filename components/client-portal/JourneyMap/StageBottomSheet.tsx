import React from 'react';
import {
    XMarkIcon,
    CalendarIcon,
    UserIcon,
    DocumentTextIcon,
    PhotoIcon,
    CheckCircleIcon
} from '@heroicons/react/24/outline';
import { JourneyStage, ROLE_CONFIGS } from '../types';

interface StageBottomSheetProps {
    stage: JourneyStage | null;
    isOpen: boolean;
    onClose: () => void;
}

const StageBottomSheet: React.FC<StageBottomSheetProps> = ({
    stage,
    isOpen,
    onClose
}) => {
    if (!stage) return null;

    const roleConfig = ROLE_CONFIGS[stage.responsibleRole];

    // Simple status text
    const getStatusText = () => {
        if (stage.status === 'completed') return { text: 'Completed', color: 'text-emerald-600', bg: 'bg-emerald-100' };
        if (stage.status === 'in-progress') return { text: 'In Progress', color: 'text-primary', bg: 'bg-primary/10' };
        if (stage.status === 'issue') return { text: 'Needs Attention', color: 'text-red-600', bg: 'bg-red-100' };
        return { text: 'Upcoming', color: 'text-gray-600', bg: 'bg-gray-100' };
    };

    const statusInfo = getStatusText();

    return (
        <>
            {/* Backdrop */}
            <div
                className={`
                    fixed inset-0 bg-black/30 backdrop-blur-sm z-40
                    transition-opacity duration-300
                    ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
                `}
                onClick={onClose}
            />

            {/* Bottom Sheet */}
            <div className={`
                fixed bottom-0 left-0 right-0 z-50
                bg-white rounded-t-3xl shadow-2xl
                transform transition-transform duration-300 ease-out
                ${isOpen ? 'translate-y-0' : 'translate-y-full'}
                max-h-[70vh] overflow-hidden
            `}>
                {/* Handle */}
                <div className="flex justify-center py-3">
                    <div className="w-10 h-1 bg-gray-300 rounded-full" />
                </div>

                {/* Header */}
                <div className="px-6 pb-4 border-b border-gray-100">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-900">{stage.name}</h3>
                            <span className={`inline-block mt-2 px-3 py-1 ${statusInfo.bg} ${statusInfo.color} text-xs font-medium rounded-full`}>
                                {statusInfo.text}
                            </span>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                        >
                            <XMarkIcon className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                </div>

                {/* Content - Simple & Clear */}
                <div className="px-6 py-5 space-y-5 overflow-y-auto max-h-[50vh]">

                    {/* What's Happening */}
                    <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                            What's Happening
                        </h4>
                        <p className="text-sm text-gray-700 leading-relaxed">
                            {stage.description}
                        </p>
                    </div>

                    {/* Who's Responsible */}
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                        <div
                            className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold"
                            style={{ backgroundColor: roleConfig.color }}
                        >
                            {stage.assigneeName?.charAt(0) || roleConfig.label.charAt(0)}
                        </div>
                        <div>
                            <p className="font-semibold text-gray-800">
                                {stage.assigneeName || roleConfig.label}
                            </p>
                            <p className="text-xs text-gray-500">{roleConfig.label}</p>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="grid grid-cols-2 gap-3">
                        {stage.startDate && (
                            <div className="p-3 bg-gray-50 rounded-xl">
                                <div className="flex items-center gap-2 text-gray-400 mb-1">
                                    <CalendarIcon className="w-4 h-4" />
                                    <span className="text-xs font-medium">Started</span>
                                </div>
                                <p className="text-sm font-semibold text-gray-800">
                                    {new Date(stage.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </p>
                            </div>
                        )}
                        {(stage.actualEndDate || stage.expectedEndDate) && (
                            <div className={`p-3 rounded-xl ${stage.actualEndDate ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                                <div className="flex items-center gap-2 mb-1">
                                    <CheckCircleIcon className={`w-4 h-4 ${stage.actualEndDate ? 'text-emerald-500' : 'text-amber-500'}`} />
                                    <span className={`text-xs font-medium ${stage.actualEndDate ? 'text-emerald-600' : 'text-amber-600'}`}>
                                        {stage.actualEndDate ? 'Completed' : 'Expected'}
                                    </span>
                                </div>
                                <p className={`text-sm font-semibold ${stage.actualEndDate ? 'text-emerald-700' : 'text-amber-700'}`}>
                                    {new Date(stage.actualEndDate || stage.expectedEndDate!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Files / Photos (if any) */}
                    {stage.outputs && stage.outputs.length > 0 && (
                        <div>
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                                Files & Photos
                            </h4>
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {stage.outputs.map((output) => (
                                    <button
                                        key={output.id}
                                        className="flex-shrink-0 p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors flex items-center gap-2"
                                    >
                                        {output.type === 'photo' || output.type === 'render' ? (
                                            <PhotoIcon className="w-5 h-5 text-blue-500" />
                                        ) : (
                                            <DocumentTextIcon className="w-5 h-5 text-gray-500" />
                                        )}
                                        <span className="text-xs font-medium text-gray-700 truncate max-w-[120px]">
                                            {output.name}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Notes */}
                    {stage.notes && (
                        <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                            <p className="text-sm text-blue-800">
                                💡 {stage.notes}
                            </p>
                        </div>
                    )}
                </div>

                {/* Action Button (if in progress) */}
                {stage.status === 'in-progress' && stage.clientActions && stage.clientActions.length > 0 && (
                    <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
                        <button className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors">
                            View Details & Take Action
                        </button>
                    </div>
                )}
            </div>
        </>
    );
};

export default StageBottomSheet;
