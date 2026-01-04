import React, { useState } from 'react';
import { COMPLAINTS, formatDate } from '../../../constants';
import { Complaint, ComplaintStatus } from '../../../types';
import {
    ArrowLeftIcon,
    ExclamationTriangleIcon,
    ShieldExclamationIcon,
    CheckBadgeIcon,
    ArrowPathIcon,
    FunnelIcon,
    MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { ContentCard, StatCard, SectionHeader, cn, staggerContainer } from '../shared/DashboardUI';
import { motion, AnimatePresence } from 'framer-motion';
import ComplaintDetailModal from './ComplaintDetailModal';

const getStatusConfig = (status: ComplaintStatus) => {
    switch (status) {
        case ComplaintStatus.SUBMITTED: return { color: 'text-accent-subtle-text', bg: 'bg-accent-subtle-background/10', border: 'border-accent-subtle-text/20' };
        case ComplaintStatus.UNDER_REVIEW: return { color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' };
        case ComplaintStatus.INVESTIGATION: return { color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20' };
        case ComplaintStatus.RESOLVED: return { color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20' };
        case ComplaintStatus.ESCALATED: return { color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' };
        default: return { color: 'text-text-tertiary', bg: 'bg-subtle-background', border: 'border-border' };
    }
};

const ComplaintManagementPage: React.FC<{ setCurrentPage: (page: string) => void }> = ({ setCurrentPage }) => {
    const [complaints, setComplaints] = useState<Complaint[]>(COMPLAINTS);
    const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const handleUpdateStatus = (complaintId: string, newStatus: ComplaintStatus) => {
        setComplaints(prev => prev.map(c => c.id === complaintId ? { ...c, status: newStatus } : c));
    };

    const stats = complaints.reduce((acc, curr) => {
        acc[curr.status] = (acc[curr.status] || 0) + 1;
        return acc;
    }, {} as Record<ComplaintStatus, number>);

    const activeComplaints = (stats[ComplaintStatus.SUBMITTED] || 0) + (stats[ComplaintStatus.UNDER_REVIEW] || 0) + (stats[ComplaintStatus.INVESTIGATION] || 0);
    const highPriorityCount = complaints.filter(c => c.priority === 'High' || c.priority === 'Critical').length;

    const filteredComplaints = complaints.filter(c =>
        c.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.against.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="space-y-8 pb-20"
        >
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="flex items-center gap-5">
                    <button
                        onClick={() => setCurrentPage('overview')}
                        className="group p-3 rounded-2xl border border-border bg-surface hover:bg-subtle-background hover:scale-105 transition-all text-text-tertiary shadow-sm"
                    >
                        <ArrowLeftIcon className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <h2 className="text-4xl font-serif font-black text-text-primary tracking-tighter">Resolution HUB</h2>
                        <p className="text-text-tertiary text-sm font-medium mt-1 uppercase tracking-[0.15em]">Internal Integrity & Grievance Registry</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Search Registry..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-surface border border-border/60 rounded-2xl py-3 pl-11 pr-6 text-xs font-bold focus:ring-4 focus:ring-primary/10 transition-all w-64 placeholder:text-text-tertiary/50 uppercase tracking-widest"
                        />
                    </div>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Active Grievances"
                    value={activeComplaints}
                    icon={<ShieldExclamationIcon className="w-6 h-6" />}
                    trend={{ value: 'Pending Pulse', positive: false }}
                    className="ring-1 ring-primary/20"
                />
                <StatCard
                    title="Critical Vectors"
                    value={highPriorityCount}
                    icon={<ExclamationTriangleIcon className="w-6 h-6" />}
                    trend={{ value: 'Priority Load', positive: false }}
                    className="ring-1 ring-red-500/20"
                />
                <StatCard
                    title="Resolution Output"
                    value={stats[ComplaintStatus.RESOLVED] || 0}
                    icon={<CheckBadgeIcon className="w-6 h-6" />}
                    trend={{ value: 'Cycle Complete', positive: true }}
                    className="ring-1 ring-green-500/20"
                />
            </div>

            {/* Registry Table */}
            <ContentCard className="overflow-hidden !p-0 shadow-2xl">
                <div className="p-8 border-b border-border/40 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        <h3 className="text-xl font-serif font-black text-text-primary tracking-tight">Active Registry Feed</h3>
                    </div>
                    <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-tertiary hover:text-primary transition-colors">
                        <FunnelIcon className="w-4 h-4" />
                        Advanced Filter
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border/20">
                        <thead className="bg-subtle-background/50">
                            <tr>
                                <th className="px-8 py-4 text-left text-[10px] font-black text-text-tertiary uppercase tracking-[0.2em]">Deployment ID</th>
                                <th className="px-8 py-4 text-left text-[10px] font-black text-text-tertiary uppercase tracking-[0.2em]">Subject Protocol</th>
                                <th className="px-8 py-4 text-left text-[10px] font-black text-text-tertiary uppercase tracking-[0.2em]">Target Entity</th>
                                <th className="px-8 py-4 text-left text-[10px] font-black text-text-tertiary uppercase tracking-[0.2em]">Status Sync</th>
                                <th className="px-8 py-4 text-right text-[10px] font-black text-text-tertiary uppercase tracking-[0.2em]">Priority</th>
                            </tr>
                        </thead>
                        <tbody className="bg-surface/50 divide-y divide-border/10">
                            <AnimatePresence>
                                {filteredComplaints.map((complaint, idx) => {
                                    const status = getStatusConfig(complaint.status);
                                    return (
                                        <motion.tr
                                            key={complaint.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            onClick={() => setSelectedComplaint(complaint)}
                                            className="group cursor-pointer hover:bg-subtle-background transition-colors"
                                        >
                                            <td className="px-8 py-6 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-black text-text-primary tracking-widest uppercase">#{complaint.id.slice(0, 8)}</span>
                                                    <span className="text-[10px] font-bold text-text-tertiary mt-1">{formatDate(complaint.submissionDate)}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 whitespace-nowrap">
                                                <span className="text-sm font-bold text-text-primary group-hover:text-primary transition-colors">{complaint.type}</span>
                                            </td>
                                            <td className="px-8 py-6 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-text-tertiary/20" />
                                                    <span className="text-xs font-black uppercase text-text-secondary">{complaint.against}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 whitespace-nowrap">
                                                <span className={cn(
                                                    "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                                                    status.bg, status.color, status.border
                                                )}>
                                                    {complaint.status}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 whitespace-nowrap text-right">
                                                <span className={cn(
                                                    "text-[10px] font-black uppercase tracking-widest",
                                                    (complaint.priority === 'Critical' || complaint.priority === 'High') ? "text-error" : "text-text-tertiary"
                                                )}>
                                                    {complaint.priority}
                                                </span>
                                            </td>
                                        </motion.tr>
                                    );
                                })}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>

                {filteredComplaints.length === 0 && (
                    <div className="p-20 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-subtle-background rounded-3xl border border-dashed border-border flex items-center justify-center mb-6">
                            <ArrowPathIcon className="w-8 h-8 text-text-tertiary opacity-20" />
                        </div>
                        <p className="text-text-tertiary font-serif italic text-lg max-w-xs mx-auto">
                            "Registry scan complete. No grievances found matching current parameters."
                        </p>
                    </div>
                )}
            </ContentCard>

            <ComplaintDetailModal
                isOpen={!!selectedComplaint}
                onClose={() => setSelectedComplaint(null)}
                complaint={selectedComplaint}
                onUpdateStatus={handleUpdateStatus}
            />
        </motion.div>
    );
};

export default ComplaintManagementPage;
