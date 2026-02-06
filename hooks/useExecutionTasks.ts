/**
 * STUB: useExecutionTasks - Deprecated
 * Execution tasks now use useCaseTasks with type filtering.
 * This file exists only to prevent import errors in non-Phase 6A files.
 */

import { TaskStatus } from '../types';

export const useExecutionTasks = () => ({
  tasks: [],
  loading: false,
  error: null,
});

export const useAllExecutionTasks = () => ({
  tasks: [],
  loading: false,
});

export const addTask = async () => {
  console.warn('addTask is deprecated - use useCaseTasks instead');
};

export const updateTask = async () => {
  console.warn('updateTask is deprecated - use useCaseTasks instead');
};

export const deleteTask = async () => {
  console.warn('deleteTask is deprecated - use useCaseTasks instead');
};

export const completeTask = async () => {
  console.warn('completeTask is deprecated - use useCaseTasks instead');
};
