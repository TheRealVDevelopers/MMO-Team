import React from 'react';
import OverviewDashboard from './super-admin/OverviewDashboard';
import TeamManagementPage from './super-admin/TeamManagementPage';
import ProjectTrackingPage from './super-admin/ProjectTrackingPage';
import LeadsManagementPage from './super-admin/LeadsManagementPage';
import ReportsPage from './super-admin/ReportsPage';

interface SuperAdminDashboardProps {
    currentPage: string;
    setCurrentPage: (page: string) => void;
}

const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ currentPage, setCurrentPage }) => {
    switch (currentPage) {
        case 'overview':
            return <OverviewDashboard />;
        case 'team':
            return <TeamManagementPage setCurrentPage={setCurrentPage} />;
        case 'projects':
            return <ProjectTrackingPage setCurrentPage={setCurrentPage} />;
        case 'leads':
            return <LeadsManagementPage setCurrentPage={setCurrentPage} />;
        case 'reports':
            return <ReportsPage setCurrentPage={setCurrentPage} />;
        default:
            return <OverviewDashboard />;
    }
};

export default SuperAdminDashboard;
