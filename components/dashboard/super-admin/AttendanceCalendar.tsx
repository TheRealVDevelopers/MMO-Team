import React from 'react';
import { Attendance, AttendanceStatus } from '../../../types';

const statusColors: Record<AttendanceStatus, { bg: string, text: string }> = {
    [AttendanceStatus.PRESENT]: { bg: 'bg-secondary/20', text: 'text-secondary' },
    [AttendanceStatus.ABSENT]: { bg: 'bg-error/20', text: 'text-error' },
    [AttendanceStatus.HALF_DAY]: { bg: 'bg-accent/20', text: 'text-accent' },
    [AttendanceStatus.LEAVE]: { bg: 'bg-primary/20', text: 'text-primary' },
};

const AttendanceCalendar: React.FC<{ attendanceData: Attendance[] }> = ({ attendanceData }) => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 for Sunday, 1 for Monday, etc.

    const calendarDays = [];
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
        calendarDays.push(<div key={`empty-${i}`} className="border border-border bg-subtle-background"></div>);
    }

    // Fix: Explicitly type the Map to ensure correct type inference.
    const attendanceMap = new Map<number, AttendanceStatus>(attendanceData.map(a => [new Date(a.date).getDate(), a.status]));

    for (let day = 1; day <= daysInMonth; day++) {
        const status = attendanceMap.get(day);
        const date = new Date(year, month, day);
        const dayOfWeek = date.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        let dayClass = "p-2 text-center text-sm border border-border";
        if (isWeekend) {
            dayClass += " bg-slate-100 text-text-secondary";
        } else if (status) {
            dayClass += ` ${statusColors[status].bg} ${statusColors[status].text} font-semibold`;
        }

        calendarDays.push(
            <div key={day} className={dayClass}>
                <div className="font-bold">{day}</div>
                {!isWeekend && <div className="text-xs mt-1">{status || '-'}</div>}
            </div>
        );
    }
    
    // Summary Calculation
    const summary = attendanceData.reduce((acc: Record<AttendanceStatus, number>, curr) => {
        acc[curr.status] = (acc[curr.status] || 0) + 1;
        return acc;
    }, {} as Record<AttendanceStatus, number>);

    return (
        <div className="space-y-4">
            <div>
                <h4 className="font-bold text-text-primary">Attendance for {today.toLocaleString('default', { month: 'long', year: 'numeric' })}</h4>
            </div>
            <div className="grid grid-cols-7 text-xs font-bold text-center text-text-secondary border-b border-border pb-2">
                <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
            </div>
            <div className="grid grid-cols-7 gap-1">
                {calendarDays}
            </div>
            <div className="flex flex-wrap gap-4 pt-4 border-t border-border text-sm">
                {Object.values(AttendanceStatus).map((status: AttendanceStatus) => {
                    const colors = statusColors[status];
                    return (
                        <div key={status} className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded ${colors.bg}`}></div>
                            <span>{status}: <strong>{summary[status] || 0}</strong></span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AttendanceCalendar;
