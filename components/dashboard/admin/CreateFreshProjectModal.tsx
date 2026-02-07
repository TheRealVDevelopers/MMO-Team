import React, { useState, useMemo } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase';
import { CaseStatus, UserRole } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { useUsers } from '../../../hooks/useUsers';
import Modal from '../../shared/Modal';

interface CreateFreshProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    organizationId: string;
    onProjectCreated?: (caseId: string) => void;
}

type ProjectWeight = 'S' | 'M' | 'L';

const CreateFreshProjectModal: React.FC<CreateFreshProjectModalProps> = ({
    isOpen,
    onClose,
    organizationId,
    onProjectCreated,
}) => {
    const { currentUser } = useAuth();
    const { users } = useUsers();

    // Form state
    const [clientName, setClientName] = useState('');
    const [projectTitle, setProjectTitle] = useState('');
    const [totalBudget, setTotalBudget] = useState('');
    const [projectWeight, setProjectWeight] = useState<ProjectWeight>('M');
    const [projectHeadId, setProjectHeadId] = useState('');
    const [siteAddress, setSiteAddress] = useState('');
    const [clientPhone, setClientPhone] = useState('');
    const [clientEmail, setClientEmail] = useState('');
    const [notes, setNotes] = useState('');
    const [tentativeStartDate, setTentativeStartDate] = useState('');

    const [creating, setCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Get execution team members for Project Head selection
    const executionTeamMembers = useMemo(() => {
        return users.filter(u =>
            u.role === UserRole.PROJECT_HEAD ||
            u.role === UserRole.EXECUTION_TEAM ||
            u.role === UserRole.SUPER_ADMIN
        );
    }, [users]);

    const resetForm = () => {
        setClientName('');
        setProjectTitle('');
        setTotalBudget('');
        setProjectWeight('M');
        setProjectHeadId('');
        setSiteAddress('');
        setClientPhone('');
        setClientEmail('');
        setNotes('');
        setTentativeStartDate('');
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!clientName.trim() || !projectTitle.trim() || !totalBudget || !projectHeadId) {
            setError('Please fill in all required fields');
            return;
        }

        const budgetNum = parseFloat(totalBudget);
        if (isNaN(budgetNum) || budgetNum <= 0) {
            setError('Please enter a valid budget amount');
            return;
        }

        setCreating(true);
        setError(null);

        try {
            // Create new Case document with isProject: true
            const casesRef = collection(db, 'cases');
            const docRef = await addDoc(casesRef, {
                // Core Case fields
                isProject: true,
                organizationId,
                title: projectTitle.trim(),
                clientName: clientName.trim(),
                clientPhone: clientPhone.trim() || null,
                clientEmail: clientEmail.trim() || null,
                siteAddress: siteAddress.trim() || null,
                status: CaseStatus.WAITING_FOR_PLANNING,

                // Project-specific fields
                projectHeadId,
                projectWeight,

                // Financial info
                financial: {
                    totalBudget: budgetNum,
                    advanceAmount: null,
                    utr: null,
                    paymentVerified: false,
                },

                // Execution plan - to be filled by Project Head
                executionPlan: null,

                // Cost center - initialized ONLY on activation
                costCenter: null,

                // Closure - for project completion
                closure: null,

                // Metadata
                notes: notes.trim() || null,
                tentativeStartDate: tentativeStartDate ? new Date(tentativeStartDate) : null,
                createdAt: serverTimestamp(),
                createdBy: currentUser?.id,

                // Workflow flags (for legacy compatibility)
                workflow: {
                    currentStage: CaseStatus.WAITING_FOR_PLANNING,
                    siteVisitDone: true,
                    drawingDone: true,
                    boqDone: true,
                    quotationDone: true,
                    paymentVerified: false,
                    executionStarted: false,
                },
            });

            resetForm();
            console.log('Project created successfully:', docRef.id);
            // Notify parent
            if (onProjectCreated) {
                onProjectCreated(docRef.id);
            }
            onClose();
        } catch (err) {
            console.error('Error creating project:', err);
            setError('Failed to create project');
        } finally {
            setCreating(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create Fresh Project" size="2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Required Fields Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-text-secondary mb-1.5">
                            Client Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={clientName}
                            onChange={(e) => setClientName(e.target.value)}
                            placeholder="Enter client name"
                            className="w-full px-4 py-3 border border-border rounded-lg bg-background text-text-primary focus:ring-2 focus:ring-primary"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-text-secondary mb-1.5">
                            Project Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={projectTitle}
                            onChange={(e) => setProjectTitle(e.target.value)}
                            placeholder="Enter project title"
                            className="w-full px-4 py-3 border border-border rounded-lg bg-background text-text-primary focus:ring-2 focus:ring-primary"
                            required
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-text-secondary mb-1.5">
                            Total Budget (₹) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            value={totalBudget}
                            onChange={(e) => setTotalBudget(e.target.value)}
                            placeholder="Enter total budget"
                            min="0"
                            className="w-full px-4 py-3 border border-border rounded-lg bg-background text-text-primary focus:ring-2 focus:ring-primary"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-text-secondary mb-1.5">
                            Project Weight <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-2">
                            {(['S', 'M', 'L'] as ProjectWeight[]).map((weight) => (
                                <button
                                    key={weight}
                                    type="button"
                                    onClick={() => setProjectWeight(weight)}
                                    className={`flex-1 py-3 rounded-lg font-bold transition-all ${projectWeight === weight
                                        ? 'bg-primary text-white'
                                        : 'bg-subtle-background text-text-secondary hover:bg-primary/10'
                                        }`}
                                >
                                    {weight === 'S' ? 'Small' : weight === 'M' ? 'Medium' : 'Large'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-text-secondary mb-1.5">
                        Project Head <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={projectHeadId}
                        onChange={(e) => setProjectHeadId(e.target.value)}
                        className="w-full px-4 py-3 border border-border rounded-lg bg-background text-text-primary focus:ring-2 focus:ring-primary"
                        required
                    >
                        <option value="">Select Project Head...</option>
                        {executionTeamMembers.map((member) => (
                            <option key={member.id} value={member.id}>
                                {member.name} ({member.role})
                            </option>
                        ))}
                    </select>
                </div>

                {/* Optional Fields Section */}
                <div className="border-t border-border pt-4">
                    <h4 className="text-sm font-bold text-text-tertiary uppercase tracking-wider mb-4">Optional Details</h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-text-secondary mb-1.5">Client Phone</label>
                            <input
                                type="tel"
                                value={clientPhone}
                                onChange={(e) => setClientPhone(e.target.value)}
                                placeholder="Enter client phone"
                                className="w-full px-4 py-3 border border-border rounded-lg bg-background text-text-primary focus:ring-2 focus:ring-primary"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-text-secondary mb-1.5">Client Email</label>
                            <input
                                type="email"
                                value={clientEmail}
                                onChange={(e) => setClientEmail(e.target.value)}
                                placeholder="Enter client email"
                                className="w-full px-4 py-3 border border-border rounded-lg bg-background text-text-primary focus:ring-2 focus:ring-primary"
                            />
                        </div>
                    </div>

                    <div className="mt-4">
                        <label className="block text-sm font-bold text-text-secondary mb-1.5">Site Address</label>
                        <input
                            type="text"
                            value={siteAddress}
                            onChange={(e) => setSiteAddress(e.target.value)}
                            placeholder="Enter site address"
                            className="w-full px-4 py-3 border border-border rounded-lg bg-background text-text-primary focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                            <label className="block text-sm font-bold text-text-secondary mb-1.5">Tentative Start Date</label>
                            <input
                                type="date"
                                value={tentativeStartDate}
                                onChange={(e) => setTentativeStartDate(e.target.value)}
                                className="w-full px-4 py-3 border border-border rounded-lg bg-background text-text-primary focus:ring-2 focus:ring-primary"
                            />
                        </div>

                        <div className="md:col-span-1">
                            {/* Placeholder for expansion */}
                        </div>
                    </div>

                    <div className="mt-4">
                        <label className="block text-sm font-bold text-text-secondary mb-1.5">Notes</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Any additional notes..."
                            rows={3}
                            className="w-full px-4 py-3 border border-border rounded-lg bg-background text-text-primary focus:ring-2 focus:ring-primary resize-none"
                        />
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 text-text-secondary hover:bg-subtle-background rounded-lg transition-colors font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={creating}
                        className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {creating ? 'Creating...' : 'Create Project'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default CreateFreshProjectModal;
