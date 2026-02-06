import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useApprovals } from '../../../hooks/useApprovals';
import { ApprovalRequest, ApprovalStatus } from '../../../types';
import { CheckCircleIcon, XCircleIcon, ClockIcon, UserIcon } from '@heroicons/react/24/outline';

const ApprovalQueueDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [selectedApproval, setSelectedApproval] = useState<ApprovalRequest | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [comments, setComments] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const {
    pendingApprovals,
    myApprovals,
    loading,
    error,
    approveStage,
    rejectStage
  } = useApprovals(currentUser?.role || null, currentUser?.id || '');

  const getStatusDisplay = (status: ApprovalStatus) => {
    switch (status) {
      case ApprovalStatus.PENDING:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <ClockIcon className="w-4 h-4 mr-1" />
            Pending
          </span>
        );
      case ApprovalStatus.APPROVED:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="w-4 h-4 mr-1" />
            Approved
          </span>
        );
      case ApprovalStatus.REJECTED:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircleIcon className="w-4 h-4 mr-1" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Unknown
          </span>
        );
    }
  };

  const handleApprove = async () => {
    if (!selectedApproval) return;
    
    try {
      await approveStage(selectedApproval.id, currentUser?.name || '', comments);
      setShowApproveModal(false);
      setComments('');
      setSelectedApproval(null);
    } catch (err) {
      console.error('Approval failed:', err);
    }
  };

  const handleReject = async () => {
    if (!selectedApproval) return;
    
    try {
      await rejectStage(selectedApproval.id, currentUser?.name || '', rejectionReason);
      setShowRejectModal(false);
      setRejectionReason('');
      setSelectedApproval(null);
    } catch (err) {
      console.error('Rejection failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-red-700 text-center">
          Error loading approvals: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pending Approvals */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="flex items-center text-lg font-semibold text-gray-900">
              <ClockIcon className="w-5 h-5 mr-2 text-yellow-500" />
              Pending Approvals ({pendingApprovals.length})
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {pendingApprovals.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No pending approvals
                </div>
              ) : (
                pendingApprovals.map((approval) => (
                  <div 
                    key={approval.id} 
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => setSelectedApproval(approval)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900">{approval.stageName}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Requested by {approval.requesterName}
                        </p>
                        <div className="flex items-center mt-2 text-xs text-gray-500">
                          <UserIcon className="w-4 h-4 mr-1" />
                          {new Date(approval.createdAt?.seconds * 1000).toLocaleDateString()}
                        </div>
                      </div>
                      {getStatusDisplay(approval.status)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* My Approvals */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              My Submitted Approvals ({myApprovals.length})
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {myApprovals.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No submitted approvals
                </div>
              ) : (
                myApprovals.map((approval) => (
                  <div 
                    key={approval.id} 
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900">{approval.stageName}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {approval.approvedBy.length}/{approval.requiredRoles.length} approvals received
                        </p>
                      </div>
                      {getStatusDisplay(approval.status)}
                    </div>
                    
                    {approval.approvedBy.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-500 mb-2">Approved by:</p>
                        <div className="space-y-1">
                          {approval.approvedBy.map((action, idx) => (
                            <div key={idx} className="text-xs">
                              <span className="font-medium">{action.userName}</span>
                              <span className="text-gray-500"> ({action.role})</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Approval Detail Modal */}
      {selectedApproval && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-900">
                {selectedApproval.stageName} Approval
              </h3>
              <button 
                onClick={() => setSelectedApproval(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-2">{selectedApproval.stageName}</h3>
                <p className="text-gray-600">
                  Requested by: {selectedApproval.requesterName}
                </p>
                <p className="text-gray-600">
                  Required Roles: {selectedApproval.requiredRoles.join(', ')}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Status</h4>
                <div className="flex items-center space-x-4">
                  {getStatusDisplay(selectedApproval.status)}
                  <span>
                    {selectedApproval.approvedBy.length}/{selectedApproval.requiredRoles.length} approvals
                  </span>
                </div>
              </div>

              {selectedApproval.approvedBy.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Approved By</h4>
                  <div className="space-y-2">
                    {selectedApproval.approvedBy.map((action, idx) => (
                      <div key={idx} className="flex justify-between items-start p-2 bg-white rounded border">
                        <div>
                          <p className="font-medium">{action.userName}</p>
                          <p className="text-sm text-gray-600">{action.role}</p>
                          {action.comments && (
                            <p className="text-sm mt-1 italic">"{action.comments}"</p>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(action.timestamp?.seconds * 1000).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedApproval.status === ApprovalStatus.PENDING && (
                <div className="flex space-x-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setShowApproveModal(true)}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors flex items-center justify-center"
                  >
                    <CheckCircleIcon className="w-4 h-4 mr-2" />
                    Approve
                  </button>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors flex items-center justify-center"
                  >
                    <XCircleIcon className="w-4 h-4 mr-2" />
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Approve Confirmation Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Approve Request</h3>
            </div>
            
            <div className="p-6 space-y-4">
              <p>Are you sure you want to approve this {selectedApproval?.stageName} request?</p>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Comments (Optional)</label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="w-full border border-gray-300 rounded-md p-2"
                  rows={3}
                  placeholder="Add any comments..."
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleApprove}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
                >
                  Confirm Approval
                </button>
                <button
                  onClick={() => setShowApproveModal(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Confirmation Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-red-600">Reject Request</h3>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-red-600">Are you sure you want to reject this request?</p>
              
              <div>
                <label className="block text-sm font-medium text-red-600 mb-2">Rejection Reason *</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full border border-red-300 rounded-md p-2"
                  rows={3}
                  placeholder="Enter reason for rejection..."
                  required
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleReject}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                  disabled={!rejectionReason.trim()}
                >
                  Confirm Rejection
                </button>
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalQueueDashboard;
