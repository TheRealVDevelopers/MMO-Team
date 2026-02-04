
import React, { useEffect, useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Dashboard from './components/dashboard/Dashboard';
import SettingsPage from './components/settings/SettingsPage';
import InternalLayout from './components/dashboard/shared/InternalLayout';
import LandingPage from './components/landing/LandingPage';
import { useAuth } from './context/AuthContext';
import { User, UserRole, Vendor } from './types';
// Fix: Imported missing CalendarDaysIcon and BanknotesIcon components.
import { useNavigate, useLocation } from 'react-router-dom';
import {
  BuildingOfficeIcon, RectangleGroupIcon, UsersIcon, RectangleStackIcon, FunnelIcon, ChartPieIcon, ChatBubbleLeftRightIcon, ShieldExclamationIcon,
  ClockIcon, MapPinIcon, PaintBrushIcon, CalculatorIcon, TruckIcon, WrenchScrewdriverIcon, CreditCardIcon, ChartBarSquareIcon, CalendarDaysIcon, BanknotesIcon,
  ViewColumnsIcon, TagIcon, ListBulletIcon, PresentationChartLineIcon, ReceiptPercentIcon, BuildingStorefrontIcon, BuildingLibraryIcon, CheckCircleIcon, DocumentTextIcon, CubeIcon
} from './components/icons/IconComponents';
import { USERS } from './constants';
import { seedDemoData } from './services/liveDataService';
import { migrateUsersToFirestore } from './services/migrationService';

const navConfig = {
  [UserRole.SUPER_ADMIN]: {
    title: 'Make My Office',
    navItems: [
      { id: 'overview', label: 'Overview', icon: <RectangleGroupIcon className="w-6 h-6" /> },
      { id: 'team', label: 'Team', icon: <UsersIcon className="w-6 h-6" /> },
      { id: 'projects', label: 'Projects', icon: <RectangleStackIcon className="w-6 h-6" /> },
      { id: 'organizations', label: 'Organizations', icon: <BuildingOfficeIcon className="w-6 h-6" /> },
      { id: 'leads', label: 'Leads', icon: <FunnelIcon className="w-6 h-6" /> },
      { id: 'approvals', label: 'Request Inbox', icon: <CheckCircleIcon className="w-6 h-6" /> },
      { id: 'registrations', label: 'Registrations', icon: <UsersIcon className="w-6 h-6" /> },
      { id: 'finance', label: 'Finance', icon: <BanknotesIcon className="w-6 h-6" /> },
      { id: 'communication', label: 'Communication', icon: <ChatBubbleLeftRightIcon className="w-6 h-6" /> },
      { id: 'workflow', label: 'M-Workflow', icon: <PresentationChartLineIcon className="w-6 h-6" /> },
    ],
    secondaryNavItems: [
      { id: 'complaints', label: 'Complaint Mgmt.', icon: <ShieldExclamationIcon className="w-6 h-6" /> },
    ]
  },

  [UserRole.MANAGER]: {
    // Also mapped to Sales Team Member dashboard structure per requirements
    title: 'Sales Manager Workspace',
    navItems: [
      { id: 'my-day', label: 'My Day', icon: <ClockIcon className="w-6 h-6" /> },
      { id: 'projects', label: 'Projects', icon: <RectangleStackIcon className="w-6 h-6" /> },
      { id: 'leads', label: 'My Registry', icon: <FunnelIcon className="w-6 h-6" /> },
      { id: 'my-requests', label: 'My Requests', icon: <RectangleStackIcon className="w-6 h-6" /> },
      { id: 'communication', label: 'Communication', icon: <ChatBubbleLeftRightIcon className="w-6 h-6" /> },
      { id: 'workflow', label: 'M-Workflow', icon: <PresentationChartLineIcon className="w-6 h-6" /> },
    ],
    secondaryNavItems: [
      { id: 'escalate-issue', label: 'Escalate Issue', icon: <ShieldExclamationIcon className="w-6 h-6" /> },
    ]
  },
  [UserRole.SALES_GENERAL_MANAGER]: {
    title: 'Sales Manager',
    navItems: [
      { id: 'overview', label: 'Dashboard', icon: <RectangleGroupIcon className="w-6 h-6" /> },
      { id: 'leads', label: 'Leads', icon: <FunnelIcon className="w-6 h-6" /> },
      { id: 'organizations', label: 'Organizations', icon: <BuildingOfficeIcon className="w-6 h-6" /> },
      { id: 'team', label: 'Team', icon: <UsersIcon className="w-6 h-6" /> },
      { id: 'approvals', label: 'Request Inbox', icon: <CheckCircleIcon className="w-6 h-6" /> },
      { id: 'communication', label: 'Communication', icon: <ChatBubbleLeftRightIcon className="w-6 h-6" /> },
      { id: 'workflow', label: 'M-Workflow', icon: <PresentationChartLineIcon className="w-6 h-6" /> },
      { id: 'performance', label: 'Performance', icon: <ChartBarSquareIcon className="w-6 h-6" /> },
    ],
    secondaryNavItems: [
      { id: 'escalate-issue', label: 'Escalate Issue', icon: <ShieldExclamationIcon className="w-6 h-6" /> },
    ]
  },
  [UserRole.SALES_TEAM_MEMBER]: {
    title: 'My Workspace',
    navItems: [
      { id: 'my-day', label: 'My Day', icon: <ClockIcon className="w-6 h-6" /> },
      { id: 'leads', label: 'My Registry', icon: <FunnelIcon className="w-6 h-6" /> },
      { id: 'my-requests', label: 'My Requests', icon: <RectangleStackIcon className="w-6 h-6" /> },
      { id: 'communication', label: 'Communication', icon: <ChatBubbleLeftRightIcon className="w-6 h-6" /> },
      { id: 'workflow', label: 'M-Workflow', icon: <PresentationChartLineIcon className="w-6 h-6" /> },
      // { id: 'performance', label: 'Performance', icon: <ChartBarSquareIcon className="w-6 h-6" /> },
    ],
    secondaryNavItems: [
      { id: 'escalate-issue', label: 'Escalate Issue', icon: <ShieldExclamationIcon className="w-6 h-6" /> },
    ]
  },
  [UserRole.DRAWING_TEAM]: {
    title: 'Site Engineer',
    navItems: [
      { id: 'my-day', label: 'My Day', icon: <ClockIcon className="w-6 h-6" /> },
      { id: 'projects', label: 'Projects', icon: <ViewColumnsIcon className="w-6 h-6" /> },
      { id: 'communication', label: 'Communication', icon: <ChatBubbleLeftRightIcon className="w-6 h-6" /> },
      { id: 'workflow', label: 'M-Workflow', icon: <PresentationChartLineIcon className="w-6 h-6" /> },
      // { id: 'performance', label: 'Performance', icon: <ChartBarSquareIcon className="w-6 h-6" /> },
      { id: 'escalate-issue', label: 'Escalate Issue', icon: <ShieldExclamationIcon className="w-6 h-6" /> },
    ]
  },
  [UserRole.QUOTATION_TEAM]: {
    title: 'Quotation',
    navItems: [
      { id: 'my-day', label: 'My Day', icon: <ClockIcon className="w-6 h-6" /> },
      { id: 'quotations', label: 'Create Quotation', icon: <DocumentTextIcon className="w-6 h-6" /> },
      { id: 'catalog', label: 'Items Catalog', icon: <TagIcon className="w-6 h-6" /> },
      { id: 'communication', label: 'Communication', icon: <ChatBubbleLeftRightIcon className="w-6 h-6" /> },
      { id: 'workflow', label: 'M-Workflow', icon: <PresentationChartLineIcon className="w-6 h-6" /> },
      // { id: 'performance', label: 'Performance', icon: <ChartBarSquareIcon className="w-6 h-6" /> },
      { id: 'escalate-issue', label: 'Escalate Issue', icon: <ShieldExclamationIcon className="w-6 h-6" /> },
    ]
  },
  [UserRole.SITE_ENGINEER]: {
    title: 'Site Engineer',
    navItems: [
      { id: 'my-day', label: 'My Day', icon: <ClockIcon className="w-6 h-6" /> },
      { id: 'projects', label: 'Projects', icon: <ViewColumnsIcon className="w-6 h-6" /> },
      { id: 'communication', label: 'Communication', icon: <ChatBubbleLeftRightIcon className="w-6 h-6" /> },
      { id: 'workflow', label: 'M-Workflow', icon: <PresentationChartLineIcon className="w-6 h-6" /> },
      // { id: 'performance', label: 'Performance', icon: <ChartBarSquareIcon className="w-6 h-6" /> },
      { id: 'escalate-issue', label: 'Escalate Issue', icon: <ShieldExclamationIcon className="w-6 h-6" /> },
    ]
  },
  [UserRole.PROCUREMENT_TEAM]: {
    title: 'Procurement Hub',
    navItems: [
      { id: 'my-day', label: 'My Day', icon: <ClockIcon className="w-6 h-6" /> },
      { id: 'audit', label: 'Audit Quotations', icon: <DocumentTextIcon className="w-6 h-6" /> },
      { id: 'negotiations', label: 'Procurement', icon: <ViewColumnsIcon className="w-6 h-6" /> },
      { id: 'items-catalog', label: 'Items Catalog', icon: <TagIcon className="w-6 h-6" /> },
      { id: 'communication', label: 'Communication', icon: <ChatBubbleLeftRightIcon className="w-6 h-6" /> },
      { id: 'workflow', label: 'M-Workflow', icon: <PresentationChartLineIcon className="w-6 h-6" /> },
      // { id: 'performance', label: 'Performance', icon: <ChartBarSquareIcon className="w-6 h-6" /> },
      { id: 'escalate-issue', label: 'Escalate Issue', icon: <ShieldExclamationIcon className="w-6 h-6" /> },
    ]
  },
  [UserRole.EXECUTION_TEAM]: {
    title: 'Execution Hub',
    navItems: [
      { id: 'my-day', label: 'My Day', icon: <ClockIcon className="w-6 h-6" /> },
      { id: 'board', label: 'Projects', icon: <ViewColumnsIcon className="w-6 h-6" /> },
      // Added unified leadership items
      { id: 'team', label: 'Team', icon: <UsersIcon className="w-6 h-6" /> },
      { id: 'approvals', label: 'Approvals', icon: <CheckCircleIcon className="w-6 h-6" /> },
      { id: 'budget', label: 'Budgets', icon: <BanknotesIcon className="w-6 h-6" /> },
      { id: 'tasks', label: 'Tasks', icon: <ListBulletIcon className="w-6 h-6" /> },
      { id: 'communication', label: 'Communication', icon: <ChatBubbleLeftRightIcon className="w-6 h-6" /> },
      { id: 'workflow', label: 'M-Workflow', icon: <PresentationChartLineIcon className="w-6 h-6" /> },
      // { id: 'performance', label: 'Performance', icon: <ChartBarSquareIcon className="w-6 h-6" /> },
      { id: 'escalate-issue', label: 'Escalate Issue', icon: <ShieldExclamationIcon className="w-6 h-6" /> },
    ]
  },
  [UserRole.PROJECT_HEAD]: {
    title: 'Execution Hub',
    navItems: [
      { id: 'my-day', label: 'My Day', icon: <ClockIcon className="w-6 h-6" /> },
      { id: 'board', label: 'Projects', icon: <ViewColumnsIcon className="w-6 h-6" /> },
      { id: 'communication', label: 'Communication', icon: <ChatBubbleLeftRightIcon className="w-6 h-6" /> },
      { id: 'workflow', label: 'M-Workflow', icon: <PresentationChartLineIcon className="w-6 h-6" /> },
      { id: 'escalate-issue', label: 'Escalate Issue', icon: <ShieldExclamationIcon className="w-6 h-6" /> },
    ]
  },
  [UserRole.ACCOUNTS_TEAM]: {
    title: 'Financial Command Center',
    navItems: [
      { id: 'overview', label: 'Overview', icon: <ChartBarSquareIcon className="w-6 h-6" /> },
      { id: 'sales-invoices', label: 'GRIN', icon: <BanknotesIcon className="w-6 h-6" /> },
      { id: 'vendor-bills', label: 'GROUT', icon: <BuildingLibraryIcon className="w-6 h-6" /> },
      { id: 'expenses', label: 'Expenses', icon: <ReceiptPercentIcon className="w-6 h-6" /> },
      { id: 'project-pnl', label: 'Project P&L', icon: <PresentationChartLineIcon className="w-6 h-6" /> },
      { id: 'salary', label: 'Salary', icon: <UsersIcon className="w-6 h-6" /> },
      { id: 'inventory', label: 'Inventory', icon: <CubeIcon className="w-6 h-6" /> },
      { id: 'approvals', label: 'Payment Requests', icon: <CheckCircleIcon className="w-6 h-6" /> },
      { id: 'communication', label: 'Communication', icon: <ChatBubbleLeftRightIcon className="w-6 h-6" /> },
      { id: 'workflow', label: 'M-Workflow', icon: <PresentationChartLineIcon className="w-6 h-6" /> },
      { id: 'escalate-issue', label: 'Escalate Issue', icon: <ShieldExclamationIcon className="w-6 h-6" /> },
    ]
  }
};

const AppContent: React.FC = () => {
  const { currentUser, setCurrentUser, currentVendor, setCurrentVendor, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [currentPage, setCurrentPage] = useState('overview');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showApp, setIsShowApp] = useState(false);

  // Sync URL with state
  useEffect(() => {
    const path = location.pathname.split('/')[1] || 'overview';

    // Convert path to internal page ID if needed (e.g. leads -> leads)
    // Most internal IDs match the path segments now
    if (path && path !== currentPage && path !== 'dashboard') {
      setCurrentPage(path);
    }
  }, [location.pathname]);

  useEffect(() => {
    // Seed demo data once on app start
    // seedDemoData().catch(console.error);
    migrateUsersToFirestore().catch(console.error);
  }, []);

  const handleSetPage = (page: string) => {
    setCurrentPage(page);
    setIsSettingsOpen(false);
    // Also update URL to keep in sync
    navigate(`/${page}`);
  }

  const handleOpenSettings = () => {
    setIsSettingsOpen(true);
  }

  const handleCloseSettings = () => {
    setIsSettingsOpen(false);
  }

  const handleLogin = (user: User | Vendor, type: 'staff' | 'vendor' = 'staff') => {
    if (type === 'vendor') {
      setCurrentVendor(user as Vendor);
      setCurrentUser(null);
    } else {
      setCurrentUser(user as User);
      setCurrentVendor(null);
    }
    setIsShowApp(true);
  }

  useEffect(() => {
    if (currentUser) {
      const defaultPage = navConfig[currentUser.role]?.navItems[0]?.id || 'overview';
      setCurrentPage(defaultPage);
      setIsShowApp(true);
    } else if (currentVendor) {
      setCurrentPage('overview');
      setIsShowApp(true);
    } else {
      setIsShowApp(false);
    }
  }, [currentUser?.role, !!currentVendor]);

  // Show app content when vendor is logged in (VendorDashboard has its own layout)
  if (currentVendor) {
    return <Dashboard currentPage={currentPage} setCurrentPage={handleSetPage} />;
  }

  // Show landing page if not logged in
  if (!currentUser && !loading) {
    return <LandingPage onLogin={handleLogin} />;
  }

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show app content when staff is logged in
  if (currentUser) {
    const currentNavConfig = navConfig[currentUser.role];

    return (
      <InternalLayout
        currentPage={currentPage}
        setCurrentPage={handleSetPage}
        title={currentNavConfig?.title}
        navItems={currentNavConfig?.navItems}
        secondaryNavItems={currentNavConfig?.secondaryNavItems}
        onOpenSettings={handleOpenSettings}
      >
        {isSettingsOpen ? (
          <SettingsPage onClose={handleCloseSettings} />
        ) : (
          <Dashboard currentPage={currentPage} setCurrentPage={handleSetPage} />
        )}
      </InternalLayout>
    );
  }

  return <LandingPage onLogin={handleLogin} />;
}


const App: React.FC = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;
