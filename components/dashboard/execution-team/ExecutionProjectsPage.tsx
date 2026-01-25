import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MagnifyingGlassIcon, CalendarIcon, UserIcon, MapPinIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { PROJECTS } from '../../../constants'; // Using mock PROJECTS for now
import { Project, ProjectStatus } from '../../../types';

interface ExecutionProjectsPageProps {
    onProjectSelect: (projectId: string) => void;
}

const ExecutionProjectsPage: React.FC<ExecutionProjectsPageProps> = ({ onProjectSelect }) => {
    const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active');
    const [searchQuery, setSearchQuery] = useState('');

    // Filter projects relevant to execution team (mock logic: assigned to execution team or in execution status)
    const relevantProjects = PROJECTS.filter(p =>
        p.status === ProjectStatus.IN_EXECUTION ||
        p.status === ProjectStatus.APPROVED ||
        p.assignedTeam.execution // Check if execution team is assigned
    );

    const filteredProjects = relevantProjects.filter(p => {
        const matchesSearch = p.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.clientName.toLowerCase().includes(searchQuery.toLowerCase());

        if (filter === 'active') return matchesSearch && p.status !== ProjectStatus.COMPLETED;
        if (filter === 'completed') return matchesSearch && p.status === ProjectStatus.COMPLETED;
        return matchesSearch;
    });

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Execution Projects</h1>
                    <p className="text-gray-500 dark:text-gray-400">Manage ongoing site works and schedules</p>
                </div>

                {/* Filter Tabs */}
                <div className="flex bg-gray-100 dark:bg-slate-700 p-1 rounded-lg">
                    {['active', 'completed', 'all'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f as any)}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filter === f
                                ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                                }`}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Search */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="relative max-w-md">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search projects..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                    />
                </div>
            </div>

            {/* Projects Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((project) => (
                    <motion.div
                        key={project.id}
                        layoutId={project.id}
                        onClick={() => onProjectSelect(project.id)}
                        className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all cursor-pointer p-6 group"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold
                                ${project.status === ProjectStatus.IN_EXECUTION ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                    project.status === ProjectStatus.APPROVED ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                        'bg-gray-100 text-gray-700'
                                }`}>
                                {project.status}
                            </span>
                            <span className="text-xs text-gray-400">ID: {project.id}</span>
                        </div>

                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 transition-colors">
                            {project.projectName}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{project.clientName}</p>

                        <div className="space-y-3 mb-6">
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                <MapPinIcon className="w-4 h-4 text-gray-400" />
                                <span className="line-clamp-1">{project.clientAddress}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                <CalendarIcon className="w-4 h-4 text-gray-400" />
                                <span>Deadline: {new Date(project.endDate).toLocaleDateString()}</span>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-4">
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-gray-500">Completion</span>
                                <span className="font-medium text-gray-900 dark:text-white">{project.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                                <div
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${project.progress}%` }}
                                />
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center text-sm font-medium text-blue-600 dark:text-blue-400">
                            View Dashboard
                            <ChevronRightIcon className="w-4 h-4" />
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default ExecutionProjectsPage;
