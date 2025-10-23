import React, { useState } from 'react';
import ProcurementTeamSidebar from './procurement-team/ProcurementTeamSidebar';
import ProcurementOverviewPage from './procurement-team/ProcurementOverviewPage';
import BiddingManagementPage from './procurement-team/BiddingManagementPage';
import VendorManagementPage from './procurement-team/VendorManagementPage';
import MyPerformancePage from './procurement-team/MyPerformancePage';

const ProcurementTeamDashboard: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('overview');

  const renderPage = () => {
    switch (currentPage) {
      case 'overview':
        return <ProcurementOverviewPage />;
      case 'bidding':
        return <BiddingManagementPage />;
      case 'vendors':
        return <VendorManagementPage />;
      case 'performance':
        return <MyPerformancePage />;
      default:
        return <ProcurementOverviewPage />;
    }
  };

  return (
    <div className="flex h-full">
      <ProcurementTeamSidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        {renderPage()}
      </div>
    </div>
  );
};

export default ProcurementTeamDashboard;