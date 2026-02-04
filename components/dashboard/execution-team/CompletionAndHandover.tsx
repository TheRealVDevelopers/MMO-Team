import React, { useState, useEffect, useMemo } from 'react';
import {
    CheckCircleIcon,
    ClipboardDocumentCheckIcon,
    ArrowTopRightOnSquareIcon,
    DocumentTextIcon
} from '@heroicons/react/24/outline';
import { Project, ExecutionStage } from '../../../types';
import { useProjects } from '../../../hooks/useProjects';
import { updateProjectStage } from '../../../hooks/useProjects';
import { useAuth } from '../../../context/AuthContext';

interface CompletionAndHandoverProps {
    project: Project;
}

const CompletionAndHandover: React.FC<CompletionAndHandoverProps> = ({ project }) => {
    const { updateProject } = useProjects();
    const { currentUser } = useAuth();
    const [isGenerating, setIsGenerating] = useState(false);

    // ✅ USE REAL PROJECT STAGES - No more demo data
    const stages = project.stages || [];

    // Calculate overall progress based on completed stages
    const progress = stages.length > 0 
        ? Math.round((stages.filter(s => s.status === 'Completed').length / stages.length) * 100)
        : 0;

    const handleToggleStageStatus = async (stageId: string) => {
        try {
            const stage = stages.find(s => s.id === stageId);
            if (!stage) return;

            // ✅ CYCLE THROUGH 3 STATES: Pending → In Progress → Completed → Pending
            const nextStatus: 'Pending' | 'In Progress' | 'Completed' = stage.status === 'Pending' ? 'In Progress' : 
                             stage.status === 'In Progress' ? 'Completed' : 'Pending';

            console.log('✅ [CompletionHandover] Toggling stage status:', {
                stageId,
                stageName: stage.name,
                currentStatus: stage.status,
                nextStatus
            });

            // ✅ UPDATE STAGE STATUS DIRECTLY IN FIRESTORE
            const updatedStages = stages.map(s =>
                s.id === stageId ? { ...s, status: nextStatus } : s
            );

            await updateProject(project.id, {
                stages: updatedStages
            });
            
            console.log('✅ [CompletionHandover] Stage status updated successfully in Firestore');
        } catch (error) {
            console.error('❌ [CompletionHandover] Failed to update stage status:', error);
            alert('Failed to update stage status');
        }
    };

    const handleGenerateHandoverDocs = async () => {
        if (progress < 100) {
            alert('Please complete all phases before generating handover documents.');
            return;
        }

        setIsGenerating(true);
        try {
            // Update project status to COMPLETED
            await updateProject(project.id, {
                status: 'Completed' as any,
                completedAt: new Date().toISOString(),
                completedBy: currentUser?.id || 'unknown'
            });
            
            alert('✅ Handover documents generated!\n\nProject marked as COMPLETED.\n\nDocuments available in project files.');
        } catch (error) {
            console.error('Failed to generate handover docs:', error);
            alert('Failed to generate handover documents');
        } finally {
            setIsGenerating(false);
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'Completed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200';
            case 'In Progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400 border-gray-200';
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <ClipboardDocumentCheckIcon className="w-6 h-6 text-emerald-600" />
                        Project Completion & Handover - {project.projectName}
                    </h3>
                    <p className="text-gray-500">Track all execution phases before final handover.</p>
                </div>

                <div className="flex items-center gap-2">
                    <div className="text-right mr-2">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{progress}% Complete</div>
                        <div className="text-xs text-gray-500">{stages.filter(s => s.status === 'Completed').length}/{stages.length} Phases</div>
                    </div>
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${progress}%` }} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="p-4 bg-gray-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-gray-700 font-semibold text-gray-700 dark:text-gray-200">
                            Execution Phases Checklist
                        </div>
                        
                        {stages.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <p>No execution phases defined for this project.</p>
                                <p className="text-sm mt-2">Create phases in the Timeline tab.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                {stages.map((stage, index) => (
                                    <div key={stage.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors group">
                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={() => handleToggleStageStatus(stage.id)}
                                                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                                    stage.status === 'Completed' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300 hover:border-emerald-400'
                                                }`}
                                            >
                                                {stage.status === 'Completed' && <CheckCircleIcon className="w-4 h-4" />}
                                            </button>
                                            <div>
                                                <div className="flex items-center gap-3">
                                                    <span className="w-8 h-8 bg-primary/20 text-primary rounded-full flex items-center justify-center font-bold text-sm">
                                                        {index + 1}
                                                    </span>
                                                    <p className={`font-medium ${
                                                        stage.status === 'Completed' ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-white'
                                                    }`}>
                                                        {stage.name}
                                                    </p>
                                                </div>
                                                {stage.description && (
                                                    <p className="text-xs text-gray-500 mt-1 ml-11">{stage.description}</p>
                                                )}
                                                <div className="flex items-center gap-3 text-xs text-gray-400 mt-1 ml-11">
                                                    <span>Duration: {stage.durationDays || 7} days</span>
                                                    {stage.completedAt && (
                                                        <span className="text-emerald-600">• Completed {new Date(stage.completedAt).toLocaleDateString()}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusStyle(stage.status || 'Pending')}`}>
                                            {stage.status || 'Pending'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 p-6 rounded-xl border border-emerald-100 dark:border-emerald-800/30">
                        <h4 className="font-bold text-emerald-900 dark:text-emerald-100 mb-4">Start Completion Phase?</h4>
                        <p className="text-sm text-emerald-700 dark:text-emerald-300/80 mb-6">
                            Once all checklist items are verified, generate the final handover report and initiate the warranty period.
                        </p>
                        <button
                            onClick={handleGenerateHandoverDocs}
                            disabled={progress < 100 || isGenerating}
                            className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isGenerating ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <DocumentTextIcon className="w-5 h-5" />
                                    Generate Handover Docs
                                </>
                            )}
                        </button>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                        <h4 className="font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h4>
                        <div className="space-y-3">
                            <button className="w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-slate-700 rounded-lg flex items-center justify-between text-sm group transition-colors">
                                <span className="text-gray-600 dark:text-gray-300">View Warranty Policy</span>
                                <ArrowTopRightOnSquareIcon className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                            </button>
                            <button className="w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-slate-700 rounded-lg flex items-center justify-between text-sm group transition-colors">
                                <span className="text-gray-600 dark:text-gray-300">Email Client Update</span>
                                <ArrowTopRightOnSquareIcon className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CompletionAndHandover;
