import React from 'react';
import { Project, DailyUpdate, Issue } from '../../../types';
import {
    ChartBarIcon,
    ClockIcon,
    CurrencyRupeeIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon,
    ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';
import { formatCurrencyINR, formatDate } from '../../../constants';
import { formatDistanceToNow } from 'date-fns';

interface ExecutionProjectOverviewProps {
    project: Project;
    issues: Issue[];
    dailyUpdates: DailyUpdate[];
}

const ExecutionProjectOverview: React.FC<ExecutionProjectOverviewProps> = ({ project, issues, dailyUpdates }) => {
    // Mock calculations for demo purposes
    const budgetUtilized = (project.totalExpenses || 0) / project.budget * 100;
    const daysRemaining = Math.max(0, Math.ceil((new Date(project.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

    // Dynamic Calculations
    const criticalIssues = issues.filter(i => i.priority === 'High' && i.status !== 'Resolved').length;

    // Latest Activity (from Daily Updates)
    const recentActivity = dailyUpdates.slice(0, 3); // Top 3

    return (
        <div className="space-y-6">
            {/* Top Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <ChartBarIcon className="w-16 h-16 text-blue-600" />
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600">
                            <ArrowTrendingUpIcon className="w-5 h-5" />
                        </div>
                        <h4 className="text-sm font-medium text-gray-500">Progress</h4>
                    </div>
                    <div className="flex items-end gap-2">
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">{project.progress}%</span>
                        <span className="text-sm text-green-600 mb-1">On Track</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full mt-3 overflow-hidden">
                        <div className="h-full bg-blue-600 rounded-full" style={{ width: `${project.progress}%` }} />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <CurrencyRupeeIcon className="w-16 h-16 text-emerald-600" />
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-600">
                            <CurrencyRupeeIcon className="w-5 h-5" />
                        </div>
                        <h4 className="text-sm font-medium text-gray-500">Budget Utilized</h4>
                    </div>
                    <div className="flex items-end gap-2">
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">{Math.round(budgetUtilized)}%</span>
                        <span className="text-sm text-gray-500 mb-1">of {formatCurrencyINR(project.budget)}</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full mt-3 overflow-hidden">
                        <div className={`h-full rounded-full ${budgetUtilized > 90 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(budgetUtilized, 100)}%` }} />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <ClockIcon className="w-16 h-16 text-orange-600" />
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-orange-600">
                            <ClockIcon className="w-5 h-5" />
                        </div>
                        <h4 className="text-sm font-medium text-gray-500">Time Remaining</h4>
                    </div>
                    <div className="flex items-end gap-2">
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">{daysRemaining}</span>
                        <span className="text-sm text-gray-500 mb-1">Days</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-3">Deadline: {formatDate(project.endDate)}</div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <ExclamationTriangleIcon className="w-16 h-16 text-red-600" />
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600">
                            <ExclamationTriangleIcon className="w-5 h-5" />
                        </div>
                        <h4 className="text-sm font-medium text-gray-500">Critical Issues</h4>
                    </div>
                    <div className="flex items-end gap-2">
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">{criticalIssues}</span>
                        <span className="text-sm text-red-600 mb-1">Need Attention</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-3">View Issues Tab for details</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content Column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Activity Feed */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-4">Site Activity Feed</h3>
                        <div className="space-y-6">
                            {recentActivity.length > 0 ? (
                                recentActivity.map((log, idx) => (
                                    <div key={log.id} className="flex gap-4 relative">
                                        {/* Timeline line */}
                                        {idx !== recentActivity.length - 1 && <div className="absolute left-[19px] top-8 bottom-[-24px] w-0.5 bg-gray-200 dark:bg-gray-700" />}

                                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 z-10">
                                            <CheckCircleIcon className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">{log.workDescription.substring(0, 80)}...</p>
                                            <p className="text-xs text-gray-500 mt-1">Logged {formatDistanceToNow(new Date(log.createdAt))} ago • {log.manpowerCount} Workers</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-sm text-gray-500 text-center py-4">No recent site activity logged.</div>
                            )}
                        </div>
                    </div>

                    {/* Upcoming Milestones */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-gray-900 dark:text-white">Upcoming Milestones</h3>
                            <button className="text-xs text-blue-600 hover:text-blue-700">View Timeline</button>
                        </div>
                        <div className="space-y-3">
                            {/* Mock Milestones - You can make this dynamic later */}
                            <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-slate-700/30 rounded-lg border border-gray-100 dark:border-gray-700">
                                <div className="flex-shrink-0 w-12 text-center bg-white dark:bg-slate-700 rounded p-1 shadow-sm">
                                    <div className="text-xs text-gray-500 uppercase">Feb</div>
                                    <div className="font-bold text-gray-900 dark:text-white">15</div>
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-medium text-gray-900 dark:text-white">Phase 1 Completion (Civil)</h4>
                                    <p className="text-xs text-gray-500">3 days overdue</p>
                                </div>
                                <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-700 rounded-full">Delayed</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Column (unchanged) */}
                <div className="space-y-6">
                    {/* Site Conditions */}
                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
                        <h3 className="font-bold mb-1 opacity-90">Site Conditions</h3>
                        <p className="text-xs opacity-75 mb-4">Today, {new Date().toLocaleDateString()}</p>

                        <div className="flex items-center gap-4 mb-4">
                            <div className="text-4xl font-bold">28°C</div>
                            <div className="text-sm opacity-90">Sunny<br />Humidity: 45%</div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-sm opacity-90">
                                <span>Work Permits</span>
                                <span className="font-semibold">Valid</span>
                            </div>
                            <div className="flex justify-between text-sm opacity-90">
                                <span>Noise Curfew</span>
                                <span className="font-semibold">6:00 PM</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExecutionProjectOverview;
