
import React, { useState } from 'react';
import SiteEngineerSidebar from './SiteEngineerSidebar';
import UnifiedOverviewPage from './UnifiedOverviewPage';
import EngineerOverviewPage from './EngineerOverviewPage';
import DrawingTasksPage from './DrawingTasksPage';
import { SiteVisit, ExpenseClaim, SiteReport, DrawingTask, ProjectStatus, SiteVisitStatus, LeadPipelineStatus } from '../../../types';
import { EXPENSE_CLAIMS } from '../../../constants';
import { useAuth } from '../../../context/AuthContext';
import ExpenseClaimsPage from './ExpenseClaimsPage';
import SiteEngineerKPIPage from './SiteEngineerKPIPage';
import VisitDetailModal from './VisitDetailModal';
import MyDayPage from '../shared/MyDayPage';
import CommunicationDashboard from '../../communication/CommunicationDashboard';
import EscalateIssuePage from '../../escalation/EscalateIssuePage';
import { useProjects } from '../../../hooks/useProjects';
import { useLeads } from '../../../hooks/useLeads';
import { useAutomatedTaskCreation } from '../../../hooks/useAutomatedTaskCreation';

const SiteEngineerDashboard: React.FC<{ currentPage: string, setCurrentPage: (page: string) => void }> = ({ currentPage, setCurrentPage }) => {
  const { currentUser } = useAuth();
  const { projects } = useProjects(); // Fetch global projects
  const { leads } = useLeads();
  // Removed duplicate local state for currentPage, using props instead
  const [selectedVisit, setSelectedVisit] = useState<SiteVisit | null>(null);
  const [selectedDrawingTask, setSelectedDrawingTask] = useState<DrawingTask | null>(null);
  const { handleSiteVisitCompletion } = useAutomatedTaskCreation();

  // Derived site visits from LEADs (Primary source)
  const leadVisits: SiteVisit[] = leads
    .filter(l =>
      (l.status === LeadPipelineStatus.SITE_VISIT_SCHEDULED || l.status === LeadPipelineStatus.SITE_VISIT_RESCHEDULED) &&
      l.assignedTo === currentUser?.id
    )
    .map(l => ({
      id: l.id,
      projectId: l.id, // Using lead ID as project ID pre-conversion
      projectName: l.projectName,
      clientName: l.clientName,
      siteAddress: '', // Address not available in Lead type
      leadId: l.id,
      assigneeId: l.assignedTo,
      requesterId: 'system',
      date: l.inquiryDate || new Date(),
      scheduledDate: l.inquiryDate || new Date(),
      status: SiteVisitStatus.SCHEDULED,
      priority: l.priority || 'Medium',
    } as SiteVisit));

  // Derived site visits from PROJECTS (Secondary source)
  const projectVisits: SiteVisit[] = projects
    .filter(p =>
      (p.status === ProjectStatus.SITE_VISIT_PENDING || p.status === ProjectStatus.SITE_VISIT_RESCHEDULED) &&
      (p.assignedEngineerId === currentUser?.id || p.assignedTeam?.site_engineer === currentUser?.id)
    )
    .map(p => ({
      id: p.id,
      projectId: p.id,
      projectName: p.projectName,
      clientName: p.clientName,
      siteAddress: p.clientAddress || '',
      leadId: p.id,
      assigneeId: currentUser?.id || '',
      requesterId: p.salespersonId || 'system',
      date: p.startDate || new Date(),
      scheduledDate: p.startDate || new Date(),
      status: SiteVisitStatus.SCHEDULED,
      priority: p.priority || 'Medium',
    } as SiteVisit));

  const siteVisits = [...leadVisits, ...projectVisits];

  const [expenseClaims, setExpenseClaims] = useState<ExpenseClaim[]>(() =>
    EXPENSE_CLAIMS.filter(ec => ec.engineerId === currentUser?.id)
  );

  // Derive drawing tasks from global projects
  const drawingTasks: DrawingTask[] = projects
    .filter(p =>
      p.status === ProjectStatus.DRAWING_PENDING ||
      p.status === ProjectStatus.DESIGN_IN_PROGRESS ||
      p.status === ProjectStatus.REVISIONS_IN_PROGRESS
    )
    .map(p => ({
      id: p.id,
      projectName: p.projectName,
      clientName: p.clientName,
      deadline: p.endDate || new Date(),
      status: p.status === ProjectStatus.DRAWING_PENDING ? 'Pending' :
        p.status === ProjectStatus.DESIGN_IN_PROGRESS ? 'In Progress' : 'Completed',
      priority: p.priority,
      taskType: 'Start Drawing',
      assignedTo: p.assignedTeam?.execution?.find(id => id === currentUser?.id) || 'Unassigned',
      metadata: {
        siteAddress: p.clientAddress
      },
      leadId: p.id,
      requestedBy: 'System',
      createdAt: new Date()
    } as DrawingTask));

  const handleUpdateVisit = (updatedVisit: SiteVisit) => {
    // Note: Since siteVisits is now derived from projects, we need to update the project
    // For now, just update the selected visit state
    if (selectedVisit) {
      setSelectedVisit(updatedVisit);
    }
  };

  const handleSubmitReport = async (report: SiteReport, newExpenseClaim?: Omit<ExpenseClaim, 'id'>) => {
    const updatedVisit = siteVisits.find(v => v.id === report.visitId);
    if (updatedVisit && currentUser) {
      // Update visit status
      handleUpdateVisit({ ...updatedVisit, reportId: report.id, status: 'Report Submitted' as any });

      // Automatically create drawing task
      try {
        await handleSiteVisitCompletion(updatedVisit, updatedVisit.leadId, currentUser.id);
      } catch (error) {
        console.error('Failed to create automated drawing task:', error);
      }
    }

    if (newExpenseClaim) {
      const claim: ExpenseClaim = { ...newExpenseClaim, id: `ec-${Date.now()}` };
      setExpenseClaims(prev => [claim, ...prev]);
    }

    setSelectedVisit(null);
  };


  const renderPage = () => {
    switch (currentPage) {
      case 'overview':
        return (
          <UnifiedOverviewPage
            visits={siteVisits}
            drawingTasks={drawingTasks}
            onSelectVisit={setSelectedVisit}
            onSelectDrawingTask={setSelectedDrawingTask}
            setCurrentPage={setCurrentPage}
          />
        );
      case 'my-day':
        return <MyDayPage />;
      case 'performance':
      //   return <SiteEngineerKPIPage visits={siteVisits} setCurrentPage={setCurrentPage} />;
      case 'projects': // Explicitly handle 'projects' from sidebar
        return (
          <UnifiedOverviewPage
            visits={siteVisits}
            drawingTasks={drawingTasks}
            onSelectVisit={setSelectedVisit}
            onSelectDrawingTask={setSelectedDrawingTask}
            setCurrentPage={setCurrentPage}
          />
        );
      case 'schedule':
        return <EngineerOverviewPage
          visits={siteVisits}
          onSelectVisit={setSelectedVisit}
          setCurrentPage={setCurrentPage}
        />;
      case 'drawings':
        return (
          <DrawingTasksPage
            drawingTasks={drawingTasks}
            onSelectTask={setSelectedDrawingTask}
            setCurrentPage={setCurrentPage}
          />
        );
      case 'expenses':
        return <ExpenseClaimsPage claims={expenseClaims} setCurrentPage={setCurrentPage} />;
      case 'communication':
        return <CommunicationDashboard />;
      case 'escalate-issue':
        return <EscalateIssuePage setCurrentPage={setCurrentPage} />;
      default:
        return (
          <UnifiedOverviewPage
            visits={siteVisits}
            drawingTasks={drawingTasks}
            onSelectVisit={setSelectedVisit}
            onSelectDrawingTask={setSelectedDrawingTask}
            setCurrentPage={setCurrentPage}
          />
        );
    }
  };

  return (
    <>
      <div className="flex h-screen max-h-screen overflow-hidden">
        <SiteEngineerSidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
        <div className="flex-1 overflow-y-auto">
          {renderPage()}
        </div>
      </div>
      {selectedVisit && (
        <VisitDetailModal
          visit={selectedVisit}
          isOpen={!!selectedVisit}
          onClose={() => setSelectedVisit(null)}
          onUpdate={handleUpdateVisit}
          onSubmit={handleSubmitReport}
        />
      )}
    </>
  );
};

export default SiteEngineerDashboard;
