
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

// Dashboards
import SalesTeamDashboard from './SalesTeamDashboard';
import PlaceholderDashboard from './PlaceholderDashboard';
import SalesGeneralManagerDashboard from './SalesGeneralManagerDashboard';
import DrawingTeamDashboard from './DrawingTeamDashboard';
import QuotationTeamDashboard from './QuotationTeamDashboard';
import SiteEngineerDashboard from './SiteEngineerDashboard';
import ProcurementTeamDashboard from './SourcingTeamDashboard';
import ExecutionTeamDashboard from './execution-team/ExecutionDashboard';
import AccountsTeamDashboard from './AccountsTeamDashboard';
import SuperAdminDashboard from './SuperAdminDashboard';
import VendorDashboard from './vendor/VendorDashboard';
import DesignAndSiteEngineeringDashboard from './DesignAndSiteEngineeringDashboard';
import WorkflowOverview from './WorkflowOverview';
import TasksPage from './shared/TasksPage';

const Dashboard: React.FC<{ currentPage: string; setCurrentPage: (page: string) => void }> = ({ currentPage, setCurrentPage }) => {
  const { currentUser, currentVendor } = useAuth();

  // If vendor is logged in, show Vendor Dashboard
  if (currentVendor) {
    return <VendorDashboard />;
  }

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center p-8 bg-surface border border-border rounded-3xl shadow-xl">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-primary">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          </div>
          <h2 className="text-2xl font-serif font-bold text-text-primary mb-2">Access Restricted</h2>
          <p className="text-text-secondary">Please sign in to access the internal dashboard.</p>
        </div>
      </div>
    );
  }

  const renderDashboardContent = () => {
    // Handle global pages first
    if (currentPage === 'workflow') {
      return <WorkflowOverview />;
    }

    if (currentPage === 'tasks') {
      return <TasksPage />;
    }

    switch (currentUser.role) {
      case UserRole.SUPER_ADMIN:
        return <SuperAdminDashboard currentPage={currentPage} setCurrentPage={setCurrentPage} />;
      case UserRole.SALES_TEAM_MEMBER:
        return <SalesTeamDashboard currentPage={currentPage} setCurrentPage={setCurrentPage} />;
      case UserRole.SALES_GENERAL_MANAGER:
        return <SalesGeneralManagerDashboard currentPage={currentPage} setCurrentPage={setCurrentPage} />;
      case UserRole.DRAWING_TEAM:
      case UserRole.SITE_ENGINEER:
        // Drawing Team and Site Engineers see the combined dashboard
        return <DesignAndSiteEngineeringDashboard currentPage={currentPage} setCurrentPage={setCurrentPage} />;
      case UserRole.QUOTATION_TEAM:
        return <QuotationTeamDashboard currentPage={currentPage} setCurrentPage={setCurrentPage} />;
      case UserRole.PROCUREMENT_TEAM:
        return <ProcurementTeamDashboard currentPage={currentPage} setCurrentPage={setCurrentPage} />;
      case UserRole.EXECUTION_TEAM:
      case UserRole.PROJECT_HEAD:
        // Project Heads and Execution Team members see the Execution Team dashboard
        return <ExecutionTeamDashboard currentPage={currentPage} setCurrentPage={setCurrentPage} />;
      case UserRole.ACCOUNTS_TEAM:
        return <AccountsTeamDashboard currentPage={currentPage} setCurrentPage={setCurrentPage} />;
      case UserRole.MANAGER: // Managers go to Sales Manager dashboard
        return <SalesGeneralManagerDashboard currentPage={currentPage} setCurrentPage={setCurrentPage} />;
      default:
        return <PlaceholderDashboard role={currentUser.role} />;
    }
  };

  return renderDashboardContent();
};

export default Dashboard;
