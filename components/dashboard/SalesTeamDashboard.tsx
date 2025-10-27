


import React, { useState, useMemo } from 'react';
import SalesTeamSidebar from './sales-team/SalesTeamSidebar';
import MyLeadsPage from './sales-team/MyLeadsPage';
import { useAuth } from '../../context/AuthContext';
// Fix: Import enums for status types
import { Lead, SiteVisit, DrawingRequest, QuotationRequest, ProcurementRequest, ExecutionRequest, AccountsRequest, SiteVisitStatus, DrawingRequestStatus, QuotationRequestStatus } from '../../types';
import { LEADS, SITE_VISITS, DRAWING_REQUESTS, QUOTATION_REQUESTS, PROCUREMENT_REQUESTS, EXECUTION_REQUESTS, ACCOUNTS_REQUESTS } from '../../constants';
import SiteVisitTasksPage from './sales-team/SiteVisitTasksPage';
import DrawingTasksPage from './sales-team/DrawingTasksPage';
import QuotationTasksPage from './sales-team/QuotationTasksPage';
import ProcurementTasksPage from './sales-team/ProcurementTasksPage';
import ExecutionTasksPage from './sales-team/ExecutionTasksPage';
import AccountsTasksPage from './sales-team/AccountsTasksPage';
import MyPerformancePage from './sales-team/MyPerformancePage';
import SalesOverviewPage from './sales-team/SalesOverviewPage';

const SalesTeamDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [currentPage, setCurrentPage] = useState('overview');
  
  // Centralized state management for the sales user
  const [leads, setLeads] = useState<Lead[]>(() => LEADS.filter(l => l.assignedTo === currentUser?.id));
  const [siteVisits, setSiteVisits] = useState<SiteVisit[]>(() => SITE_VISITS.filter(sv => sv.requesterId === currentUser?.id));
  const [drawingRequests, setDrawingRequests] = useState<DrawingRequest[]>(() => DRAWING_REQUESTS.filter(dr => dr.requesterId === currentUser?.id));
  const [quotationRequests, setQuotationRequests] = useState<QuotationRequest[]>(() => QUOTATION_REQUESTS.filter(qr => qr.requesterId === currentUser?.id));
  const [procurementRequests, setProcurementRequests] = useState<ProcurementRequest[]>(() => PROCUREMENT_REQUESTS.filter(pr => pr.requesterId === currentUser?.id));
  const [executionRequests, setExecutionRequests] = useState<ExecutionRequest[]>(() => EXECUTION_REQUESTS.filter(er => er.requesterId === currentUser?.id));
  const [accountsRequests, setAccountsRequests] = useState<AccountsRequest[]>(() => ACCOUNTS_REQUESTS.filter(ar => ar.requesterId === currentUser?.id));

  // Handlers to update state
  const handleLeadUpdate = (updatedLead: Lead) => {
    setLeads(currentLeads => currentLeads.map(l => l.id === updatedLead.id ? updatedLead : l));
  };
  
  const handleAddNewLead = (newLead: Lead) => {
    setLeads(prev => [newLead, ...prev]);
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

  const renderPage = () => {
    switch (currentPage) {
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
      default:
        return <SalesOverviewPage setCurrentPage={setCurrentPage} siteVisits={siteVisits} />;
    }
  };

  const taskCounts = useMemo(() => ({
      'site-visits': siteVisits.length,
      'drawing-tasks': drawingRequests.length,
      'quotation-tasks': quotationRequests.length,
      'procurement-tasks': procurementRequests.length,
      'execution-tasks': executionRequests.length,
      'accounts-tasks': accountsRequests.length,
  }), [siteVisits, drawingRequests, quotationRequests, procurementRequests, executionRequests, accountsRequests]);

  return (
    <div className="flex h-screen max-h-screen overflow-hidden">
      <SalesTeamSidebar currentPage={currentPage} setCurrentPage={setCurrentPage} leadsCount={leads.length} taskCounts={taskCounts} />
      <div className="flex-1 overflow-y-auto">
        {renderPage()}
      </div>
    </div>
  );
};

export default SalesTeamDashboard;