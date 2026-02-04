import React, { useState, useMemo } from 'react';
import { useProjects } from '../../../hooks/useProjects';
import { Project, ProjectStatus, ExecutionStage } from '../../../types';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircleIcon,
    PlusIcon,
    TrashIcon,
    CalendarDaysIcon,
    UserGroupIcon,
    ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';
import { useUsers } from '../../../hooks/useUsers';
import { UserRole } from '../../../types';

const BlueprintCreationPage: React.FC = () => {
    const { projects, updateProject, loading } = useProjects();
    const { users } = useUsers();
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Blueprint form state
    const [stages, setStages] = useState<{ name: string; duration: number; assignee: string }[]>([
        { name: 'Site Preparation', duration: 7, assignee: '' },
        { name: 'Structural Work', duration: 14, assignee: '' },
        { name: 'Interior Finishing', duration: 21, assignee: '' },
    ]);

    // Filter projects that need blueprint creation (EXECUTION_APPROVED)
    const pendingBlueprintProjects = useMemo(() =>
        projects.filter(p => p.status === ProjectStatus.EXECUTION_APPROVED),
        [projects]
    );

    // Get execution team members
    const executionMembers = useMemo(() =>
        users.filter(u => u.role === UserRole.EXECUTION_TEAM || u.role === UserRole.PROJECT_HEAD),
        [users]
    );

    const addStage = () => {
        setStages([...stages, { name: '', duration: 7, assignee: '' }]);
    };

    const removeStage = (index: number) => {
        setStages(stages.filter((_, i) => i !== index));
    };

    const updateStage = (index: number, field: string, value: string | number) => {
        const updated = [...stages];
        updated[index] = { ...updated[index], [field]: value };
        setStages(updated);
    };

    const handleSubmitBlueprint = async () => {
        if (!selectedProject || stages.length === 0) {
            alert("Please add at least one execution stage.");
            return;
        }

        const emptyStages = stages.filter(s => !s.name.trim());
        if (emptyStages.length > 0) {
            alert("All stages must have a name.");
            return;
        }

        setIsSubmitting(true);
        try {
            const executionStages: ExecutionStage[] = stages.map((s, index) => ({
                id: `stage-${Date.now()}-${index}`,
                name: s.name,
                durationDays: s.duration,
                assigneeId: s.assignee,
                status: 'Pending',
                order: index + 1,
            }));

            await updateProject(selectedProject.id, {
                status: ProjectStatus.BLUEPRINT_CREATED,
                executionBlueprint: {
                    stages: executionStages,
                    createdAt: new Date(),
                    totalDurationDays: stages.reduce((sum, s) => sum + s.duration, 0),
                },
                stages: executionStages,
            });

            setSelectedProject(null);
            setStages([
                { name: 'Site Preparation', duration: 7, assignee: '' },
                { name: 'Structural Work', duration: 14, assignee: '' },
                { name: 'Interior Finishing', duration: 21, assignee: '' },
            ]);
        } catch (error) {
            console.error("Error creating blueprint:", error);
            alert("Failed to create blueprint. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full bg-subtle-background">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-text-secondary">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-subtle-background min-h-full">
            <header className="mb-8">
                <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3">
                    <ClipboardDocumentListIcon className="w-8 h-8 text-primary" />
                    Blueprint Creation
                </h1>
                <p className="text-text-secondary mt-2">
                    Create execution blueprints for approved projects
                </p>
            </header>

            {pendingBlueprintProjects.length === 0 ? (
                <div className="bg-surface rounded-xl p-12 text-center">
                    <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-text-primary mb-2">No Pending Blueprints</h3>
                    <p className="text-text-secondary">All approved projects have blueprints created.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Project List */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-text-primary">
                            Awaiting Blueprint ({pendingBlueprintProjects.length})
                        </h2>
                        {pendingBlueprintProjects.map(project => (
                            <motion.div
                                key={project.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`bg-surface rounded-lg p-4 cursor-pointer border-2 transition-all ${selectedProject?.id === project.id
                                        ? 'border-primary shadow-lg'
                                        : 'border-transparent hover:border-border'
                                    }`}
                                onClick={() => setSelectedProject(project)}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-bold text-text-primary">{project.projectName}</h3>
                                        <p className="text-sm text-text-secondary">{project.clientName}</p>
                                    </div>
                                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                                        Approved
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 mt-3 text-xs text-text-secondary">
                                    <span>{project.location}</span>
                                    <span>•</span>
                                    <span>Budget: ₹{project.budget?.toLocaleString()}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Blueprint Form */}
                    <AnimatePresence mode="wait">
                        {selectedProject && (
                            <motion.div
                                key={selectedProject.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="bg-surface rounded-xl p-6 sticky top-6"
                            >
                                <h2 className="text-xl font-bold text-text-primary mb-2">
                                    Create Blueprint
                                </h2>
                                <p className="text-sm text-text-secondary mb-6">
                                    For: {selectedProject.projectName}
                                </p>

                                {/* Stages */}
                                <div className="space-y-4 mb-6">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold text-text-primary flex items-center gap-2">
                                            <CalendarDaysIcon className="w-5 h-5" />
                                            Execution Stages
                                        </h3>
                                        <button
                                            onClick={addStage}
                                            className="flex items-center gap-1 text-sm text-primary hover:underline"
                                        >
                                            <PlusIcon className="w-4 h-4" /> Add Stage
                                        </button>
                                    </div>

                                    {stages.map((stage, index) => (
                                        <div key={index} className="bg-subtle-background rounded-lg p-4 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-medium text-text-secondary">Stage {index + 1}</span>
                                                {stages.length > 1 && (
                                                    <button
                                                        onClick={() => removeStage(index)}
                                                        className="text-red-500 hover:text-red-700"
                                                    >
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                            <input
                                                type="text"
                                                value={stage.name}
                                                onChange={(e) => updateStage(index, 'name', e.target.value)}
                                                placeholder="Stage name"
                                                className="w-full p-2 bg-surface border border-border rounded-lg text-text-primary"
                                            />
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-xs text-text-secondary">Duration (days)</label>
                                                    <input
                                                        type="number"
                                                        value={stage.duration}
                                                        onChange={(e) => updateStage(index, 'duration', parseInt(e.target.value) || 1)}
                                                        min={1}
                                                        className="w-full p-2 bg-surface border border-border rounded-lg text-text-primary"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-text-secondary">Assignee</label>
                                                    <select
                                                        value={stage.assignee}
                                                        onChange={(e) => updateStage(index, 'assignee', e.target.value)}
                                                        className="w-full p-2 bg-surface border border-border rounded-lg text-text-primary"
                                                    >
                                                        <option value="">Select...</option>
                                                        {executionMembers.map(member => (
                                                            <option key={member.id} value={member.id}>
                                                                {member.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Summary */}
                                <div className="bg-primary/5 rounded-lg p-4 mb-6">
                                    <p className="text-sm text-text-primary">
                                        <strong>Total Duration:</strong> {stages.reduce((sum, s) => sum + s.duration, 0)} days
                                    </p>
                                    <p className="text-sm text-text-primary">
                                        <strong>Stages:</strong> {stages.length}
                                    </p>
                                </div>

                                {/* Submit */}
                                <button
                                    onClick={handleSubmitBlueprint}
                                    disabled={isSubmitting}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-hover disabled:opacity-50 transition-colors"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Creating Blueprint...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircleIcon className="w-5 h-5" />
                                            Submit Blueprint
                                        </>
                                    )}
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};

export default BlueprintCreationPage;
