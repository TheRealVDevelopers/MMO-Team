import React, { useState, useEffect } from 'react';
import { DrawingTask, SiteVisit, Project, LeadPipelineStatus, DesignSiteProjectStatus, UserRole } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useProjects } from '../../hooks/useProjects';
import { useAutomatedTaskCreation } from '../../hooks/useAutomatedTaskCreation';
import MyDayPage from './shared/MyDayPage';
import CommunicationDashboard from '../communication/CommunicationDashboard';
import EscalateIssuePage from '../escalation/EscalateIssuePage';
import ProjectsWorkflowPage from './design-site-team/ProjectsWorkflowPage';
import MyPerformancePage from './drawing-team/MyPerformancePage';

const DesignAndSiteEngineeringDashboard: React.FC<{ currentPage: string, setCurrentPage: (page: string) => void }> = ({ currentPage, setCurrentPage }) => {
    const { currentUser } = useAuth();
    const { projects, loading, updateProject } = useProjects();

    // Filter projects assigned to this team member or all if manager
    const myProjects = projects.filter(p =>
        p.assignedEngineerId === currentUser?.id ||
        p.drawingTeamMemberId === currentUser?.id ||
        p.assignedTeam?.execution?.includes(currentUser?.id || '') ||
        p.assignedTeam?.site_engineer === currentUser?.id ||
        p.assignedTeam?.drawing === currentUser?.id ||
        ['Super Admin', 'Admin', 'admin', 'Manager', 'manager', UserRole.SUPER_ADMIN, UserRole.SALES_GENERAL_MANAGER].includes(currentUser?.role || '')
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
            case 'create-quotation': // FIXED: Added routing for Create Quotation
                return (
                    <ProjectsWorkflowPage
                        projects={myProjects}
                        loading={loading}
                        onUpdateProject={updateProject}
                        setCurrentPage={setCurrentPage}
                    // Optionally pass a prop to auto-open quotation modal if supported
                    />
                );
            default:
                return <MyDayPage />;
        }
    };

    return renderPage();
};

export default DesignAndSiteEngineeringDashboard;
