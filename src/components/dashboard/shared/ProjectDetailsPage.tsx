import React from 'react';
import { useParams } from 'react-router-dom';
import { useCases } from '../../../hooks/useCases';
import Card from '../../shared/Card';

const ProjectDetailsPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { cases, loading } = useCases({});
  
  const project = cases.find(c => c.id === projectId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6">
        <Card>
          <p className="text-center text-text-secondary py-8">Project not found</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">{project.title}</h1>
      
      <Card>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-text-secondary">Status</p>
            <p className="font-semibold text-text-primary">{project.status}</p>
          </div>
          <div>
            <p className="text-sm text-text-secondary">Organization</p>
            <p className="font-semibold text-text-primary">{project.organizationId}</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ProjectDetailsPage;
