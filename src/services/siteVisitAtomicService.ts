import {
  collection,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  getDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  Case,
  CaseTask,
  CaseStatus,
  TaskType,
  TaskStatus,
  CaseWorkflow,
  UserRole,
} from '../types';
import { FIRESTORE_COLLECTIONS } from '../constants';
import { ApprovalWorkflowService } from './approvalWorkflowService';

// ATOMIC WORKFLOW OPERATIONS
// ========================================

/**
 * ATOMIC OPERATION: Initiate Site Visit Request
 * 
 * Performs all required operations in a single transaction:
 * 1. Updates Case document status
 * 2. Creates Site Visit Task
 * 3. Creates Request Inbox Entry
 * 4. Logs activity
 * 
 * @param organizationId - Organization ID
 * @param caseId - Case ID
 * @param requesterId - ID of user initiating the request
 * @param requesterName - Name of user initiating the request
 */
export const initiateSiteVisitAtomically = async (
  organizationId: string,
  caseId: string,
  requesterId: string,
  requesterName: string
): Promise<void> => {
  if (!db) {
    throw new Error('Database not initialized');
  }

  const batch = writeBatch(db);
  
  try {
    // 1. Update Case document
    const caseRef = doc(
      db,
      FIRESTORE_COLLECTIONS.ORGANIZATIONS,
      organizationId,
      FIRESTORE_COLLECTIONS.CASES,
      caseId
    );
    
    batch.update(caseRef, {
      status: CaseStatus.SITE_VISIT,
      stage: 'SITE_VISIT',
      updatedAt: serverTimestamp(),
    });

    // 2. Create Site Visit Task
    const tasksCollection = collection(
      db,
      FIRESTORE_COLLECTIONS.ORGANIZATIONS,
      organizationId,
      FIRESTORE_COLLECTIONS.CASES,
      caseId,
      'tasks'
    );
    
    const taskDoc = doc(tasksCollection);
    batch.set(taskDoc, {
      type: 'SITE_VISIT',
      status: 'PENDING',
      assignedRole: UserRole.SITE_ENGINEER,
      createdBy: requesterId,
      createdByName: requesterName,
      createdAt: serverTimestamp(),
      caseId: caseId,
      organizationId: organizationId,
    });

    // 3. Create Request Inbox Entry
    const requestsCollection = collection(
      db,
      FIRESTORE_COLLECTIONS.ORGANIZATIONS,
      organizationId,
      'requests'
    );
    
    const requestDoc = doc(requestsCollection);
    batch.set(requestDoc, {
      caseId: caseId,
      type: 'SITE_VISIT_REQUEST',
      requestedBy: requesterId,
      requestedByName: requesterName,
      status: 'PENDING',
      visibleTo: ['SUPER_ADMIN', 'SALES_MANAGER'],
      createdAt: serverTimestamp(),
      organizationId: organizationId,
    });

    // 4. Execute all operations atomically
    console.log('[AtomicService] Executing batch write with:', {
      organizationId,
      caseId,
      requesterId,
      requesterName
    });
    
    await batch.commit();
    
    console.log('[Workflow] Atomic site visit initiation completed for case:', caseId);
    
  } catch (error) {
    console.error('[Workflow] Failed to initiate site visit atomically:', error);
    throw error;
  }
};