import React, { createContext, useState, useContext, ReactNode } from 'react';
import { User } from '../types';
import { USERS } from '../constants';

interface AuthContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  updateCurrentUserAvatar: (avatarDataUrl: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const loadUserWithAvatar = (user: User): User => {
    const savedAvatar = typeof window !== 'undefined' ? localStorage.getItem(`profile-pic-${user.id}`) : null;
    return savedAvatar ? { ...user, avatar: savedAvatar } : user;
}


export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, _setCurrentUser] = useState<User | null>(() => {
      const initialUser = USERS[0]; // Default to Super Admin
      return loadUserWithAvatar(initialUser);
  });

  const setCurrentUser = (user: User | null) => {
    _setCurrentUser(user ? loadUserWithAvatar(user) : null);
  };

  const updateCurrentUserAvatar = (avatarDataUrl: string) => {
    if (currentUser) {
      localStorage.setItem(`profile-pic-${currentUser.id}`, avatarDataUrl);
      _setCurrentUser(prevUser => prevUser ? { ...prevUser, avatar: avatarDataUrl } : null);
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, setCurrentUser, updateCurrentUserAvatar }}>
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