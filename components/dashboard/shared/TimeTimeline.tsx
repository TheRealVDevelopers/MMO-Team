import React, { useState, useEffect } from 'react';
import { TimeEntry, TimeTrackingStatus, TimeActivity } from '../../../types';
import { PlayIcon, StopIcon, PauseIcon, ClockIcon, BriefcaseIcon, TagIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { useAuth } from '../../../context/AuthContext';
import { clockIn, clockOut, startBreak, endBreak } from '../../../hooks/useTimeTracking';
import { doc, updateDoc, serverTimestamp, Timestamp, getDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { ContentCard, PrimaryButton, SecondaryButton, cn } from './DashboardUI';

interface TimeTimelineProps {
    timeEntry?: TimeEntry;
    onRefresh?: () => void;
}

const TimeTimeline: React.FC<TimeTimelineProps> = ({ timeEntry, onRefresh }) => {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [newActivityName, setNewActivityName] = useState('');
    const [isAddingActivity, setIsAddingActivity] = useState(false);

    // Helper to get active activity
    const activeActivity = timeEntry?.activities?.find(a => !a.endTime);
    const activeBreak = timeEntry?.breaks?.find(b => !b.endTime);

    // Live timer tick
    const [tick, setTick] = useState(0);
    useEffect(() => {
        if (activeActivity || activeBreak || timeEntry?.clockIn && !timeEntry.clockOut) {
            const interval = setInterval(() => setTick(t => t + 1), 60000); // Update every minute
            return () => clearInterval(interval);
        }
    }, [activeActivity, activeBreak, timeEntry]);

    const handleClockIn = async () => {
        if (!currentUser) return;
        setLoading(true);
        try {
            await clockIn(currentUser.id, currentUser.name, (currentUser as any).organizationId);
            onRefresh?.();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleClockOut = async () => {
        if (!timeEntry) return;
        setLoading(true);
        try {
            // Auto-end active activity if any
            if (activeActivity) {
                await handleEndActivity(activeActivity);
            }
            // Auto-end active break if any
            if (activeBreak) {
                await endBreak(timeEntry.id);
            }
            await clockOut(timeEntry.id);
            onRefresh?.();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleStartBreak = async () => {
        if (!timeEntry) return;
        setLoading(true);
        try {
            if (activeActivity) {
                await handleEndActivity(activeActivity);
            }
            await startBreak(timeEntry.id);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleEndBreak = async () => {
        if (!timeEntry) return;
        setLoading(true);
        try {
            await endBreak(timeEntry.id);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleStartActivity = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!timeEntry || !newActivityName.trim()) return;

        setLoading(true);
        try {
            // End current activity if exists
            // Note: We need to reimplement this logic inside the component or a hook, 
            // but for now I'll use direct firestore here to save time on hook complexity
            const entryRef = doc(db, 'timeEntries', timeEntry.id);
            const docSnap = await getDoc(entryRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                let activities = data.activities || [];

                // Check/End active
                const activeIdx = activities.findIndex((a: any) => !a.endTime);
                if (activeIdx !== -1) {
                    activities[activeIdx].endTime = new Date();
                    const start = activities[activeIdx].startTime.toDate ? activities[activeIdx].startTime.toDate() : new Date(activities[activeIdx].startTime.seconds * 1000);
                    const end = new Date();
                    activities[activeIdx].durationMinutes = Math.round((end.getTime() - start.getTime()) / 60000);
                }

                activities.push({
                    id: `act-${Date.now()}`,
                    name: newActivityName,
                    startTime: new Date(),
                });

                await updateDoc(entryRef, { activities });
            }

            setNewActivityName('');
            setIsAddingActivity(false);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleEndActivity = async (activity: TimeActivity) => {
        if (!timeEntry) return;
        setLoading(true);
        try {
            const entryRef = doc(db, 'timeEntries', timeEntry.id);
            const docSnap = await getDoc(entryRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                const activities = data.activities || [];
                const idx = activities.findIndex((a: any) => a.id === activity.id);

                if (idx !== -1) {
                    activities[idx].endTime = new Date();
                    // Calculate duration estimate for UI immediately (server timestamp is async)
                    // But we just send the update
                }
                await updateDoc(entryRef, { activities });
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (!timeEntry && !loading) {
        return (
            <ContentCard className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <div className="text-center py-8">
                    <ClockIcon className="w-16 h-16 text-primary mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-primary mb-2">Ready to Start?</h3>
                    <p className="text-text-secondary mb-6">Clock in to begin tracking your daily activity.</p>
                    <button
                        onClick={handleClockIn}
                        disabled={loading}
                        className="px-8 py-3 bg-primary text-white text-lg font-bold rounded-full shadow-lg hover:bg-secondary transition-all transform hover:scale-105"
                    >
                        Clock In
                    </button>
                </div>
            </ContentCard>
        )
    }

    // Visual Timeline Construction
    const timelineItems = [
        ...(timeEntry?.activities || []).map(a => ({ ...a, type: 'activity' })),
        ...(timeEntry?.breaks || []).map(b => ({ ...b, type: 'break', name: 'Break' }))
    ].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    return (
        <ContentCard className="flex flex-col h-full bg-surface">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-xl font-bold text-text-primary">Day Timeline</h3>
                    <p className="text-sm text-text-secondary">
                        {timeEntry?.clockIn && `Started at ${format(timeEntry.clockIn, 'h:mm a')}`}
                    </p>
                </div>
                <div className="flex gap-2">
                    {timeEntry?.status === TimeTrackingStatus.CLOCKED_IN && !activeActivity && !activeBreak && (
                        <button
                            onClick={() => setIsAddingActivity(true)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-accent/10 text-accent rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-accent/20 transition-colors"
                        >
                            <PlayIcon className="w-4 h-4" /> Start Task
                        </button>
                    )}
                    {activeActivity && (
                        <button
                            onClick={() => handleEndActivity(activeActivity)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-secondary/10 text-secondary rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-secondary/20 transition-colors"
                        >
                            <StopIcon className="w-4 h-4" /> Stop Task
                        </button>
                    )}
                    {!activeBreak && timeEntry?.status !== TimeTrackingStatus.CLOCKED_OUT && (
                        <button
                            onClick={handleStartBreak}
                            className="flex items-center gap-1 px-3 py-1.5 bg-orange-100 text-orange-600 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-orange-200 transition-colors"
                        >
                            <PauseIcon className="w-4 h-4" /> Take Break
                        </button>
                    )}
                    {activeBreak && (
                        <button
                            onClick={handleEndBreak}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-600 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-green-200 transition-colors"
                        >
                            <PlayIcon className="w-4 h-4" /> Resume Work
                        </button>
                    )}
                    {timeEntry?.status !== TimeTrackingStatus.CLOCKED_OUT && (
                        <button
                            onClick={handleClockOut}
                            className="flex items-center gap-1 px-3 py-1.5 bg-error/10 text-error rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-error/20 transition-colors"
                        >
                            Clock Out
                        </button>
                    )}
                </div>
            </div>

            {/* New Activity Input */}
            {isAddingActivity && (
                <form onSubmit={handleStartActivity} className="mb-6 flex gap-2 animate-fadeIn">
                    <input
                        type="text"
                        value={newActivityName}
                        onChange={e => setNewActivityName(e.target.value)}
                        placeholder="What are you working on?"
                        className="flex-1 px-4 py-2 bg-subtle-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                        autoFocus
                    />
                    <PrimaryButton type="submit" className="py-2 px-4 text-xs">Start</PrimaryButton>
                    <button
                        type="button"
                        onClick={() => setIsAddingActivity(false)}
                        className="px-4 py-2 text-text-secondary hover:text-text-primary"
                    >
                        Cancel
                    </button>
                </form>
            )}

            {/* Timeline Visualization */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border/50"></div>

                {/* Clock In Node */}
                {timeEntry?.clockIn && (
                    <div className="flex gap-4 relative">
                        <div className="w-2 h-2 rounded-full bg-primary absolute left-[13px] top-2 ring-4 ring-surface" />
                        <div className="pl-8">
                            <p className="text-xs font-bold text-primary uppercase">Clocked In</p>
                            <p className="text-xs text-text-secondary">{format(timeEntry.clockIn, 'h:mm a')}</p>
                        </div>
                    </div>
                )}

                {timelineItems.map((item: any, idx) => (
                    <div key={idx} className="flex gap-4 relative group">
                        <div className={cn(
                            "w-3 h-3 rounded-full absolute left-[11px] top-3 ring-4 ring-surface z-10",
                            item.type === 'break' ? 'bg-orange-400' : 'bg-secondary'
                        )} />

                        <div className={cn(
                            "flex-1 p-3 rounded-xl border transition-all",
                            item.type === 'break' ? 'bg-orange-50 border-orange-100' : 'bg-subtle-background border-border hover:border-primary/20',
                            !item.endTime && "border-l-4 border-l-primary animate-pulse"
                        )}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className={cn("font-bold text-sm", item.type === 'break' ? 'text-orange-700' : 'text-text-primary')}>
                                        {item.name}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <ClockIcon className="w-3 h-3 text-text-tertiary" />
                                        <span className="text-xs text-text-secondary">
                                            {format(item.startTime, 'h:mm a')} - {item.endTime ? format(item.endTime, 'h:mm a') : 'Now'}
                                        </span>
                                    </div>
                                </div>
                                {item.durationMinutes ? (
                                    <span className="text-xs font-bold text-text-tertiary bg-white/50 px-2 py-1 rounded-md">
                                        {item.durationMinutes}m
                                    </span>
                                ) : !item.endTime && (
                                    <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-md animate-pulse">
                                        {Math.round((new Date().getTime() - new Date(item.startTime).getTime()) / 60000)}m
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {/* Clock Out Node */}
                {timeEntry?.clockOut && (
                    <div className="flex gap-4 relative">
                        <div className="w-2 h-2 rounded-full bg-error absolute left-[13px] top-2 ring-4 ring-surface" />
                        <div className="pl-8">
                            <p className="text-xs font-bold text-error uppercase">Clocked Out</p>
                            <p className="text-xs text-text-secondary">{format(timeEntry.clockOut, 'h:mm a')}</p>
                        </div>
                    </div>
                )}
            </div>

        </ContentCard>
    );
};

export default TimeTimeline;
