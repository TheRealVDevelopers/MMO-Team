
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { User, UserRole } from '../types';
import { onAuthStateChange, convertToAppUser } from '../services/authService';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';

interface AuthContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  updateCurrentUserAvatar: (avatarDataUrl: string) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

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
