import React, { useState } from 'react';
import {
    ArrowLeftIcon,
    ExclamationTriangleIcon,
    ShieldExclamationIcon,
    CheckCircleIcon,
    ArrowRightIcon,
    InformationCircleIcon,
    BoltIcon,
    ChatBubbleBottomCenterTextIcon,
    DocumentTextIcon,
    UserGroupIcon
} from '@heroicons/react/24/outline';
import { ComplaintType, ComplaintPriority, UserRole } from '../../types';
import { useUsers } from '../../hooks/useUsers';
import { useProjects } from '../../hooks/useProjects';
import { ContentCard, StatCard, SectionHeader, cn, staggerContainer } from '../dashboard/shared/DashboardUI';
import { motion, AnimatePresence } from 'framer-motion';

const EscalateIssuePage: React.FC<{ setCurrentPage: (page: string) => void }> = ({ setCurrentPage }) => {
    const { users } = useUsers();
    const { projects } = useProjects();
    const [complaintType, setComplaintType] = useState<ComplaintType>(ComplaintType.COMMUNICATION_BREAKDOWN);
    const [priority, setPriority] = useState<ComplaintPriority>(ComplaintPriority.MEDIUM);
    const [submitted, setSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        // Artificial delay for premium feel
        await new Promise(r => setTimeout(r, 1200));
        setIsSubmitting(false);
        setSubmitted(true);
    };

    if (submitted) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center min-h-[60vh] max-w-2xl mx-auto text-center px-6"
            >
                <div className="w-24 h-24 bg-green-500/10 rounded-[2.5rem] border border-green-500/20 flex items-center justify-center mb-8 shadow-2xl shadow-green-500/10">
                    <CheckCircleIcon className="w-12 h-12 text-green-500" />
                </div>
                <h2 className="text-4xl font-serif font-black text-text-primary tracking-tighter mb-4 italic">Protocol Initiated</h2>
                <p className="text-text-tertiary text-lg font-medium leading-relaxed mb-10">
                    "Your strategic escalation has been synchronized with the management vault. A priority response unit will be assigned shortly."
                </p>
                <button
                    onClick={() => setCurrentPage('my-day')}
                    className="flex items-center gap-3 bg-primary text-white px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-secondary hover:scale-105 transition-all shadow-xl shadow-primary/20"
                >
                    Return to Operational Dashboard
                    <ArrowRightIcon className="w-4 h-4" />
                </button>
            </motion.div>
        )
    }

    return (
        <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="space-y-10 pb-20"
        >
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4 sm:px-0">
                <div className="flex items-center gap-5">
                    <button
                        onClick={() => setCurrentPage('my-day')}
                        className="group p-3 rounded-2xl border border-border bg-surface hover:bg-subtle-background hover:scale-105 transition-all text-text-tertiary shadow-sm"
                    >
                        <ArrowLeftIcon className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <h2 className="text-4xl font-serif font-black text-text-primary tracking-tighter">Escalation Portal</h2>
                        <p className="text-text-tertiary text-sm font-medium mt-1 uppercase tracking-[0.15em]">Strategic Override & Protocol Intervention</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 bg-error/5 border border-error/20 p-4 rounded-3xl">
                    <ExclamationTriangleIcon className="w-6 h-6 text-error animate-pulse" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-error">Critical Interference Detected</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Requirements Card */}
                <div className="lg:col-span-4">
                    <ContentCard className="sticky top-10 border-error/20 shadow-xl overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                            <ShieldExclamationIcon className="w-48 h-48" />
                        </div>
                        <div className="flex items-center gap-3 mb-8">
                            <InformationCircleIcon className="w-6 h-6 text-primary" />
                            <h3 className="text-xl font-serif font-black text-text-primary tracking-tight">Prelude Protocols</h3>
                        </div>
                        <div className="space-y-6 relative z-10">
                            <p className="text-sm text-text-secondary font-medium italic opacity-70">
                                "Commitment to professional equilibrium requires verification before strategic intervention."
                            </p>
                            <ul className="space-y-4">
                                {[
                                    "Exhaust Normal Resolution Channels",
                                    "Minimum 2 Documented Follow-ups",
                                    "Complete Evidence Documentation",
                                    "24-Hour Cool-down Verification"
                                ].map((step, i) => (
                                    <li key={i} className="flex items-start gap-3 group">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0 group-hover:scale-150 transition-transform" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.1em] text-text-secondary">{step}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </ContentCard>
                </div>

                {/* Form Card */}
                <div className="lg:col-span-8">
                    <ContentCard className="shadow-2xl">
                        <div className="flex items-center gap-4 mb-10 pb-4 border-b border-border/40">
                            <BoltIcon className="w-6 h-6 text-accent" />
                            <h3 className="text-xl font-serif font-black text-text-primary tracking-tight italic">Intervention Registry Form</h3>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-tertiary px-1">Interference Type</label>
                                    <select
                                        value={complaintType}
                                        onChange={(e) => setComplaintType(e.target.value as ComplaintType)}
                                        className="w-full h-14 bg-subtle-background/50 border border-border rounded-2xl px-6 text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all cursor-pointer appearance-none"
                                    >
                                        {Object.values(ComplaintType).map(type => <option key={type} value={type}>{type}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-tertiary px-1">Priority Trajectory</label>
                                    <select
                                        value={priority}
                                        onChange={(e) => setPriority(e.target.value as ComplaintPriority)}
                                        className="w-full h-14 bg-subtle-background/50 border border-border rounded-2xl px-6 text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all cursor-pointer appearance-none"
                                    >
                                        {Object.values(ComplaintPriority).map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-tertiary px-1">Target Entity / Department</label>
                                    <select className="w-full h-14 bg-subtle-background/50 border border-border rounded-2xl px-6 text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all cursor-pointer appearance-none">
                                        <optgroup label="Departments">
                                            {Object.values(UserRole).map(role => <option key={role} value={role}>{role}</option>)}
                                        </optgroup>
                                        <optgroup label="Team Members">
                                            {users.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}
                                        </optgroup>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-tertiary px-1">Project Alignment</label>
                                    <select className="w-full h-14 bg-subtle-background/50 border border-border rounded-2xl px-6 text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all cursor-pointer appearance-none">
                                        <option value="">Select Project (Optional)</option>
                                        {projects.map(p => <option key={p.id} value={p.id}>{p.projectName}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {[
                                    { label: "Specific Interference Description", placeholder: "What is the operational deviation?", icon: ChatBubbleBottomCenterTextIcon },
                                    { label: "Historical Resolution Attempts", placeholder: "Logs of previous protocol syncs...", icon: DocumentTextIcon },
                                    { label: "Evidence Fragments", placeholder: "Brief citation of documented metrics...", icon: UserGroupIcon },
                                    { label: "Desired Resolution Equilibrium", placeholder: "What is the target operational state?", icon: BoltIcon }
                                ].map((field, i) => (
                                    <div key={i} className="space-y-2">
                                        <div className="flex items-center gap-2 px-1">
                                            <field.icon className="w-3.5 h-3.5 text-text-tertiary" />
                                            <label className="text-[10px] font-black uppercase tracking-widest text-text-tertiary">{field.label}</label>
                                        </div>
                                        <textarea
                                            rows={field.label.includes('Description') ? 4 : 2}
                                            placeholder={field.placeholder}
                                            className="w-full bg-subtle-background/30 border border-border rounded-[2rem] p-6 text-sm font-medium focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-text-tertiary/40"
                                        />
                                    </div>
                                ))}
                            </div>

                            <div className="pt-6 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="group relative px-12 py-5 bg-primary text-white text-[10px] font-black uppercase tracking-[0.25em] rounded-2xl hover:bg-secondary hover:scale-[1.02] shadow-2xl shadow-primary/30 transition-all disabled:opacity-50"
                                >
                                    {isSubmitting ? (
                                        <div className="flex items-center gap-3">
                                            <ArrowPathIcon className="w-4 h-4 animate-spin" />
                                            Synchronizing...
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3">
                                            Authorize Escalation
                                            <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    )}
                                </button>
                            </div>
                        </form>
                    </ContentCard>
                </div>
            </div>
        </motion.div>
    );
};

// Helper for spin icon
const ArrowPathIcon = ({ className }: { className: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
    </svg>
);

export default EscalateIssuePage;