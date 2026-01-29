import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { User, UserRole } from '../types';
import { USERS } from '../constants';

/**
 * Hook to fetch all staff members and their performance metrics
 */
export const useStaffPerformance = () => {
    const [staff, setStaff] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!db) {
            setStaff(USERS.filter(u => u.role !== UserRole.SUPER_ADMIN));
            setLoading(false);
            return;
        }
        // FIXED: Query staffUsers collection (not 'users') to match where users are created
        const usersRef = collection(db, 'staffUsers');
        // Fetch all users (you can filter by role if needed, but for now we fetch all)
        const q = query(usersRef);

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const usersData: User[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                usersData.push({
                    ...data,
                    id: doc.id,
                    flagUpdatedAt: data.flagUpdatedAt?.toDate ? data.flagUpdatedAt.toDate() : (data.flagUpdatedAt ? new Date(data.flagUpdatedAt) : undefined),
                    lastUpdateTimestamp: data.lastUpdateTimestamp?.toDate ? data.lastUpdateTimestamp.toDate() : (data.lastUpdateTimestamp ? new Date(data.lastUpdateTimestamp) : undefined),
                } as User);
            });

            // Filter out Super Admins from performance monitoring if desired, 
            // or keep all internal users
            setStaff(usersData.filter(u => u.role !== UserRole.SUPER_ADMIN));
            setLoading(false);
        }, (err) => {
            console.error('Error fetching staff performance:', err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const performanceStats = {
        green: staff.filter(u => u.performanceFlag === 'green').length,
        yellow: staff.filter(u => u.performanceFlag === 'yellow').length,
        red: staff.filter(u => u.performanceFlag === 'red').length,
        total: staff.length
    };

    return { staff, performanceStats, loading };
};
