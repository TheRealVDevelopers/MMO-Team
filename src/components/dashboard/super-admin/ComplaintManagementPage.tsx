import React, { useState } from 'react';
import { formatDate } from '../../../constants';
import { useUsers } from '../../../hooks/useUsers';
import { Complaint, ComplaintStatus, UserRole } from '../../../types';
import {
    ShieldExclamationIcon,
    PlusIcon,
    UserIcon,
    ChatBubbleBottomCenterTextIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { ContentCard, SectionHeader, cn } from '../shared/DashboardUI';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from '../../shared/Modal';
import { ComplaintPriority, ComplaintType } from '../../../types';

const ComplaintManagementPage: React.FC<{ setCurrentPage: (page: string) => void }> = ({ setCurrentPage }) => {
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const { users } = useUsers();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Simple Add Form State
    const [newComplaint, setNewComplaint] = useState({
        submittedBy: '',
        against: '',
        description: ''
    });

    const handleAddComplaint = (e: React.FormEvent) => {
        e.preventDefault();
        const newId = `CMP-${Date.now()}`;
        const complaint: Complaint = {
            id: newId,
            submittedBy: newComplaint.submittedBy, // Mocking ID as name for simplicity in this view or need to map
            against: newComplaint.against,
            description: newComplaint.description,
            status: ComplaintStatus.SUBMITTED,
            priority: ComplaintPriority.HIGH,
            submissionDate: new Date(),
            // Mocking other required fields
            type: ComplaintType.QUALITY_ISSUES,
            evidence: [],
            projectContext: 'General',
            resolutionAttempts: 'None',
            desiredResolution: 'Review'
        };

        setComplaints(prev => [complaint, ...prev]);
        setIsAddModalOpen(false);
        setNewComplaint({ submittedBy: '', against: '', description: '' });
    };

    return (
        <ContentCard className="min-h-screen">
            <SectionHeader
                title="Complaint Registry"
                subtitle="Simplified grievance log and resolution tracking."
                actions={
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-error text-white rounded-xl hover:bg-error/90 transition-colors shadow-lg shadow-error/20"
                    >
                        <PlusIcon className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">Log Complaint</span>
                    </button>
                }
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <AnimatePresence>
                    {complaints.map((complaint, idx) => (
                        <motion.div
                            key={complaint.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="bg-surface border border-border p-5 rounded-2xl hover:shadow-md transition-all group"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white",
                                        complaint.status === ComplaintStatus.RESOLVED ? "bg-green-500" : "bg-error"
                                    )}>
                                        <ShieldExclamationIcon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-text-primary text-sm">{complaint.type}</h4>
                                        <span className="text-[10px] text-text-tertiary uppercase tracking-wider">
                                            {formatDate(complaint.submissionDate)} • #{complaint.id.slice(-4)}
                                        </span>
                                    </div>
                                </div>
                                <span className={cn(
                                    "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                                    complaint.status === ComplaintStatus.RESOLVED ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                )}>
                                    {complaint.status}
                                </span>
                            </div>

                            <div className="space-y-3 bg-subtle-background/30 p-4 rounded-xl border border-border/50">
                                <div className="flex items-start gap-3">
                                    <UserIcon className="w-4 h-4 text-text-tertiary mt-0.5" />
                                    <div>
                                        <p className="text-[10px] font-black text-text-tertiary uppercase tracking-wider">Who Reported</p>
                                        <p className="text-xs font-bold text-text-primary">
                                            {users.find(u => u.id === complaint.submittedBy)?.name || complaint.submittedBy || "Unknown"}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <ExclamationTriangleIcon className="w-4 h-4 text-error mt-0.5" />
                                    <div>
                                        <p className="text-[10px] font-black text-text-tertiary uppercase tracking-wider">About Whom</p>
                                        <p className="text-xs font-bold text-text-primary">{complaint.against}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <ChatBubbleBottomCenterTextIcon className="w-4 h-4 text-text-tertiary mt-0.5" />
                                    <div>
                                        <p className="text-[10px] font-black text-text-tertiary uppercase tracking-wider">What Happened</p>
                                        <p className="text-xs text-text-secondary leading-relaxed line-clamp-2 hover:line-clamp-none transition-all">
                                            {complaint.description}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Simple Add Modal */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="Log New Complaint"
                size="md"
            >
                <form onSubmit={handleAddComplaint} className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-text-tertiary mb-1.5 ml-1">Complainant Asset</label>
                        <select
                            required
                            value={newComplaint.submittedBy}
                            onChange={e => setNewComplaint({ ...newComplaint, submittedBy: e.target.value })}
                            className="w-full bg-subtle-background/50 border border-border rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 text-sm p-3 outline-none transition-all"
                        >
                            <option value="">Select Staff Member</option>
                            {users.map(user => (
                                <option key={user.id} value={user.id}>{user.name} ({user.role})</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-text-tertiary mb-1.5 ml-1">Target Asset</label>
                        <select
                            required
                            value={newComplaint.against}
                            onChange={e => setNewComplaint({ ...newComplaint, against: e.target.value })}
                            className="w-full bg-subtle-background/50 border border-border rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 text-sm p-3 outline-none transition-all"
                        >
                            <option value="">Select Target Staff</option>
                            {users.map(user => (
                                <option key={user.id} value={user.name}>{user.name} ({user.role})</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-text-tertiary mb-1.5 ml-1">Incident Report</label>
                        <textarea
                            required
                            value={newComplaint.description}
                            onChange={e => setNewComplaint({ ...newComplaint, description: e.target.value })}
                            className="w-full bg-subtle-background/50 border border-border rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 text-sm p-3 min-h-[120px] outline-none transition-all"
                            placeholder="Provide detailed incident parameters..."
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-border mt-4">
                        <button
                            type="button"
                            onClick={() => setIsAddModalOpen(false)}
                            className="px-6 py-2 text-text-secondary hover:bg-subtle-background rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors"
                        >
                            Retract
                        </button>
                        <button
                            type="submit"
                            className="px-8 py-2 bg-error text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 shadow-xl shadow-error/20 transition-all"
                        >
                            Initialize Report
                        </button>
                    </div>
                </form>
            </Modal>
        </ContentCard>
    );
};

export default ComplaintManagementPage;
