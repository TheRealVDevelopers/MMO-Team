
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import SalesTeamDashboard from './SalesTeamDashboard';
import PlaceholderDashboard from './PlaceholderDashboard';
import SalesGeneralManagerDashboard from './SalesGeneralManagerDashboard';
import DrawingTeamDashboard from './DrawingTeamDashboard';
import QuotationTeamDashboard from './QuotationTeamDashboard';
import SiteEngineerDashboard from './SiteEngineerDashboard';
import ProcurementTeamDashboard from './ProcurementTeamDashboard';
import ExecutionTeamDashboard from './ExecutionTeamDashboard';
import AccountsTeamDashboard from './AccountsTeamDashboard';
import SuperAdminDashboard from './SuperAdminDashboard';
import CommunicationDashboard from '../communication/CommunicationDashboard';


const Dashboard: React.FC<{ currentPage: string; setCurrentPage: (page: string) => void }> = ({ currentPage, setCurrentPage }) => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return (
      <div className="text-center py-10">
        <p>Please select a user to view a dashboard.</p>
      </div>
    );
  }

  switch (currentUser.role) {
    case UserRole.SUPER_ADMIN:
      return <SuperAdminDashboard currentPage={currentPage} setCurrentPage={setCurrentPage} />;
    case UserRole.SALES_TEAM_MEMBER:
      return <SalesTeamDashboard currentPage={currentPage} setCurrentPage={setCurrentPage} />;
    case UserRole.SALES_GENERAL_MANAGER:
      return <SalesGeneralManagerDashboard currentPage={currentPage} setCurrentPage={setCurrentPage} />;
    case UserRole.DRAWING_TEAM:
      return <DrawingTeamDashboard currentPage={currentPage} setCurrentPage={setCurrentPage} />;
    case UserRole.QUOTATION_TEAM:
      return <QuotationTeamDashboard currentPage={currentPage} setCurrentPage={setCurrentPage} />;
    case UserRole.SITE_ENGINEER:
      return <SiteEngineerDashboard currentPage={currentPage} setCurrentPage={setCurrentPage} />;
    case UserRole.PROCUREMENT_TEAM:
      return <ProcurementTeamDashboard currentPage={currentPage} setCurrentPage={setCurrentPage} />;
    case UserRole.EXECUTION_TEAM:
      return <ExecutionTeamDashboard currentPage={currentPage} setCurrentPage={setCurrentPage} />;
    case UserRole.ACCOUNTS_TEAM:
      return <AccountsTeamDashboard currentPage={currentPage} setCurrentPage={setCurrentPage} />;
    default:
      return <PlaceholderDashboard role={currentUser.role} />;
  }
};

export default Dashboard;
