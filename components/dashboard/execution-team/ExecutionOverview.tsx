import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useCases } from '../../../hooks/useCases';
import { CaseStatus } from '../../../types';

interface Props {
  setSelectedCase: (caseId: string) => void;
  setCurrentPage: (page: string) => void;
}

const ExecutionOverview: React.FC<Props> = ({ setSelectedCase, setCurrentPage }) => {
  const { currentUser } = useAuth();
  const { cases, loading } = useCases();

  // Filter cases where isProject = true and projectHeadId = currentUser.id
  const myProjects = cases.filter(
    (c) => c.isProject && c.projectHeadId === currentUser?.id
  );

  const handleSelectCase = (caseId: string) => {
    setSelectedCase(caseId);
    setCurrentPage('planning');
  };

  const getStatusBadge = (status: CaseStatus) => {
    const statusConfig = {
      [CaseStatus.WAITING_FOR_PLANNING]: { label: 'Waiting for Planning', color: 'bg-yellow-500' },
      [CaseStatus.ACTIVE]: { label: 'Active', color: 'bg-green-500' },
      [CaseStatus.COMPLETED]: { label: 'Completed', color: 'bg-blue-500' },
    };

    const config = statusConfig[status] || { label: status, color: 'bg-gray-500' };

    return (
      <span className={`px-3 py-1 rounded-full text-white text-sm ${config.color}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Execution Projects</h1>
      
      {myProjects.length === 0 ? (
        <div className="text-center py-12 bg-surface rounded-xl border border-border">
          <p className="text-text-secondary text-lg">No projects assigned to you yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myProjects.map((project) => (
            <div
              key={project.id}
              onClick={() => handleSelectCase(project.id)}
              className="bg-surface border border-border rounded-xl p-6 cursor-pointer hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold">{project.title}</h3>
                {getStatusBadge(project.status)}
              </div>
              
              <div className="space-y-2 text-sm text-text-secondary">
                <p><strong>Client:</strong> {project.clientName}</p>
                <p><strong>Phone:</strong> {project.clientPhone}</p>
                <p><strong>Site:</strong> {project.siteAddress}</p>
                
                {project.costCenter && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <p><strong>Budget:</strong> ₹{project.costCenter.totalBudget.toLocaleString()}</p>
                    <p><strong>Remaining:</strong> ₹{project.costCenter.remainingAmount.toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExecutionOverview;
