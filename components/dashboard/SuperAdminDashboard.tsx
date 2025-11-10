
import React from 'react';
import OverviewDashboard from './super-admin/OverviewDashboard';
import TeamManagementPage from './super-admin/TeamManagementPage';
import ProjectTrackingPage from './super-admin/ProjectTrackingPage';
import LeadsManagementPage from './super-admin/LeadsManagementPage';
import ReportsPage from './super-admin/ReportsPage';
import CommunicationDashboard from '../communication/CommunicationDashboard';
import ComplaintManagementPage from './super-admin/ComplaintManagementPage';
import EscalateIssuePage from '../escalation/EscalateIssuePage';

interface SuperAdminDashboardProps {
    currentPage: string;
    setCurrentPage: (page: string) => void;
}

const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ currentPage, setCurrentPage }) => {
    switch (currentPage) {
        case 'overview':
            return <OverviewDashboard setCurrentPage={setCurrentPage} />;
        case 'team':
            return <TeamManagementPage setCurrentPage={setCurrentPage} />;
        case 'projects':
            return <ProjectTrackingPage setCurrentPage={setCurrentPage} />;
        case 'leads':
            return <LeadsManagementPage setCurrentPage={setCurrentPage} />;
        case 'communication':
            return <CommunicationDashboard />;
        case 'reports':
            return <ReportsPage setCurrentPage={setCurrentPage} />;
        case 'complaints':
            return <ComplaintManagementPage setCurrentPage={setCurrentPage} />;
        case 'escalate-issue':
            return <EscalateIssuePage setCurrentPage={setCurrentPage} />;
        default:
            return <OverviewDashboard setCurrentPage={setCurrentPage} />;
    }
};

export default SuperAdminDashboard;