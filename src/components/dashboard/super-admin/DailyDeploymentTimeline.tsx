import React, { useMemo } from 'react';
import { TimeEntry, TimeActivity, BreakEntry } from '../../../types';
import { ClockIcon, CheckCircleIcon, PauseCircleIcon, PlayCircleIcon } from '@heroicons/react/24/outline';
import { formatDuration } from '../../../hooks/useTimeTracking';

interface DailyDeploymentTimelineProps {
    timeEntry: TimeEntry;
}

const formatTime = (date?: Date | { seconds: number }) => {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date.seconds * 1000);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
};

const getSortableTime = (date?: Date | { seconds: number }) => {
    if (!date) return 0;
    return date instanceof Date ? date.getTime() : date.seconds * 1000;
};

const DailyDeploymentTimeline: React.FC<DailyDeploymentTimelineProps> = ({ timeEntry }) => {

    // Combine activities and breaks into a single timeline
    const timelineItems = useMemo(() => {
        const items: {
            id: string;
            type: 'activity' | 'break' | 'clock-in' | 'clock-out';
            title: string;
            startTime: Date | { seconds: number };
            endTime?: Date | { seconds: number };
            duration?: string;
            details?: string;
        }[] = [];

        // Clock In
        if (timeEntry.clockIn) {
            items.push({
                id: 'clock-in',
                type: 'clock-in',
                title: 'Clocked In',
                startTime: timeEntry.clockIn,
                details: formatTime(timeEntry.clockIn)
            });
        }

        // Breaks
        (timeEntry.breaks || []).forEach(b => {
            // Calculate duration manually if needed
            let dur = 0;
            const start = b.startTime instanceof Date ? b.startTime : new Date((b.startTime as any).seconds * 1000);
            if (b.endTime) {
                const end = b.endTime instanceof Date ? b.endTime : new Date((b.endTime as any).seconds * 1000);
                dur = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
            }

            items.push({
                id: b.id,
                type: 'break',
                title: 'Break Taken',
                startTime: b.startTime,
                endTime: b.endTime,
                duration: dur > 0 ? formatDuration(dur) : 'Ongoing'
            });
        });

        // Activities
        (timeEntry.activities || []).forEach(a => {
            let dur = 0;
            const start = a.startTime instanceof Date ? a.startTime : new Date((a.startTime as any).seconds * 1000);
            if (a.endTime) {
                const end = a.endTime instanceof Date ? a.endTime : new Date((a.endTime as any).seconds * 1000);
                dur = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
            }

            items.push({
                id: a.id,
                type: 'activity',
                title: a.name,
                startTime: a.startTime,
                endTime: a.endTime,
                duration: dur > 0 ? formatDuration(dur) : 'In Progress',
                details: (a.tags || []).join(', ')
            });
        });

        // Clock Out
        if (timeEntry.clockOut) {
            items.push({
                id: 'clock-out',
                type: 'clock-out',
                title: 'Clocked Out',
                startTime: timeEntry.clockOut,
                details: formatTime(timeEntry.clockOut)
            });
        }

        return items.sort((a, b) => getSortableTime(a.startTime) - getSortableTime(b.startTime));
    }, [timeEntry]);

    if (!timeEntry) return <div className="text-center py-8 text-gray-500">No data available for this date.</div>;

    return (
        <div className="relative border-l-2 border-dashed border-gray-200 dark:border-gray-700 ml-4 space-y-8 py-4">
            {timelineItems.map((item, index) => {
                const getIcon = () => {
                    switch (item.type) {
                        case 'clock-in': return <PlayCircleIcon className="w-5 h-5 text-green-600" />;
                        case 'clock-out': return <CheckCircleIcon className="w-5 h-5 text-gray-600" />;
                        case 'break': return <PauseCircleIcon className="w-5 h-5 text-orange-500" />;
                        default: return <ClockIcon className="w-5 h-5 text-primary" />;
                    }
                };

                const getBgColor = () => {
                    switch (item.type) {
                        case 'clock-in': return 'bg-green-100 dark:bg-green-900/20 border-green-200';
                        case 'clock-out': return 'bg-gray-100 dark:bg-gray-800 border-gray-200';
                        case 'break': return 'bg-orange-50 dark:bg-orange-900/10 border-orange-200';
                        default: return 'bg-primary/5 border-primary/10 hover:border-primary/30';
                    }
                };

                return (
                    <div key={item.id} className="relative pl-8 group">
                        {/* Timeline Node */}
                        <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 bg-white dark:bg-background z-10 
                            ${item.type === 'clock-in' ? 'border-green-500' :
                                item.type === 'clock-out' ? 'border-gray-500' :
                                    item.type === 'break' ? 'border-orange-400' : 'border-primary'}`}
                        />

                        <div className={`p-4 rounded-xl border transition-all ${getBgColor()}`}>
                            <div className="flex justify-between items-start mb-1">
                                <div className="flex items-center gap-2">
                                    {getIcon()}
                                    <h4 className="font-bold text-sm text-text-primary">{item.title}</h4>
                                </div>
                                <span className="text-xs font-mono font-medium text-text-tertiary">
                                    {formatTime(item.startTime)}
                                    {item.endTime && ` - ${formatTime(item.endTime)}`}
                                </span>
                            </div>

                            {(item.duration || item.details) && (
                                <div className="pl-7 text-xs text-text-secondary flex gap-3">
                                    {item.duration && <span className="font-semibold">{item.duration}</span>}
                                    {item.details && <span>• {item.details}</span>}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default DailyDeploymentTimeline;
