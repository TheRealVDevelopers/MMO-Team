import React, { useState } from 'react';
import {
    ChartBarIcon,
    CalendarIcon,
    ShieldExclamationIcon,
    ShoppingCartIcon,
    ClipboardDocumentCheckIcon,
    DocumentChartBarIcon,
    ArrowLeftIcon,
    PlusIcon,
    ClockIcon
} from '@heroicons/react/24/outline';
import { Project, GanttTask, Issue, DailyUpdate, MaterialRequest } from '../../../types';
import GanttChart from './GanttChart';
import JMSForm from './JMSForm';
import DailyUpdateLog from './DailyUpdateLog';
import MaterialTracker from './MaterialTracker';
import RisksAndIssues from './RisksAndIssues';
import CompletionAndHandover from './CompletionAndHandover';
import AddTaskModal from './AddTaskModal';
import ExecutionProjectOverview from './ExecutionProjectOverview';
import { useDailyUpdates } from '../../../hooks/useDailyUpdates';
import { useMaterialRequests } from '../../../hooks/useMaterialRequests';
import { useEditApproval } from '../../../hooks/useEditApproval';
import { useAuth } from '../../../context/AuthContext';

// Mock Items for JMS
// Mock Items for JMS
const MOCK_ITEMS = [];

// Initial Mock Data for issues (will be replaced with Firestore later)
const INITIAL_ISSUES: Issue[] = [];

interface ExecutionProjectDetailProps {
    project: Project;
    onBack: () => void;
}

type Tab = 'overview' | 'timeline' | 'updates' | 'materials' | 'issues' | 'completion';

const ExecutionProjectDetail: React.FC<ExecutionProjectDetailProps> = ({ project, onBack }) => {
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [showJMS, setShowJMS] = useState(false);
    const { currentUser } = useAuth();

    // Use Firestore hooks for real data persistence
    const { updates: dailyUpdates, loading: updatesLoading, addUpdate } = useDailyUpdates(project.id);
    const { requests: materialRequests, loading: materialsLoading, addRequest } = useMaterialRequests(project.id);
    const { pendingRequests, submitEditRequest, getUserPendingCount } = useEditApproval(project.id);

    // Local state for Gantt tasks and issues (will be migrated later)
    const [tasks, setTasks] = useState<GanttTask[]>(project.ganttData || []);
    const [issues, setIssues] = useState<Issue[]>(INITIAL_ISSUES);

    const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);

    const tabs = [
        { id: 'overview', label: 'Overview', icon: ChartBarIcon },
        { id: 'timeline', label: 'Timeline & Plan', icon: CalendarIcon },
        { id: 'updates', label: 'Daily Updates', icon: ClipboardDocumentCheckIcon },
        { id: 'materials', label: 'Materials', icon: ShoppingCartIcon },
        { id: 'issues', label: 'Issues & Risks', icon: ShieldExclamationIcon },
        { id: 'completion', label: 'Completion & Handover', icon: DocumentChartBarIcon },
    ];

    // Handler for adding task - now goes through approval workflow
    const handleAddTask = async (taskDetails: Partial<GanttTask>) => {
        const newTask: GanttTask = {
            id: `task-${Date.now()}`,
            name: taskDetails.name || 'New Task',
            type: 'task',
            start: taskDetails.start || new Date(),
            end: taskDetails.end || new Date(Date.now() + 86400000),
            progress: 0,
            status: taskDetails.status || 'Pending',
            dependencies: [],
            assignedTo: taskDetails.assignedTo || 'Me',
            notes: taskDetails.notes
        };

        // Submit for admin approval instead of direct save
        try {
            await submitEditRequest({
                projectId: project.id,
                requesterId: currentUser?.id || '',
                requesterName: currentUser?.name || 'Unknown User',
                editType: 'task',
                targetName: newTask.name,
                originalData: null,
                proposedData: newTask,
                description: `Add new task: ${newTask.name}`
            });
            alert('Task submitted for admin approval!');
        } catch (err) {
            // Fallback to local state if Firestore fails
            setTasks([...tasks, newTask]);
            console.error('Edit approval failed, using local state:', err);
        }

        setIsAddTaskModalOpen(false);
    };

    const handleAddIssue = (issue: Issue) => {
        setIssues([issue, ...issues]);
    };

    const handleUpdateIssueStatus = (issueId: string, newStatus: Issue['status']) => {
        setIssues(issues.map(i => i.id === issueId ? { ...i, status: newStatus } : i));
    };

    // Use Firestore hook for daily updates
    const handleAddDailyUpdate = async (update: DailyUpdate) => {
        try {
            await addUpdate(update);
        } catch (err) {
            console.error('Failed to add daily update:', err);
        }
    };

    // Use Firestore hook for material requests
    const handleAddMaterialRequest = async (request: MaterialRequest) => {
        try {
            await addRequest(request);
        } catch (err) {
            console.error('Failed to add material request:', err);
        }
    };

    const pendingCount = getUserPendingCount();

    return (
        <div className="flex flex-col h-full bg-subtle-background">
            {/* Header */}
            <div className="bg-surface border-b border-border p-4 flex justify-between items-center shadow-sm z-10 sticky top-0">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-subtle-background rounded-lg transition-colors"
                    >
                        <ArrowLeftIcon className="w-5 h-5 text-text-secondary" />
                    </button>
                    <div>
                        <h2 className="text-xl font-bold text-text-primary">{project.projectName}</h2>
                        <div className="flex items-center gap-3 text-sm text-text-secondary">
                            <span>{project.clientName}</span>
                            <span className="w-1 h-1 bg-border rounded-full" />
                            <span className={project.status === 'In Execution' ? 'text-success font-medium' : ''}>{project.status}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    {/* Pending Edits Badge */}
                    {pendingCount > 0 && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-warning-subtle text-warning rounded-lg text-sm font-medium">
                            <ClockIcon className="w-4 h-4" />
                            {pendingCount} Pending Approval
                        </div>
                    )}

                    <button
                        onClick={() => setShowJMS(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-success text-white rounded-xl font-bold hover:bg-success/90 transition-all shadow-lg"
                    >
                        <ClipboardDocumentCheckIcon className="w-5 h-5" />
                        Launch JMS
                    </button>
                    <div className="text-right hidden sm:block">
                        <div className="text-xs text-text-secondary">Timeline</div>
                        <div className="text-sm font-semibold text-text-primary">{new Date(project.startDate).toLocaleDateString()} - {new Date(project.endDate).toLocaleDateString()}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-xs text-text-secondary">Progress</div>
                        <div className="text-lg font-bold text-primary">{project.progress}%</div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-surface border-b border-border px-4 sticky top-[72px] z-10">
                <div className="flex space-x-6 overflow-x-auto">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as Tab)}
                            className={`flex items-center gap-2 py-4 px-2 border-b-2 transition-colors text-sm font-medium whitespace-nowrap ${activeTab === tab.id
                                ? 'border-primary text-primary'
                                : 'border-transparent text-text-secondary hover:text-text-primary'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6">
                {activeTab === 'timeline' && (
                    <div className="h-full flex flex-col space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-text-primary">Project Schedule</h3>
                            <button
                                onClick={() => setIsAddTaskModalOpen(true)}
                                className="px-3 py-1.5 bg-primary text-white text-sm rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                            >
                                <PlusIcon className="w-4 h-4" />
                                Add Task
                            </button>
                        </div>
                        <p className="text-xs text-text-tertiary">Note: Task additions require admin approval.</p>
                        <div className="flex-1 min-h-[500px] bg-surface rounded-xl shadow-sm border border-border overflow-hidden">
                            <GanttChart tasks={tasks} />
                        </div>
                    </div>
                )}

                {activeTab === 'overview' && (
                    <ExecutionProjectOverview
                        project={project}
                        issues={issues}
                        dailyUpdates={dailyUpdates}
                    />
                )}

                {activeTab === 'updates' && (
                    <DailyUpdateLog
                        projectId={project.id}
                        updates={dailyUpdates}
                        onAddUpdate={handleAddDailyUpdate}
                    />
                )}
                {activeTab === 'materials' && (
                    <MaterialTracker
                        projectId={project.id}
                        requests={materialRequests}
                        onAddRequest={handleAddMaterialRequest}
                    />
                )}
                {activeTab === 'issues' && (
                    <RisksAndIssues
                        projectId={project.id}
                        issues={issues}
                        onAddIssue={handleAddIssue}
                        onUpdateStatus={handleUpdateIssueStatus}
                    />
                )}
                {activeTab === 'completion' && (
                    <CompletionAndHandover />
                )}
            </div>

            {/* Modals */}
            <AddTaskModal
                isOpen={isAddTaskModalOpen}
                onClose={() => setIsAddTaskModalOpen(false)}
                onSave={handleAddTask}
                currentTaskCount={tasks.length}
            />

            {showJMS && (
                <JMSForm
                    projectItems={MOCK_ITEMS}
                    onSave={(data) => {
                        console.log('JMS Saved:', data);
                        setShowJMS(false);
                    }}
                    onClose={() => setShowJMS(false)}
                />
            )}
        </div>
    );
};

export default ExecutionProjectDetail;
