
import React, { useState } from 'react';
import SalesOverviewPage from './sales-manager/SalesOverviewPage';
import LeadManagementPage from './sales-manager/LeadManagementPage';
import TeamManagementPage from './sales-manager/TeamManagementPage';
import ReportsPage from './sales-manager/ReportsPage';
import ProjectTrackingPage from './super-admin/ProjectTrackingPage';
import { Lead, LeadHistory, LeadPipelineStatus } from '../../types';
import { USERS } from '../../constants';
import AddNewLeadModal from './sales-manager/AddNewLeadModal';
import AssignLeadModal from './sales-manager/AssignLeadModal';
import { useAuth } from '../../context/AuthContext';
import PerformancePage from './sales-manager/PerformancePage';
import CommunicationDashboard from '../communication/CommunicationDashboard';
import EscalateIssuePage from '../escalation/EscalateIssuePage';
import { useLeads, addLead, updateLead } from '../../hooks/useLeads';
import { useNewEnquiries, useEnquiries } from '../../hooks/useEnquiries';
import ApprovalsPage from './super-admin/ApprovalsPage';
import OrganizationsPage from './admin/OrganizationsPage';
import EnquiryNotificationBanner from './EnquiryNotificationBanner';
import EnquiriesListModal from './EnquiriesListModal';
import { SectionHeader, PrimaryButton, SecondaryButton } from './shared/DashboardUI';
import { UserPlusIcon, UsersIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

const SalesGeneralManagerDashboard: React.FC<{ currentPage: string, setCurrentPage: (page: string) => void }> = ({ currentPage, setCurrentPage }) => {
  const { currentUser } = useAuth();
  const { leads, loading: leadsLoading, error: leadsError } = useLeads();
  const { newEnquiries } = useNewEnquiries(currentUser?.id);
  const { enquiries } = useEnquiries();
  const [isAddLeadModalOpen, setAddLeadModalOpen] = useState(false);
  const [isAssignLeadModalOpen, setAssignLeadModalOpen] = useState(false);
  const [showEnquiriesModal, setShowEnquiriesModal] = useState(false);

  const pageTitles: { [key: string]: string } = {
    overview: 'Sales Overview',
    leads: 'Lead Management',
    projects: 'Project Management',
    organizations: 'Organizations',
    team: 'Team Analytics',
    reports: 'Business Reports',
    // performance: 'Personal Performance',
    communication: 'Team Chat',
    approvals: 'Request Inbox',
    'escalate-issue': 'Issue Escalation',
  };

  const handleAddLead = async (
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

  const handleAssignLead = async (leadId: string, newOwnerId: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (lead) {
      const newOwner = USERS.find(u => u.id === newOwnerId);
      const newHistoryItem: LeadHistory = {
        action: `Lead assigned to ${newOwner?.name || 'Unknown'}`,
        user: currentUser?.name || 'System',
        timestamp: new Date(),
      };
      const updatedHistory = [...lead.history, newHistoryItem];
      await updateLead(leadId, { assignedTo: newOwnerId, history: updatedHistory });
    }
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
    if (leadsLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
          <p className="text-text-secondary animate-pulse">Synchronizing leads...</p>
        </div>
      );
    }
    if (leadsError) {
      return <div className="p-8 text-center text-error bg-error/5 rounded-3xl border border-error/20">Error synchronizing lead data. Please try again.</div>;
    }

    switch (currentPage) {
      case 'overview':
        return <SalesOverviewPage setCurrentPage={setCurrentPage} leads={leads} />;
      case 'leads':
        return <LeadManagementPage leads={leads} />;
      case 'projects':
        return <ProjectTrackingPage setCurrentPage={setCurrentPage} />;
      case 'organizations':
        return <OrganizationsPage setCurrentPage={setCurrentPage} />;
      case 'team':
        return <TeamManagementPage leads={leads} />;
      case 'reports':
        return <ReportsPage />;
      case 'performance':
        return <PerformancePage />;
      case 'communication':
        return <CommunicationDashboard />;
      case 'approvals':
        return <ApprovalsPage />;
      case 'escalate-issue':
        return <EscalateIssuePage setCurrentPage={setCurrentPage} />;
      default:
        return <SalesOverviewPage setCurrentPage={setCurrentPage} leads={leads} />;
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto">
      {currentPage === 'overview' && (
        <EnquiryNotificationBanner
          newEnquiries={newEnquiries}
          onViewEnquiries={() => setShowEnquiriesModal(true)}
        />
      )}

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

      <AddNewLeadModal
        isOpen={isAddLeadModalOpen}
        onClose={() => setAddLeadModalOpen(false)}
        onAddLead={handleAddLead}
      />
      <AssignLeadModal
        isOpen={isAssignLeadModalOpen}
        onClose={() => setAssignLeadModalOpen(false)}
        leads={leads}
        onAssignLead={handleAssignLead}
      />
      <EnquiriesListModal
        isOpen={showEnquiriesModal}
        onClose={() => setShowEnquiriesModal(false)}
        enquiries={enquiries}
        currentUserId={currentUser?.id || ''}
      />
    </div>
  );
};

export default SalesGeneralManagerDashboard;
