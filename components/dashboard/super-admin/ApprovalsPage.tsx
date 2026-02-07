import React from 'react';
import { ContentCard, SectionHeader } from '../shared/DashboardUI';
import RequestInboxPage from '../shared/RequestInboxPage';

const ApprovalsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <RequestInboxPage />
    </div>
  );
};

export default ApprovalsPage;
