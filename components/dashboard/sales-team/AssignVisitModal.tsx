

import React, { useState, useMemo } from 'react';
import Modal from '../../shared/Modal';
import { USERS } from '../../../constants';
import { UserRole, Lead, SiteVisit, SiteType } from '../../../types';
import { CheckCircleIcon, MapPinIcon, PencilSquareIcon, PaperClipIcon, CalendarDaysIcon, UserCircleIcon, BuildingOfficeIcon } from '../../icons/IconComponents';

const siteEngineers = USERS.filter(u => u.role === UserRole.SITE_ENGINEER);
const siteTypes: SiteType[] = ['Apartment', 'Office', 'School', 'Hospital', 'Other'];

interface AssignVisitModalProps {
    isOpen: boolean;
    onClose: () => void;
    leads: Lead[];
    requesterId: string;
    onSchedule: (visitData: Omit<SiteVisit, 'id' | 'status'>) => void;
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
    assigneeId: '',
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

const AssignVisitModal: React.FC<AssignVisitModalProps> = ({ isOpen, onClose, leads, requesterId, onSchedule }) => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({ ...initialFormData, leadId: leads[0]?.id || '', assigneeId: siteEngineers[0]?.id || '' });
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleClose = () => {
        setStep(1);
        setFormData({ ...initialFormData, leadId: leads[0]?.id || '', assigneeId: siteEngineers[0]?.id || '' });
        onClose();
    }
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const selectedLead = leads.find(l => l.id === formData.leadId);
        if (!selectedLead || !formData.assigneeId || !formData.date) return;

        onSchedule({
            leadId: selectedLead.id,
            projectName: selectedLead.projectName,
            clientName: selectedLead.clientName,
            date: new Date(formData.date),
            requesterId,
            assigneeId: formData.assigneeId,
            siteAddress: formData.siteAddress,
            siteType: formData.siteType,
            priority: formData.priority,
            notes: {
                keyPoints: formData.keyPoints,
                measurements: formData.measurements,
                clientPreferences: formData.clientPreferences,
                potentialChallenges: formData.potentialChallenges,
                photosRequired: formData.photosRequired,
            }
        });
        handleClose();
    };
    
    const priorityOptions: ('High' | 'Medium' | 'Low')[] = ['High', 'Medium', 'Low'];
    const priorityColors = { High: 'border-error text-error bg-error/10', Medium: 'border-accent text-accent bg-accent/10', Low: 'border-slate-400 text-slate-500 bg-slate-400/10' }

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Assign New Site Visit" size="4xl">
            <form onSubmit={handleSubmit} className="space-y-6">
                <StepIndicator currentStep={step} totalSteps={3} />
                
                {step === 1 && (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                             <h3 className="font-bold text-lg">1. Core Details</h3>
                             <select id="lead" name="leadId" value={formData.leadId} onChange={handleChange} className="w-full pl-3 pr-10 py-2 text-base border-border bg-surface focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md">
                                {leads.map(lead => <option key={lead.id} value={lead.id}>{lead.clientName} - {lead.projectName}</option>)}
                            </select>
                             <input type="datetime-local" name="date" value={formData.date} onChange={handleChange} className="w-full pl-3 pr-10 py-2 text-base border-border bg-surface focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md" required />
                        </div>
                        <div>
                             <h3 className="font-bold text-lg mb-2">2. Assign Engineer</h3>
                             <div className="grid grid-cols-2 gap-2">
                                {siteEngineers.map(user => (
                                    <button key={user.id} type="button" onClick={() => setFormData(prev => ({ ...prev, assigneeId: user.id }))} className={`relative text-left p-2 rounded-lg border-2 ${formData.assigneeId === user.id ? 'border-primary bg-primary-subtle-background' : 'border-border bg-surface hover:bg-subtle-background'}`}>
                                        <div className="flex items-center space-x-2">
                                            <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full" />
                                            <div>
                                                <p className="text-xs font-bold text-text-primary">{user.name}</p>
                                                <p className="text-xs text-text-secondary">3 visits this week</p>
                                            </div>
                                        </div>
                                        {formData.assigneeId === user.id && <CheckCircleIcon className="w-5 h-5 text-primary absolute top-1 right-1" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
                
                {step === 2 && (
                    <div className="space-y-4">
                        <h3 className="font-bold text-center text-lg">Visit Specifics</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="relative">
                                <MapPinIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"/>
                                <input type="text" name="siteAddress" value={formData.siteAddress} onChange={handleChange} placeholder="Site Address" className="pl-10 w-full p-2 border border-border bg-subtle-background rounded-md shadow-sm" />
                            </div>
                            <div className="relative">
                                <BuildingOfficeIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"/>
                                <select name="siteType" value={formData.siteType} onChange={handleChange} className="pl-10 w-full p-2 border border-border bg-subtle-background rounded-md shadow-sm">
                                    {siteTypes.map(type => <option key={type} value={type}>{type}</option>)}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-primary mb-2">Priority</label>
                            <div className="flex space-x-2">
                                {priorityOptions.map(p => (
                                    <button key={p} type="button" onClick={() => setFormData(prev => ({...prev, priority: p}))} className={`flex-1 py-2 text-sm font-semibold rounded-md border ${formData.priority === p ? `ring-2 ring-primary ${priorityColors[p]}` : `bg-surface hover:bg-subtle-background ${priorityColors[p]}`}`}>
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {step === 3 && (
                     <div className="space-y-4">
                        <h3 className="font-bold text-center text-lg">Instructions & Attachments</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <textarea name="keyPoints" value={formData.keyPoints} onChange={handleChange} rows={2} placeholder="Key Points to Discuss" className="p-2 border border-border bg-subtle-background rounded-md"/>
                            <textarea name="measurements" value={formData.measurements} onChange={handleChange} rows={2} placeholder="Specific Measurements Needed" className="p-2 border border-border bg-subtle-background rounded-md"/>
                            <textarea name="clientPreferences" value={formData.clientPreferences} onChange={handleChange} rows={2} placeholder="Client Preferences to Note" className="p-2 border border-border bg-subtle-background rounded-md"/>
                            <textarea name="potentialChallenges" value={formData.potentialChallenges} onChange={handleChange} rows={2} placeholder="Potential Challenges to Assess" className="p-2 border border-border bg-subtle-background rounded-md"/>
                        </div>
                        <div className="flex items-center space-x-2">
                            <input type="checkbox" name="photosRequired" id="photosRequired" checked={formData.photosRequired} onChange={handleChange} className="h-4 w-4 text-primary focus:ring-primary border-border rounded"/>
                            <label htmlFor="photosRequired" className="text-sm font-medium">Photos Required?</label>
                        </div>
                         <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-border border-dashed rounded-md">
                            <div className="space-y-1 text-center">
                                <PaperClipIcon className="mx-auto h-8 w-8 text-text-secondary"/>
                                <div className="flex text-sm text-text-secondary"><label htmlFor="file-upload" className="relative cursor-pointer bg-surface rounded-md font-medium text-primary hover:text-secondary"><span>Upload a file</span><input id="file-upload" name="file-upload" type="file" className="sr-only"/></label><p className="pl-1">or drag and drop</p></div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex justify-between pt-2">
                    <button type="button" onClick={() => setStep(s => s - 1)} disabled={step === 1} className="px-4 py-2 text-sm font-medium text-text-primary bg-surface border border-border rounded-md hover:bg-subtle-background disabled:opacity-50">Back</button>
                    {step < 3 ? (
                        <button type="button" onClick={() => setStep(s => s + 1)} className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-secondary">Next</button>
                    ) : (
                        <button type="submit" className="bg-secondary text-white px-4 py-2 rounded-md text-sm font-medium hover:opacity-90">Assign Visit</button>
                    )}
                </div>
            </form>
        </Modal>
    );
};

export default AssignVisitModal;
