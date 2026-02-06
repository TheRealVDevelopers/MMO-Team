import React, { useState } from 'react';
import { TaskType, TaskStatus } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useCaseTasks } from '../../hooks/useCaseTasks';
import MyDayPage from './shared/MyDayPage';
import CommunicationDashboard from '../communication/CommunicationDashboard';
import EscalateIssuePage from '../escalation/EscalateIssuePage';
import { ContentCard, SectionHeader } from './shared/DashboardUI';

const QuotationTeamDashboard: React.FC<{ currentPage: string, setCurrentPage: (page: string, params?: any) => void }> = ({ currentPage, setCurrentPage }) => {
  const { currentUser } = useAuth();
  
  // Get BOQ and Quotation tasks
  const { tasks: boqTasks, loading: boqLoading } = useCaseTasks({
    organizationId: currentUser?.organizationId,
    assignedTo: currentUser?.id,
    type: TaskType.BOQ,
  });

  const { tasks: quotationTasks, loading: quotationLoading } = useCaseTasks({
    organizationId: currentUser?.organizationId,
    assignedTo: currentUser?.id,
    type: TaskType.QUOTATION,
  });

  const loading = boqLoading || quotationLoading;
  const allTasks = [...boqTasks, ...quotationTasks];

  const renderPage = () => {
    switch (currentPage) {
      case 'my-day':
        return <MyDayPage />;
      case 'communication':
        return <CommunicationDashboard />;
      case 'escalate-issue':
        return <EscalateIssuePage setCurrentPage={setCurrentPage} />;
      default:
        return (
          <div className="space-y-6">
            <SectionHeader
              title="BOQ & Quotation Tasks"
              subtitle="Manage Bill of Quantities and prepare customer quotations"
            />
            {loading ? (
              <div className="text-center py-8">Loading tasks...</div>
            ) : (
              <div className="grid gap-4">
                {allTasks.map(task => (
                  <ContentCard key={task.id}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-lg">{task.type} Task</h3>
                        <p className="text-sm text-text-secondary">Case ID: {task.caseId}</p>
                        <p className="text-xs text-text-tertiary mt-2">Status: {task.status}</p>
                        {task.notes && (
                          <p className="text-xs text-text-secondary mt-1">{task.notes}</p>
                        )}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        task.status === TaskStatus.PENDING ? 'bg-error/10 text-error' :
                        task.status === TaskStatus.STARTED ? 'bg-warning/10 text-warning' :
                        'bg-success/10 text-success'
                      }`}>
                        {task.status}
                      </span>
                    </div>
                  </ContentCard>
                ))}
                {allTasks.length === 0 && (
                  <div className="text-center py-8 text-text-tertiary">
                    No BOQ or Quotation tasks assigned
                  </div>
                )}
              </div>
            )}
          </div>
        );
    }
  };

  return renderPage();
};

export default QuotationTeamDashboard;
