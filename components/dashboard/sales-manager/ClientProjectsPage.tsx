import React, { useState } from 'react';
import {
    MagnifyingGlassIcon,
    FunnelIcon,
    ClockIcon,
    CheckCircleIcon,
    ChatBubbleLeftRightIcon,
    ExclamationTriangleIcon,
    UserCircleIcon,
    CalendarIcon,
    PencilIcon,
    EyeIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';
import {
    useProjects,
    updateProject
} from '../../../hooks/useProjects';
import { Project } from '../../../types';
import { formatDate, formatCurrencyINR } from '../../../constants';

interface ProjectStage {
    id: number;
    name: string;
}

const ClientProjectsPage: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStage, setFilterStage] = useState('all');
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [showStageUpdateModal, setShowStageUpdateModal] = useState(false);

    // Get projects from unified Firestore collection
    const { projects, loading, error } = useProjects();

    const stages: ProjectStage[] = [
        { id: 1, name: 'Consultation' },
        { id: 2, name: 'Requirement Finalization' },
        { id: 3, name: 'Design Phase' },
        { id: 4, name: 'Quotation & Approval' },
        { id: 5, name: 'Material Selection' },
        { id: 6, name: 'Manufacturing' },
        { id: 7, name: 'Site Execution' },
        { id: 8, name: 'Installation' },
        { id: 9, name: 'Final Handover' }
    ];

    const getCurrentStageIndex = (p: Project) => {
        if (p.stages && p.stages.length > 0) {
            const completedCount = p.stages.filter(s => s.status === 'Completed').length;
            return Math.min(stages.length, Math.max(1, completedCount + 1));
        }
        const idx = Math.round((p.progress || 0) / 100 * stages.length);
        return Math.min(stages.length, Math.max(1, idx));
    };

    const getStageProgress = (p: Project) => {
        return Math.max(0, Math.min(100, p.progress || Math.round((getCurrentStageIndex(p) / stages.length) * 100)));
    };

    const filteredProjects = projects.filter(project => {
        const matchesSearch =
            (project.clientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (project.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (project.projectName || '').toLowerCase().includes(searchTerm.toLowerCase());

        const matchesFilter =
            filterStage === 'all' ||
            getCurrentStageIndex(project) === parseInt(filterStage);

        return matchesSearch && matchesFilter;
    });

    const handleUpdateStage = (project: Project) => {
        setSelectedProject(project);
        setShowStageUpdateModal(true);
    };

    const confirmUpdateStage = async (newStage: number) => {
        if (selectedProject) {
            try {
                const newProgress = Math.round((newStage / stages.length) * 100);
                await updateProject(selectedProject.id, {
                    progress: newProgress,
                    history: [
                        ...((selectedProject.history || [])),
                        {
                            action: 'Stage Progress Updated',
                            user: 'Sales Team',
                            timestamp: new Date(),
                            notes: `Stage updated to ${stages[newStage - 1].name} (${newProgress}%)`
                        }
                    ]
                });

                setShowStageUpdateModal(false);
                setSelectedProject(null);
            } catch (error) {
                console.error('Error updating stage:', error);
                alert('Failed to update stage. Please try again.');
            }
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Client Projects</h1>
                    <p className="text-text-secondary text-sm mt-1">Manage and track all client projects</p>
                </div>
                <div className="text-sm text-text-secondary">
                    Total Projects: <span className="font-bold text-text-primary">{projects.length}</span>
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="bg-white rounded-xl shadow-sm border border-border p-12 text-center">
                    <p className="text-text-secondary">Loading projects...</p>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                    <p className="text-red-800">Error loading projects: {error.message}</p>
                    <p className="text-sm text-red-600 mt-2">Please ensure Firebase rules allow read access.</p>
                </div>
            )}

            {/* Filters & Search */}
            {!loading && !error && (
                <>
                    <div className="bg-surface rounded-xl shadow-sm border border-border p-4">
                        <div className="flex flex-col md:flex-row gap-4">
                            {/* Search */}
                            <div className="flex-1 relative">
                                <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" />
                                <input
                                    type="text"
                                    placeholder="Search by client name, project name or project ID..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>

                            {/* Stage Filter */}
                            <div className="md:w-64">
                                <div className="relative">
                                    <FunnelIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" />
                                    <select
                                        value={filterStage}
                                        onChange={(e) => setFilterStage(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
                                    >
                                        <option value="all">All Stages</option>
                                        {stages.map(stage => (
                                            <option key={stage.id} value={stage.id.toString()}>{stage.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Projects Grid */}
                    <div className="grid grid-cols-1 gap-6">
                        {filteredProjects.length === 0 ? (
                            <div className="bg-white rounded-xl shadow-sm border border-border p-12 text-center">
                                <p className="text-text-secondary">No projects found</p>
                            </div>
                        ) : (
                            filteredProjects.map(project => (
                                <div key={project.id} className="bg-white rounded-xl shadow-sm border border-border hover:shadow-md transition-shadow duration-300">
                                    <div className="p-6">
                                        {/* Header Row */}
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-3 mb-2">
                                                    <h3 className="text-lg font-bold text-text-primary">{project.clientName}</h3>
                                                    <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full">
                                                        {project.id}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-text-secondary">{project.projectName} • {project.clientAddress}</p>
                                            </div>

                                            {/* Notification Badges */}
                                            <div className="flex items-center space-x-2">
                                                {Array.isArray(project.issues) && project.issues.length > 0 && (
                                                    <div className="flex items-center space-x-1 px-3 py-1 bg-red-50 rounded-full">
                                                        <ExclamationTriangleIcon className="w-4 h-4 text-red-600" />
                                                        <span className="text-xs font-bold text-red-600">{project.issues.length}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="mb-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                                                    Current Stage: {stages[getCurrentStageIndex(project) - 1]?.name || 'N/A'}
                                                </span>
                                                <span className="text-xs font-bold text-primary">{getStageProgress(project)}%</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-primary h-2 rounded-full transition-all duration-500"
                                                    style={{ width: `${getStageProgress(project)}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        {/* Info Grid */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 pt-4 border-t border-border">
                                            <div>
                                                <p className="text-xs text-text-secondary mb-1">Consultant</p>
                                                <div className="flex items-center space-x-1">
                                                    <UserCircleIcon className="w-4 h-4 text-primary" />
                                                    <p className="text-sm font-medium text-text-primary">{project.assignedTeam?.drawing || 'Unassigned'}</p>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-xs text-text-secondary mb-1">Budget</p>
                                                <p className="text-sm font-medium text-text-primary">{formatCurrencyINR(project.budget || 0)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-text-secondary mb-1">Expected Completion</p>
                                                <div className="flex items-center space-x-1">
                                                    <CalendarIcon className="w-4 h-4 text-primary" />
                                                    <p className="text-sm font-medium text-text-primary">{formatDate(project.endDate)}</p>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-xs text-text-secondary mb-1">Status</p>
                                                <div className="flex items-center space-x-1 text-primary">
                                                    <CheckCircleSolid className="w-4 h-4" />
                                                    <p className="text-sm font-medium">{project.status}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
                                            <button
                                                onClick={() => handleUpdateStage(project)}
                                                className="px-4 py-2 bg-gray-100 text-text-primary text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
                                            >
                                                <PencilIcon className="w-4 h-4" />
                                                <span>Update Stage</span>
                                            </button>
                                            <button
                                                className="px-4 py-2 bg-gray-100 text-text-primary text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
                                            >
                                                <ChatBubbleLeftRightIcon className="w-4 h-4" />
                                                <span>View Chat</span>
                                            </button>
                                            <button
                                                className="px-4 py-2 bg-gray-100 text-text-primary text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
                                            >
                                                <EyeIcon className="w-4 h-4" />
                                                <span>View Details</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Stage Update Modal */}
                    {showStageUpdateModal && selectedProject && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
                            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
                                <h3 className="text-2xl font-bold text-text-primary mb-4">Update Project Stage</h3>
                                <p className="text-text-secondary mb-6">
                                    Current stage: <span className="font-bold text-text-primary">{stages[getCurrentStageIndex(selectedProject) - 1]?.name || 'N/A'}</span>
                                </p>
                                <div className="space-y-2 mb-6 max-h-80 overflow-y-auto">
                                    {stages.map((stage) => (
                                        <button
                                            key={stage.id}
                                            onClick={() => confirmUpdateStage(stage.id)}
                                            className={`w-full px-4 py-3 text-left rounded-xl transition-colors ${stage.id === getCurrentStageIndex(selectedProject)
                                                ? 'bg-primary text-white'
                                                : 'bg-gray-50 text-text-primary hover:bg-gray-100'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium">{stage.name}</span>
                                                {stage.id === getCurrentStageIndex(selectedProject) && (
                                                    <CheckCircleSolid className="w-5 h-5" />
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={() => {
                                        setShowStageUpdateModal(false);
                                        setSelectedProject(null);
                                    }}
                                    className="w-full px-4 py-3 bg-gray-100 text-text-primary font-medium rounded-xl hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default ClientProjectsPage;
