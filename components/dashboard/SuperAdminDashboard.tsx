
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
import UnifiedRequestInbox from './shared/UnifiedRequestInbox';
import UnifiedProjectsPage from './shared/UnifiedProjectsPage';
import CasesManagementPage from './super-admin/CasesManagementPage';
import TimesheetReportsPage from './super-admin/TimesheetReportsPage';

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
        case 'task-requests':
        case 'approvals':
            return <ApprovalsPage />;
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
        case 'project-hub':
            return <UnifiedProjectsPage roleView="admin" />;
        case 'leads':
            return <LeadsManagementPage setCurrentPage={setCurrentPage} />;
        case 'communication':
            return <CommunicationDashboard />;
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
        case 'cases':
            return <CasesManagementPage />;
        case 'timesheet-reports':
            return <TimesheetReportsPage />;
        default:
            return <OverviewDashboard setCurrentPage={setCurrentPage} />;
    }
};

export default SuperAdminDashboard;