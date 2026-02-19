import React, { useState, useMemo } from 'react';
import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase';
import { CaseStatus, UserRole } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { useUsers } from '../../../hooks/useUsers';
import Modal from '../../shared/Modal';
import { MagnifyingGlassIcon, CheckCircleIcon, UserCircleIcon } from '@heroicons/react/24/outline';

interface ConvertFromLeadModalProps {
    isOpen: boolean;
    onClose: () => void;
    organizationId: string;
    onProjectCreated?: (caseId: string) => void;
}

interface LeadOption {
    id: string;
    title: string;
    clientName: string;
    status: CaseStatus;
    siteAddress: string;
    createdAt: Date;
}

const ConvertFromLeadModal: React.FC<ConvertFromLeadModalProps> = ({
    isOpen,
    onClose,
    organizationId,
    onProjectCreated,
}) => {
    const { currentUser } = useAuth();
    const { users } = useUsers();

    const [leads, setLeads] = useState<LeadOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
    const [selectedProjectHead, setSelectedProjectHead] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');
    const [converting, setConverting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Get execution team members for Project Head selection
    const executionTeamMembers = useMemo(() => {
        return users.filter(u =>
            u.role === UserRole.PROJECT_HEAD ||
            u.role === UserRole.EXECUTION_TEAM ||
            u.role === UserRole.SUPER_ADMIN
        );
    }, [users]);

    // Fetch leads when modal opens
    React.useEffect(() => {
        if (isOpen && organizationId) {
            fetchLeads();
        }
    }, [isOpen, organizationId]);

    const fetchLeads = async () => {
        if (!organizationId) return; // Never pass undefined to where()
        setLoading(true);
        setError(null);

        try {
            const casesRef = collection(db, 'cases');
            const q = query(
                casesRef,
                where('organizationId', '==', organizationId),
                where('isProject', '==', false)
            );

            const snapshot = await getDocs(q);
            const leadList: LeadOption[] = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    title: data.title || 'Untitled',
                    clientName: data.clientName || 'Unknown Client',
                    status: data.status as CaseStatus,
                    siteAddress: data.siteAddress || '',
                    createdAt: data.createdAt?.toDate() || new Date(),
                };
            });

            setLeads(leadList);
        } catch (err) {
            console.error('Error fetching leads:', err);
            setError('Failed to load leads');
        } finally {
            setLoading(false);
        }
    };

    // Filter leads by search query
    const filteredLeads = useMemo(() => {
        if (!searchQuery.trim()) return leads;
        const lowerQuery = searchQuery.toLowerCase();
        return leads.filter(lead =>
            lead.title.toLowerCase().includes(lowerQuery) ||
            lead.clientName.toLowerCase().includes(lowerQuery) ||
            lead.siteAddress.toLowerCase().includes(lowerQuery)
        );
    }, [leads, searchQuery]);

    const handleConvert = async () => {
        if (!selectedLeadId || !selectedProjectHead) {
            setError('Please select a lead and assign a Project Head');
            return;
        }

        setConverting(true);
        setError(null);

        try {
            // 🔥 CRITICAL: Update the SAME document, do NOT create a new one
            const caseRef = doc(db, 'cases', selectedLeadId);
            await updateDoc(caseRef, {
                isProject: true,
                status: CaseStatus.WAITING_FOR_PLANNING,
                projectHeadId: selectedProjectHead,
                updatedAt: serverTimestamp(),
                updatedBy: currentUser?.id,
            });

            // Notify parent
            if (onProjectCreated) {
                onProjectCreated(selectedLeadId);
            }
            onClose();
        } catch (err) {
            console.error('Error converting lead:', err);
            setError('Failed to convert lead to project');
        } finally {
            setConverting(false);
        }
    };

    const selectedLead = leads.find(l => l.id === selectedLeadId);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Convert Lead to Project" size="2xl">
            <div className="space-y-6">
                {/* Search */}
                <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                    <input
                        type="text"
                        placeholder="Search leads by title, client, or address..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-background text-text-primary"
                    />
                </div>

                {/* Leads List */}
                <div className="max-h-64 overflow-y-auto border border-border rounded-lg">
                    {loading ? (
                        <div className="p-8 text-center text-text-secondary">Loading leads...</div>
                    ) : filteredLeads.length === 0 ? (
                        <div className="p-8 text-center text-text-secondary">
                            {searchQuery ? 'No leads match your search' : 'No leads available to convert'}
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {filteredLeads.map((lead) => (
                                <button
                                    key={lead.id}
                                    onClick={() => setSelectedLeadId(lead.id)}
                                    className={`w-full p-4 text-left hover:bg-subtle-background transition-colors ${selectedLeadId === lead.id ? 'bg-primary/10 border-l-4 border-l-primary' : ''
                                        }`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <h4 className="font-bold text-text-primary">{lead.title}</h4>
                                            <p className="text-sm text-text-secondary">{lead.clientName}</p>
                                            <p className="text-xs text-text-tertiary mt-1">{lead.siteAddress}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs px-2 py-1 bg-subtle-background rounded-full text-text-secondary capitalize">
                                                {lead.status.replace(/_/g, ' ')}
                                            </span>
                                            {selectedLeadId === lead.id && (
                                                <CheckCircleIcon className="w-5 h-5 text-primary" />
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Project Head Selection */}
                {selectedLead && (
                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-4">
                        <h4 className="font-bold text-text-primary flex items-center gap-2">
                            <UserCircleIcon className="w-5 h-5 text-primary" />
                            Assign Project Head
                        </h4>
                        <select
                            value={selectedProjectHead}
                            onChange={(e) => setSelectedProjectHead(e.target.value)}
                            className="w-full px-4 py-3 border border-border rounded-lg bg-background text-text-primary focus:ring-2 focus:ring-primary"
                        >
                            <option value="">Select Project Head...</option>
                            {executionTeamMembers.map((member) => (
                                <option key={member.id} value={member.id}>
                                    {member.name} ({member.role})
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 text-text-secondary hover:bg-subtle-background rounded-lg transition-colors font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConvert}
                        disabled={!selectedLeadId || !selectedProjectHead || converting}
                        className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {converting ? 'Converting...' : 'Convert to Project'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ConvertFromLeadModal;
