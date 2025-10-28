
import React, { useState } from 'react';
import AccountsTeamSidebar from './accounts-team/AccountsTeamSidebar';
import AccountsOverviewPage from './accounts-team/AccountsOverviewPage';
import InvoicesPage from './accounts-team/InvoicesPage';
import ExpensesPage from './accounts-team/ExpensesPage';
import PaymentsPage from './accounts-team/PaymentsPage';
import ReportsPage from './accounts-team/ReportsPage';
import MyDayPage from './shared/MyDayPage';
import CommunicationDashboard from '../communication/CommunicationDashboard';
import EscalateIssuePage from '../escalation/EscalateIssuePage';

const AccountsTeamDashboard: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('my-day');

  const renderPage = () => {
    switch (currentPage) {
      case 'my-day':
        return <MyDayPage />;
      case 'overview':
        return <AccountsOverviewPage setCurrentPage={setCurrentPage} />;
      case 'invoices':
        return <InvoicesPage setCurrentPage={setCurrentPage} />;
      case 'expenses':
        return <ExpensesPage setCurrentPage={setCurrentPage} />;
      case 'payments':
        return <PaymentsPage setCurrentPage={setCurrentPage} />;
      case 'reports':
        return <ReportsPage setCurrentPage={setCurrentPage} />;
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
      <AccountsTeamSidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <div className="flex-1 overflow-y-auto">
        {renderPage()}
      </div>
    </div>
  );
};

export default AccountsTeamDashboard;
