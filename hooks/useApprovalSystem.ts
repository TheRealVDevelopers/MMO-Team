/**
 * STUB: useApprovalSystem - Deprecated
 * The approval system has been replaced by workflow automation.
 * This file exists only to prevent import errors in non-Phase 6A files.
 */

export const useApprovalRequests = () => ({
  requests: [],
  loading: false,
  error: null,
});

export const useMyApprovalRequests = () => ({
  requests: [],
  loading: false,
});

export const useTargetedApprovalRequests = () => ({
  requests: [],
  loading: false,
});

export const useAssignedApprovalRequests = () => ({
  requests: [],
  loading: false,
});

export const useApprovals = () => ({
  submitRequest: async () => {
    console.warn('useApprovals is deprecated - approval system needs rebuild');
  },
});

export const approveRequest = async () => {
  console.warn('approveRequest is deprecated - approval system needs rebuild');
};

export const rejectRequest = async () => {
  console.warn('rejectRequest is deprecated - approval system needs rebuild');
};

export const createApprovalRequest = async () => {
  console.warn('createApprovalRequest is deprecated - approval system needs rebuild');
};

export const completeRequest = async () => {
  console.warn('completeRequest is deprecated - approval system needs rebuild');
};

export const startRequest = async () => {
  console.warn('startRequest is deprecated - approval system needs rebuild');
};

export const getApprovalStats = () => ({
  pending: 0,
  approved: 0,
  rejected: 0,
});

export const acknowledgeRequest = async () => {
  console.warn('acknowledgeRequest is deprecated');
};
