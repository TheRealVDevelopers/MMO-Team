
import React, { useState } from 'react';
import SiteEngineerSidebar from './SiteEngineerSidebar';
import UnifiedOverviewPage from './UnifiedOverviewPage';
import EngineerOverviewPage from './EngineerOverviewPage';
import DrawingTasksPage from './DrawingTasksPage';
import { SiteVisit, ExpenseClaim, SiteReport, DrawingTask } from '../../../types';
import { SITE_VISITS, EXPENSE_CLAIMS } from '../../../constants';
import { useAuth } from '../../../context/AuthContext';
import ExpenseClaimsPage from './ExpenseClaimsPage';
import SiteEngineerKPIPage from './SiteEngineerKPIPage';
import VisitDetailModal from './VisitDetailModal';
import MyDayPage from '../shared/MyDayPage';
import CommunicationDashboard from '../../communication/CommunicationDashboard';
import EscalateIssuePage from '../../escalation/EscalateIssuePage';
import { useAutomatedTaskCreation } from '../../../hooks/useAutomatedTaskCreation';

const SiteEngineerDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [currentPage, setCurrentPage] = useState('overview');
  const [selectedVisit, setSelectedVisit] = useState<SiteVisit | null>(null);
  const [selectedDrawingTask, setSelectedDrawingTask] = useState<DrawingTask | null>(null);
  const { handleSiteVisitCompletion } = useAutomatedTaskCreation();

  const [siteVisits, setSiteVisits] = useState<SiteVisit[]>(() =>
    SITE_VISITS.filter(sv => sv.assigneeId === currentUser?.id)
  );
  const [expenseClaims, setExpenseClaims] = useState<ExpenseClaim[]>(() =>
    EXPENSE_CLAIMS.filter(ec => ec.engineerId === currentUser?.id)
  );

  // Mock drawing tasks - in real app, fetch from Firestore
  const [drawingTasks, setDrawingTasks] = useState<DrawingTask[]>([]);

  const handleUpdateVisit = (updatedVisit: SiteVisit) => {
    setSiteVisits(prev => prev.map(v => v.id === updatedVisit.id ? updatedVisit : v));
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
        return <SiteEngineerKPIPage visits={siteVisits} setCurrentPage={setCurrentPage} />;
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
