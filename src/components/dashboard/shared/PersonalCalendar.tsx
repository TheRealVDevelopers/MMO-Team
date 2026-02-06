
import React, { useState, useMemo } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { AttendanceStatus, Task } from '../../../types';
import { ATTENDANCE_DATA } from '../../../constants';

interface PersonalCalendarProps {
    userId: string;
    onDateSelect: (date: string) => void;
    tasks: Task[];
}

const PersonalCalendar: React.FC<PersonalCalendarProps> = ({ userId, onDateSelect, tasks }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

    const monthName = currentDate.toLocaleString('default', { month: 'long' });
    const year = currentDate.getFullYear();

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const handleDateClick = (day: number) => {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        // Adjust for timezone offset to ensure correct ISO string date part
        const offset = date.getTimezoneOffset();
        const correctedDate = new Date(date.getTime() - (offset * 60 * 1000));
        const dateStr = correctedDate.toISOString().split('T')[0];
        
        setSelectedDate(dateStr);
        onDateSelect(dateStr);
    };

    // Process Attendance Data for the current month
    const attendanceMap = useMemo(() => {
        const data = ATTENDANCE_DATA[userId] || [];
        const map: Record<string, AttendanceStatus> = {};
        data.forEach(record => {
            const dateStr = new Date(record.date).toISOString().split('T')[0];
            map[dateStr] = record.status;
        });
        return map;
    }, [userId, currentDate]);

    // Process Task Indicators
    const taskMap = useMemo(() => {
        const map: Record<string, boolean> = {};
        tasks.forEach(task => {
            if (task.date) {
                map[task.date] = true;
            }
        });
        return map;
    }, [tasks]);

    const renderCalendarCells = () => {
        const cells = [];
        // Empty cells for previous month
        for (let i = 0; i < firstDayOfMonth; i++) {
            cells.push(<div key={`empty-${i}`} className="h-12 md:h-16 border border-border bg-subtle-background/50"></div>);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const offset = date.getTimezoneOffset();
            const correctedDate = new Date(date.getTime() - (offset * 60 * 1000));
            const dateStr = correctedDate.toISOString().split('T')[0];
            
            const isToday = dateStr === new Date().toISOString().split('T')[0];
            const isSelected = dateStr === selectedDate;
            const status = attendanceMap[dateStr];
            const hasTask = taskMap[dateStr];

            let bgClass = 'bg-surface';
            if (status === AttendanceStatus.PRESENT) bgClass = 'bg-secondary-subtle-background';
            else if (status === AttendanceStatus.ABSENT) bgClass = 'bg-error-subtle-background';
            else if (status === AttendanceStatus.HALF_DAY) bgClass = 'bg-accent-subtle-background';
            else if (status === AttendanceStatus.LEAVE) bgClass = 'bg-purple-subtle-background';

            cells.push(
                <div 
                    key={day} 
                    onClick={() => handleDateClick(day)}
                    className={`h-12 md:h-16 border border-border relative cursor-pointer transition-colors hover:brightness-95 ${bgClass} ${isSelected ? 'ring-2 ring-inset ring-primary' : ''}`}
                >
                    <div className={`absolute top-1 left-1 text-xs md:text-sm font-medium ${isToday ? 'bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center' : 'text-text-primary'}`}>
                        {day}
                    </div>
                    
                    {/* Attendance Status Text (Optional, maybe just color is enough) */}
                    {status && (
                        <div className="hidden md:block absolute bottom-1 right-1 text-[10px] font-medium text-text-secondary uppercase opacity-70">
                            {status}
                        </div>
                    )}

                    {/* Task Dot */}
                    {hasTask && (
                        <div className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full"></div>
                    )}
                </div>
            );
        }
        return cells;
    };

    return (
        <div className="bg-surface rounded-lg shadow border border-border overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-subtle-background border-b border-border">
                <button onClick={handlePrevMonth} className="p-1 hover:bg-surface rounded-full text-text-secondary hover:text-text-primary">
                    <ChevronLeftIcon className="w-5 h-5" />
                </button>
                <h3 className="font-bold text-text-primary">{monthName} {year}</h3>
                <button onClick={handleNextMonth} className="p-1 hover:bg-surface rounded-full text-text-secondary hover:text-text-primary">
                    <ChevronRightIcon className="w-5 h-5" />
                </button>
            </div>

            {/* Days of Week */}
            <div className="grid grid-cols-7 border-b border-border">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="py-2 text-center text-xs font-semibold text-text-secondary uppercase bg-subtle-background/30">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7">
                {renderCalendarCells()}
            </div>
            
            {/* Legend */}
            <div className="p-3 flex flex-wrap gap-3 text-xs text-text-secondary border-t border-border bg-subtle-background/30">
                <div className="flex items-center"><span className="w-3 h-3 bg-secondary-subtle-background border border-border mr-1"></span> Present</div>
                <div className="flex items-center"><span className="w-3 h-3 bg-accent-subtle-background border border-border mr-1"></span> Half Day</div>
                <div className="flex items-center"><span className="w-3 h-3 bg-purple-subtle-background border border-border mr-1"></span> Leave</div>
                <div className="flex items-center"><span className="w-3 h-3 bg-error-subtle-background border border-border mr-1"></span> Absent</div>
                <div className="flex items-center"><span className="w-2 h-2 bg-primary rounded-full mr-1"></span> Task Scheduled</div>
            </div>
        </div>
    );
};

export default PersonalCalendar;
