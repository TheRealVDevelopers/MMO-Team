import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCases } from '../../hooks/useCases';
import ExecutionOverview from './execution-team/ExecutionOverview';
import ExecutionPlanning from './execution-team/ExecutionPlanning';
import ExecutionTimeline from './execution-team/ExecutionTimeline';
import ExecutionTasks from './execution-team/ExecutionTasks';
import ExecutionDailyUpdates from './execution-team/ExecutionDailyUpdates';
import ExecutionMaterials from './execution-team/ExecutionMaterials';
import ExecutionIssues from './execution-team/ExecutionIssues';
import ExecutionDocuments from './execution-team/ExecutionDocuments';
import ExecutionJMS from './execution-team/ExecutionJMS';
import { CaseStatus } from '../../types';

interface Props {
  currentPage: string;
  setCurrentPage: (page: string) => void;
}

const ExecutionTeamDashboard: React.FC<Props> = ({ currentPage, setCurrentPage }) => {
  const { currentUser } = useAuth();
  const { cases, loading } = useCases();
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);

  // Filter my projects
  const myProjects = cases.filter(
    (c) => c.isProject && c.projectHeadId === currentUser?.id
  );

  // Calculate stats
  const activeProjects = myProjects.filter(c => c.status === CaseStatus.ACTIVE).length;
  const waitingPlanning = myProjects.filter(c => c.status === CaseStatus.WAITING_FOR_PLANNING).length;
  const completedProjects = myProjects.filter(c => c.status === CaseStatus.COMPLETED).length;
  
  const totalBudget = myProjects.reduce((sum, p) => sum + (p.costCenter?.totalBudget || 0), 0);
  const totalSpent = myProjects.reduce((sum, p) => sum + (p.costCenter?.spentAmount || 0), 0);
  const totalRemaining = myProjects.reduce((sum, p) => sum + (p.costCenter?.remainingAmount || 0), 0);

  const renderContent = () => {
    switch (currentPage) {
      case 'overview':
        return <ExecutionOverview setSelectedCase={setSelectedCaseId} setCurrentPage={setCurrentPage} />;
      case 'planning':
        return <ExecutionPlanning caseId={selectedCaseId} setCurrentPage={setCurrentPage} />;
      case 'timeline':
        return <ExecutionTimeline caseId={selectedCaseId} />;
      case 'tasks':
        return <ExecutionTasks caseId={selectedCaseId} />;
      case 'daily-updates':
        return <ExecutionDailyUpdates caseId={selectedCaseId} />;
      case 'materials':
        return <ExecutionMaterials caseId={selectedCaseId} />;
      case 'issues':
        return <ExecutionIssues caseId={selectedCaseId} />;
      case 'documents':
        return <ExecutionDocuments caseId={selectedCaseId} />;
      case 'jms':
        return <ExecutionJMS caseId={selectedCaseId} />;
      default:
        return <ExecutionOverview setSelectedCase={setSelectedCaseId} setCurrentPage={setCurrentPage} />;
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Execution Dashboard</h1>
        <p className="text-text-secondary mt-1">Manage project execution, track progress, and coordinate teams</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-sm text-text-secondary">Total Projects</p>
          <p className="text-2xl font-bold mt-1">{myProjects.length}</p>
        </div>
        
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-sm text-text-secondary">Active Projects</p>
          <p className="text-2xl font-bold mt-1 text-green-600">{activeProjects}</p>
        </div>
        
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-sm text-text-secondary">Waiting Planning</p>
          <p className="text-2xl font-bold mt-1 text-yellow-600">{waitingPlanning}</p>
        </div>
        
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-sm text-text-secondary">Completed</p>
          <p className="text-2xl font-bold mt-1 text-blue-600">{completedProjects}</p>
        </div>
      </div>

      {/* Budget Overview */}
      <div className="bg-surface border border-border rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Budget Overview</h2>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-text-secondary">Total Budget</p>
            <p className="text-xl font-bold">₹{totalBudget.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-text-secondary">Total Spent</p>
            <p className="text-xl font-bold text-red-600">₹{totalSpent.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-text-secondary">Total Remaining</p>
            <p className="text-xl font-bold text-green-600">₹{totalRemaining.toLocaleString()}</p>
          </div>
        </div>
        
        {totalBudget > 0 && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all"
                style={{ width: `${(totalSpent / totalBudget) * 100}%` }}
              />
            </div>
            <p className="text-xs text-text-secondary mt-1">
              {((totalSpent / totalBudget) * 100).toFixed(1)}% of total budget utilized
            </p>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto border-b border-border pb-2">
        <button
          onClick={() => setCurrentPage('overview')}
          className={`px-4 py-2 rounded-lg whitespace-nowrap ${
            currentPage === 'overview'
              ? 'bg-primary text-white'
              : 'bg-surface hover:bg-background'
          }`}
        >
          📋 Projects
        </button>
        <button
          onClick={() => setCurrentPage('planning')}
          className={`px-4 py-2 rounded-lg whitespace-nowrap ${
            currentPage === 'planning'
              ? 'bg-primary text-white'
              : 'bg-surface hover:bg-background'
          }`}
        >
          📝 Planning
        </button>
        <button
          onClick={() => setCurrentPage('timeline')}
          className={`px-4 py-2 rounded-lg whitespace-nowrap ${
            currentPage === 'timeline'
              ? 'bg-primary text-white'
              : 'bg-surface hover:bg-background'
          }`}
        >
          📅 Timeline
        </button>
        <button
          onClick={() => setCurrentPage('tasks')}
          className={`px-4 py-2 rounded-lg whitespace-nowrap ${
            currentPage === 'tasks'
              ? 'bg-primary text-white'
              : 'bg-surface hover:bg-background'
          }`}
        >
          ✅ Tasks
        </button>
        <button
          onClick={() => setCurrentPage('daily-updates')}
          className={`px-4 py-2 rounded-lg whitespace-nowrap ${
            currentPage === 'daily-updates'
              ? 'bg-primary text-white'
              : 'bg-surface hover:bg-background'
          }`}
        >
          📊 Daily Updates
        </button>
        <button
          onClick={() => setCurrentPage('materials')}
          className={`px-4 py-2 rounded-lg whitespace-nowrap ${
            currentPage === 'materials'
              ? 'bg-primary text-white'
              : 'bg-surface hover:bg-background'
          }`}
        >
          🧱 Materials
        </button>
        <button
          onClick={() => setCurrentPage('issues')}
          className={`px-4 py-2 rounded-lg whitespace-nowrap ${
            currentPage === 'issues'
              ? 'bg-primary text-white'
              : 'bg-surface hover:bg-background'
          }`}
        >
          ⚠️ Issues
        </button>
        <button
          onClick={() => setCurrentPage('documents')}
          className={`px-4 py-2 rounded-lg whitespace-nowrap ${
            currentPage === 'documents'
              ? 'bg-primary text-white'
              : 'bg-surface hover:bg-background'
          }`}
        >
          📁 Documents
        </button>
        <button
          onClick={() => setCurrentPage('jms')}
          className={`px-4 py-2 rounded-lg whitespace-nowrap ${
            currentPage === 'jms'
              ? 'bg-primary text-white'
              : 'bg-surface hover:bg-background'
          }`}
        >
          📋 JMS
        </button>
      </div>

      {/* Content */}
      <div>
        {loading ? (
          <div className="text-center py-12">
            <p className="text-lg">Loading...</p>
          </div>
        ) : (
          renderContent()
        )}
      </div>
    </div>
  );
};

export default ExecutionTeamDashboard;
