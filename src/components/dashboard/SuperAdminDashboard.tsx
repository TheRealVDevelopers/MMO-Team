
import React from 'react';
import OverviewDashboard from './super-admin/OverviewDashboard';
import TeamManagementPage from './super-admin/TeamManagementPage';
import ProjectTrackingPage from './super-admin/ProjectTrackingPage';
import LeadsManagementPage from './super-admin/LeadsManagementPage';
import ReportsPage from './super-admin/ReportsPage';
import CommunicationDashboard from '../communication/CommunicationDashboard';
import ComplaintManagementPage from './super-admin/ComplaintManagementPage';
import EscalateIssuePage from '../escalation/EscalateIssuePage';
import ApprovalsPage from './super-admin/ApprovalsPage';
import RegistrationsPage from './super-admin/RegistrationsPage';
import FinancePage from './super-admin/FinancePage';
import OrganizationsPage from './admin/OrganizationsPage';

interface SuperAdminDashboardProps {
    currentPage: string;
    setCurrentPage: (page: string) => void;
}

const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ currentPage, setCurrentPage }) => {
    const [selectedMemberId, setSelectedMemberId] = React.useState<string | undefined>(undefined);
    const [selectedTab, setSelectedTab] = React.useState<'history' | undefined>(undefined);
    const [selectedDate, setSelectedDate] = React.useState<string | undefined>(undefined);

    const handleNavigateToMember = (userId: string, tab?: 'history', date?: string) => {
        setSelectedMemberId(userId);
        setSelectedTab(tab);
        setSelectedDate(date);
        setCurrentPage('team');
    };

    switch (currentPage) {
        case 'overview':
            return (
                <OverviewDashboard
                    setCurrentPage={setCurrentPage}
                    onNavigateToMember={handleNavigateToMember}
                />
            );
        case 'team':
            return (
                <TeamManagementPage
                    setCurrentPage={setCurrentPage}
                    initialMemberId={selectedMemberId}
                    initialTab={selectedTab}
                    initialDate={selectedDate}
                />
            );
        case 'projects':
            return <ProjectTrackingPage setCurrentPage={setCurrentPage} />;
        case 'leads':
            return <LeadsManagementPage setCurrentPage={setCurrentPage} />;
        case 'communication':
            return <CommunicationDashboard />;
        case 'approvals':
            return <ApprovalsPage />;
        case 'registrations':
            return <RegistrationsPage />;
        case 'reports':
            return <ReportsPage setCurrentPage={setCurrentPage} />;
        case 'complaints':
            return <ComplaintManagementPage setCurrentPage={setCurrentPage} />;
        case 'escalate-issue':
            return <EscalateIssuePage setCurrentPage={setCurrentPage} />;
        case 'finance':
            return <FinancePage />;
        case 'organizations':
            return <OrganizationsPage setCurrentPage={setCurrentPage} />;
        default:
            return <OverviewDashboard setCurrentPage={setCurrentPage} />;
    }
};

export default SuperAdminDashboard;