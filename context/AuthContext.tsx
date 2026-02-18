
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
    // Listen for Firebase auth changes
    const unsubscribe = onAuthStateChanged(auth!, async (firebaseUser) => {
      console.log('Auth State Changed. User:', firebaseUser?.email || 'None');

      if (firebaseUser && db) {
        // Fetch user data from Firestore
        try {
          const userDoc = await getDoc(doc(db, FIRESTORE_COLLECTIONS.STAFF_USERS, firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as StaffUser;
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
              // We don't block login here, but the UI should redirect to /set-password
              // This logic is usually better handled in a protected route or App.tsx, 
              // but we can set a flag or just let the user object carry the property.
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
                  setLoading(false);
                  return;
                }
              } else {
                console.warn('B2I Client document not found, blocking login');
                setCurrentUser(null);
                setCurrentVendor(null);
                setLoading(false);
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
          // Keep current user from localStorage
        } else {
          console.log('No Firebase session -> Clearing session');
          setCurrentUser(null);
          setCurrentVendor(null);
        }
      }
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

  const logout = async () => {
    console.log('Logging out...');
    try {
      await auth.signOut();
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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
