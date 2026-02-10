import React, { useState } from 'react';
import MyLeadsPage from './sales-team/MyLeadsPage';
import { useAuth } from '../../context/AuthContext';
import { Lead, LeadPipelineStatus, Case, CaseStatus } from '../../types';
import { useUsers } from '../../hooks/useUsers';
import { useCases } from '../../hooks/useCases';
import MyRequestsPage from './sales-team/MyRequestsPage';
import MyPerformancePage from './sales-team/MyPerformancePage';
import MyDayPage from './shared/MyDayPage';
import CommunicationDashboard from '../communication/CommunicationDashboard';
import EscalateIssuePage from '../escalation/EscalateIssuePage';
import { SectionHeader, PrimaryButton } from './shared/DashboardUI';
import { ExclamationTriangleIcon, ArrowPathIcon, PlusIcon } from '@heroicons/react/24/outline';
import CreateLeadModal from './shared/CreateLeadModal';
import UnifiedProjectsPage from './shared/UnifiedProjectsPage';
import UnifiedRequestInbox from './shared/UnifiedRequestInbox';
import WorkQueuePage from './shared/WorkQueuePage';
import RequestValidationPage from './shared/RequestValidationPage';

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

  // Use Cases instead of Leads (case-centric architecture)
  // Filter to show only cases assigned to current user where isProject=false
  const { cases, loading: casesLoading, error: casesError, updateCase } = useCases({});

  const { users, loading: usersLoading } = useUsers();
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);

  // Convert cases to Lead format for backward compatibility
  // Only show cases assigned to this sales rep that aren't projects yet
  // We pass the full Case object but map it to Lead interface for UI compatibility
  const leads: Lead[] = (cases || [])
    .filter(c => !c.isProject && c.assignedSales === currentUser?.id) // Only my leads
    .map(c => {
      const leadStatus = convertCaseStatusToLeadStatus(c.status);
      return {
        // Pass full Case data first
        ...c,

        // Override with Lead-specific fields
        projectName: c.title,
        value: c.budget?.totalBudget || 0,
        assignedTo: c.assignedSales || '',
        status: leadStatus, // Override Case status with Lead status
        inquiryDate: c.createdAt,
        lastContacted: 'N/A',
        priority: 'Medium' as 'High' | 'Medium' | 'Low',
        history: [],
        tasks: {},
        reminders: [],
        phone: c.clientPhone || '',
        email: c.clientEmail || '',
        source: 'Direct',
        nextAction: 'Follow up',
        nextActionDate: new Date(),
      } as any;
    });

  function convertCaseStatusToLeadStatus(status: CaseStatus): LeadPipelineStatus {
    switch (status) {
      case CaseStatus.LEAD:
        return LeadPipelineStatus.NEW_NOT_CONTACTED;
      case CaseStatus.CONTACTED:
        return LeadPipelineStatus.CONTACTED_CALL_DONE;
      case CaseStatus.SITE_VISIT:
        return LeadPipelineStatus.SITE_VISIT_SCHEDULED;
      case CaseStatus.DRAWING:
        return LeadPipelineStatus.WAITING_FOR_DRAWING;
      case CaseStatus.BOQ:
        return LeadPipelineStatus.WAITING_FOR_QUOTATION;
      case CaseStatus.QUOTATION:
        return LeadPipelineStatus.QUOTATION_SENT;
      case CaseStatus.WAITING_FOR_PAYMENT:
        return LeadPipelineStatus.WON;
      case CaseStatus.ACTIVE:
        return LeadPipelineStatus.IN_EXECUTION;
      case CaseStatus.COMPLETED:
        return LeadPipelineStatus.WON;
      default:
        return LeadPipelineStatus.NEW_NOT_CONTACTED;
    }
  }

  const pageTitles: { [key: string]: string } = {
    'my-day': 'Personal Agenda',
    projects: 'Project Hub',
    leads: 'My Registry',
    'my-requests': 'Sent Requests Log',
    requests: 'Request Inbox',
    // performance: 'Career Analytics',
    communication: 'Executive Chat',
    'escalate-issue': 'Priority Escalation',
  };

  const handleLeadUpdate = async (updatedLead: Lead) => {
    try {
      // Convert Lead updates to Case updates
      const caseUpdates: any = {
        ...updatedLead,
        title: updatedLead.projectName || updatedLead.title,
        assignedSales: updatedLead.assignedTo,
      };

      // CRITICAL FIX: Reverse-map status if it's a LeadPipelineStatus string
      // The LeadDetailModal now sends CaseStatus values, but handle both for safety
      if (caseUpdates.status) {
        const { mapLeadStatusToCaseStatus } = await import('../../hooks/useLeads');
        const mappedStatus = mapLeadStatusToCaseStatus(caseUpdates.status);
        console.log(`[SalesTeamDashboard] Status mapping: "${caseUpdates.status}" → "${mappedStatus}"`);
        caseUpdates.status = mappedStatus;
      }

      // Remove Lead-specific fields that don't belong in Case
      delete caseUpdates.estimatedValue;
      delete caseUpdates.nextAction;
      delete caseUpdates.nextActionDate;
      delete caseUpdates.lastContacted;
      delete caseUpdates.source;
      delete caseUpdates.priority;
      delete caseUpdates.tasks;
      delete caseUpdates.reminders;
      delete caseUpdates._caseStatus;
      delete caseUpdates.projectName;
      delete caseUpdates.value;
      delete caseUpdates.inquiryDate;
      delete caseUpdates.assignedTo;

      await updateCase(updatedLead.id, caseUpdates);
      console.log('Case updated successfully:', updatedLead.id);
    } catch (error) {
      console.error('Error updating case:', error);
      alert('Failed to update lead. Please try again.');
    }
  };

  const handleAddNewLead = async (
    newLeadData: Omit<Lead, 'id' | 'status' | 'inquiryDate' | 'workflow'>,
    reminder?: { date: string; notes: string }
  ) => {
    // This function is deprecated - use CreateLeadModal instead
    console.log('handleAddNewLead deprecated - use CreateLeadModal instead');
  };

  const renderPage = () => {
    console.log('Sales Team Dashboard - Current Page:', currentPage);
    console.log('Sales Team Dashboard - Cases Loading:', casesLoading);
    console.log('Sales Team Dashboard - Cases Error:', casesError);
    console.log('Sales Team Dashboard - My Leads Count:', leads?.length);

    // Shared Loading State
    if (casesLoading && ['my-day', 'leads'].includes(currentPage)) {
      return (
        <div className="flex flex-col items-center justify-center h-64">
          <ArrowPathIcon className="w-8 h-8 text-primary animate-spin mb-4" />
          <p className="text-text-secondary animate-pulse">Initializing data streams...</p>
        </div>
      );
    }

    if (casesError) {
      console.error('Sales Team Dashboard - Cases Error Details:', casesError);
      return (
        <div className="p-8 text-center bg-error/5 border border-error/20 rounded-3xl">
          <ExclamationTriangleIcon className="w-12 h-12 text-error mx-auto mb-4" />
          <h3 className="text-lg font-bold text-error">Data Synchronization Failed</h3>
          <p className="mt-2 text-text-secondary">Please verify your connection and try again.</p>
          <p className="mt-1 text-xs text-error">{casesError || 'Unknown error'}</p>
        </div>
      );
    }

    try {
      switch (currentPage) {
        case 'my-day':
          console.log('Rendering My Day Page');
          return <MyDayPage />;
        case 'request-validation':
          return <RequestValidationPage />;
        case 'work-queue':
          console.log('Rendering Work Queue Page');
          return <WorkQueuePage />;
        case 'project-hub':
          return <UnifiedProjectsPage roleView="sales" />;
        case 'leads':
          console.log('Rendering My Leads Page');
          return <MyLeadsPage leads={leads} onUpdateLead={handleLeadUpdate} onAddNewLead={handleAddNewLead} />;
        case 'my-requests':
          console.log('Rendering My Requests Page');
          return <MyRequestsPage />;
        case 'requests':
          return <UnifiedRequestInbox />;
        // case 'performance':
        //   return <MyPerformancePage setCurrentPage={setCurrentPage} />;
        case 'communication':
          console.log('Rendering Communication Dashboard');
          return <CommunicationDashboard />;
        case 'escalate-issue':
          console.log('Rendering Escalate Issue Page');
          return <EscalateIssuePage setCurrentPage={setCurrentPage} />;
        default:
          console.log('Rendering Default (My Day) Page');
          return <MyDayPage />;
      }
    } catch (error) {
      console.error('Sales Team Dashboard - Render Error:', error);
      return (
        <div className="p-8 text-center bg-error/5 border border-error/20 rounded-3xl">
          <ExclamationTriangleIcon className="w-12 h-12 text-error mx-auto mb-4" />
          <h3 className="text-lg font-bold text-error">Page Rendering Failed</h3>
          <p className="mt-2 text-text-secondary">There was an error loading this page.</p>
          <p className="mt-1 text-xs text-error">{error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      );
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
      <CreateLeadModal
        isOpen={isAddLeadModalOpen}
        onClose={() => setIsAddLeadModalOpen(false)}
        onLeadCreated={(caseId) => {
          console.log('Lead created with ID:', caseId);
          setIsAddLeadModalOpen(false);
        }}
      />
    </div>
  );
};

export default SalesTeamDashboard;
