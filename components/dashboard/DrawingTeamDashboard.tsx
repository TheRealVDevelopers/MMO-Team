import React, { useState } from 'react';
import DrawingTeamSidebar from './drawing-team/DrawingTeamSidebar';
import DrawingOverviewPage from './drawing-team/DrawingOverviewPage';
import ProjectsBoardPage from './drawing-team/ProjectsBoardPage';
import MyPerformancePage from './drawing-team/MyPerformancePage';
import { Project } from '../../types';
import ProjectDetailModal from './drawing-team/ProjectDetailModal';

const DrawingTeamDashboard: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('overview');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'overview':
        return <DrawingOverviewPage onProjectSelect={handleProjectSelect} />;
      case 'projects':
        return <ProjectsBoardPage onProjectSelect={handleProjectSelect} />;
      case 'performance':
        return <MyPerformancePage />;
      default:
        return <DrawingOverviewPage onProjectSelect={handleProjectSelect} />;
    }
  };

  return (
    <>
        <div className="flex h-full">
            <DrawingTeamSidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
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