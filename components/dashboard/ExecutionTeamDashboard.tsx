
import React from 'react';
import ExecutionBoardPage from './execution-team/ExecutionBoardPage';
import PerformancePage from './execution-team/PerformancePage';
import MyDayPage from './shared/MyDayPage';
import CommunicationDashboard from '../communication/CommunicationDashboard';
import EscalateIssuePage from '../escalation/EscalateIssuePage';

const ExecutionTeamDashboard: React.FC<{ currentPage: string, setCurrentPage: (page: string) => void }> = ({ currentPage, setCurrentPage }) => {
    switch (currentPage) {
        case 'my-day':
            return <MyDayPage />;
        case 'board':
            return <ExecutionBoardPage />;
        case 'performance':
            return <PerformancePage setCurrentPage={setCurrentPage}/>;
        case 'communication':
            return <CommunicationDashboard />;
        case 'escalate-issue':
            return <EscalateIssuePage setCurrentPage={setCurrentPage} />;
        default:
            return <MyDayPage />;
    }
};

export default ExecutionTeamDashboard;
