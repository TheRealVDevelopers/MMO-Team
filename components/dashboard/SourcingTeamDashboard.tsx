
import React from 'react';
import SourcingOverviewPage from './sourcing-team/SourcingOverviewPage';
import MyPerformancePage from './sourcing-team/MyPerformancePage';
import MyDayPage from './shared/MyDayPage';
import CommunicationDashboard from '../communication/CommunicationDashboard';
import EscalateIssuePage from '../escalation/EscalateIssuePage';
import QuotationBuilderPage from './sourcing-team/QuotationBuilderPage';
import SimpleItemsCatalog from './sourcing-team/SimpleItemsCatalog';
import QuotationAuditPage from './sourcing-team/ProcurementAuditPageNew';
import WorkQueuePage from './shared/WorkQueuePage';

const ProcurementTeamDashboard: React.FC<{ currentPage: string, setCurrentPage: (page: string) => void }> = ({ currentPage, setCurrentPage }) => {
  switch (currentPage) {
    case 'my-day':
      return <MyDayPage />;
    case 'work-queue':
      return <WorkQueuePage />;
    case 'overview':
      return <SourcingOverviewPage />;
    case 'quotations':
      return <QuotationBuilderPage />;
    case 'items-catalog':
      return <SimpleItemsCatalog />;
    case 'audit':
      return <QuotationAuditPage />;
    // case 'performance':
    //   return <MyPerformancePage setCurrentPage={setCurrentPage} />;
    case 'communication':
      return <CommunicationDashboard />;
    case 'escalate-issue':
      return <EscalateIssuePage setCurrentPage={setCurrentPage} />;
    default:
      return <MyDayPage />;
  }
};

export default ProcurementTeamDashboard;
