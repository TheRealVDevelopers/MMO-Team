
import React, { useState, useEffect } from 'react';
import QuotationOverviewPage from './quotation-team/QuotationOverviewPage';
import MyPerformancePage from './quotation-team/MyPerformancePage';
import { Project, Item, ProjectTemplate, RFQ, Bid, LeadPipelineStatus, ProjectStatus } from '../../types';
import QuotationDetailModal from './quotation-team/QuotationDetailModal';
import ItemsCatalogPage from './quotation-team/ItemsCatalogPage';
import ProjectTemplatesPage from './quotation-team/ProjectTemplatesPage';
import MyDayPage from './shared/MyDayPage';
import CommunicationDashboard from '../communication/CommunicationDashboard';
import EscalateIssuePage from '../escalation/EscalateIssuePage';
import { PROJECTS, ITEMS, PROJECT_TEMPLATES, RFQS, BIDS_DATA, USERS } from '../../constants';
import AddProjectModal from './quotation-team/AddProjectModal';
import AddItemModal from './quotation-team/AddItemModal';
import AddTemplateModal from './quotation-team/AddTemplateModal';
import { useLeads } from '../../hooks/useLeads';
import { useProjects } from '../../hooks/useProjects';
import { useAuth } from '../../context/AuthContext';
import { useCatalog } from '../../hooks/useCatalog';

const QuotationTeamDashboard: React.FC<{ currentPage: string, setCurrentPage: (page: string) => void }> = ({ currentPage, setCurrentPage }) => {
  const { currentUser } = useAuth();
  const { leads: firebaseLeads, loading: leadsLoading } = useLeads();
  const { projects: firebaseProjects, loading: projectsLoading, addProject } = useProjects(); // Destructure addProject
  const { items, addItem } = useCatalog(); // Use global catalog

  // Lifted State with LocalStorage Persistence for custom/demo overrides
  const [projectsState, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('mmo_projects');
    return saved ? JSON.parse(saved) : PROJECTS;
  });

  // Merge logic: Combine Firebase leads (in site visit+), Firebase projects, and local projects
  const projects = React.useMemo(() => {
    // 1. Start with local/demo projects
    let all = [...projectsState];

    // 2. Add Firebase Projects (avoid duplicates by ID)
    firebaseProjects.forEach(fp => {
      if (!all.find(a => a.id === fp.id)) {
        all.push(fp);
      }
    });

    // 3. Transform and add Firebase Leads that are SITE_VISIT_SCHEDULED or higher
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
  }, [projectsState, firebaseLeads, firebaseProjects]);

  // Use global items instead of local storage
  // const [items, setItems] = ... (removed)

  const [templates, setTemplates] = useState<ProjectTemplate[]>(() => {
    const saved = localStorage.getItem('mmo_templates');
    return saved ? JSON.parse(saved) : PROJECT_TEMPLATES;
  });
  const [rfqs, setRfqs] = useState<RFQ[]>(() => {
    const saved = localStorage.getItem('mmo_rfqs');
    return saved ? JSON.parse(saved) : RFQS;
  });
  const [bids, setBids] = useState<Bid[]>(() => {
    const saved = localStorage.getItem('mmo_bids');
    return saved ? JSON.parse(saved) : BIDS_DATA;
  });

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showAddTemplateModal, setShowAddTemplateModal] = useState(false);
  const [initialProjectData, setInitialProjectData] = useState<Partial<Project> | undefined>(undefined);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem('mmo_projects', JSON.stringify(projectsState));
  }, [projectsState]);

  // Removed item sync since we use global catalog

  useEffect(() => {
    localStorage.setItem('mmo_templates', JSON.stringify(templates));
  }, [templates]);

  useEffect(() => {
    localStorage.setItem('mmo_rfqs', JSON.stringify(rfqs));
  }, [rfqs]);

  useEffect(() => {
    localStorage.setItem('mmo_bids', JSON.stringify(bids));
  }, [bids]);

  // Real-time Storage Sync for multi-tab collaboration
  useEffect(() => {
    const syncData = () => {
      const savedProjects = localStorage.getItem('mmo_projects');
      if (savedProjects) setProjects(JSON.parse(savedProjects));

      const savedRfqs = localStorage.getItem('mmo_rfqs');
      if (savedRfqs) setRfqs(JSON.parse(savedRfqs));

      const savedBids = localStorage.getItem('mmo_bids');
      if (savedBids) setBids(JSON.parse(savedBids));
    };

    const handleStorage = (e: StorageEvent) => {
      if (['mmo_projects', 'mmo_rfqs', 'mmo_bids'].includes(e.key || '')) {
        syncData();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') syncData();
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', syncData); // Sync when user comes back to tab
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', syncData);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handleResetData = () => {
    if (window.confirm('Are you sure you want to reset all data to defaults? This will delete your custom items and projects.')) {
      localStorage.removeItem('mmo_projects');
      // localStorage.removeItem('mmo_items'); // Items are now global
      localStorage.removeItem('mmo_templates');
      localStorage.removeItem('mmo_rfqs');
      localStorage.removeItem('mmo_bids');
      setProjects(PROJECTS);
      // setItems(ITEMS); // Items are now global
      setTemplates(PROJECT_TEMPLATES);
      setRfqs(RFQS);
      setBids(BIDS_DATA);
    }
  };

  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project);
  };

  const handleProjectUpdate = (updatedProject: Project) => {
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
    setSelectedProject(updatedProject);
  };

  const handleCreateProject = async (newProjectData: Omit<Project, 'id'>, rfq?: RFQ) => {
    try {
      if (addProject) {
        await addProject(newProjectData); // Use global hook
      } else {
        // Fallback if not available (should be)
        const projectId = (Date.now()).toString();
        const newProject: Project = { ...newProjectData, id: projectId };
        setProjects(prev => [newProject, ...prev]);
      }

      if (rfq) {
        // Note: RFQ linkage might need backend support or separate hook. 
        // For now, we keep local RFQ state or assume addProject handles it if expanded.
        // But preserving local RFQ linkage logic:
        const rfqId = `rfq-${Date.now()}`;
        const linkedRfq = { ...rfq, projectId: 'pending-id' }; // Ideally get ID from addProject result
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
      case 'quotations':
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
            items={items}
            setCurrentPage={setCurrentPage}
            onAddItem={() => setShowAddItemModal(true)}
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
