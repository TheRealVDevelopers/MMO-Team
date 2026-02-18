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
    eachDayOfInterval,
    isToday
} from 'date-fns';
import {
    ChevronLeftIcon,
    ChevronRightIcon,
    CalendarDaysIcon,
    PlusIcon,
    CheckCircleIcon,
    BellIcon,
    TrashIcon
} from '@heroicons/react/24/outline';
import { ContentCard, cn } from '../shared/DashboardUI';
import { motion, AnimatePresence } from 'framer-motion';
import { useCalendarTasks, type CalendarTask } from '../../../hooks/useCalendarTasks';
export type { CalendarTask };
import { useAuth } from '../../../context/AuthContext';

interface DashboardCalendarProps {
    className?: string;
    initialTasks?: Record<string, CalendarTask[]>;
}

const DashboardCalendar: React.FC<DashboardCalendarProps> = ({ className, initialTasks }) => {
    const { currentUser } = useAuth();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [newTask, setNewTask] = useState('');

    // Use the calendar tasks hook with Firebase persistence
    const { tasks: firebaseTasks, addTask: addTaskToFirebase, toggleTask, deleteTask: deleteTaskFromFirebase, loading } = useCalendarTasks(currentUser?.id);

    // Merge firebase (Personal Assistant) tasks with initialTasks (e.g. team case tasks) by date, dedupe by id
    const tasks = (() => {
        const allDates = new Set([
            ...Object.keys(firebaseTasks),
            ...(initialTasks ? Object.keys(initialTasks) : [])
        ]);
        const merged: Record<string, CalendarTask[]> = {};
        for (const date of allDates) {
            const fromFirebase = firebaseTasks[date] || [];
            const fromInitial = initialTasks?.[date] || [];
            const seen = new Set<string>();
            const combined: CalendarTask[] = [];
            for (const t of [...fromFirebase, ...fromInitial]) {
                if (t.id && seen.has(t.id)) continue;
                seen.add(t.id || `temp-${combined.length}`);
                combined.push(t);
            }
            merged[date] = combined;
        }
        return merged;
    })();

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    const handleDateClick = (day: Date) => {
        setSelectedDate(day);
    };

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTask.trim() || !currentUser) return;

        const dateKey = format(selectedDate, 'yyyy-MM-dd');
        const newItem: Omit<CalendarTask, 'id'> = {
            title: newTask,
            completed: false,
            type: 'task',
            date: dateKey,
            userId: currentUser.id
        };

        await addTaskToFirebase(newItem);
        setNewTask('');
    };

    const handleToggleTask = async (taskId: string) => {
        await toggleTask(taskId);
    };

    const handleDeleteTask = async (taskId: string) => {
        await deleteTaskFromFirebase(taskId);
    };

    const renderHeader = () => {
        return (
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/40">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <CalendarDaysIcon className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-xl font-serif font-bold text-text-primary tracking-tight">
                            Personal Assistant
                        </h3>
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-tertiary">
                            {format(currentMonth, 'MMMM yyyy')}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={prevMonth} className="p-2 hover:bg-subtle-background rounded-xl text-text-secondary transition-colors">
                        <ChevronLeftIcon className="w-5 h-5" />
                    </button>
                    <button onClick={nextMonth} className="p-2 hover:bg-subtle-background rounded-xl text-text-secondary transition-colors">
                        <ChevronRightIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
        );
    };

    const renderCalendar = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);
        const days = eachDayOfInterval({ start: startDate, end: endDate });

        return (
            <div className="grid grid-cols-7 gap-1">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                    <div key={`${day}-${idx}`} className="text-center text-[10px] font-black text-text-tertiary py-2">{day}</div>
                ))}
                {days.map((day, i) => {
                    const dateKey = format(day, 'yyyy-MM-dd');
                    const hasTasks = tasks[dateKey]?.length > 0;
                    const isSelected = isSameDay(day, selectedDate);

                    return (
                        <div
                            key={i}
                            onClick={() => handleDateClick(day)}
                            className={cn(
                                "aspect-square rounded-xl flex flex-col items-center justify-center transition-all relative border cursor-pointer text-xs font-medium",
                                !isSameMonth(day, monthStart) ? "text-text-tertiary/20 border-transparent" : "text-text-secondary border-transparent",
                                isSelected ? "bg-primary text-white shadow-lg shadow-primary/25 border-primary" : "hover:bg-subtle-background hover:border-border/40",
                                isToday(day) && !isSelected && "text-primary font-bold bg-primary/5"
                            )}
                        >
                            <span>{format(day, 'd')}</span>
                            {hasTasks && !isSelected && (
                                <div className="absolute bottom-1.5 w-1 h-1 rounded-full bg-accent" />
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderAgenda = () => {
        const dateKey = format(selectedDate, 'yyyy-MM-dd');
        const daysTasks = tasks[dateKey] || [];
        const isTodaySelected = isToday(selectedDate);

        return (
            <div className="flex flex-col h-full border-l border-border/40 pl-6 ml-6">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h4 className="text-sm font-bold text-text-primary mb-1">
                            {isTodaySelected ? "Today's Agenda" : format(selectedDate, 'EEEE, MMM do')}
                        </h4>
                        <p className="text-xs text-text-tertiary">
                            {daysTasks.length} {daysTasks.length === 1 ? 'item' : 'items'} scheduled
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            const input = document.getElementById('quick-add-input');
                            input?.focus();
                        }}
                        className="p-2 bg-primary/10 text-primary rounded-xl hover:bg-primary hover:text-white transition-all shadow-sm"
                        title="Add Task for this date"
                    >
                        <PlusIcon className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                    {daysTasks.length === 0 ? (
                        <div className="text-center py-8 opacity-50">
                            <BellIcon className="w-8 h-8 mx-auto mb-2 text-text-tertiary" />
                            <p className="text-xs text-text-tertiary italic">Nothing planned yet.</p>
                        </div>
                    ) : (
                        daysTasks.map(task => (
                            <motion.div
                                layout
                                key={task.id}
                                className={cn(
                                    "p-3 rounded-xl border flex items-start gap-3 group relative transition-all",
                                    task.completed ? "bg-subtle-background border-transparent opacity-60" : "bg-surface border-border hover:border-primary/30 hover:shadow-sm"
                                )}
                            >
                                <button
                                    onClick={() => handleToggleTask(task.id)}
                                    className={cn(
                                        "mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors",
                                        task.completed ? "bg-emerald-500 border-emerald-500 text-white" : "border-text-tertiary hover:border-primary"
                                    )}
                                >
                                    {task.completed && <CheckCircleIcon className="w-3 h-3" />}
                                </button>
                                <div className="flex-1 min-w-0">
                                    <p className={cn("text-xs font-medium truncate", task.completed ? "line-through text-text-tertiary" : "text-text-primary")}>
                                        {task.title}
                                    </p>
                                    {task.time && (
                                        <p className="text-[10px] text-text-tertiary mt-0.5">{task.time}</p>
                                    )}
                                </div>
                                <button
                                    onClick={() => handleDeleteTask(task.id)}
                                    className="opacity-0 group-hover:opacity-100 p-1 text-text-tertiary hover:text-error transition-all"
                                >
                                    <TrashIcon className="w-3.5 h-3.5" />
                                </button>
                            </motion.div>
                        ))
                    )}
                </div>

                <form onSubmit={handleAddTask} className="mt-4 pt-4 border-t border-border/40">
                    <div className="relative">
                        <input
                            id="quick-add-input"
                            type="text"
                            value={newTask}
                            onChange={(e) => setNewTask(e.target.value)}
                            placeholder={`Remind me to... on ${format(selectedDate, 'MMM do')}`}
                            className="w-full bg-subtle-background border-none rounded-xl py-2.5 pl-3 pr-10 text-xs text-text-primary focus:ring-1 focus:ring-primary placeholder:text-text-tertiary/50"
                        />
                        <button
                            type="submit"
                            disabled={!newTask.trim()}
                            className="absolute right-1.5 top-1.5 p-1 bg-primary text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-hover transition-colors"
                        >
                            <PlusIcon className="w-4 h-4" />
                        </button>
                    </div>
                </form>
            </div>
        );
    };

    return (
        <ContentCard className={cn(className)}>
            {renderHeader()}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="pr-1">
                    {renderCalendar()}
                </div>
                {renderAgenda()}
            </div>
        </ContentCard>
    );
};

export default DashboardCalendar;
