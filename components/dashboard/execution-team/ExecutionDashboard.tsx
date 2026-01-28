import React, { useState } from 'react';
import { PROJECTS } from '../../../constants';
import ExecutionProjectsPage from './ExecutionProjectsPage';
import ExecutionProjectDetail from './ExecutionProjectDetail';
import { AnimatePresence, motion } from 'framer-motion';
import MyDayPage from '../shared/MyDayPage';
import CommunicationDashboard from '../../communication/CommunicationDashboard';
import EscalateIssuePage from '../../escalation/EscalateIssuePage';

interface ExecutionDashboardProps {
    currentPage: string;
    setCurrentPage: (page: string) => void;
}

// This component manages the view state for the Execution Team Dashboard
const ExecutionDashboard: React.FC<ExecutionDashboardProps> = ({ currentPage, setCurrentPage }) => {
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

    const handleProjectSelect = (projectId: string) => {
        setSelectedProjectId(projectId);
    };

    const handleBack = () => {
        setSelectedProjectId(null);
    };

    const selectedProject = selectedProjectId ? PROJECTS.find(p => p.id === selectedProjectId) : null;

    const renderContent = () => {
        switch (currentPage) {
            case 'my-day':
                return (
                    <div className="h-full overflow-y-auto">
                        <MyDayPage />
                    </div>
                );
            case 'board':
                return (
                    <div className="h-[calc(100vh-64px)] overflow-hidden bg-gray-50 dark:bg-slate-900">
                        <AnimatePresence mode="wait">
                            {!selectedProjectId ? (
                                <motion.div
                                    key="list"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="h-full overflow-y-auto"
                                >
                                    <ExecutionProjectsPage onProjectSelect={handleProjectSelect} />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="detail"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="h-full"
                                >
                                    {selectedProject ? (
                                        <ExecutionProjectDetail
                                            project={selectedProject}
                                            onBack={handleBack}
                                        />
                                    ) : (
                                        <div className="p-8 text-center text-red-500">Project not found</div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                );
            case 'communication':
                return (
                    <div className="h-full overflow-y-auto">
                        <CommunicationDashboard />
                    </div>
                );
            case 'escalate-issue':
                return (
                    <div className="h-full overflow-y-auto">
                        <EscalateIssuePage setCurrentPage={setCurrentPage} />
                    </div>
                );
            default:
                return (
                    <div className="h-full overflow-y-auto">
                        <MyDayPage />
                    </div>
                );
        }
    };

    return renderContent();
};

export default ExecutionDashboard;
