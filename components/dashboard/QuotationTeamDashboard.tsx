
import React, { useState } from 'react';
import QuotationOverviewPage from './quotation-team/QuotationOverviewPage';
import NegotiationsBoardPage from './quotation-team/NegotiationsBoardPage';
import MyPerformancePage from './quotation-team/MyPerformancePage';
import { Project, Item, ProjectTemplate } from '../../types';
import QuotationDetailModal from './quotation-team/QuotationDetailModal';
import ItemsCatalogPage from './quotation-team/ItemsCatalogPage';
import ProjectTemplatesPage from './quotation-team/ProjectTemplatesPage';
import MyDayPage from './shared/MyDayPage';
import CommunicationDashboard from '../communication/CommunicationDashboard';
import EscalateIssuePage from '../escalation/EscalateIssuePage';
import { PROJECTS, ITEMS, PROJECT_TEMPLATES } from '../../constants';
import AddProjectModal from './quotation-team/AddProjectModal';
import AddItemModal from './quotation-team/AddItemModal';
import AddTemplateModal from './quotation-team/AddTemplateModal';

const QuotationTeamDashboard: React.FC<{ currentPage: string, setCurrentPage: (page: string) => void }> = ({ currentPage, setCurrentPage }) => {
  // Lifted State
  const [projects, setProjects] = useState<Project[]>(PROJECTS);
  const [items, setItems] = useState<Item[]>(ITEMS);
  const [templates, setTemplates] = useState<ProjectTemplate[]>(PROJECT_TEMPLATES);

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showAddTemplateModal, setShowAddTemplateModal] = useState(false);

  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project);
  };

  const handleProjectUpdate = (updatedProject: Project) => {
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
    setSelectedProject(updatedProject);
  };

  const handleCreateProject = (newProjectData: Omit<Project, 'id'>) => {
    const newProject: Project = {
      ...newProjectData,
      id: (Date.now()).toString(),
    };
    setProjects(prev => [newProject, ...prev]);
  };

  const handleCreateItem = (newItemData: Omit<Item, 'id'>) => {
    const newItem: Item = {
      ...newItemData,
      id: (Date.now()).toString(),
    };
    setItems(prev => [newItem, ...prev]);
  };

  const handleCreateTemplate = (newTemplateData: Omit<ProjectTemplate, 'id'>) => {
    const newTemplate: ProjectTemplate = {
      ...newTemplateData,
      id: (Date.now()).toString()
    };
    setTemplates(prev => [newTemplate, ...prev]);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'my-day':
        return <MyDayPage />;
      case 'overview':
        // Pass dynamic projects and handler
        return (
          <QuotationOverviewPage
            projects={projects}
            onProjectSelect={handleProjectSelect}
            onCreateProject={() => setShowAddProjectModal(true)}
          />
        );
      case 'negotiations':
        return (
          <NegotiationsBoardPage
            projects={projects}
            onProjectSelect={handleProjectSelect}
            setCurrentPage={setCurrentPage}
            onCreateProject={() => setShowAddProjectModal(true)}
          />
        );
      case 'performance':
        return <MyPerformancePage setCurrentPage={setCurrentPage} />;
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
        />
      )}

      {/* New Creation Modals */}
      <AddProjectModal
        isOpen={showAddProjectModal}
        onClose={() => setShowAddProjectModal(false)}
        onSubmit={handleCreateProject}
        items={items}
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
