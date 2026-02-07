import React, { useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useCases } from '../../../hooks/useCases';
import { CaseStatus } from '../../../types';
import { motion } from 'framer-motion';
import { ClipboardDocumentListIcon, ClockIcon, CheckBadgeIcon, MapPinIcon, UserIcon, CurrencyRupeeIcon, ExclamationTriangleIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

interface Props {
  setSelectedCase: (caseId: string) => void;
  setCurrentPage: (page: string) => void;
}

/**
 * Enhanced Execution Projects List
 * Shows all projects assigned to the current execution team member/project head
 * with clear planning status indicators
 */
const ExecutionOverview: React.FC<Props> = ({ setSelectedCase, setCurrentPage }) => {
  const { currentUser } = useAuth();
  const { cases, loading } = useCases();

  // Filter projects where isProject = true and projectHeadId = currentUser.id
  const myProjects = useMemo(() => {
    return cases.filter(
      (c) => c.isProject && c.projectHeadId === currentUser?.id
    );
  }, [cases, currentUser?.id]);

  // Categorize projects
  const categorizedProjects = useMemo(() => {
    const requiresPlanning = myProjects.filter(
      p => p.status === CaseStatus.WAITING_FOR_PLANNING && !p.executionPlan
    );
    const pendingApproval = myProjects.filter(
      p => p.executionPlan && !p.executionPlan.approvals?.admin && p.status === CaseStatus.WAITING_FOR_PLANNING
    );
    const active = myProjects.filter(p => p.status === CaseStatus.ACTIVE);
    const completed = myProjects.filter(p => p.status === CaseStatus.COMPLETED);

    return { requiresPlanning, pendingApproval, active, completed };
  }, [myProjects]);

  const handleSelectCase = (caseId: string) => {
    setSelectedCase(caseId);
    // Navigation is handled by setSelectedCase (which calls handleSetSelectedCase in parent)
    // Removed direct setCurrentPage call to avoid URL overwrite
  };

  /**
   * Get planning status badge and action
   */
  const getPlanningStatusConfig = (project: typeof myProjects[0]) => {
    // No plan yet - needs to create one
    if (!project.executionPlan) {
      return {
        badge: { label: 'Requires Planning', color: 'bg-amber-500', textColor: 'text-amber-700', bgLight: 'bg-amber-50' },
        action: 'Create Plan',
        icon: ExclamationTriangleIcon,
        priority: 1,
      };
    }

    // Plan exists but not approved by admin
    if (!project.executionPlan.approvals?.admin) {
      return {
        badge: { label: 'Pending Approval', color: 'bg-blue-500', textColor: 'text-blue-700', bgLight: 'bg-blue-50' },
        action: 'View Plan',
        icon: ClockIcon,
        priority: 2,
      };
    }

    // Plan approved, project active
    if (project.status === CaseStatus.ACTIVE) {
      return {
        badge: { label: 'Active', color: 'bg-green-500', textColor: 'text-green-700', bgLight: 'bg-green-50' },
        action: 'Manage',
        icon: CheckBadgeIcon,
        priority: 3,
      };
    }

    // Project completed
    if (project.status === CaseStatus.COMPLETED) {
      return {
        badge: { label: 'Completed', color: 'bg-gray-500', textColor: 'text-gray-600', bgLight: 'bg-gray-50' },
        action: 'View',
        icon: CheckBadgeIcon,
        priority: 4,
      };
    }

    return {
      badge: { label: 'In Progress', color: 'bg-blue-500', textColor: 'text-blue-700', bgLight: 'bg-blue-50' },
      action: 'View',
      icon: ClipboardDocumentListIcon,
      priority: 3,
    };
  };

  const ProjectCard = ({ project, index }: { project: typeof myProjects[0]; index: number }) => {
    const config = getPlanningStatusConfig(project);
    const IconComponent = config.icon;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        onClick={() => handleSelectCase(project.id)}
        className={`bg-surface border rounded-xl overflow-hidden cursor-pointer hover:shadow-xl transition-all group ${config.priority === 1 ? 'border-amber-300 border-2' : 'border-border'
          }`}
      >
        {/* Priority Indicator Strip */}
        {config.priority === 1 && (
          <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
        )}

        <div className="p-5">
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-text-primary truncate">{project.title}</h3>
              <p className="text-sm text-text-secondary truncate">{project.clientName}</p>
            </div>
            <span className={`px-3 py-1.5 rounded-full text-white text-xs font-bold uppercase tracking-wide ${config.badge.color}`}>
              {config.badge.label}
            </span>
          </div>

          {/* Details */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-text-secondary">
              <UserIcon className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{project.clientPhone || 'No phone'}</span>
            </div>
            <div className="flex items-center gap-2 text-text-secondary">
              <MapPinIcon className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{project.siteAddress || 'No address'}</span>
            </div>

            {/* Budget Info (only for active/planned projects) */}
            {project.costCenter && (
              <div className="flex items-center gap-2 text-text-secondary">
                <CurrencyRupeeIcon className="w-4 h-4 flex-shrink-0" />
                <span>₹{project.costCenter.totalBudget?.toLocaleString() || 0}</span>
                <span className="text-xs text-green-600">
                  (₹{project.costCenter.remainingAmount?.toLocaleString() || 0} remaining)
                </span>
              </div>
            )}

            {/* Planning Info - only show for waiting_for_planning */}
            {project.status === CaseStatus.WAITING_FOR_PLANNING && project.financial?.totalBudget && (
              <div className="flex items-center gap-2 text-text-secondary">
                <CurrencyRupeeIcon className="w-4 h-4 flex-shrink-0" />
                <span>Budget: ₹{project.financial.totalBudget.toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className={`mt-4 pt-4 border-t border-border flex items-center justify-between`}>
            <div className="flex items-center gap-2">
              <IconComponent className={`w-5 h-5 ${config.badge.textColor}`} />
              <span className={`text-sm font-semibold ${config.badge.textColor}`}>
                {config.action}
              </span>
            </div>
            <ArrowRightIcon className="w-5 h-5 text-text-tertiary group-hover:text-primary transition-colors" />
          </div>
        </div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-text-secondary mt-4">Loading your projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Section: Requires Planning (Priority) */}
      {categorizedProjects.requiresPlanning.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <ExclamationTriangleIcon className="w-6 h-6 text-amber-500" />
            <h2 className="text-xl font-bold text-text-primary">Requires Planning</h2>
            <span className="px-2.5 py-0.5 bg-amber-100 text-amber-700 rounded-full text-sm font-bold">
              {categorizedProjects.requiresPlanning.length}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {categorizedProjects.requiresPlanning.map((project, index) => (
              <ProjectCard key={project.id} project={project} index={index} />
            ))}
          </div>
        </div>
      )}

      {/* Section: Pending Approval */}
      {categorizedProjects.pendingApproval.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <ClockIcon className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-bold text-text-primary">Pending Approval</h2>
            <span className="px-2.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-sm font-bold">
              {categorizedProjects.pendingApproval.length}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {categorizedProjects.pendingApproval.map((project, index) => (
              <ProjectCard key={project.id} project={project} index={index} />
            ))}
          </div>
        </div>
      )}

      {/* Section: Active Projects */}
      {categorizedProjects.active.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <CheckBadgeIcon className="w-6 h-6 text-green-500" />
            <h2 className="text-xl font-bold text-text-primary">Active Projects</h2>
            <span className="px-2.5 py-0.5 bg-green-100 text-green-700 rounded-full text-sm font-bold">
              {categorizedProjects.active.length}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {categorizedProjects.active.map((project, index) => (
              <ProjectCard key={project.id} project={project} index={index} />
            ))}
          </div>
        </div>
      )}

      {/* Section: Completed Projects */}
      {categorizedProjects.completed.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <CheckBadgeIcon className="w-6 h-6 text-gray-500" />
            <h2 className="text-xl font-bold text-text-primary">Completed</h2>
            <span className="px-2.5 py-0.5 bg-gray-100 text-gray-600 rounded-full text-sm font-bold">
              {categorizedProjects.completed.length}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {categorizedProjects.completed.map((project, index) => (
              <ProjectCard key={project.id} project={project} index={index} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {myProjects.length === 0 && (
        <div className="text-center py-16 bg-surface rounded-xl border border-border">
          <ClipboardDocumentListIcon className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
          <h3 className="text-xl font-bold text-text-primary mb-2">No Projects Yet</h3>
          <p className="text-text-secondary max-w-md mx-auto">
            You don't have any projects assigned to you yet. When a project is created and you're assigned as the Project Head, it will appear here.
          </p>
        </div>
      )}
    </div>
  );
};

export default ExecutionOverview;
