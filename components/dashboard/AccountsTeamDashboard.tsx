import React, { useState } from 'react';
import AccountsTeamSidebar from './accounts-team/AccountsTeamSidebar';
import AccountsOverviewPage from './accounts-team/AccountsOverviewPage';
import InvoicesPage from './accounts-team/InvoicesPage';
import ExpensesPage from './accounts-team/ExpensesPage';
import PaymentsPage from './accounts-team/PaymentsPage';
import ReportsPage from './accounts-team/ReportsPage';

const AccountsTeamDashboard: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('overview');

  const renderPage = () => {
    switch (currentPage) {
      case 'overview':
        return <AccountsOverviewPage setCurrentPage={setCurrentPage} />;
      case 'invoices':
        return <InvoicesPage />;
      case 'expenses':
        return <ExpensesPage />;
      case 'payments':
        return <PaymentsPage />;
      case 'reports':
        return <ReportsPage />;
      default:
        return <AccountsOverviewPage setCurrentPage={setCurrentPage} />;
    }
  };

  return (
    <div className="flex h-full">
      <AccountsTeamSidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        {renderPage()}
      </div>
    </div>
  );
};

export default AccountsTeamDashboard;