

import React from 'react';
import UserSelector from './UserSelector';
import { CogIcon } from '../icons/IconComponents';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
    openSettings: () => void;
}

const Header: React.FC<HeaderProps> = ({ openSettings }) => {
  const { currentUser } = useAuth();
  
  return (
    <header className="bg-surface border-b border-border sticky top-0 z-10 h-16 flex-shrink-0">
      <div className="flex items-center justify-between h-full px-4 sm:px-6 lg:px-8">
          <div /> 
          <div className="flex items-center space-x-4">
             {currentUser && (
                <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-text-primary">{currentUser.name}</p>
                    <p className="text-xs text-text-secondary">{currentUser.role}</p>
                </div>
             )}
            <UserSelector />
            <button
              onClick={openSettings}
              className="p-2 rounded-full text-text-secondary hover:bg-subtle-background hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              aria-label="Open settings"
            >
              <CogIcon className="h-6 w-6" />
            </button>
          </div>
      </div>
    </header>
  );
};

export default Header;