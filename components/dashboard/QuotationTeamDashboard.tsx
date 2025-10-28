
import React, { useState } from 'react';
import QuotationTeamSidebar from './quotation-team/QuotationTeamSidebar';
import QuotationOverviewPage from './quotation-team/QuotationOverviewPage';
import NegotiationsBoardPage from './quotation-team/NegotiationsBoardPage';
import MyPerformancePage from './quotation-team/MyPerformancePage';
import { Project } from '../../types';
import QuotationDetailModal from './quotation-team/QuotationDetailModal';
import ItemsCatalogPage from './quotation-team/ItemsCatalogPage';
import ProjectTemplatesPage from './quotation-team/ProjectTemplatesPage';
import PriceAnalyticsPage from './quotation-team/PriceAnalyticsPage';
import MyDayPage from './shared/MyDayPage';
import CommunicationDashboard from '../communication/CommunicationDashboard';
import EscalateIssuePage from '../escalation/EscalateIssuePage';

const QuotationTeamDashboard: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('my-day');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project);
  };
  
  // A mock function to "update" project data
  const handleProjectUpdate = (updatedProject: Project) => {
    setSelectedProject(updatedProject);
    // In a real app, this would trigger a state update in a global context or a data re-fetch.
    // For now, we just update the selected project in the modal.
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'my-day':
        return <MyDayPage />;
      case 'overview':
        return <QuotationOverviewPage onProjectSelect={handleProjectSelect} />;
      case 'negotiations':
        return <NegotiationsBoardPage onProjectSelect={handleProjectSelect} setCurrentPage={setCurrentPage} />;
      case 'performance':
        return <MyPerformancePage setCurrentPage={setCurrentPage} />;
      case 'catalog':
          return <ItemsCatalogPage setCurrentPage={setCurrentPage}/>;
      case 'templates':
          return <ProjectTemplatesPage setCurrentPage={setCurrentPage}/>;
      case 'analytics':
          return <PriceAnalyticsPage setCurrentPage={setCurrentPage}/>;
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
            <QuotationTeamSidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
            <div className="flex-1 overflow-y-auto">
                {renderPage()}
            </div>
        </div>
        {selectedProject && (
            <QuotationDetailModal 
                project={selectedProject}
                isOpen={!!selectedProject}
                onClose={() => setSelectedProject(null)}
                onUpdate={handleProjectUpdate}
            />
        )}
    </>
  );
};

export default QuotationTeamDashboard;
