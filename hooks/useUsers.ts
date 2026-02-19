import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { StaffUser, UserRole } from '../types';
import { FIRESTORE_COLLECTIONS } from '../constants';

interface UseUsersOptions {
  organizationId?: string;
  role?: UserRole;
  isActive?: boolean;
}

export const useUsers = (options: UseUsersOptions = {}) => {
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }

    try {
      const usersRef = collection(db, FIRESTORE_COLLECTIONS.STAFF_USERS);
      let q = query(usersRef);

      // Apply filters — never pass undefined to where(); Firestore throws.
      const organizationId =
        options.organizationId != null && typeof options.organizationId === 'string'
          ? options.organizationId.trim()
          : '';
      if (organizationId) {
        q = query(q, where('organizationId', '==', organizationId));
      }
      if (options.role != null && options.role !== '') {
        q = query(q, where('role', '==', options.role));
      }
      if (options.isActive !== undefined) {
        q = query(q, where('isActive', '==', options.isActive));
      }

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const usersData = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              ...data,
              id: doc.id,
              createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
            } as StaffUser;
          });

          setUsers(usersData);
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error('Error fetching users:', err);
          setError(err.message);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err: any) {
      console.error('Error setting up users listener:', err);
      setError(err.message);
      setLoading(false);
    }
  }, [options.organizationId, options.role, options.isActive]);

  // Get single user by ID
  const getUserById = async (userId: string): Promise<StaffUser | null> => {
    if (!db) return null;

    try {
      const userDoc = await getDoc(doc(db, FIRESTORE_COLLECTIONS.STAFF_USERS, userId));
      if (userDoc.exists()) {
        const data = userDoc.data();
        return {
          ...data,
          id: userDoc.id,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
        } as StaffUser;
      }
      return null;
    } catch (err) {
      console.error('Error getting user:', err);
      return null;
    }
  };

  return {
    users,
    loading,
    error,
    getUserById,
  };
};
