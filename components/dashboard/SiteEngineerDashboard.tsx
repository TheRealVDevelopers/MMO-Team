
import React from 'react';
import SiteEngineerProjectBoard from './site-engineer/SiteEngineerProjectBoard';
import SiteEngineerWorkQueuePage from './site-engineer/SiteEngineerWorkQueuePage';
import MyDayPage from './shared/MyDayPage';
import CommunicationDashboard from '../communication/CommunicationDashboard';
import EscalateIssuePage from '../escalation/EscalateIssuePage';
import RequestValidationPage from './shared/RequestValidationPage';

const SiteEngineerDashboard: React.FC<{ currentPage: string, setCurrentPage: (page: string) => void }> = ({ currentPage, setCurrentPage }) => {
  switch (currentPage) {
    case 'my-day':
      return <MyDayPage />;
    case 'request-validation':
      return <RequestValidationPage />;
    case 'work-queue':
      return <SiteEngineerWorkQueuePage />;
    case 'board':
      return <SiteEngineerProjectBoard />;
    case 'communication':
      return <CommunicationDashboard />;
    case 'escalate-issue':
      return <EscalateIssuePage setCurrentPage={setCurrentPage} />;
    default:
      return <SiteEngineerProjectBoard />;
  }
};

export default SiteEngineerDashboard;
