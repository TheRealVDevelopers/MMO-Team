/**
 * Execution Team Dashboard — two views only:
 * 1. Projects list (default): projectHeadId === currentUser
 * 2. Execution Workspace (when project selected): single vertical page, 7 sections
 * No tabs. No budget overview (Accounts owns payments).
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCases } from '../../hooks/useCases';
import ExecutionProjectsPage from './execution-team/ExecutionProjectsPage';
import ExecutionWorkspace from './execution-team/ExecutionWorkspace';
import ExecutionTimelinePage from './execution-team/ExecutionTimelinePage';
import RequestValidationPage from './shared/RequestValidationPage';
import { useSearchParams, useNavigate } from 'react-router-dom';

interface Props {
  currentPage: string;
  setCurrentPage: (page: string) => void;
}

const ExecutionTeamDashboard: React.FC<Props> = ({ currentPage, setCurrentPage }) => {
  const { currentUser } = useAuth();
  const { cases, loading } = useCases();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  if (currentPage === 'request-validation') {
    return <RequestValidationPage />;
  }

  const paramId = searchParams.get('project');
  const [activeProjectId, setActiveProjectId] = useState<string | null>(() =>
    typeof window !== 'undefined' ? localStorage.getItem('execution_active_project') : null
  );

  useEffect(() => {
    if (paramId) {
      if (typeof window !== 'undefined') localStorage.setItem('execution_active_project', paramId);
      setActiveProjectId(paramId);
    }
  }, [paramId]);

  const selectedCaseId = paramId || activeProjectId;

  const handleSelectProject = (caseId: string) => {
    if (typeof window !== 'undefined') localStorage.setItem('execution_active_project', caseId);
    setActiveProjectId(caseId);
    navigate(`/planning?project=${caseId}`, { replace: true });
  };

  const handleBackToProjects = () => {
    setActiveProjectId(null);
    if (typeof window !== 'undefined') localStorage.removeItem('execution_active_project');
    navigate('/planning', { replace: true });
  };

  if (currentPage === 'timeline') {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-text-primary">Execution Hub</h1>
          <p className="text-text-secondary mt-1">Timeline — monitor plan and daily logs</p>
        </div>
        <ExecutionTimelinePage
          caseId={selectedCaseId}
          onSelectProject={(id) => (id ? handleSelectProject(id) : handleBackToProjects())}
          onBack={() => setCurrentPage('planning')}
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-text-primary">Execution Hub</h1>
        <p className="text-text-secondary mt-1">
          {selectedCaseId ? 'Execution Workspace' : 'Your projects — click one to open the workspace'}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      ) : selectedCaseId ? (
        <ExecutionWorkspace caseId={selectedCaseId} onBack={handleBackToProjects} />
      ) : (
        <ExecutionProjectsPage onSelectProject={handleSelectProject} />
      )}
    </div>
  );
};

export default ExecutionTeamDashboard;
