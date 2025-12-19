import React, { useState } from 'react';
import MyLeadsPage from './sales-team/MyLeadsPage';
import { useAuth } from '../../context/AuthContext';
import { Lead, SiteVisit, DrawingRequest, QuotationRequest, ProcurementRequest, ExecutionRequest, AccountsRequest, SiteVisitStatus, DrawingRequestStatus, QuotationRequestStatus, LeadPipelineStatus } from '../../types';
import { SITE_VISITS, DRAWING_REQUESTS, QUOTATION_REQUESTS, PROCUREMENT_REQUESTS, EXECUTION_REQUESTS, ACCOUNTS_REQUESTS, USERS } from '../../constants';
import SiteVisitTasksPage from './sales-team/SiteVisitTasksPage';
import DrawingTasksPage from './sales-team/DrawingTasksPage';
import QuotationTasksPage from './sales-team/QuotationTasksPage';
import ProcurementTasksPage from './sales-team/ProcurementTasksPage';
import ExecutionTasksPage from './sales-team/ExecutionTasksPage';
import AccountsTasksPage from './sales-team/AccountsTasksPage';
import MyPerformancePage from './sales-team/MyPerformancePage';
import SalesOverviewPage from './sales-team/SalesOverviewPage';
import MyDayPage from './shared/MyDayPage';
import CommunicationDashboard from '../communication/CommunicationDashboard';
import EscalateIssuePage from '../escalation/EscalateIssuePage';
import { useLeads, addLead, updateLead } from '../../hooks/useLeads';
import { SectionHeader, PrimaryButton } from './shared/DashboardUI';
import { UserPlusIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const SalesTeamDashboard: React.FC<{ currentPage: string, setCurrentPage: (page: string) => void }> = ({ currentPage, setCurrentPage }) => {
  const { currentUser } = useAuth();

  const { leads, loading: leadsLoading, error: leadsError } = useLeads(currentUser?.id);

  // Centralized state management for the sales user
  const [siteVisits, setSiteVisits] = useState<SiteVisit[]>(() => SITE_VISITS.filter(sv => sv.requesterId === currentUser?.id));
  const [drawingRequests, setDrawingRequests] = useState<DrawingRequest[]>(() => DRAWING_REQUESTS.filter(dr => dr.requesterId === currentUser?.id));
  const [quotationRequests, setQuotationRequests] = useState<QuotationRequest[]>(() => QUOTATION_REQUESTS.filter(qr => qr.requesterId === currentUser?.id));
  const [procurementRequests, setProcurementRequests] = useState<ProcurementRequest[]>(() => PROCUREMENT_REQUESTS.filter(pr => pr.requesterId === currentUser?.id));
  const [executionRequests, setExecutionRequests] = useState<ExecutionRequest[]>(() => EXECUTION_REQUESTS.filter(er => er.requesterId === currentUser?.id));
  const [accountsRequests, setAccountsRequests] = useState<AccountsRequest[]>(() => ACCOUNTS_REQUESTS.filter(ar => ar.requesterId === currentUser?.id));

  const pageTitles: { [key: string]: string } = {
    'my-day': 'Personal Agenda',
    overview: 'Performance Hub',
    leads: 'My Registry',
    'site-visits': 'Site Inspections',
    'drawing-tasks': 'Design Coordination',
    'quotation-tasks': 'Quotation Flow',
    'procurement-tasks': 'Strategic Sourcing',
    'execution-tasks': 'Project Oversight',
    'accounts-tasks': 'Financial Registry',
    performance: 'Career Analytics',
    communication: 'Executive Chat',
    'escalate-issue': 'Priority Escalation',
  };

  const handleLeadUpdate = async (updatedLead: Lead) => {
    await updateLead(updatedLead.id, updatedLead);
  };

  const handleAddNewLead = async (
    newLeadData: Omit<Lead, 'id' | 'status' | 'inquiryDate' | 'history' | 'lastContacted'>,
    reminder?: { date: string; notes: string }
  ) => {
    const newLead: Omit<Lead, 'id'> = {
      ...newLeadData,
      status: LeadPipelineStatus.NEW_NOT_CONTACTED,
      inquiryDate: new Date(),
      lastContacted: 'Just now',
      history: [
        {
          action: 'Lead Created',
          user: currentUser?.name || 'System',
          timestamp: new Date(),
          notes: `Assigned to ${USERS.find(u => u.id === newLeadData.assignedTo)?.name}`
        }
      ],
      tasks: {},
      reminders: [],
    };

    if (reminder && reminder.date && reminder.notes) {
      newLead.reminders = [{
        id: `rem-${Date.now()}`,
        date: new Date(reminder.date),
        notes: reminder.notes,
        completed: false,
      }];
      newLead.history.push({
        action: 'Reminder set upon creation',
        user: currentUser?.name || 'System',
        timestamp: new Date(),
        notes: `For ${new Date(reminder.date).toLocaleString()}: ${reminder.notes}`
      });
    }

    await addLead(newLead);
  };

  const handleScheduleVisit = (visitData: Omit<SiteVisit, 'id' | 'status'>) => {
    const newVisit: SiteVisit = { ...visitData, id: `sv-${Date.now()}`, status: SiteVisitStatus.SCHEDULED };
    setSiteVisits(prev => [newVisit, ...prev]);
  };

  const renderPage = () => {
    if (leadsLoading && ['my-day', 'leads'].includes(currentPage)) {
      return (
        <div className="flex flex-col items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
          <p className="text-text-secondary animate-pulse">Initializing data streams...</p>
        </div>
      );
    }

    if (leadsError) {
      return (
        <div className="p-8 text-center bg-error/5 border border-error/20 rounded-3xl">
          <ExclamationTriangleIcon className="w-12 h-12 text-error mx-auto mb-4" />
          <h3 className="text-lg font-bold text-error">Data Synchronization Failed</h3>
          <p className="mt-2 text-text-secondary">Please verify your connection and try again.</p>
        </div>
      );
    }

    switch (currentPage) {
      case 'my-day':
        return <MyDayPage />;
      case 'overview':
        return <SalesOverviewPage setCurrentPage={setCurrentPage} siteVisits={siteVisits} />;
      case 'leads':
        return <MyLeadsPage leads={leads} onUpdateLead={handleLeadUpdate} onAddNewLead={handleAddNewLead} />;
      case 'site-visits':
        return <SiteVisitTasksPage setCurrentPage={setCurrentPage} siteVisits={siteVisits} onScheduleVisit={handleScheduleVisit} />;
      case 'drawing-tasks':
        return <DrawingTasksPage setCurrentPage={setCurrentPage} drawingRequests={drawingRequests} />;
      case 'quotation-tasks':
        return <QuotationTasksPage setCurrentPage={setCurrentPage} quotationRequests={quotationRequests} />;
      case 'procurement-tasks':
        return <ProcurementTasksPage setCurrentPage={setCurrentPage} procurementRequests={procurementRequests} />;
      case 'execution-tasks':
        return <ExecutionTasksPage setCurrentPage={setCurrentPage} executionRequests={executionRequests} />;
      case 'accounts-tasks':
        return <AccountsTasksPage setCurrentPage={setCurrentPage} accountsRequests={accountsRequests} />;
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

  return (
    <div className="max-w-[1600px] mx-auto">
      <SectionHeader
        title={pageTitles[currentPage]}
        subtitle={currentPage === 'my-day' ? `Good morning, ${currentUser?.name.split(' ')[0]}. Here's your objective focus for today.` : undefined}
        actions={
          currentPage === 'leads' ? (
            <PrimaryButton onClick={() => { }} icon={<UserPlusIcon className="w-4 h-4" />}>
              Add Registry
            </PrimaryButton>
          ) : undefined
        }
      />
      <div className="mt-8">
        {renderPage()}
      </div>
    </div>
  );
};

export default SalesTeamDashboard;
