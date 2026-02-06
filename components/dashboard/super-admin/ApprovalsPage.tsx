import React from 'react';
import { ContentCard, SectionHeader } from '../shared/DashboardUI';
import ApprovalQueueDashboard from '../shared/ApprovalQueueDashboard';

const ApprovalsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Approvals & Task Requests"
        subtitle="Review and approve team requests with mandatory human approval"
      />
      
      <ApprovalQueueDashboard />
    </div>
  );
};

export default ApprovalsPage;
