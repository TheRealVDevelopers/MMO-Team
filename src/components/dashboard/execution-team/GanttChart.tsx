import React, { useMemo, useState, useRef } from 'react';
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
const MIN_CELL_WIDTH = 20;
const MAX_CELL_WIDTH = 100;

const isValidDate = (date: any): boolean => {
    return date instanceof Date && !isNaN(date.getTime());
};

const GanttChart: React.FC<GanttChartProps> = ({ tasks, onTaskClick }) => {
    console.log('📊 [GanttChart] Rendering with tasks:', {
        taskCount: tasks?.length || 0,
        tasks: tasks?.map(t => ({ 
            id: t.id, 
            name: t.name, 
            start: t.start, 
            end: t.end,
            status: t.status,
            progress: t.progress
        }))
    });

    // Zoom & Pan state/handlers
    const [cellWidth, setCellWidth] = useState(CELL_WIDTH);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartX, setDragStartX] = useState<number | null>(null);
    const [scrollStartLeft, setScrollStartLeft] = useState<number>(0);

    const handleZoom = (direction: 'in' | 'out' | 'reset' = 'in') => {
        setCellWidth(prev => direction === 'reset'
            ? CELL_WIDTH
            : Math.min(MAX_CELL_WIDTH, Math.max(MIN_CELL_WIDTH, prev + (direction === 'in' ? 10 : -10))));
    };

    const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        setIsDragging(true);
        setDragStartX(e.clientX);
        setScrollStartLeft(scrollRef.current?.scrollLeft || 0);
    };

    const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isDragging || dragStartX === null || !scrollRef.current) return;
        const delta = e.clientX - dragStartX;
        scrollRef.current.scrollLeft = scrollStartLeft - delta;
    };

    const endDrag = () => {
        setIsDragging(false);
        setDragStartX(null);
    };

    const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
        if (e.ctrlKey) {
            e.preventDefault();
            const direction = e.deltaY < 0 ? 'in' : 'out';
            handleZoom(direction);
        }
    };

    // ✅ Show empty state if no tasks
    if (!tasks || tasks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-surface rounded-xl border border-border p-12 text-center">
                <div className="w-16 h-16 bg-subtle-background rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </div>
                <h3 className="text-lg font-bold text-text-primary mb-2">No Tasks Yet</h3>
                <p className="text-sm text-text-secondary max-w-md">
                    Tasks configured in the "Edit & Configure" modal will appear here.
                    You can also add tasks using the "Add Task" button above.
                </p>
            </div>
        );
    }

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
            left: offsetDays * cellWidth,
            width: durationDays * cellWidth,
        };
    };

    return (
        <div className="flex flex-col h-full bg-surface rounded-xl overflow-hidden border border-border relative">
            {/* Zoom Controls */}
            <div className="absolute right-4 top-4 z-30 flex items-center gap-2 bg-surface/80 backdrop-blur px-2 py-1 rounded border border-border">
                <button onClick={() => handleZoom('out')} className="px-2 py-1 rounded bg-subtle-background hover:bg-subtle-background/80 border border-border text-sm">−</button>
                <button onClick={() => handleZoom('in')} className="px-2 py-1 rounded bg-subtle-background hover:bg-subtle-background/80 border border-border text-sm">+</button>
                <span className="text-xs text-text-secondary">{Math.round((cellWidth / CELL_WIDTH) * 100)}%</span>
                <button onClick={() => handleZoom('reset')} className="px-2 py-1 rounded bg-subtle-background hover:bg-subtle-background/80 border border-border text-xs">Reset</button>
            </div>
            {/* Scrollable Container */}
            <div
                ref={scrollRef}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={endDrag}
                onMouseLeave={endDrag}
                onWheel={onWheel}
                className="flex-1 overflow-auto relative select-none"
                style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
            >
                <div style={{ width: range.days.length * cellWidth, minWidth: '100%' }}>

                    {/* Header: Months & Days */}
                    <div className="sticky top-0 z-20 bg-surface border-b border-border h-[60px]">
                        <div className="relative h-full">
                            {/* Months (Simplified for now - just showing days) */}
                            <div className="flex border-b border-border/50 h-8">
                                {range.days.map((day, i) => {
                                    const isFirstDay = day.getDate() === 1 || i === 0;
                                    return isFirstDay ? (
                                        <div key={`month-${i}`} className="px-2 text-xs font-semibold text-text-secondary absolute" style={{ left: i * cellWidth }}>
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
                                        className={`${[0, 6].includes(day.getDay()) ? 'bg-subtle-background/50' : ''} ${isSameDay(day, new Date()) ? 'bg-primary/10 text-primary font-bold' : 'text-text-tertiary'} flex items-center justify-center text-xs border-r border-border/50`}
                                        style={{ width: cellWidth }}
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
                                className={`${[0, 6].includes(day.getDay()) ? 'bg-subtle-background/30' : ''} h-full border-r border-border/30`}
                                style={{ width: cellWidth }}
                            />
                        ))}
                        {/* Today Line */}
                        {range.days.some(d => isSameDay(d, new Date())) && (
                            <div
                                className="absolute top-0 bottom-0 border-l-2 border-primary z-10 opacity-50 dashed"
                                style={{ left: differenceInDays(new Date(), range.start) * cellWidth + (cellWidth / 2) }}
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
                                            ${isDelayed ? 'bg-error' : isCompleted ? 'bg-success' : 'bg-primary'}
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
                                    <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bottom-full left-0 mb-2 z-50 bg-surface-inverse text-text-inverse text-xs p-2 rounded whitespace-nowrap pointer-events-none" style={{ left: style.left }}>
                                        {task.name} ({task.progress}%)
                                        <div className="text-text-inverse/70 text-[10px]">
                                            {isValidDate(new Date(task.start)) ? format(new Date(task.start), 'MMM d') : 'N/A'} - {isValidDate(new Date(task.end)) ? format(new Date(task.end), 'MMM d') : 'N/A'}
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
