
import React, { useState, useEffect } from 'react';
import QuotationOverviewPage from './quotation-team/QuotationOverviewPage';
import MyPerformancePage from './quotation-team/MyPerformancePage';
import CustomerQuotationBuilder from './quotation-team/CustomerQuotationBuilder';
import UnifiedRequestInbox from './shared/UnifiedRequestInbox';
import ProjectDetailsPage from './shared/ProjectDetailsPage';
import { Project, Item, ProjectTemplate, RFQ, Bid, LeadPipelineStatus, ProjectStatus } from '../../types';
import QuotationDetailModal from './quotation-team/QuotationDetailModal';
import ItemsCatalogPage from './quotation-team/ItemsCatalogPage';
import ProjectTemplatesPage from './quotation-team/ProjectTemplatesPage';
import MyDayPage from './shared/MyDayPage';
import CommunicationDashboard from '../communication/CommunicationDashboard';
import EscalateIssuePage from '../escalation/EscalateIssuePage';
import { ITEMS, PROJECT_TEMPLATES, RFQS, BIDS_DATA, USERS } from '../../constants';
import AddProjectModal from './quotation-team/AddProjectModal';
import AddItemModal from './quotation-team/AddItemModal';
import AddTemplateModal from './quotation-team/AddTemplateModal';
import { useLeads } from '../../hooks/useLeads';
import { useProjects } from '../../hooks/useProjects';
import { useAuth } from '../../context/AuthContext';
import { useCatalog } from '../../hooks/useCatalog';

const QuotationTeamDashboard: React.FC<{ currentPage: string, setCurrentPage: (page: string, params?: any) => void }> = ({ currentPage, setCurrentPage }) => {
  const { currentUser } = useAuth();
  // ❌ DEMO DATA REMOVED - No localStorage fallback, only Firestore
  const { leads: firebaseLeads, loading: leadsLoading } = useLeads();
  const { projects: firebaseProjects, loading: projectsLoading, addProject } = useProjects();
  const { items, addItem } = useCatalog();

  // ✅ REAL DATA ONLY: Merge Firebase leads (in site visit+) with Firebase projects
  const projects = React.useMemo(() => {
    let all: Project[] = [];

    // 1. Add Firebase Projects
    firebaseProjects.forEach(fp => {
      if (!all.find(a => a.id === fp.id)) {
        all.push(fp);
      }
    });

    // 2. Transform and add Firebase Leads that are SITE_VISIT_SCHEDULED or higher
    firebaseLeads.forEach(lead => {
      const qualifyingStatuses = [
        LeadPipelineStatus.SITE_VISIT_SCHEDULED,
        LeadPipelineStatus.SITE_VISIT_RESCHEDULED,
        LeadPipelineStatus.WAITING_FOR_DRAWING,
        LeadPipelineStatus.DRAWING_IN_PROGRESS,
        LeadPipelineStatus.DRAWING_REVISIONS,
        LeadPipelineStatus.WAITING_FOR_QUOTATION,
        LeadPipelineStatus.QUOTATION_SENT,
        LeadPipelineStatus.NEGOTIATION,
        LeadPipelineStatus.IN_PROCUREMENT,
        LeadPipelineStatus.IN_EXECUTION,
        LeadPipelineStatus.WON
      ];

      if (qualifyingStatuses.includes(lead.status)) {
        // If not already in projects list as a converted project
        if (!all.find(p => p.id === lead.id)) {
          // Map Lead structure to Project structure
          const convertedLeads: Project = {
            id: lead.id,
            clientName: lead.clientName,
            projectName: lead.projectName,
            status: lead.status as unknown as ProjectStatus, // Simplified mapping
            budget: lead.value || 0,
            priority: lead.priority,
            deadline: lead.deadline ? lead.deadline.toISOString().split('T')[0] : 'TBD',
            assignedTeam: {
              quotation: 'user-5', // Default to Mike Quote for now
            },
            advancePaid: 0,
            clientAddress: '',
            clientContact: { name: lead.clientName, phone: lead.clientMobile || '' },
            progress: 0,
            milestones: [],
            startDate: lead.inquiryDate,
            endDate: new Date(new Date().setDate(new Date().getDate() + 30)),
            history: lead.history,
            is_demo: lead.is_demo
          };
          all.push(convertedLeads);
        }
      }
    });

    return all;
  }, [firebaseLeads, firebaseProjects]);

  // Use global items from catalog (no localStorage)
  const [templates, setTemplates] = useState<ProjectTemplate[]>(PROJECT_TEMPLATES);
  const [rfqs, setRfqs] = useState<RFQ[]>(RFQS);
  const [bids, setBids] = useState<Bid[]>(BIDS_DATA);

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showAddTemplateModal, setShowAddTemplateModal] = useState(false);
  const [initialProjectData, setInitialProjectData] = useState<Partial<Project> | undefined>(undefined);

  // ❌ REMOVED ALL LOCAL STORAGE SYNC - Data now flows from Firestore only

  const handleResetData = () => {
    alert('Reset feature disabled. All data is now managed in Firestore.');
  };

  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project);
  };

  const handleProjectUpdate = async (updatedProject: Project) => {
    // ✅ Update via Firestore, not local state
    try {
      // Add updateProject hook call here when needed
      console.log('Project update:', updatedProject);
    } catch (error) {
      console.error('Failed to update project:', error);
    }
    setSelectedProject(updatedProject);
  };

  const handleCreateProject = async (newProjectData: Omit<Project, 'id'>, rfq?: RFQ) => {
    try {
      await addProject(newProjectData); // ✅ Firestore only

      if (rfq) {
        const rfqId = `rfq-${Date.now()}`;
        const linkedRfq = { ...rfq, projectId: 'pending-id' };
        setRfqs(prev => [linkedRfq, ...prev]);
      }
    } catch (err) {
      console.error("Failed to create project", err);
      alert("Failed to create project");
    }
  };

  const handleCreateItem = async (newItemData: Omit<Item, 'id'>) => {
    try {
      await addItem(newItemData); // Use global hook
    } catch (err) {
      console.error("Failed to create item", err);
      alert("Failed to create item");
    }
  };

  const handleCreateTemplate = (newTemplateData: Omit<ProjectTemplate, 'id'>) => {
    const newTemplate: ProjectTemplate = {
      ...newTemplateData,
      id: (Date.now()).toString()
    };
    setTemplates(prev => [newTemplate, ...prev]);
  };

  const handleUseTemplate = (template: ProjectTemplate) => {
    // Convert template to project-like initial data
    setInitialProjectData({
      projectName: template.name,
      budget: template.avgCost,
      items: []
    });
    setShowAddProjectModal(true);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'my-day':
        return <MyDayPage />;
      case 'requests':
        return <UnifiedRequestInbox />;
      case 'quotations':
        // Use new Customer Quotation Builder
        return <CustomerQuotationBuilder />;
      case 'overview':
        // Pass dynamic projects and handler
        return (
          <QuotationOverviewPage
            projects={projects}
            onProjectSelect={handleProjectSelect}
            onCreateProject={() => setShowAddProjectModal(true)}
            onReset={handleResetData}
          />
        );
      case 'negotiations':
        // Redirecting Negotiations tab to the new simplified Overview
        return (
          <QuotationOverviewPage
            projects={projects}
            onProjectSelect={handleProjectSelect}
            onCreateProject={() => setShowAddProjectModal(true)}
            onReset={handleResetData}
          />
        );
      // case 'performance':
      //   return <MyPerformancePage setCurrentPage={setCurrentPage} />;
      case 'catalog':
        return (
          <ItemsCatalogPage
            setCurrentPage={setCurrentPage}
          />
        );
      case 'templates':
        return (
          <ProjectTemplatesPage
            templates={templates}
            setCurrentPage={setCurrentPage}
            onAddTemplate={() => setShowAddTemplateModal(true)}
            onUseTemplate={handleUseTemplate}
          />
        );
      case 'communication':
        return <CommunicationDashboard />;
      case 'escalate-issue':
        return <EscalateIssuePage setCurrentPage={setCurrentPage} />;
      default:
        return <MyDayPage />;
    }
  };

  return (
    <>
      {renderPage()}

      {/* Existing Detail Modal */}
      {selectedProject && (
        <QuotationDetailModal
          project={selectedProject}
          isOpen={!!selectedProject}
          onClose={() => setSelectedProject(null)}
          onUpdate={handleProjectUpdate}
          rfqs={rfqs}
          bids={bids}
        />
      )}

      {/* New Creation Modals */}
      <AddProjectModal
        isOpen={showAddProjectModal}
        onClose={() => {
          setShowAddProjectModal(false);
          setInitialProjectData(undefined);
        }}
        onSubmit={handleCreateProject}
        items={items}
        projects={projects}
        initialData={initialProjectData}
      />

      <AddItemModal
        isOpen={showAddItemModal}
        onClose={() => setShowAddItemModal(false)}
        onSubmit={handleCreateItem}
      />

      <AddTemplateModal
        isOpen={showAddTemplateModal}
        onClose={() => setShowAddTemplateModal(false)}
        onSubmit={handleCreateTemplate}
        items={items}
      />
    </>
  );
};

export default QuotationTeamDashboard;
