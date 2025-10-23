
import React, { useState } from 'react';
import SalesManagerSidebar from './sales-manager/SalesManagerSidebar';
import SalesOverviewPage from './sales-manager/SalesOverviewPage';
import LeadManagementPage from './sales-manager/LeadManagementPage';
import TeamManagementPage from './sales-manager/TeamManagementPage';
import ReportsPage from './sales-manager/ReportsPage';

const SalesGeneralManagerDashboard: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('overview');

  const renderPage = () => {
    switch (currentPage) {
      case 'overview':
        return <SalesOverviewPage setCurrentPage={setCurrentPage} />;
      case 'leads':
        return <LeadManagementPage />;
      case 'team':
        return <TeamManagementPage />;
      case 'reports':
        return <ReportsPage />;
      default:
        return <SalesOverviewPage setCurrentPage={setCurrentPage} />;
    }
  };

  return (
    <div className="flex h-full">
      <SalesManagerSidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        {renderPage()}
      </div>
    </div>
  );
};

export default SalesGeneralManagerDashboard;