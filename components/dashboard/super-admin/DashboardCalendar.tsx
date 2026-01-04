import React, { useState } from 'react';
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    isSameMonth,
    isSameDay,
    addDays,
    eachDayOfInterval
} from 'date-fns';
import { ChevronLeftIcon, ChevronRightIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import { ContentCard, cn } from '../shared/DashboardUI';
import { motion, AnimatePresence } from 'framer-motion';

const DashboardCalendar: React.FC = () => {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    const renderHeader = () => {
        return (
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-border/40">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <CalendarDaysIcon className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-xl font-serif font-bold text-text-primary tracking-tight">
                            {format(currentMonth, 'MMMM yyyy')}
                        </h3>
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-tertiary">Strategic Schedule</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={prevMonth}
                        className="p-2 hover:bg-subtle-background rounded-xl text-text-secondary transition-colors"
                    >
                        <ChevronLeftIcon className="w-5 h-5" />
                    </button>
                    <button
                        onClick={nextMonth}
                        className="p-2 hover:bg-subtle-background rounded-xl text-text-secondary transition-colors"
                    >
                        <ChevronRightIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
        );
    };

    const renderDays = () => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return (
            <div className="grid grid-cols-7 mb-4">
                {days.map(day => (
                    <div key={day} className="text-center text-[10px] font-black uppercase tracking-widest text-text-tertiary">
                        {day}
                    </div>
                ))}
            </div>
        );
    };

    const renderCells = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);

        const calendarDays = eachDayOfInterval({
            start: startDate,
            end: endDate
        });

        return (
            <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, i) => (
                    <div
                        key={i}
                        className={cn(
                            "aspect-square p-2 rounded-xl flex flex-col items-center justify-center transition-all relative border border-transparent",
                            !isSameMonth(day, monthStart) ? "text-text-tertiary/20" : "text-text-secondary",
                            isSameDay(day, new Date()) ? "bg-primary text-white shadow-lg shadow-primary/25 border-primary" : "hover:bg-subtle-background hover:border-border/40",
                            "cursor-default"
                        )}
                    >
                        <span className="text-xs font-bold">{format(day, 'd')}</span>
                        {isSameDay(day, addDays(new Date(), 2)) && (
                            <div className="absolute bottom-1 w-1 h-1 rounded-full bg-accent" />
                        )}
                        {isSameDay(day, addDays(new Date(), -1)) && (
                            <div className="absolute bottom-1 w-1 h-1 rounded-full bg-error" />
                        )}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <ContentCard className="h-full">
            {renderHeader()}
            {renderDays()}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentMonth.toISOString()}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    {renderCells()}
                </motion.div>
            </AnimatePresence>
        </ContentCard>
    );
};

export default DashboardCalendar;
