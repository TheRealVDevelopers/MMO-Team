import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeftIcon, BuildingOfficeIcon, BuildingLibraryIcon, PlusIcon, PhoneIcon, EnvelopeIcon, MapPinIcon, UserIcon } from '@heroicons/react/24/outline';
import { B2IClient, Organization, CaseStatus } from '../../../types';
import { useB2IClients } from '../../../hooks/useB2IClients';
import { useOrganizations } from '../../../hooks/useOrganizations';
import { useCases } from '../../../hooks/useCases';
import CreateOrganizationModal from './CreateOrganizationModal';

interface B2IDetailPageProps {
    b2iId: string;
    onBack: () => void;
    setCurrentPage: (page: string) => void;
}

const B2IDetailPage: React.FC<B2IDetailPageProps> = ({ b2iId, onBack, setCurrentPage }) => {
    const { b2iClients } = useB2IClients();
    const { organizations, addOrganization } = useOrganizations();
    const { cases: allProjects } = useCases({ isProject: true, fetchAll: true });
    const [isCreateOrgModalOpen, setIsCreateOrgModalOpen] = useState(false);

    const b2iClient = b2iClients.find(c => c.id === b2iId);
    const childOrgs = useMemo(() =>
        organizations.filter(org => org.b2iParentId === b2iId),
        [organizations, b2iId]
    );

    // Active status constants
    const ACTIVE_STATUSES: string[] = [
        CaseStatus.EXECUTION_ACTIVE,
        CaseStatus.PLANNING_SUBMITTED,
        CaseStatus.WAITING_FOR_PLANNING,
        CaseStatus.WAITING_FOR_PAYMENT,
        CaseStatus.NEGOTIATION,
        CaseStatus.QUOTATION,
        CaseStatus.BOQ,
        CaseStatus.DRAWING,
        CaseStatus.SITE_VISIT,
        CaseStatus.CONTACTED,
        CaseStatus.LEAD,
    ];

    const getOrgProjects = (orgId: string) =>
        (allProjects || []).filter(p => p.organizationId === orgId);

    const getOrgProjectStatus = (orgId: string): 'active' | 'inactive' | 'none' => {
        const orgProjects = getOrgProjects(orgId);
        if (orgProjects.length === 0) return 'none';
        return orgProjects.some(p => ACTIVE_STATUSES.includes(p.status as string)) ? 'active' : 'inactive';
    };

    if (!b2iClient) {
        return (
            <div className="p-6 text-center text-text-secondary">
                <p>B2I Client not found.</p>
                <button onClick={onBack} className="mt-4 px-4 py-2 bg-primary text-white rounded-lg">Go Back</button>
            </div>
        );
    }

    const handleCreateOrganization = async (orgData: Omit<Organization, 'id' | 'createdAt' | 'createdBy' | 'projects'>) => {
        try {
            await addOrganization({
                ...orgData,
                isB2IChild: true,
                b2iParentId: b2iId,
                createdAt: new Date(),
                createdBy: 'current-user-id',
                is_demo: false,
                projects: [],
            } as any);
        } catch (error) {
            console.error('Failed to create organization under B2I', error);
            alert('Failed to create organization.');
        }
        setIsCreateOrgModalOpen(false);
    };

    return (
        <div className="space-y-6 p-6">
            {/* Back + Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={onBack}
                    className="p-2 hover:bg-subtle-background rounded-lg transition-colors"
                >
                    <ArrowLeftIcon className="w-5 h-5 text-text-secondary" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{b2iClient.name}</h1>
                    <p className="text-gray-500 dark:text-gray-400">B2I Client Details</p>
                </div>
                <span className={`ml-auto text-sm font-bold px-3 py-1 rounded-full ${b2iClient.status === 'active'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                    {b2iClient.status === 'active' ? 'Active' : 'Inactive'}
                </span>
            </div>

            {/* Client Info Card */}
            <div className="bg-surface rounded-xl shadow-sm border border-border p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                        <BuildingLibraryIcon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h2 className="text-lg font-bold text-text-primary">Client Information</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                        <UserIcon className="w-4 h-4" />
                        <span className="font-medium">Contact:</span>
                        <span>{b2iClient.contactPerson}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                        <EnvelopeIcon className="w-4 h-4" />
                        <span className="font-medium">Email:</span>
                        <span>{b2iClient.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                        <PhoneIcon className="w-4 h-4" />
                        <span className="font-medium">Phone:</span>
                        <span>{b2iClient.phone}</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-text-secondary">
                        <MapPinIcon className="w-4 h-4 mt-0.5" />
                        <span className="font-medium">Address:</span>
                        <span>{b2iClient.address}</span>
                    </div>
                </div>
            </div>

            {/* Child Organizations */}
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-text-primary">
                    Child Organizations ({childOrgs.length})
                </h2>
                <button
                    onClick={() => setIsCreateOrgModalOpen(true)}
                    className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
                >
                    <PlusIcon className="w-5 h-5" />
                    Add Organization Under This B2I
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {childOrgs.map((org) => (
                    <motion.div
                        key={org.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-surface rounded-xl shadow-sm border border-border hover:shadow-md transition-shadow p-6 cursor-pointer"
                    >
                        <div className="flex items-start gap-3 mb-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <BuildingOfficeIcon className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-text-primary">{org.name}</h3>
                                {org.email && <p className="text-sm text-text-secondary">{org.email}</p>}
                            </div>
                        </div>
                        <div className="space-y-1 text-sm text-text-secondary">
                            {org.phone && (
                                <div className="flex items-center gap-2">
                                    <PhoneIcon className="w-3.5 h-3.5" />
                                    <span>{org.phone}</span>
                                </div>
                            )}
                            {org.address && (
                                <div className="flex items-start gap-2">
                                    <MapPinIcon className="w-3.5 h-3.5 mt-0.5" />
                                    <span className="line-clamp-2">{org.address}</span>
                                </div>
                            )}
                        </div>
                        <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                            <span className="text-xs text-text-tertiary">
                                Since {org.createdAt ? new Date(org.createdAt).toLocaleDateString() : 'N/A'}
                            </span>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-medium px-2 py-1 bg-subtle-background rounded-full text-text-secondary">
                                    {getOrgProjects(org.id).length} Projects
                                </span>
                                {(() => {
                                    const status = getOrgProjectStatus(org.id);
                                    if (status === 'active') return (
                                        <span className="text-xs font-bold px-2 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                            Active
                                        </span>
                                    );
                                    if (status === 'inactive') return (
                                        <span className="text-xs font-bold px-2 py-1 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                            Inactive
                                        </span>
                                    );
                                    return null;
                                })()}
                            </div>
                        </div>
                    </motion.div>
                ))}

                {childOrgs.length === 0 && (
                    <div className="col-span-full text-center py-12">
                        <BuildingOfficeIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No organizations linked to this B2I client yet.</p>
                        <button
                            onClick={() => setIsCreateOrgModalOpen(true)}
                            className="mt-3 text-sm font-medium text-primary hover:text-primary/80"
                        >
                            + Add the first organization
                        </button>
                    </div>
                )}
            </div>

            {/* Reuse existing CreateOrganizationModal */}
            <CreateOrganizationModal
                isOpen={isCreateOrgModalOpen}
                onClose={() => setIsCreateOrgModalOpen(false)}
                onSubmit={handleCreateOrganization}
                initialData={null}
            />
        </div>
    );
};

export default B2IDetailPage;
