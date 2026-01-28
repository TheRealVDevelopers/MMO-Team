
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { User, UserRole, Vendor } from '../types';
import { onAuthStateChange, convertToAppUser } from '../services/authService';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

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
    // Demo-only: allow restoring mock user from localStorage.
    if (DEMO_MODE) {
      const savedUser = localStorage.getItem('mmo-current-user');
      if (savedUser) {
        try {
          return JSON.parse(savedUser);
        } catch {
          localStorage.removeItem('mmo-current-user');
        }
      }
    }
    return null;
  });
  const [currentVendor, setCurrentVendor] = useState<Vendor | null>(() => {
    if (DEMO_MODE) {
      const savedVendor = localStorage.getItem('mmo-current-vendor');
      if (savedVendor) {
        try {
          return JSON.parse(savedVendor);
        } catch {
          localStorage.removeItem('mmo-current-vendor');
        }
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(true);

  // Persist user to localStorage whenever it changes
  useEffect(() => {
    if (!DEMO_MODE) return;
    if (currentUser) localStorage.setItem('mmo-current-user', JSON.stringify(currentUser));
    else localStorage.removeItem('mmo-current-user');
  }, [currentUser]);

  // Persist vendor to localStorage whenever it changes
  useEffect(() => {
    if (!DEMO_MODE) return;
    if (currentVendor) localStorage.setItem('mmo-current-vendor', JSON.stringify(currentVendor));
    else localStorage.removeItem('mmo-current-vendor');
  }, [currentVendor]);

  useEffect(() => {
    // In demo mode, allow localStorage mock auth to skip Firebase.
    if (DEMO_MODE && localStorage.getItem('mmo-current-user')) {
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
    if (DEMO_MODE) {
      localStorage.removeItem('mmo-current-user');
      localStorage.removeItem('mmo-current-vendor');
    }
    setCurrentUser(null);
    setCurrentVendor(null);
    // Ensure Firebase session is cleared in production.
    if (auth) {
      void auth.signOut();
    }
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
