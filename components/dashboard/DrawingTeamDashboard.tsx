
import React, { useState } from 'react';
import DrawingOverviewPage from './drawing-team/DrawingOverviewPage';
import ProjectsBoardPage from './drawing-team/ProjectsBoardPage';
import MyPerformancePage from './drawing-team/MyPerformancePage';
import { Project } from '../../types';
import ProjectDetailModal from './drawing-team/ProjectDetailModal';
import MyDayPage from './shared/MyDayPage';
import CommunicationDashboard from '../communication/CommunicationDashboard';
import EscalateIssuePage from '../escalation/EscalateIssuePage';
import DrawingWorkQueuePage from './drawing-team/DrawingWorkQueuePage';
import BOQsPage from './drawing-team/BOQsPage';

const DrawingTeamDashboard: React.FC<{ currentPage: string, setCurrentPage: (page: string) => void }> = ({ currentPage, setCurrentPage }) => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'my-day':
        return <MyDayPage />;
      case 'work-queue':
        return <DrawingWorkQueuePage />;
      case 'boqs':
        return <BOQsPage />;
      case 'overview':
        return <DrawingOverviewPage onProjectSelect={handleProjectSelect} />;
      case 'projects':
        return <ProjectsBoardPage onProjectSelect={handleProjectSelect} setCurrentPage={setCurrentPage} />;
      case 'recces':
        // Placeholder for a dedicated RECCE management page if needed
        return <DrawingOverviewPage onProjectSelect={handleProjectSelect} />;
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
      {renderPage()}
      {selectedProject && (
        <ProjectDetailModal
          project={selectedProject}
          isOpen={!!selectedProject}
          onClose={() => setSelectedProject(null)}
          // Pass new callbacks to modal for RECCE/BOQ triggers
          onUploadRecce={() => console.log('Upload RECCE triggered')}
          onCreateBOQ={() => console.log('Create BOQ triggered')}
        />
      )}
    </>
  );
};

export default DrawingTeamDashboard;
