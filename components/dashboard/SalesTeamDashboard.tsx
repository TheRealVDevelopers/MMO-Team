import React, { useState, useEffect, useMemo } from 'react';
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
import { UserPlusIcon, ExclamationTriangleIcon, ArrowPathIcon, PlusIcon } from '@heroicons/react/24/outline';
import AddNewLeadModal from './sales-manager/AddNewLeadModal';

// Simple Error Boundary Component for internal use
interface ErrorBoundaryProps {
  children: React.ReactNode;
  key?: React.Key;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  readonly state: ErrorBoundaryState = { hasError: false };

  constructor(props: ErrorBoundaryProps) {
    super(props);
  }

  static getDerivedStateFromError(error: any): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Sales Dashboard Error:", error, errorInfo);
  }

  render() {
    // @ts-ignore
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center bg-error/5 border border-error/20 rounded-3xl">
          <ExclamationTriangleIcon className="w-12 h-12 text-error mx-auto mb-4" />
          <h3 className="text-lg font-bold text-error">Something went wrong</h3>
          <p className="mt-2 text-text-secondary">We couldn't load this section. Please try refreshing.</p>
          <button
            type="button"
            // @ts-ignore
            onClick={() => this.setState({ hasError: false })}
            className="mt-4 px-4 py-2 bg-surface text-text-primary border border-border rounded-lg text-sm font-medium hover:bg-subtle-background transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    // @ts-ignore
    return this.props.children;
  }
}

const SalesTeamDashboard: React.FC<{ currentPage: string, setCurrentPage: (page: string) => void }> = ({ currentPage, setCurrentPage }) => {
  const { currentUser } = useAuth();

  const { leads, loading: leadsLoading, error: leadsError } = useLeads(currentUser?.id);

  // Use state but initialize safely. using useEffect to keep in sync with local "database" (constants)
  // In a real app this would be API calls. Here we reset from constants on mount.
  const [siteVisits, setSiteVisits] = useState<SiteVisit[]>([]);
  const [drawingRequests, setDrawingRequests] = useState<DrawingRequest[]>([]);
  const [quotationRequests, setQuotationRequests] = useState<QuotationRequest[]>([]);
  const [procurementRequests, setProcurementRequests] = useState<ProcurementRequest[]>([]);
  const [executionRequests, setExecutionRequests] = useState<ExecutionRequest[]>([]);
  const [accountsRequests, setAccountsRequests] = useState<AccountsRequest[]>([]);
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);

  useEffect(() => {
    if (currentUser?.id) {
      // Safe access to imported constants
      setSiteVisits((SITE_VISITS || []).filter(sv => sv.requesterId === currentUser.id));
      setDrawingRequests((DRAWING_REQUESTS || []).filter(dr => dr.requesterId === currentUser.id));
      setQuotationRequests((QUOTATION_REQUESTS || []).filter(qr => qr.requesterId === currentUser.id));
      setProcurementRequests((PROCUREMENT_REQUESTS || []).filter(pr => pr.requesterId === currentUser.id));
      setExecutionRequests((EXECUTION_REQUESTS || []).filter(er => er.requesterId === currentUser.id));
      setAccountsRequests((ACCOUNTS_REQUESTS || []).filter(ar => ar.requesterId === currentUser.id));
    }
  }, [currentUser?.id]);


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
    // Shared Loading State
    if (leadsLoading && ['my-day', 'leads'].includes(currentPage)) {
      return (
        <div className="flex flex-col items-center justify-center h-64">
          <ArrowPathIcon className="w-8 h-8 text-primary animate-spin mb-4" />
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
      // Wrapped sub-pages with strict props
      case 'site-visits':
        return <SiteVisitTasksPage setCurrentPage={setCurrentPage} siteVisits={siteVisits || []} onScheduleVisit={handleScheduleVisit} />;
      case 'drawing-tasks':
        return <DrawingTasksPage setCurrentPage={setCurrentPage} drawingRequests={drawingRequests || []} />;
      case 'quotation-tasks':
        return <QuotationTasksPage setCurrentPage={setCurrentPage} quotationRequests={quotationRequests || []} />;
      case 'procurement-tasks':
        return <ProcurementTasksPage setCurrentPage={setCurrentPage} procurementRequests={procurementRequests || []} />;
      case 'execution-tasks':
        return <ExecutionTasksPage setCurrentPage={setCurrentPage} executionRequests={executionRequests || []} />;
      case 'accounts-tasks':
        return <AccountsTasksPage setCurrentPage={setCurrentPage} accountsRequests={accountsRequests || []} />;
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
        title={pageTitles[currentPage] || 'Workspace'}
        subtitle={currentPage === 'my-day' ? `Good morning, ${currentUser?.name.split(' ')[0]}. Here's your objective focus for today.` : undefined}
        actions={
          currentPage === 'leads' ? (
            <PrimaryButton onClick={() => setIsAddLeadModalOpen(true)} icon={<PlusIcon className="w-4 h-4" />}>
              Add Registry
            </PrimaryButton>
          ) : undefined
        }
      />
      <div className="mt-8">
        <ErrorBoundary key={currentPage}>
          {renderPage()}
        </ErrorBoundary>
      </div>

      {/* Add Lead Modal */}
      <AddNewLeadModal
        isOpen={isAddLeadModalOpen}
        onClose={() => setIsAddLeadModalOpen(false)}
        onAddLead={async (data, reminder) => {
          const newLead: Lead = {
            ...data,
            id: `lead-${Date.now()}`,
            status: LeadPipelineStatus.NEW_NOT_CONTACTED,
            inquiryDate: new Date(),
            lastContacted: 'Just now',
            history: [{ action: 'Lead Created', user: currentUser?.name || 'System', timestamp: new Date(), notes: 'Initial Registry' }],
            reminders: reminder ? [{ id: `rem-${Date.now()}`, date: new Date(reminder.date), notes: reminder.notes, completed: false }] : [],
            tasks: {},
            assignedTo: currentUser?.id,
          };
          await addLead(newLead, currentUser?.id || '');
          setIsAddLeadModalOpen(false);
        }}
      />
    </div>
  );
};

export default SalesTeamDashboard;
