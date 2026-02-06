import React, { useState } from 'react';
import SalesOverviewPage from './SalesOverviewPage';
import LeadManagementPage from './LeadManagementPage';
import TeamManagementPage from './TeamManagementPage';
import ReportsPage from './ReportsPage';
import ClientProjectsPage from './ClientProjectsPage';
import { Lead, LeadHistory, LeadPipelineStatus } from '../../../types';
import { USERS } from '../../../constants';
import { UserPlusIcon, UsersIcon, ArrowDownTrayIcon, ArrowLeftIcon, ShieldExclamationIcon } from '../../icons/IconComponents';
import AddNewLeadModal from './AddNewLeadModal';
import AssignLeadModal from './AssignLeadModal';
import { useAuth } from '../../../context/AuthContext';
import PerformancePage from './PerformancePage';
import CommunicationDashboard from '../../communication/CommunicationDashboard';
import EscalateIssuePage from '../../escalation/EscalateIssuePage';
import { useLeads } from '../../../hooks/useLeads';
import Card from '../../shared/Card';
import LeadImporter from '../../sales/LeadImporter';
import { Upload } from 'lucide-react';

const SalesGeneralManagerDashboard: React.FC<{ currentPage: string, setCurrentPage: (page: string) => void }> = ({ currentPage, setCurrentPage }) => {
  const { currentUser } = useAuth();
  const { leads, loading: leadsLoading, error: leadsError, createLead, updateLead } = useLeads();
  const [isAddLeadModalOpen, setAddLeadModalOpen] = useState(false);
  const [isAssignLeadModalOpen, setAssignLeadModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const pageTitles: { [key: string]: string } = {
    overview: 'Sales Dashboard',
    leads: 'Lead Management',
    'client-projects': 'Client Projects',
    team: 'Team Performance',
    reports: 'Reports & Analytics',
    performance: 'My Performance',
    communication: 'Team Communication',
    'escalate-issue': 'Escalate an Issue',
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
    await createLead(newLead as any);
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
      return <div className="p-8 text-center">Loading leads...</div>;
    }
    if (leadsError) {
      const isPermissionError = leadsError.message.toLowerCase().includes("permission");
      if (isPermissionError) {
        return (
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
        )
      }
      return <div className="p-8 text-center text-error">Error loading leads: {leadsError.message}</div>;
    }

    switch (currentPage) {
      case 'overview':
        return <SalesOverviewPage setCurrentPage={setCurrentPage} leads={leads} />;
      case 'leads':
        return <LeadManagementPage leads={leads} />;
      case 'client-projects':
        return <ClientProjectsPage />;
      case 'team':
        return <TeamManagementPage leads={leads} />;
      case 'reports':
        return <ReportsPage />;
      case 'performance':
        return <PerformancePage />;
      case 'communication':
        return <CommunicationDashboard />;
      case 'escalate-issue':
        return <EscalateIssuePage setCurrentPage={setCurrentPage} />;
      default:
        return <SalesOverviewPage setCurrentPage={setCurrentPage} leads={leads} />;
    }
  };

  const showHeader = !['performance', 'communication', 'escalate-issue', 'client-projects'].includes(currentPage);


  return (
    <>
      <div className="flex flex-col h-full">
        <div>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div className="flex items-center gap-4">
              {currentPage !== 'overview' && (
                <button onClick={() => setCurrentPage('overview')} className="flex items-center space-x-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
                  <ArrowLeftIcon className="w-5 h-5" />
                  <span>Back</span>
                </button>
              )}
              <h2 className="text-2xl font-bold text-text-primary">{pageTitles[currentPage]}</h2>
            </div>
            {showHeader && (
              <div className="flex items-center space-x-2">
                <button onClick={() => setAddLeadModalOpen(true)} className="flex items-center space-x-2 bg-primary text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-secondary">
                  <UserPlusIcon className="w-4 h-4" />
                  <span>Add New Lead</span>
                </button>
                <button onClick={() => setAssignLeadModalOpen(true)} className="flex items-center space-x-2 bg-surface border border-border text-text-primary px-3 py-2 rounded-md text-sm font-medium hover:bg-subtle-background">
                  <UsersIcon className="w-4 h-4" />
                  <span>Assign Lead</span>
                </button>
                <button onClick={handleExportLeads} className="flex items-center space-x-2 bg-surface border border-border text-text-primary px-3 py-2 rounded-md text-sm font-medium hover:bg-subtle-background">
                  <ArrowDownTrayIcon className="w-4 h-4" />
                  <span>Export Report</span>
                </button>
                <button onClick={() => setIsImportModalOpen(true)} className="flex items-center space-x-2 bg-surface border border-border text-text-primary px-3 py-2 rounded-md text-sm font-medium hover:bg-subtle-background">
                  <Upload className="w-4 h-4" />
                  <span>Import Leads</span>
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto mt-6">
          {renderPage()}
        </div>
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
      <LeadImporter
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportComplete={() => {
          setIsImportModalOpen(false);
          // Leads will automatically update via useLeads hook
        }}
      />
    </>
  );
};

export default SalesGeneralManagerDashboard;