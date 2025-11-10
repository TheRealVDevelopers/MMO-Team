import React, { useState, useMemo } from 'react';
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
import Card from '../shared/Card';
import { ShieldExclamationIcon } from '../icons/IconComponents';

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

  // Handlers to update state
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
    // Fix: Use SiteVisitStatus enum instead of string literal
    const newVisit: SiteVisit = { ...visitData, id: `sv-${Date.now()}`, status: SiteVisitStatus.SCHEDULED };
    setSiteVisits(prev => [newVisit, ...prev]);
  };
  
  const handleRequestDrawing = (requestData: Omit<DrawingRequest, 'id' | 'status' | 'requestDate'>) => {
    // Fix: Use DrawingRequestStatus enum instead of string literal
    const newRequest: DrawingRequest = { ...requestData, id: `dr-${Date.now()}`, status: DrawingRequestStatus.REQUESTED, requestDate: new Date() };
    setDrawingRequests(prev => [newRequest, ...prev]);
  };
  
  const handleRequestQuotation = (requestData: Omit<QuotationRequest, 'id' | 'status' | 'requestDate'>) => {
    // Fix: Use QuotationRequestStatus enum instead of string literal
    const newRequest: QuotationRequest = { ...requestData, id: `qr-${Date.now()}`, status: QuotationRequestStatus.REQUESTED, requestDate: new Date() };
    setQuotationRequests(prev => [newRequest, ...prev]);
  };

  if (leadsLoading && ['my-day', 'leads'].includes(currentPage)) {
    return <div className="text-center p-8">Loading your data...</div>;
  }

  if (leadsError) {
    const isPermissionError = leadsError.message.toLowerCase().includes("permission");
    if (isPermissionError) {
        return (
            <div className="p-4 sm:p-6 lg:p-8">
                <Card className="border-error bg-error-subtle-background">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <ShieldExclamationIcon className="h-6 w-6 text-error" aria-hidden="true" />
                        </div>
                        <div className="ml-4">
                            <h3 className="text-lg font-bold text-error">Action Required: Update Database Rules</h3>
                            <div className="mt-2 text-sm text-error-subtle-text space-y-3">
                                <p>
                                    Your app is blocked from reading database data. This is a backend configuration issue, not an app bug.
                                    Because this is a demo without user login, you must open your database rules for public access.
                                </p>
                                <div className="space-y-1 font-medium">
                                    <p>1. Go to your <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="font-bold underline text-error-subtle-text hover:text-error">Firebase Project Console</a>.</p>
                                    <p>2. Navigate to <strong className="font-bold">Firestore Database → Rules</strong>.</p>
                                    <p>3. Replace the contents of the editor with the code below:</p>
                                </div>
                                <pre className="text-xs p-3 bg-surface rounded-md font-mono border border-border text-text-primary overflow-x-auto">
                                  <code>
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`}
                                  </code>
                                </pre>
                                <p className="font-bold">
                                    SECURITY WARNING: These rules make your database public. They are only for short-term demos. Do not use them in a real application.
                                </p>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        );
    }
    // Fallback for other errors
    return (
        <div className="p-8 text-center">
            <h3 className="text-lg font-bold text-error">Error Loading Your Leads</h3>
            <p className="mt-2 text-text-secondary">Could not load leads data. Please try again later.</p>
            <p className="mt-1 text-xs text-text-secondary">(Error: {leadsError.message})</p>
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

export default SalesTeamDashboard;