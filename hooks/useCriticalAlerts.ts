import { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { Task, TaskStatus, User } from '../types';

export interface CriticalAlert {
    id: string;
    type: 'overdue' | 'approaching_deadline' | 'red_flag' | 'yellow_flag';
    severity: 'critical' | 'high' | 'medium';
    title: string;
    description: string;
    taskId?: string;
    userId?: string;
    userName?: string;
    timestamp: Date;
    deadline?: Date;
    hoursOverdue?: number;
}

/**
 * Real-time hook for monitoring critical alerts across all tasks
 * Automatically updates when tasks change or deadlines are reached
 */
export const useCriticalAlerts = (teamView: boolean = true) => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());

    // Real-time task monitoring
    useEffect(() => {
        if (!db) {
            setLoading(false);
            return;
        }

        const tasksRef = collection(db, 'myDayTasks');
        let q = query(tasksRef, orderBy('created_at', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const tasksData: Task[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                tasksData.push({
                    ...data,
                    id: doc.id,
                    deadline: data.deadline,
                    dueAt: data.dueAt?.toDate ? data.dueAt.toDate() : (data.dueAt ? new Date(data.dueAt) : undefined),
                    completedAt: data.completedAt?.toDate ? data.completedAt.toDate() : (data.completedAt ? new Date(data.completedAt) : undefined),
                } as Task);
            });

            // Filter team tasks if teamView is enabled
            const filteredTasks = teamView
                ? tasksData.filter(task => task.userId !== task.createdBy)
                : tasksData;

            setTasks(filteredTasks);
            setLoading(false);
        }, (err) => {
            console.error('Error fetching tasks for critical alerts:', err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [teamView]);

    // Real-time user monitoring
    useEffect(() => {
        if (!db) return;

        const usersRef = collection(db, 'staffUsers');
        const unsubscribe = onSnapshot(usersRef, (snapshot) => {
            const usersData: User[] = [];
            snapshot.forEach((doc) => {
                usersData.push({
                    ...doc.data(),
                    id: doc.id,
                } as User);
            });
            setUsers(usersData);
        }, (err) => {
            console.error('Error fetching users for critical alerts:', err);
        });

        return () => unsubscribe();
    }, []);

    // Update current time every minute for time-based alerts
    useEffect(() => {
        const intervalId = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000); // Update every minute

        return () => clearInterval(intervalId);
    }, []);

    // Generate critical alerts in real-time
    const alerts = useMemo(() => {
        const generatedAlerts: CriticalAlert[] = [];
        const now = currentTime;
        const currentHour = now.getHours();

        tasks.forEach(task => {
            if (task.status === TaskStatus.COMPLETED) return;

            const userName = users.find(u => u.id === task.userId)?.name || 'Unknown User';

            // Check for overdue tasks
            if (task.deadline) {
                const deadline = new Date(task.deadline);
                const diffMs = now.getTime() - deadline.getTime();
                const diffHours = diffMs / (1000 * 60 * 60);

                if (diffHours > 2) {
                    // Critical: Overdue by more than 2 hours (Red Flag condition)
                    generatedAlerts.push({
                        id: `overdue-critical-${task.id}`,
                        type: 'overdue',
                        severity: 'critical',
                        title: `CRITICAL: Task Overdue by ${Math.floor(diffHours)} hours`,
                        description: `${userName} - "${task.title}" is severely overdue (Red Flag)`,
                        taskId: task.id,
                        userId: task.userId,
                        userName,
                        timestamp: deadline,
                        deadline,
                        hoursOverdue: Math.floor(diffHours)
                    });
                } else if (diffHours > 0) {
                    // High: Recently overdue
                    generatedAlerts.push({
                        id: `overdue-high-${task.id}`,
                        type: 'overdue',
                        severity: 'high',
                        title: `Task Overdue: ${task.title}`,
                        description: `${userName} is late by ${Math.floor(diffHours)} hours`,
                        taskId: task.id,
                        userId: task.userId,
                        userName,
                        timestamp: deadline,
                        deadline,
                        hoursOverdue: Math.floor(diffHours)
                    });
                } else if (diffHours > -1) {
                    // Medium: Approaching deadline (within 1 hour)
                    const minsLeft = Math.floor(Math.abs(diffMs) / (1000 * 60));
                    generatedAlerts.push({
                        id: `approaching-${task.id}`,
                        type: 'approaching_deadline',
                        severity: 'medium',
                        title: `Urgent: ${minsLeft} minutes remaining`,
                        description: `${userName} - "${task.title}" deadline approaching`,
                        taskId: task.id,
                        userId: task.userId,
                        userName,
                        timestamp: now,
                        deadline
                    });
                }
            }

            // Check for time-based red flags (6 PM rule)
            const todayStr = now.toISOString().split('T')[0];
            if (task.date === todayStr && currentHour >= 18) {
                generatedAlerts.push({
                    id: `red-flag-6pm-${task.id}`,
                    type: 'red_flag',
                    severity: 'critical',
                    title: 'CRITICAL: Task incomplete after 6 PM',
                    description: `${userName} - "${task.title}" still pending`,
                    taskId: task.id,
                    userId: task.userId,
                    userName,
                    timestamp: now
                });
            } else if (task.date === todayStr && currentHour >= 16) {
                // Yellow flag (4 PM warning)
                generatedAlerts.push({
                    id: `yellow-flag-4pm-${task.id}`,
                    type: 'yellow_flag',
                    severity: 'medium',
                    title: 'Warning: 4 PM - Task pending',
                    description: `${userName} - "${task.title}" needs attention`,
                    taskId: task.id,
                    userId: task.userId,
                    userName,
                    timestamp: now
                });
            }
        });

        // Check for users with persistent Red Flags (from Performance Cycle)
        users.forEach(user => {
            if (user.performanceFlag === 'red') {
                generatedAlerts.push({
                    id: `user-red-flag-${user.id}`,
                    type: 'red_flag',
                    severity: 'critical',
                    title: `CRITICAL PERFORMANCE FLAG: ${user.name}`,
                    description: `${user.name} is in the Red Zone. ${user.flagReason || 'Multiple operational failures detected.'}`,
                    userId: user.id,
                    userName: user.name,
                    timestamp: user.flagUpdatedAt ? new Date(user.flagUpdatedAt) : now,
                });
            }
        });

        // Cutoff: Only show alerts from TODAY onwards to satisfy "delete all existing, show only new ones from tomorrow"
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

        // Sort by severity and timestamp
        return generatedAlerts
            .filter(a => a.timestamp.getTime() >= todayStart)
            .sort((a, b) => {
                const severityOrder = { critical: 0, high: 1, medium: 2 };
                if (severityOrder[a.severity] !== severityOrder[b.severity]) {
                    return severityOrder[a.severity] - severityOrder[b.severity];
                }
                return b.timestamp.getTime() - a.timestamp.getTime();
            });
    }, [tasks, users, currentTime]);

    // Categorized counts
    const counts = useMemo(() => ({
        critical: alerts.filter(a => a.severity === 'critical').length,
        high: alerts.filter(a => a.severity === 'high').length,
        medium: alerts.filter(a => a.severity === 'medium').length,
        total: alerts.length,
        overdue: alerts.filter(a => a.type === 'overdue').length,
        approaching: alerts.filter(a => a.type === 'approaching_deadline').length,
        redFlags: alerts.filter(a => a.type === 'red_flag').length,
        yellowFlags: alerts.filter(a => a.type === 'yellow_flag').length
    }), [alerts]);

    return {
        alerts,
        counts,
        loading,
        hasCriticalAlerts: counts.critical > 0,
        hasAlerts: counts.total > 0
    };
};
