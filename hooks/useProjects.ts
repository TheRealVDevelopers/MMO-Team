/**
 * Legacy useProjects hook - Backward compatibility wrapper
 * Maps old Project type to new Case type (where isProject = true)
 * 
 * @deprecated Use useCases with isProject: true instead
 */

import { useCases } from './useCases';
import { Case, CaseStatus } from '../types';
import { DEFAULT_ORGANIZATION_ID } from '../constants';
import { useAuth } from '../context/AuthContext';

// Legacy Project type for backward compatibility
export interface Project extends Omit<Case, 'isProject' | 'budget'> {
  budget: number;
  // Add any Project-specific fields that don't exist in Case
}

export const useProjects = (organizationId?: string) => {
  const { currentUser } = useAuth();
  const orgId = organizationId || currentUser?.organizationId || DEFAULT_ORGANIZATION_ID;

  const { cases, loading, error, updateCase, deleteCase } = useCases({
    organizationId: orgId,
    isProject: true, // Only get projects
  });

  // Map cases to projects (Backward Compatibility)
  const projects = cases.map(c => {
    // Determine budget number
    let budgetValue = 0;
    if (typeof c.budget === 'number') {
      budgetValue = c.budget;
    } else if (c.budget && typeof c.budget === 'object' && 'totalAmount' in c.budget) {
      budgetValue = (c.budget as any).totalAmount || 0;
    } else if (c.financial?.totalBudget) {
      budgetValue = c.financial.totalBudget;
    }

    return {
      ...c,
      budget: budgetValue,
      totalCollected: c.financial?.totalCollected || 0,
      totalExpenses: c.financial?.totalExpenses || 0,
    } as unknown as Project;
  });

  // Legacy update function
  const updateProject = async (projectId: string, updates: Partial<Project>) => {
    return updateCase(projectId, updates as any);
  };

  return {
    projects,
    loading,
    error,
    updateProject,
    deleteProject: deleteCase,
  };
};

// Standalone exports for backward compatibility
export const updateProject = async (projectId: string, updates: any) => {
  console.warn('updateProject: Use useProjects().updateProject instead');
};

export const approveProject = async () => {
  console.warn('approveProject is deprecated');
};

export const rejectProject = async () => {
  console.warn('rejectProject is deprecated');
};

export const addProject = async () => {
  console.warn('addProject stub - use useCases.createCase instead');
};

export const updateProjectStage = async () => {
  console.warn('updateProjectStage stub');
};
