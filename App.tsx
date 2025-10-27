

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

  const needsSidebar = currentUser?.role === UserRole.SUPER_ADMIN && !isSettingsOpen;


  return (
    <div className="min-h-screen flex text-text-primary bg-background">
      {needsSidebar && (
          <Sidebar currentPage={currentPage} setCurrentPage={handleSetPage} />
      )}
      <div className="flex-1 flex flex-col min-w-0">
        <Header openSettings={handleOpenSettings} />
        <main className="flex-grow overflow-y-auto">
          {isSettingsOpen ? (
            <div className="p-4 sm:p-6 lg:p-8"><SettingsPage onClose={handleCloseSettings} /></div>
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