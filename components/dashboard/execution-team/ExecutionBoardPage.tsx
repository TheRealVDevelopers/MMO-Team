import React, { useState, useMemo } from 'react';
import { PROJECTS } from '../../../constants';
import { Project, ProjectStatus } from '../../../types';
import { PlusIcon } from '../../icons/IconComponents';
import ProjectCard from './ProjectCard';
import ProjectDetailPane from './ProjectDetailPane';

const KANBAN_COLUMNS = {
  'PLANNING': { title: 'Planning', statuses: [ProjectStatus.SOURCING] },
  'IN_PROGRESS': { title: 'In Progress', statuses: [ProjectStatus.IN_EXECUTION] },
  'CLIENT_FEEDBACK': { title: 'Awaiting Client Feedback', statuses: [ProjectStatus.PENDING_REVIEW] },
  'DONE': { title: 'Done', statuses: [ProjectStatus.COMPLETED] },
};

const ExecutionBoardPage: React.FC = () => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const executionProjects = useMemo(() =>
    PROJECTS.filter(p =>
      p.assignedTeam.execution?.includes('user-8') && // Simulating assignment to current user
      Object.values(KANBAN_COLUMNS).flatMap(c => c.statuses).includes(p.status)
    ),
    []);

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
      </div>
    </div>
  );
};

export default ExecutionBoardPage;
