import React, { useState, useEffect } from 'react';
import { ExclamationTriangleIcon, FireIcon, HandThumbDownIcon, ShieldExclamationIcon, ClockIcon, BellAlertIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Card } from '../shared/DashboardUI';
import { motion, AnimatePresence } from 'framer-motion';
import { useCriticalAlerts, CriticalAlert } from '../../../hooks/useCriticalAlerts';
import { Task, TaskStatus } from '../../../types';
import { USERS } from '../../../constants';
import { alertService } from '../../../services/alertService';
import { useAuth } from '../../../context/AuthContext'; // Assuming auth context exists or we grab current user somehow

export interface RedFlag {
    id: string;
    type: 'overdue' | 'complaint' | 'validation';
    severity: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    entityId?: string;
    timestamp: Date;
    assigneeName?: string;
}

const RedFlagsHeader: React.FC = () => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [pulseAnimation, setPulseAnimation] = useState(false);
    const [dismissedKeys, setDismissedKeys] = useState<Set<string>>(new Set());

    // Auth context (mocked or real) - ensuring we have a user ID for logging actions
    // If useAuth isn't available, we'll default to a system/admin ID
    // const { currentUser } = useAuth(); 
    const currentUserId = "admin-user"; // Placeholder if auth not available in this scope

    // Real-time critical alerts monitoring
    const { alerts, counts, loading, hasCriticalAlerts } = useCriticalAlerts(true);

    // Filter out dismissed alerts
    const activeAlerts = alerts.filter(alert => {
        const key = `${alert.taskId}-${alert.type}`;
        return !dismissedKeys.has(key);
    });

    // Re-calculate counts based on filtered alerts
    const activeCounts = {
        critical: activeAlerts.filter(a => a.severity === 'critical').length,
        high: activeAlerts.filter(a => a.severity === 'high').length,
        total: activeAlerts.length,
        overdue: activeAlerts.filter(a => a.type === 'overdue').length,
        redFlags: activeAlerts.filter(a => a.type === 'red_flag').length,
    };

    const hasActiveCriticalAlerts = activeCounts.critical > 0;
    const hasActiveAlerts = activeCounts.total > 0;

    // Load dismissed alerts on mount
    useEffect(() => {
        const loadDismissed = async () => {
            const keys = await alertService.getDismissedAlerts();
            setDismissedKeys(keys);
        };
        loadDismissed();
    }, []);

    // Log critical alerts to DB
    useEffect(() => {
        if (hasCriticalAlerts) {
            alertService.logRedFlags(alerts);
        }
    }, [alerts, hasCriticalAlerts]);

    // Trigger pulse animation when new critical alerts appear
    useEffect(() => {
        if (hasActiveCriticalAlerts) {
            setPulseAnimation(true);
            const timeout = setTimeout(() => setPulseAnimation(false), 2000);
            return () => clearTimeout(timeout);
        }
    }, [activeCounts.critical, hasActiveCriticalAlerts]);

    const handleDismiss = async (e: React.MouseEvent, alert: CriticalAlert) => {
        e.stopPropagation(); // Prevent toggling expand

        // Optimistic update
        const key = `${alert.taskId}-${alert.type}`;
        setDismissedKeys(prev => new Set(prev).add(key));

        // Call service
        await alertService.dismissAlert(alert, currentUserId);
    };

    if (loading) return (
        <Card className="bg-surface mb-8 border-l-4 border-l-border p-4 animate-pulse">
            <div className="h-6 w-1/3 bg-subtle-background rounded mb-2"></div>
            <div className="h-4 w-1/4 bg-subtle-background rounded"></div>
        </Card>
    );

    // Don't show if no alerts
    if (!activeCounts.total) return null;

    // Determine severity for styling
    const isCritical = activeCounts.critical > 0;
    const severityBgColor = isCritical ? 'bg-red-50/50' : activeCounts.high > 0 ? 'bg-orange-50/50' : 'bg-yellow-50/50';
    const severityBorderColor = isCritical ? 'border-l-error' : activeCounts.high > 0 ? 'border-l-orange-500' : 'border-l-yellow-500';

    return (
        <Card className={`${severityBgColor} border-l-4 ${severityBorderColor} mb-8 overflow-hidden ${pulseAnimation ? 'animate-pulse' : ''}`}>
            <div
                className="flex items-center justify-between cursor-pointer p-4"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-4">
                    <div className={`p-3 ${isCritical ? 'bg-error' : activeCounts.high > 0 ? 'bg-orange-500' : 'bg-yellow-500'} text-white rounded-xl shadow-lg ${isCritical ? 'shadow-error/20 animate-pulse' : ''}`}>
                        {isCritical ? <FireIcon className="w-6 h-6" /> : <BellAlertIcon className="w-6 h-6" />}
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-text-primary flex items-center gap-2">
                            CRITICAL ATTENTION REQUIRED
                            <span className="relative flex h-3 w-3">
                                {isCritical && (
                                    <>
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-error"></span>
                                    </>
                                )}
                            </span>
                            {activeCounts.critical > 0 && (
                                <span className="px-2 py-0.5 bg-error text-white text-[10px] rounded-full font-black animate-pulse">
                                    {activeCounts.critical} CRITICAL
                                </span>
                            )}
                            {activeCounts.high > 0 && (
                                <span className="px-2 py-0.5 bg-orange-500 text-white text-[10px] rounded-full font-bold">
                                    {activeCounts.high} HIGH
                                </span>
                            )}
                        </h3>
                        <p className="text-sm text-text-secondary font-medium">
                            {activeCounts.total} critical {activeCounts.total === 1 ? 'issue' : 'issues'} require your immediate action.
                            {activeCounts.overdue > 0 && ` • ${activeCounts.overdue} overdue`}
                            {activeCounts.redFlags > 0 && ` • ${activeCounts.redFlags} red flags`}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button className="text-text-tertiary hover:text-text-primary transition-colors text-sm font-bold uppercase tracking-wider">
                        {isExpanded ? 'Collapse View' : 'View Details'}
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-white/50 border-t border-error/10"
                    >
                        <div className="p-4 grid gap-3 max-h-[400px] overflow-y-auto">
                            {activeAlerts.map(alert => {
                                const getSeverityStyle = (severity: string) => {
                                    switch (severity) {
                                        case 'critical':
                                            return 'bg-red-100 text-red-600 border-red-200';
                                        case 'high':
                                            return 'bg-orange-100 text-orange-600 border-orange-200';
                                        case 'medium':
                                            return 'bg-yellow-100 text-yellow-600 border-yellow-200';
                                        default:
                                            return 'bg-gray-100 text-gray-600 border-gray-200';
                                    }
                                };

                                const getTypeIcon = (type: string) => {
                                    switch (type) {
                                        case 'overdue':
                                            return <ClockIcon className="w-4 h-4" />;
                                        case 'approaching_deadline':
                                            return <ExclamationTriangleIcon className="w-4 h-4" />;
                                        case 'red_flag':
                                            return <FireIcon className="w-4 h-4" />;
                                        case 'yellow_flag':
                                            return <BellAlertIcon className="w-4 h-4" />;
                                        default:
                                            return <ShieldExclamationIcon className="w-4 h-4" />;
                                    }
                                };

                                return (
                                    <motion.div
                                        key={alert.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className={`group flex items-start gap-4 p-3 bg-white rounded-lg border shadow-sm hover:shadow-md transition-all ${alert.severity === 'critical' ? 'ring-2 ring-error/30' : ''}`}
                                    >
                                        <div className={`mt-1 p-1.5 rounded-lg border ${getSeverityStyle(alert.severity)}`}>
                                            {getTypeIcon(alert.type)}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <h4 className="font-bold text-text-primary">{alert.title}</h4>
                                                <div className="flex items-center gap-2">
                                                    {alert.severity === 'critical' && (
                                                        <span className="px-2 py-0.5 bg-error text-white text-[9px] rounded-full font-black uppercase animate-pulse">
                                                            URGENT
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="text-sm text-text-secondary mt-1">{alert.description}</p>
                                            <div className="flex items-center gap-3 mt-2 text-xs text-text-tertiary">
                                                {alert.userName && (
                                                    <span className="font-medium">👤 {alert.userName}</span>
                                                )}
                                                {alert.deadline && (
                                                    <span>⏰ Deadline: {alert.deadline.toLocaleString()}</span>
                                                )}
                                                {alert.hoursOverdue && (
                                                    <span className="text-error font-bold">⚠️ {alert.hoursOverdue}h overdue</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end gap-2">
                                            <button className="px-3 py-1.5 text-xs font-bold bg-subtle-background hover:bg-primary hover:text-white rounded-lg transition-colors whitespace-nowrap">
                                                ACT NOW
                                            </button>
                                            <button
                                                onClick={(e) => handleDismiss(e, alert)}
                                                className="px-3 py-1.5 text-xs font-bold text-text-tertiary hover:bg-error/10 hover:text-error rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 opacity-0 group-hover:opacity-100"
                                                title="Dismiss Alert"
                                            >
                                                <XMarkIcon className="w-3 h-3" />
                                                Dismiss
                                            </button>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </Card>
    );
};

export default RedFlagsHeader;

