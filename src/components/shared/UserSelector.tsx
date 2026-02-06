import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useUsers } from '../../hooks/useUsers';
import { UserRole } from '../../types';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { UserCircleIcon } from '../icons/IconComponents';

const UserSelector: React.FC = () => {
  const { currentUser, setCurrentUser } = useAuth();
  const { users } = useUsers();
  const [isOpen, setIsOpen] = useState(false);

  // Mock users for demonstration purposes
  const mockUsers = [
    {
      id: '1',
      name: 'Admin User',
      email: 'admin@example.com',
      role: UserRole.SUPER_ADMIN,
      avatar: '/mmo-logo.png',
      phone: '9876543210',
      organizationId: 'org-test',
      createdAt: new Date(),
      isActive: true,
    },
    {
      id: '2',
      name: 'Manager User',
      email: 'manager@example.com',
      role: UserRole.MANAGER,
      avatar: '/mmo-logo.png',
      phone: '9876543211',
      organizationId: 'org-test',
      createdAt: new Date(),
      isActive: true,
    },
    {
      id: '3',
      name: 'Sales Team Member',
      email: 'sales@example.com',
      role: UserRole.SALES_TEAM_MEMBER,
      avatar: '/mmo-logo.png',
      phone: '9876543212',
      organizationId: 'org-test',
      createdAt: new Date(),
      isActive: true,
    },
    {
      id: '4',
      name: 'Site Engineer',
      email: 'engineer@example.com',
      role: UserRole.SITE_ENGINEER,
      avatar: '/mmo-logo.png',
      phone: '9876543213',
      organizationId: 'org-test',
      createdAt: new Date(),
      isActive: true,
    },
    {
      id: '5',
      name: 'Quotation Team',
      email: 'quotation@example.com',
      role: UserRole.QUOTATION_TEAM,
      avatar: '/mmo-logo.png',
      phone: '9876543214',
      organizationId: 'org-test',
      createdAt: new Date(),
      isActive: true,
    },
  ];

  const availableUsers = users.length > 0 ? users : mockUsers;

  const handleUserSelect = (user: any) => {
    setCurrentUser(user);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-subtle-background dark:bg-background border border-border/50 dark:border-border hover:border-primary transition-all"
      >
        <UserCircleIcon className="w-5 h-5 text-primary" />
        <span className="text-sm font-medium text-text-primary hidden sm:block">
          {currentUser?.name || 'Select User'}
        </span>
        <ChevronDownIcon className={`w-4 h-4 text-text-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-background border border-border rounded-xl shadow-lg z-50 max-h-80 overflow-y-auto">
          <div className="p-2">
            <p className="text-xs font-semibold text-text-secondary px-2 py-1">Switch User</p>
            {availableUsers.map((user) => (
              <div
                key={user.id}
                onClick={() => handleUserSelect(user)}
                className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer hover:bg-subtle-background dark:hover:bg-surface ${
                  currentUser?.id === user.id ? 'bg-primary/10' : ''
                }`}
              >
                <img
                  src={user.avatar || '/mmo-logo.png'}
                  alt={user.name}
                  className="w-8 h-8 rounded-full"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{user.name}</p>
                  <p className="text-xs text-text-secondary truncate">{user.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserSelector;
