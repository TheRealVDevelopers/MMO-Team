import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { TASKS, formatDateTime, ATTENDANCE_DATA, safeDate } from '../../../constants';
import { Task, TaskStatus, AttendanceType, UserRole, Reminder, AttendanceStatus, ExecutionTask } from '../../../types';
import TaskCard from './TaskCard';
import {
    BoltIcon,
    CalendarDaysIcon,
    BellIcon,
    PlusIcon,
    CheckCircleIcon,
    ArrowPathIcon,
    ClockIcon,
    CalendarIcon,
    SparklesIcon
} from '@heroicons/react/24/outline';
import PersonalCalendar from './PersonalCalendar';
import TimeTimeline from './TimeTimeline';
import TimeTrackingSummary from '../TimeTrackingSummary';
import RequestApprovalModal from './RequestApprovalModal';
import AddTaskModal from './AddTaskModal';
import { ContentCard, PrimaryButton, SecondaryButton, cn, staggerContainer } from '../shared/DashboardUI';
import { motion, AnimatePresence } from 'framer-motion';
import { useTimeEntries, addActivity } from '../../../hooks/useTimeTracking';
import { useMyDayTasks, addTask, updateTask, startTask, completeTask } from '../../../hooks/useMyDayTasks';
import { useExecutionTasks } from '../../../hooks/useExecutionTasks'; // Import Execution Tasks Hook
import { useLeads } from '../../../hooks/useLeads';
import { useFinance } from '../../../hooks/useFinance';
import { ProjectStatus, ApprovalStatus, ApprovalRequestType } from '../../../types';
import { useProjects } from '../../../hooks/useProjects';
import { useAssignedApprovalRequests, startRequest, completeRequest } from '../../../hooks/useApprovalSystem';

const SalesStats: React.FC<{ userId: string, leads: any[], timeEntries: any[] }> = ({ userId, leads, timeEntries }) => {
    const myLeads = leads.filter(l => l.assignedTo === userId);
    const totalLeads = myLeads.length;
    const convertedProjects = myLeads.filter(l => l.status === 'Won').length;

    const { projects } = useProjects();
    const { costCenters } = useFinance();

    const myProjects = (projects || []).filter(p => p.assignedSales === userId || p.projectHead === userId);
    const totalRevenue = myProjects.reduce((sum, proj) => {
        const cc = costCenters.find(c => c.projectId === proj.id);
        return sum + (cc?.totalPayIn || 0);
    }, 0);

    const pendingFollowups = myLeads.reduce((count, lead) => {
        return count + (lead.reminders?.filter(r => !r.completed)?.length || 0);
    }, 0);

    const todayWorkSeconds = timeEntries.reduce((sum, e) => {
        if (e.clockOut && e.clockIn) {
            return sum + (new Date(e.clockOut).getTime() - new Date(e.clockIn).getTime());
        } else if (e.clockIn && !e.clockOut) {
            return sum + (Date.now() - new Date(e.clockIn).getTime());
        }
        return sum;
    }, 0);
    const workHours = Math.floor(todayWorkSeconds / (1000 * 60 * 60));
    const workMinutes = Math.floor((todayWorkSeconds % (1000 * 60 * 60)) / (1000 * 60));

    return (
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
            <StatBox label="Leads Assigned" value={totalLeads} />
            <StatBox label="Converted" value={convertedProjects} />
            <StatBox label="Revenue (₹)" value={totalRevenue.toLocaleString('en-IN')} />
            <StatBox label="Follow-ups" value={pendingFollowups} highlight={pendingFollowups > 0} />
            <StatBox label="Tasks Today" value={timeEntries.length} />
            <StatBox label="Work Time" value={`${workHours}h ${workMinutes}m`} />
        </div>
    );
};

const StatBox: React.FC<{ label: string, value: string | number, highlight?: boolean }> = ({ label, value, highlight }) => (
    <div className={`p-4 rounded-2xl border ${highlight ? 'bg-error/5 border-error/20' : 'bg-surface border-border'} flex flex-col items-center justify-center text-center shadow-sm`}>
        <span className={`text-2xl font-bold ${highlight ? 'text-error' : 'text-primary'}`}>{value}</span>
        <span className="text-[10px] uppercase tracking-wider text-text-tertiary font-bold mt-1">{label}</span>
    </div>
);

interface EnrichedReminder extends Reminder {
    leadId: string;
    leadName: string;
    projectName: string;
}

const isOverdue = (date: Date) => {
    const reminderDate = new Date(date);
    const today = new Date();
    reminderDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return reminderDate < today;
};

const ReminderItem: React.FC<{ reminder: EnrichedReminder, onToggle: (id: string) => void }> = ({ reminder, onToggle }) => {
    const overdue = !reminder.completed && isOverdue(reminder.date);
    return (
        <motion.div
            whileHover={{ x: 4 }}
            className={cn(
                "flex items-start p-4 rounded-2xl transition-all border",
                reminder.completed
                    ? 'bg-subtle-background/30 border-transparent opacity-60'
                    : 'bg-surface border-border hover:border-primary/30 shadow-sm'
            )}
        >
            <div className="relative flex items-center h-5">
                <input
                    type="checkbox"
                    checked={reminder.completed}
                    onChange={() => onToggle(reminder.id)}
                    className="h-5 w-5 text-primary focus:ring-primary border-border rounded-lg cursor-pointer transition-all"
                />
            </div>
            <div className="ml-3 flex-1 min-w-0">
                <p className={cn(
                    "text-sm font-semibold transition-all",
                    reminder.completed ? 'line-through text-text-tertiary' : 'text-text-primary'
                )}>
                    {reminder.notes}
                </p>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-medium text-text-tertiary uppercase tracking-wider">Lead:</span>
                    <span className="text-[10px] font-bold text-primary truncate max-w-[150px]">{reminder.leadName}</span>
                </div>
            </div>
            <div className="ml-4 text-right">
                <p className={cn(
                    "text-[10px] font-black uppercase tracking-tighter whitespace-nowrap px-2 py-1 rounded-md",
                    reminder.completed ? 'text-text-tertiary bg-subtle-background' : overdue ? 'text-error bg-error/10' : 'text-text-tertiary bg-subtle-background'
                )}>
                    {safeDate(reminder.date)}
                </p>
            </div>
        </motion.div>
    );
};

// Augmented Task Interface to include 'source'
interface UnifiedTask extends Task {
    source: 'myDay' | 'execution' | 'request';
    originalId: string;
}

const MyDayPage: React.FC = () => {
    const { currentUser } = useAuth();
    const { tasks: myDayTasks, loading: tasksLoading } = useMyDayTasks(); // Fixed: no params
    const { tasks: executionTasks } = useExecutionTasks(); // Fixed: no params needed
    const { requests: assignedRequests, loading: requestsLoading } = useAssignedApprovalRequests(); // Fixed: no params
    const { leads, loading: leadsLoading } = useLeads(currentUser?.organizationId);

    const [reminders, setReminders] = useState<EnrichedReminder[]>([]);
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
    const [showRequestApprovalModal, setShowRequestApprovalModal] = useState(false);

    const todayStr = new Date().toLocaleDateString('en-CA');
    const { entries: timeEntries, loading: timeLoading } = useTimeEntries(currentUser?.id || '', todayStr, todayStr);
    const todayTimeEntry = timeEntries.find(e => e.date === todayStr);

    useEffect(() => {
        if (currentUser && !leadsLoading) {
            if (currentUser.role === UserRole.SALES_TEAM_MEMBER) {
                const userLeads = (leads || []).filter(lead => lead.assignedTo === currentUser.id);
                // Note: reminders property doesn't exist on Lead type in case-centric schema
                // This feature needs to be refactored to use case activities or a new reminders subcollection
                const allReminders: EnrichedReminder[] = [];
                /* Legacy reminder code disabled - reminders not in schema:
                const allReminders: EnrichedReminder[] = userLeads.flatMap(lead =>
                    (lead.reminders || []).map(reminder => ({
                        ...reminder,
                        leadId: lead.id,
                        leadName: lead.clientName,
                        projectName: lead.projectName
                    }))
                );
                allReminders.sort((a, b) => {
                    if (a.completed !== b.completed) {
                        return a.completed ? 1 : -1;
                    }
                    return new Date(a.date).getTime() - new Date(b.date).getTime();
                });
                */
                setReminders(allReminders);
            } else {
                setReminders([]);
            }
        }
    }, [currentUser, leads, leadsLoading]);

    // Merge and filter tasks
    const daysTasks = useMemo(() => {
        const unifiedMyDayTasks: UnifiedTask[] = myDayTasks.map(t => ({
            ...t,
            source: 'myDay',
            originalId: t.id
        }));

        // ✅ Server-side filtering already done in useExecutionTasks hook - no client-side filter needed
        const unifiedExecutionTasks: UnifiedTask[] = (executionTasks || [])
            .filter(t => t.assignedTo === currentUser?.id) // Client-side filter by user
            .map(t => ({
            id: `exec-${t.id}`, // Avoid ID collisions
            originalId: t.id,
            title: `[${t.missionType}] ${t.projectName}`,
            assignedTo: t.assignedTo,
            userId: t.assignedTo, // Keep for compatibility if used elsewhere, but assignedTo is key
            status: t.status === 'Completed' ? TaskStatus.COMPLETED :
                t.status === 'In Progress' ? TaskStatus.STARTED : TaskStatus.PENDING,
            timeSpent: 0, // Not tracked in execution task natively yet
            priority: t.priority || 'Medium',
            priorityOrder: 0,
            deadline: t.deadline, // Ensure this matches string format or Date object handling
            isPaused: false,
            date: selectedDate, // Show on selected date (or map to deadline date logic)
            description: t.instructions,
            createdAt: new Date(t.createdAt),
            createdBy: 'System',
            createdByName: 'Execution Team',
            source: 'execution'
        }));

        // Filter valid operational requests
        const myRequests = (assignedRequests || []).filter(r =>
            r.requestType !== ApprovalRequestType.STAFF_REGISTRATION &&
            (r.status === ApprovalStatus.PENDING || r.status === ApprovalStatus.APPROVED)
        );

        const unifiedRequests: UnifiedTask[] = myRequests.map(r => {
            let status = TaskStatus.PENDING;
            if (r.status === ApprovalStatus.APPROVED) status = TaskStatus.COMPLETED;

            return {
                id: `req-${r.id}`,
                originalId: r.id,
                title: `${r.title} (${r.requestType})`,
                assignedTo: r.assigneeId || '',
                userId: r.assigneeId || '',
                status: status,
                timeSpent: 0, // Todo: track time
                priority: r.priority,
                priorityOrder: 0,
                deadline: r.endDate ? (r.endDate instanceof Date ? r.endDate.toISOString() : (r.endDate as any).toDate().toISOString()) : undefined,
                isPaused: false,
                date: selectedDate, // Show today if active
                description: r.description,
                createdAt: r.requestedAt ? (r.requestedAt instanceof Date ? r.requestedAt : (r.requestedAt as any).toDate()) : new Date(),
                createdBy: r.requesterId,
                createdByName: r.requesterName,
                source: 'request'
            };
        });


        // combine
        const all = [...unifiedMyDayTasks, ...unifiedExecutionTasks, ...unifiedRequests];

        // Filter by date or show always if execution/request
        return all.filter(task => {
            if (task.source === 'execution' || task.source === 'request') {
                // Show if Pending/InProgress. If completed, maybe filter out unless done today?
                // For now, always show if assigned.
                if (task.status === TaskStatus.COMPLETED) {
                    // Only show completed if selected date matches today (assumes we want to see what we did today)
                    // Simplified: Only hide manually. Or show always.
                    // Let's filter out older completed items if we had a completion date mechanism.
                    // For now, showing all helps track.
                }
                return true;
            }
            return task.date === selectedDate;
        }).sort((a, b) => {
            // Sort by status (Pending/Started first) then priority
            if (a.status !== b.status) {
                if (a.status === TaskStatus.STARTED) return -1;
                if (b.status === TaskStatus.STARTED) return 1;
            }
            return (a.priorityOrder || 99) - (b.priorityOrder || 99);
        });

    }, [myDayTasks, executionTasks, assignedRequests, currentUser, selectedDate]);


    const handleUpdateStatus = async (taskId: string, newStatus: TaskStatus) => {
        try {
            // Find task in our unified list
            const task = daysTasks.find(t => t.id === taskId);
            if (!task || !currentUser) return;

            if (task.source === 'execution') {
                // Update Execution Task (Note: updateExecutionStatus removed - needs refactor)
                console.log('Execution task status update not implemented:', task.originalId, newStatus);
                return;
            }

            if (task.source === 'request') {
                // Update Approval Request Lifecycle (Note: hooks need params - needs refactor)
                console.log('Request status update not implemented:', task.originalId, newStatus);
                return;
            }

            // Normal 'My Day' Task Update
            const now = Date.now();
            const updates: Partial<Task> = { status: newStatus };

            if (newStatus === TaskStatus.STARTED) {
                updates.startTime = now;
                updates.isPaused = false;
                await addActivity(currentUser.id, currentUser.name, `Task: ${task.title}`);
            }

            if (newStatus === TaskStatus.COMPLETED) {
                const startTime = task.startTime || now;
                const timeSpent = task.timeSpent + Math.floor((now - startTime) / 1000);
                updates.endTime = now;
                updates.timeSpent = timeSpent;
                updates.isPaused = true;
                await addActivity(currentUser.id, currentUser.name, `Task: ${task.title}`, true);
            }

            // Note: updateTask signature changed - needs investigation
            console.log('Would update task:', task.originalId, updates);
        } catch (error) {
            console.error("Failed to update task status:", error);
            alert("Failed to update task status. Please try again.");
        }
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

    const handleAddTask = async (taskData: {
        title: string;
        priorityOrder: number;
        priority: 'High' | 'Medium' | 'Low';
        deadline?: string;
        assignedTo?: string;
    }) => {
        if (!currentUser) return;

        const newTask: Omit<Task, 'id'> = {
            title: taskData.title,
            assignedTo: taskData.assignedTo || currentUser.id,
            userId: taskData.assignedTo || currentUser.id,
            status: TaskStatus.PENDING,
            timeSpent: 0,
            priority: taskData.priority,
            priorityOrder: taskData.priorityOrder,
            deadline: taskData.deadline,
            isPaused: false,
            date: selectedDate,
            description: '',
            createdAt: new Date(),
            createdBy: currentUser.id,
            createdByName: currentUser.name,
        };

        // Note: addTask deprecated - needs refactor with caseTasks
        console.log('Would add task:', newTask);
    };

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


    // New: Handle Start Task with Automation
    const handleStartTask = async (task: Task) => {
        try {
            console.log('[MyDayPage] Starting task:', task.title);

            // 1. Update Task Status (Note: startTask deprecated - needs refactor with caseTasks)
            console.log('Would start task:', task.id);

            // 2. Automation: Site Visit Record Creation
            const title = task.title.toLowerCase();
            if (title.includes('site') && (title.includes('visit') || title.includes('inspection'))) {
                // Check context
                const contextId = task.contextId || task.caseId;
                if (contextId) {
                    const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');
                    const { db } = await import('../../../firebase');

                    const siteVisitsRef = collection(db, 'cases', contextId, 'siteVisits');
                    await addDoc(siteVisitsRef, {
                        engineerId: currentUser?.id,
                        engineerName: currentUser?.name,
                        startedAt: serverTimestamp(),
                        status: 'IN_PROGRESS',
                        taskId: task.id
                    });
                    console.log('[MyDayPage] Site Visit Record Created');
                }
            }
        } catch (error) {
            console.error('Error starting task:', error);
            alert('Failed to start task');
        }
    };

    // New: Handle Complete Task with Validation & Redirects
    const handleCompleteTask = async (task: Task) => {
        const title = task.title.toLowerCase();

        // 1. Site Visit Logic -> Redirect to Project Workflow for "Distance" input
        if (title.includes('site') && (title.includes('visit') || title.includes('inspection'))) {
            const projectId = task.contextId || task.caseId;
            if (projectId) {
                // Navigate to workflow page to open the modal
                // We use a query param to trigger the modal
                // Assuming route is /workflow (Sales Manager/Site Engineer have this)
                // We need to verify if the user has access to /workflow. Role based nav says yes for most.
                window.location.href = `/workflow?action=complete-inspection&projectId=${projectId}&taskId=${task.id}`;
                return;
            }
        }

        // 2. Drawing/BOQ Logic -> Validation
        if (title.includes('drawing') || title.includes('design') || title.includes('boq') || title.includes('quotation')) {
            // We need to check if the document exists. 
            // Since we don't have project data handy here for every task, we fetch it.
            if (task.contextType === 'project' && task.contextId) {
                try {
                    const { doc, getDoc } = await import('firebase/firestore');
                    const { db } = await import('../../../firebase');
                    const projectRef = doc(db, 'cases', task.contextId);
                    const projectSnap = await getDoc(projectRef);

                    if (projectSnap.exists()) {
                        const projectData = projectSnap.data();
                        // Check Drawing
                        if (title.includes('drawing') && !projectData.drawingSubmittedAt && !projectData.files?.some((f: any) => f.category === 'drawing')) {
                            alert('⚠️ Cannot Complete Task\n\nPlease upload the Drawing first using the Project Board.');
                            return;
                        }
                        // Check BOQ - Relaxed check for now as Items might be enough
                        if (title.includes('boq') && (!projectData.items || projectData.items.length === 0) && !projectData.files?.some((f: any) => f.category === 'boq')) {
                            alert('⚠️ Cannot Complete Task\n\nPlease submit the BOQ first using the Project Board.');
                            return;
                        }
                        // Check Quotation
                        if (title.includes('quotation') && !projectData.quotationSubmittedAt && !projectData.files?.some((f: any) => f.category === 'quotation')) {
                            alert('⚠️ Cannot Complete Task\n\nPlease generate/upload the Quotation first.');
                            return;
                        }
                    }
                } catch (e) {
                    console.error("Validation check failed", e);
                    // Fail open or closed? Closed for safety, but warn.
                }
            }
        }

        // 3. completion (Note: completeTask deprecated - needs refactor with caseTasks)
        try {
            console.log('Would complete task:', task.id);
        } catch (error) {
            console.error('Error completing task:', error);
        }
    };

    return (
        <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="space-y-8"
        >
            <div className="flex items-center gap-3">
                <PrimaryButton
                    onClick={() => setIsAddTaskModalOpen(true)}
                    icon={<PlusIcon className="w-4 h-4" />}
                >
                    Add Task
                </PrimaryButton>
                <SecondaryButton
                    onClick={() => setShowRequestApprovalModal(true)}
                    icon={<SparklesIcon className="w-4 h-4" />}
                >
                    Request Validation
                </SecondaryButton>
            </div>

            {/* Sales Member Real-Time Dashboard */}
            {currentUser.role === UserRole.SALES_TEAM_MEMBER && (
                <SalesStats
                    userId={currentUser.id}
                    leads={leads}
                    timeEntries={timeEntries}
                />
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Clocking & Calendar */}
                <div className="space-y-8">
                    <TimeTimeline timeEntry={todayTimeEntry} />

                    <PersonalCalendar
                        userId={currentUser.id}
                        onDateSelect={setSelectedDate}
                        tasks={daysTasks}
                    />

                    {attendanceStats && (
                        <ContentCard>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                    <CalendarDaysIcon className="w-5 h-5" />
                                </div>
                                <h3 className="text-lg font-serif font-bold text-text-primary tracking-tight">Monthly Presence</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-secondary/5 border border-secondary/10 p-4 rounded-3xl text-center group hover:bg-secondary/10 transition-colors">
                                    <p className="text-secondary font-black text-2xl tracking-tighter">{attendanceStats.present}</p>
                                    <p className="text-[10px] text-secondary font-black uppercase tracking-widest mt-1">Present</p>
                                </div>
                                <div className="bg-error/5 border border-error/10 p-4 rounded-3xl text-center group hover:bg-error/10 transition-colors">
                                    <p className="text-error font-black text-2xl tracking-tighter">{attendanceStats.absent}</p>
                                    <p className="text-[10px] text-error font-black uppercase tracking-widest mt-1">Absent</p>
                                </div>
                                <div className="bg-accent/5 border border-accent/10 p-4 rounded-3xl text-center group hover:bg-accent/10 transition-colors">
                                    <p className="text-accent font-black text-2xl tracking-tighter">{attendanceStats.halfDay}</p>
                                    <p className="text-[10px] text-accent font-black uppercase tracking-widest mt-1">Half Day</p>
                                </div>
                                <div className="bg-purple/5 border border-purple/10 p-4 rounded-3xl text-center group hover:bg-purple/10 transition-colors">
                                    <p className="text-purple font-black text-2xl tracking-tighter">{attendanceStats.leave}</p>
                                    <p className="text-[10px] text-purple font-black uppercase tracking-widest mt-1">Leave</p>
                                </div>
                            </div>
                        </ContentCard>
                    )}
                </div>

                {/* Right Column: Execution Hub */}
                <div className="lg:col-span-2 space-y-8">
                    <TimeTrackingSummary userId={currentUser.id} />

                    <ContentCard>
                        <div className="flex flex-col md:flex-row justify-between md:items-center gap-6 mb-8 pb-8 border-b border-border/40">
                            <div>
                                <h3 className="text-2xl font-serif font-bold text-text-primary tracking-tight">Execution Stream</h3>
                                <p className="text-sm text-text-tertiary font-medium mt-1">{formattedDateHeader}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <AnimatePresence mode="popLayout">
                                {daysTasks.length > 0 ? (
                                    daysTasks.map(task => (
                                        <TaskCard
                                            key={task.id}
                                            task={task}
                                            onUpdateStatus={handleUpdateStatus}
                                            onStartTask={handleStartTask}
                                            onCompleteTask={handleCompleteTask}
                                        />
                                    ))
                                ) : (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="text-center py-20 border-2 border-dashed border-border/40 rounded-3xl bg-subtle-background/30"
                                    >
                                        <div className="w-16 h-16 bg-surface rounded-2xl flex items-center justify-center mx-auto mb-4 border border-border shadow-sm">
                                            <CheckCircleIcon className="w-8 h-8 text-text-tertiary opacity-20" />
                                        </div>
                                        <p className="text-text-secondary font-medium italic">No objectives recorded for this period.</p>
                                        <p className="text-[10px] text-text-tertiary uppercase tracking-widest mt-2">Initialize your stream above.</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </ContentCard>

                    {currentUser.role === UserRole.SALES_TEAM_MEMBER && reminders.length > 0 && (
                        <ContentCard>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                                    <BellIcon className="w-5 h-5" />
                                </div>
                                <h3 className="text-xl font-serif font-bold text-text-primary tracking-tight">Objective Alarms</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <AnimatePresence>
                                    {reminders.map(reminder => (
                                        <ReminderItem key={`${reminder.leadId}-${reminder.id}`} reminder={reminder} onToggle={handleToggleReminder} />
                                    ))}
                                </AnimatePresence>
                            </div>
                        </ContentCard>
                    )}
                </div>
            </div>

            <RequestApprovalModal
                isOpen={showRequestApprovalModal}
                onClose={() => setShowRequestApprovalModal(false)}
            />

            <AddTaskModal
                isOpen={isAddTaskModalOpen}
                onClose={() => setIsAddTaskModalOpen(false)}
                onAddTask={handleAddTask}
                existingTaskCount={daysTasks.length}
                currentUser={currentUser}
            />
        </motion.div>
    );
};

export default MyDayPage;
