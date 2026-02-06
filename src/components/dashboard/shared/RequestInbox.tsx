import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useCaseApprovals } from '../../../hooks/useCaseApprovals';
import { Case } from '../../../types';
import Card from '../../shared/Card';
import Modal from '../../shared/Modal';
import { 
  MapPinIcon, 
  UserIcon, 
  ClockIcon, 
  CheckIcon, 
  XMarkIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  PlayIcon,
  CheckCircleIcon
} from '../../icons/IconComponents';

interface RequestInboxProps {
  organizationId: string;
}

const RequestInbox: React.FC<RequestInboxProps> = ({ organizationId }) => {
  const { currentUser } = useAuth();
  const [selectedApproval, setSelectedApproval] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showComments, setShowComments] = useState(false);

  const { 
    approvals, 
    loading, 
    error, 
    approveRequest, 
    rejectRequest, 
    startRequest,
    completeRequest,
    acknowledgeRequest,
    loadCaseDetails 
  } = useCaseApprovals({
    organizationId,
    currentUserRole: currentUser?.role as any,
    userId: currentUser?.id || ''
  });

  if (!currentUser) return null;

  // Only show to authorized roles
  const authorizedRoles = ['SUPER_ADMIN', 'SALES_MANAGER', 'MANAGER'];
  if (!authorizedRoles.includes(currentUser.role)) {
    return null;
  }

  const handleStart = async (approvalId: string) => {
    setActionLoading(approvalId);
    try {
      await startRequest(approvalId);
    } catch (err: any) {
      alert(`Error starting request: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleComplete = async (approvalId: string) => {
    setActionLoading(approvalId);
    try {
      await completeRequest(approvalId);
    } catch (err: any) {
      alert(`Error completing request: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleAcknowledge = async (approvalId: string) => {
    setActionLoading(approvalId);
    try {
      await acknowledgeRequest(approvalId);
    } catch (err: any) {
      alert(`Error acknowledging request: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleApprove = async (approvalId: string, comments?: string) => {
    setActionLoading(approvalId);
    try {
      await approveRequest(approvalId, comments);
    } catch (err: any) {
      alert(`Error approving request: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (approvalId: string, reason: string) => {
    setActionLoading(approvalId);
    try {
      await rejectRequest(approvalId, reason);
    } catch (err: any) {
      alert(`Error rejecting request: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewDetails = async (approval: any) => {
    setSelectedApproval(approval);
    setIsDetailModalOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'ASSIGNED': return 'bg-blue-100 text-blue-800';
      case 'ONGOING': return 'bg-indigo-100 text-indigo-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'ACKNOWLEDGED': return 'bg-purple-100 text-purple-800';
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'SITE_VISIT': return <MapPinIcon className="w-5 h-5" />;
      case 'DRAWING': return <DocumentTextIcon className="w-5 h-5" />;
      case 'BOQ': return <DocumentTextIcon className="w-5 h-5" />;
      case 'QUOTATION': return <DocumentTextIcon className="w-5 h-5" />;
      default: return <DocumentTextIcon className="w-5 h-5" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'SITE_VISIT': return 'Site Visit';
      case 'DRAWING': return 'Drawing';
      case 'BOQ': return 'BOQ';
      case 'QUOTATION': return 'Quotation';
      default: return type;
    }
  };

  return (
    <Card className="bg-white border border-border rounded-xl shadow-sm">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <MapPinIcon className="w-5 h-5 text-primary" />
            Request Inbox
          </h3>
          {approvals.length > 0 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
              {approvals.length} pending
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="bg-error/10 border border-error/20 rounded-lg p-4">
            <p className="text-error text-sm">{error}</p>
          </div>
        ) : approvals.length === 0 ? (
          <div className="text-center py-8">
            <MapPinIcon className="w-12 h-12 text-text-tertiary mx-auto mb-3 opacity-50" />
            <p className="text-text-secondary">No pending requests</p>
            <p className="text-xs text-text-tertiary mt-1">Approval requests will appear here</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Pending Requests */}
            <div>
              <h4 className="text-md font-semibold text-text-primary mb-3 flex items-center gap-2">
                <ClockIcon className="w-4 h-4 text-yellow-500" />
                Pending Requests
              </h4>
              <div className="space-y-3">
                {approvals.filter(a => a.status === 'PENDING').map((approval) => (
                  <div 
                    key={approval.id} 
                    className="border border-border rounded-lg p-4 hover:bg-subtle-background transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getTypeIcon(approval.type)}
                          <h4 className="font-medium text-text-primary">{getTypeLabel(approval.type)}</h4>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(approval.status)}`}>
                            {approval.status}
                          </span>
                        </div>
                        
                        <p className="text-sm text-text-secondary mb-2">
                          Requested by {approval.requestedByName}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => handleViewDetails(approval)}
                          className="px-3 py-1 text-sm bg-subtle-background text-text-primary rounded-lg hover:bg-border transition-colors"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleStart(approval.id)}
                          disabled={actionLoading === approval.id}
                          className="px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors flex items-center gap-1"
                        >
                          {actionLoading === approval.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <PlayIcon className="w-4 h-4" />
                          )}
                          Start
                        </button>
                        <button
                          onClick={() => handleApprove(approval.id)}
                          disabled={actionLoading === approval.id}
                          className="px-3 py-1 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors flex items-center gap-1"
                        >
                          {actionLoading === approval.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <CheckIcon className="w-4 h-4" />
                          )}
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(approval.id, 'Rejected by admin')}
                          disabled={actionLoading === approval.id}
                          className="px-3 py-1 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors flex items-center gap-1"
                        >
                          {actionLoading === approval.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <XMarkIcon className="w-4 h-4" />
                          )}
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Ongoing Works */}
            <div>
              <h4 className="text-md font-semibold text-text-primary mb-3 flex items-center gap-2">
                <PlayIcon className="w-4 h-4 text-blue-500" />
                Ongoing Works
              </h4>
              <div className="space-y-3">
                {approvals.filter(a => a.status === 'ASSIGNED' || a.status === 'ONGOING').map((approval) => (
                  <div 
                    key={approval.id} 
                    className="border border-border rounded-lg p-4 hover:bg-subtle-background transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getTypeIcon(approval.type)}
                          <h4 className="font-medium text-text-primary">{getTypeLabel(approval.type)}</h4>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(approval.status)}`}>
                            {approval.status}
                          </span>
                        </div>
                        
                        <p className="text-sm text-text-secondary mb-2">
                          Assigned to {approval.assignedTo || 'Unassigned'}
                        </p>
                        
                        {approval.startedAt && (
                          <p className="text-xs text-text-tertiary">
                            Started: {approval.startedAt.toDate?.().toLocaleString() || 'Unknown time'}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => handleViewDetails(approval)}
                          className="px-3 py-1 text-sm bg-subtle-background text-text-primary rounded-lg hover:bg-border transition-colors"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleComplete(approval.id)}
                          disabled={actionLoading === approval.id}
                          className="px-3 py-1 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors flex items-center gap-1"
                        >
                          {actionLoading === approval.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <CheckCircleIcon className="w-4 h-4" />
                          )}
                          Complete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Completed Requests */}
            <div>
              <h4 className="text-md font-semibold text-text-primary mb-3 flex items-center gap-2">
                <CheckCircleIcon className="w-4 h-4 text-green-500" />
                Completed
              </h4>
              <div className="space-y-3">
                {approvals.filter(a => a.status === 'COMPLETED').map((approval) => (
                  <div 
                    key={approval.id} 
                    className="border border-border rounded-lg p-4 bg-green-50 hover:bg-green-100 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getTypeIcon(approval.type)}
                          <h4 className="font-medium text-text-primary">{getTypeLabel(approval.type)}</h4>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(approval.status)}`}>
                            {approval.status}
                          </span>
                        </div>
                        
                        <p className="text-sm text-text-secondary mb-2">
                          Completed by {approval.assignedTo || 'Unknown user'}
                        </p>
                        
                        {approval.completedAt && (
                          <p className="text-xs text-text-tertiary">
                            Completed: {approval.completedAt.toDate?.().toLocaleString() || 'Unknown time'}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => handleViewDetails(approval)}
                          className="px-3 py-1 text-sm bg-subtle-background text-text-primary rounded-lg hover:bg-border transition-colors"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleAcknowledge(approval.id)}
                          disabled={actionLoading === approval.id}
                          className="px-3 py-1 text-sm bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 transition-colors flex items-center gap-1"
                        >
                          {actionLoading === approval.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <ChatBubbleLeftRightIcon className="w-4 h-4" />
                          )}
                          Acknowledge
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Approval Detail Modal */}
      {isDetailModalOpen && selectedApproval && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={`${getTypeLabel(selectedApproval.type)} Request Details`}
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-text-primary mb-2">Request Information</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-text-tertiary">Type:</span>
                    <p className="font-medium">{getTypeLabel(selectedApproval.type)}</p>
                  </div>
                  <div>
                    <span className="text-text-tertiary">Status:</span>
                    <p className="font-medium">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(selectedApproval.status)}`}>
                        {selectedApproval.status}
                      </span>
                    </p>
                  </div>
                  <div>
                    <span className="text-text-tertiary">Requested By:</span>
                    <p className="font-medium">{selectedApproval.requestedByName}</p>
                  </div>
                  <div>
                    <span className="text-text-tertiary">Required Roles:</span>
                    <p className="font-medium">{selectedApproval.requiredRoles?.join(', ') || 'None'}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-text-primary mb-2">Timeline</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-text-tertiary">Created:</span>
                    <p className="font-medium">
                      {selectedApproval.createdAt?.toDate?.()?.toLocaleString() || 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <span className="text-text-tertiary">Last Updated:</span>
                    <p className="font-medium">
                      {selectedApproval.updatedAt?.toDate?.()?.toLocaleString() || 'Unknown'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Comments Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-text-primary">Comments</h4>
                <button
                  onClick={() => setShowComments(!showComments)}
                  className="text-sm text-primary hover:underline"
                >
                  {showComments ? 'Hide' : 'Show'} Comments
                </button>
              </div>
              
              {showComments && (
                <div className="space-y-3">
                  {selectedApproval.comments?.map((comment: any, index: number) => (
                    <div key={index} className="bg-subtle-background rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-text-primary">{comment.userName}</span>
                        <span className="text-xs text-text-tertiary">
                          {comment.timestamp?.toDate?.()?.toLocaleString() || 'Unknown time'}
                        </span>
                      </div>
                      <p className="text-sm text-text-secondary">{comment.text}</p>
                    </div>
                  )) || (
                    <p className="text-text-secondary text-sm">No comments yet</p>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-border">
              <button
                onClick={() => {
                  const comments = prompt('Enter approval comments (optional):');
                  if (comments !== null) {
                    handleApprove(selectedApproval.id, comments);
                    setIsDetailModalOpen(false);
                  }
                }}
                disabled={actionLoading === selectedApproval.id}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {actionLoading === selectedApproval.id ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <CheckIcon className="w-4 h-4" />
                )}
                Approve with Comments
              </button>
              
              <button
                onClick={() => {
                  const reason = prompt('Enter rejection reason:');
                  if (reason) {
                    handleReject(selectedApproval.id, reason);
                    setIsDetailModalOpen(false);
                  }
                }}
                disabled={actionLoading === selectedApproval.id}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {actionLoading === selectedApproval.id ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <XMarkIcon className="w-4 h-4" />
                )}
                Reject with Reason
              </button>
              
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 bg-subtle-background text-text-primary rounded-lg hover:bg-border transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </Card>
  );
};

export default RequestInbox;