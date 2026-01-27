import React, { useState } from 'react';
import {
    ClockIcon,
    MapPinIcon,
    PhoneIcon,
    UserGroupIcon,
    CurrencyRupeeIcon,
    DocumentChartBarIcon,
    ArrowLeftIcon,
    ClipboardDocumentCheckIcon,
    ChartBarIcon,
    CalendarIcon,
    ShieldExclamationIcon,
    ShoppingCartIcon
} from '@heroicons/react/24/outline';
import { Project, ProjectStatus } from '../../../types';
import { formatCurrencyINR, formatDate, MOCK_GANTT_DATA } from '../../../constants';
import GanttChart from './GanttChart';
import JMSForm from './JMSForm';
import DailyUpdateLog from './DailyUpdateLog';
import MaterialTracker from './MaterialTracker';

// Mock Items for JMS (In real app, fetch from BOQ/Quotation)
const MOCK_ITEMS = [
    { id: 'item-1', name: '2x2 Vitrified Tiles', quantity: 2000, unit: 'sqft', category: 'Flooring', price: 120, specifications: 'Kajaria or equivalent' },
    { id: 'item-2', name: 'Gypsum Board Ceiling', quantity: 1500, unit: 'sqft', category: 'Ceiling', price: 85, specifications: 'Saint Gobain' },
    { id: 'item-3', name: 'Emulsion Paint', quantity: 5000, unit: 'sqft', category: 'Painting', price: 25, specifications: 'Asian Paints Royal' },
];

interface ExecutionProjectDetailProps {
    project: Project;
    onBack: () => void;
}

type Tab = 'overview' | 'timeline' | 'updates' | 'materials' | 'issues' | 'completion';

const ExecutionProjectDetail: React.FC<ExecutionProjectDetailProps> = ({ project, onBack }) => {
    const [activeTab, setActiveTab] = useState<Tab>('timeline');
    const [showJMS, setShowJMS] = useState(false);

    const tabs = [
        { id: 'timeline', label: 'Timeline & Plan', icon: CalendarIcon },
        { id: 'overview', label: 'Overview', icon: ChartBarIcon },
        { id: 'updates', label: 'Daily Updates', icon: ClipboardDocumentCheckIcon },
        { id: 'materials', label: 'Materials', icon: ShoppingCartIcon },
        { id: 'issues', label: 'Issues & Risks', icon: ShieldExclamationIcon },
        { id: 'completion', label: 'Completion & Handover', icon: DocumentChartBarIcon },
    ];

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center shadow-sm z-10">
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
            <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-gray-700 px-4">
                <div className="flex space-x-6">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as Tab)}
                            className={`flex items-center gap-2 py-4 px-2 border-b-2 transition-colors text-sm font-medium ${activeTab === tab.id
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
            <div className="flex-1 overflow-hidden bg-gray-50 dark:bg-slate-900 p-6">
                {activeTab === 'timeline' && (
                    <div className="h-full flex flex-col space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Project Schedule</h3>
                            <button className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
                                + Add Task
                            </button>
                        </div>
                        <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <GanttChart tasks={project.ganttData || MOCK_GANTT_DATA} />
                        </div>
                    </div>
                )}

                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Placeholder for overview widgets */}
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                            <h4 className="text-sm font-medium text-gray-500 mb-2">Manpower On Site</h4>
                            <div className="text-3xl font-bold text-gray-900 dark:text-white">12</div>
                            <div className="text-sm text-green-600 mt-1">Full strength</div>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                            <h4 className="text-sm font-medium text-gray-500 mb-2">Safety Score</h4>
                            <div className="text-3xl font-bold text-gray-900 dark:text-white">98%</div>
                            <div className="text-sm text-gray-500 mt-1">No incidents reported</div>
                        </div>
                    </div>
                )}

                {/* Other tabs placeholders */}
                {activeTab === 'updates' && (
                    <DailyUpdateLog projectId={project.id} />
                )}
                {activeTab === 'materials' && (
                    <MaterialTracker projectId={project.id} />
                )}
                {activeTab === 'issues' && (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        Issue Tracker coming soon...
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExecutionProjectDetail;
