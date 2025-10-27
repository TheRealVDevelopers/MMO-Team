


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


const Dashboard: React.FC<{ currentPage: string; setCurrentPage?: (page: string) => void }> = ({ currentPage, setCurrentPage }) => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return (
      <div className="text-center py-10 p-4 sm:p-6 lg:p-8">
        <p>Please select a user to view a dashboard.</p>
      </div>
    );
  }

  const renderRoleDashboard = () => {
    switch (currentUser.role) {
      case UserRole.SUPER_ADMIN:
        return <SuperAdminDashboard currentPage={currentPage} setCurrentPage={setCurrentPage!} />;
      case UserRole.SALES_TEAM_MEMBER:
        return <SalesTeamDashboard />;
      case UserRole.SALES_GENERAL_MANAGER:
        return <SalesGeneralManagerDashboard />;
      case UserRole.DRAWING_TEAM:
        return <DrawingTeamDashboard />;
      case UserRole.QUOTATION_TEAM:
        return <QuotationTeamDashboard />;
      case UserRole.SITE_ENGINEER:
        return <SiteEngineerDashboard />;
      case UserRole.PROCUREMENT_TEAM:
        return <ProcurementTeamDashboard />;
      case UserRole.EXECUTION_TEAM:
        return <ExecutionTeamDashboard />;
      case UserRole.ACCOUNTS_TEAM:
        return <AccountsTeamDashboard />;
      default:
        return <PlaceholderDashboard role={currentUser.role} />;
    }
  };

  // Some dashboards have their own padding or need full width
  const fullWidthRoles: UserRole[] = [
      UserRole.SALES_TEAM_MEMBER, 
      UserRole.EXECUTION_TEAM,
      UserRole.DRAWING_TEAM,
      UserRole.QUOTATION_TEAM,
      UserRole.SITE_ENGINEER,
      UserRole.PROCUREMENT_TEAM,
      UserRole.ACCOUNTS_TEAM,
      UserRole.SALES_GENERAL_MANAGER,
  ];

  if (fullWidthRoles.includes(currentUser.role)) {
      return renderRoleDashboard();
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 h-full">
        {renderRoleDashboard()}
    </div>
  );
};

export default Dashboard;