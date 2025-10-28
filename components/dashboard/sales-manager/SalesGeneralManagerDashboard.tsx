import React, { useState } from 'react';
import SalesManagerSidebar from './sales-manager/SalesManagerSidebar';
import SalesOverviewPage from './sales-manager/SalesOverviewPage';
import LeadManagementPage from './sales-manager/LeadManagementPage';
import TeamManagementPage from './sales-manager/TeamManagementPage';
import ReportsPage from './sales-manager/ReportsPage';
import { Lead, LeadHistory, LeadPipelineStatus } from '../../../types';
import { LEADS, USERS } from '../../../constants';
import { UserPlusIcon, UsersIcon, ArrowDownTrayIcon, ArrowLeftIcon } from '../../icons/IconComponents';
import AddNewLeadModal from './sales-manager/AddNewLeadModal';
import AssignLeadModal from './sales-manager/AssignLeadModal';
import { useAuth } from '../../../context/AuthContext';
import PerformancePage from './sales-manager/PerformancePage';
import CommunicationDashboard from '../../communication/CommunicationDashboard';
import EscalateIssuePage from '../../escalation/EscalateIssuePage';

const SalesGeneralManagerDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [currentPage, setCurrentPage] = useState('overview');
  const [leads, setLeads] = useState<Lead[]>(LEADS);
  const [isAddLeadModalOpen, setAddLeadModalOpen] = useState(false);
  const [isAssignLeadModalOpen, setAssignLeadModalOpen] = useState(false);

  const pageTitles: { [key: string]: string } = {
    overview: 'Sales Dashboard',
    leads: 'Lead Management',
    team: 'Team Performance',
    reports: 'Reports & Analytics',
    performance: 'My Performance',
    communication: 'Team Communication',
    'escalate-issue': 'Escalate an Issue',
  };
  
  const handleAddLead = (
    newLeadData: Omit<Lead, 'id' | 'status' | 'inquiryDate' | 'history' | 'lastContacted'>,
    reminder?: { date: string; notes: string }
  ) => {
    const newLead: Lead = {
      ...newLeadData,
      id: `lead-${Date.now()}`,
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

    setLeads(prevLeads => [newLead, ...prevLeads]);
  };

  const handleAssignLead = (leadId: string, newOwnerId: string) => {
    setLeads(prevLeads => prevLeads.map(lead => {
      if (lead.id === leadId) {
        const newOwner = USERS.find(u => u.id === newOwnerId);
        const newHistoryItem: LeadHistory = {
            action: `Lead assigned to ${newOwner?.name || 'Unknown'}`,
            user: currentUser?.name || 'System',
            timestamp: new Date(),
        };
        return { ...lead, assignedTo: newOwnerId, history: [...lead.history, newHistoryItem] };
      }
      return lead;
    }));
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
    switch (currentPage) {
      case 'overview':
        return <SalesOverviewPage setCurrentPage={setCurrentPage} leads={leads} />;
      case 'leads':
        return <LeadManagementPage leads={leads} setLeads={setLeads} />;
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

  const showHeader = !['performance', 'communication', 'escalate-issue'].includes(currentPage);


  return (
    <>
      <div className="flex h-full">
        <SalesManagerSidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
        <div className="flex-1 flex flex-col">
           <div className="px-4 sm:px-6 lg:px-8 pt-6">
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
                        <button onClick={() => setAddLeadModalOpen(true)} className="flex items-center space-x-2 bg-primary text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700">
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
                    </div>
                  )}
              </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {renderPage()}
          </div>
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
    </>
  );
};

export default SalesGeneralManagerDashboard;