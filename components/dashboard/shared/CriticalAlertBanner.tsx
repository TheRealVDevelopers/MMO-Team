import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FireIcon, XMarkIcon, BellAlertIcon } from '@heroicons/react/24/outline';
import { useCriticalAlerts } from '../../../hooks/useCriticalAlerts';

interface CriticalAlertBannerProps {
    userId?: string;
    teamView?: boolean;
    compact?: boolean;
}

/**
 * Real-time critical alert banner that displays at the top of dashboards
 * Automatically updates when tasks become critical or overdue
 */
const CriticalAlertBanner: React.FC<CriticalAlertBannerProps> = ({ 
    userId, 
    teamView = false,
    compact = false 
}) => {
    const { alerts, counts, hasCriticalAlerts, hasAlerts } = useCriticalAlerts(teamView);
    const [dismissed, setDismissed] = useState(false);
    const [showAnimation, setShowAnimation] = useState(false);

    // Filter alerts by userId if provided (for personal dashboards)
    const relevantAlerts = userId 
        ? alerts.filter(alert => alert.userId === userId)
        : alerts;

    const relevantCounts = userId ? {
        critical: relevantAlerts.filter(a => a.severity === 'critical').length,
        high: relevantAlerts.filter(a => a.severity === 'high').length,
        total: relevantAlerts.length
    } : counts;

    // Trigger animation when new critical alerts appear
    useEffect(() => {
        if (relevantCounts.critical > 0) {
            setShowAnimation(true);
            setDismissed(false); // Auto-show on new critical alerts
            const timeout = setTimeout(() => setShowAnimation(false), 3000);
            return () => clearTimeout(timeout);
        }
    }, [relevantCounts.critical]);

    // Don't show if no alerts or dismissed
    if (!relevantAlerts.length || dismissed) return null;

    const isCritical = relevantCounts.critical > 0;
    const bgColor = isCritical ? 'bg-red-500' : relevantCounts.high > 0 ? 'bg-orange-500' : 'bg-yellow-500';
    const textColor = 'text-white';

    if (compact) {
        return (
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`${bgColor} ${textColor} p-2 flex items-center justify-between rounded-lg mb-4 ${showAnimation ? 'animate-pulse' : ''}`}
                >
                    <div className="flex items-center gap-2">
                        {isCritical ? (
                            <FireIcon className="w-5 h-5 animate-pulse" />
                        ) : (
                            <BellAlertIcon className="w-5 h-5" />
                        )}
                        <span className="text-sm font-bold">
                            {relevantCounts.critical > 0 && `${relevantCounts.critical} CRITICAL`}
                            {relevantCounts.high > 0 && ` ${relevantCounts.high} HIGH`}
                            {' '}• {relevantCounts.total} alerts
                        </span>
                    </div>
                    <button
                        onClick={() => setDismissed(true)}
                        className="hover:bg-white/20 p-1 rounded transition-colors"
                    >
                        <XMarkIcon className="w-4 h-4" />
                    </button>
                </motion.div>
            </AnimatePresence>
        );
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                className={`${bgColor} ${textColor} shadow-lg mb-6 rounded-2xl overflow-hidden ${showAnimation ? 'ring-4 ring-white/50' : ''}`}
            >
                <div className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 bg-white/20 rounded-xl ${isCritical ? 'animate-pulse' : ''}`}>
                            {isCritical ? (
                                <FireIcon className="w-8 h-8" />
                            ) : (
                                <BellAlertIcon className="w-8 h-8" />
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h3 className="text-xl font-black tracking-tight">
                                    CRITICAL ATTENTION REQUIRED
                                </h3>
                                {isCritical && (
                                    <span className="relative flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                                {relevantCounts.critical > 0 && (
                                    <span className="px-2 py-0.5 bg-white/30 text-white text-xs rounded-full font-black uppercase">
                                        {relevantCounts.critical} Critical
                                    </span>
                                )}
                                {relevantCounts.high > 0 && (
                                    <span className="px-2 py-0.5 bg-white/20 text-white text-xs rounded-full font-bold">
                                        {relevantCounts.high} High Priority
                                    </span>
                                )}
                                <span className="text-sm font-medium opacity-90">
                                    {relevantCounts.total} total {relevantCounts.total === 1 ? 'alert' : 'alerts'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => {
                                // Navigate to detailed view or expand
                                const element = document.getElementById('critical-alerts-section');
                                element?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-bold text-sm transition-colors"
                        >
                            VIEW DETAILS
                        </button>
                        <button
                            onClick={() => setDismissed(true)}
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                            title="Dismiss"
                        >
                            <XMarkIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Top 3 most critical alerts preview */}
                <div className="bg-black/10 p-4 space-y-2">
                    {relevantAlerts.slice(0, 3).map((alert, index) => (
                        <motion.div
                            key={alert.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-white/10 backdrop-blur-sm p-3 rounded-lg flex items-center justify-between"
                        >
                            <div className="flex-1">
                                <p className="font-bold text-sm">{alert.title}</p>
                                <p className="text-xs opacity-80 mt-0.5">{alert.description}</p>
                            </div>
                            {alert.severity === 'critical' && (
                                <span className="px-2 py-0.5 bg-white/20 text-white text-[9px] rounded-full font-black uppercase ml-3">
                                    URGENT
                                </span>
                            )}
                        </motion.div>
                    ))}
                    {relevantAlerts.length > 3 && (
                        <p className="text-xs text-center opacity-70 pt-2">
                            + {relevantAlerts.length - 3} more alerts
                        </p>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default CriticalAlertBanner;
