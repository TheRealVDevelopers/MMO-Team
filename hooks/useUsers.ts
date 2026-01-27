import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
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

    return { users, loading, error };
};
