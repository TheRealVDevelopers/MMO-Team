
import React, { useState } from 'react';
import SalesOverviewPage from './sales-manager/SalesOverviewPage';
import LeadManagementPage from './sales-manager/LeadManagementPage';
import TeamManagementPage from './sales-manager/TeamManagementPage';
import ReportsPage from './sales-manager/ReportsPage';
import { Lead, LeadHistory, LeadPipelineStatus, Case, CaseStatus } from '../../types';
import { USERS } from '../../constants';
import CreateLeadModal from './shared/CreateLeadModal';
import AssignLeadModal from './sales-manager/AssignLeadModal';
import { useAuth } from '../../context/AuthContext';
import PerformancePage from './sales-manager/PerformancePage';
import CommunicationDashboard from '../communication/CommunicationDashboard';
import EscalateIssuePage from '../escalation/EscalateIssuePage';
import { useCases } from '../../hooks/useCases';
import { useUsers } from '../../hooks/useUsers';
import ApprovalsPage from './super-admin/ApprovalsPage';
import RequestInboxPage from './shared/RequestInboxPage';
import OrganizationsPage from './admin/OrganizationsPage';
import { SectionHeader, PrimaryButton, SecondaryButton } from './shared/DashboardUI';
import UnifiedProjectsPage from './shared/UnifiedProjectsPage';
import RequestValidationPage from './shared/RequestValidationPage';
import { UserPlusIcon, UsersIcon, ArrowDownTrayIcon, CloudArrowDownIcon } from '@heroicons/react/24/outline';

const SalesGeneralManagerDashboard: React.FC<{ currentPage: string, setCurrentPage: (page: string) => void }> = ({ currentPage, setCurrentPage }) => {
  const { currentUser } = useAuth();

  // Use Cases instead of Leads (case-centric architecture)
  // Note: Cases with isProject=false are "leads"
  const { cases, loading: casesLoading, error: casesError } = useCases({});

  const { users, loading: usersLoading } = useUsers();
  const [isAddLeadModalOpen, setAddLeadModalOpen] = useState(false);
  const [isAssignLeadModalOpen, setAssignLeadModalOpen] = useState(false);

  // Convert cases to Lead format for backward compatibility
  // We pass the full Case object but map it to Lead interface for UI compatibility
  const leads: Lead[] = (cases || [])
    .filter(c => !c.isProject) // Only show non-project cases as leads
    .map(c => ({
      // Core Lead fields
      id: c.id,
      clientName: c.clientName || 'Unknown',
      projectName: c.title,
      value: c.budget?.totalBudget || 0, // Use 'value' not 'estimatedValue'
      assignedTo: c.assignedSales || '',
      status: convertCaseStatusToLeadStatus(c.status),
      inquiryDate: c.createdAt,

      // Additional Lead fields
      lastContacted: 'N/A',
      priority: 'Medium' as 'High' | 'Medium' | 'Low',
      history: [], // History will be fetched from activities subcollection
      tasks: {},
      reminders: [],
      phone: c.clientPhone || '',
      email: c.clientEmail || '',
      source: 'Direct',
      nextAction: 'Follow up',
      nextActionDate: new Date(),

      // Pass full Case data for modal compatibility
      ...c, // Spread the entire case object to preserve all fields
    } as any));

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
      case CaseStatus.EXECUTION_ACTIVE:
        return LeadPipelineStatus.IN_EXECUTION;
      case CaseStatus.COMPLETED:
        return LeadPipelineStatus.WON;
      default:
        return LeadPipelineStatus.NEW_NOT_CONTACTED;
    }
  }

  const pageTitles: { [key: string]: string } = {
    overview: 'Sales Overview',
    leads: 'Lead Management',
    projects: 'Project Management',
    organizations: 'Organizations',
    team: 'Team Analytics',
    reports: 'Business Reports',
    // performance: 'Personal Performance',
    communication: 'Team Chat',
    'request-inbox': 'Request Inbox',
    approvals: 'Approvals',
    'escalate-issue': 'Issue Escalation',
  };

  const handleAddLead = async (
    newLeadData: Omit<Lead, 'id' | 'status' | 'inquiryDate' | 'history' | 'lastContacted'>,
    reminder?: { date: string; notes: string }
  ) => {
    // This function is deprecated - leads are now created via CreateLeadModal
    // which writes directly to cases collection
    console.log('handleAddLead deprecated - use CreateLeadModal instead');
  };

  const handleAssignLead = async (leadId: string, newOwnerId: string) => {
    // This function is deprecated - need to update case assignedSales field
    console.log('handleAssignLead deprecated - need to implement case assignment');
  };

  const handleExportLeads = () => {
    if (leads.length === 0) return;
    const headers = Object.keys(leads[0]).filter(h => !['history', 'reminders'].includes(h));

    const convertToCSV = (objArray: Lead[]) => {
      let str = headers.join(',') + '\r\n';
      for (let i = 0; i < objArray.length; i++) {
        let line = '';
        for (const index of headers) {
          if (line !== '') line += ',';
          let value = (objArray[i] as any)[index];
          if (value instanceof Date) {
            value = value.toISOString();
          }
          line += `"${String(value ?? '').replace(/"/g, '""')}"`;
        }
        str += line + '\r\n';
      }
      return str;
    };

    const csvData = convertToCSV(leads);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", 'leads_report.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const renderPage = () => {
    if (casesLoading || usersLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
          <p className="text-text-secondary animate-pulse">Synchronizing dashboard data...</p>
        </div>
      );
    }
    if (casesError) {
      return <div className="p-8 text-center text-error bg-error/5 rounded-3xl border border-error/20">Error synchronizing case data. Please try again.</div>;
    }

    switch (currentPage) {
      case 'overview':
        return <SalesOverviewPage setCurrentPage={setCurrentPage} leads={leads} users={users} />;
      case 'leads':
        return <LeadManagementPage leads={leads} users={users} />;
      case 'project-hub':
        return <UnifiedProjectsPage roleView="manager" />;
      case 'organizations':
        return <OrganizationsPage setCurrentPage={setCurrentPage} />;
      case 'team':
        return <TeamManagementPage leads={leads} users={users} />;
      case 'reports':
        return <ReportsPage />;
      case 'performance':
        return <PerformancePage users={users} />;
      case 'communication':
        return <CommunicationDashboard />;
      case 'request-inbox':
        return <RequestInboxPage />;
      case 'approvals':
        return <ApprovalsPage />;
      case 'request-validation':
        return <RequestValidationPage />;
      case 'escalate-issue':
        return <EscalateIssuePage setCurrentPage={setCurrentPage} />;
      default:
        return <SalesOverviewPage setCurrentPage={setCurrentPage} leads={leads} users={users} />;
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto">
      <SectionHeader
        title={pageTitles[currentPage]}
        subtitle={currentPage === 'overview' ? `Welcome back, ${currentUser?.name.split(' ')[0]}. Here's what's happening today.` : undefined}
        actions={
          currentPage === 'overview' || currentPage === 'leads' ? (
            <>
              <PrimaryButton onClick={() => setAddLeadModalOpen(true)} icon={<UserPlusIcon className="w-4 h-4" />}>
                Add Lead
              </PrimaryButton>
              <SecondaryButton onClick={() => setAssignLeadModalOpen(true)} icon={<UsersIcon className="w-4 h-4" />}>
                Assign
              </SecondaryButton>
              <SecondaryButton onClick={handleExportLeads} icon={<ArrowDownTrayIcon className="w-4 h-4" />}>
                Export
              </SecondaryButton>
            </>
          ) : undefined
        }
      />

      <div className="mt-8">
        {renderPage()}
      </div>

      <CreateLeadModal
        isOpen={isAddLeadModalOpen}
        onClose={() => setAddLeadModalOpen(false)}
        onLeadCreated={(caseId) => {
          console.log('Lead created with ID:', caseId);
          setAddLeadModalOpen(false);
        }}
      />
      <AssignLeadModal
        isOpen={isAssignLeadModalOpen}
        onClose={() => setAssignLeadModalOpen(false)}
        leads={leads}
        users={users}
        onAssignLead={handleAssignLead}
      />
    </div>
  );
};

export default SalesGeneralManagerDashboard;
