
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { User, UserRole } from '../types';
import { USERS } from '../constants';

interface AuthContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  updateCurrentUserAvatar: (avatarDataUrl: string) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// TEMPORARY: Mock user for development (no authentication)
const MOCK_ADMIN_USER = USERS[0]; // Admin user

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // TEMPORARY: Auto-login as Admin for development (no authentication required)
  const [currentUser, setCurrentUser] = useState<User | null>(MOCK_ADMIN_USER);
  const [loading, setLoading] = useState(false); // No loading needed

  const updateCurrentUserAvatar = (avatarDataUrl: string) => {
    if (currentUser) {
      // Save to localStorage for immediate UI update
      localStorage.setItem(`profile-pic-${currentUser.id}`, avatarDataUrl);
      
      // Update local state
      setCurrentUser(prevUser => prevUser ? { ...prevUser, avatar: avatarDataUrl } : null);
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, setCurrentUser, updateCurrentUserAvatar, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
