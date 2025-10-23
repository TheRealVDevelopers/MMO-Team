

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
import OverviewDashboard from './super-admin/OverviewDashboard';
import TeamManagementPage from './super-admin/TeamManagementPage';
import ProjectTrackingPage from './super-admin/ProjectTrackingPage';
import LeadsManagementPage from './super-admin/LeadsManagementPage';
import ReportsPage from './super-admin/ReportsPage';


const Dashboard: React.FC<{ currentPage: string }> = ({ currentPage }) => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return (
      <div className="text-center py-10">
        <p>Please select a user to view a dashboard.</p>
      </div>
    );
  }

  const renderDashboard = () => {
    // Super Admin gets the multi-page view
    if (currentUser.role === UserRole.SUPER_ADMIN) {
      switch (currentPage) {
        case 'overview':
          return <OverviewDashboard />;
        case 'team':
          return <TeamManagementPage />;
        case 'projects':
          return <ProjectTrackingPage />;
        case 'leads':
          return <LeadsManagementPage />;
        case 'reports':
          return <ReportsPage />;
        default:
          return <OverviewDashboard />;
      }
    }

    // Other roles get their specific single-page dashboard
    switch (currentUser.role) {
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
        return <div className="p-4 sm:p-6 lg:p-8"><PlaceholderDashboard role={currentUser.role} /></div>;
    }
  };

  return <>{renderDashboard()}</>;
};

export default Dashboard;