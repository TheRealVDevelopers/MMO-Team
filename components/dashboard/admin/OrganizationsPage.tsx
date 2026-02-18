import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { PlusIcon, BuildingOfficeIcon, MagnifyingGlassIcon, UserIcon, MapPinIcon, XMarkIcon, CurrencyRupeeIcon, UserCircleIcon, MapIcon, CheckCircleIcon, PencilIcon, RocketLaunchIcon, BanknotesIcon } from '@heroicons/react/24/outline';
import { Organization, ProjectStatus, Project, ExecutionStage, PaymentTerm } from '../../../types';
import { useProjects } from '../../../hooks/useProjects';
import { useLeads } from '../../../hooks/useLeads';
import { formatCurrencyINR } from '../../../constants';
import CreateOrganizationModal from './CreateOrganizationModal';
import ConvertFromLeadModal from './ConvertFromLeadModal';
import CreateFreshProjectModal from './CreateFreshProjectModal';
import VerifyWithAccountantModal from './VerifyWithAccountantModal';
import Modal from '../../shared/Modal';

interface OrganizationsPageProps {
    setCurrentPage: (page: string) => void;
}

import { useOrganizations } from '../../../hooks/useOrganizations';
import { useUsers } from '../../../hooks/useUsers';

const OrganizationsPage: React.FC<OrganizationsPageProps> = ({ setCurrentPage }) => {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isProjectLauncherOpen, setIsProjectLauncherOpen] = useState(false);
    const [isConvertLeadModalOpen, setIsConvertLeadModalOpen] = useState(false);
    const [isVerifyAccountantModalOpen, setIsVerifyAccountantModalOpen] = useState(false);
    const [isFreshProjectModalOpen, setIsFreshProjectModalOpen] = useState(false);
    const [selectedOrgId, setSelectedOrgId] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');
    const [organizationToEdit, setOrganizationToEdit] = useState<Organization | null>(null);

    const [isProjectsModalOpen, setIsProjectsModalOpen] = useState(false);
    const [selectedOrgProjects, setSelectedOrgProjects] = useState<Project[]>([]);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [isProjectDetailOpen, setIsProjectDetailOpen] = useState(false);

    const { addProject, projects: allProjects } = useProjects();
    const { leads } = useLeads();
    const { organizations: realOrgs, addOrganization, updateOrganization, loading: orgsLoading, error: orgsError } = useOrganizations();
    const { users } = useUsers();

    const organizations = realOrgs ?? [];

    const handleCreateOrganization = async (orgData: Omit<Organization, 'id' | 'createdAt' | 'createdBy' | 'projects'>) => {
        try {
            if (organizationToEdit) {
                await updateOrganization(organizationToEdit.id, orgData);
            } else {
                await addOrganization({
                    ...orgData,
                    projects: [],
                    createdAt: new Date(),
                    createdBy: 'current-user-id', // TODO: Use real user ID
                    is_demo: false
                });
            }
            // No need to manually update state, the hook will do it via snapshot listener
        } catch (error) {
            console.error("Failed to add/update organization", error);
            alert("Failed to save organization.");
        }
        setIsCreateModalOpen(false);
        setOrganizationToEdit(null);
    };

    const handleProjectCreated = async (caseId: string) => {
        try {
            const docRef = doc(db, 'cases', caseId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const projectData = { id: docSnap.id, ...docSnap.data() } as Project;
                setSelectedProject(projectData);
                setIsProjectDetailOpen(true);
            }
        } catch (error) {
            console.error("Error fetching new project:", error);
        }
    };
    const handleOpenCreateModal = () => {
        setOrganizationToEdit(null);
        setIsCreateModalOpen(true);
    };

    const handleViewProjects = (org: Organization) => {
        // Fetch real projects by organization ID
        const orgProjects = (allProjects || []).filter(p => p.organizationId === org.id);
        setSelectedOrgProjects(orgProjects);
        setIsProjectsModalOpen(true);
    };

    const handleProjectClick = (project: Project) => {
        setSelectedProject(project);
        setIsProjectDetailOpen(true);
    };

    const getStatusColor = (status: ProjectStatus) => {
        const colors: Record<string, string> = {
            [ProjectStatus.COMPLETED]: 'bg-green-100 text-green-800 border-green-200',
            [ProjectStatus.IN_EXECUTION]: 'bg-blue-100 text-blue-800 border-blue-200',
            [ProjectStatus.APPROVED]: 'bg-purple-100 text-purple-800 border-purple-200',
            [ProjectStatus.ON_HOLD]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            [ProjectStatus.SITE_VISIT_PENDING]: 'bg-orange-100 text-orange-800 border-orange-200',
            [ProjectStatus.DRAWING_PENDING]: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        };
        return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    const filteredOrgs = organizations.filter(org =>
        (org?.name ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (org?.contactPerson ?? '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Count projects for each organization
    const getOrgProjectCount = (orgId: string) => {
        return (allProjects || []).filter(p => p.organizationId === orgId).length;
    };

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Organization Management</h1>
                    <p className="text-gray-500 dark:text-gray-400">Manage client organizations and their projects</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            setSelectedOrgId('');
                            setIsProjectLauncherOpen(true);
                        }}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl transition-colors shadow-lg shadow-green-600/30 font-bold text-lg"
                    >
                        <RocketLaunchIcon className="w-6 h-6" />
                        New Project
                    </button>
                    <button
                        onClick={handleOpenCreateModal}
                        className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
                    >
                        <PlusIcon className="w-5 h-5" />
                        Add Organization
                    </button>
                </div>
            </div>

            {/* Search and Filter */}
            <div className="bg-surface p-4 rounded-xl shadow-sm border border-border">
                <div className="relative max-w-md">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search organizations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-background text-text-primary"
                    />
                </div>
            </div>

            {/* Loading / Error state */}
            {orgsLoading && (
                <div className="text-center py-12 text-text-secondary">Loading organizations...</div>
            )}
            {orgsError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-red-700 dark:text-red-300">
                    Failed to load organizations. Please try again.
                </div>
            )}

            {/* Organizations Grid */}
            {!orgsLoading && !orgsError && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredOrgs.map((org) => (
                        <motion.div
                            key={org?.id ?? ''}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-surface rounded-xl shadow-sm border border-border hover:shadow-md transition-shadow p-6 group cursor-pointer"
                            onClick={() => org && handleViewProjects(org)}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-primary/10 rounded-lg">
                                    <BuildingOfficeIcon className="w-8 h-8 text-primary" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (org) {
                                                setOrganizationToEdit(org);
                                                setIsCreateModalOpen(true);
                                            }
                                        }}
                                        className="p-1.5 text-text-tertiary hover:text-primary hover:bg-primary/10 rounded-lg transition-colors bg-subtle-background"
                                        title="Edit Organization"
                                    >
                                        <PencilIcon className="w-4 h-4" />
                                    </button>
                                    <span className="text-xs font-medium px-2 py-1 bg-subtle-background rounded-full text-text-secondary">
                                        {getOrgProjectCount(org?.id ?? '')} Projects
                                    </span>
                                </div>
                            </div>

                            <h3 className="text-xl font-bold text-text-primary mb-2 group-hover:text-primary transition-colors">
                                {org?.name ?? 'Unnamed'}
                            </h3>
                            {org?.isB2IChild && (
                                <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 mb-2">
                                    B2I Linked
                                </span>
                            )}

                            <div className="space-y-3 text-sm text-text-secondary">
                                <div className="flex items-center gap-2">
                                    <UserIcon className="w-4 h-4" />
                                    <span>{org?.contactPerson ?? '—'}</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <MapPinIcon className="w-4 h-4 mt-0.5" />
                                    <span className="line-clamp-2">{org?.address ?? '—'}</span>
                                </div>
                            </div>

                            <div className="mt-6 pt-4 border-t border-border flex justify-between items-center">
                                <div className="text-xs text-text-tertiary">
                                    Since {org?.createdAt ? new Date(org.createdAt).toLocaleDateString() : 'N/A'}
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (org?.id) {
                                            setSelectedOrgId(org.id);
                                            setIsProjectLauncherOpen(true);
                                        }
                                    }}
                                    className="text-sm font-medium text-primary hover:text-primary/80"
                                >
                                    + New Project
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            <CreateOrganizationModal
                isOpen={isCreateModalOpen}
                onClose={() => {
                    setIsCreateModalOpen(false);
                    setOrganizationToEdit(null);
                }}
                onSubmit={handleCreateOrganization}
                initialData={organizationToEdit}
            />

            {/* New Project Launcher Modal */}
            {isProjectLauncherOpen && (
                <Modal
                    isOpen={isProjectLauncherOpen}
                    onClose={() => setIsProjectLauncherOpen(false)}
                    title="Create New Project"
                    size="lg"
                >
                    <div className="space-y-6 p-4">
                        <p className="text-text-secondary text-center">Choose how you want to create this project:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button
                                onClick={() => {
                                    setIsProjectLauncherOpen(false);
                                    setIsVerifyAccountantModalOpen(true);
                                }}
                                className="p-6 bg-subtle-background hover:bg-primary/10 border-2 border-border hover:border-primary rounded-xl transition-all text-left group"
                            >
                                <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg w-fit mb-4">
                                    <BanknotesIcon className="w-8 h-8 text-orange-600" />
                                </div>
                                <h3 className="text-lg font-bold text-text-primary group-hover:text-primary">Convert From Lead</h3>
                                <p className="text-sm text-text-secondary mt-1">Select lead and verify payment with accountant first</p>
                                <p className="text-xs text-orange-600 mt-2">⚠️ Requires accountant approval</p>
                            </button>
                            <button
                                onClick={() => {
                                    setIsProjectLauncherOpen(false);
                                    setIsFreshProjectModalOpen(true);
                                }}
                                className="p-6 bg-subtle-background hover:bg-primary/10 border-2 border-border hover:border-primary rounded-xl transition-all text-left group"
                            >
                                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg w-fit mb-4">
                                    <RocketLaunchIcon className="w-8 h-8 text-green-600" />
                                </div>
                                <h3 className="text-lg font-bold text-text-primary group-hover:text-primary">Create Fresh Project</h3>
                                <p className="text-sm text-text-secondary mt-1">Start a brand new project from scratch</p>
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Enhanced Projects Modal */}
            {isProjectsModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in" onClick={() => setIsProjectsModalOpen(false)}>
                    <div className="bg-surface rounded-xl p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto shadow-2xl border border-border" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-2xl font-bold text-text-primary">Organization Projects</h3>
                                <p className="text-sm text-text-secondary mt-1">Click on any project to view full details</p>
                            </div>
                            <button onClick={() => setIsProjectsModalOpen(false)} className="p-2 hover:bg-subtle-background rounded-full transition-colors">
                                <XMarkIcon className="w-6 h-6 text-gray-500" />
                            </button>
                        </div>

                        {selectedOrgProjects.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {selectedOrgProjects.map((project) => {
                                    const salesperson = users.find(u => u.id === project.salespersonId);
                                    const projectLead = leads.find(l => l.projectName === project.projectName || l.clientName === project.clientName);

                                    return (
                                        <motion.div
                                            key={project.id}
                                            whileHover={{ scale: 1.02 }}
                                            className="p-4 bg-subtle-background rounded-lg border border-border hover:border-primary cursor-pointer transition-all hover:shadow-md"
                                            onClick={() => handleProjectClick(project)}
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex-1">
                                                    <h4 className="text-lg font-bold text-text-primary">{project.projectName}</h4>
                                                    <p className="text-sm text-text-secondary">{project.clientName}</p>
                                                </div>
                                                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${getStatusColor(project.status)}`}>
                                                    {project.status}
                                                </span>
                                            </div>

                                            <div className="space-y-2 text-sm">
                                                <div className="flex items-center gap-2 text-text-secondary">
                                                    <CurrencyRupeeIcon className="w-4 h-4" />
                                                    <span className="font-semibold">Budget:</span>
                                                    <span className="text-primary font-bold">{formatCurrencyINR(project.budget)}</span>
                                                </div>

                                                {salesperson && (
                                                    <div className="flex items-center gap-2 text-text-secondary">
                                                        <UserCircleIcon className="w-4 h-4" />
                                                        <span className="font-semibold">Sales:</span>
                                                        <span>{salesperson.name}</span>
                                                    </div>
                                                )}

                                                {projectLead && (
                                                    <div className="flex items-center gap-2 text-text-secondary">
                                                        <MapIcon className="w-4 h-4" />
                                                        <span className="font-semibold">Source:</span>
                                                        <span>{projectLead.source}</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="mt-3 pt-3 border-t border-border text-xs text-text-tertiary">
                                                Click for full details →
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <BuildingOfficeIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">No active projects linked to this organization.</p>
                            </div>
                        )}

                        <button
                            onClick={() => setIsProjectsModalOpen(false)}
                            className="mt-6 w-full py-2.5 bg-subtle-background hover:bg-primary/10 rounded-lg font-bold text-text-secondary transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Detailed Project Modal */}
            {isProjectDetailOpen && selectedProject && (
                <Modal
                    isOpen={isProjectDetailOpen}
                    onClose={() => setIsProjectDetailOpen(false)}
                    title={selectedProject.projectName}
                    size="5xl"
                >
                    <div className="space-y-6">
                        {/* Header Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-subtle-background rounded-xl border border-border shadow-sm">
                            <div>
                                <label className="text-xs font-bold text-text-tertiary uppercase tracking-wider">Client Name</label>
                                <p className="text-lg font-bold text-text-primary mt-1">{selectedProject.clientName}</p>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-text-tertiary uppercase tracking-wider">Status</label>
                                <p className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-bold border ${getStatusColor(selectedProject.status)}`}>
                                    {selectedProject.status}
                                </p>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-text-tertiary uppercase tracking-wider">Total Budget</label>
                                <p className="text-2xl font-bold text-primary mt-1">{formatCurrencyINR(selectedProject.budget)}</p>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-text-tertiary uppercase tracking-wider">Advance Paid</label>
                                <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrencyINR(selectedProject.advancePaid || 0)}</p>
                            </div>
                        </div>

                        {/* Lead Information */}
                        {(() => {
                            const projectLead = leads.find(l => l.projectName === selectedProject.projectName || l.clientName === selectedProject.clientName);
                            const salesperson = users.find(u => u.id === selectedProject.salespersonId);

                            return (
                                <div className="p-6 bg-primary-subtle-background rounded-lg border border-primary/20">
                                    <h4 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                                        <UserCircleIcon className="w-6 h-6 text-blue-600" />
                                        Lead Information
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-text-secondary uppercase">Sales Representative</label>
                                            <p className="text-sm font-semibold text-text-primary mt-1">{salesperson?.name || 'Not Assigned'}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-text-secondary uppercase">Lead Source</label>
                                            <p className="text-sm font-semibold text-text-primary mt-1">{projectLead?.source || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-text-secondary uppercase">Lead Value</label>
                                            <p className="text-sm font-semibold text-primary mt-1">{projectLead ? formatCurrencyINR(projectLead.value) : 'N/A'}</p>
                                        </div>
                                        {projectLead && (
                                            <>
                                                <div>
                                                    <label className="text-xs font-bold text-text-secondary uppercase">Lead Status</label>
                                                    <p className="text-sm font-semibold text-text-primary mt-1">{projectLead.status}</p>
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-text-secondary uppercase">Inquiry Date</label>
                                                    <p className="text-sm font-semibold text-text-primary mt-1">{new Date(projectLead.inquiryDate).toLocaleDateString()}</p>
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-text-secondary uppercase">Priority</label>
                                                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-bold ${projectLead.priority === 'High' ? 'bg-red-100 text-red-800' :
                                                        projectLead.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {projectLead.priority}
                                                    </span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Project Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="text-xs font-bold text-text-tertiary uppercase tracking-wider">Location</label>
                                <p className="text-sm text-text-primary mt-1">{selectedProject.clientAddress}</p>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-text-tertiary uppercase tracking-wider">Progress</label>
                                <div className="mt-2">
                                    <div className="w-full bg-subtle-background rounded-full h-2.5">
                                        <div
                                            className="bg-primary h-2.5 rounded-full transition-all"
                                            style={{ width: `${selectedProject.progress || 0}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-text-secondary mt-1">{selectedProject.progress || 0}% Complete</p>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-text-tertiary uppercase tracking-wider">Start Date</label>
                                <p className="text-sm text-text-primary mt-1">{selectedProject.startDate ? new Date(selectedProject.startDate).toLocaleDateString() : 'N/A'}</p>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-text-tertiary uppercase tracking-wider">End Date</label>
                                <p className="text-sm text-text-primary mt-1">{selectedProject.endDate ? new Date(selectedProject.endDate).toLocaleDateString() : 'N/A'}</p>
                            </div>
                        </div>

                        {/* Payment Terms */}
                        {selectedProject.paymentTerms && selectedProject.paymentTerms.length > 0 && (
                            <div>
                                <h4 className="text-lg font-bold text-text-primary mb-3 flex items-center gap-2">
                                    <CurrencyRupeeIcon className="w-6 h-6 text-green-600" />
                                    Payment Schedule
                                </h4>
                                <div className="space-y-2">
                                    {selectedProject.paymentTerms.map((term, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-surface rounded-lg border border-border shadow-sm">
                                            <div className="flex-1">
                                                <p className="text-sm font-semibold text-text-primary">{term.milestone}</p>
                                                <p className="text-xs text-text-tertiary">{term.percentage}% of total</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-primary">{formatCurrencyINR(Number(term.amount))}</p>
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${term.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {term.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Team Information */}
                        <div>
                            <h4 className="text-lg font-bold text-text-primary mb-3">Assigned Team</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {selectedProject.assignedEngineerId && (
                                    <div className="p-3 bg-purple-subtle-background rounded-lg">
                                        <label className="text-xs font-bold text-purple-subtle-text uppercase">Site Engineer</label>
                                        <p className="text-sm font-semibold text-text-primary mt-1">
                                            {users.find(u => u.id === selectedProject.assignedEngineerId)?.name || 'Not Assigned'}
                                        </p>
                                    </div>
                                )}
                                {selectedProject.drawingTeamMemberId && (
                                    <div className="p-3 bg-accent-subtle-background rounded-lg">
                                        <label className="text-xs font-bold text-accent-subtle-text uppercase">Designer</label>
                                        <p className="text-sm font-semibold text-text-primary mt-1">
                                            {users.find(u => u.id === selectedProject.drawingTeamMemberId)?.name || 'Not Assigned'}
                                        </p>
                                    </div>
                                )}
                                {selectedProject.salespersonId && (
                                    <div className="p-3 bg-secondary-subtle-background rounded-lg">
                                        <label className="text-xs font-bold text-secondary-subtle-text uppercase">Sales Rep</label>
                                        <p className="text-sm font-semibold text-text-primary mt-1">
                                            {users.find(u => u.id === selectedProject.salespersonId)?.name || 'Not Assigned'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Verify With Accountant Modal (PAYMENT-GATED) */}
            <VerifyWithAccountantModal
                isOpen={isVerifyAccountantModalOpen}
                onClose={() => setIsVerifyAccountantModalOpen(false)}
                organizationId={selectedOrgId}
                onSubmitSuccess={() => {
                    // Refresh data after submission
                }}
            />

            {/* Legacy Convert From Lead Modal (DEPRECATED - kept for reference) */}
            {/* <ConvertFromLeadModal
                isOpen={isConvertLeadModalOpen}
                onClose={() => setIsConvertLeadModalOpen(false)}
                organizationId={selectedOrgId}
                onProjectCreated={(caseId) => {
                    setIsConvertLeadModalOpen(false);
                    handleProjectCreated(caseId);
                }}
            /> */}

            {/* Create Fresh Project Modal */}
            <CreateFreshProjectModal
                isOpen={isFreshProjectModalOpen}
                onClose={() => setIsFreshProjectModalOpen(false)}
                organizationId={selectedOrgId}
                onProjectCreated={(caseId) => {
                    setIsFreshProjectModalOpen(false);
                    handleProjectCreated(caseId);
                }}
            />
        </div>
    );
};

export default OrganizationsPage;
