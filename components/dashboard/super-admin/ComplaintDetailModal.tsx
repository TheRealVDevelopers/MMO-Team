import React, { useState, useEffect } from 'react';
import { Complaint, ComplaintStatus } from '../../../types';
import { USERS, formatDate } from '../../../constants';
import {
    XMarkIcon,
    CalendarIcon,
    UserIcon,
    ShieldExclamationIcon,
    LinkIcon,
    ChatBubbleLeftRightIcon,
    ArrowPathIcon,
    CheckBadgeIcon,
    FireIcon
} from '@heroicons/react/24/outline';
import { cn } from '../shared/DashboardUI';
import { motion, AnimatePresence } from 'framer-motion';

interface ComplaintDetailModalProps {
    complaint: Complaint | null;
    isOpen: boolean;
    onClose: () => void;
    onUpdateStatus: (complaintId: string, newStatus: ComplaintStatus) => void;
}

const getStatusTheme = (status: ComplaintStatus) => {
    switch (status) {
        case ComplaintStatus.SUBMITTED: return { color: 'text-accent-subtle-text', bg: 'bg-accent-subtle-background/10', border: 'border-accent-subtle-text/20', icon: ShieldExclamationIcon };
        case ComplaintStatus.UNDER_REVIEW: return { color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: ArrowPathIcon };
        case ComplaintStatus.INVESTIGATION: return { color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20', icon: ChatBubbleLeftRightIcon };
        case ComplaintStatus.RESOLVED: return { color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20', icon: CheckBadgeIcon };
        case ComplaintStatus.ESCALATED: return { color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: FireIcon };
        default: return { color: 'text-text-tertiary', bg: 'bg-subtle-background', border: 'border-border', icon: ShieldExclamationIcon };
    }
};

const Metric = ({ icon: Icon, label, value, colorClass = "" }: any) => (
    <div className="flex items-center gap-3 p-4 bg-subtle-background/30 border border-border/40 rounded-2xl">
        <div className={cn("w-10 h-10 rounded-xl bg-surface border border-border/60 flex items-center justify-center text-text-tertiary", colorClass)}>
            <Icon className="w-5 h-5" />
        </div>
        <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-text-tertiary">{label}</p>
            <p className="text-xs font-black text-text-primary tracking-wide uppercase">{value}</p>
        </div>
    </div>
);

const DetailBlock = ({ label, children, icon: Icon }: any) => (
    <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
            {Icon && <Icon className="w-3.5 h-3.5 text-primary" />}
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-tertiary">{label}</h4>
        </div>
        <div className="p-6 bg-surface border border-border/60 rounded-3xl text-sm text-text-secondary leading-relaxed font-medium italic">
            {children}
        </div>
    </div>
);

const ComplaintDetailModal: React.FC<ComplaintDetailModalProps> = ({ complaint, isOpen, onClose, onUpdateStatus }) => {
    const [currentStatus, setCurrentStatus] = useState<ComplaintStatus | undefined>(undefined);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        if (complaint) {
            setCurrentStatus(complaint.status);
        }
    }, [complaint]);

    if (!complaint) return null;

    const submittedByUser = USERS.find(u => u.id === complaint.submittedBy);
    const theme = getStatusTheme(currentStatus || complaint.status);
    const StatusIcon = theme.icon;

    const handleUpdate = async () => {
        if (currentStatus) {
            setIsUpdating(true);
            // Artificial delay for premium feel
            await new Promise(r => setTimeout(r, 600));
            onUpdateStatus(complaint.id, currentStatus);
            setIsUpdating(false);
            onClose();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-background/80 backdrop-blur-xl"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 30 }}
                        className="relative w-full max-w-4xl bg-surface border border-border/80 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        {/* Header Area */}
                        <div className="p-10 border-b border-border/40 bg-gradient-to-br from-surface to-subtle-background/30 shrink-0">
                            <div className="flex items-start justify-between gap-10">
                                <div className="flex items-center gap-6">
                                    <div className={cn("w-16 h-16 rounded-[1.75rem] flex items-center justify-center border shadow-xl shadow-primary/5", theme.bg, theme.color, theme.border)}>
                                        <StatusIcon className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="text-3xl font-serif font-black text-text-primary tracking-tighter">Grievance Intel</h3>
                                            <span className="text-xs font-bold text-text-tertiary opacity-40 uppercase tracking-widest mt-1">#{complaint.id.slice(0, 12)}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className={cn("px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border", theme.bg, theme.color, theme.border)}>
                                                {currentStatus}
                                            </span>
                                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-tertiary">
                                                <div className={cn("w-2 h-2 rounded-full", (complaint.priority === 'Critical' || complaint.priority === 'High') ? "bg-red-500" : "bg-accent")} />
                                                {complaint.priority} Strategic Priority
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={onClose} className="p-3 rounded-2xl border border-border text-text-tertiary hover:bg-error hover:text-white hover:border-error transition-all shadow-sm">
                                    <XMarkIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Content Scroll Area */}
                        <div className="flex-1 overflow-y-auto p-10 space-y-12">
                            {/* Summary Metrics */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <Metric icon={UserIcon} label="Reporter" value={submittedByUser?.name || 'Unknown'} />
                                <Metric icon={ShieldExclamationIcon} label="Subject" value={complaint.against} />
                                <Metric icon={CalendarIcon} label="Submission" value={formatDate(complaint.submissionDate)} />
                                <Metric icon={LinkIcon} label="Project Context" value={complaint.projectContext} colorClass="text-primary" />
                            </div>

                            {/* Deep Dive Blocks */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <DetailBlock label="Strategic Allegation" icon={ShieldExclamationIcon}>
                                    {complaint.description}
                                </DetailBlock>
                                <DetailBlock label="Intel Evidence" icon={LinkIcon}>
                                    {complaint.evidence}
                                </DetailBlock>
                                <DetailBlock label="Resolution Antecedents" icon={ArrowPathIcon}>
                                    {complaint.resolutionAttempts}
                                </DetailBlock>
                                <DetailBlock label="Desired Equilibrium" icon={CheckBadgeIcon}>
                                    {complaint.desiredResolution}
                                </DetailBlock>
                            </div>
                        </div>

                        {/* Footer Override Area */}
                        <div className="p-10 border-t border-border/40 bg-subtle-background/50 shrink-0">
                            <div className="flex flex-col md:flex-row items-center gap-6">
                                <div className="flex-1 w-full space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-tertiary px-1">Protocol Status Override</label>
                                    <div className="relative">
                                        <select
                                            value={currentStatus}
                                            onChange={(e) => setCurrentStatus(e.target.value as ComplaintStatus)}
                                            className="w-full h-14 pl-6 pr-12 bg-surface border border-border rounded-2xl text-sm font-black uppercase tracking-widest appearance-none focus:ring-4 focus:ring-primary/10 transition-all cursor-pointer"
                                        >
                                            {Object.values(ComplaintStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                        <ArrowPathIcon className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
                                    </div>
                                </div>
                                <button
                                    onClick={handleUpdate}
                                    disabled={isUpdating}
                                    className="w-full md:w-auto px-12 h-14 bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-secondary hover:scale-[1.02] shadow-xl shadow-primary/20 transition-all disabled:opacity-50"
                                >
                                    {isUpdating ? 'Executing Override...' : 'Sync Resolution Protocol'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ComplaintDetailModal;
