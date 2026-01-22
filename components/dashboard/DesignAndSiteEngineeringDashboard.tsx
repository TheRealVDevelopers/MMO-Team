import React, { useState, useEffect } from 'react';
import { DrawingTask, SiteVisit, Project, LeadPipelineStatus } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useProjects } from '../../hooks/useProjects';
import { useAutomatedTaskCreation } from '../../hooks/useAutomatedTaskCreation';
import MyDayPage from './shared/MyDayPage';
import CommunicationDashboard from '../communication/CommunicationDashboard';
import EscalateIssuePage from '../escalation/EscalateIssuePage';
import ProjectsWorkflowPage from './design-site-team/ProjectsWorkflowPage';
import MyPerformancePage from './drawing-team/MyPerformancePage';

// Status for design/site projects
export enum DesignSiteProjectStatus {
    WAITING_FOR_SITE_INSPECTION = 'Waiting for Site Inspection',
    WAITING_FOR_DRAWING = 'Waiting for Drawing',
    COMPLETED = 'Completed'
}

const DesignAndSiteEngineeringDashboard: React.FC<{ currentPage: string, setCurrentPage: (page: string) => void }> = ({ currentPage, setCurrentPage }) => {
    const { currentUser } = useAuth();
    const { projects, loading, updateProject } = useProjects();

    // Filter projects assigned to this team member or all if manager
    const myProjects = projects.filter(p =>
        p.assignedEngineerId === currentUser?.id ||
        p.drawingTeamMemberId === currentUser?.id
    );

    const renderPage = () => {
        switch (currentPage) {
            case 'my-day':
                return <MyDayPage />;
            case 'projects':
                return (
                    <ProjectsWorkflowPage
                        projects={myProjects}
                        loading={loading}
                        onUpdateProject={updateProject}
                        setCurrentPage={setCurrentPage}
                    />
                );
            case 'performance':
                return <MyPerformancePage setCurrentPage={setCurrentPage} />;
            case 'communication':
                return <CommunicationDashboard />;
            case 'escalate-issue':
                return <EscalateIssuePage setCurrentPage={setCurrentPage} />;
            default:
                return <MyDayPage />;
        }
    };

    return renderPage();
};

export default DesignAndSiteEngineeringDashboard;
