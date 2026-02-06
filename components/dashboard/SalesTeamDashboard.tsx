import React, { useState } from 'react';
import MyLeadsPage from './sales-team/MyLeadsPage';
import { useAuth } from '../../context/AuthContext';
import { Lead } from '../../hooks/useLeads';
import { LeadPipelineStatus } from '../../types';
import { useUsers } from '../../hooks/useUsers';
import MyRequestsPage from './sales-team/MyRequestsPage';
import MyPerformancePage from './sales-team/MyPerformancePage';
import MyDayPage from './shared/MyDayPage';
import CommunicationDashboard from '../communication/CommunicationDashboard';
import EscalateIssuePage from '../escalation/EscalateIssuePage';
import { useLeads } from '../../hooks/useLeads';
import { SectionHeader, PrimaryButton } from './shared/DashboardUI';
import { ExclamationTriangleIcon, ArrowPathIcon, PlusIcon } from '@heroicons/react/24/outline';
import AddNewLeadModal from './sales-manager/AddNewLeadModal';
import UnifiedProjectsPage from './shared/UnifiedProjectsPage';
import UnifiedRequestInbox from './shared/UnifiedRequestInbox';

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
  // Use leads hook with backward compatibility
  const { leads, loading: leadsLoading, error: leadsError, updateLead, createLead } = useLeads();
  const { users, loading: usersLoading } = useUsers();
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);

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
    await updateLead(updatedLead.id, updatedLead);
  };

  const handleAddNewLead = async (
    newLeadData: Omit<Lead, 'id' | 'status' | 'inquiryDate' | 'workflow'>,
    reminder?: { date: string; notes: string }
  ) => {
    const newLead: any = {
      ...newLeadData,
      status: LeadPipelineStatus.NEW_NOT_CONTACTED,
      inquiryDate: new Date(),
    };

    await createLead(newLead);
  };

  const renderPage = () => {
    console.log('Sales Team Dashboard - Current Page:', currentPage);
    console.log('Sales Team Dashboard - Leads Loading:', leadsLoading);
    console.log('Sales Team Dashboard - Leads Error:', leadsError);
    console.log('Sales Team Dashboard - Leads Count:', leads?.length);

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
      console.error('Sales Team Dashboard - Leads Error Details:', leadsError);
      return (
        <div className="p-8 text-center bg-error/5 border border-error/20 rounded-3xl">
          <ExclamationTriangleIcon className="w-12 h-12 text-error mx-auto mb-4" />
          <h3 className="text-lg font-bold text-error">Data Synchronization Failed</h3>
          <p className="mt-2 text-text-secondary">Please verify your connection and try again.</p>
          <p className="mt-1 text-xs text-error">{leadsError || 'Unknown error'}</p>
        </div>
      );
    }

    try {
      switch (currentPage) {
        case 'my-day':
          console.log('Rendering My Day Page');
          return <MyDayPage />;
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
      <AddNewLeadModal
        isOpen={isAddLeadModalOpen}
        onClose={() => setIsAddLeadModalOpen(false)}
        users={users}
        onAddLead={async (data, reminder) => {
          const newLead: any = {
            ...data,
            status: LeadPipelineStatus.NEW_NOT_CONTACTED,
            inquiryDate: new Date(),
            assignedTo: currentUser?.id,
          };
          await createLead(newLead);
          setIsAddLeadModalOpen(false);
        }}
      />
    </div>
  );
};

export default SalesTeamDashboard;
