
import React, { useState } from 'react';
import SiteEngineerSidebar from './site-engineer/SiteEngineerSidebar';
import EngineerOverviewPage from './site-engineer/EngineerOverviewPage';
import SiteVisitsPage from './site-engineer/SiteVisitsPage';
import { SiteVisit } from '../../types';
import SiteReportModal from './site-engineer/SiteReportModal';
import PlaceholderDashboard from './PlaceholderDashboard';

const SiteEngineerDashboard: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('overview');
  const [selectedVisit, setSelectedVisit] = useState<SiteVisit | null>(null);

  const handleVisitSelect = (visit: SiteVisit) => {
    setSelectedVisit(visit);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'overview':
        return <EngineerOverviewPage onVisitSelect={handleVisitSelect} />;
      case 'visits':
        return <SiteVisitsPage onVisitSelect={handleVisitSelect} />;
      case 'documents':
          return <div className="p-4 sm:p-6 lg:p-8"><PlaceholderDashboard role="Documents" /></div>;
      default:
        return <EngineerOverviewPage onVisitSelect={handleVisitSelect} />;
    }
  };

  return (
    <>
      <div className="flex h-full">
        <SiteEngineerSidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
        <div className="flex-1 overflow-y-auto">
          {renderPage()}
        </div>
      </div>
      {selectedVisit && (
        <SiteReportModal
          visit={selectedVisit}
          isOpen={!!selectedVisit}
          onClose={() => setSelectedVisit(null)}
        />
      )}
    </>
  );
};

export default SiteEngineerDashboard;