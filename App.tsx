

import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Header from './components/shared/Header';
import Dashboard from './components/dashboard/Dashboard';
import SettingsPage from './components/settings/SettingsPage';
import Sidebar from './components/shared/Sidebar';
import { useAuth } from './context/AuthContext';
import { UserRole } from './types';

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

  // Reset to overview if user role changes to non-admin
  React.useEffect(() => {
    if (currentUser?.role !== UserRole.SUPER_ADMIN) {
        setCurrentPage('overview');
    }
  }, [currentUser?.role]);

  const needsFullWidthLayout = [
    UserRole.SALES_GENERAL_MANAGER, 
    UserRole.SALES_TEAM_MEMBER, 
    UserRole.DRAWING_TEAM, 
    UserRole.QUOTATION_TEAM, 
    UserRole.SITE_ENGINEER, 
    UserRole.PROCUREMENT_TEAM,
    UserRole.EXECUTION_TEAM,
    UserRole.ACCOUNTS_TEAM,
  ].includes(currentUser?.role as UserRole);


  return (
    <div className="min-h-screen flex text-text-primary bg-background">
      {currentUser?.role === UserRole.SUPER_ADMIN && !isSettingsOpen && (
          <Sidebar currentPage={currentPage} setCurrentPage={handleSetPage} />
      )}
      <div className="flex-1 flex flex-col min-w-0">
        <Header openSettings={handleOpenSettings} />
        <main className="flex-grow overflow-y-auto">
          {isSettingsOpen ? (
            <div className="p-4 sm:p-6 lg:p-8"><SettingsPage /></div>
          ) : needsFullWidthLayout ? (
            <Dashboard currentPage={currentPage} />
          ) : (
            <div className="p-4 sm:p-6 lg:p-8">
              <Dashboard currentPage={currentPage} />
            </div>
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