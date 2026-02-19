
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { StaffUser, UserRole, Vendor, B2IClient } from '../types';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { FIRESTORE_COLLECTIONS } from '../constants';

interface AuthContextType {
  currentUser: StaffUser | null;
  setCurrentUser: (user: StaffUser | null) => void;
  currentVendor: Vendor | null;
  setCurrentVendor: (vendor: Vendor | null) => void;
  updateCurrentUserAvatar: (avatarDataUrl: string) => void;
  loading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<StaffUser | null>(() => {
    // Check localStorage for persisted user on initial load
    const savedUser = localStorage.getItem('mmo-current-user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        // Revive Date objects
        if (parsed.createdAt) parsed.createdAt = new Date(parsed.createdAt);

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
    // If Firebase auth is not initialized (e.g. demo mode), show app immediately
    if (!auth) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    // Safety: stop showing loading after 8s so user at least sees landing page if auth/firestore hangs
    const timeoutId = setTimeout(() => {
      if (cancelled) return;
      setLoading(false);
    }, 8000);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (cancelled) return;
        console.log('Auth State Changed. User:', firebaseUser?.email || 'None');

        if (firebaseUser && db) {
          // Fetch user data from Firestore
          try {
            const userDoc = await getDoc(doc(db, FIRESTORE_COLLECTIONS.STAFF_USERS, firebaseUser.uid));
            if (cancelled) return;
            if (userDoc.exists()) {
              const userData = userDoc.data() as StaffUser;
              // B2I Parent is client-side only; block staff session and sign out.
              if (userData.role === UserRole.B2I_PARENT) {
                console.warn('AuthContext: B2I Parent detected in staffUsers. Clearing staff session; use Client Login instead.');
                setCurrentUser(null);
                setCurrentVendor(null);
                try {
                  if (auth) await auth.signOut();
                } catch (e) {
                  console.error('Error signing out B2I Parent from staff session:', e);
                }
                return;
              }
              const staffUser = { ...userData, id: firebaseUser.uid };
              setCurrentUser(staffUser);
              console.log('User data loaded from Firestore:', userData.name);
              // If role is VENDOR, load vendor from root vendors collection (vendors are not per-organization)
              if (userData.role === UserRole.VENDOR && userData.vendorId) {
                const vendorRef = doc(db, FIRESTORE_COLLECTIONS.VENDORS, userData.vendorId);
                const vendorSnap = await getDoc(vendorRef);
                if (vendorSnap.exists()) {
                  const v = vendorSnap.data();
                  setCurrentVendor({
                    id: vendorSnap.id,
                    name: v.name ?? '',
                    phone: v.phone,
                    email: v.email,
                    category: v.category ?? '',
                    gstNumber: v.gstNumber,
                    contact: v.contact ?? '', // Fix for missing property
                  });
                } else {
                  setCurrentVendor(null);
                }
              } else {
                setCurrentVendor(null);
              }

              // Check for forced password change
              if (userData.mustChangePassword) {
                console.log("User must change password.");
              }

              // If role is B2I_CLIENT, verify B2I client status
              if (userData.role === UserRole.B2I_CLIENT && userData.b2iId) {
                const b2iRef = doc(db, FIRESTORE_COLLECTIONS.B2I_CLIENTS, userData.b2iId);
                const b2iSnap = await getDoc(b2iRef);
                if (b2iSnap.exists()) {
                  const b2iData = b2iSnap.data();
                  if (b2iData.status === 'inactive') {
                    console.warn('B2I Client is inactive, blocking login');
                    setCurrentUser(null);
                    setCurrentVendor(null);
                    return;
                  }
                } else {
                  console.warn('B2I Client document not found, blocking login');
                  setCurrentUser(null);
                  setCurrentVendor(null);
                  return;
                }
              }
            } else {
              console.warn('User exists in Auth but not in Firestore');
              setCurrentUser(null);
              setCurrentVendor(null);
            }
          } catch (error) {
            console.error('Error fetching user data:', error);
            setCurrentUser(null);
            setCurrentVendor(null);
          }
        } else {
          // Check if we have a mock/local user session
          const localData = localStorage.getItem('mmo-current-user');
          let isMockUser = false;

          if (localData) {
            try {
              const parsed = JSON.parse(localData);
              // Mock users have simple IDs like 'user-1'
              if (parsed.id && parsed.id.length < 20) {
                isMockUser = true;
              }
            } catch (e) { }
          }

          if (isMockUser) {
            console.log('Keeping mock user session active');
          } else {
            console.log('No Firebase session -> Clearing session');
            setCurrentUser(null);
            setCurrentVendor(null);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    });

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []);

  const updateCurrentUserAvatar = (avatarDataUrl: string) => {
    if (currentUser) {
      // Save to localStorage for immediate UI update
      localStorage.setItem(`profile-pic-${currentUser.id}`, avatarDataUrl);

      // Update local state
      setCurrentUser(prevUser => prevUser ? { ...prevUser, avatar: avatarDataUrl } : null);
    }
  };

  const logout = async () => {
    console.log('Logging out...');
    try {
      if (auth) await auth.signOut();
    } catch (error) {
      console.error("Error signing out from Firebase:", error);
    }
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

/** Safe defaults when context is missing (e.g. during HMR or before provider mounts). */
const defaultAuthContext: AuthContextType = {
  currentUser: null,
  setCurrentUser: () => {},
  currentVendor: null,
  setCurrentVendor: () => {},
  updateCurrentUserAvatar: () => {},
  loading: true,
  logout: () => {},
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    if (import.meta.env.DEV) {
      console.warn('useAuth: no AuthProvider in tree (e.g. HMR). Using defaults.');
      return defaultAuthContext;
    }
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
