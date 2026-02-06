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
export interface Project extends Omit<Case, 'isProject'> {
  // Add any Project-specific fields that don't exist in Case
}

export const useProjects = (organizationId?: string) => {
  const { currentUser } = useAuth();
  const orgId = organizationId || currentUser?.organizationId || DEFAULT_ORGANIZATION_ID;
  
  console.log('[useProjects] Initializing with organizationId:', orgId);
  console.log('[useProjects] currentUser:', currentUser ? { id: currentUser.id, organizationId: currentUser.organizationId } : 'null');
  
  const { cases, loading, error, updateCase, deleteCase } = useCases({
    organizationId: orgId,
    isProject: true, // Only get projects
  });

  console.log('[useProjects] Cases received:', cases.length, 'loading:', loading, 'error:', error);

  // Map cases to projects
  const projects = cases as Project[];

  // Legacy update function
  const updateProject = async (projectId: string, updates: Partial<Project>) => {
    return updateCase(projectId, updates);
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
