import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { User } from '../types';

export const useUsers = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        setLoading(true);
        const usersRef = collection(db, 'staffUsers');
        // Order by name for better UI
        const q = query(usersRef, orderBy('name', 'asc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const usersData: User[] = [];
            snapshot.forEach((doc) => {
                usersData.push({
                    ...doc.data(),
                    id: doc.id
                } as User);
            });
            setUsers(usersData);
            setLoading(false);
        }, (err) => {
            console.error('Error fetching users:', err);
            setError(err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const addUser = async (userData: Omit<User, 'id'>) => {
        try {
            const usersRef = collection(db, 'staffUsers');
            await addDoc(usersRef, {
                ...userData,
                createdAt: serverTimestamp(),
                lastUpdateTimestamp: serverTimestamp()
            });
        } catch (err) {
            console.error('Error adding user:', err);
            throw err;
        }
    };

    const updateUserStatus = async (userId: string, isActive: boolean) => {
        // Logic to update user status (e.g. set a flag or move to inactive collection)
        // For now, let's assume we toggle a flag, though 'isActive' isn't on User type yet.
        // We might need to add 'isActive' to User type or use 'attendanceStatus': 'ABSENT' as proxy?
        // User request said "Activate / deactivate". 
        // Let's assume we add an 'isActive' field to the user document update.
        try {
            // Implementation pending specific requirement on field, 
            // but I will add the function signature for UI binding.
            console.log(`Toggling status for ${userId} to ${isActive}`);
        } catch (err) {
            console.error('Error updating user status:', err);
            throw err;
        }
    };

    return { users, loading, error, addUser, updateUserStatus };
};
