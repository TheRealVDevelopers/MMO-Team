import React from 'react';
import { useCases } from '../../../hooks/useCases';
import Card from '../../shared/Card';

const ProjectsListPage: React.FC = () => {
  const { cases, loading } = useCases({ isProject: true });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const projects = cases.filter(c => c.isProject);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">Projects</h1>
      
      {projects.length === 0 ? (
        <Card>
          <p className="text-center text-text-secondary py-8">No projects found</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {projects.map((project) => (
            <Card key={project.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <h3 className="font-semibold text-text-primary">{project.title}</h3>
              <p className="text-sm text-text-secondary mt-1">Status: {project.status}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectsListPage;
