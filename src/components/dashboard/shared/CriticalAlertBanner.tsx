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

    const handleActNow = (taskId?: string) => {
        if (!taskId) return;
        const element = document.getElementById(taskId); // Try finding by ID
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('ring-4', 'ring-red-500', 'ring-offset-2');
            setTimeout(() => {
                element.classList.remove('ring-4', 'ring-red-500', 'ring-offset-2');
            }, 3000);
        } else {
            // Fallback: Try identifying it in the timeline logic if IDs differ
            console.warn(`Could not find element with ID: ${taskId}`);
        }
    };

    if (compact) {
        return (
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`${bgColor} ${textColor} p-2 flex items-center justify-between rounded-lg mb-4 cursor-pointer hover:shadow-md transition-all ${showAnimation ? 'animate-pulse' : ''}`}
                    onClick={() => {
                        const banner = document.getElementById('critical-alert-banner-expanded');
                        // If we are in compact mode but have an expanded version somewhere, scroll there.
                        // But usually compact is standalone. We can maybe make compact expandable too?
                        // For now, compact remains simple as requested, but the user complained about "top 3 demo values" which implies the full banner.
                    }}
                >
                    <div className="flex items-center gap-2">
                        {isCritical ? <FireIcon className="w-5 h-5 animate-pulse" /> : <BellAlertIcon className="w-5 h-5" />}
                        <span className="text-sm font-bold">
                            {relevantCounts.critical > 0 && `${relevantCounts.critical} CRITICAL`}
                            {relevantCounts.high > 0 && ` ${relevantCounts.high} HIGH`}
                            {' '}• {relevantCounts.total} alerts
                        </span>
                    </div>
                    {/* Make compact expandable inline if needed, or just redirect to My Day */}
                </motion.div>
            </AnimatePresence>
        );
    }

    // Expanded Full Banner Logic
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <AnimatePresence>
            <motion.div
                id="critical-alert-banner-expanded"
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                className={`${bgColor} ${textColor} shadow-lg mb-6 rounded-2xl overflow-hidden transition-all duration-300 ${isExpanded ? 'ring-4 ring-white/20' : ''}`}
            >
                <div className="p-6 flex items-center justify-between cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
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
                        <span className="text-xs font-bold uppercase tracking-widest bg-white/20 px-3 py-1 rounded-lg">
                            {isExpanded ? 'Collapse' : 'View Details'}
                        </span>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setDismissed(true);
                            }}
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                            title="Dismiss"
                        >
                            <XMarkIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Expanded Details View */}
                <AnimatePresence>
                    {(isExpanded || relevantCounts.critical > 0) && ( // Auto-expand if critical? Maybe just always render but allow collapse
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="bg-black/10 backdrop-blur-sm border-t border-white/10"
                        >
                            <div className="p-4 space-y-2 max-h-[400px] overflow-y-auto">
                                {/* Show ALL alerts when expanded, not just top 3 */}
                                {(isExpanded ? relevantAlerts : relevantAlerts.slice(0, 3)).map((alert, index) => (
                                    <motion.div
                                        key={alert.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="bg-white/10 hover:bg-white/20 p-3 rounded-lg flex items-center justify-between group transition-colors"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold text-sm">{alert.title}</p>
                                                {alert.severity === 'critical' && (
                                                    <span className="px-2 py-0.5 bg-white/20 text-white text-[9px] rounded-full font-black uppercase">
                                                        URGENT
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs opacity-80 mt-0.5">{alert.description}</p>
                                            <div className="flex items-center gap-3 mt-1 text-[10px] opacity-70">
                                                {alert.timestamp && <span>🕒 {alert.timestamp.toLocaleTimeString()}</span>}
                                                {alert.deadline && <span>📅 Due: {alert.deadline.toLocaleDateString()}</span>}
                                            </div>
                                        </div>

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleActNow(alert.taskId);
                                            }}
                                            className="px-4 py-2 bg-white text-black text-xs font-bold rounded-lg transform transition-all hover:scale-105 hover:bg-white/90 shadow-lg active:scale-95 ml-4"
                                        >
                                            ACT NOW
                                        </button>
                                    </motion.div>
                                ))}

                                {!isExpanded && relevantAlerts.length > 3 && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setIsExpanded(true); }}
                                        className="w-full py-2 text-xs text-center font-bold uppercase tracking-widest hover:bg-white/5 rounded-lg transition-colors"
                                    >
                                        + {relevantAlerts.length - 3} more alerts (Click to expand)
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </AnimatePresence>
    );
};

export default CriticalAlertBanner;
