import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PlusIcon, BuildingOfficeIcon, MagnifyingGlassIcon, UserIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { ORGANIZATIONS } from '../../../constants';
import { Organization } from '../../../types';
import CreateOrganizationModal from './CreateOrganizationModal';
import CreateProjectWizard from './CreateProjectWizard';

interface OrganizationsPageProps {
    setCurrentPage: (page: string) => void;
}

const OrganizationsPage: React.FC<OrganizationsPageProps> = ({ setCurrentPage }) => {
    const [organizations, setOrganizations] = useState<Organization[]>(ORGANIZATIONS);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isProjectWizardOpen, setIsProjectWizardOpen] = useState(false);
    const [selectedOrgId, setSelectedOrgId] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');

    const [isProjectsModalOpen, setIsProjectsModalOpen] = useState(false);
    const [selectedOrgProjects, setSelectedOrgProjects] = useState<any[]>([]);

    const handleCreateOrganization = (orgData: Omit<Organization, 'id' | 'createdAt' | 'createdBy' | 'projects'>) => {
        const newOrg: Organization = {
            ...orgData,
            id: `org-${Date.now()}`,
            projects: [],
            createdAt: new Date(),
            createdBy: 'user-1', // Mock user
            is_demo: true
        };
        setOrganizations([newOrg, ...organizations]);
    };

    const handleCreateProject = (projectData: any) => {
        console.log('Creating project:', projectData);
        // Here we would actually create the project and update the organization's project list
        alert('Project created successfully! (Mock)');

        // Mock update just to show interaction
        const updatedOrgs = organizations.map(org => {
            if (org.id === projectData.organizationId) {
                return {
                    ...org,
                    projects: [...org.projects, 'proj-new'] // adding dummy ID
                };
            }
            return org;
        });
        setOrganizations(updatedOrgs);
    };

    const handleViewProjects = (org: Organization) => {
        // In real app, fetch projects by IDs. Here mocked.
        setSelectedOrgProjects(org.projects.map(pid => ({ id: pid, name: 'Mock Project ' + pid })));
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
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Organization Management</h1>
                    <p className="text-gray-500 dark:text-gray-400">Manage client organizations and their projects</p>
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
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="relative max-w-md">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search organizations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-slate-700 dark:text-white"
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
                        className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow p-6 group cursor-pointer"
                        onClick={() => handleViewProjects(org)}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-primary/10 dark:bg-primary/20 rounded-lg">
                                <BuildingOfficeIcon className="w-8 h-8 text-primary" />
                            </div>
                            <span className="text-xs font-medium px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300">
                                {org.projects.length} Projects
                            </span>
                        </div>

                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-primary transition-colors">
                            {org.name}
                        </h3>

                        <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-2">
                                <UserIcon className="w-4 h-4" />
                                <span>{org.contactPerson}</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <MapPinIcon className="w-4 h-4 mt-0.5" />
                                <span className="line-clamp-2">{org.address}</span>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
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

            {/* Simple Project List Modal */}
            {isProjectsModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setIsProjectsModalOpen(false)}>
                    <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold mb-4">Ongoing Projects</h3>
                        {selectedOrgProjects.length > 0 ? (
                            <ul className="space-y-2">
                                {selectedOrgProjects.map((p, i) => (
                                    <li key={i} className="p-3 bg-gray-50 rounded-lg text-sm font-medium">
                                        {p.name || 'Project ' + p.id}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-500">No active projects linked to this organization.</p>
                        )}
                        <button onClick={() => setIsProjectsModalOpen(false)} className="mt-6 w-full py-2 bg-gray-100 rounded-lg font-bold">Close</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrganizationsPage;
