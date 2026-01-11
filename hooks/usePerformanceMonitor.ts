import { useEffect } from 'react';
import { updateAllUsersPerformance } from '../services/performanceService';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

/**
 * Background monitor that recalculates all user performance flags every minute.
 * Only active for Super Admin or Manager.
 */
export const usePerformanceMonitor = () => {
    const { currentUser } = useAuth();

    useEffect(() => {
        if (!currentUser) return;

        // Only Super Admin and Manager roles trigger the global background monitoring
        if (currentUser.role !== UserRole.SUPER_ADMIN && currentUser.role !== UserRole.MANAGER) {
            return;
        }

        console.log('Performance monitoring active...');

        // Run immediately on mount
        updateAllUsersPerformance();

        // Run every minute
        const intervalId = setInterval(() => {
            console.log('Running scheduled performance update...');
            updateAllUsersPerformance();
        }, 60000);

        return () => clearInterval(intervalId);
    }, [currentUser?.role]);
};
