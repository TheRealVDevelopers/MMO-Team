
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { USERS } from '../../constants';
import { ChevronDownIcon } from '../icons/IconComponents';

const UserSelector: React.FC = () => {
  const { currentUser, setCurrentUser } = useAuth();

  const handleUserChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedUser = USERS.find(user => user.id === event.target.value) || null;
    setCurrentUser(selectedUser);
  };

  if (!currentUser) return null;

  return (
    <div className="relative">
      <select
        value={currentUser.id}
        onChange={handleUserChange}
        className="appearance-none bg-surface border border-border rounded-md py-2 pl-3 pr-10 text-sm font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
      >
        {USERS.map(user => (
          <option key={user.id} value={user.id}>
            {user.name} ({user.role})
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-secondary">
        <ChevronDownIcon className="w-4 h-4" />
      </div>
    </div>
  );
};

export default UserSelector;