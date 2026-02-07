import React, { useState, useMemo, useEffect } from 'react';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserPlusIcon,
  UserIcon,
  ShieldCheckIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../../context/AuthContext';
import { useApprovalRequests, approveRequest, rejectRequest } from '../../../hooks/useApprovalSystem';
import { createStaffAccountFromApproval, DEFAULT_STAFF_PASSWORD } from '../../../services/authService';
import { ApprovalRequest, ApprovalStatus, ApprovalRequestType, UserRole } from '../../../types';
import { formatDateTime } from '../../../constants';
import { ContentCard, StatCard, SectionHeader, cn, staggerContainer, PrimaryButton } from '../shared/DashboardUI';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from '../../shared/Modal';

const RegistrationsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [filterStatus, setFilterStatus] = useState<ApprovalStatus | 'All'>('All');
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [reviewComments, setReviewComments] = useState('');
  const [assignedRole, setAssignedRole] = useState<UserRole>(UserRole.SALES_TEAM_MEMBER);
  const [processing, setProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const { requests: allRequests, loading } = useApprovalRequests();

  // Filter only staff registration requests
  const registrationRequests = useMemo(() => {
    return allRequests.filter(r => r.requestType === ApprovalRequestType.STAFF_REGISTRATION);
  }, [allRequests]);

  const filteredRequests = useMemo(() => {
    let filtered = registrationRequests;
    
    // Filter by status
    if (filterStatus !== 'All') {
      filtered = filtered.filter(r => r.status === filterStatus);
    }
    
    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(r => 
        r.requesterName.toLowerCase().includes(term) ||
        r.email?.toLowerCase().includes(term) ||
        r.phone?.toLowerCase().includes(term) ||
        r.requestedRole?.toLowerCase().includes(term)
      );
    }
    
    return filtered;
  }, [registrationRequests, filterStatus, searchTerm]);

  const stats = useMemo(() => {
    return {
      pending: registrationRequests.filter(r => r.status === ApprovalStatus.PENDING).length,
      approved: registrationRequests.filter(r => r.status === ApprovalStatus.APPROVED).length,
      rejected: registrationRequests.filter(r => r.status === ApprovalStatus.REJECTED).length,
      total: registrationRequests.length
    };
  }, [registrationRequests]);

  const handleReview = (request: ApprovalRequest, action: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setReviewAction(action);
    setShowReviewModal(true);
    setReviewComments(request.reviewerComments || '');
    setAssignedRole(request.requestedRole || UserRole.SALES_TEAM_MEMBER);
  };

  const handleSubmitReview = async () => {
    if (!selectedRequest || !currentUser) return;

    if (reviewAction === 'reject' && !reviewComments.trim()) {
      alert('Please provide a reason for rejection.');
      return;
    }

    if (reviewAction === 'approve' && !assignedRole) {
      alert('Please select a role/designation for the new member.');
      return;
    }

    setProcessing(true);
    try {
      // Store the assigned role in targetRole field for the approval system to use
      if (selectedRequest) {
        selectedRequest.targetRole = assignedRole;
      }

      if (reviewAction === 'approve') {
        // Update approval doc (caseId undefined for approvalRequests collection)
        await approveRequest(selectedRequest.id, undefined, currentUser.id);

        // Create the actual staff account so the new user appears in the database
        const email = (selectedRequest as ApprovalRequest & { email?: string }).email;
        const requesterName = selectedRequest.requesterName || selectedRequest.title?.replace(/^Staff Registration Request: /, '') || 'Staff';
        const phone = (selectedRequest as ApprovalRequest & { phone?: string }).phone ?? '';
        const region = (selectedRequest as ApprovalRequest & { region?: string }).region;
        if (email) {
          await createStaffAccountFromApproval(
            email,
            DEFAULT_STAFF_PASSWORD,
            requesterName,
            assignedRole as UserRole,
            phone,
            region
          );
        } else {
          console.warn('[RegistrationsPage] Approval request missing email; staff account not created.');
        }
      } else {
        await rejectRequest(selectedRequest.id, undefined, currentUser.id, reviewComments);
      }

      setShowReviewModal(false);
      setSelectedRequest(null);
      setReviewComments('');
    } catch (error) {
      console.error('Error reviewing registration:', error);
      alert('Failed to process registration request.');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status: ApprovalStatus) => {
    switch (status) {
      case ApprovalStatus.PENDING:
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case ApprovalStatus.APPROVED:
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case ApprovalStatus.REJECTED:
        return 'bg-error/10 text-error border-error/20';
      default:
        return 'bg-subtle-background text-text-tertiary border-border';
    }
  };

  // Role to dashboard mapping helper
  const getRoleDashboardMapping = (role: UserRole): string => {
    switch (role) {
      case UserRole.PROJECT_HEAD:
      case UserRole.EXECUTION_TEAM:
        return 'Execution Hub';
      case UserRole.DESIGNER:
      case UserRole.DRAWING_TEAM:
      case UserRole.SITE_ENGINEER:
        return 'Drawing & Site Engineering';
      case UserRole.SALES_TEAM_MEMBER:
        return 'Sales Team';
      case UserRole.SALES_GENERAL_MANAGER:
      case UserRole.MANAGER:
        return 'Sales Manager';
      case UserRole.QUOTATION_TEAM:
        return 'Quotation Team';
      case UserRole.PROCUREMENT_TEAM:
        return 'Procurement Team';
      case UserRole.ACCOUNTS_TEAM:
        return 'Accounts Team';
      default:
        return 'General Dashboard';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-widest text-text-tertiary">Loading registrations...</p>
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
          <h2 className="text-4xl font-serif font-black text-text-primary tracking-tighter">Staff Registrations</h2>
          <p className="text-sm text-text-secondary mt-2 font-medium">Review and approve new team member registration requests</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Pending Review"
          value={stats.pending}
          icon={<ClockIcon className="w-6 h-6" />}
          color="accent"
        />
        <StatCard
          title="Approved"
          value={stats.approved}
          icon={<CheckCircleIcon className="w-6 h-6" />}
          color="secondary"
        />
        <StatCard
          title="Rejected"
          value={stats.rejected}
          icon={<XCircleIcon className="w-6 h-6" />}
          color="error"
        />
        <StatCard
          title="Total Requests"
          value={stats.total}
          icon={<UserPlusIcon className="w-6 h-6" />}
          color="primary"
        />
      </div>

      {/* Filters */}
      <ContentCard>
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1 group">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Search by name, email, phone, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-subtle-background border border-border rounded-xl text-sm font-semibold focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-text-tertiary"
            />
          </div>

          {/* Status Filter */}
          <div className="relative group">
            <FunnelIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary group-focus-within:text-primary transition-colors pointer-events-none" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as ApprovalStatus | 'All')}
              className="pl-12 pr-10 py-3 bg-subtle-background border border-border rounded-xl text-sm font-bold text-text-primary focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none appearance-none cursor-pointer transition-all min-w-[180px]"
            >
              <option value="All">All Status</option>
              <option value={ApprovalStatus.PENDING}>Pending</option>
              <option value={ApprovalStatus.APPROVED}>Approved</option>
              <option value={ApprovalStatus.REJECTED}>Rejected</option>
            </select>
          </div>
        </div>
      </ContentCard>

      {/* Requests List */}
      <ContentCard className="!p-0 overflow-hidden">
        {filteredRequests.length === 0 ? (
          <div className="p-12 text-center">
            <UserPlusIcon className="w-16 h-16 mx-auto mb-4 text-text-tertiary opacity-20" />
            <p className="text-text-secondary font-medium">No registration requests found</p>
            <p className="text-sm text-text-tertiary mt-1">
              {searchTerm ? 'Try adjusting your search terms' : 'New requests will appear here'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-subtle-background/50 border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-text-tertiary">Applicant</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-text-tertiary">Contact</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-text-tertiary">Requested Role</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-text-tertiary">Region</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-text-tertiary">Submitted</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-text-tertiary">Status</th>
                  <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-text-tertiary">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRequests.map((request, idx) => (
                  <motion.tr
                    key={request.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group hover:bg-subtle-background/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {request.requesterName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-text-primary">{request.requesterName}</p>
                          <p className="text-xs text-text-tertiary">#{request.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="text-text-primary font-medium">{request.email}</p>
                        <p className="text-text-tertiary">{request.phone}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-bold text-text-primary">{request.requestedRole || 'Not specified'}</p>
                        <p className="text-xs text-text-tertiary mt-0.5">→ {getRoleDashboardMapping(request.requestedRole || UserRole.SALES_TEAM_MEMBER)}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-text-secondary">{request.region || '-'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-text-secondary">{formatDateTime(request.requestedAt)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border",
                        getStatusColor(request.status)
                      )}>
                        {request.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {request.status === ApprovalStatus.PENDING && (
                          <>
                            <button
                              onClick={() => handleReview(request, 'approve')}
                              className="px-4 py-2 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 rounded-xl text-xs font-bold transition-all border border-emerald-500/20"
                            >
                              <CheckCircleIcon className="w-4 h-4 inline mr-1" />
                              Approve
                            </button>
                            <button
                              onClick={() => handleReview(request, 'reject')}
                              className="px-4 py-2 bg-error/10 text-error hover:bg-error/20 rounded-xl text-xs font-bold transition-all border border-error/20"
                            >
                              <XCircleIcon className="w-4 h-4 inline mr-1" />
                              Reject
                            </button>
                          </>
                        )}
                        {request.status !== ApprovalStatus.PENDING && (
                          <span className="text-xs text-text-tertiary italic">Processed</span>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ContentCard>

      {/* Review Modal */}
      <Modal 
        isOpen={showReviewModal} 
        onClose={() => !processing && setShowReviewModal(false)}
        title={reviewAction === 'approve' ? 'Approve Registration' : 'Reject Registration'}
        size="3xl"
      >
        <div className="space-y-6">
          {selectedRequest && (
            <>
              {/* Applicant Details */}
              <div className="p-6 bg-subtle-background/50 rounded-2xl border border-border space-y-4">
                <h4 className="text-sm font-black uppercase tracking-widest text-text-tertiary">Applicant Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-text-tertiary uppercase font-bold">Name</label>
                    <p className="text-sm font-bold text-text-primary mt-1">{selectedRequest.requesterName}</p>
                  </div>
                  <div>
                    <label className="text-xs text-text-tertiary uppercase font-bold">Email</label>
                    <p className="text-sm text-text-primary mt-1">{selectedRequest.email}</p>
                  </div>
                  <div>
                    <label className="text-xs text-text-tertiary uppercase font-bold">Phone</label>
                    <p className="text-sm text-text-primary mt-1">{selectedRequest.phone}</p>
                  </div>
                  <div>
                    <label className="text-xs text-text-tertiary uppercase font-bold">Region</label>
                    <p className="text-sm text-text-primary mt-1">{selectedRequest.region || 'Not specified'}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-text-tertiary uppercase font-bold">Requested Role</label>
                    <p className="text-sm text-text-primary mt-1">{selectedRequest.requestedRole || 'Not specified'}</p>
                  </div>
                </div>
              </div>

              {/* Role Assignment (Approve Only) */}
              {reviewAction === 'approve' && (
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-tertiary px-1">
                    Assign Designation/Role <span className="text-secondary">*</span>
                  </label>
                  <p className="text-xs text-text-secondary mb-2">
                    Select the final role for this team member. They will be assigned to the corresponding dashboard.
                  </p>
                  <select
                    value={assignedRole}
                    onChange={(e) => setAssignedRole(e.target.value as UserRole)}
                    className="w-full p-4 border border-border rounded-2xl bg-subtle-background/30 focus:ring-4 focus:ring-primary/10 transition-all text-sm font-medium"
                    required
                  >
                    <option value="">Select a role...</option>
                    {Object.values(UserRole).filter(r => r !== UserRole.SUPER_ADMIN).map((role) => (
                      <option key={role} value={role}>{role} → {getRoleDashboardMapping(role)}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Comments */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-tertiary px-1">
                  {reviewAction === 'approve' ? 'Welcome Message (Optional)' : 'Rejection Reason'}
                  {reviewAction === 'reject' && <span className="text-secondary"> *</span>}
                </label>
                <textarea
                  value={reviewComments}
                  onChange={(e) => setReviewComments(e.target.value)}
                  placeholder={reviewAction === 'approve' 
                    ? 'Welcome to Make My Office! We look forward to working with you...'
                    : 'Please provide a reason for rejection...'}
                  className="w-full p-4 border border-border rounded-2xl bg-surface focus:ring-4 focus:ring-primary/10 transition-all text-sm resize-none h-32"
                  required={reviewAction === 'reject'}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  onClick={() => setShowReviewModal(false)}
                  disabled={processing}
                  className="px-6 py-3 bg-subtle-background text-text-secondary hover:bg-border rounded-xl text-sm font-bold transition-all border border-border"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitReview}
                  disabled={processing || (reviewAction === 'reject' && !reviewComments.trim()) || (reviewAction === 'approve' && !assignedRole)}
                  className={cn(
                    "px-6 py-3 rounded-xl text-sm font-bold transition-all border disabled:opacity-50 disabled:cursor-not-allowed",
                    reviewAction === 'approve'
                      ? "bg-emerald-500 text-white hover:bg-emerald-600 border-emerald-500"
                      : "bg-error text-white hover:bg-error/90 border-error"
                  )}
                >
                  {processing ? 'Processing...' : (reviewAction === 'approve' ? 'Approve & Create Account' : 'Reject Request')}
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </motion.div>
  );
};

export default RegistrationsPage;
