import React, { useState, useMemo, useEffect } from 'react';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  UserIcon,
  ShieldCheckIcon,
  BoltIcon,
  AdjustmentsHorizontalIcon,
  ArchiveBoxIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../../context/AuthContext';
import { useApprovalRequests, approveRequest, rejectRequest, getApprovalStats } from '../../../hooks/useApprovalSystem';
import { ApprovalRequest, ApprovalStatus, ApprovalRequestType, UserRole } from '../../../types';
import { formatDateTime, USERS } from '../../../constants';
import { ContentCard, StatCard, SectionHeader, cn, staggerContainer } from '../shared/DashboardUI';
import { motion, AnimatePresence } from 'framer-motion';
import SmartDateTimePicker from '../../shared/SmartDateTimePicker';

const ApprovalsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [filterStatus, setFilterStatus] = useState<ApprovalStatus | 'All'>('All');
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [reviewComments, setReviewComments] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [deadline, setDeadline] = useState<string>('');
  const [processing, setProcessing] = useState(false);

  const { requests, loading } = useApprovalRequests(filterStatus === 'All' ? undefined : filterStatus);
  const { requests: allRequests } = useApprovalRequests(); // For stats or full list if needed

  // Fallback mapping from request type to target role (for requests without targetRole set)
  const derivedTargetRole = useMemo(() => {
    if (!selectedRequest) return undefined;
    if (selectedRequest.targetRole) return selectedRequest.targetRole;

    // Derive from request type if not explicitly set
    const typeToRole: Record<string, UserRole> = {
      [ApprovalRequestType.SITE_VISIT]: UserRole.SITE_ENGINEER,
      [ApprovalRequestType.DESIGN_CHANGE]: UserRole.DRAWING_TEAM,
      [ApprovalRequestType.MATERIAL_CHANGE]: UserRole.SOURCING_TEAM,
      [ApprovalRequestType.PAYMENT_QUERY]: UserRole.ACCOUNTS_TEAM,
      [ApprovalRequestType.REQUEST_FOR_QUOTATION]: UserRole.QUOTATION_TEAM,
      [ApprovalRequestType.MODIFICATION]: UserRole.EXECUTION_TEAM,
      [ApprovalRequestType.SOURCING_TOKEN]: UserRole.SOURCING_TEAM,
    };
    return typeToRole[selectedRequest.requestType];
  }, [selectedRequest]);

  // Personnel for assignment - show everyone but sort matching role to top for convenience
  const personnel = useMemo(() => {
    return [...USERS].sort((a, b) => {
      // Put users with the "correct" role at the top
      const aIsMatch = a.role === derivedTargetRole;
      const bIsMatch = b.role === derivedTargetRole;

      if (aIsMatch && !bIsMatch) return -1;
      if (!aIsMatch && bIsMatch) return 1;

      // Secondary sort by name
      return a.name.localeCompare(b.name);
    });
  }, [derivedTargetRole]);

  // Handle personnel selection reset
  useEffect(() => {
    if (selectedRequest && personnel.length > 0) {
      setAssigneeId(personnel[0].id);
    } else {
      setAssigneeId('');
    }
  }, [selectedRequest, personnel]);

  const filteredRequests = useMemo(() => {
    if (filterStatus === 'All') return requests;
    return requests.filter(r => r.status === filterStatus);
  }, [requests, filterStatus]);

  const stats = useMemo(() => getApprovalStats(requests), [requests]);

  const handleReview = (request: ApprovalRequest, action: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setReviewAction(action);
    setShowReviewModal(true);

    // Pre-fill with original request data for review/editing
    setReviewComments(request.reviewerComments || request.description || '');
    if (request.endDate) {
      setDeadline(new Date(request.endDate).toISOString());
    } else {
      setDeadline('');
    }

    if (request.assigneeId) setAssigneeId(request.assigneeId);
  };

  const handleSubmitReview = async () => {
    if (!selectedRequest || !currentUser) return;

    if (reviewAction === 'reject' && !reviewComments.trim()) {
      alert('Strategic Protocol: A rejection reason is mandatory.');
      return;
    }

    setProcessing(true);
    try {
      if (reviewAction === 'approve') {
        await approveRequest(
          selectedRequest.id,
          currentUser.id,
          currentUser.name,
          assigneeId || undefined,
          reviewComments,
          deadline ? new Date(deadline) : undefined
        );
      } else {
        await rejectRequest(
          selectedRequest.id,
          currentUser.id,
          currentUser.name,
          reviewComments
        );
      }

      setShowReviewModal(false);
      setSelectedRequest(null);
      setReviewComments('');
    } catch (error) {
      console.error('Error reviewing request:', error);
      alert('Connectivity Failure: Failed to process authorization protocol.');
    } finally {
      setProcessing(false);
    }
  };

  const getRequestTypeIcon = (type: ApprovalRequestType) => {
    switch (type) {
      case ApprovalRequestType.LEAVE:
      case ApprovalRequestType.TIME_OFF:
        return <CalendarDaysIcon className="w-5 h-5" />;
      case ApprovalRequestType.EARLY_DEPARTURE:
      case ApprovalRequestType.LATE_ARRIVAL:
      case ApprovalRequestType.OVERTIME:
        return <ClockIcon className="w-5 h-5" />;
      case ApprovalRequestType.WORK_FROM_HOME:
        return <UserIcon className="w-5 h-5" />;
      case ApprovalRequestType.EXPENSE:
        return <DocumentTextIcon className="w-5 h-5" />;
      case ApprovalRequestType.SITE_VISIT:
      case ApprovalRequestType.SITE_VISIT_TOKEN:
        return <BoltIcon className="w-5 h-5" />;
      case ApprovalRequestType.DESIGN_CHANGE:
      case ApprovalRequestType.DESIGN_TOKEN:
      case ApprovalRequestType.MODIFICATION:
        return <AdjustmentsHorizontalIcon className="w-5 h-5" />;
      case ApprovalRequestType.REQUEST_FOR_QUOTATION:
      case ApprovalRequestType.QUOTATION_TOKEN:
      case ApprovalRequestType.SOURCING_TOKEN:
        return <DocumentTextIcon className="w-5 h-5" />;
      default:
        return <DocumentTextIcon className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-widest text-text-tertiary">Accessing Authorization Vault...</p>
      </div>
    );
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-serif font-black text-text-primary tracking-tighter">Request Inbox</h2>
          <p className="text-text-tertiary text-sm font-medium mt-1 uppercase tracking-[0.15em]">Admin & Manager Control Center</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-surface border border-border/60 p-1 rounded-2xl shadow-sm">
            {(['All', ApprovalStatus.PENDING, ApprovalStatus.APPROVED, ApprovalStatus.REJECTED] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={cn(
                  "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  filterStatus === status
                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                    : "text-text-tertiary hover:text-text-primary hover:bg-subtle-background"
                )}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Total Protocols"
          value={stats.total}
          icon={<ArchiveBoxIcon className="w-6 h-6" />}
          trend={{ value: 'Fleet Scale', positive: true }}
        />
        <StatCard
          title="Pending Sync"
          value={stats.pending}
          icon={<ClockIcon className="w-6 h-6" />}
          trend={{ value: 'Action Required', positive: false }}
          className="ring-1 ring-yellow-500/20"
        />
        <StatCard
          title="Authorized"
          value={stats.approved}
          icon={<ShieldCheckIcon className="w-6 h-6" />}
          trend={{ value: 'Successful', positive: true }}
          className="ring-1 ring-green-500/20"
        />
        <StatCard
          title="Rejected"
          value={stats.rejected}
          icon={<XCircleIcon className="w-6 h-6" />}
          trend={{ value: 'Discontinued', positive: false }}
          className="ring-1 ring-red-500/20"
        />
      </div>

      {/* Requests Registry */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredRequests.length > 0 ? (
            filteredRequests.map((request, idx) => (
              <motion.div
                key={request.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.05 }}
              >
                <ContentCard className="group hover:border-primary/30 transition-all duration-500">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                    {/* Icon & Primary Info */}
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-14 h-14 rounded-2xl bg-subtle-background flex items-center justify-center text-text-tertiary group-hover:bg-primary/10 group-hover:text-primary transition-all duration-500 border border-border/40">
                        {getRequestTypeIcon(request.requestType)}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-xl font-serif font-black text-text-primary tracking-tight">{request.title}</h3>
                          <span className={cn(
                            "px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
                            request.status === ApprovalStatus.PENDING ? "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" :
                              request.status === ApprovalStatus.APPROVED ? "bg-green-500/10 text-green-600 border-green-500/20" :
                                "bg-red-500/10 text-red-600 border-red-500/20"
                          )}>
                            {request.status}
                          </span>
                        </div>
                        <p className="text-xs text-text-tertiary font-bold uppercase tracking-wider">
                          {request.requesterName} <span className="opacity-40">/</span> {request.requesterRole}
                        </p>
                      </div>
                    </div>

                    {/* Metadata & Description */}
                    <div className="lg:w-1/3 space-y-2">
                      <p className="text-sm text-text-secondary line-clamp-2 italic font-medium">"{request.description}"</p>
                      <div className="flex items-center gap-4 text-[10px] font-black text-text-tertiary uppercase tracking-widest">
                        <div className="flex items-center gap-1.5">
                          <BoltIcon className="w-3 h-3 text-primary" />
                          <span>{request.priority} Priority</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CalendarDaysIcon className="w-3 h-3" />
                          <span>{formatDateTime(request.requestedAt)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions / Review Status */}
                    <div className="lg:w-1/4 flex items-center justify-end gap-3 min-w-[200px]">
                      {request.status === ApprovalStatus.PENDING ? (
                        <>
                          <button
                            onClick={() => handleReview(request, 'reject')}
                            className="flex-1 lg:flex-none px-5 py-3 rounded-2xl border border-border text-[10px] font-black uppercase tracking-widest hover:bg-error hover:text-white hover:border-error transition-all"
                          >
                            Deny
                          </button>
                          <button
                            onClick={() => handleReview(request, 'approve')}
                            className="flex-1 lg:flex-none px-5 py-3 rounded-2xl bg-primary text-white text-[10px] font-black uppercase tracking-widest hover:bg-secondary shadow-lg shadow-primary/20 transition-all"
                          >
                            Authorize
                          </button>
                        </>
                      ) : (
                        <div className="flex flex-col items-end gap-2">
                          <div className="text-right">
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-tertiary mb-1">Reviewed By</p>
                            <p className="text-sm font-bold text-text-primary">{request.reviewerName}</p>
                          </div>
                          <button
                            onClick={() => handleReview(request, request.status === ApprovalStatus.APPROVED ? 'approve' : 'reject')}
                            className="text-[9px] font-black uppercase tracking-widest text-primary hover:text-secondary transition-colors underline decoration-2 underline-offset-4"
                          >
                            Edit Review
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </ContentCard>
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 bg-surface/50 border border-dashed border-border/60 rounded-[2rem]"
            >
              <ShieldCheckIcon className="w-16 h-16 text-text-tertiary opacity-10 mb-4" />
              <p className="text-text-tertiary font-serif italic text-lg">"Registry clear. All protocols synchronized."</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Review Modal */}
      <AnimatePresence>
        {showReviewModal && selectedRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-md"
              onClick={() => setShowReviewModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-surface border border-border rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center",
                    reviewAction === 'approve' ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
                  )}>
                    {reviewAction === 'approve' ? <ShieldCheckIcon className="w-6 h-6" /> : <XCircleIcon className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className="text-2xl font-serif font-black text-text-primary tracking-tight">
                      {reviewAction === 'approve' ? 'Execution Approval' : 'Authorization Denial'}
                    </h3>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-tertiary">Final Override Confirmation</p>
                  </div>
                </div>

                <div className="mb-8 p-6 bg-subtle-background/50 rounded-3xl border border-border/40">
                  <p className="text-[10px] font-black uppercase tracking-widest text-text-tertiary mb-1">Subject Protocol</p>
                  <p className="text-lg font-bold text-text-primary mb-1">{selectedRequest.title}</p>
                  <p className="text-xs text-text-secondary font-medium italic">Requested by {selectedRequest.requesterName}</p>
                </div>

                <div className="space-y-3 mb-10">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-tertiary px-1">
                    Strategic Feedback {reviewAction === 'reject' && <span className="text-error">*</span>}
                  </label>
                  <textarea
                    value={reviewComments}
                    onChange={(e) => setReviewComments(e.target.value)}
                    rows={reviewAction === 'approve' && derivedTargetRole ? 2 : 4}
                    className="w-full p-6 border border-border rounded-3xl bg-subtle-background/30 focus:ring-4 focus:ring-primary/10 transition-all text-sm font-medium placeholder:text-text-tertiary/50"
                    placeholder={reviewAction === 'approve' ? 'Internal notes & instructions for the worker...' : 'Required justification for protocol denial...'}
                  />
                </div>

                {reviewAction === 'approve' && (
                  <div className="mb-10">
                    <SmartDateTimePicker
                      label="Deadline"
                      value={deadline}
                      onChange={setDeadline}
                      required
                    />
                  </div>
                )}

                {reviewAction === 'approve' && (
                  <div className="mb-10 space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-tertiary px-1">
                      Personnel Assignment <span className="text-secondary">*</span>
                    </label>
                    <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {personnel.map(user => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => setAssigneeId(user.id)}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-2xl border transition-all",
                            assigneeId === user.id
                              ? "bg-secondary text-white border-secondary shadow-lg shadow-secondary/10"
                              : "bg-subtle-background/30 border-border hover:bg-subtle-background/50"
                          )}
                        >
                          <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full border border-white/20" />
                          <div className="text-left flex-1">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-black uppercase tracking-tight">{user.name}</p>
                              {user.role === derivedTargetRole && (
                                <span className={cn(
                                  "text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider border",
                                  assigneeId === user.id
                                    ? "bg-white/20 border-white/30 text-white"
                                    : "bg-secondary/10 border-secondary/20 text-secondary"
                                )}>
                                  Spec
                                </span>
                              )}
                            </div>
                            <p className={cn("text-[10px] uppercase font-bold opacity-60", assigneeId === user.id ? "text-white" : "text-text-tertiary")}>
                              {user.role}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setShowReviewModal(false)}
                    className="p-5 rounded-2xl border border-border text-[10px] font-black uppercase tracking-widest hover:bg-subtle-background transition-all"
                    disabled={processing}
                  >
                    Abort
                  </button>
                  <button
                    onClick={handleSubmitReview}
                    disabled={processing || (reviewAction === 'reject' && !reviewComments.trim()) || (reviewAction === 'approve' && (!deadline || !assigneeId))}
                    className={cn(
                      "p-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl disabled:opacity-50",
                      reviewAction === 'approve'
                        ? "bg-primary text-white hover:bg-secondary shadow-primary/20"
                        : "bg-error text-white hover:bg-red-600 shadow-error/20"
                    )}
                  >
                    {processing ? 'Processing...' : reviewAction === 'approve' ? 'Confirm Authorize' : 'Confirm Deny'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ApprovalsPage;
