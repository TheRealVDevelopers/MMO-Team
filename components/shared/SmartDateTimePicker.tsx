
import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    isToday,
    parseISO,
    isValid
} from 'date-fns';
import {
    ChevronLeftIcon,
    ChevronRightIcon,
    CalendarIcon,
    ClockIcon,
    CheckCircleIcon
} from '../icons/IconComponents';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../dashboard/shared/DashboardUI';
import { createPortal } from 'react-dom';

interface SmartDateTimePickerProps {
    value: string; // ISO String
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    label?: string;
    required?: boolean;
    variant?: 'default' | 'compact';
}

const SmartDateTimePicker: React.FC<SmartDateTimePickerProps> = ({
    value,
    onChange,
    placeholder = "Select Date & Time",
    className,
    label,
    required = false,
    variant = 'default'
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [view, setView] = useState<'date' | 'time'>('date');
    const containerRef = useRef<HTMLDivElement>(null);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
    const [isPositioned, setIsPositioned] = useState(false);

    // Internal state for selection
    const [tempDate, setTempDate] = useState<Date>(() => {
        const d = value ? parseISO(value) : new Date();
        return isValid(d) ? d : new Date();
    });

    const [hoveredDay, setHoveredDay] = useState<Date | null>(null);
    const [currentMonth, setCurrentMonth] = useState(tempDate);

    // Sync temp date with value when value changes externally
    useEffect(() => {
        if (value) {
            const d = parseISO(value);
            if (isValid(d)) {
                setTempDate(d);
                setCurrentMonth(d);
            }
        }
    }, [value]);

    // Handle clicking outside to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        const updatePosition = () => {
            if (containerRef.current && isOpen) {
                const rect = containerRef.current.getBoundingClientRect();
                const windowHeight = window.innerHeight;

                // Decide whether to show above or below
                const showAbove = rect.bottom + 420 > windowHeight && rect.top > 420;

                setCoords({
                    top: showAbove ? rect.top - 425 : rect.bottom + 8,
                    left: Math.max(10, Math.min(window.innerWidth - 330, rect.left)),
                    width: rect.width
                });
            }
        };

        if (isOpen) {
            updatePosition();
            document.addEventListener('mousedown', handleClickOutside);
            window.addEventListener('scroll', updatePosition, true); // Capture scroll events from any container
            window.addEventListener('resize', updatePosition);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
        }
    }, [isOpen]);

    const handleDateSelect = (day: Date) => {
        const newDate = new Date(tempDate);
        newDate.setFullYear(day.getFullYear());
        newDate.setMonth(day.getMonth());
        newDate.setDate(day.getDate());
        setTempDate(newDate);
        setView('time');
    };

    const toggleOpen = () => {
        if (!isOpen && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const windowHeight = window.innerHeight;

            // Re-calculate position immediately
            const showAbove = rect.bottom + 420 > windowHeight && rect.top > 420;

            setCoords({
                top: showAbove ? rect.top - 425 : rect.bottom + 8,
                left: Math.max(10, Math.min(window.innerWidth - 330, rect.left)),
                width: rect.width
            });
            setIsPositioned(true);
        } else if (isOpen) {
            setIsPositioned(false);
        }
        setIsOpen(!isOpen);
    };

    const handleTimeSelect = (type: 'hour' | 'minute' | 'ampm', val: any) => {
        const newDate = new Date(tempDate);
        if (type === 'hour') {
            const currentAmPm = newDate.getHours() >= 12 ? 'PM' : 'AM';
            let hour = parseInt(val);
            if (currentAmPm === 'PM' && hour < 12) hour += 12;
            if (currentAmPm === 'AM' && hour === 12) hour = 0;
            newDate.setHours(hour);
        } else if (type === 'minute') {
            newDate.setMinutes(parseInt(val));
        } else if (type === 'ampm') {
            let hour = newDate.getHours();
            if (val === 'PM' && hour < 12) hour += 12;
            if (val === 'AM' && hour >= 12) hour -= 12;
            newDate.setHours(hour);

            // AUTO-CLOSE on AM/PM selection as it's typically the final step
            finalize(newDate);
        }
        setTempDate(newDate);
    };

    const finalize = (date: Date) => {
        onChange(date.toISOString());
        setIsOpen(false);
        // Reset to date view for next time
        setTimeout(() => setView('date'), 300);
    };

    const calendarDays = useMemo(() => {
        const start = startOfWeek(startOfMonth(currentMonth));
        const end = endOfWeek(endOfMonth(currentMonth));
        return eachDayOfInterval({ start, end });
    }, [currentMonth]);

    const hours = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    const minutes = ['00', '15', '30', '45'];

    const selectedHour = tempDate.getHours() % 12 || 12;
    const selectedMinute = Math.floor(tempDate.getMinutes() / 15) * 15;
    const selectedAmPm = tempDate.getHours() >= 12 ? 'PM' : 'AM';

    return (
        <div className={cn("relative w-full", className)} ref={containerRef}>
            {label && (
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-text-tertiary px-1 mb-2">
                    {label} {required && <span className="text-primary">*</span>}
                </label>
            )}

            <div
                onClick={toggleOpen}
                className={cn(
                    "flex items-center gap-3 bg-subtle-background/30 border border-border cursor-pointer hover:border-primary/50 transition-all",
                    variant === 'compact' ? "p-2 rounded-xl" : "p-4 rounded-2xl",
                    isOpen && "ring-4 ring-primary/10 border-primary"
                )}
            >
                <div className={cn(
                    "rounded-lg bg-surface flex items-center justify-center text-primary shadow-sm",
                    variant === 'compact' ? "w-6 h-6" : "w-8 h-8"
                )}>
                    {view === 'date' ? <CalendarIcon className={variant === 'compact' ? "w-3 h-3" : "w-4 h-4"} /> : <ClockIcon className={variant === 'compact' ? "w-3 h-3" : "w-4 h-4"} />}
                </div>
                <div className="flex-1 overflow-hidden">
                    <p className={cn(
                        "font-bold truncate",
                        !value ? "text-text-tertiary" : "text-text-primary",
                        variant === 'compact' ? "text-[10px]" : "text-xs"
                    )}>
                        {value ? format(parseISO(value), 'PPP p') : placeholder}
                    </p>
                </div>
            </div>

            {createPortal(
                <AnimatePresence>
                    {isOpen && isPositioned && (
                        <motion.div
                            onMouseDown={(e) => e.stopPropagation()}
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            style={{
                                position: 'fixed',
                                top: coords.top,
                                left: coords.left,
                                width: Math.min(320, window.innerWidth - 20),
                                zIndex: 999999, // Extremely high z-index
                                pointerEvents: 'auto'
                            }}
                            className="bg-surface border border-border rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl"
                        >
                            {/* Header Tabs */}
                            <div className="flex border-b border-border bg-subtle-background/50">
                                <button
                                    onClick={() => setView('date')}
                                    className={cn(
                                        "flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all",
                                        view === 'date' ? "text-primary bg-surface" : "text-text-tertiary hover:text-text-secondary"
                                    )}
                                >
                                    Date
                                </button>
                                <button
                                    onClick={() => setView('time')}
                                    className={cn(
                                        "flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all",
                                        view === 'time' ? "text-primary bg-surface" : "text-text-tertiary hover:text-text-secondary"
                                    )}
                                >
                                    Time
                                </button>
                            </div>

                            <div className="p-4">
                                {view === 'date' ? (
                                    <motion.div
                                        initial={{ x: -20, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        className="space-y-4"
                                    >
                                        {/* Calendar Header */}
                                        <div className="flex items-center justify-between px-2">
                                            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1.5 hover:bg-subtle-background rounded-lg text-text-secondary">
                                                <ChevronLeftIcon className="w-4 h-4" />
                                            </button>
                                            <p className="text-xs font-black uppercase tracking-wider text-text-primary">
                                                {format(currentMonth, 'MMMM yyyy')}
                                            </p>
                                            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1.5 hover:bg-subtle-background rounded-lg text-text-secondary">
                                                <ChevronRightIcon className="w-4 h-4" />
                                            </button>
                                        </div>

                                        {/* Calendar Grid */}
                                        <div className="grid grid-cols-7 gap-1">
                                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, idx) => (
                                                <div key={`${d}-${idx}`} className="text-center text-[8px] font-black text-text-tertiary pb-2">{d}</div>
                                            ))}
                                            {calendarDays.map((day, i) => {
                                                const isSel = isSameDay(day, tempDate);
                                                const isT = isToday(day);
                                                const isCurrentMonth = isSameMonth(day, currentMonth);

                                                return (
                                                    <button
                                                        key={i}
                                                        onClick={() => handleDateSelect(day)}
                                                        className={cn(
                                                            "aspect-square rounded-xl flex items-center justify-center text-[10px] font-bold transition-all relative",
                                                            !isCurrentMonth ? "text-text-tertiary/20" : "text-text-secondary hover:bg-subtle-background",
                                                            isSel ? "bg-primary text-white shadow-lg shadow-primary/30" : "",
                                                            isT && !isSel && "text-primary ring-1 ring-inset ring-primary/30"
                                                        )}
                                                    >
                                                        {format(day, 'd')}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        initial={{ x: 20, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        className="space-y-6 pt-2"
                                    >
                                        {/* Hour Picker */}
                                        <div>
                                            <p className="text-[8px] font-black text-text-tertiary uppercase tracking-widest mb-3 px-1">Hour</p>
                                            <div className="grid grid-cols-4 gap-2">
                                                {hours.map(h => (
                                                    <button
                                                        key={h}
                                                        onClick={() => handleTimeSelect('hour', h)}
                                                        className={cn(
                                                            "py-2 rounded-xl text-xs font-bold border transition-all",
                                                            selectedHour === h
                                                                ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                                                                : "bg-subtle-background/30 border-border hover:border-primary/30"
                                                        )}
                                                    >
                                                        {h}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Minute Picker */}
                                        <div>
                                            <p className="text-[8px] font-black text-text-tertiary uppercase tracking-widest mb-3 px-1">Minute</p>
                                            <div className="grid grid-cols-4 gap-2">
                                                {minutes.map(m => (
                                                    <button
                                                        key={m}
                                                        onClick={() => handleTimeSelect('minute', m)}
                                                        className={cn(
                                                            "py-2 rounded-xl text-xs font-bold border transition-all",
                                                            selectedMinute === parseInt(m)
                                                                ? "bg-secondary text-white border-secondary shadow-lg shadow-secondary/20"
                                                                : "bg-subtle-background/30 border-border hover:border-secondary/30"
                                                        )}
                                                    >
                                                        :{m}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* AM/PM Picker */}
                                        <div className="flex gap-2 p-1 bg-subtle-background/50 rounded-2xl border border-border">
                                            <button
                                                onClick={() => handleTimeSelect('ampm', 'AM')}
                                                className={cn(
                                                    "flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                                                    selectedAmPm === 'AM' ? "bg-surface text-primary shadow-sm" : "text-text-tertiary hover:text-text-secondary"
                                                )}
                                            >
                                                AM
                                            </button>
                                            <button
                                                onClick={() => handleTimeSelect('ampm', 'PM')}
                                                className={cn(
                                                    "flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                                                    selectedAmPm === 'PM' ? "bg-surface text-primary shadow-sm" : "text-text-tertiary hover:text-text-secondary"
                                                )}
                                            >
                                                PM
                                            </button>
                                        </div>

                                        <p className="text-[9px] text-center text-text-tertiary italic font-medium">
                                            Selection will auto-confirm after AM/PM pick.
                                        </p>
                                    </motion.div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
};

export default SmartDateTimePicker;
