import React, { useState } from 'react';
import { UserRole, TaskType, TaskStatus } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useCaseTasks } from '../../hooks/useCaseTasks';
import MyDayPage from './shared/MyDayPage';
import CommunicationDashboard from '../communication/CommunicationDashboard';
import EscalateIssuePage from '../escalation/EscalateIssuePage';
import { ContentCard, SectionHeader } from './shared/DashboardUI';

const DesignAndSiteEngineeringDashboard: React.FC<{ currentPage: string, setCurrentPage: (page: string) => void }> = ({ currentPage, setCurrentPage }) => {
    const { currentUser } = useAuth();
    const { tasks, loading } = useCaseTasks({
        organizationId: currentUser?.organizationId,
        assignedTo: currentUser?.id,
        type: TaskType.SITE_VISIT, // Only site visit tasks for now
    });

    const renderPage = () => {
        switch (currentPage) {
            case 'my-day':
                return <MyDayPage />;
            case 'communication':
                return <CommunicationDashboard />;
            case 'escalate-issue':
                return <EscalateIssuePage setCurrentPage={setCurrentPage} />;
            default:
                return (
                    <div className="space-y-6">
                        <SectionHeader
                            title="Site Visit & Drawing Tasks"
                            subtitle="Manage site inspections and design deliverables"
                        />
                        {loading ? (
                            <div className="text-center py-8">Loading tasks...</div>
                        ) : (
                            <div className="grid gap-4">
                                {tasks.map(task => (
                                    <ContentCard key={task.id}>
                                        <h3 className="font-bold text-lg">{task.type} Task</h3>
                                        <p className="text-sm text-text-secondary">Case ID: {task.caseId}</p>
                                        <p className="text-xs text-text-tertiary mt-2">Status: {task.status}</p>
                                    </ContentCard>
                                ))}
                                {tasks.length === 0 && (
                                    <div className="text-center py-8 text-text-tertiary">
                                        No site visit tasks assigned
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
        }
    };

    return renderPage();
};

export default DesignAndSiteEngineeringDashboard;
