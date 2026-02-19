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
import ExecutionMyDayPage from './execution-team/ExecutionMyDayPage';
import ExecutionTeamMembersPage from './execution-team/ExecutionTeamMembersPage';
import EscalateIssuePage from '../escalation/EscalateIssuePage';
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

  if (currentPage === 'escalate-issue') {
    return <EscalateIssuePage setCurrentPage={setCurrentPage} />;
  }

  if (currentPage === 'request-validation') {
    return <RequestValidationPage />;
  }

  if (currentPage === 'my-day') {
    return <ExecutionMyDayPage />;
  }

  if (currentPage === 'team') {
    if (!(currentUser as any)?.isExecutionManager) {
      return null;
    }
    return <ExecutionTeamMembersPage />;
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

  const headerSubtitle = currentPage === 'timeline'
    ? 'Timeline — monitor plan and daily logs'
    : selectedCaseId ? 'Execution Workspace' : 'Your projects — click one to open the workspace';

  if (currentPage === 'timeline') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50/80 to-background">
        <div className="p-6 lg:p-8">
          <header className="mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-4">
              Execution
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold text-text-primary tracking-tight">Execution Hub</h1>
            <p className="text-text-secondary mt-2 text-lg">{headerSubtitle}</p>
          </header>
          <ExecutionTimelinePage
            caseId={selectedCaseId}
            onSelectProject={(id) => (id ? handleSelectProject(id) : handleBackToProjects())}
            onBack={() => setCurrentPage('planning')}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50/80 to-background">
      <div className="p-6 lg:p-8">
        <header className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-4">
            Execution
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-text-primary tracking-tight">Execution Hub</h1>
          <p className="text-text-secondary mt-2 text-lg">{headerSubtitle}</p>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-text-secondary mt-4 font-medium">Loading your projects...</p>
          </div>
        ) : selectedCaseId ? (
          <ExecutionWorkspace caseId={selectedCaseId} onBack={handleBackToProjects} />
        ) : (
          <ExecutionProjectsPage onSelectProject={handleSelectProject} />
        )}
      </div>
    </div>
  );
};

export default ExecutionTeamDashboard;
