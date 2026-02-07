import React from 'react';
import { motion } from 'framer-motion';
import { FolderIcon, CalendarIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

interface ClientProject {
    id: string;
    title: string;
    status: string;
    clientName?: string;
    updatedAt?: any;
}

interface ClientProjectSelectorProps {
    projects: ClientProject[];
    onSelectProject: (projectId: string) => void;
    clientName?: string;
}

const ClientProjectSelector: React.FC<ClientProjectSelectorProps> = ({
    projects,
    onSelectProject,
    clientName
}) => {
    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'active':
                return 'bg-green-100 text-green-800';
            case 'completed':
                return 'bg-blue-100 text-blue-800';
            case 'lead':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-2xl">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-text-primary mb-2">
                        Welcome{clientName ? `, ${clientName}` : ''}!
                    </h1>
                    <p className="text-text-secondary">
                        Select a project to view its details and updates
                    </p>
                </div>

                {/* Project Cards */}
                <div className="space-y-4">
                    {projects.map((project, index) => (
                        <motion.div
                            key={project.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            onClick={() => onSelectProject(project.id)}
                            className="bg-surface border border-border rounded-xl p-6 cursor-pointer hover:border-primary hover:shadow-lg transition-all group"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                                        <FolderIcon className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-text-primary group-hover:text-primary transition-colors">
                                            {project.title}
                                        </h3>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(project.status)}`}>
                                                {project.status || 'In Progress'}
                                            </span>
                                            <span className="flex items-center gap-1 text-xs text-text-tertiary">
                                                <CalendarIcon className="w-3.5 h-3.5" />
                                                Updated: {formatDate(project.updatedAt)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <ArrowRightIcon className="w-5 h-5 text-text-tertiary group-hover:text-primary transition-colors" />
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Empty State */}
                {projects.length === 0 && (
                    <div className="text-center py-16 bg-surface rounded-xl border border-border">
                        <FolderIcon className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-text-primary mb-2">No Projects Found</h3>
                        <p className="text-text-secondary">
                            You don't have any projects assigned to your account yet.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClientProjectSelector;
