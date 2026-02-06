/**
 * Legacy useLeads hook - Backward compatibility wrapper
 * Maps old Lead type to new Case type (where isProject = false)
 * 
 * @deprecated Use useCases with isProject: false instead
 */

import { useCases } from './useCases';
import { Case, CaseStatus, LeadPipelineStatus } from '../types';
import { DEFAULT_ORGANIZATION_ID } from '../constants';
import { useAuth } from '../context/AuthContext';

// Map CaseStatus to LeadPipelineStatus for backward compatibility
const mapCaseStatusToLeadStatus = (status: CaseStatus): LeadPipelineStatus => {
  switch (status) {
    case CaseStatus.LEAD:
      return LeadPipelineStatus.NEW_NOT_CONTACTED;
    case CaseStatus.SITE_VISIT:
      return LeadPipelineStatus.SITE_VISIT_SCHEDULED;
    case CaseStatus.DRAWING:
      return LeadPipelineStatus.WAITING_FOR_DRAWING;
    case CaseStatus.BOQ:
      return LeadPipelineStatus.WAITING_FOR_QUOTATION;
    case CaseStatus.QUOTATION:
      return LeadPipelineStatus.QUOTATION_SENT;
    case CaseStatus.EXECUTION:
      return LeadPipelineStatus.IN_EXECUTION;
    case CaseStatus.COMPLETED:
      return LeadPipelineStatus.WON;
    default:
      return LeadPipelineStatus.NEW_NOT_CONTACTED;
  }
};

// Legacy Lead type for backward compatibility
export interface Lead extends Omit<Case, 'isProject' | 'status'> {
  // Add legacy fields that don't exist in Case
  projectName?: string; // Maps to title
  value?: number; // Maps to budget.totalBudget
  inquiryDate?: Date; // Maps to createdAt
  assignedTo?: string; // Maps to assignedSales
  status: LeadPipelineStatus; // Override to use LeadPipelineStatus
}

export const useLeads = (organizationId?: string) => {
  const { currentUser } = useAuth();
  const orgId = organizationId || currentUser?.organizationId || DEFAULT_ORGANIZATION_ID;
  
  const { cases, loading, error, createCase, updateCase, deleteCase } = useCases({
    organizationId: orgId,
    isProject: false, // Only get leads
  });

  // Map cases to leads with backward compatibility fields
  const leads: Lead[] = cases.map(c => ({
    ...c,
    projectName: c.title,
    value: c.budget?.totalBudget || 0,
    inquiryDate: c.createdAt,
    assignedTo: c.assignedSales,
    status: mapCaseStatusToLeadStatus(c.status),
  } as Lead));

  // Legacy update function
  const updateLead = async (leadId: string, updates: Partial<Lead>) => {
    // Convert Lead updates to Case updates
    const caseUpdates: any = { ...updates };
    if (updates.projectName) caseUpdates.title = updates.projectName;
    if (updates.assignedTo) caseUpdates.assignedSales = updates.assignedTo;
    // Note: status conversion would need reverse mapping if needed
    return updateCase(leadId, caseUpdates);
  };

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
    updateLead,
    createLead,
    deleteLead: deleteCase,
    addLead: createLead, // Alias for backward compatibility
  };
};

// Export updateLead and addLead as standalone functions for components that import them directly
export const updateLead = async (leadId: string, updates: Partial<Lead>) => {
  console.warn('updateLead: Please use the hook version - useLeads().updateLead');
  // This is a placeholder - components should use the hook
};

export const addLead = async (leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'workflow'>, createdBy: string) => {
  console.warn('addLead: Please use the hook version - useLeads().createLead');
  // This is a placeholder - components should use the hook
};
