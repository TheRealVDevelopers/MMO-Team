

import React, { useState } from 'react';
import SiteEngineerSidebar from './site-engineer/SiteEngineerSidebar';
import EngineerOverviewPage from './site-engineer/EngineerOverviewPage';
import { SiteVisit, ExpenseClaim, SiteReport } from '../../types';
import { SITE_VISITS, EXPENSE_CLAIMS } from '../../constants';
import { useAuth } from '../../context/AuthContext';
import ExpenseClaimsPage from './site-engineer/ExpenseClaimsPage';
import SiteEngineerKPIPage from './site-engineer/SiteEngineerKPIPage';
import VisitDetailModal from './site-engineer/VisitDetailModal';

const SiteEngineerDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedVisit, setSelectedVisit] = useState<SiteVisit | null>(null);

  const [siteVisits, setSiteVisits] = useState<SiteVisit[]>(() => 
    SITE_VISITS.filter(sv => sv.assigneeId === currentUser?.id)
  );
  const [expenseClaims, setExpenseClaims] = useState<ExpenseClaim[]>(() =>
    EXPENSE_CLAIMS.filter(ec => ec.engineerId === currentUser?.id)
  );
  
  const handleUpdateVisit = (updatedVisit: SiteVisit) => {
    setSiteVisits(prev => prev.map(v => v.id === updatedVisit.id ? updatedVisit : v));
    // Keep modal open with updated data
    if(selectedVisit) {
        setSelectedVisit(updatedVisit);
    }
  };
  
  const handleSubmitReport = (report: SiteReport, newExpenseClaim?: Omit<ExpenseClaim, 'id'>) => {
    const updatedVisit = siteVisits.find(v => v.id === report.visitId);
    if(updatedVisit) {
        handleUpdateVisit({ ...updatedVisit, reportId: report.id });
    }
    
    if (newExpenseClaim) {
        const claim: ExpenseClaim = { ...newExpenseClaim, id: `ec-${Date.now()}`};
        setExpenseClaims(prev => [claim, ...prev]);
    }

    setSelectedVisit(null);
  };


  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <SiteEngineerKPIPage visits={siteVisits} setCurrentPage={setCurrentPage} />;
      case 'schedule':
        return <EngineerOverviewPage 
                    visits={siteVisits} 
                    onSelectVisit={setSelectedVisit}
                    setCurrentPage={setCurrentPage}
                />;
      case 'expenses':
        return <ExpenseClaimsPage claims={expenseClaims} setCurrentPage={setCurrentPage} />;
      default:
        return <SiteEngineerKPIPage visits={siteVisits} setCurrentPage={setCurrentPage} />;
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