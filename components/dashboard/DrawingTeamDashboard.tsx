
import React, { useState } from 'react';
import DrawingTeamSidebar from './drawing-team/DrawingTeamSidebar';
import DrawingOverviewPage from './drawing-team/DrawingOverviewPage';
import ProjectsBoardPage from './drawing-team/ProjectsBoardPage';
import MyPerformancePage from './drawing-team/MyPerformancePage';
import { Project } from '../../types';
import ProjectDetailModal from './drawing-team/ProjectDetailModal';
import MyDayPage from './shared/MyDayPage';
import CommunicationDashboard from '../communication/CommunicationDashboard';
import EscalateIssuePage from '../escalation/EscalateIssuePage';

const DrawingTeamDashboard: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('my-day');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'my-day':
        return <MyDayPage />;
      case 'overview':
        return <DrawingOverviewPage onProjectSelect={handleProjectSelect} />;
      case 'projects':
        return <ProjectsBoardPage onProjectSelect={handleProjectSelect} setCurrentPage={setCurrentPage} />;
      case 'performance':
        return <MyPerformancePage setCurrentPage={setCurrentPage} />;
      case 'communication':
        return <CommunicationDashboard />;
      case 'escalate-issue':
        return <EscalateIssuePage setCurrentPage={setCurrentPage} />;
      default:
        return <MyDayPage />;
    }
  };

  return (
    <>
        <div className="flex h-full">
            <DrawingTeamSidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
            <div className="flex-1 overflow-y-auto">
                {renderPage()}
            </div>
        </div>
        {selectedProject && (
            <ProjectDetailModal 
                project={selectedProject}
                isOpen={!!selectedProject}
                onClose={() => setSelectedProject(null)}
            />
        )}
    </>
  );
};

export default DrawingTeamDashboard;
