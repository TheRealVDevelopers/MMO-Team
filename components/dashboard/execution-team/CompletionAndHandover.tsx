import React, { useState } from 'react';
import {
    CheckCircleIcon,
    ClipboardDocumentCheckIcon,
    ArrowTopRightOnSquareIcon,
    DocumentTextIcon
} from '@heroicons/react/24/outline';

const CHECKLIST_ITEMS = [
    { id: '1', task: 'Final Site Cleaning', status: 'Pending', category: 'General' },
    { id: '2', task: 'Plumbing Pressure Test', status: 'Completed', category: 'Plumbing' },
    { id: '3', task: 'Electrical Circuit Check', status: 'Pending', category: 'Electrical' },
    { id: '4', task: 'Paint Touch-ups', status: 'In Progress', category: 'Painting' },
    { id: '5', task: 'Client Walkthrough', status: 'Pending', category: 'Admin' },
    { id: '6', task: 'Key Handover', status: 'Pending', category: 'Admin' },
    { id: '7', task: 'Warranty Card Handover', status: 'Pending', category: 'Admin' }
];

const CompletionAndHandover: React.FC = () => {
    const [checklist, setChecklist] = useState(CHECKLIST_ITEMS);

    const handleToggleStatus = (id: string) => {
        setChecklist(prev => prev.map(item => {
            if (item.id === id) {
                const nextStatus = item.status === 'Pending' ? 'In Progress' : item.status === 'In Progress' ? 'Completed' : 'Pending';
                return { ...item, status: nextStatus };
            }
            return item;
        }));
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'Completed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200';
            case 'In Progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400 border-gray-200';
        }
    };

    const progress = Math.round((checklist.filter(i => i.status === 'Completed').length / checklist.length) * 100);

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <ClipboardDocumentCheckIcon className="w-6 h-6 text-emerald-600" />
                        Project Completion & Handover
                    </h3>
                    <p className="text-gray-500">Ensure all tasks are completed before final handover.</p>
                </div>

                <div className="flex items-center gap-2">
                    <div className="text-right mr-2">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{progress}% Complete</div>
                        <div className="text-xs text-gray-500">{checklist.filter(i => i.status === 'Completed').length}/{checklist.length} Tasks</div>
                    </div>
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${progress}%` }} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="p-4 bg-gray-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-gray-700 font-semibold text-gray-700 dark:text-gray-200">
                            Handover Checklist
                        </div>
                        <div className="divide-y divide-gray-100 dark:divide-gray-700">
                            {checklist.map(item => (
                                <div key={item.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors group">
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => handleToggleStatus(item.id)}
                                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${item.status === 'Completed' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300 hover:border-emerald-400'
                                                }`}
                                        >
                                            {item.status === 'Completed' && <CheckCircleIcon className="w-4 h-4" />}
                                        </button>
                                        <div>
                                            <p className={`font-medium ${item.status === 'Completed' ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-white'}`}>
                                                {item.task}
                                            </p>
                                            <span className="text-xs text-gray-400 bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                                                {item.category}
                                            </span>
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusStyle(item.status)}`}>
                                        {item.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 p-6 rounded-xl border border-emerald-100 dark:border-emerald-800/30">
                        <h4 className="font-bold text-emerald-900 dark:text-emerald-100 mb-4">Start Completion Phase?</h4>
                        <p className="text-sm text-emerald-700 dark:text-emerald-300/80 mb-6">
                            Once all checklist items are verified, generate the final handover report and initiate the warranty period.
                        </p>
                        <button
                            disabled={progress < 100}
                            className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <DocumentTextIcon className="w-5 h-5" />
                            Generate Handover Docs
                        </button>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                        <h4 className="font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h4>
                        <div className="space-y-3">
                            <button className="w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-slate-700 rounded-lg flex items-center justify-between text-sm group transition-colors">
                                <span className="text-gray-600 dark:text-gray-300">View Warranty Policy</span>
                                <ArrowTopRightOnSquareIcon className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                            </button>
                            <button className="w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-slate-700 rounded-lg flex items-center justify-between text-sm group transition-colors">
                                <span className="text-gray-600 dark:text-gray-300">Email Client Update</span>
                                <ArrowTopRightOnSquareIcon className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CompletionAndHandover;
