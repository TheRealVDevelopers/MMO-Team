import React, { useState } from 'react';
import {
    ChartBarIcon,
    CalendarIcon,
    ShieldExclamationIcon,
    ShoppingCartIcon,
    ClipboardDocumentCheckIcon,
    DocumentChartBarIcon,
    ArrowLeftIcon,
    PlusIcon
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
import { MOCK_GANTT_DATA } from '../../../constants';

// Mock Items for JMS
const MOCK_ITEMS = [
    { id: 'item-1', name: '2x2 Vitrified Tiles', quantity: 2000, unit: 'sqft', category: 'Flooring', price: 120, specifications: 'Kajaria or equivalent' },
    { id: 'item-2', name: 'Gypsum Board Ceiling', quantity: 1500, unit: 'sqft', category: 'Ceiling', price: 85, specifications: 'Saint Gobain' },
    { id: 'item-3', name: 'Emulsion Paint', quantity: 5000, unit: 'sqft', category: 'Painting', price: 25, specifications: 'Asian Paints Royal' },
];

// Initial Mock Data to seed the state
const INITIAL_ISSUES: Issue[] = [
    {
        id: '1',
        projectId: 'p-1',
        title: 'Material Shortage - Cement',
        notes: 'Delayed delivery of cement bags from vendor.',
        priority: 'High',
        status: 'Open',
        reportedBy: 'Site Engineer',
        timestamp: new Date('2023-10-25')
    },
    {
        id: '2',
        projectId: 'p-1',
        title: 'Plumbing Layout Change',
        notes: 'Client requested changes in bathroom plumbing layout.',
        priority: 'Medium',
        status: 'In Progress',
        reportedBy: 'Project Manager',
        timestamp: new Date('2023-10-22')
    }
];

const INITIAL_UPDATES: DailyUpdate[] = [
    {
        id: 'du-1',
        projectId: 'p-1',
        date: new Date().toISOString(),
        workDescription: 'Completed false ceiling framing in Living Room. Started electrical conduit laying in Master Bedroom.',
        weather: 'Sunny',
        manpowerCount: 8,
        photos: [],
        createdBy: 'u-5',
        createdAt: new Date()
    }
];

const INITIAL_REQUESTS: MaterialRequest[] = [
    {
        id: 'mr-1',
        projectId: 'p-1',
        itemId: 'item-2',
        itemName: 'Cement Bags (Ultratech)',
        quantityRequested: 20,
        unit: 'bags',
        requiredDate: new Date(Date.now() + 86400000 * 2).toISOString(),
        status: 'Ordered',
        requestedBy: 'u-5',
        createdAt: new Date(),
        notes: 'Urgent for flooring work'
    }
];


interface ExecutionProjectDetailProps {
    project: Project;
    onBack: () => void;
}

type Tab = 'overview' | 'timeline' | 'updates' | 'materials' | 'issues' | 'completion';

const ExecutionProjectDetail: React.FC<ExecutionProjectDetailProps> = ({ project, onBack }) => {
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [showJMS, setShowJMS] = useState(false);

    // Centralized State
    const [tasks, setTasks] = useState<GanttTask[]>(project.ganttData || MOCK_GANTT_DATA);
    const [issues, setIssues] = useState<Issue[]>(INITIAL_ISSUES);
    const [dailyUpdates, setDailyUpdates] = useState<DailyUpdate[]>(INITIAL_UPDATES);
    const [materialRequests, setMaterialRequests] = useState<MaterialRequest[]>(INITIAL_REQUESTS);

    const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);

    const tabs = [
        { id: 'overview', label: 'Overview', icon: ChartBarIcon },
        { id: 'timeline', label: 'Timeline & Plan', icon: CalendarIcon },
        { id: 'updates', label: 'Daily Updates', icon: ClipboardDocumentCheckIcon },
        { id: 'materials', label: 'Materials', icon: ShoppingCartIcon },
        { id: 'issues', label: 'Issues & Risks', icon: ShieldExclamationIcon },
        { id: 'completion', label: 'Completion & Handover', icon: DocumentChartBarIcon },
    ];

    // Handlers
    const handleAddTask = (taskDetails: Partial<GanttTask>) => {
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
        setTasks([...tasks, newTask]);
        setIsAddTaskModalOpen(false);
    };

    const handleAddIssue = (issue: Issue) => {
        setIssues([issue, ...issues]);
    };

    const handleUpdateIssueStatus = (issueId: string, newStatus: Issue['status']) => {
        setIssues(issues.map(i => i.id === issueId ? { ...i, status: newStatus } : i));
    };

    const handleAddDailyUpdate = (update: DailyUpdate) => {
        setDailyUpdates([update, ...dailyUpdates]);
    };

    const handleAddMaterialRequest = (request: MaterialRequest) => {
        setMaterialRequests([request, ...materialRequests]);
    };

    // Derived State for Overview
    // Ensure we pass the latest issues count and updates

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-slate-900">
            {/* Header */}
            <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center shadow-sm z-10 sticky top-0">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <ArrowLeftIcon className="w-5 h-5 text-gray-500" />
                    </button>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{project.projectName}</h2>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                            <span>{project.clientName}</span>
                            <span className="w-1 h-1 bg-gray-300 rounded-full" />
                            <span className={project.status === 'In Execution' ? 'text-green-600 font-medium' : ''}>{project.status}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <button
                        onClick={() => setShowJMS(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
                    >
                        <ClipboardDocumentCheckIcon className="w-5 h-5" />
                        Launch JMS
                    </button>
                    <div className="text-right hidden sm:block">
                        <div className="text-xs text-gray-500">Timeline</div>
                        <div className="text-sm font-semibold">{new Date(project.startDate).toLocaleDateString()} - {new Date(project.endDate).toLocaleDateString()}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-xs text-gray-500">Progress</div>
                        <div className="text-lg font-bold text-blue-600">{project.progress}%</div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-gray-700 px-4 sticky top-[72px] z-10">
                <div className="flex space-x-6 overflow-x-auto">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as Tab)}
                            className={`flex items-center gap-2 py-4 px-2 border-b-2 transition-colors text-sm font-medium whitespace-nowrap ${activeTab === tab.id
                                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
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
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Project Schedule</h3>
                            <button
                                onClick={() => setIsAddTaskModalOpen(true)}
                                className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                            >
                                <PlusIcon className="w-4 h-4" />
                                Add Task
                            </button>
                        </div>
                        <div className="flex-1 min-h-[500px] bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
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
