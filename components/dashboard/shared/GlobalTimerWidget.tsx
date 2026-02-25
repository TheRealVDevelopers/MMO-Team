import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useTimeEntries, useCurrentTimeStatus } from '../../../hooks/useTimeTracking';
import { TimeTrackingStatus } from '../../../types';
import { ClockIcon, BriefcaseIcon, PauseIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

const GlobalTimerWidget: React.FC = () => {
    const { currentUser } = useAuth();
    const { status, loading: statusLoading } = useCurrentTimeStatus(currentUser?.id || '');
    const todayStr = new Date().toLocaleDateString('en-CA');
    const { entries: timeEntries } = useTimeEntries(currentUser?.id || '', todayStr, todayStr);
    const todayEntry = timeEntries[0];

    const [tick, setTick] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => setTick(t => t + 1), 1000);
        return () => clearInterval(interval);
    }, []);

    if (!currentUser || statusLoading || status.status === TimeTrackingStatus.CLOCKED_OUT) {
        return null;
    }

    // Determine what is actively running
    const activeActivity = todayEntry?.activities?.find(a => !a.endTime);
    const activeBreak = todayEntry?.breaks?.find(b => !b.endTime);

    let displayTitle = 'Clocked In';
    let icon = <ClockIcon className="w-5 h-5" />;
    let startTime = status.clockInTime;
    let bgColor = 'bg-primary';
    let pulseColor = 'bg-primary/50';

    if (activeActivity) {
        displayTitle = activeActivity.name || 'Working Task';
        icon = <BriefcaseIcon className="w-5 h-5" />;
        startTime = activeActivity.startTime instanceof Date ? activeActivity.startTime : new Date(activeActivity.startTime.seconds * 1000);
        bgColor = 'bg-accent';
        pulseColor = 'bg-accent/50';
    } else if (activeBreak || status.status === TimeTrackingStatus.ON_BREAK) {
        displayTitle = 'On Break';
        icon = <PauseIcon className="w-5 h-5" />;
        startTime = activeBreak?.startTime ? (activeBreak.startTime instanceof Date ? activeBreak.startTime : new Date(activeBreak.startTime.seconds * 1000)) : status.currentBreakStartTime;
        bgColor = 'bg-orange-500';
        pulseColor = 'bg-orange-500/50';
    }

    if (!startTime) return null;

    const diffSecs = Math.floor((Date.now() - startTime.getTime()) / 1000);
    const hours = Math.floor(diffSecs / 3600);
    const mins = Math.floor((diffSecs % 3600) / 60);
    const secs = diffSecs % 60;

    const formattedTime = `${hours > 0 ? `${hours}:` : ''}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 50, scale: 0.9 }}
                className="fixed bottom-6 right-6 z-50 flex items-center shadow-xl rounded-full pr-4 p-1.5"
                style={{ backgroundColor: 'var(--surface, #ffffff)', border: '1px solid var(--border, #e5e7eb)' }}
            >
                <div className={`relative w-10 h-10 rounded-full flex items-center justify-center text-white ${bgColor} mr-3 shadow-md`}>
                    {icon}
                    <div className={`absolute -inset-1 rounded-full animate-ping opacity-20 ${pulseColor}`} />
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider leading-tight max-w-[120px] truncate">
                        {displayTitle}
                    </span>
                    <span className={`text-lg font-black font-mono leading-tight tracking-wider ${bgColor.replace('bg-', 'text-')}`}>
                        {formattedTime}
                    </span>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default GlobalTimerWidget;
