

import React, { useState } from 'react';
import Modal from '../../shared/Modal';
import { Project, User, QuotationRequest } from '../../../types';
import { CalendarIcon, CheckCircleIcon, ListBulletIcon, PaperClipIcon } from '../../icons/IconComponents';

interface RequestQuotationModalProps {
    isOpen: boolean;
    onClose: () => void;
    projects: Project[];
    quotationTeam: User[];
    requesterId: string;
    onRequest: (requestData: Omit<QuotationRequest, 'id' | 'status' | 'requestDate'>) => void;
}

const StepIndicator: React.FC<{ currentStep: number, totalSteps: number }> = ({ currentStep, totalSteps }) => (
    <div className="flex items-center justify-center space-x-2">
        {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full ${i < currentStep ? 'bg-primary' : 'bg-border'}`}></div>
        ))}
    </div>
);

const RequestQuotationModal: React.FC<RequestQuotationModalProps> = ({ isOpen, onClose, projects, quotationTeam, requesterId, onRequest }) => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        leadId: projects[0]?.salespersonId || '',
        assigneeId: quotationTeam[0]?.id || '',
        deadline: '',
        projectType: '',
        materialQuality: '',
        designStyle: '',
        budgetRange: '',
        timeline: '',
        exclusions: '',
        clientRequests: '',
        notes: '',
    });
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setSelectedFiles(Array.from(e.target.files));
        }
    };

    const handleClose = () => {
        setStep(1);
        setSelectedFiles([]);
        setFormData({
            leadId: projects[0]?.salespersonId || '',
            assigneeId: quotationTeam[0]?.id || '',
            deadline: '',
            projectType: '',
            materialQuality: '',
            designStyle: '',
            budgetRange: '',
            timeline: '',
            exclusions: '',
            clientRequests: '',
            notes: '',
        });
        onClose();
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const selectedProject = projects.find(p => p.id === formData.leadId);
        if (!selectedProject || !formData.assigneeId) return;

        setIsSubmitting(true);
        try {
            const { leadId, assigneeId, deadline, notes, ...scopeOfWork } = formData;

            // Process attachments to Base64
            const attachments = await Promise.all(selectedFiles.map(async (file, index) => {
                const base64 = await fileToBase64(file);
                return {
                    id: `att-${Date.now()}-${index}`,
                    name: file.name,
                    type: 'pdf' as const, // Default or derive from mime
                    url: base64,
                    uploaded: new Date(),
                    size: (file.size / 1024 / 1024).toFixed(2) + ' MB'
                };
            }));

            onRequest({
                leadId: selectedProject.id,
                projectName: selectedProject.projectName,
                clientName: selectedProject.clientName,
                requesterId,
                assigneeId,
                deadline: deadline ? new Date(deadline) : undefined,
                scopeOfWork,
                attachments,
                notes,
            });
            handleClose();
        } catch (error) {
            console.error("Error submitting quotation request:", error);
            alert("Failed to submit request.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Request a New Quotation" size="4xl">
            <form onSubmit={handleSubmit} className="space-y-6">
                <StepIndicator currentStep={step} totalSteps={3} />

                {step === 1 && (
                    <div className="space-y-4">
                        <h3 className="font-bold text-center text-lg">Basic Information</h3>
                        <div>
                            <label htmlFor="project" className="block text-sm font-medium text-text-primary">1. Select a Won Project</label>
                            <select id="project" name="leadId" value={formData.leadId} onChange={handleChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-border bg-surface focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md">
                                {projects.map(p => <option key={p.id} value={p.id}>{p.clientName} - {p.projectName}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-primary mb-2">2. Assign to Quotation Team</label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {quotationTeam.map(user => (
                                    <button key={user.id} type="button" onClick={() => setFormData(prev => ({ ...prev, assigneeId: user.id }))} className={`relative text-left p-2 rounded-lg border-2 ${formData.assigneeId === user.id ? 'border-primary bg-primary-subtle-background' : 'border-border bg-surface hover:bg-subtle-background'}`}>
                                        <div className="flex items-center space-x-2">
                                            <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full" />
                                            <div><p className="text-xs font-bold text-text-primary">{user.name}</p></div>
                                        </div>
                                        {formData.assigneeId === user.id && <CheckCircleIcon className="w-5 h-5 text-primary absolute top-1 right-1" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label htmlFor="deadline" className="block text-sm font-medium text-text-primary flex items-center"><CalendarIcon className="w-4 h-4 mr-2" />3. Set a Deadline</label>
                            <input type="date" id="deadline" name="deadline" value={formData.deadline} onChange={handleChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-border bg-surface focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md" />
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-4">
                        <h3 className="font-bold text-center text-lg flex items-center justify-center"><ListBulletIcon className="w-5 h-5 mr-2" />Define Scope of Work</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input name="projectType" value={formData.projectType} onChange={handleChange} placeholder="Project Type (e.g., Full Office Interior)" className="p-2 border border-border bg-subtle-background rounded-md" />
                            <input name="materialQuality" value={formData.materialQuality} onChange={handleChange} placeholder="Material Quality (e.g., Premium, Standard)" className="p-2 border border-border bg-subtle-background rounded-md" />
                            <input name="designStyle" value={formData.designStyle} onChange={handleChange} placeholder="Design Style (e.g., Modern, Industrial)" className="p-2 border border-border bg-subtle-background rounded-md" />
                            <input name="budgetRange" value={formData.budgetRange} onChange={handleChange} placeholder="Budget Range Indication" className="p-2 border border-border bg-subtle-background rounded-md" />
                            <textarea name="clientRequests" value={formData.clientRequests} onChange={handleChange} rows={2} placeholder="Client's Special Requests..." className="md:col-span-2 p-2 border border-border bg-subtle-background rounded-md" />
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-4">
                        <h3 className="font-bold text-center text-lg flex items-center justify-center"><PaperClipIcon className="w-5 h-5 mr-2" />Attachments & Final Notes</h3>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-border border-dashed rounded-md">
                            <div className="space-y-1 text-center">
                                <svg className="mx-auto h-12 w-12 text-text-secondary" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                                <div className="flex text-sm text-text-secondary">
                                    <label htmlFor="file-upload" className="relative cursor-pointer bg-surface rounded-md font-medium text-primary hover:text-secondary">
                                        <span>Upload files</span>
                                        <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple onChange={handleFileChange} />
                                    </label>
                                    <p className="pl-1">or drag and drop</p>
                                </div>
                                <p className="text-xs text-text-secondary">Site reports, inspiration photos, etc.</p>
                                {selectedFiles.length > 0 && (
                                    <div className="mt-2 text-xs text-primary font-bold">
                                        {selectedFiles.length} file(s) selected
                                    </div>
                                )}
                            </div>
                        </div>
                        <textarea name="notes" value={formData.notes} onChange={handleChange} rows={3} placeholder="Add any final notes for the quotation team..." className="w-full p-2 border border-border bg-subtle-background rounded-md" />
                    </div>
                )}

                <div className="flex justify-between pt-2">
                    <button type="button" onClick={() => setStep(s => s - 1)} disabled={step === 1} className="px-4 py-2 text-sm font-medium text-text-primary bg-surface border border-border rounded-md hover:bg-subtle-background disabled:opacity-50">Back</button>
                    {step < 3 ? (
                        <button type="button" onClick={() => setStep(s => s + 1)} className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-secondary">Next</button>
                    ) : (
                        <button type="submit" className="bg-secondary text-white px-4 py-2 rounded-md text-sm font-medium hover:opacity-90">Submit Request</button>
                    )}
                </div>
            </form>
        </Modal>
    );
};

export default RequestQuotationModal;