import React, { useState, useMemo } from 'react';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  FunnelIcon,
  ChartBarIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../../context/AuthContext';
import { useApprovalRequests, approveRequest, rejectRequest, getApprovalStats } from '../../../hooks/useApprovals';
import { ApprovalRequest, ApprovalStatus, ApprovalRequestType } from '../../../types';
import { formatDateTime } from '../../../constants';

const ApprovalsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [filterStatus, setFilterStatus] = useState<ApprovalStatus | 'All'>('All');
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [reviewComments, setReviewComments] = useState('');
  const [processing, setProcessing] = useState(false);

  const { requests, loading } = useApprovalRequests(filterStatus === 'All' ? undefined : filterStatus);

  const filteredRequests = useMemo(() => {
    if (filterStatus === 'All') return requests;
    return requests.filter(r => r.status === filterStatus);
  }, [requests, filterStatus]);

  const stats = useMemo(() => getApprovalStats(requests), [requests]);

  const handleReview = (request: ApprovalRequest, action: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setReviewAction(action);
    setShowReviewModal(true);
    setReviewComments('');
  };

  const handleSubmitReview = async () => {
    if (!selectedRequest || !currentUser) return;

    if (reviewAction === 'reject' && !reviewComments.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    setProcessing(true);
    try {
      if (reviewAction === 'approve') {
        await approveRequest(
          selectedRequest.id,
          currentUser.id,
          currentUser.name,
          reviewComments
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
      alert('Failed to process request. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const getRequestTypeIcon = (type: ApprovalRequestType) => {
    switch (type) {
      case ApprovalRequestType.LEAVE:
        return <CalendarDaysIcon className="w-5 h-5" />;
      case ApprovalRequestType.EARLY_DEPARTURE:
      case ApprovalRequestType.LATE_ARRIVAL:
        return <ClockIcon className="w-5 h-5" />;
      case ApprovalRequestType.WORK_FROM_HOME:
        return <UserIcon className="w-5 h-5" />;
      case ApprovalRequestType.EXPENSE:
        return <DocumentTextIcon className="w-5 h-5" />;
      default:
        return <DocumentTextIcon className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: ApprovalStatus) => {
    switch (status) {
      case ApprovalStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case ApprovalStatus.APPROVED:
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case ApprovalStatus.REJECTED:
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'text-red-600 dark:text-red-400';
      case 'Medium':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'Low':
        return 'text-green-600 dark:text-green-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kurchi-gold-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-subtle-background h-full overflow-y-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-text-primary">Approval Requests</h2>
        <p className="text-text-secondary">Review and manage team approval requests</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-kurchi-espresso-800 rounded-xl shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Requests</p>
              <p className="text-2xl font-bold text-kurchi-espresso-900 dark:text-white">{stats.total}</p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-3">
              <DocumentTextIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-kurchi-espresso-800 rounded-xl shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</p>
            </div>
            <div className="bg-yellow-100 dark:bg-yellow-900/30 rounded-full p-3">
              <ClockIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-kurchi-espresso-800 rounded-xl shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Approved</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.approved}</p>
            </div>
            <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-3">
              <CheckCircleIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-kurchi-espresso-800 rounded-xl shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Rejected</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.rejected}</p>
            </div>
            <div className="bg-red-100 dark:bg-red-900/30 rounded-full p-3">
              <XCircleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-kurchi-espresso-800 rounded-xl shadow-md p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterStatus('All')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              filterStatus === 'All'
                ? 'bg-kurchi-gold-500 text-white'
                : 'bg-gray-100 dark:bg-kurchi-espresso-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-kurchi-espresso-600'
            }`}
          >
            All ({stats.total})
          </button>
          <button
            onClick={() => setFilterStatus(ApprovalStatus.PENDING)}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              filterStatus === ApprovalStatus.PENDING
                ? 'bg-yellow-500 text-white'
                : 'bg-gray-100 dark:bg-kurchi-espresso-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-kurchi-espresso-600'
            }`}
          >
            Pending ({stats.pending})
          </button>
          <button
            onClick={() => setFilterStatus(ApprovalStatus.APPROVED)}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              filterStatus === ApprovalStatus.APPROVED
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 dark:bg-kurchi-espresso-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-kurchi-espresso-600'
            }`}
          >
            Approved ({stats.approved})
          </button>
          <button
            onClick={() => setFilterStatus(ApprovalStatus.REJECTED)}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              filterStatus === ApprovalStatus.REJECTED
                ? 'bg-red-500 text-white'
                : 'bg-gray-100 dark:bg-kurchi-espresso-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-kurchi-espresso-600'
            }`}
          >
            Rejected ({stats.rejected})
          </button>
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.length > 0 ? (
          filteredRequests.map(request => (
            <div
              key={request.id}
              className="bg-white dark:bg-kurchi-espresso-800 rounded-xl shadow-md p-6 hover:shadow-lg transition-all"
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                {/* Request Info */}
                <div className="flex-1">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="bg-kurchi-gold-100 dark:bg-kurchi-gold-900/30 rounded-full p-2 text-kurchi-gold-600 dark:text-kurchi-gold-400">
                      {getRequestTypeIcon(request.requestType)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-bold text-kurchi-espresso-900 dark:text-white">
                          {request.title}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(request.status)}`}>
                          {request.status}
                        </span>
                        <span className={`text-xs font-semibold ${getPriorityColor(request.priority)}`}>
                          {request.priority} Priority
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {request.requestType} • {request.requesterName} ({request.requesterRole})
                      </p>
                    </div>
                  </div>

                  <p className="text-kurchi-espresso-900 dark:text-white mb-3">{request.description}</p>

                  {/* Date Range */}
                  {(request.startDate || request.endDate) && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                      <CalendarDaysIcon className="w-4 h-4" />
                      {request.startDate && (
                        <span>{request.startDate.toLocaleDateString()}</span>
                      )}
                      {request.endDate && (
                        <>
                          <span>→</span>
                          <span>{request.endDate.toLocaleDateString()}</span>
                        </>
                      )}
                      {request.duration && (
                        <span className="ml-2 font-semibold">({request.duration})</span>
                      )}
                    </div>
                  )}

                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Requested: {formatDateTime(request.requestedAt)}
                  </p>

                  {/* Review Info */}
                  {request.status !== ApprovalStatus.PENDING && (
                    <div className="mt-3 p-3 bg-gray-50 dark:bg-kurchi-espresso-700 rounded-lg">
                      <p className="text-sm font-semibold text-kurchi-espresso-900 dark:text-white">
                        {request.status === ApprovalStatus.APPROVED ? 'Approved' : 'Rejected'} by {request.reviewerName}
                      </p>
                      {request.reviewedAt && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDateTime(request.reviewedAt)}
                        </p>
                      )}
                      {request.reviewerComments && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                          "{request.reviewerComments}"
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                {request.status === ApprovalStatus.PENDING && (
                  <div className="flex md:flex-col gap-2">
                    <button
                      onClick={() => handleReview(request, 'approve')}
                      className="flex-1 md:flex-initial bg-green-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-600 transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircleIcon className="w-5 h-5" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleReview(request, 'reject')}
                      className="flex-1 md:flex-initial bg-red-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-600 transition-all flex items-center justify-center gap-2"
                    >
                      <XCircleIcon className="w-5 h-5" />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-white dark:bg-kurchi-espresso-800 rounded-xl">
            <DocumentTextIcon className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No {filterStatus !== 'All' ? filterStatus.toLowerCase() : ''} requests found</p>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedRequest && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowReviewModal(false)} />
          <div className="relative min-h-screen flex items-center justify-center p-4">
            <div className="relative bg-white dark:bg-kurchi-espresso-800 rounded-2xl shadow-2xl w-full max-w-lg p-6">
              <h3 className="text-2xl font-bold text-kurchi-espresso-900 dark:text-white mb-4">
                {reviewAction === 'approve' ? 'Approve Request' : 'Reject Request'}
              </h3>

              <div className="mb-4 p-4 bg-gray-50 dark:bg-kurchi-espresso-700 rounded-lg">
                <p className="font-semibold text-kurchi-espresso-900 dark:text-white">{selectedRequest.title}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{selectedRequest.requesterName}</p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Comments {reviewAction === 'reject' && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  value={reviewComments}
                  onChange={(e) => setReviewComments(e.target.value)}
                  rows={4}
                  className="w-full p-3 border border-border rounded-lg bg-surface focus:ring-2 focus:ring-kurchi-gold-500"
                  placeholder={reviewAction === 'approve' ? 'Add optional comments...' : 'Please provide reason for rejection...'}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="flex-1 bg-gray-100 dark:bg-kurchi-espresso-700 text-gray-700 dark:text-gray-300 px-4 py-3 rounded-lg font-semibold hover:bg-gray-200 dark:hover:bg-kurchi-espresso-600"
                  disabled={processing}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitReview}
                  disabled={processing || (reviewAction === 'reject' && !reviewComments.trim())}
                  className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    reviewAction === 'approve'
                      ? 'bg-green-500 text-white hover:bg-green-600'
                      : 'bg-red-500 text-white hover:bg-red-600'
                  }`}
                >
                  {processing ? 'Processing...' : reviewAction === 'approve' ? 'Approve' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalsPage;
