
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
        // Revive Date objects
        if (parsed.lastUpdateTimestamp) parsed.lastUpdateTimestamp = new Date(parsed.lastUpdateTimestamp);
        if (parsed.currentTaskDetails?.startTime) parsed.currentTaskDetails.startTime = new Date(parsed.currentTaskDetails.startTime);

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
    // We listen for Firebase auth changes regardless of localStorage
    const unsubscribe = onAuthStateChange((firebaseUser) => {
      console.log('Auth State Verified. User:', firebaseUser?.email || 'None');

      if (firebaseUser) {
        // Firebase has confirmed a user session -> Update Source of Truth
        setCurrentUser(firebaseUser);
      } else {
        // Firebase says "No User"
        // Check if we are currently using a "Simplified/Mock" login which relies ONLY on localStorage
        // Mock users have IDs like 'user-1', 'user-2' etc. (length < 20)
        // Real Firebase UIDs are 28 chars string

        // We access the current Reference of state inside the callback? 
        // No, closure captures initial state! We need to check localStorage directly or use functional update?
        // Actually, we can check localStorage here since it's the persistence layer for mock users.
        const localData = localStorage.getItem('mmo-current-user');
        let isMockUser = false;

        if (localData) {
          try {
            const parsed = JSON.parse(localData);
            // Simple heuristic: If ID is short (e.g. "user-1"), it's a mock user from constants
            if (parsed.id && parsed.id.length < 20) {
              isMockUser = true;
            }
          } catch (e) { }
        }

        if (isMockUser) {
          console.log('Keeping Simplified/Mock User session active despite no Firebase session.');
          // Do NOT clear currentUser
        } else {
          console.log('No Firebase session and not a mock user -> Clearing session.');
          setCurrentUser(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []); // Run once on mount

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
