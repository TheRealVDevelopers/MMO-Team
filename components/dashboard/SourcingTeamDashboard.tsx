
import React from 'react';
import SourcingOverviewPage from './sourcing-team/SourcingOverviewPage';
import BiddingManagementPage from './sourcing-team/BiddingManagementPage';
import VendorManagementPage from './sourcing-team/VendorManagementPage';
import MyPerformancePage from './sourcing-team/MyPerformancePage';
import POManagementPage from './sourcing-team/POManagementPage';
import MyDayPage from './shared/MyDayPage';
import CommunicationDashboard from '../communication/CommunicationDashboard';
import EscalateIssuePage from '../escalation/EscalateIssuePage';

const SourcingTeamDashboard: React.FC<{ currentPage: string, setCurrentPage: (page: string) => void }> = ({ currentPage, setCurrentPage }) => {
  switch (currentPage) {
    case 'my-day':
      return <MyDayPage />;
    case 'overview':
      return <SourcingOverviewPage />;
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

export default SourcingTeamDashboard;
