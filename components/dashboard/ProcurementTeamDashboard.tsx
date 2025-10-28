
import React, { useState } from 'react';
import ProcurementTeamSidebar from './procurement-team/ProcurementTeamSidebar';
import ProcurementOverviewPage from './procurement-team/ProcurementOverviewPage';
import BiddingManagementPage from './procurement-team/BiddingManagementPage';
import VendorManagementPage from './procurement-team/VendorManagementPage';
import MyPerformancePage from './procurement-team/MyPerformancePage';
import MyDayPage from './shared/MyDayPage';
import CommunicationDashboard from '../communication/CommunicationDashboard';
import EscalateIssuePage from '../escalation/EscalateIssuePage';

const ProcurementTeamDashboard: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('my-day');

  const renderPage = () => {
    switch (currentPage) {
      case 'my-day':
        return <MyDayPage />;
      case 'overview':
        return <ProcurementOverviewPage />;
      case 'bidding':
        return <BiddingManagementPage setCurrentPage={setCurrentPage} />;
      case 'vendors':
        return <VendorManagementPage setCurrentPage={setCurrentPage} />;
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
    <div className="flex h-full">
      <ProcurementTeamSidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <div className="flex-1 overflow-y-auto">
        {renderPage()}
      </div>
    </div>
  );
};

export default ProcurementTeamDashboard;
