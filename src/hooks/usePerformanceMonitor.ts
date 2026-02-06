import { useEffect } from 'react';
import { updateAllUsersPerformance, monitorAllUsersPerformance } from '../services/performanceService';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { db } from '../firebase';

/**
 * Real-time performance monitor that uses Firestore listeners for instant updates.
 * Automatically recalculates performance flags when tasks change.
 * Only active for Super Admin or Manager.
 */
export const usePerformanceMonitor = () => {
    const { currentUser } = useAuth();

    useEffect(() => {
        if (!currentUser || !db) return;

        // Only Super Admin and Manager roles trigger the real-time monitoring
        if (currentUser.role !== UserRole.SUPER_ADMIN && currentUser.role !== UserRole.MANAGER) {
            return;
        }

        console.log('Real-time performance monitoring active...');

        let cleanupMonitors: (() => void) | null = null;

        // Set up real-time monitoring for all users
        const setupMonitoring = async () => {
            cleanupMonitors = await monitorAllUsersPerformance();
        };

        setupMonitoring();

        // Also run a periodic check every 5 minutes as backup
        // (in case of any missed updates)
        const intervalId = setInterval(() => {
            console.log('Running backup performance update...');
            updateAllUsersPerformance();
        }, 300000); // 5 minutes

        return () => {
            clearInterval(intervalId);
            if (cleanupMonitors) {
                cleanupMonitors();
            }
        };
    }, [currentUser?.role]);
};
