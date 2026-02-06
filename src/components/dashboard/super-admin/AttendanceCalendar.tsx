import React, { useMemo } from 'react';
import { Attendance, AttendanceStatus } from '../../../types';
import { cn } from '../shared/DashboardUI';
import { motion } from 'framer-motion';
import { CalendarIcon } from '@heroicons/react/24/outline'; // Missing import

const statusConfig: Record<AttendanceStatus, { bg: string, text: string, dot: string }> = {
    [AttendanceStatus.PRESENT]: { bg: 'bg-emerald-500/10', text: 'text-emerald-600', dot: 'bg-emerald-500' },
    [AttendanceStatus.ABSENT]: { bg: 'bg-rose-500/10', text: 'text-rose-600', dot: 'bg-rose-500' },
    [AttendanceStatus.HALF_DAY]: { bg: 'bg-amber-500/10', text: 'text-amber-600', dot: 'bg-amber-500' },
    [AttendanceStatus.LEAVE]: { bg: 'bg-blue-500/10', text: 'text-blue-600', dot: 'bg-blue-500' },
};

interface AttendanceCalendarProps {
    attendanceData: Attendance[];
    onDateClick?: (date: string) => void;
}

const AttendanceCalendar: React.FC<AttendanceCalendarProps> = ({ attendanceData, onDateClick }) => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();

    const attendanceMap = useMemo(() =>
        new Map<number, Attendance>(attendanceData.map(a => [new Date(a.date).getDate(), a])),
        [attendanceData]);

    const summary = useMemo(() =>
        attendanceData.reduce((acc, curr) => {
            acc[curr.status] = (acc[curr.status] || 0) + 1;
            return acc;
        }, {} as Record<AttendanceStatus, number>),
        [attendanceData]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-black uppercase tracking-widest text-text-tertiary flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-primary" />
                    Presence Log: {today.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h4>
            </div>

            <div className="bg-subtle-background/30 rounded-3xl p-6 border border-border/40">
                <div className="grid grid-cols-7 mb-4">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="text-[10px] font-black uppercase tracking-widest text-text-tertiary text-center pb-2">
                            {day}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                        <div key={`empty-${i}`} className="aspect-square rounded-xl bg-transparent border border-transparent" />
                    ))}

                    {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1;
                        const record = attendanceMap.get(day);
                        const status = record?.status;
                        const date = new Date(year, month, day);
                        const dateString = date.toLocaleDateString('en-CA');
                        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                        const isToday = day === today.getDate();
                        const config = status ? statusConfig[status] : null;

                        return (
                            <motion.button
                                key={day}
                                onClick={() => onDateClick?.(dateString)}
                                whileHover={{ scale: 1.05 }}
                                className={cn(
                                    "aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all border group w-full",
                                    isToday ? "ring-2 ring-primary ring-offset-2 ring-offset-surface" : "",
                                    isWeekend ? "bg-subtle-background/50 border-border/20 opacity-40" : "bg-surface border-border shadow-sm",
                                    config ? cn(config.bg, "border-transparent shadow-none") : "hover:bg-primary/5 hover:border-primary/30"
                                )}
                            >
                                <span className={cn(
                                    "text-xs font-bold",
                                    config ? config.text : "text-text-primary",
                                    isWeekend ? "text-text-tertiary" : ""
                                )}>
                                    {day}
                                </span>
                                {config && (
                                    <div className={cn("w-1 h-1 rounded-full mt-1", config.dot)} />
                                )}

                                {/* Hover Tooltip for Times */}
                                {(record?.clockIn || record?.clockOut) && (
                                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-max px-2 py-1 bg-surface border border-border/60 shadow-lg rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                                        <div className="flex flex-col gap-0.5 text-[9px] font-bold text-text-secondary leading-tight">
                                            {record.clockIn && (
                                                <span className="text-emerald-500">In: {record.clockIn}</span>
                                            )}
                                            {record.clockOut && (
                                                <span className="text-error">Out: {record.clockOut}</span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {Object.values(AttendanceStatus).map((status) => {
                    const config = statusConfig[status];
                    const count = summary[status] || 0;
                    return (
                        <div key={status} className="flex items-center gap-3 p-3 rounded-2xl bg-surface border border-border/60 shadow-sm">
                            <div className={cn("w-2 h-2 rounded-full", config.dot)} />
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-black uppercase tracking-widest text-text-tertiary leading-none mb-1">{status}</p>
                                <p className="text-sm font-bold text-text-primary leading-none">{count}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AttendanceCalendar;
