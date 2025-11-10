
import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Header from './components/shared/Header';
import Dashboard from './components/dashboard/Dashboard';
import SettingsPage from './components/settings/SettingsPage';
import Sidebar from './components/shared/Sidebar';
import { useAuth } from './context/AuthContext';
import { UserRole } from './types';
// Fix: Imported missing CalendarDaysIcon and BanknotesIcon components.
import { 
    BuildingOfficeIcon, RectangleGroupIcon, UsersIcon, RectangleStackIcon, FunnelIcon, ChartPieIcon, ChatBubbleLeftRightIcon, ShieldExclamationIcon,
    ClockIcon, MapPinIcon, PaintBrushIcon, CalculatorIcon, TruckIcon, WrenchScrewdriverIcon, CreditCardIcon, ChartBarSquareIcon, CalendarDaysIcon, BanknotesIcon,
    ViewColumnsIcon, TagIcon, ListBulletIcon, PresentationChartLineIcon, ReceiptPercentIcon, BuildingStorefrontIcon, BuildingLibraryIcon
} from './components/icons/IconComponents';

const navConfig = {
    [UserRole.SUPER_ADMIN]: {
        title: 'Make My Office',
        navItems: [
            { id: 'overview', label: 'Overview', icon: <RectangleGroupIcon className="w-6 h-6" /> },
            { id: 'team', label: 'Team', icon: <UsersIcon className="w-6 h-6" /> },
            { id: 'projects', label: 'Projects', icon: <RectangleStackIcon className="w-6 h-6" /> },
            { id: 'leads', label: 'Leads', icon: <FunnelIcon className="w-6 h-6" /> },
            { id: 'communication', label: 'Communication', icon: <ChatBubbleLeftRightIcon className="w-6 h-6" /> },
            { id: 'reports', label: 'Reports', icon: <ChartPieIcon className="w-6 h-6" /> },
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
            { id: 'communication', label: 'Communication', icon: <ChatBubbleLeftRightIcon className="w-6 h-6" /> },
            { id: 'reports', label: 'Reports', icon: <ChartPieIcon className="w-6 h-6" /> },
            { id: 'performance', label: 'Performance', icon: <ChartBarSquareIcon className="w-6 h-6" /> },
            { id: 'escalate-issue', label: 'Escalate Issue', icon: <ShieldExclamationIcon className="w-6 h-6" /> },
        ]
    },
    [UserRole.SALES_TEAM_MEMBER]: {
        title: 'My Workspace',
        navItems: [
            { id: 'my-day', label: 'My Day', icon: <ClockIcon className="w-6 h-6" /> },
            { id: 'leads', label: 'My Leads', icon: <FunnelIcon className="w-6 h-6" /> },
            { id: 'site-visits', label: 'Site Visits', icon: <MapPinIcon className="w-6 h-6" /> },
            { id: 'drawing-tasks', label: 'Drawing Tasks', icon: <PaintBrushIcon className="w-6 h-6" /> },
            { id: 'quotation-tasks', label: 'Quotations', icon: <CalculatorIcon className="w-6 h-6" /> },
            { id: 'procurement-tasks', label: 'Procurement', icon: <TruckIcon className="w-6 h-6" /> },
            { id: 'execution-tasks', label: 'Execution', icon: <WrenchScrewdriverIcon className="w-6 h-6" /> },
            { id: 'accounts-tasks', label: 'Accounts', icon: <CreditCardIcon className="w-6 h-6" /> },
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
            { id: 'analytics', label: 'Price Analytics', icon: <PresentationChartLineIcon className="w-6 h-6" /> },
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
            { id: 'reports', label: 'Reports', icon: <ChartPieIcon className="w-6 h-6" /> },
            { id: 'escalate-issue', label: 'Escalate Issue', icon: <ShieldExclamationIcon className="w-6 h-6" /> },
        ]
    }
};

const AppContent: React.FC = () => {
  const { currentUser } = useAuth();
  const [currentPage, setCurrentPage] = React.useState('overview');
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);

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
  
  React.useEffect(() => {
    if (currentUser) {
        const defaultPage = navConfig[currentUser.role]?.navItems[0]?.id || 'overview';
        setCurrentPage(defaultPage);
    }
  }, [currentUser?.role]);

  const currentNavConfig = currentUser ? navConfig[currentUser.role] : null;
  const needsSidebar = !!currentNavConfig && !isSettingsOpen;

  return (
    <div className="min-h-screen flex text-text-primary bg-subtle-background">
      {needsSidebar && currentNavConfig && (
          <Sidebar 
            title={currentNavConfig.title}
            currentPage={currentPage} 
            setCurrentPage={handleSetPage}
            navItems={currentNavConfig.navItems}
            secondaryNavItems={currentNavConfig.secondaryNavItems}
          />
      )}
      <div className="flex-1 flex flex-col min-w-0">
        <Header openSettings={handleOpenSettings} />
        <main className="flex-grow overflow-y-auto p-4 sm:p-6 lg:p-8">
          {isSettingsOpen ? (
            <SettingsPage onClose={handleCloseSettings} />
          ) : (
            <Dashboard currentPage={currentPage} setCurrentPage={handleSetPage} />
          )}
        </main>
      </div>
    </div>
  )
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
