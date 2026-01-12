import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useMyApprovalRequests } from '../../../hooks/useApprovalSystem';
import { ApprovalStatus, ApprovalRequestType } from '../../../types';
import { 
  ContentCard, 
  SectionHeader, 
  cn, 
  staggerContainer, 
  fadeInUp 
} from '../shared/DashboardUI';
import { 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  CalendarIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDateTime } from '../../../constants';

const RequestStatusPill: React.FC<{ status: ApprovalStatus }> = ({ status }) => {
  const config = {
    [ApprovalStatus.PENDING]: { color: 'text-amber-500 bg-amber-500/10', icon: ClockIcon, label: 'Pending Review' },
    [ApprovalStatus.APPROVED]: { color: 'text-green-500 bg-green-500/10', icon: CheckCircleIcon, label: 'Approved' },
    [ApprovalStatus.REJECTED]: { color: 'text-red-500 bg-red-500/10', icon: XCircleIcon, label: 'Rejected' },
  }[status];

  const Icon = config.icon;

  return (
    <span className={cn("inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold gap-1.5", config.color)}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
};

const MyRequestsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { myRequests, loading } = useMyApprovalRequests(currentUser?.id || '');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <motion.div 
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <div className="grid grid-cols-1 gap-6">
        <ContentCard className="p-0 overflow-hidden">
            <div className="p-6 border-b border-border bg-surface">
                <h3 className="text-lg font-serif font-bold text-text-primary mb-1">My Request History</h3>
                <p className="text-xs text-text-secondary">Track the status of your work requests sent to management.</p>
            </div>
          
            <div className="overflow-x-auto">
                {myRequests.length === 0 ? (
                    <div className="text-center py-20">
                        <DocumentTextIcon className="w-12 h-12 mx-auto text-text-secondary/20 mb-3" />
                        <p className="text-sm text-text-secondary">No requests raised yet.</p>
                    </div>
                ) : (
                    <table className="w-full">
                    <thead className="bg-subtle-background/50 border-b border-border">
                        <tr>
                        <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-text-secondary">Request Details</th>
                        <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-text-secondary">Type & Context</th>
                        <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-text-secondary">Status</th>
                        <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-text-secondary">Submitted</th>
                        <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-text-secondary">Reviewer Feedback</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                        <AnimatePresence>
                        {myRequests.map((request) => (
                            <motion.tr 
                            key={request.id}
                            variants={fadeInUp}
                            className="group hover:bg-primary/[0.01] transition-colors"
                            >
                            <td className="px-6 py-5">
                                <div>
                                <p className="text-sm font-bold text-text-primary mb-1">{request.title}</p>
                                <p className="text-xs text-text-secondary line-clamp-2 max-w-xs">{request.description}</p>
                                </div>
                            </td>
                            <td className="px-6 py-5">
                                <span className="inline-block px-2 py-1 bg-subtle-background rounded text-[10px] font-medium text-text-primary border border-border mb-1">
                                    {request.requestType}
                                </span>
                                {request.clientName && (
                                     <p className="text-[10px] text-text-secondary mt-1">For: <span className="font-bold">{request.clientName}</span></p>
                                )}
                            </td>
                            <td className="px-6 py-5">
                                <RequestStatusPill status={request.status} />
                            </td>
                            <td className="px-6 py-5">
                                <div className="flex items-center gap-2 text-xs text-text-secondary">
                                <CalendarIcon className="w-3.5 h-3.5" />
                                {formatDateTime(request.requestedAt)}
                                </div>
                            </td>
                            <td className="px-6 py-5">
                                {request.reviewerComments ? (
                                <div className="flex items-start gap-2 max-w-xs">
                                    <ChatBubbleLeftRightIcon className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-xs text-text-primary">{request.reviewerComments}</p>
                                        <p className="text-[10px] text-text-secondary mt-0.5">By {request.reviewerName}</p>
                                    </div>
                                </div>
                                ) : (
                                <span className="text-xs text-text-secondary italic">No feedback yet</span>
                                )}
                            </td>
                            </motion.tr>
                        ))}
                        </AnimatePresence>
                    </tbody>
                    </table>
                )}
            </div>
        </ContentCard>
      </div>
    </motion.div>
  );
};

export default MyRequestsPage;
