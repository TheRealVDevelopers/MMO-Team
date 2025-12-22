
import React from 'react';
import ProcurementOverviewPage from './procurement-team/ProcurementOverviewPage';
import BiddingManagementPage from './procurement-team/BiddingManagementPage';
import VendorManagementPage from './procurement-team/VendorManagementPage';
import MyPerformancePage from './procurement-team/MyPerformancePage';
import POManagementPage from './procurement-team/POManagementPage';
import MyDayPage from './shared/MyDayPage';
import CommunicationDashboard from '../communication/CommunicationDashboard';
import EscalateIssuePage from '../escalation/EscalateIssuePage';

const ProcurementTeamDashboard: React.FC<{ currentPage: string, setCurrentPage: (page: string) => void }> = ({ currentPage, setCurrentPage }) => {
  switch (currentPage) {
    case 'my-day':
      return <MyDayPage />;
    case 'overview':
      return <ProcurementOverviewPage />;
    case 'bidding':
      return <BiddingManagementPage setCurrentPage={setCurrentPage} />;
    case 'purchase-orders':
      return <POManagementPage setCurrentPage={setCurrentPage} />;
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

export default ProcurementTeamDashboard;
