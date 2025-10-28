import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { TASKS, LEADS, formatDateTime } from '../../../constants';
import { Task, TaskStatus, DailyAttendance, AttendanceType, UserRole, Lead, Reminder } from '../../../types';
import TaskCard from './TaskCard';
import Card from '../../shared/Card';
import { BoltIcon, CalendarDaysIcon, BellIcon } from '../../icons/IconComponents';

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
    const [attendance, setAttendance] = useState<DailyAttendance | null>(null);
    const [reminders, setReminders] = useState<EnrichedReminder[]>([]);

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
            
            // Reset attendance on user change
            setAttendance(null); 
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
                        checkAndSetAttendance(now);
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
            // Re-sort after toggling
            updated.sort((a, b) => {
                if (a.completed !== b.completed) {
                    return a.completed ? 1 : -1;
                }
                return new Date(a.date).getTime() - new Date(b.date).getTime();
            });
            return updated;
        });
    };

    const checkAndSetAttendance = (startTime: number) => {
        if (attendance) return; // Already checked in for the day

        const checkInTime = new Date(startTime);
        const todayStr = checkInTime.toISOString().split('T')[0];
        const shiftStart = new Date(todayStr);
        shiftStart.setHours(9, 0, 0, 0); // 9 AM shift start

        const hoursLate = (checkInTime.getTime() - shiftStart.getTime()) / (1000 * 60 * 60);

        let status: AttendanceType;
        if (hoursLate <= 1) status = AttendanceType.ON_TIME;
        else if (hoursLate <= 2) status = AttendanceType.LATE;
        else status = AttendanceType.HALF_DAY;

        setAttendance({
            userId: currentUser!.id,
            date: todayStr,
            checkInTime: startTime,
            status: status
        });
    };

    const { pending, inProgress, completed } = useMemo(() => {
        return tasks.reduce((acc, task) => {
            if (task.status === TaskStatus.PENDING) {
                acc.pending.push(task);
            } else if (task.status === TaskStatus.IN_PROGRESS) {
                acc.inProgress.push(task);
            } else if (task.status === TaskStatus.COMPLETED) {
                acc.completed.push(task);
            }
            return acc;
        }, { pending: [], inProgress: [], completed: [] } as { pending: Task[], inProgress: Task[], completed: Task[] });
    }, [tasks]);

    const productivityScore = tasks.length > 0 ? (completed.length / tasks.length) * 100 : 0;
    
    if (!currentUser) return null;

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-subtle-background h-full overflow-y-auto">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                <div>
                    <h2 className="text-3xl font-bold text-text-primary">My Day</h2>
                    <p className="text-text-secondary">Here are your tasks for today. Let's get things done!</p>
                </div>
                <div className="flex gap-4">
                    {attendance && (
                        <Card className="p-3 text-center">
                            <div className="flex items-center gap-2">
                                <CalendarDaysIcon className="w-6 h-6 text-primary"/>
                                <div>
                                    <p className="text-xs font-bold text-text-secondary">ATTENDANCE</p>
                                    <p className="text-sm font-bold text-primary">{attendance.status}</p>
                                </div>
                            </div>
                        </Card>
                    )}
                     <Card className="p-3 text-center">
                        <div className="flex items-center gap-2">
                            <BoltIcon className="w-6 h-6 text-accent"/>
                            <div>
                                <p className="text-xs font-bold text-text-secondary">PRODUCTIVITY</p>
                                <p className="text-sm font-bold text-accent">{productivityScore.toFixed(0)}%</p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
            
            {currentUser.role === UserRole.SALES_TEAM_MEMBER && reminders.length > 0 && (
                <Card className="mb-6">
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Pending */}
                <div className="space-y-4">
                    <h3 className="flex items-center text-lg font-bold"><span className="w-3 h-3 rounded-full bg-error mr-2"></span>Pending ({pending.length})</h3>
                    {pending.map(task => <TaskCard key={task.id} task={task} onUpdateStatus={handleUpdateStatus} />)}
                     {pending.length === 0 && <p className="text-sm text-center text-text-secondary pt-4">No pending tasks.</p>}
                </div>
                {/* In Progress */}
                <div className="space-y-4">
                    <h3 className="flex items-center text-lg font-bold"><span className="w-3 h-3 rounded-full bg-accent mr-2"></span>In Progress ({inProgress.length})</h3>
                     {inProgress.map(task => <TaskCard key={task.id} task={task} onUpdateStatus={handleUpdateStatus} />)}
                     {inProgress.length === 0 && <p className="text-sm text-center text-text-secondary pt-4">No tasks in progress.</p>}
                </div>
                {/* Completed */}
                <div className="space-y-4">
                    <h3 className="flex items-center text-lg font-bold"><span className="w-3 h-3 rounded-full bg-secondary mr-2"></span>Completed ({completed.length})</h3>
                     {completed.map(task => <TaskCard key={task.id} task={task} onUpdateStatus={handleUpdateStatus} />)}
                     {completed.length === 0 && <p className="text-sm text-center text-text-secondary pt-4">No tasks completed today.</p>}
                </div>
            </div>
        </div>
    );
};

export default MyDayPage;