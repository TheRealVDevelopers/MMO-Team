
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { User, UserRole, Vendor } from '../types';
import { onAuthStateChange, convertToAppUser } from '../services/authService';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';

interface AuthContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  currentVendor: Vendor | null;
  setCurrentVendor: (vendor: Vendor | null) => void;
  updateCurrentUserAvatar: (avatarDataUrl: string) => void;
  loading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    // Check localStorage for persisted user on initial load
    const savedUser = localStorage.getItem('mmo-current-user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        console.log('Restored user from localStorage:', parsed.name);
        return parsed;
      } catch (e) {
        console.error('Failed to parse saved user:', e);
        localStorage.removeItem('mmo-current-user');
      }
    }
    return null;
  });
  const [currentVendor, setCurrentVendor] = useState<Vendor | null>(() => {
    // Check localStorage for persisted vendor on initial load
    const savedVendor = localStorage.getItem('mmo-current-vendor');
    if (savedVendor) {
      try {
        const parsed = JSON.parse(savedVendor);
        console.log('Restored vendor from localStorage:', parsed.name);
        return parsed;
      } catch (e) {
        console.error('Failed to parse saved vendor:', e);
        localStorage.removeItem('mmo-current-vendor');
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(true);

  // Persist user to localStorage whenever it changes
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('mmo-current-user', JSON.stringify(currentUser));
      console.log('User saved to localStorage:', currentUser.name);
    } else {
      localStorage.removeItem('mmo-current-user');
    }
  }, [currentUser]);

  // Persist vendor to localStorage whenever it changes
  useEffect(() => {
    if (currentVendor) {
      localStorage.setItem('mmo-current-vendor', JSON.stringify(currentVendor));
      console.log('Vendor saved to localStorage:', currentVendor.name);
    } else {
      localStorage.removeItem('mmo-current-vendor');
    }
  }, [currentVendor]);

  useEffect(() => {
    // First check if we have a localStorage user (mock login)
    const savedUser = localStorage.getItem('mmo-current-user');
    if (savedUser) {
      setLoading(false);
      return;
    }

    // Otherwise, listen for Firebase auth changes
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

  const logout = () => {
    console.log('Logging out...');
    localStorage.removeItem('mmo-current-user');
    localStorage.removeItem('mmo-current-vendor');
    setCurrentUser(null);
    setCurrentVendor(null);
  };

  return (
    <AuthContext.Provider value={{ currentUser, setCurrentUser, currentVendor, setCurrentVendor, updateCurrentUserAvatar, loading, logout }}>
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
