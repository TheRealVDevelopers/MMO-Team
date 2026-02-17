import React, { useState } from 'react';
import { TaskType, TaskStatus } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useCaseTasks } from '../../hooks/useCaseTasks';
import MyDayPage from './shared/MyDayPage';
import CommunicationDashboard from '../communication/CommunicationDashboard';
import EscalateIssuePage from '../escalation/EscalateIssuePage';
import { ContentCard, SectionHeader } from './shared/DashboardUI';
import WorkQueuePage from './shared/WorkQueuePage';
import QuotationWorkQueuePage from './quotation-team/QuotationWorkQueuePage';
import NegotiationsBoardPage from './quotation-team/NegotiationsBoardPage';
import ItemsCatalogPage from './quotation-team/ItemsCatalogPage';
import ProjectTemplatesPage from './quotation-team/ProjectTemplatesPage';
import PriceAnalyticsPage from './quotation-team/PriceAnalyticsPage';
import MyPerformancePage from './quotation-team/MyPerformancePage';
import CustomerQuotationBuilder from './quotation-team/CustomerQuotationBuilder';
import RequestValidationPage from './shared/RequestValidationPage';

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
      case 'request-validation':
        return <RequestValidationPage />;
      case 'work-queue':
        return <QuotationWorkQueuePage />;
      case 'quotations':
        return <CustomerQuotationBuilder />;
      case 'negotiations':
        return <NegotiationsBoardPage
          projects={[]}
          onProjectSelect={() => { }}
          setCurrentPage={setCurrentPage}
        />;
      case 'catalog':
        return <ItemsCatalogPage setCurrentPage={setCurrentPage} />;
      case 'templates':
        return <ProjectTemplatesPage
          templates={[]}
          setCurrentPage={setCurrentPage}
          onAddTemplate={() => { }}
          onUseTemplate={() => { }}
        />;
      case 'analytics':
        return <PriceAnalyticsPage setCurrentPage={setCurrentPage} />;
      case 'performance':
        return <MyPerformancePage setCurrentPage={setCurrentPage} />;
      case 'communication':
        return <CommunicationDashboard />;
      case 'escalate-issue':
        return <EscalateIssuePage setCurrentPage={setCurrentPage} />;
      default:
        return <MyDayPage />;
    }
  };

  return renderPage();
};

export default QuotationTeamDashboard;
