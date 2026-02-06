import React, { useState, useMemo } from 'react';
import ExecutionGanttPage from './ExecutionGanttPage';
import ExecutionProjectsPage from './ExecutionProjectsPage';
import ExecutionProjectDetail from './ExecutionProjectDetail';
import ExecutionTeamManagementPage from './ExecutionTeamManagementPage';
import ExecutionApprovalQueue from './ExecutionApprovalQueue';
import TaskAssignmentPage from './TaskAssignmentPage';
import BudgetManagementPage from './BudgetManagementPage';
import { AnimatePresence, motion } from 'framer-motion';
import MyDayPage from '../shared/MyDayPage';
import CommunicationDashboard from '../../communication/CommunicationDashboard';
import EscalateIssuePage from '../../escalation/EscalateIssuePage';
import { useProjects } from '../../../hooks/useProjects';
import { useAuth } from '../../../context/AuthContext';
import WorkQueuePage from '../shared/WorkQueuePage';

interface ExecutionDashboardProps {
    currentPage: string;
    setCurrentPage: (page: string) => void;
}

// This component manages the view state for the Execution Team Dashboard
const ExecutionDashboard: React.FC<ExecutionDashboardProps> = ({ currentPage, setCurrentPage }) => {
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const { currentUser } = useAuth();

    // Fetch real projects from Firestore
    const { projects: allProjects, loading } = useProjects();

    // Filter projects assigned to current execution team member
    const userProjects = useMemo(() => {
        if (!currentUser) return [];
        return allProjects.filter(project => {
            // Check if user is in execution team array or is the project head
            const executionTeam = project.assignedTeam?.execution || [];
            return executionTeam.includes(currentUser.id) || project.projectHeadId === currentUser.id;
        });
    }, [allProjects, currentUser]);

    const handleProjectSelect = (projectId: string) => {
        setSelectedProjectId(projectId);
    };

    const handleBack = () => {
        setSelectedProjectId(null);
    };

    // Find project from user's assigned projects only
    const selectedProject = selectedProjectId ? userProjects.find(p => p.id === selectedProjectId) : null;

    const renderContent = () => {
        switch (currentPage) {
            case 'my-day':
                return (
                    <div className="h-full overflow-y-auto">
                        <MyDayPage />
                    </div>
                );
            case 'work-queue':
                return (
                    <div className="h-full overflow-y-auto">
                        <WorkQueuePage />
                    </div>
                );
            case 'gantt':
                return (
                    <div className="h-full overflow-y-auto">
                        <ExecutionGanttPage />
                    </div>
                );
            case 'board':
                return (
                    <div className="h-[calc(100vh-64px)] overflow-hidden bg-subtle-background">
                        {loading ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center">
                                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
                                    <p className="text-text-secondary">Loading your projects...</p>
                                </div>
                            </div>
                        ) : userProjects.length === 0 ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center max-w-md p-8">
                                    <div className="w-20 h-20 bg-subtle-background rounded-full flex items-center justify-center mx-auto mb-4">
                                        <svg className="w-10 h-10 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-bold text-text-primary mb-2">No Projects Assigned</h3>
                                    <p className="text-text-secondary">You don't have any projects assigned to you yet. Please contact your project manager for assignments.</p>
                                </div>
                            </div>
                        ) : (
                            <AnimatePresence mode="wait">
                                {!selectedProjectId ? (
                                    <motion.div
                                        key="list"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="h-full overflow-y-auto"
                                    >
                                        <ExecutionProjectsPage
                                            onProjectSelect={handleProjectSelect}
                                            projects={userProjects}
                                        />
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
                                            <div className="p-8 text-center text-error">Project not found or access denied</div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        )}
                    </div>
                );
            case 'team':
                return (
                    <div className="h-full overflow-y-auto">
                        <ExecutionTeamManagementPage />
                    </div>
                );
            case 'approvals':
                return (
                    <div className="h-full overflow-y-auto">
                        <ExecutionApprovalQueue />
                    </div>
                );
            case 'tasks':
                return (
                    <div className="h-full overflow-y-auto">
                        <TaskAssignmentPage />
                    </div>
                );
            case 'budget':
                return (
                    <div className="h-full overflow-y-auto">
                        <BudgetManagementPage />
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
