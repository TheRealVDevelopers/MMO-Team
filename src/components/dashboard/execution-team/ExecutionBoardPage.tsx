import React, { useState, useMemo } from 'react';
import { Project, ProjectStatus } from '../../../types';
import { PlusIcon } from '../../icons/IconComponents';
import ProjectCard from './ProjectCard';
import ProjectDetailPane from './ProjectDetailPane';
import { useProjects } from '../../../hooks/useProjects';
import { useAuth } from '../../../context/AuthContext';

const KANBAN_COLUMNS = {
  'PLANNING': { title: 'Planning', statuses: [ProjectStatus.ACTIVE, ProjectStatus.PROCUREMENT, ProjectStatus.READY_TO_START, ProjectStatus.EXECUTION_APPROVED, ProjectStatus.BLUEPRINT_CREATED, ProjectStatus.PENDING_BUDGET_APPROVAL] },
  'IN_PROGRESS': { title: 'In Progress', statuses: [ProjectStatus.IN_EXECUTION, ProjectStatus.DESIGN_IN_PROGRESS, ProjectStatus.APPROVED] },
  'CLIENT_FEEDBACK': { title: 'Awaiting Client Feedback', statuses: [ProjectStatus.PENDING_REVIEW, ProjectStatus.REVISIONS_REQUESTED, ProjectStatus.NEGOTIATING, ProjectStatus.QUOTATION_SENT] },
  'DONE': { title: 'Done', statuses: [ProjectStatus.COMPLETED, ProjectStatus.REJECTED, ProjectStatus.ON_HOLD] },
};

// ...

const ExecutionBoardPage: React.FC = () => {
  const { projects: allProjects, loading } = useProjects();
  const { currentUser } = useAuth();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Filter projects assigned to current execution team member
  const userProjects = useMemo(() => {
    if (!currentUser) return [];
    return allProjects.filter(project => {
      const executionTeam = project.assignedTeam?.execution || [];
      return executionTeam.includes(currentUser.id);
    });
  }, [allProjects, currentUser]);

  const executionProjects = useMemo(() =>
    userProjects.filter(p =>
      Object.values(KANBAN_COLUMNS).flatMap(c => c.statuses).includes(p.status)
    ),
    [userProjects]);

  // Set initial selected project
  React.useEffect(() => {
    if (executionProjects.length > 0 && !selectedProject) {
      setSelectedProject(executionProjects[0]);
    }
  }, [executionProjects, selectedProject]);

  const projectsByColumn = useMemo(() => {
    const columns: Record<string, Project[]> = { PLANNING: [], IN_PROGRESS: [], CLIENT_FEEDBACK: [], DONE: [] };
    executionProjects.forEach(p => {
      for (const [key, col] of Object.entries(KANBAN_COLUMNS)) {
        if (col.statuses.includes(p.status)) {
          columns[key].push(p);
          break;
        }
      }
    });
    return columns;
  }, [executionProjects]);

  return (
    <div className="flex h-full bg-subtle-background">
      <div className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8">
        <h2 className="text-2xl font-bold text-text-primary mb-6">Execution Project Board</h2>

        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
              <p className="text-text-secondary">Loading your projects...</p>
            </div>
          </div>
        ) : executionProjects.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md p-8">
              <div className="w-20 h-20 bg-subtle-background rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-2">No Active Projects</h3>
              <p className="text-text-secondary mb-4">You don't have any active projects assigned to you yet.</p>
              <div className="text-sm bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 p-4 rounded-lg">
                <p>New projects may be waiting in the <strong>Approvals</strong> or <strong>Blueprints</strong> queue.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
            {/* Kanban Board */}
            <div className="lg:col-span-8 xl:col-span-9 min-h-0">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 h-full">
                {Object.entries(KANBAN_COLUMNS).map(([key, column]) => (
                  <div key={key} className="bg-background rounded-lg flex flex-col">
                    <div className="flex justify-between items-center p-3 border-b border-border">
                      <h3 className="font-bold text-sm">{column.title}</h3>
                      <button className="text-text-secondary hover:text-text-primary">
                        <PlusIcon />
                      </button>
                    </div>
                    <div className="p-3 space-y-3 overflow-y-auto">
                      {projectsByColumn[key as keyof typeof projectsByColumn].map(project => (
                        <ProjectCard
                          key={project.id}
                          project={project}
                          isSelected={selectedProject?.id === project.id}
                          onClick={() => setSelectedProject(project)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="lg:col-span-4 xl:col-span-3 bg-surface rounded-lg shadow-sm flex flex-col min-h-0">
              {selectedProject ? (
                <ProjectDetailPane project={selectedProject} />
              ) : (
                <div className="flex items-center justify-center h-full text-text-secondary">
                  <p>Select a project to view details</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExecutionBoardPage;
