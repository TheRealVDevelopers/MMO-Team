/**
 * STUB: useActivities - Needs rebuild
 * Activity logging needs to be rebuilt with new Case-centric architecture.
 */

export const useActivities = (caseId?: string) => ({
  activities: [],
  loading: false,
  error: null,
});

export const logActivity = async (caseId: string, activity: any) => {
  console.warn('logActivity stub - needs implementation');
};
