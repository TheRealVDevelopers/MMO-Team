import React, { useState } from 'react';
import SalesTeamSidebar from './sales-team/SalesTeamSidebar';
import SalesOverviewPage from './sales-team/SalesOverviewPage';
import MyLeadsPage from './sales-team/MyLeadsPage';
import MyPerformancePage from './sales-team/MyPerformancePage';

const SalesTeamDashboard: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('overview');

  const renderPage = () => {
    switch (currentPage) {
      case 'overview':
        return <SalesOverviewPage setCurrentPage={setCurrentPage} />;
      case 'leads':
        return <MyLeadsPage />;
      case 'performance':
        return <MyPerformancePage />;
      default:
        return <SalesOverviewPage setCurrentPage={setCurrentPage} />;
    }
  };

  return (
    <div className="flex h-full">
      <SalesTeamSidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        {renderPage()}
      </div>
    </div>
  );
};

export default SalesTeamDashboard;
