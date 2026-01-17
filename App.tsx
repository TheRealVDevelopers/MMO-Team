
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
import {
  BuildingOfficeIcon, RectangleGroupIcon, UsersIcon, RectangleStackIcon, FunnelIcon, ChartPieIcon, ChatBubbleLeftRightIcon, ShieldExclamationIcon,
  ClockIcon, MapPinIcon, PaintBrushIcon, CalculatorIcon, TruckIcon, WrenchScrewdriverIcon, CreditCardIcon, ChartBarSquareIcon, CalendarDaysIcon, BanknotesIcon,
  ViewColumnsIcon, TagIcon, ListBulletIcon, PresentationChartLineIcon, ReceiptPercentIcon, BuildingStorefrontIcon, BuildingLibraryIcon, CheckCircleIcon, DocumentTextIcon
} from './components/icons/IconComponents';
import { USERS } from './constants';
import { seedDemoData } from './services/liveDataService';

const navConfig = {
  [UserRole.SUPER_ADMIN]: {
    title: 'Make My Office',
    navItems: [
      { id: 'overview', label: 'Overview', icon: <RectangleGroupIcon className="w-6 h-6" /> },
      { id: 'team', label: 'Team', icon: <UsersIcon className="w-6 h-6" /> },
      { id: 'projects', label: 'Projects', icon: <RectangleStackIcon className="w-6 h-6" /> },
      { id: 'leads', label: 'Leads', icon: <FunnelIcon className="w-6 h-6" /> },
      { id: 'approvals', label: 'Request Inbox', icon: <CheckCircleIcon className="w-6 h-6" /> },
      { id: 'finance', label: 'Finance', icon: <BanknotesIcon className="w-6 h-6" /> },
      { id: 'communication', label: 'Communication', icon: <ChatBubbleLeftRightIcon className="w-6 h-6" /> },
    ],
    secondaryNavItems: [
      { id: 'complaints', label: 'Complaint Mgmt.', icon: <ShieldExclamationIcon className="w-6 h-6" /> },
    ]
  },
  [UserRole.SALES_GENERAL_MANAGER]: {
    title: 'Sales Manager',
    navItems: [
      { id: 'overview', label: 'Dashboard', icon: <RectangleGroupIcon className="w-6 h-6" /> },
      { id: 'leads', label: 'Leads', icon: <FunnelIcon className="w-6 h-6" /> },
      { id: 'team', label: 'Team', icon: <UsersIcon className="w-6 h-6" /> },
      { id: 'approvals', label: 'Request Inbox', icon: <CheckCircleIcon className="w-6 h-6" /> },
      { id: 'communication', label: 'Communication', icon: <ChatBubbleLeftRightIcon className="w-6 h-6" /> },
      { id: 'performance', label: 'Performance', icon: <ChartBarSquareIcon className="w-6 h-6" /> },
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
      { id: 'performance', label: 'Performance', icon: <ChartBarSquareIcon className="w-6 h-6" /> },
    ],
    secondaryNavItems: [
      { id: 'escalate-issue', label: 'Escalate Issue', icon: <ShieldExclamationIcon className="w-6 h-6" /> },
    ]
  },
  [UserRole.DRAWING_TEAM]: {
    title: 'Design Hub',
    navItems: [
      { id: 'my-day', label: 'My Day', icon: <ClockIcon className="w-6 h-6" /> },
      { id: 'projects', label: 'Projects Board', icon: <ViewColumnsIcon className="w-6 h-6" /> },
      { id: 'communication', label: 'Communication', icon: <ChatBubbleLeftRightIcon className="w-6 h-6" /> },
      { id: 'performance', label: 'Performance', icon: <ChartBarSquareIcon className="w-6 h-6" /> },
      { id: 'escalate-issue', label: 'Escalate Issue', icon: <ShieldExclamationIcon className="w-6 h-6" /> },
    ]
  },
  [UserRole.QUOTATION_TEAM]: {
    title: 'Quotation Hub',
    navItems: [
      { id: 'my-day', label: 'My Day', icon: <ClockIcon className="w-6 h-6" /> },
      { id: 'negotiations', label: 'Quotations', icon: <ViewColumnsIcon className="w-6 h-6" /> },
      { id: 'catalog', label: 'Items Catalog', icon: <TagIcon className="w-6 h-6" /> },
      { id: 'templates', label: 'Templates', icon: <ListBulletIcon className="w-6 h-6" /> },
      { id: 'communication', label: 'Communication', icon: <ChatBubbleLeftRightIcon className="w-6 h-6" /> },
      { id: 'performance', label: 'Performance', icon: <ChartBarSquareIcon className="w-6 h-6" /> },
      { id: 'escalate-issue', label: 'Escalate Issue', icon: <ShieldExclamationIcon className="w-6 h-6" /> },
    ]
  },
  [UserRole.SITE_ENGINEER]: {
    title: 'Engineer Hub',
    navItems: [
      { id: 'my-day', label: 'My Day', icon: <ClockIcon className="w-6 h-6" /> },
      { id: 'schedule', label: "Today's Schedule", icon: <CalendarDaysIcon className="w-6 h-6" /> },
      { id: 'expenses', label: 'Expense Claims', icon: <ReceiptPercentIcon className="w-6 h-6" /> },
      { id: 'communication', label: 'Communication', icon: <ChatBubbleLeftRightIcon className="w-6 h-6" /> },
      { id: 'performance', label: 'Performance', icon: <ChartBarSquareIcon className="w-6 h-6" /> },
      { id: 'escalate-issue', label: 'Escalate Issue', icon: <ShieldExclamationIcon className="w-6 h-6" /> },
    ]
  },
  [UserRole.PROCUREMENT_TEAM]: {
    title: 'Procurement',
    navItems: [
      { id: 'my-day', label: 'My Day', icon: <ClockIcon className="w-6 h-6" /> },
      { id: 'bidding', label: 'Bidding', icon: <TagIcon className="w-6 h-6" /> },
      { id: 'purchase-orders', label: 'Orders', icon: <DocumentTextIcon className="w-6 h-6" /> },
      { id: 'vendors', label: 'Vendors', icon: <BuildingStorefrontIcon className="w-6 h-6" /> },
      { id: 'communication', label: 'Communication', icon: <ChatBubbleLeftRightIcon className="w-6 h-6" /> },
      { id: 'performance', label: 'Performance', icon: <ChartBarSquareIcon className="w-6 h-6" /> },
      { id: 'escalate-issue', label: 'Escalate Issue', icon: <ShieldExclamationIcon className="w-6 h-6" /> },
    ]
  },
  [UserRole.EXECUTION_TEAM]: {
    title: 'Execution Hub',
    navItems: [
      { id: 'my-day', label: 'My Day', icon: <ClockIcon className="w-6 h-6" /> },
      { id: 'board', label: 'Project Board', icon: <ViewColumnsIcon className="w-6 h-6" /> },
      { id: 'communication', label: 'Communication', icon: <ChatBubbleLeftRightIcon className="w-6 h-6" /> },
      { id: 'performance', label: 'Performance', icon: <ChartBarSquareIcon className="w-6 h-6" /> },
      { id: 'escalate-issue', label: 'Escalate Issue', icon: <ShieldExclamationIcon className="w-6 h-6" /> },
    ]
  },
  [UserRole.ACCOUNTS_TEAM]: {
    title: 'Finance Hub',
    navItems: [
      { id: 'my-day', label: 'My Day', icon: <ClockIcon className="w-6 h-6" /> },
      { id: 'invoices', label: 'Invoices', icon: <BanknotesIcon className="w-6 h-6" /> },
      { id: 'expenses', label: 'Expenses', icon: <ReceiptPercentIcon className="w-6 h-6" /> },
      { id: 'payments', label: 'Payments', icon: <BuildingLibraryIcon className="w-6 h-6" /> },
      { id: 'communication', label: 'Communication', icon: <ChatBubbleLeftRightIcon className="w-6 h-6" /> },
      { id: 'escalate-issue', label: 'Escalate Issue', icon: <ShieldExclamationIcon className="w-6 h-6" /> },
    ]
  }
};

const AppContent: React.FC = () => {
  const { currentUser, setCurrentUser, currentVendor, setCurrentVendor, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('overview');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showApp, setIsShowApp] = useState(false);

  useEffect(() => {
    // Seed demo data once on app start
    seedDemoData().catch(console.error);
  }, []);

  const handleSetPage = (page: string) => {
    setCurrentPage(page);
    setIsSettingsOpen(false);
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
