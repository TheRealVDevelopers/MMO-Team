/**
 * Lead Journey Editor (Staff Side)
 * Manages the full gated approval workflow:
 *   Call Initiated → Site Visit → Recce Report → 2D Drawing → 3D Drawing → BOQ → Quotation → PO
 * 
 * Each document stage supports:
 * - Staff uploads documents (revisions)
 * - Audit trail of all revisions with client feedback
 * - Visual status: Approved / Rejected / Pending / Awaiting Upload
 * - Gated progression: next stage unlocks only when current is approved
 */

import React, { useState, useRef } from 'react';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../../../firebase';
import { Case, LeadJourneyDocStage, LeadJourneySubmission } from '../../../../types';
import { uploadCaseDocuments } from '../../../../services/storageService';
import { formatDate } from '../../../../constants';
import {
    CheckCircleIcon as CheckSolid,
    ClockIcon as ClockSolid,
} from '@heroicons/react/24/solid';
import {
    PencilIcon,
    ArrowUpTrayIcon,
    DocumentTextIcon,
    CheckCircleIcon,
    XCircleIcon,
    ChevronDownIcon,
    ChevronRightIcon,
    ExclamationCircleIcon,
    LockClosedIcon,
    EyeIcon,
    ChatBubbleLeftEllipsisIcon,
} from '@heroicons/react/24/outline';

interface LeadJourneyEditorProps {
    caseData: Case;
}

/** The ordered list of all lead journey stages */
const LEAD_STAGES = [
    { key: 'recce_report', label: 'Recce / Site Measurement Report', icon: DocumentTextIcon },
    { key: '2d_drawing', label: '2D Layout / Floor Plan', icon: DocumentTextIcon },
    { key: '3d_drawing', label: '3D Visualization / Renders', icon: DocumentTextIcon },
    { key: 'boq', label: 'Bill of Quantities (BOQ)', icon: DocumentTextIcon },
    { key: 'quotation', label: 'Quotation / Proposal', icon: DocumentTextIcon },
    { key: 'purchase_order', label: 'Purchase Order (PO)', icon: DocumentTextIcon },
] as const;

/** Simple date milestones (no document upload needed) */
const MILESTONE_STEPS = [
    { key: 'callInitiated', label: 'Call / Inquiry Initiated' },
    { key: 'siteVisitScheduled', label: 'Site Visit Scheduled' },
    { key: 'siteVisitCompleted', label: 'Site Visit Completed' },
] as const;

const LeadJourneyEditor: React.FC<LeadJourneyEditorProps> = ({ caseData }) => {
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState<string | null>(null);
    const [expandedStage, setExpandedStage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [activeUploadKey, setActiveUploadKey] = useState<string | null>(null);

    const activeLeadType = caseData.leadType === 'MFD' ? 'MFD' : 'SFD';

    const activeStages = activeLeadType === 'MFD'
        ? LEAD_STAGES.filter(s => ['quotation', 'purchase_order'].includes(s.key))
        : LEAD_STAGES;

    const activeMilestones = activeLeadType === 'MFD'
        ? MILESTONE_STEPS.filter(m => m.key === 'callInitiated')
        : MILESTONE_STEPS;

    const journey = caseData.leadJourney || {};
    const stages = (journey as any).stages || {} as Record<string, LeadJourneyDocStage>;

    // Check if a milestone is completed
    const isMilestoneDone = (key: string) => !!(journey as any)[key];
    const getMilestoneDate = (v: any): Date | null => {
        if (!v) return null;
        if (v instanceof Timestamp) return v.toDate();
        if (v instanceof Date) return v;
        return new Date(v);
    };

    // Check if all milestones are done
    const allMilestonesDone = activeMilestones.every(m => isMilestoneDone(m.key));

    // Get stage data or default
    const getStage = (key: string): LeadJourneyDocStage => {
        return stages[key] || { label: '', status: 'not_started', submissions: [] };
    };

    // Check if a document stage is unlocked (previous stage must be approved)
    const isStageUnlocked = (idx: number): boolean => {
        if (!allMilestonesDone) return false;
        if (idx === 0) return true;
        const prevKey = activeStages[idx - 1].key;
        const prevStage = getStage(prevKey);
        return prevStage.status === 'approved';
    };

    // Handle milestone mark done
    const handleMarkMilestone = async (key: string) => {
        if (!confirm(`Mark "${MILESTONE_STEPS.find(m => m.key === key)?.label}" as done?`)) return;
        setLoading(true);
        try {
            const caseRef = doc(db as any, 'cases', caseData.id);
            await updateDoc(caseRef, {
                [`leadJourney.${key}`]: Timestamp.fromDate(new Date()),
                updatedAt: Timestamp.now(),
            });
        } catch (error) {
            console.error('Error updating milestone:', error);
            alert('Failed to update milestone.');
        } finally {
            setLoading(false);
        }
    };

    // Handle document upload for a stage
    const handleUploadForStage = (stageKey: string) => {
        setActiveUploadKey(stageKey);
        fileInputRef.current?.click();
    };

    const handleFileSelected = async (files: FileList | null) => {
        if (!files || !activeUploadKey) return;
        setUploading(activeUploadKey);
        try {
            const fileArr = Array.from(files);
            const results = await uploadCaseDocuments(caseData.id, fileArr);

            const stage = getStage(activeUploadKey);
            const nextVersion = (stage.submissions?.length || 0) + 1;

            const newSubmission: any = {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                version: nextVersion,
                fileUrl: results[0].url,
                fileName: fileArr[0].name,
                fileSize: `${(results[0].fileSize / 1024).toFixed(0)} KB`,
                uploadedAt: new Date().toISOString(),
                uploadedBy: 'Staff',
                approvalStatus: 'pending',
            };

            const updatedSubmissions = [...(stage.submissions || []), newSubmission];
            const stageLabel = activeStages.find(s => s.key === activeUploadKey)?.label || activeUploadKey;

            const caseRef = doc(db as any, 'cases', caseData.id);
            await updateDoc(caseRef, {
                [`leadJourney.stages.${activeUploadKey}`]: {
                    label: stageLabel,
                    status: 'awaiting_approval',
                    submissions: updatedSubmissions,
                },
                [`leadJourney.currentStageKey`]: activeUploadKey,
                updatedAt: Timestamp.now(),
            });
        } catch (error) {
            console.error('Error uploading document:', error);
            alert('Failed to upload document.');
        } finally {
            setUploading(null);
            setActiveUploadKey(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // Status badge component
    const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
        const configs: Record<string, { bg: string; text: string; label: string }> = {
            not_started: { bg: 'bg-slate-100', text: 'text-slate-500', label: 'Not Started' },
            awaiting_upload: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Awaiting Upload' },
            awaiting_approval: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Awaiting Approval' },
            approved: { bg: 'bg-green-100', text: 'text-green-700', label: 'Approved' },
            rejected: { bg: 'bg-red-100', text: 'text-red-700', label: 'Revision Required' },
            pending: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Pending Review' },
        };
        const c = configs[status] || configs.not_started;
        return (
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${c.bg} ${c.text}`}>
                {c.label}
            </span>
        );
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.dwg"
                className="hidden"
                onChange={(e) => handleFileSelected(e.target.files)}
            />

            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-violet-50 text-violet-600">
                    <DocumentTextIcon className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-800">Lead Journey</h3>
                    <p className="text-xs text-slate-500">Manage client approval workflow</p>
                </div>
            </div>

            {/* ── Section 1: Milestones (Call, Site Visit) ── */}
            <div className="space-y-2 mb-6">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Initial Contact</p>
                {activeMilestones.map((ms) => {
                    const done = isMilestoneDone(ms.key);
                    const dateVal = getMilestoneDate((journey as any)[ms.key]);
                    return (
                        <div key={ms.key} className="flex items-center gap-4 p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                            <div className={`p-1.5 rounded-full ${done ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
                                {done ? <CheckSolid className="w-4 h-4" /> : <ClockSolid className="w-4 h-4" />}
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-slate-800 text-sm">{ms.label}</p>
                                {done && dateVal && (
                                    <p className="text-xs text-emerald-600 font-medium">Completed {formatDate(dateVal)}</p>
                                )}
                                {!done && <p className="text-xs text-slate-500">Pending</p>}
                            </div>
                            {!done && (
                                <button
                                    onClick={() => handleMarkMilestone(ms.key)}
                                    disabled={loading}
                                    className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                                >
                                    Mark Done
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* ── Section 2: Document Stages (gated) ── */}
            <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Document Stages</p>

                {!allMilestonesDone && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-100 text-sm text-amber-700">
                        <ExclamationCircleIcon className="w-5 h-5 flex-shrink-0" />
                        <span>Complete all milestones above to unlock document stages.</span>
                    </div>
                )}

                {activeStages.map((stg, idx) => {
                    const stage = getStage(stg.key);
                    const unlocked = isStageUnlocked(idx);
                    const isExpanded = expandedStage === stg.key;
                    const submissions = stage.submissions || [];
                    const latestSubmission = submissions[submissions.length - 1];
                    const isUploading = uploading === stg.key;
                    const effectiveStatus = stage.status || 'not_started';

                    // If latest submission was rejected, stage is effectively "rejected" (re-upload needed)
                    const isRejected = latestSubmission?.approvalStatus === 'rejected';
                    const isApproved = effectiveStatus === 'approved';
                    const isPending = latestSubmission?.approvalStatus === 'pending';

                    return (
                        <div key={stg.key} className={`rounded-xl border transition-all ${isApproved
                            ? 'border-emerald-200 bg-emerald-50/30'
                            : isRejected
                                ? 'border-red-200 bg-red-50/20'
                                : !unlocked
                                    ? 'border-slate-100 bg-slate-50/30 opacity-60'
                                    : 'border-slate-200 bg-white'
                            }`}>
                            {/* Stage header */}
                            <div
                                onClick={() => unlocked && setExpandedStage(isExpanded ? null : stg.key)}
                                role="button"
                                tabIndex={unlocked ? 0 : -1}
                                className={`w-full flex items-center gap-3 p-4 text-left ${unlocked ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
                            >
                                {/* Status icon */}
                                <div className={`p-2 rounded-lg ${isApproved
                                    ? 'bg-emerald-100 text-emerald-600'
                                    : isRejected
                                        ? 'bg-red-100 text-red-600'
                                        : isPending
                                            ? 'bg-blue-100 text-blue-600'
                                            : !unlocked
                                                ? 'bg-slate-100 text-slate-300'
                                                : 'bg-slate-100 text-slate-400'
                                    }`}>
                                    {isApproved ? <CheckSolid className="w-5 h-5" />
                                        : !unlocked ? <LockClosedIcon className="w-5 h-5" />
                                            : <stg.icon className="w-5 h-5" />}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className={`font-semibold text-sm ${unlocked ? 'text-slate-800' : 'text-slate-400'}`}>
                                            {stg.label}
                                        </span>
                                        <StatusBadge status={isRejected ? 'rejected' : effectiveStatus} />
                                    </div>
                                    {submissions.length > 0 && (
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            {submissions.length} revision{submissions.length !== 1 ? 's' : ''}
                                            {latestSubmission?.approvalStatus === 'rejected' && latestSubmission.clientRemarks && (
                                                <span className="text-red-500 ml-2">
                                                    · Client: "{latestSubmission.clientRemarks}"
                                                </span>
                                            )}
                                        </p>
                                    )}
                                </div>

                                {/* Upload button (when unlocked and not approved) */}
                                {unlocked && !isApproved && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleUploadForStage(stg.key); }}
                                        disabled={isUploading}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                                    >
                                        {isUploading ? (
                                            <span className="flex items-center gap-1">
                                                <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                                Uploading...
                                            </span>
                                        ) : (
                                            <>
                                                <ArrowUpTrayIcon className="w-3.5 h-3.5" />
                                                {isRejected ? 'Re-upload' : submissions.length > 0 ? 'New Rev' : 'Upload'}
                                            </>
                                        )}
                                    </button>
                                )}

                                {unlocked && (
                                    <span className="ml-1">
                                        {isExpanded ? <ChevronDownIcon className="w-4 h-4 text-slate-400" /> : <ChevronRightIcon className="w-4 h-4 text-slate-400" />}
                                    </span>
                                )}
                            </div>

                            {/* Expanded: Revision history */}
                            {isExpanded && unlocked && (
                                <div className="px-4 pb-4 border-t border-slate-100">
                                    {submissions.length === 0 ? (
                                        <div className="text-center py-6 text-sm text-slate-400">
                                            <ArrowUpTrayIcon className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                                            No documents uploaded yet. Upload to send to client for approval.
                                        </div>
                                    ) : (
                                        <div className="space-y-3 mt-3">
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Revision History</p>
                                            {[...submissions].reverse().map((sub: any, rIdx: number) => {
                                                const rev = submissions.length - rIdx;
                                                return (
                                                    <div key={sub.id} className={`flex items-start gap-3 p-3 rounded-lg border ${sub.approvalStatus === 'approved'
                                                        ? 'bg-emerald-50 border-emerald-200'
                                                        : sub.approvalStatus === 'rejected'
                                                            ? 'bg-red-50 border-red-200'
                                                            : 'bg-white border-slate-100'
                                                        }`}>
                                                        {/* Rev icon */}
                                                        <div className={`p-1.5 rounded-full flex-shrink-0 mt-0.5 ${sub.approvalStatus === 'approved'
                                                            ? 'bg-emerald-100 text-emerald-600'
                                                            : sub.approvalStatus === 'rejected'
                                                                ? 'bg-red-100 text-red-600'
                                                                : 'bg-amber-100 text-amber-600'
                                                            }`}>
                                                            {sub.approvalStatus === 'approved' ? <CheckCircleIcon className="w-4 h-4" />
                                                                : sub.approvalStatus === 'rejected' ? <XCircleIcon className="w-4 h-4" />
                                                                    : <ClockSolid className="w-4 h-4" />}
                                                        </div>

                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className="font-bold text-sm text-slate-800">Rev {rev}</span>
                                                                <span className="text-xs text-slate-400">·</span>
                                                                <span className="text-xs text-slate-500 truncate">{sub.fileName}</span>
                                                                <StatusBadge status={sub.approvalStatus} />
                                                            </div>
                                                            <p className="text-[10px] text-slate-400 mt-0.5">
                                                                Uploaded {sub.uploadedAt ? formatDate(new Date(sub.uploadedAt)) : '—'}
                                                                {sub.fileSize && ` · ${sub.fileSize}`}
                                                            </p>
                                                            {sub.clientRemarks && (
                                                                <div className={`mt-2 flex items-start gap-2 p-2 rounded-lg text-xs ${sub.approvalStatus === 'rejected'
                                                                    ? 'bg-red-100/50 text-red-700'
                                                                    : 'bg-emerald-100/50 text-emerald-700'
                                                                    }`}>
                                                                    <ChatBubbleLeftEllipsisIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                                                    <span className="font-medium">Client: "{sub.clientRemarks}"</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* View link */}
                                                        {sub.fileUrl && (
                                                            <a href={sub.fileUrl} target="_blank" rel="noopener noreferrer"
                                                                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors flex-shrink-0">
                                                                <EyeIcon className="w-3.5 h-3.5" /> View
                                                            </a>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* PO Status */}
            {(journey as any).poStatus && (
                <div className="mt-6 p-4 rounded-lg bg-violet-50 border border-violet-200">
                    <div className="flex items-center gap-2">
                        <CheckSolid className="w-5 h-5 text-violet-600" />
                        <span className="font-bold text-sm text-violet-800">Purchase Order: {(journey as any).poStatus}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LeadJourneyEditor;
