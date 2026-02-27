import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { User, UserRole } from '../types';


/**
 * Hook to fetch all staff members and their performance metrics
 */
export const useStaffPerformance = () => {
    const [staff, setStaff] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!db) {
            setStaff([]);
            setLoading(false);
            return;
        }

        // 1. Fetch Staff Users
        const usersRef = collection(db, 'staffUsers');
        const qUsers = query(usersRef);

        // 2. Fetch Today's Attendance (Real-time) - time entries use dateKey
        const today = new Date().toLocaleDateString('en-CA'); // strict YYYY-MM-DD
        const timeEntriesRef = collection(db, 'timeEntries');
        const qTime = query(timeEntriesRef, where('dateKey', '==', today));

        // Use a composite listener approach or just independent listeners?
        // Independent listeners are easier to manage but might cause double renders.
        // Let's nest them or use state to combine.

        // We'll stick to a simpler pattern: Listen to users, and inside that listener, listen to time?
        // No, that's bad for perf. Let's listen to both independently and combine in a useEffect or useMemo.
        // Actually, let's just do it in one effect with two listeners updating partial state.

        let usersMap: Record<string, User> = {};
        let attendanceMap: Record<string, string> = {};

        const updateCombinedState = () => {
            const combinedStaff = Object.values(usersMap).map(user => ({
                ...user,
                attendanceStatus: (attendanceMap[user.id] as any) || 'ABSENT'
            }));

            // Filter out deactivated users and non-staff external roles
            const activeCompanyStaff = combinedStaff.filter(u => {
                if ((u as any).isActive === false) return false;

                // Exclude external roles that shouldn't be in the company headcount
                const externalRoles: string[] = [
                    UserRole.VENDOR,
                    UserRole.B2I_CLIENT,
                    UserRole.B2I_PARENT
                ];
                if (externalRoles.includes(u.role as string)) return false;

                // Previously SUPER_ADMIN was filtered out, but TeamHeadcountModal 
                // expects SUPER_ADMIN to be in 'Accounts & Admin'. 
                // So we won't filter them out here anymore.
                return true;
            });

            setStaff(activeCompanyStaff);
            setLoading(false);
        };

        const unsubUsers = onSnapshot(qUsers, (snapshot) => {
            snapshot.forEach((doc) => {
                const data = doc.data();
                usersMap[doc.id] = {
                    ...data,
                    id: doc.id,
                    flagUpdatedAt: data.flagUpdatedAt?.toDate ? data.flagUpdatedAt.toDate() : (data.flagUpdatedAt ? new Date(data.flagUpdatedAt) : undefined),
                    lastUpdateTimestamp: data.lastUpdateTimestamp?.toDate ? data.lastUpdateTimestamp.toDate() : (data.lastUpdateTimestamp ? new Date(data.lastUpdateTimestamp) : undefined),
                } as unknown as User;
            });
            updateCombinedState();
        });

        const unsubTime = onSnapshot(qTime, (snapshot) => {
            const newAttendanceMap: Record<string, string> = {};
            snapshot.forEach((doc) => {
                const data = doc.data();
                // Determine status based on clockIn/clockOut/breaks
                let status = 'CLOCKED_IN';
                if (data.clockOut) status = 'CLOCKED_OUT';
                else if (data.breaks && data.breaks.some((b: any) => !b.endTime)) status = 'ON_BREAK';

                newAttendanceMap[data.userId] = status;
            });
            attendanceMap = newAttendanceMap;
            updateCombinedState();
        });

        return () => {
            unsubUsers();
            unsubTime();
        };
    }, []);

    const performanceStats = {
        green: staff.filter(u => u.performanceFlag === 'green').length,
        yellow: staff.filter(u => u.performanceFlag === 'yellow').length,
        red: staff.filter(u => u.performanceFlag === 'red').length,
        total: staff.length
    };

    return { staff, performanceStats, loading };
};
