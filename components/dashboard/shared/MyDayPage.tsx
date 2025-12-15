
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { TASKS, LEADS, formatDateTime, ATTENDANCE_DATA } from '../../../constants';
import { Task, TaskStatus, AttendanceType, UserRole, Reminder, AttendanceStatus } from '../../../types';
import TaskCard from './TaskCard';
import Card from '../../shared/Card';
import { BoltIcon, CalendarDaysIcon, BellIcon, PlusIcon, CheckCircleIcon } from '../../icons/IconComponents';
import PersonalCalendar from './PersonalCalendar';

// Define a type for the reminder with its associated lead info
interface EnrichedReminder extends Reminder {
  leadId: string;
  leadName: string;
  projectName: string;
}

const isOverdue = (date: Date) => {
    const reminderDate = new Date(date);
    const today = new Date();
    // Compare dates only, ignoring time
    reminderDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return reminderDate < today;
};

const ReminderItem: React.FC<{ reminder: EnrichedReminder, onToggle: (id: string) => void }> = ({ reminder, onToggle }) => {
    const overdue = !reminder.completed && isOverdue(reminder.date);
    return (
        <div className={`flex items-start p-3 rounded-md transition-colors ${reminder.completed ? 'bg-surface' : 'bg-subtle-background hover:bg-border'}`}>
            <input
                type="checkbox"
                checked={reminder.completed}
                onChange={() => onToggle(reminder.id)}
                className="h-5 w-5 mt-0.5 text-primary focus:ring-primary border-border rounded"
                aria-label={`Mark reminder for ${reminder.leadName} as ${reminder.completed ? 'incomplete' : 'complete'}`}
            />
            <div className="ml-3 flex-1">
                <p className={`text-sm font-medium ${reminder.completed ? 'line-through text-text-secondary' : 'text-text-primary'}`}>
                    {reminder.notes}
                </p>
                <p className={`text-xs ${reminder.completed ? 'text-text-secondary/70' : 'text-text-secondary'}`}>
                    For lead: <strong>{reminder.leadName}</strong> ({reminder.projectName})
                </p>
            </div>
            <div className="text-right ml-2">
                 <p className={`text-xs font-semibold whitespace-nowrap ${reminder.completed ? 'text-text-secondary/70' : overdue ? 'text-error' : 'text-text-secondary'}`}>
                    {formatDateTime(new Date(reminder.date))}
                </p>
            </div>
        </div>
    );
};


const MyDayPage: React.FC = () => {
    const { currentUser } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [reminders, setReminders] = useState<EnrichedReminder[]>([]);
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [newTaskTitle, setNewTaskTitle] = useState('');

    useEffect(() => {
        if (currentUser) {
            // In a real app, this would be a fetch call.
            // We clone the tasks to avoid mutating the constant.
            const userTasks = TASKS.filter(t => t.userId === currentUser.id).map(t => ({...t}));
            setTasks(userTasks);

            // Fetch reminders for Sales Team members
            if (currentUser.role === UserRole.SALES_TEAM_MEMBER) {
                const userLeads = LEADS.filter(lead => lead.assignedTo === currentUser.id);
                const allReminders: EnrichedReminder[] = userLeads.flatMap(lead => 
                    (lead.reminders || []).map(reminder => ({
                        ...reminder,
                        leadId: lead.id,
                        leadName: lead.clientName,
                        projectName: lead.projectName
                    }))
                );
                // Sort reminders: incomplete first, then by date (soonest first)
                allReminders.sort((a, b) => {
                    if (a.completed !== b.completed) {
                        return a.completed ? 1 : -1;
                    }
                    return new Date(a.date).getTime() - new Date(b.date).getTime();
                });
                setReminders(allReminders);
            } else {
                setReminders([]); // Clear reminders for other roles
            }
        }
    }, [currentUser]);

    const handleUpdateStatus = (taskId: string, newStatus: TaskStatus) => {
        setTasks(prevTasks => {
            const now = Date.now();
            return prevTasks.map(task => {
                if (task.id === taskId) {
                    const updatedTask = { ...task, status: newStatus };

                    if (newStatus === TaskStatus.IN_PROGRESS) {
                        updatedTask.startTime = now;
                        updatedTask.isPaused = false;
                    }

                    if (newStatus === TaskStatus.COMPLETED) {
                        const startTime = task.startTime || now;
                        const timeSpent = task.timeSpent + Math.floor((now - startTime) / 1000);
                        updatedTask.endTime = now;
                        updatedTask.timeSpent = timeSpent;
                        updatedTask.isPaused = true;
                    }
                    return updatedTask;
                }
                return task;
            });
        });
    };
    
    const handleToggleReminder = (reminderId: string) => {
        setReminders(prevReminders => {
            const updated = prevReminders.map(r => 
                r.id === reminderId ? { ...r, completed: !r.completed } : r
            );
            updated.sort((a, b) => {
                if (a.completed !== b.completed) {
                    return a.completed ? 1 : -1;
                }
                return new Date(a.date).getTime() - new Date(b.date).getTime();
            });
            return updated;
        });
    };

    const handleAddTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskTitle.trim() || !currentUser) return;

        const newTask: Task = {
            id: `task-${Date.now()}`,
            title: newTaskTitle,
            userId: currentUser.id,
            status: TaskStatus.PENDING,
            timeSpent: 0,
            priority: 'Medium',
            isPaused: false,
            date: selectedDate,
        };

        setTasks(prev => [...prev, newTask]);
        setNewTaskTitle('');
    };

    // Filter tasks for the selected date
    const daysTasks = useMemo(() => {
        return tasks.filter(task => task.date === selectedDate);
    }, [tasks, selectedDate]);

    // Attendance Stats
    const attendanceStats = useMemo(() => {
        if (!currentUser) return null;
        const userAttendance = ATTENDANCE_DATA[currentUser.id] || [];
        const currentMonth = new Date().getMonth();
        const monthlyData = userAttendance.filter(a => new Date(a.date).getMonth() === currentMonth);
        
        const present = monthlyData.filter(a => a.status === AttendanceStatus.PRESENT).length;
        const absent = monthlyData.filter(a => a.status === AttendanceStatus.ABSENT).length;
        const halfDay = monthlyData.filter(a => a.status === AttendanceStatus.HALF_DAY).length;
        const leave = monthlyData.filter(a => a.status === AttendanceStatus.LEAVE).length;

        return { present, absent, halfDay, leave };
    }, [currentUser]);

    const formattedDateHeader = useMemo(() => {
        const date = new Date(selectedDate);
        return date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
    }, [selectedDate]);
    
    if (!currentUser) return null;

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-subtle-background h-full overflow-y-auto">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                <div>
                    <h2 className="text-3xl font-bold text-text-primary">My Day</h2>
                    <p className="text-text-secondary">Manage your calendar and daily tasks.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Calendar & Attendance */}
                <div className="space-y-6">
                    <PersonalCalendar 
                        userId={currentUser.id} 
                        onDateSelect={setSelectedDate}
                        tasks={tasks}
                    />
                    
                    {attendanceStats && (
                        <Card>
                            <h3 className="text-lg font-bold flex items-center mb-4">
                                <CalendarDaysIcon className="w-5 h-5 mr-2 text-primary"/>
                                This Month's Attendance
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-secondary-subtle-background p-3 rounded-lg text-center">
                                    <p className="text-secondary font-bold text-2xl">{attendanceStats.present}</p>
                                    <p className="text-xs text-secondary-subtle-text uppercase font-semibold">Present</p>
                                </div>
                                <div className="bg-error-subtle-background p-3 rounded-lg text-center">
                                    <p className="text-error font-bold text-2xl">{attendanceStats.absent}</p>
                                    <p className="text-xs text-error-subtle-text uppercase font-semibold">Absent</p>
                                </div>
                                <div className="bg-accent-subtle-background p-3 rounded-lg text-center">
                                    <p className="text-accent font-bold text-2xl">{attendanceStats.halfDay}</p>
                                    <p className="text-xs text-accent-subtle-text uppercase font-semibold">Half Day</p>
                                </div>
                                <div className="bg-purple-subtle-background p-3 rounded-lg text-center">
                                    <p className="text-purple font-bold text-2xl">{attendanceStats.leave}</p>
                                    <p className="text-xs text-purple-subtle-text uppercase font-semibold">Leave</p>
                                </div>
                            </div>
                        </Card>
                    )}
                </div>

                {/* Right Column: Task List for Selected Day */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Agenda Header */}
                    <div className="bg-surface p-6 rounded-lg border border-border shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-text-primary">Agenda</h3>
                                <p className="text-text-secondary">{formattedDateHeader}</p>
                            </div>
                            {/* Add Task Form */}
                            <form onSubmit={handleAddTask} className="flex w-full max-w-sm ml-4">
                                <input 
                                    type="text" 
                                    placeholder="Add a meeting or task..." 
                                    value={newTaskTitle}
                                    onChange={(e) => setNewTaskTitle(e.target.value)}
                                    className="flex-grow p-2 border border-border rounded-l-md bg-subtle-background focus:ring-primary focus:border-primary"
                                />
                                <button type="submit" className="bg-primary text-white px-4 py-2 rounded-r-md hover:bg-blue-700 transition-colors">
                                    <PlusIcon className="w-5 h-5"/>
                                </button>
                            </form>
                        </div>

                        <div className="space-y-4">
                            {daysTasks.length > 0 ? (
                                daysTasks.map(task => (
                                    <TaskCard key={task.id} task={task} onUpdateStatus={handleUpdateStatus} />
                                ))
                            ) : (
                                <div className="text-center py-12 border-2 border-dashed border-border rounded-lg bg-subtle-background">
                                    <CheckCircleIcon className="w-12 h-12 text-text-secondary/30 mx-auto mb-2" />
                                    <p className="text-text-secondary">No tasks scheduled for this day.</p>
                                    <p className="text-xs text-text-secondary/70">Use the input above to add one.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Reminders (Only shown if active user is Sales and viewing Today - logically reminders are 'due' based on time not just calendar date selection, but keeping it simple) */}
                    {currentUser.role === UserRole.SALES_TEAM_MEMBER && reminders.length > 0 && (
                        <Card>
                            <h3 className="text-lg font-bold flex items-center mb-4">
                                <BellIcon className="w-5 h-5 mr-2 text-primary" />
                                Upcoming Reminders
                            </h3>
                            <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                                {reminders.map(reminder => (
                                    <ReminderItem key={reminder.id} reminder={reminder} onToggle={handleToggleReminder} />
                                ))}
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MyDayPage;
