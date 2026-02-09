import React from 'react';
import QuotationAuditPage from './sourcing-team/ProcurementAuditPageNew';
import VendorBiddingPage from './sourcing-team/VendorBiddingPage';
import ExecutionProcurementPage from './sourcing-team/ExecutionProcurementPage';
import VendorManagementPage from './sourcing-team/VendorManagementPage';

const ProcurementTeamDashboard: React.FC<{ currentPage: string; setCurrentPage: (page: string) => void }> = ({
  currentPage,
  setCurrentPage,
}) => {
  switch (currentPage) {
    case 'audit':
      return <QuotationAuditPage />;
    case 'bidding':
      return <VendorBiddingPage />;
    case 'execution-procurement':
      return <ExecutionProcurementPage />;
    case 'vendors':
      return <VendorManagementPage setCurrentPage={setCurrentPage} />;
    default:
      return <QuotationAuditPage />;
  }
};

export default ProcurementTeamDashboard;
