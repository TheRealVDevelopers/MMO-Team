import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { format, differenceInDays, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { GanttTask } from '../../../types';

interface GanttChartProps {
    tasks: GanttTask[];
    onTaskClick?: (task: GanttTask) => void;
}

const CELL_WIDTH = 40;
const HEADER_HEIGHT = 60;
const ROW_HEIGHT = 40;

const GanttChart: React.FC<GanttChartProps> = ({ tasks, onTaskClick }) => {
    // Determine timeline range
    const range = useMemo(() => {
        if (!tasks.length) return { start: new Date(), end: new Date(), days: [] };

        const startDates = tasks.map(t => new Date(t.start));
        const endDates = tasks.map(t => new Date(t.end));

        const minDate = new Date(Math.min(...startDates.map(d => d.getTime())));
        const maxDate = new Date(Math.max(...endDates.map(d => d.getTime())));

        // Add padding (10 days before and after)
        const start = addDays(minDate, -5);
        const end = addDays(maxDate, 10);

        const days = eachDayOfInterval({ start, end });
        return { start, end, days };
    }, [tasks]);

    const getTaskStyle = (task: GanttTask) => {
        const startDate = new Date(task.start);
        const endDate = new Date(task.end);

        const offsetDays = differenceInDays(startDate, range.start);
        const durationDays = differenceInDays(endDate, startDate) + 1;

        return {
            left: offsetDays * CELL_WIDTH,
            width: durationDays * CELL_WIDTH,
        };
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
            {/* Scrollable Container */}
            <div className="flex-1 overflow-auto relative">
                <div style={{ width: range.days.length * CELL_WIDTH, minWidth: '100%' }}>

                    {/* Header: Months & Days */}
                    <div className="sticky top-0 z-20 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-gray-700 h-[60px]">
                        <div className="relative h-full">
                            {/* Months (Simplified for now - just showing days) */}
                            <div className="flex border-b border-gray-100 dark:border-gray-700 h-8">
                                {range.days.map((day, i) => {
                                    const isFirstDay = day.getDate() === 1 || i === 0;
                                    return isFirstDay ? (
                                        <div key={`month-${i}`} className="px-2 text-xs font-semibold text-gray-500 absolute" style={{ left: i * CELL_WIDTH }}>
                                            {format(day, 'MMMM yyyy')}
                                        </div>
                                    ) : null;
                                })}
                            </div>

                            {/* Days */}
                            <div className="flex h-7">
                                {range.days.map((day, i) => (
                                    <div
                                        key={`day-${i}`}
                                        className={`w-[40px] flex items-center justify-center text-xs border-r border-gray-100 dark:border-gray-700
                                            ${[0, 6].includes(day.getDay()) ? 'bg-gray-50 dark:bg-slate-700/30' : ''}
                                            ${isSameDay(day, new Date()) ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 font-bold' : 'text-gray-400'}
                                        `}
                                    >
                                        {format(day, 'd')}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Grid Lines & Current Time Indicator */}
                    <div className="absolute inset-0 top-[60px] z-0 pointer-events-none flex">
                        {range.days.map((day, i) => (
                            <div
                                key={`grid-${i}`}
                                className={`w-[40px] h-full border-r border-gray-100 dark:border-gray-700 
                                    ${[0, 6].includes(day.getDay()) ? 'bg-gray-50/50 dark:bg-slate-700/10' : ''}
                                `}
                            />
                        ))}
                        {/* Today Line */}
                        {range.days.some(d => isSameDay(d, new Date())) && (
                            <div
                                className="absolute top-0 bottom-0 border-l-2 border-blue-500 z-10 opacity-50 dashed"
                                style={{ left: differenceInDays(new Date(), range.start) * CELL_WIDTH + (CELL_WIDTH / 2) }}
                            />
                        )}
                    </div>

                    {/* Tasks Rows */}
                    <div className="relative z-10 py-4 space-y-4">
                        {tasks.map((task) => {
                            const style = getTaskStyle(task);
                            const isDelayed = task.status === 'Delayed';
                            const isCompleted = task.status === 'Completed';

                            return (
                                <motion.div
                                    key={task.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="relative h-8 group"
                                    onClick={() => onTaskClick?.(task)}
                                >
                                    {/* Task Bar */}
                                    <div
                                        className={`absolute h-6 top-1 rounded-md shadow-sm border border-black/10 cursor-pointer overflow-hidden
                                            ${isDelayed ? 'bg-red-400' : isCompleted ? 'bg-green-500' : 'bg-blue-500'}
                                        `}
                                        style={{
                                            left: style.left,
                                            width: style.width
                                        }}
                                    >
                                        {/* Progress Fill */}
                                        <div
                                            className="h-full bg-white/20"
                                            style={{ width: `${task.progress}%` }}
                                        />

                                        {/* Label */}
                                        <div className="absolute inset-0 flex items-center px-2 text-xs font-medium text-white whitespace-nowrap overflow-hidden">
                                            {task.name}
                                        </div>
                                    </div>

                                    {/* Task Info Tooltip (on hover) */}
                                    <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bottom-full left-0 mb-2 z-50 bg-gray-900 text-white text-xs p-2 rounded whitespace-nowrap pointer-events-none" style={{ left: style.left }}>
                                        {task.name} ({task.progress}%)
                                        <div className="text-gray-400 text-[10px]">
                                            {format(new Date(task.start), 'MMM d')} - {format(new Date(task.end), 'MMM d')}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GanttChart;
