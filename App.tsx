
import React, { useEffect, useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Routes, Route } from 'react-router-dom';
import Dashboard from './components/dashboard/Dashboard';
import SettingsPage from './components/settings/SettingsPage';
import InternalLayout from './components/dashboard/shared/InternalLayout';
import ProjectsListPage from './components/dashboard/shared/ProjectsListPage';
import ProjectDetailsPage from './components/dashboard/shared/ProjectDetailsPage';
import ProjectReferencePage from './components/dashboard/shared/ProjectReferencePage';
import LandingPage from './components/landing/LandingPage';
import HelpBotWidget from './components/HelpBotWidget';
import ErrorRectificationPage from './components/ErrorRectificationPage';
import SetPasswordPage from './components/auth/SetPasswordPage';
import { useAuth } from './context/AuthContext';
import { StaffUser, UserRole, Vendor } from './types';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  BuildingOfficeIcon, RectangleGroupIcon, UsersIcon, RectangleStackIcon, FunnelIcon, ChartPieIcon, ChatBubbleLeftRightIcon, ShieldExclamationIcon,
  ClockIcon, MapPinIcon, PaintBrushIcon, CalculatorIcon, TruckIcon, WrenchScrewdriverIcon, CreditCardIcon, ChartBarSquareIcon, CalendarDaysIcon, BanknotesIcon,
  ViewColumnsIcon, TagIcon, ListBulletIcon, PresentationChartLineIcon, ReceiptPercentIcon, BuildingStorefrontIcon, BuildingLibraryIcon, CheckCircleIcon, DocumentTextIcon, CubeIcon, QueueListIcon, ShieldCheckIcon, ClipboardDocumentCheckIcon,
  CalendarIcon
} from './components/icons/IconComponents';
import { InboxIcon } from '@heroicons/react/24/outline';

const navConfig = {
  [UserRole.SUPER_ADMIN]: {
    title: 'Make My Office',
    navItems: [
      { id: 'overview', label: 'Overview', icon: <RectangleGroupIcon className="w-6 h-6" /> },
      { id: 'request-validation', label: 'Request Validation', icon: <ClipboardDocumentCheckIcon className="w-6 h-6" /> },
      { id: 'team', label: 'Team', icon: <UsersIcon className="w-6 h-6" /> },
      { id: 'project-hub', label: 'Projects', icon: <ViewColumnsIcon className="w-6 h-6" /> },
      { id: 'timeline', label: 'Timeline', icon: <CalendarIcon className="w-6 h-6" /> },
      { id: 'projects', label: 'Reference', icon: <RectangleStackIcon className="w-6 h-6" /> },
      { id: 'organizations', label: 'Organizations', icon: <BuildingOfficeIcon className="w-6 h-6" /> },
      { id: 'b2i', label: 'B2I Clients', icon: <BuildingLibraryIcon className="w-6 h-6" /> },
      { id: 'leads', label: 'Leads', icon: <FunnelIcon className="w-6 h-6" /> },
      { id: 'request-inbox', label: 'Request Inbox', icon: <InboxIcon className="w-6 h-6" /> },
      { id: 'approvals', label: 'Approvals', icon: <CheckCircleIcon className="w-6 h-6" /> },
      { id: 'registrations', label: 'Registrations', icon: <UsersIcon className="w-6 h-6" /> },
      { id: 'finance', label: 'Finance', icon: <BanknotesIcon className="w-6 h-6" /> },
      { id: 'timesheet-reports', label: 'Timesheet Reports', icon: <DocumentTextIcon className="w-6 h-6" /> },
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
      { id: 'request-validation', label: 'Request Validation', icon: <ClipboardDocumentCheckIcon className="w-6 h-6" /> },
      { id: 'projects', label: 'Reference', icon: <RectangleStackIcon className="w-6 h-6" /> },
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
      { id: 'my-day', label: 'My Day', icon: <ClockIcon className="w-6 h-6" /> },
      { id: 'overview', label: 'Dashboard', icon: <RectangleGroupIcon className="w-6 h-6" /> },
      { id: 'request-validation', label: 'Request Validation', icon: <ClipboardDocumentCheckIcon className="w-6 h-6" /> },
      { id: 'project-hub', label: 'Projects', icon: <ViewColumnsIcon className="w-6 h-6" /> },
      { id: 'projects', label: 'Reference', icon: <RectangleStackIcon className="w-6 h-6" /> },
      { id: 'leads', label: 'Leads', icon: <FunnelIcon className="w-6 h-6" /> },
      { id: 'organizations', label: 'Organizations', icon: <BuildingOfficeIcon className="w-6 h-6" /> },
      { id: 'team', label: 'Team', icon: <UsersIcon className="w-6 h-6" /> },
      { id: 'request-inbox', label: 'Request Inbox', icon: <InboxIcon className="w-6 h-6" /> },
      { id: 'approvals', label: 'Approvals', icon: <CheckCircleIcon className="w-6 h-6" /> },
      { id: 'communication', label: 'Communication', icon: <ChatBubbleLeftRightIcon className="w-6 h-6" /> },
      { id: 'workflow', label: 'M-Workflow', icon: <PresentationChartLineIcon className="w-6 h-6" /> },
    ],
    secondaryNavItems: [
      { id: 'escalate-issue', label: 'Escalate Issue', icon: <ShieldExclamationIcon className="w-6 h-6" /> },
    ]
  },
  [UserRole.SALES_TEAM_MEMBER]: {
    title: 'My Workspace',
    navItems: [
      { id: 'my-day', label: 'My Day', icon: <ClockIcon className="w-6 h-6" /> },
      { id: 'request-validation', label: 'Request Validation', icon: <ClipboardDocumentCheckIcon className="w-6 h-6" /> },
      { id: 'work-queue', label: 'Work Queue', icon: <QueueListIcon className="w-6 h-6" /> },
      { id: 'project-hub', label: 'Projects', icon: <ViewColumnsIcon className="w-6 h-6" /> },
      { id: 'projects', label: 'Reference', icon: <RectangleStackIcon className="w-6 h-6" /> },
      { id: 'leads', label: 'My Registry', icon: <FunnelIcon className="w-6 h-6" /> },
      { id: 'my-requests', label: 'Sent Requests', icon: <RectangleStackIcon className="w-6 h-6" /> },
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
      { id: 'request-validation', label: 'Request Validation', icon: <ClipboardDocumentCheckIcon className="w-6 h-6" /> },
      { id: 'work-queue', label: 'Work Queue', icon: <QueueListIcon className="w-6 h-6" /> },
      { id: 'boqs', label: 'BOQs', icon: <DocumentTextIcon className="w-6 h-6" /> },
      { id: 'projects', label: 'Reference', icon: <RectangleStackIcon className="w-6 h-6" /> },
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
      { id: 'request-validation', label: 'Request Validation', icon: <ClipboardDocumentCheckIcon className="w-6 h-6" /> },
      { id: 'work-queue', label: 'Work Queue', icon: <QueueListIcon className="w-6 h-6" /> },
      { id: 'projects', label: 'Reference', icon: <RectangleStackIcon className="w-6 h-6" /> },
      { id: 'requests', label: 'Requests', icon: <CheckCircleIcon className="w-6 h-6" /> },
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
      { id: 'request-validation', label: 'Request Validation', icon: <ClipboardDocumentCheckIcon className="w-6 h-6" /> },
      { id: 'work-queue', label: 'Work Queue', icon: <QueueListIcon className="w-6 h-6" /> },
      { id: 'projects', label: 'Reference', icon: <RectangleStackIcon className="w-6 h-6" /> },
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
      { id: 'request-validation', label: 'Request Validation', icon: <ClipboardDocumentCheckIcon className="w-6 h-6" /> },
      { id: 'audit', label: 'Quotation Audit', icon: <DocumentTextIcon className="w-6 h-6" /> },
      { id: 'bidding', label: 'Vendor Bidding', icon: <ViewColumnsIcon className="w-6 h-6" /> },
      { id: 'execution-procurement', label: 'Execution Procurement', icon: <TruckIcon className="w-6 h-6" /> },
      { id: 'vendors', label: 'Vendors', icon: <BuildingStorefrontIcon className="w-6 h-6" /> },
      { id: 'history', label: 'History', icon: <ClockIcon className="w-6 h-6" /> },
    ]
  },
  [UserRole.EXECUTION_TEAM]: {
    title: 'Execution Hub',
    navItems: [
      { id: 'my-day', label: 'My Day', icon: <ClockIcon className="w-6 h-6" /> },
      { id: 'planning', label: 'Projects', icon: <ViewColumnsIcon className="w-6 h-6" /> },
      { id: 'timeline', label: 'Timeline', icon: <CalendarIcon className="w-6 h-6" /> },
      { id: 'request-validation', label: 'Request Validation', icon: <ClipboardDocumentCheckIcon className="w-6 h-6" /> },
      { id: 'approvals', label: 'Approvals', icon: <CheckCircleIcon className="w-6 h-6" /> },
      { id: 'budget', label: 'Budgets', icon: <BanknotesIcon className="w-6 h-6" /> },
      { id: 'communication', label: 'Communication', icon: <ChatBubbleLeftRightIcon className="w-6 h-6" /> },
      { id: 'workflow', label: 'M-Workflow', icon: <PresentationChartLineIcon className="w-6 h-6" /> },
      // { id: 'performance', label: 'Performance', icon: <ChartBarSquareIcon className="w-6 h-6" /> },
      { id: 'escalate-issue', label: 'Escalate Issue', icon: <ShieldExclamationIcon className="w-6 h-6" /> },
    ]
  },
  [UserRole.PROJECT_HEAD]: {
    title: 'Execution Hub',
    navItems: [
      { id: 'planning', label: 'Projects', icon: <ViewColumnsIcon className="w-6 h-6" /> },
      { id: 'timeline', label: 'Timeline', icon: <CalendarIcon className="w-6 h-6" /> },
      { id: 'request-validation', label: 'Request Validation', icon: <ClipboardDocumentCheckIcon className="w-6 h-6" /> },
      { id: 'my-day', label: 'My Day', icon: <ClockIcon className="w-6 h-6" /> },
      { id: 'board', label: 'Board', icon: <ViewColumnsIcon className="w-6 h-6" /> },
      { id: 'communication', label: 'Communication', icon: <ChatBubbleLeftRightIcon className="w-6 h-6" /> },
      { id: 'workflow', label: 'M-Workflow', icon: <PresentationChartLineIcon className="w-6 h-6" /> },
      { id: 'escalate-issue', label: 'Escalate Issue', icon: <ShieldExclamationIcon className="w-6 h-6" /> },
    ]
  },
  [UserRole.B2I_PARENT]: {
    title: 'B2I Dashboard',
    navItems: [
      { id: 'overview', label: 'Overview', icon: <RectangleGroupIcon className="w-6 h-6" /> },
      // { id: 'organizations', label: 'Organizations', icon: <BuildingOfficeIcon className="w-6 h-6" /> },
    ]
  },
  [UserRole.ACCOUNTS_TEAM]: {
    title: 'Financial Command Center',
    navItems: [
      { id: 'my-day', label: 'My Day', icon: <ClockIcon className="w-6 h-6" /> },
      { id: 'request-validation', label: 'Request Validation', icon: <ClipboardDocumentCheckIcon className="w-6 h-6" /> },
      { id: 'payment-verification', label: 'Payment Verification', icon: <ShieldCheckIcon className="w-6 h-6" /> },
      { id: 'projects', label: 'Projects', icon: <ViewColumnsIcon className="w-6 h-6" /> },
      { id: 'overview', label: 'Overview', icon: <ChartBarSquareIcon className="w-6 h-6" /> },
      { id: 'sales-invoices', label: 'GRIN', icon: <BanknotesIcon className="w-6 h-6" /> },
      { id: 'vendor-bills', label: 'GROUT', icon: <BuildingLibraryIcon className="w-6 h-6" /> },
      { id: 'expenses', label: 'Expenses', icon: <ReceiptPercentIcon className="w-6 h-6" /> },
      { id: 'project-pnl', label: 'Project P&L', icon: <PresentationChartLineIcon className="w-6 h-6" /> },
      { id: 'salary', label: 'Salary', icon: <UsersIcon className="w-6 h-6" /> },
      { id: 'inventory', label: 'Inventory', icon: <CubeIcon className="w-6 h-6" /> },
      { id: 'communication', label: 'Communication', icon: <ChatBubbleLeftRightIcon className="w-6 h-6" /> },
      { id: 'workflow', label: 'M-Workflow', icon: <PresentationChartLineIcon className="w-6 h-6" /> },
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
    // No migrations needed - using Case-centric architecture
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

  const handleLogin = (user: StaffUser | Vendor, type: 'staff' | 'vendor' = 'staff') => {
    if (type === 'vendor') {
      setCurrentVendor(user as Vendor);
      setCurrentUser(null);
    } else {
      setCurrentUser(user as StaffUser);
      setCurrentVendor(null);
    }
    setIsShowApp(true);
  }

  useEffect(() => {
    if (currentUser) {
      if (currentUser.mustChangePassword) {
        navigate('/set-password');
        setIsShowApp(false); // Hide main app layout
        return;
      }

      const defaultPage = navConfig[currentUser.role]?.navItems[0]?.id || 'overview';
      // Only redirect if at root or login
      if (location.pathname === '/' || location.pathname === '/login') {
        setCurrentPage(defaultPage);
        navigate(`/${defaultPage}`);
      }
      setIsShowApp(true);
    } else if (currentVendor) {
      setCurrentPage('overview');
      setIsShowApp(true);
    } else {
      setIsShowApp(false);
    }
  }, [currentUser, !!currentVendor, currentUser?.mustChangePassword]);

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
    const baseNavConfig = navConfig[currentUser.role];

    // Allow Execution Team managers to see Team Members tab without changing role
    const navItems =
      currentUser.role === UserRole.EXECUTION_TEAM && (currentUser as any).isExecutionManager
        ? [
            ...(baseNavConfig?.navItems || []),
            { id: 'team', label: 'Team Members', icon: <UsersIcon className="w-6 h-6" /> },
          ]
        : baseNavConfig?.navItems;

    return (
      <>
        <InternalLayout
          currentPage={currentPage}
          setCurrentPage={handleSetPage}
          title={baseNavConfig?.title}
          navItems={navItems}
          secondaryNavItems={baseNavConfig?.secondaryNavItems}
          onOpenSettings={handleOpenSettings}
        >
          {isSettingsOpen ? (
            <SettingsPage onClose={handleCloseSettings} />
          ) : (
            <Routes>
              <Route path="/set-password" element={<SetPasswordPage />} />
              <Route path="/projects/:caseId" element={<ProjectDetailsPage />} />
              <Route path="/projects" element={<ProjectsListPage />} />
              <Route path="/project-reference" element={<ProjectReferencePage />} />
              <Route path="/error-rectification" element={<ErrorRectificationPage />} />
              <Route path="*" element={<Dashboard currentPage={currentPage} setCurrentPage={handleSetPage} />} />
            </Routes>
          )}
        </InternalLayout>
        <HelpBotWidget />
      </>
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
