

import React, { useState, useRef, useEffect } from 'react';
import UserSelector from './UserSelector';
import { CogIcon, PlusIcon, ChevronDownIcon } from '../icons/IconComponents';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface HeaderProps {
    openSettings: () => void;
}

const QuickActions: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-2 bg-primary text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
            >
                <PlusIcon className="w-4 h-4" />
                <span>Quick Actions</span>
                <ChevronDownIcon className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-surface rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-20">
                    <div className="py-1">
                        <a href="#" className="block px-4 py-2 text-sm text-text-primary hover:bg-subtle-background">Add New Lead</a>
                        <a href="#" className="block px-4 py-2 text-sm text-text-primary hover:bg-subtle-background">Assign Lead</a>
                        <a href="#" className="block px-4 py-2 text-sm text-text-primary hover:bg-subtle-background">Export Report</a>
                    </div>
                </div>
            )}
        </div>
    );
};


const Header: React.FC<HeaderProps> = ({ openSettings }) => {
  const { currentUser } = useAuth();
  
  return (
    <header className="bg-surface border-b border-border sticky top-0 z-10 h-16 flex-shrink-0">
      <div className="flex items-center justify-between h-full px-4 sm:px-6 lg:px-8">
          <div /> 
          <div className="flex items-center space-x-4">
            {currentUser?.role === UserRole.SALES_GENERAL_MANAGER && <QuickActions />}
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