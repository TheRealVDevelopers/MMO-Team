/**
 * Execution Status Transition Service
 * Centralized deterministic status transitions for Execution module
 */

import { doc, updateDoc, runTransaction } from 'firebase/firestore';
import { db } from '../firebase';
import { FIRESTORE_COLLECTIONS } from '../constants';
import { CaseStatus } from '../types';

/**
 * Automatically transition case to EXECUTION_ACTIVE when both approvals are granted
 * This function is idempotent and safe to call multiple times
 * 
 * @param caseId - The case ID to check and potentially transition
 * @returns Promise<boolean> - true if transition occurred, false if not needed
 */
export const checkAndTransitionToExecutionActive = async (caseId: string): Promise<boolean> => {
  if (!db || !caseId) {
    console.warn('[Execution Status] Invalid parameters');
    return false;
  }

  try {
    const caseRef = doc(db, FIRESTORE_COLLECTIONS.CASES, caseId);
    
    // Use transaction for atomicity
    const result = await runTransaction(db, async (transaction) => {
      const caseDoc = await transaction.get(caseRef);
      
      if (!caseDoc.exists()) {
        throw new Error('Case not found');
      }
      
      const caseData = caseDoc.data();
      
      // Only process if current status is PLANNING_SUBMITTED
      if (caseData.status !== CaseStatus.PLANNING_SUBMITTED) {
        return { shouldTransition: false, reason: 'Not in PLANNING_SUBMITTED status' };
      }
      
      // Check if execution plan exists with approvals
      const executionPlan = caseData.executionPlan;
      if (!executionPlan || !executionPlan.approvals) {
        return { shouldTransition: false, reason: 'No execution plan or approvals found' };
      }
      
      const { admin, client } = executionPlan.approvals;
      
      // Both approvals must be true
      if (admin !== true || client !== true) {
        return { shouldTransition: false, reason: 'Both approvals not granted' };
      }
      
      // Perform the transition
      transaction.update(caseRef, {
        status: CaseStatus.EXECUTION_ACTIVE,
        'executionPlan.approvedAt': new Date(),
        updatedAt: new Date()
      });
      
      return { shouldTransition: true, reason: 'Status transitioned to EXECUTION_ACTIVE' };
    });
    
    if (result.shouldTransition) {
      console.log(`[Execution Status] Case ${caseId} transitioned to EXECUTION_ACTIVE`);
      return true;
    } else {
      console.debug(`[Execution Status] Case ${caseId} - ${result.reason}`);
      return false;
    }
    
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