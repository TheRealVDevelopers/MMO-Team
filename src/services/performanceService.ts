/**
 * STUB: performanceService - Needs rebuild
 * Performance tracking needs to be rebuilt with new Case-centric architecture.
 */

export const calculateUserPerformance = () => ({
  flag: 'green' as const,
  reason: 'Performance tracking disabled during rebuild',
});

export const monitorUserPerformance = () => {
  console.warn('Performance monitoring disabled - needs rebuild with useCaseTasks');
  return () => {};
};

export const checkAllUsersPerformance = async () => {
  console.warn('Performance checking disabled - needs rebuild');
};

export const monitorAllUsersPerformance = () => {
  console.warn('monitorAllUsersPerformance stub - needs rebuild');
  return () => {};
};

export const updateAllUsersPerformance = async () => {
  console.warn('updateAllUsersPerformance stub - needs rebuild');
};
