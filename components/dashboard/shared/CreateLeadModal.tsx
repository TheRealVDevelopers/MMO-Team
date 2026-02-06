import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon, PlusIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import { useOrganizations } from '../../../hooks/useOrganizations';
import { useUsers } from '../../../hooks/useUsers';
import { useAuth } from '../../../context/AuthContext';
import { UserRole, Organization, StaffUser } from '../../../types';
import CreateOrganizationModal from './CreateOrganizationModal';

interface CreateLeadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLeadCreated?: (caseId: string) => void;
}

const CreateLeadModal: React.FC<CreateLeadModalProps> = ({
    isOpen,
    onClose,
    onLeadCreated
}) => {
    const { currentUser } = useAuth();
    const { organizations, loading: orgsLoading } = useOrganizations();
    
    // State for organization selection
    const [selectedOrgId, setSelectedOrgId] = useState<string>('');
    const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
    
    // Load ALL sales executives (remove isActive filter to see all users)
    const { users: allSalesUsers, loading: usersLoading } = useUsers({
        role: UserRole.SALES_TEAM_MEMBER
    });

    // Filter active users in component (more flexible)
    const salesExecutives = allSalesUsers.filter(user => user.isActive !== false);

    // Debug: Log sales executives
    console.log('🔍 All Sales Users from DB:', allSalesUsers);
    console.log('🔍 Filtered Active Sales:', salesExecutives);
    console.log('🔍 Users Loading:', usersLoading);
    console.log('🔍 Current User:', currentUser);

    // Form data - separated into sections
    const [formData, setFormData] = useState({
        // From Organization (auto-filled, editable)
        clientName: '',
        clientEmail: '',
        clientPhone: '',
        address: '',
        gst: '',
        
        // Lead-specific (manual)
        title: '',
        estimatedBudget: '',
        assignedSales: '',
        priority: 'Medium' as 'Low' | 'Medium' | 'High',
        notes: ''
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showCreateOrgModal, setShowCreateOrgModal] = useState(false);

    // Auto-fill client fields when organization is selected
    useEffect(() => {
        if (selectedOrgId) {
            const org = organizations.find(o => o.id === selectedOrgId);
            if (org) {
                setSelectedOrg(org);
                setFormData(prev => ({
                    ...prev,
                    clientName: org.name || '',
                    clientEmail: org.email || '',
                    clientPhone: org.phone || '',
                    address: org.address || '',
                    gst: org.gst || ''
                }));
            }
        }
    }, [selectedOrgId, organizations]);

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        // HARD RULES
        if (!selectedOrgId) {
            newErrors.organization = 'Organization selection is required';
        }
        if (!formData.title.trim()) {
            newErrors.title = 'Project title is required';
        }
        if (!formData.assignedSales) {
            newErrors.assignedSales = 'Sales executive assignment is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        // Permission check
        if (currentUser?.role !== UserRole.ADMIN && 
            currentUser?.role !== UserRole.SALES_GENERAL_MANAGER) {
            setErrors({ submit: 'You do not have permission to create leads' });
            return;
        }

        setIsSubmitting(true);

        try {
            // Direct Firestore write - HARD RULE: ONLY write to cases collection
            const { db } = await import('../../../firebase');
            const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
            const { FIRESTORE_COLLECTIONS } = await import('../../../constants');
            const { CaseStatus } = await import('../../../types');

            if (!db) throw new Error('Database not initialized');

            // Create case document at ROOT level: cases/{caseId}
            const casesRef = collection(db, FIRESTORE_COLLECTIONS.CASES);
            
            const caseData: any = {
                organizationId: selectedOrgId,
                title: formData.title.trim(),
                clientName: formData.clientName.trim(),
                clientEmail: formData.clientEmail.trim(),
                clientPhone: formData.clientPhone.trim(),
                siteAddress: formData.address.trim(),
                assignedSales: formData.assignedSales,
                createdBy: currentUser!.id,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                
                // Case flags
                isProject: false,
                status: CaseStatus.NEW,
                
                // Workflow state
                workflow: {
                    currentStage: CaseStatus.NEW,
                    siteVisitDone: false,
                    drawingDone: false,
                    boqDone: false,
                    quotationDone: false,
                    paymentVerified: false,
                    executionStarted: false
                }
            };

            // Add budget if provided
            if (formData.estimatedBudget) {
                caseData.budget = {
                    totalBudget: parseFloat(formData.estimatedBudget),
                    allocated: 0,
                    approved: false
                };
            }

            const caseDoc = await addDoc(casesRef, caseData);
            const caseId = caseDoc.id;

            console.log('✅ Case created:', caseId);

            // Trigger system automations
            await triggerLeadCreationAutomations(caseId, formData.assignedSales, currentUser!.id, formData.title);

            // Success callback
            if (onLeadCreated) {
                onLeadCreated(caseId);
            }

            handleClose();
        } catch (error) {
            console.error('Error creating lead:', error);
            setErrors({ submit: 'Failed to create lead. Please try again.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const triggerLeadCreationAutomations = async (
        caseId: string,
        assignedSalesId: string,
        createdById: string,
        leadTitle: string
    ) => {
        try {
            const { db } = await import('../../../firebase');
            const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
            const { FIRESTORE_COLLECTIONS } = await import('../../../constants');

            if (!db) return;

            // 1. Activity Log
            await addDoc(
                collection(db, FIRESTORE_COLLECTIONS.CASES, caseId, FIRESTORE_COLLECTIONS.ACTIVITIES),
                {
                    caseId,
                    action: 'Lead created',
                    by: createdById,
                    timestamp: serverTimestamp()
                }
            );

            // 2. Auto-create SALES_CONTACT task
            const { TaskType, TaskStatus } = await import('../../../types');
            await addDoc(
                collection(db, FIRESTORE_COLLECTIONS.CASES, caseId, FIRESTORE_COLLECTIONS.TASKS),
                {
                    caseId,
                    type: TaskType.SALES_CONTACT,
                    assignedTo: assignedSalesId,
                    assignedBy: createdById,
                    status: TaskStatus.PENDING,
                    createdAt: serverTimestamp()
                }
            );

            // 3. Send notification to assigned sales executive
            await addDoc(
                collection(db, FIRESTORE_COLLECTIONS.STAFF_USERS, assignedSalesId, FIRESTORE_COLLECTIONS.NOTIFICATIONS),
                {
                    userId: assignedSalesId,
                    title: 'New Lead Assigned',
                    message: `You have been assigned a new lead: ${leadTitle}`,
                    type: 'info',
                    read: false,
                    createdAt: serverTimestamp(),
                    actionUrl: `/cases/${caseId}`
                }
            );

            console.log('✅ Lead creation automations triggered successfully');
        } catch (error) {
            console.error('❌ Error in lead creation automations:', error);
            // Don't throw - case is created, automations are secondary
        }
    };

    const handleClose = () => {
        setSelectedOrgId('');
        setSelectedOrg(null);
        setFormData({
            clientName: '',
            clientEmail: '',
            clientPhone: '',
            address: '',
            gst: '',
            title: '',
            estimatedBudget: '',
            assignedSales: '',
            priority: 'Medium',
            notes: ''
        });
        setErrors({});
        onClose();
    };

    const handleOrganizationCreated = (orgId: string) => {
        setSelectedOrgId(orgId);
        setShowCreateOrgModal(false);
    };

    return (
        <>
            <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
                <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
                
                <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto">
                    <Dialog.Panel className="mx-auto max-w-4xl w-full bg-white rounded-2xl shadow-xl my-8">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <div>
                                <Dialog.Title className="text-2xl font-bold text-gray-900">
                                    Create New Lead
                                </Dialog.Title>
                                <p className="text-sm text-gray-500 mt-1">
                                    Case-centric architecture • Organization required first
                                </p>
                            </div>
                            <button
                                onClick={handleClose}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {errors.submit && (
                                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                                    {errors.submit}
                                </div>
                            )}

                            {/* STEP 1: ORGANIZATION SELECTION (MANDATORY) */}
                            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <BuildingOfficeIcon className="w-6 h-6 text-blue-600" />
                                    <h3 className="text-lg font-bold text-gray-900">
                                        Step 1: Select Organization
                                        <span className="text-red-500 ml-1">*</span>
                                    </h3>
                                </div>

                                <div className="flex gap-3">
                                    <div className="flex-1">
                                        <select
                                            value={selectedOrgId}
                                            onChange={(e) => setSelectedOrgId(e.target.value)}
                                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                                errors.organization ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                            disabled={orgsLoading}
                                        >
                                            <option value="">
                                                {orgsLoading ? 'Loading organizations...' : 'Select an organization'}
                                            </option>
                                            {organizations.map((org) => (
                                                <option key={org.id} value={org.id}>
                                                    {org.name}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.organization && (
                                            <p className="mt-1 text-sm text-red-500">{errors.organization}</p>
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setShowCreateOrgModal(true)}
                                        className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 whitespace-nowrap"
                                    >
                                        <PlusIcon className="w-5 h-5" />
                                        New Org
                                    </button>
                                </div>

                                {selectedOrg && (
                                    <div className="mt-4 p-4 bg-white rounded-lg border border-blue-200">
                                        <p className="text-sm font-medium text-gray-700 mb-2">Selected Organization:</p>
                                        <div className="text-sm text-gray-600 space-y-1">
                                            <p><strong>Name:</strong> {selectedOrg.name}</p>
                                            {selectedOrg.phone && <p><strong>Phone:</strong> {selectedOrg.phone}</p>}
                                            {selectedOrg.email && <p><strong>Email:</strong> {selectedOrg.email}</p>}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* STEP 2: CLIENT INFORMATION (Auto-filled from Organization, Editable) */}
                            {selectedOrgId && (
                                <div className="border border-gray-200 rounded-xl p-6">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                                        Step 2: Client Information
                                        <span className="text-sm font-normal text-gray-500 ml-2">
                                            (Auto-filled from organization, editable)
                                        </span>
                                    </h3>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Client Name
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.clientName}
                                                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Client Phone
                                            </label>
                                            <input
                                                type="tel"
                                                value={formData.clientPhone}
                                                onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Client Email
                                            </label>
                                            <input
                                                type="email"
                                                value={formData.clientEmail}
                                                onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                GST Number
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.gst}
                                                onChange={(e) => setFormData({ ...formData, gst: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>

                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Site Address
                                            </label>
                                            <textarea
                                                value={formData.address}
                                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                                rows={2}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP 3: LEAD-SPECIFIC INFORMATION (MANUAL) */}
                            {selectedOrgId && (
                                <div className="border border-gray-200 rounded-xl p-6">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                                        Step 3: Lead Details
                                    </h3>

                                    <div className="grid grid-cols-2 gap-4">
                                        {/* Project Title */}
                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Project Title <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.title}
                                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                                    errors.title ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                                placeholder="e.g., Office Interior Design"
                                            />
                                            {errors.title && (
                                                <p className="mt-1 text-sm text-red-500">{errors.title}</p>
                                            )}
                                        </div>

                                        {/* Estimated Budget */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Estimated Budget (₹)
                                            </label>
                                            <input
                                                type="number"
                                                value={formData.estimatedBudget}
                                                onChange={(e) => setFormData({ ...formData, estimatedBudget: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Enter amount"
                                            />
                                        </div>

                                        {/* Priority */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Priority
                                            </label>
                                            <select
                                                value={formData.priority}
                                                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            >
                                                <option value="Low">Low</option>
                                                <option value="Medium">Medium</option>
                                                <option value="High">High</option>
                                            </select>
                                        </div>

                                        {/* Assigned Sales Executive */}
                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Assign to Sales Executive <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                value={formData.assignedSales}
                                                onChange={(e) => setFormData({ ...formData, assignedSales: e.target.value })}
                                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                                    errors.assignedSales ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                                disabled={usersLoading}
                                            >
                                                <option value="">
                                                    {usersLoading ? 'Loading sales executives...' : 'Select a sales executive'}
                                                </option>
                                                {salesExecutives.map((user) => (
                                                    <option key={user.id} value={user.id}>
                                                        {user.name} ({user.email})
                                                    </option>
                                                ))}
                                            </select>
                                            {errors.assignedSales && (
                                                <p className="mt-1 text-sm text-red-500">{errors.assignedSales}</p>
                                            )}
                                        </div>

                                        {/* Notes */}
                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Notes
                                            </label>
                                            <textarea
                                                value={formData.notes}
                                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                                rows={3}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Any additional notes or requirements..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={isSubmitting || !selectedOrgId}
                                >
                                    {isSubmitting ? 'Creating Lead...' : 'Create Lead'}
                                </button>
                            </div>
                        </form>
                    </Dialog.Panel>
                </div>
            </Dialog>

            {/* Create Organization Modal */}
            <CreateOrganizationModal
                isOpen={showCreateOrgModal}
                onClose={() => setShowCreateOrgModal(false)}
                onOrganizationCreated={handleOrganizationCreated}
            />
        </>
    );
};

export default CreateLeadModal;
