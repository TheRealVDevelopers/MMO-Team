import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PlusIcon, BuildingOfficeIcon, MagnifyingGlassIcon, UserIcon, MapPinIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
// import { ORGANIZATIONS } from '../../../constants';
import { Organization, ProjectStatus, Project, ExecutionStage, PaymentTerm } from '../../../types';
import { useProjects } from '../../../hooks/useProjects';
import CreateOrganizationModal from './CreateOrganizationModal';
import CreateProjectWizard from './CreateProjectWizard';
import ProjectDetailModal from '../super-admin/ProjectDetailModal';

interface OrganizationsPageProps {
    setCurrentPage: (page: string) => void;
}

import { useOrganizations } from '../../../hooks/useOrganizations';

const OrganizationsPage: React.FC<OrganizationsPageProps> = ({ setCurrentPage }) => {
    // const [organizations, setOrganizations] = useState<Organization[]>(ORGANIZATIONS); // Removed local state for orgs
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isProjectWizardOpen, setIsProjectWizardOpen] = useState(false);
    const [selectedOrgId, setSelectedOrgId] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');

    const [isProjectsModalOpen, setIsProjectsModalOpen] = useState(false);
    const [selectedOrgProjects, setSelectedOrgProjects] = useState<Project[]>([]);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);

    const { projects: allProjects, addProject } = useProjects();
    const { organizations: realOrgs, addOrganization, updateOrganization } = useOrganizations(); // Use the hook

    // Merge mock organizations with real Firestore organizations
    const organizations = realOrgs; // Removed mock ORGANIZATIONS

    const handleCreateOrganization = async (orgData: Omit<Organization, 'id' | 'createdAt' | 'createdBy' | 'projects'>) => {
        try {
            await addOrganization({
                ...orgData,
                projects: [],
                createdAt: new Date(),
                createdBy: 'current-user-id', // TODO: Use real user ID
                is_demo: false
            });
            // No need to manually update state, the hook will do it via snapshot listener
        } catch (error) {
            console.error("Failed to add organization", error);
            alert("Failed to add organization.");
        }
        setIsCreateModalOpen(false);
    };

    const handleCreateProject = async (projectData: any) => {
        console.log('Creating project:', projectData);

        try {
            // Map Wizard Data to Project Interface
            const newProject: Omit<Project, 'id'> = {
                clientName: projectData.clientName,
                projectName: projectData.projectName,
                status: ProjectStatus.SITE_VISIT_PENDING, // Updated initial status
                priority: 'Medium', // Default
                budget: Number(projectData.budget) || 0,
                advancePaid: Number(projectData.advanceAmount) || 0,
                clientAddress: projectData.location,
                clientContact: { name: projectData.clientName, phone: '' }, // Placeholder
                progress: 0,
                assignedTeam: {
                    execution: projectData.projectHeadId ? [projectData.projectHeadId] : [],
                    site_engineer: projectData.siteEngineerId,
                    drawing: projectData.designerId,
                },
                // Populate root-level assignment fields for dashboard filtering
                assignedEngineerId: projectData.siteEngineerId,
                drawingTeamMemberId: projectData.designerId,

                milestones: [],
                startDate: projectData.startDate ? new Date(projectData.startDate) : new Date(),
                endDate: projectData.deadline ? new Date(projectData.deadline) : new Date(),
                salespersonId: projectData.salesPersonId,
                organizationId: projectData.organizationId,
                is_demo: false,

                // Map Timeline to Stages
                stages: projectData.timeline?.map((t: any, idx: number) => ({
                    id: `stage-${Date.now()}-${idx}`,
                    name: t.phase,
                    deadline: t.date ? new Date(t.date) : new Date(),
                    status: 'Pending',
                } as ExecutionStage)) || [],

                // Map Payment Terms
                paymentTerms: projectData.paymentTerms?.map((t: any, idx: number) => ({
                    id: `pay-${Date.now()}-${idx}`,
                    milestone: t.milestone,
                    percentage: t.percentage,
                    amount: t.amount,
                    dueDate: t.dueDate ? new Date(t.dueDate) : undefined,
                    status: 'Pending'
                } as PaymentTerm)) || [],

                checklists: { daily: [], quality: [] },
                history: [{
                    action: 'Project Created',
                    user: 'Admin', // Should be current user name
                    timestamp: new Date(),
                    notes: 'Project initialized via Admin Wizard'
                }]
            };

            const projectId = await addProject(newProject);

            // Link project to Organization
            if (projectData.organizationId) {
                const org = organizations.find(o => o.id === projectData.organizationId);
                // Only update if it's a real Firestore organization (not mock)
                // We can assume real orgs don't have IDs starting with 'org-' unless we migrated data.
                // But for now, let's try to update. If it fails (because it's mock), we catch error.
                if (org && !org.is_demo) {
                    await updateOrganization(org.id, {
                        projects: [...(org.projects || []), projectId]
                    });
                }
            }

            alert('Project created successfully in Firestore!');

        } catch (error) {
            console.error("Failed to create project:", error);
            alert('Failed to create project. See console.');
        }
    };

    const handleViewProjects = (org: Organization) => {
        // Map project IDs to actual project objects from useProjects
        const projects = org.projects
            .map(pid => allProjects.find(p => p.id === pid))
            .filter((p): p is Project => !!p);

        setSelectedOrgProjects(projects);
        setIsProjectsModalOpen(true);
    };

    const filteredOrgs = organizations.filter(org =>
        org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        org.contactPerson.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Organization Management</h1>
                    <p className="text-text-secondary">Manage client organizations and their projects</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
                >
                    <PlusIcon className="w-5 h-5" />
                    Add Organization
                </button>
            </div>

            {/* Search and Filter */}
            <div className="bg-surface p-4 rounded-xl shadow-sm border border-border">
                <div className="relative max-w-md">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                    <input
                        type="text"
                        placeholder="Search organizations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-background text-text-primary placeholder:text-text-tertiary"
                    />
                </div>
            </div>

            {/* Organizations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredOrgs.map((org) => (
                    <motion.div
                        key={org.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-surface rounded-xl shadow-sm border border-border hover:shadow-md transition-shadow p-6 group cursor-pointer"
                        onClick={() => handleViewProjects(org)}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-primary/10 rounded-lg">
                                <BuildingOfficeIcon className="w-8 h-8 text-primary" />
                            </div>
                            <span className="text-xs font-medium px-2 py-1 bg-subtle-background rounded-full text-text-secondary">
                                {org.projects.length} Projects
                            </span>
                        </div>

                        <h3 className="text-xl font-bold text-text-primary mb-2 group-hover:text-primary transition-colors">
                            {org.name}
                        </h3>

                        <div className="space-y-3 text-sm text-text-secondary">
                            <div className="flex items-center gap-2">
                                <UserIcon className="w-4 h-4" />
                                <span>{org.contactPerson}</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <MapPinIcon className="w-4 h-4 mt-0.5" />
                                <span className="line-clamp-2">{org.address}</span>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-border flex justify-between items-center">
                            <div className="text-xs text-gray-500">
                                Since {new Date(org.createdAt).toLocaleDateString()}
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedOrgId(org.id);
                                    setIsProjectWizardOpen(true);
                                }}
                                className="text-sm font-medium text-primary hover:text-primary/80"
                            >
                                + New Project
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>

            <CreateOrganizationModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSubmit={handleCreateOrganization}
            />

            <CreateProjectWizard
                isOpen={isProjectWizardOpen}
                onClose={() => setIsProjectWizardOpen(false)}
                onSubmit={handleCreateProject}
                preselectedOrgId={selectedOrgId}
                organizations={organizations}
            />

            {/* Project List Modal */}
            {isProjectsModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setIsProjectsModalOpen(false)}>
                    <div className="bg-surface rounded-2xl p-6 w-full max-w-md shadow-2xl border border-border" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-text-primary mb-6">Ongoing Projects</h3>
                        {selectedOrgProjects.length > 0 ? (
                            <ul className="space-y-3">
                                {selectedOrgProjects.map((p) => (
                                    <li
                                        key={p.id}
                                        onClick={() => {
                                            setSelectedProject(p);
                                            setIsProjectsModalOpen(false);
                                        }}
                                        className="p-4 bg-background border border-border rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-all group flex items-center justify-between"
                                    >
                                        <div>
                                            <p className="text-sm font-bold text-text-primary group-hover:text-primary transition-colors">{p.projectName}</p>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-text-tertiary mt-1">{p.status}</p>
                                        </div>
                                        <ChevronRightIcon className="w-4 h-4 text-text-tertiary group-hover:text-primary transition-all" />
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-text-secondary text-center py-8">No active projects linked to this organization.</p>
                        )}
                        <button
                            onClick={() => setIsProjectsModalOpen(false)}
                            className="mt-8 w-full py-4 bg-subtle-background text-text-primary rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-border transition-colors outline-none"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {selectedProject && (
                <ProjectDetailModal
                    project={selectedProject}
                    isOpen={!!selectedProject}
                    onClose={() => setSelectedProject(null)}
                />
            )}
        </div>
    );
};

export default OrganizationsPage;
