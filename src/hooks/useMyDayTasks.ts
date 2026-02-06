/**
 * STUB: useMyDayTasks - Deprecated
 * My Day tasks now use useCaseTasks with collectionGroup queries.
 * This file exists only to prevent import errors in non-Phase 6A files.
 */

export const addTask = async () => {
  console.warn('addTask is deprecated - use useCaseTasks instead');
};

export const completeTask = async () => {
  console.warn('completeTask is deprecated - use useCaseTasks instead');
};

export const startTask = async () => {
  console.warn('startTask is deprecated - use useCaseTasks instead');
};

export const updateTask = async () => {
  console.warn('updateTask is deprecated - use useCaseTasks instead');
};

export const useMyDayTasks = () => ({
  tasks: [],
  loading: false,
});
