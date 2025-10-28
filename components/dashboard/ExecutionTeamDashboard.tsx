
import React, { useState } from 'react';
import ExecutionTeamSidebar from './execution-team/ExecutionTeamSidebar';
import ExecutionBoardPage from './execution-team/ExecutionBoardPage';
import PerformancePage from './execution-team/PerformancePage';
import MyDayPage from './shared/MyDayPage';
import CommunicationDashboard from '../communication/CommunicationDashboard';
import EscalateIssuePage from '../escalation/EscalateIssuePage';

const ExecutionTeamDashboard: React.FC = () => {
    const [currentPage, setCurrentPage] = useState('my-day');
    
    const renderPage = () => {
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

    return (
        <div className="flex h-screen max-h-screen overflow-hidden">
            <ExecutionTeamSidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
            <div className="flex-1 overflow-y-auto">
                {renderPage()}
            </div>
        </div>
    );
};

export default ExecutionTeamDashboard;
