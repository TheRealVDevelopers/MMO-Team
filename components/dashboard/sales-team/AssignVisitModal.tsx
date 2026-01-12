
import React, { useState } from 'react';
import Modal from '../../shared/Modal';
import { USERS } from '../../../constants';
import { Lead, SiteType, ApprovalRequestType, UserRole } from '../../../types';
import { MapPinIcon, PaperClipIcon, CalendarDaysIcon, BuildingOfficeIcon } from '../../icons/IconComponents';
import { createApprovalRequest } from '../../../hooks/useApprovalSystem';

const siteTypes: SiteType[] = ['Apartment', 'Office', 'School', 'Hospital', 'Other'];

interface AssignVisitModalProps {
    isOpen: boolean;
    onClose: () => void;
    leads: Lead[];
    requesterId: string;
    onSuccess: () => void;
}

const StepIndicator: React.FC<{ currentStep: number, totalSteps: number }> = ({ currentStep, totalSteps }) => (
    <div className="flex items-center justify-center space-x-2">
        {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full ${i < currentStep ? 'bg-primary' : 'bg-border'}`}></div>
        ))}
    </div>
);

const initialFormData = {
    leadId: '',
    date: '',
    siteAddress: '',
    siteType: 'Office' as SiteType,
    priority: 'Medium' as 'High' | 'Medium' | 'Low',
    keyPoints: '',
    measurements: '',
    clientPreferences: '',
    potentialChallenges: '',
    photosRequired: false,
};

const AssignVisitModal: React.FC<AssignVisitModalProps> = ({ isOpen, onClose, leads, requesterId, onSuccess }) => {
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({ ...initialFormData, leadId: leads[0]?.id || '' });

    const requester = USERS.find(u => u.id === requesterId);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleClose = () => {
        setStep(1);
        setFormData({ ...initialFormData, leadId: leads[0]?.id || '' });
        onClose();
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const selectedLead = leads.find(l => l.id === formData.leadId);
        if (!selectedLead || !formData.date || !requester) return;

        setIsSubmitting(true);
        try {
            await createApprovalRequest({
                requestType: ApprovalRequestType.SITE_VISIT_TOKEN,
                requesterId,
                requesterName: requester.name,
                requesterRole: requester.role,
                title: `Site Visit: ${selectedLead.projectName}`,
                description: `Requested site visit for ${selectedLead.clientName}. 
Site Type: ${formData.siteType}
Address: ${formData.siteAddress}
Key Points: ${formData.keyPoints}
Priority: ${formData.priority}`,
                priority: formData.priority,
                contextId: selectedLead.id,
                targetRole: UserRole.SITE_ENGINEER,
                startDate: new Date(formData.date),
            });
            onSuccess();
            handleClose();
        } catch (error) {
            console.error("Failed to raise site visit token:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const priorityOptions: ('High' | 'Medium' | 'Low')[] = ['High', 'Medium', 'Low'];
    const priorityColors = { High: 'border-error text-error bg-error/10', Medium: 'border-accent text-accent bg-accent/10', Low: 'border-slate-400 text-slate-500 bg-slate-400/10' }

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Raise Site Visit Token" size="3xl">
            <form onSubmit={handleSubmit} className="space-y-6">
                <StepIndicator currentStep={step} totalSteps={3} />

                {step === 1 && (
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <h3 className="font-bold text-lg">1. Basic Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1">Select Lead</label>
                                    <select id="lead" name="leadId" value={formData.leadId} onChange={handleChange} className="w-full pl-3 pr-10 py-2 text-base border-border bg-surface focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md shadow-sm">
                                        {leads.map(lead => <option key={lead.id} value={lead.id}>{lead.clientName} - {lead.projectName}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1">Preferred Date & Time</label>
                                    <div className="relative">
                                        <CalendarDaysIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                                        <input type="datetime-local" name="date" value={formData.date} onChange={handleChange} className="pl-10 w-full pr-4 py-2 text-base border-border bg-surface focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md shadow-sm" required />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                            <p className="text-xs text-primary font-medium">Note: Site engineers are now assigned by Admins. Raising this token will send it for authorization.</p>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6">
                        <h3 className="font-bold text-lg">2. Visit Specifics</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-text-secondary">Address</label>
                                <div className="relative">
                                    <MapPinIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                                    <input type="text" name="siteAddress" value={formData.siteAddress} onChange={handleChange} placeholder="Site Plot/Office Address" className="pl-10 w-full p-2 border border-border bg-subtle-background rounded-md shadow-sm" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-text-secondary">Infrastructure Type</label>
                                <div className="relative">
                                    <BuildingOfficeIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                                    <select name="siteType" value={formData.siteType} onChange={handleChange} className="pl-10 w-full p-2 border border-border bg-subtle-background rounded-md shadow-sm">
                                        {siteTypes.map(type => <option key={type} value={type}>{type}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-primary mb-2">Operational Priority</label>
                            <div className="flex space-x-2">
                                {priorityOptions.map(p => (
                                    <button key={p} type="button" onClick={() => setFormData(prev => ({ ...prev, priority: p }))} className={`flex-1 py-2 text-sm font-bold rounded-xl border transition-all ${formData.priority === p ? `ring-2 ring-primary shadow-md ${priorityColors[p]}` : `bg-surface hover:bg-subtle-background ${priorityColors[p]}`}`}>
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6">
                        <h3 className="font-bold text-lg">3. Technical Briefing</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-text-tertiary uppercase tracking-widest">Key Discussion points</label>
                                <textarea name="keyPoints" value={formData.keyPoints} onChange={handleChange} rows={2} placeholder="What needs to be discussed with the client?" className="w-full p-3 border border-border bg-subtle-background rounded-xl text-sm focus:ring-primary focus:border-primary" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-text-tertiary uppercase tracking-widest">Crucial Measurements</label>
                                <textarea name="measurements" value={formData.measurements} onChange={handleChange} rows={2} placeholder="Specific areas to measure?" className="w-full p-3 border border-border bg-subtle-background rounded-xl text-sm focus:ring-primary focus:border-primary" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-text-tertiary uppercase tracking-widest">Client Aspirations</label>
                                <textarea name="clientPreferences" value={formData.clientPreferences} onChange={handleChange} rows={2} placeholder="Design or material preferences?" className="w-full p-3 border border-border bg-subtle-background rounded-xl text-sm focus:ring-primary focus:border-primary" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-text-tertiary uppercase tracking-widest">Anticipated Blockages</label>
                                <textarea name="potentialChallenges" value={formData.potentialChallenges} onChange={handleChange} rows={2} placeholder="Construction or access issues?" className="w-full p-3 border border-border bg-subtle-background rounded-xl text-sm focus:ring-primary focus:border-primary" />
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <input type="checkbox" name="photosRequired" id="photosRequired" checked={formData.photosRequired} onChange={handleChange} className="h-4 w-4 text-primary focus:ring-primary border-border rounded" />
                            <label htmlFor="photosRequired" className="text-sm font-medium">Digital Documentation (Photos) Required?</label>
                        </div>
                    </div>
                )}

                <div className="flex justify-between pt-4 border-t border-border/40">
                    <button type="button" onClick={() => setStep(s => s - 1)} disabled={step === 1 || isSubmitting} className="px-6 py-2 text-sm font-bold text-text-primary bg-surface border border-border rounded-xl hover:bg-subtle-background disabled:opacity-50 transition-colors">Back</button>
                    {step < 3 ? (
                        <button type="button" onClick={() => setStep(s => s + 1)} className="bg-primary text-white px-8 py-2 rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-primary/20 transition-all">Next Step</button>
                    ) : (
                        <button type="submit" disabled={isSubmitting} className="bg-secondary text-white px-8 py-2 rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-secondary/20 transition-all disabled:opacity-50">
                            {isSubmitting ? 'Raising Token...' : 'Raise Visit Token'}
                        </button>
                    )}
                </div>
            </form>
        </Modal>
    );
};

// File cleanups and workflow orchestration updates
export default AssignVisitModal;
