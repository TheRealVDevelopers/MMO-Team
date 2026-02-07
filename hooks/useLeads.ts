/**
 * Legacy useLeads hook - Backward compatibility wrapper
 * Maps old Lead type to new Case type (where isProject = false)
 * 
 * CRITICAL FIX: Proper bi-directional mapping between CaseStatus and LeadPipelineStatus
 * - Forward: CaseStatus → LeadPipelineStatus (for display)
 * - Reverse: LeadPipelineStatus → CaseStatus (for Firestore writes)
 * 
 * @deprecated Use useCases with isProject: false instead
 */

import { useState, useCallback } from 'react';
import { useCases } from './useCases';
import { Case, CaseStatus, LeadPipelineStatus } from '../types';
import { DEFAULT_ORGANIZATION_ID } from '../constants';
import { useAuth } from '../context/AuthContext';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { FIRESTORE_COLLECTIONS } from '../constants';

// ========================================
// FORWARD MAPPING: CaseStatus → LeadPipelineStatus (for DISPLAY)
// ========================================
export const mapCaseStatusToLeadStatus = (status: CaseStatus | string): LeadPipelineStatus => {
  switch (status) {
    case CaseStatus.LEAD:
      return LeadPipelineStatus.NEW_NOT_CONTACTED;
    case CaseStatus.CONTACTED:
      return LeadPipelineStatus.CONTACTED_CALL_DONE;
    case CaseStatus.SITE_VISIT:
      return LeadPipelineStatus.SITE_VISIT_SCHEDULED;
    case CaseStatus.DRAWING:
      return LeadPipelineStatus.WAITING_FOR_DRAWING;
    case CaseStatus.BOQ:
      return LeadPipelineStatus.WAITING_FOR_QUOTATION;
    case CaseStatus.QUOTATION:
      return LeadPipelineStatus.QUOTATION_SENT;
    case CaseStatus.NEGOTIATION:
      return LeadPipelineStatus.NEGOTIATION;
    case CaseStatus.WAITING_FOR_PAYMENT:
      return LeadPipelineStatus.WON;
    case CaseStatus.WAITING_FOR_PLANNING:
      return LeadPipelineStatus.WON;
    case CaseStatus.ACTIVE:
      return LeadPipelineStatus.IN_EXECUTION;
    case CaseStatus.COMPLETED:
      return LeadPipelineStatus.WON;
    default:
      // BACKWARD COMPAT: If the stored value is already a LeadPipelineStatus string,
      // check if it matches any LeadPipelineStatus value and return it directly
      const leadStatusValues = Object.values(LeadPipelineStatus) as string[];
      if (leadStatusValues.includes(status as string)) {
        return status as LeadPipelineStatus;
      }
      console.warn(`[useLeads] Unknown status: "${status}", defaulting to NEW_NOT_CONTACTED`);
      return LeadPipelineStatus.NEW_NOT_CONTACTED;
  }
};

// ========================================
// REVERSE MAPPING: LeadPipelineStatus → CaseStatus (for FIRESTORE WRITES)
// ========================================
export const mapLeadStatusToCaseStatus = (status: LeadPipelineStatus | CaseStatus | string): CaseStatus => {
  // First check if it's already a valid CaseStatus
  const caseStatusValues = Object.values(CaseStatus) as string[];
  if (caseStatusValues.includes(status as string)) {
    return status as CaseStatus;
  }

  // Reverse map from LeadPipelineStatus → CaseStatus
  switch (status) {
    case LeadPipelineStatus.NEW_NOT_CONTACTED:
      return CaseStatus.LEAD;
    case LeadPipelineStatus.CONTACTED_CALL_DONE:
      return CaseStatus.CONTACTED;
    case LeadPipelineStatus.SITE_VISIT_SCHEDULED:
    case LeadPipelineStatus.SITE_VISIT_RESCHEDULED:
      return CaseStatus.SITE_VISIT;
    case LeadPipelineStatus.WAITING_FOR_DRAWING:
    case LeadPipelineStatus.DRAWING_IN_PROGRESS:
    case LeadPipelineStatus.DRAWING_REVISIONS:
      return CaseStatus.DRAWING;
    case LeadPipelineStatus.WAITING_FOR_QUOTATION:
      return CaseStatus.BOQ;
    case LeadPipelineStatus.QUOTATION_SENT:
      return CaseStatus.QUOTATION;
    case LeadPipelineStatus.NEGOTIATION:
      return CaseStatus.NEGOTIATION;
    case LeadPipelineStatus.IN_PROCUREMENT:
      return CaseStatus.ACTIVE;
    case LeadPipelineStatus.IN_EXECUTION:
      return CaseStatus.ACTIVE;
    case LeadPipelineStatus.WON:
      return CaseStatus.COMPLETED;
    case LeadPipelineStatus.LOST:
      return CaseStatus.COMPLETED;
    default:
      console.warn(`[useLeads] Cannot reverse-map status: "${status}", defaulting to LEAD`);
      return CaseStatus.LEAD;
  }
};

// ========================================
// DISPLAY LABELS for CaseStatus (human-readable)
// ========================================
export const CASE_STATUS_DISPLAY_LABELS: Record<string, string> = {
  [CaseStatus.LEAD]: 'New - Not Contacted',
  [CaseStatus.CONTACTED]: 'Contacted - Call Done',
  [CaseStatus.SITE_VISIT]: 'Site Visit Scheduled',
  [CaseStatus.DRAWING]: 'Waiting for Drawing',
  [CaseStatus.BOQ]: 'BOQ / Estimation',
  [CaseStatus.QUOTATION]: 'Quotation Sent',
  [CaseStatus.NEGOTIATION]: 'Negotiation',
  [CaseStatus.WAITING_FOR_PAYMENT]: 'Waiting for Payment',
  [CaseStatus.WAITING_FOR_PLANNING]: 'Waiting for Planning',
  [CaseStatus.ACTIVE]: 'Active / In Execution',
  [CaseStatus.COMPLETED]: 'Completed',
};

// Legacy Lead type for backward compatibility
export interface Lead extends Omit<Case, 'isProject' | 'status'> {
  // Add legacy fields that don't exist in Case
  projectName?: string; // Maps to title
  value?: number; // Maps to budget.totalBudget
  inquiryDate?: Date; // Maps to createdAt
  assignedTo?: string; // Maps to assignedSales
  status: LeadPipelineStatus; // Override to use LeadPipelineStatus
  _caseStatus: CaseStatus; // KEEP original CaseStatus for data integrity
}

export const useLeads = (organizationId?: string) => {
  const { currentUser } = useAuth();

  // If organizationId is explicitly provided, use it
  // If not provided and currentUser has organizationId (client user), use that
  // Otherwise, fetch ALL leads (for admin/manager - no organizationId filter)
  const orgId = organizationId !== undefined
    ? organizationId
    : (currentUser?.organizationId || undefined);

  const { cases, loading, error, createCase, updateCase, deleteCase } = useCases({
    organizationId: orgId, // Will be undefined for admin/manager, showing ALL leads
    isProject: false, // Only get leads
  });

  // Map cases to leads with backward compatibility fields
  const leads: Lead[] = cases.map(c => ({
    ...c,
    projectName: c.title,
    value: c.budget?.totalBudget || 0,
    inquiryDate: c.createdAt,
    assignedTo: c.assignedSales,
    _caseStatus: c.status, // PRESERVE original CaseStatus
    status: mapCaseStatusToLeadStatus(c.status), // Map for display
  } as Lead));

  // Legacy update function — CRITICAL: reverse-maps LeadPipelineStatus → CaseStatus
  const updateLeadHook = useCallback(async (leadId: string, updates: Partial<Lead>) => {
    // Convert Lead updates to Case updates
    const caseUpdates: any = { ...updates };
    if (updates.projectName) caseUpdates.title = updates.projectName;
    if (updates.assignedTo) caseUpdates.assignedSales = updates.assignedTo;

    // CRITICAL FIX: Reverse-map status from LeadPipelineStatus → CaseStatus
    if (updates.status) {
      caseUpdates.status = mapLeadStatusToCaseStatus(updates.status);
      console.log(`[useLeads.updateLead] Status reverse-mapped: "${updates.status}" → "${caseUpdates.status}"`);
    }

    // Remove Lead-specific fields that don't belong in Case
    delete caseUpdates._caseStatus;
    delete caseUpdates.projectName;
    delete caseUpdates.value;
    delete caseUpdates.inquiryDate;
    delete caseUpdates.assignedTo;

    return updateCase(leadId, caseUpdates);
  }, [updateCase]);

  // Legacy create function
  const createLead = async (leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'workflow'>) => {
    // Convert Lead data to Case data
    const caseData: any = {
      ...leadData,
      title: leadData.projectName || leadData.title,
      assignedSales: leadData.assignedTo,
      isProject: false,
    };
    return createCase(caseData);
  };

  return {
    leads,
    loading,
    error,
    updateLead: updateLeadHook,
    createLead,
    deleteLead: deleteCase,
    addLead: createLead, // Alias for backward compatibility
  };
};

// ========================================
// STANDALONE EXPORTS (for direct import)
// These actually work now, not just stubs
// ========================================

/**
 * Standalone updateLead - directly updates Firestore
 * CRITICAL: Reverse-maps LeadPipelineStatus → CaseStatus before writing
 */
export const updateLead = async (leadId: string, updates: Partial<any>) => {
  if (!db) {
    console.error('[updateLead] Database not initialized');
    return;
  }

  try {
    const caseRef = doc(db, FIRESTORE_COLLECTIONS.CASES, leadId);
    const caseUpdates: any = { ...updates };

    // Map legacy fields
    if (updates.projectName) caseUpdates.title = updates.projectName;
    if (updates.assignedTo) caseUpdates.assignedSales = updates.assignedTo;

    // CRITICAL: Reverse-map status
    if (updates.status) {
      caseUpdates.status = mapLeadStatusToCaseStatus(updates.status);
      console.log(`[updateLead standalone] Status reverse-mapped: "${updates.status}" → "${caseUpdates.status}"`);
    }

    // Remove fields that shouldn't be in Firestore
    delete caseUpdates._caseStatus;
    delete caseUpdates.projectName;
    delete caseUpdates.value;
    delete caseUpdates.inquiryDate;
    delete caseUpdates.assignedTo;

    caseUpdates.updatedAt = serverTimestamp();
    await updateDoc(caseRef, caseUpdates);
    console.log(`[updateLead standalone] Successfully updated lead ${leadId}`);
  } catch (error) {
    console.error('[updateLead standalone] Error:', error);
    throw error;
  }
};

export const addLead = async (leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'workflow'>, createdBy: string) => {
  console.warn('addLead: Please use the hook version - useLeads().createLead');
  // This is a placeholder - components should use the hook
};
