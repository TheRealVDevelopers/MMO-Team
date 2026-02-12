import React, { useState, useMemo } from 'react';
import {
    MagnifyingGlassIcon,
    FunnelIcon,
    ClockIcon,
    CheckCircleIcon,
    ChatBubbleLeftRightIcon,
    ExclamationTriangleIcon,
    UserCircleIcon,
    CalendarIcon,
    PencilIcon,
    EyeIcon,
    PlusIcon,
    DocumentTextIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';
import { useCases, useCaseTasks, useCaseSiteVisits } from '../../../hooks/useCases';
import { useActivities } from '../../../hooks/useActivities';
import { Case, CaseStatus, UserRole, TaskStatus, TaskType } from '../../../types';
import { formatDate, formatCurrencyINR } from '../../../constants';
import LeadDetailModal from '../../shared/LeadDetailModal';
import DirectAssignTaskModal from '../super-admin/DirectAssignTaskModal';
import { useAuth } from '../../../context/AuthContext';
import { doc, updateDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { FIRESTORE_COLLECTIONS } from '../../../constants';

interface SalesManagerProjectsPageProps {
    setCurrentPage: (page: string) => void;
}

const SalesManagerProjectsPage: React.FC<SalesManagerProjectsPageProps> = ({ setCurrentPage }) => {
    const { currentUser } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [selectedCase, setSelectedCase] = useState<Case | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isAssignTaskModalOpen, setIsAssignTaskModalOpen] = useState(false);

    // Get all cases (leads and projects)
    const { cases, loading, error, updateCase } = useCases();
    const { tasks } = useCaseTasks();
    const { siteVisits } = useCaseSiteVisits();

    // Filter cases for sales manager view
    const filteredCases = useMemo(() => {
        return cases.filter(c => {
            const matchesSearch = 
                (c.clientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (c.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (c.id || '').toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesFilter = 
                filterStatus === 'all' || 
                c.status === filterStatus;
            
            return matchesSearch && matchesFilter;
        });
    }, [cases, searchTerm, filterStatus]);

    const handleCaseClick = (caseItem: Case) => {
        setSelectedCase(caseItem);
        setIsDetailModalOpen(true);
    };

    const handleAssignTask = (caseItem: Case) => {
        setSelectedCase(caseItem);
        setIsAssignTaskModalOpen(true);
    };

    const handleUpdateCase = async (updatedCase: Case) => {
        try {
            // Update case in Firestore directly
            if (db) {
                const caseRef = doc(db, FIRESTORE_COLLECTIONS.CASES, updatedCase.id);
                await updateDoc(caseRef, {
                    status: updatedCase.status,
                    updatedAt: serverTimestamp(),
                    // Add other fields that need to be updated
                    ...(updatedCase.assignedSales && { assignedSales: updatedCase.assignedSales }),
                });
                
                // Log activity for the status change
                const activitiesRef = collection(
                    db,
                    FIRESTORE_COLLECTIONS.CASES,
                    updatedCase.id,
                    FIRESTORE_COLLECTIONS.ACTIVITIES
                );
                
                await addDoc(activitiesRef, {
                    caseId: updatedCase.id,
                    action: `Status updated to ${updatedCase.status}`,
                    type: 'status_change',
                    userId: currentUser?.id || 'system',
                    userName: currentUser?.name || 'System',
                    timestamp: serverTimestamp(),
                });
                
                console.log('Case updated successfully:', updatedCase.id);
            }
        } catch (error) {
            console.error('Error updating case:', error);
            alert('Failed to update case. Please try again.');
        }
    };

    const getStatusColor = (status: CaseStatus) => {
        switch (status) {
            case CaseStatus.LEAD:
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case CaseStatus.SITE_VISIT:
                return 'bg-amber-100 text-amber-800 border-amber-200';
            case CaseStatus.DRAWING:
                return 'bg-purple-100 text-purple-800 border-purple-200';
            case CaseStatus.BOQ:
                return 'bg-indigo-100 text-indigo-800 border-indigo-200';
            case CaseStatus.QUOTATION:
                return 'bg-green-100 text-green-800 border-green-200';
            case CaseStatus.WAITING_FOR_PLANNING:
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case CaseStatus.EXECUTION_ACTIVE:
                return 'bg-teal-100 text-teal-800 border-teal-200';
            case CaseStatus.COMPLETED:
                return 'bg-gray-100 text-gray-800 border-gray-200';
            default:
                return 'bg-gray-50 text-gray-600 border-gray-200';
        }
    };

    const getStatusBadge = (status: CaseStatus) => {
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(status)}`}>
                {status}
            </span>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Project Management</h1>
                    <p className="text-text-secondary text-sm mt-1">Manage leads and projects across all stages</p>
                </div>
                <div className="text-sm text-text-secondary">
                    Total Items: <span className="font-bold text-text-primary">{cases.length}</span>
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="bg-white rounded-xl shadow-sm border border-border p-12 text-center">
                    <p className="text-text-secondary">Loading data...</p>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                    <p className="text-red-800">Error loading data: {error}</p>
                </div>
            )}

            {/* Filters & Search */}
            {!loading && !error && (
                <>
                    <div className="bg-surface rounded-xl shadow-sm border border-border p-4">
                        <div className="flex flex-col md:flex-row gap-4">
                            {/* Search */}
                            <div className="flex-1 relative">
                                <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" />
                                <input
                                    type="text"
                                    placeholder="Search by client name, project title or ID..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>

                            {/* Status Filter */}
                            <div className="md:w-64">
                                <div className="relative">
                                    <FunnelIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" />
                                    <select
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
                                    >
                                        <option value="all">All Statuses</option>
                                        {Object.values(CaseStatus).map(status => (
                                            <option key={status} value={status}>
                                                {status}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Cases Grid */}
                    <div className="grid grid-cols-1 gap-6">
                        {filteredCases.length === 0 ? (
                            <div className="bg-white rounded-xl shadow-sm border border-border p-12 text-center">
                                <p className="text-text-secondary">No items found</p>
                            </div>
                        ) : (
                            filteredCases.map(caseItem => (
                                <div key={caseItem.id} className="bg-white rounded-xl shadow-sm border border-border hover:shadow-md transition-shadow duration-300">
                                    <div className="p-6">
                                        {/* Header Row */}
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-3 mb-2">
                                                    <h3 className="text-lg font-bold text-text-primary">{caseItem.clientName}</h3>
                                                    <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full">
                                                        {caseItem.id}
                                                    </span>
                                                    {caseItem.isProject && (
                                                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full">
                                                            PROJECT
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-text-secondary">
                                                    {caseItem.title || caseItem.projectName || 'No title'} • {caseItem.clientEmail || 'No email'}
                                                </p>
                                            </div>

                                            {/* Status Badge */}
                                            <div className="flex items-center space-x-2">
                                                {getStatusBadge(caseItem.status)}
                                            </div>
                                        </div>

                                        {/* Info Grid */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 pt-4 border-t border-border">
                                            <div>
                                                <p className="text-xs text-text-secondary mb-1">Value</p>
                                                <p className="text-sm font-medium text-text-primary">
                                                    {formatCurrencyINR(Number(caseItem.financial?.totalBudget) || Number(caseItem.budget) || 0)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-text-secondary mb-1">Created</p>
                                                <div className="flex items-center space-x-1">
                                                    <CalendarIcon className="w-4 h-4 text-primary" />
                                                    <p className="text-sm font-medium text-text-primary">
                                                        {formatDate(caseItem.createdAt)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-xs text-text-secondary mb-1">Assigned To</p>
                                                <div className="flex items-center space-x-1">
                                                    <UserCircleIcon className="w-4 h-4 text-primary" />
                                                    <p className="text-sm font-medium text-text-primary">
                                                        {caseItem.assignedSales || caseItem.projectHeadId || 'Unassigned'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-xs text-text-secondary mb-1">Status</p>
                                                <p className="text-sm font-medium text-text-primary">
                                                    {caseItem.status}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
                                            <button
                                                onClick={() => handleCaseClick(caseItem)}
                                                className="px-4 py-2 bg-primary/10 text-primary text-sm font-medium rounded-lg hover:bg-primary/20 transition-colors flex items-center space-x-2"
                                            >
                                                <DocumentTextIcon className="w-4 h-4" />
                                                <span>View Details</span>
                                            </button>
                                            <button
                                                onClick={() => handleAssignTask(caseItem)}
                                                className="px-4 py-2 bg-gray-100 text-text-primary text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
                                            >
                                                <PlusIcon className="w-4 h-4" />
                                                <span>Assign Task</span>
                                            </button>
                                            <button
                                                onClick={() => setCurrentPage('communication')}
                                                className="px-4 py-2 bg-gray-100 text-text-primary text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
                                            >
                                                <ChatBubbleLeftRightIcon className="w-4 h-4" />
                                                <span>Chat</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </>
            )}

            {/* Lead Detail Modal */}
            {isDetailModalOpen && selectedCase && (
                <LeadDetailModal
                    isOpen={isDetailModalOpen}
                    onClose={() => {
                        setIsDetailModalOpen(false);
                        setSelectedCase(null);
                    }}
                    caseItem={selectedCase}
                    onUpdate={handleUpdateCase}
                />
            )}

            {/* Assign Task Modal */}
            {isAssignTaskModalOpen && selectedCase && (
                <DirectAssignTaskModal
                    isOpen={isAssignTaskModalOpen}
                    onClose={() => {
                        setIsAssignTaskModalOpen(false);
                        setSelectedCase(null);
                    }}
                    onAssign={async (task) => {
                        if (!currentUser) return;
                        
                        try {
                            // Create the task directly using Firestore
                            const tasksRef = collection(
                                db!, 
                                FIRESTORE_COLLECTIONS.CASES, 
                                selectedCase.id, 
                                FIRESTORE_COLLECTIONS.TASKS
                            );
                                                    
                            await addDoc(tasksRef, {
                                caseId: selectedCase.id,
                                type: TaskType.SALES_CONTACT,
                                title: task.title,
                                assignedTo: task.userId,
                                assignedBy: currentUser.id,
                                status: TaskStatus.PENDING,
                                priority: task.priority || 'Medium',
                                notes: task.description || '',
                                createdAt: serverTimestamp(),
                            });

                            // Update case status based on task type
                            let newStatus: CaseStatus;
                            const title = (task.title || '').toLowerCase();
                            
                            if (title.includes('site') && (title.includes('visit') || title.includes('inspection'))) {
                                newStatus = CaseStatus.SITE_VISIT;
                            } else if (title.includes('drawing') || title.includes('design')) {
                                newStatus = CaseStatus.DRAWING;
                            } else if (title.includes('quotation') || title.includes('boq')) {
                                newStatus = CaseStatus.BOQ;
                            } else if (title.includes('execution') || title.includes('install')) {
                                newStatus = CaseStatus.EXECUTION_ACTIVE;
                            } else {
                                newStatus = CaseStatus.LEAD; // Default
                            }

                            await updateCase(selectedCase.id, {
                                status: newStatus,
                                assignedSales: task.userId,
                                updatedAt: new Date()
                            });

                            alert('✅ Task assigned successfully and status updated!');
                            setIsAssignTaskModalOpen(false);
                            setSelectedCase(null);
                        } catch (error) {
                            console.error('Error assigning task:', error);
                            alert('Failed to assign task. Please try again.');
                        }
                    }}
                    initialContextId={selectedCase.id}
                    initialContextType={selectedCase.isProject ? 'project' : 'lead'}
                />
            )}
        </div>
    );
};

export default SalesManagerProjectsPage;