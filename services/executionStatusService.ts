/**
 * Execution Status Transition Service
 * Centralized deterministic status transitions for Execution module
 */

import { doc, runTransaction } from 'firebase/firestore';
import { db } from '../firebase';
import { FIRESTORE_COLLECTIONS } from '../constants';
import { CaseStatus } from '../types';

/**
 * Transition case to EXECUTION_ACTIVE when execution plan approvalStatus is 'approved'.
 * Idempotent and safe to call multiple times.
 */
export const checkAndTransitionToExecutionActive = async (caseId: string): Promise<boolean> => {
  if (!db || !caseId) {
    console.warn('[Execution Status] Invalid parameters');
    return false;
  }

  try {
    const caseRef = doc(db, FIRESTORE_COLLECTIONS.CASES, caseId);
    
    const result = await runTransaction(db, async (transaction) => {
      const caseDoc = await transaction.get(caseRef);
      if (!caseDoc.exists()) throw new Error('Case not found');
      const caseData = caseDoc.data();
      if (caseData.status !== CaseStatus.PLANNING_SUBMITTED) {
        return { shouldTransition: false, reason: 'Not in PLANNING_SUBMITTED status' };
      }
      const executionPlan = caseData.executionPlan;
      if (!executionPlan || executionPlan.approvalStatus !== 'approved') {
        return { shouldTransition: false, reason: 'Execution plan not approved' };
      }
      transaction.update(caseRef, {
        status: CaseStatus.EXECUTION_ACTIVE,
        updatedAt: new Date()
      });
      return { shouldTransition: true, reason: 'Status transitioned to EXECUTION_ACTIVE' };
    });
    
    if (result.shouldTransition) {
      console.log(`[Execution Status] Case ${caseId} transitioned to EXECUTION_ACTIVE`);
      return true;
    }
    console.debug(`[Execution Status] Case ${caseId} - ${result.reason}`);
    return false;
  } catch (error) {
    console.error(`[Execution Status] Error checking transition for case ${caseId}:`, error);
    return false;
  }
};

/**
 * Check if a case is in completed state (immutable)
 */
export const isCaseCompleted = (status: CaseStatus): boolean => {
  return status === CaseStatus.COMPLETED;
};

/**
 * Check if planning is locked (immutable after submission)
 */
export const isPlanningLocked = (status: CaseStatus): boolean => {
  return status !== CaseStatus.WAITING_FOR_PLANNING;
};