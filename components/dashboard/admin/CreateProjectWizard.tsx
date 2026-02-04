import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, ChevronRightIcon, ChevronLeftIcon, CheckIcon, CalendarIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { USERS as USERS_CONST } from '../../../constants';
import { UserRole, Organization, ProjectStatus, Lead } from '../../../types';
import { useUsers } from '../../../hooks/useUsers';
import { useLeads } from '../../../hooks/useLeads';

interface CreateProjectWizardProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (projectData: any) => void;
    preselectedOrgId?: string;
    organizations: Organization[];
}

const STEPS = [
    { number: 1, title: 'Project Source' },
    { number: 2, title: 'Source Attachments' },
    { number: 3, title: 'Basics & Scope' },
    { number: 4, title: 'Team Composition' },
    { number: 5, title: 'Schedule & Timeline' },
    { number: 6, title: 'Financials' }
];

const CreateProjectWizard: React.FC<CreateProjectWizardProps> = ({ isOpen, onClose, onSubmit, preselectedOrgId, organizations }) => {
    const { users: realUsers } = useUsers();
    // Use real users if available, otherwise fallback to mock constants
    const users = realUsers.length > 0 ? realUsers : USERS_CONST;

    const { leads } = useLeads();
    const [projectSource, setProjectSource] = useState<'scratch' | 'lead'>('scratch');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [selectedAttachments, setSelectedAttachments] = useState({
        boq: '',
        drawing: '',
        quotation: ''
    });

    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        // Basics
        status: ProjectStatus.PENDING_EXECUTION_APPROVAL, // Default status for new projects
        organizationId: preselectedOrgId || '',
        projectName: '',
        projectType: 'Office',
        clientName: '',
        location: '',
        scopeOfWork: '',
        convertedFromLeadId: '',

        // Team
        projectHeadId: '',
        salesPersonId: '',
        siteEngineerId: '',
        designerId: '',

        // Schedule
        startDate: new Date().toISOString().split('T')[0],
        deadline: '',
        timeline: [],

        // Financials
        budget: '',
        advanceAmount: '',
        gstPercentage: 18, // Default GST 18%
        gstAmount: '',
        totalWithGST: '',
        paymentTerms: []
    });

    const handleSelectLead = (lead: Lead) => {
        setProjectSource('lead');
        setSelectedLead(lead);
        setFormData({
            ...formData,
            convertedFromLeadId: lead.id,
            projectName: lead.projectName || lead.clientName + ' Project',
            clientName: lead.clientName,
            location: '', // Lead might not have strict location field mapping, leave blank or map if available
            projectType: 'Office', // Default, or map if Lead has type
            scopeOfWork: `Project converted from lead: ${lead.clientName}`,
            salesPersonId: lead.assignedTo || '',
            budget: lead.value ? lead.value.toString() : '',
            status: ProjectStatus.PENDING_EXECUTION_APPROVAL
        });
        setCurrentStep(2); // Go to Attachments step
    };

    // Filter available documents from the selected lead
    const availableDocs = {
        boqs: selectedLead?.boqs || selectedLead?.files?.filter(f => f.fileName.toLowerCase().includes('boq')) || [],
        drawings: selectedLead?.drawings || selectedLead?.files?.filter(f => f.fileName.toLowerCase().includes('drawing') || f.fileType === 'pdf') || [],
        quotations: selectedLead?.quotations || selectedLead?.files?.filter(f => f.fileName.toLowerCase().includes('quote') || f.fileName.toLowerCase().includes('quotation')) || []
    };

    const handleOrgChange = (orgId: string) => {
        const org = organizations.find(o => o.id === orgId);
        setFormData({
            ...formData,
            organizationId: orgId,
            clientName: org?.name || '',
            location: org?.address || '' // Auto-fill location if available
        });
    };

    // Auto-calculate GST and total when budget or GST percentage changes
    const handleBudgetChange = (budget: string) => {
        const budgetValue = Number(budget);
        const gstAmount = (budgetValue * formData.gstPercentage / 100).toFixed(2);
        const totalWithGST = (budgetValue + Number(gstAmount)).toFixed(2);

        setFormData({
            ...formData,
            budget,
            gstAmount,
            totalWithGST,
            // Also update payment terms if they exist
            paymentTerms: formData.paymentTerms.map(term => ({
                ...term,
                amount: budgetValue && term.percentage ?
                    (budgetValue * term.percentage / 100).toFixed(2) : term.amount
            }))
        });
    };

    const handleGSTChange = (gstPercentage: number) => {
        const budgetValue = Number(formData.budget);
        const gstAmount = (budgetValue * gstPercentage / 100).toFixed(2);
        const totalWithGST = (budgetValue + Number(gstAmount)).toFixed(2);

        setFormData({
            ...formData,
            gstPercentage,
            gstAmount,
            totalWithGST
        });
    };



    const handleNext = () => {
        // Validation for Attachment Step (Step 2 in 'lead' mode)
        // REMOVED MANDATORY CHECK AS PER USER REQUEST
        // User can now skip this step or select/upload partial documents.

        if (currentStep < 6) setCurrentStep(currentStep + 1);
        else handleSubmit();
    };

    const handleBack = () => {
        if (currentStep === 3 && projectSource === 'scratch') {
            setCurrentStep(1); // Skip back to source selection
        } else if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newAttachments, setNewAttachments] = useState<{
        boq: File | null;
        drawing: File | null;
        quotation: File | null;
    }>({ boq: null, drawing: null, quotation: null });

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const documents = [];

            // 1. Process Selected Existing Documents (from Lead)
            if (projectSource === 'lead' && selectedLead) {
                if (selectedAttachments.boq) {
                    const doc = availableDocs.boqs.find(d => d.id === selectedAttachments.boq);
                    if (doc) documents.push({ ...doc, type: 'boq' });
                }
                if (selectedAttachments.drawing) {
                    const doc = availableDocs.drawings.find(d => d.id === selectedAttachments.drawing);
                    if (doc) documents.push({ ...doc, type: 'drawing' });
                }
                if (selectedAttachments.quotation) {
                    const doc = availableDocs.quotations.find(d => d.id === selectedAttachments.quotation);
                    if (doc) documents.push({ ...doc, type: 'quotation' });
                }
            }

            // 2. Process New Uploads (Base64)
            const timestamp = Date.now();

            if (newAttachments.boq) {
                const base64 = await fileToBase64(newAttachments.boq);
                documents.push({
                    id: `doc-${timestamp}-boq`,
                    name: newAttachments.boq.name,
                    type: 'pdf',
                    url: base64, // Storing Base64 directly in URL field
                    uploaded: new Date(),
                    size: (newAttachments.boq.size / 1024 / 1024).toFixed(2) + ' MB',
                    typeCategory: 'boq'
                });
            }
            if (newAttachments.drawing) {
                const base64 = await fileToBase64(newAttachments.drawing);
                documents.push({
                    id: `doc-${timestamp}-drawing`,
                    name: newAttachments.drawing.name,
                    type: 'pdf',
                    url: base64,
                    uploaded: new Date(),
                    size: (newAttachments.drawing.size / 1024 / 1024).toFixed(2) + ' MB',
                    typeCategory: 'drawing'
                });
            }
            if (newAttachments.quotation) {
                const base64 = await fileToBase64(newAttachments.quotation);
                documents.push({
                    id: `doc-${timestamp}-quote`,
                    name: newAttachments.quotation.name,
                    type: 'pdf',
                    url: base64,
                    uploaded: new Date(),
                    size: (newAttachments.quotation.size / 1024 / 1024).toFixed(2) + ' MB',
                    typeCategory: 'quotation'
                });
            }

            const finalData = {
                ...formData,
                documents
            };

            await onSubmit(finalData);
            onClose();
        } catch (error) {
            console.error("Error creating project:", error);
            alert("Failed to create project. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };


    // Filter Users by Role
    const salesUsers = users.filter(u => u.role === UserRole.SALES_TEAM_MEMBER);
    const executionUsers = users.filter(u => u.role === UserRole.EXECUTION_TEAM);
    const siteEngineers = users.filter(u => u.role === UserRole.SITE_ENGINEER);
    const drawingTeam = users.filter(u => u.role === UserRole.DRAWING_TEAM);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    >
                        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                            {/* Header */}
                            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-slate-900 rounded-t-xl">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Project</h2>
                                    <p className="text-sm text-gray-500">Define project details, team, and financials.</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right hidden sm:block">
                                        <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Step {currentStep} of {STEPS.length}</p>
                                        <p className="text-sm font-bold text-gray-900 dark:text-white">{STEPS[currentStep - 1].title}</p>
                                    </div>
                                    <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                                        <XMarkIcon className="w-6 h-6 text-gray-500" />
                                    </button>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5">
                                <motion.div
                                    className="h-full bg-blue-600"
                                    initial={{ width: '25%' }}
                                    animate={{ width: `${(currentStep / STEPS.length) * 100}%` }}
                                    transition={{ duration: 0.3 }}
                                />
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                                <AnimatePresence mode="wait">
                                    {currentStep === 1 && (
                                        <motion.div
                                            key="step1"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="space-y-6"
                                        >
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {/* Option 1: Create from Scratch */}
                                                <div
                                                    onClick={() => {
                                                        setProjectSource('scratch');
                                                        setCurrentStep(3); // Skip attachments, go to Basics (Step 3)
                                                    }}
                                                    className="cursor-pointer group relative bg-white dark:bg-slate-800 p-6 rounded-2xl border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all shadow-sm hover:shadow-md"
                                                >
                                                    <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                                        <PlusIcon className="w-6 h-6" />
                                                    </div>
                                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Create from Scratch</h3>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        Start a new project with a blank slate. Ideal for new clients or internal projects.
                                                    </p>
                                                </div>

                                                {/* Option 2: Convert from Lead */}
                                                <div
                                                    onClick={() => setProjectSource('lead')}
                                                    className={`cursor-pointer group relative bg-white dark:bg-slate-800 p-6 rounded-2xl border-2 transition-all shadow-sm hover:shadow-md ${projectSource === 'lead'
                                                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/10'
                                                        : 'border-gray-200 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-500'
                                                        }`}
                                                >
                                                    <div className="h-12 w-12 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                                        <ChevronRightIcon className="w-6 h-6" />
                                                    </div>
                                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Convert from Lead</h3>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        Import details from an existing lead. Best for won deals moving to execution.
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Lead Selection List (Shown only if 'lead' source is active) */}
                                            {projectSource === 'lead' && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6"
                                                >
                                                    <h3 className="text-md font-bold text-gray-900 dark:text-white mb-4">Select a Lead to Convert</h3>
                                                    <input
                                                        type="text"
                                                        placeholder="Search leads..."
                                                        value={searchTerm}
                                                        onChange={(e) => setSearchTerm(e.target.value)}
                                                        className="w-full p-2.5 mb-4 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white"
                                                    />
                                                    <div className="max-h-60 overflow-y-auto space-y-2 custom-scrollbar">
                                                        {leads
                                                            .filter(l =>
                                                                l.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                                l.projectName?.toLowerCase().includes(searchTerm.toLowerCase())
                                                            )
                                                            .map(lead => (
                                                                <div
                                                                    key={lead.id}
                                                                    onClick={() => handleSelectLead(lead)}
                                                                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg border border-transparent hover:border-blue-200 dark:hover:border-blue-800 cursor-pointer transition-colors"
                                                                >
                                                                    <div>
                                                                        <p className="font-bold text-gray-900 dark:text-white text-sm">{lead.clientName}</p>
                                                                        <p className="text-xs text-gray-500">{lead.projectName} • ₹{lead.value?.toLocaleString()}</p>
                                                                    </div>
                                                                    <ChevronRightIcon className="w-4 h-4 text-gray-400" />
                                                                </div>
                                                            ))}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </motion.div>
                                    )}

                                    {currentStep === 2 && (
                                        <motion.div
                                            key="step2"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="space-y-6"
                                        >
                                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg mb-6">
                                                <h3 className="text-sm font-bold text-blue-800 dark:text-blue-200 flex items-center gap-2">
                                                    <span className="w-5 h-5 rounded-full bg-blue-400 text-blue-900 flex items-center justify-center text-xs">i</span>
                                                    Optional Attachments
                                                </h3>
                                                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                                                    You can select existing documents from the lead, upload new ones, or skip this step entirely.
                                                </p>
                                            </div>

                                            <div className="space-y-8">
                                                {/* BOQ Selection */}
                                                <div>
                                                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex justify-between">
                                                        <span>BOQ Document</span>
                                                        <span className="text-xs font-normal text-gray-500 bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded">Optional</span>
                                                    </h4>

                                                    {/* Existing Files */}
                                                    {availableDocs.boqs.length > 0 && (
                                                        <div className="space-y-2 mb-4">
                                                            <p className="text-xs text-gray-500 uppercase font-bold">Select from Lead</p>
                                                            {availableDocs.boqs.map(file => (
                                                                <div key={file.id} className={`flex items-center p-3 border rounded-lg transition-colors ${selectedAttachments.boq === file.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
                                                                    <input
                                                                        type="radio"
                                                                        name="boq"
                                                                        value={file.id}
                                                                        checked={selectedAttachments.boq === file.id}
                                                                        onChange={(e) => {
                                                                            setSelectedAttachments({ ...selectedAttachments, boq: e.target.value });
                                                                            setNewAttachments({ ...newAttachments, boq: null }); // Clear new upload if selecting existing
                                                                        }}
                                                                        className="w-4 h-4 text-blue-600"
                                                                    />
                                                                    <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300 truncate flex-1">{file.fileName}</span>
                                                                    <a
                                                                        href={file.fileUrl}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="ml-2 text-xs text-blue-600 hover:text-blue-800 hover:underline px-2"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    >
                                                                        View
                                                                    </a>
                                                                    <span className="text-xs text-gray-500">{new Date(file.uploadedAt).toLocaleDateString()}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Upload New */}
                                                    <div>
                                                        <p className="text-xs text-gray-500 uppercase font-bold mb-2">Or Upload New</p>
                                                        <input
                                                            type="file"
                                                            onChange={(e) => {
                                                                if (e.target.files?.[0]) {
                                                                    setNewAttachments({ ...newAttachments, boq: e.target.files[0] });
                                                                    setSelectedAttachments({ ...selectedAttachments, boq: '' }); // Clear existing selection
                                                                }
                                                            }}
                                                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-300"
                                                        />
                                                        {newAttachments.boq && <p className="text-xs text-green-600 mt-1">Selected to upload: {newAttachments.boq.name}</p>}
                                                    </div>
                                                </div>

                                                <hr className="border-gray-200 dark:border-gray-700" />

                                                {/* Drawing Selection */}
                                                <div>
                                                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex justify-between">
                                                        <span>2D Drawing / Layout</span>
                                                        <span className="text-xs font-normal text-gray-500 bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded">Optional</span>
                                                    </h4>

                                                    {availableDocs.drawings.length > 0 && (
                                                        <div className="space-y-2 mb-4">
                                                            <p className="text-xs text-gray-500 uppercase font-bold">Select from Lead</p>
                                                            {availableDocs.drawings.map(file => (
                                                                <div key={file.id} className={`flex items-center p-3 border rounded-lg transition-colors ${selectedAttachments.drawing === file.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
                                                                    <input
                                                                        type="radio"
                                                                        name="drawing"
                                                                        value={file.id}
                                                                        checked={selectedAttachments.drawing === file.id}
                                                                        onChange={(e) => {
                                                                            setSelectedAttachments({ ...selectedAttachments, drawing: e.target.value });
                                                                            setNewAttachments({ ...newAttachments, drawing: null });
                                                                        }}
                                                                        className="w-4 h-4 text-blue-600"
                                                                    />
                                                                    <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300 truncate flex-1">{file.fileName}</span>
                                                                    <a
                                                                        href={file.fileUrl}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="ml-2 text-xs text-blue-600 hover:text-blue-800 hover:underline px-2"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    >
                                                                        View
                                                                    </a>
                                                                    <span className="text-xs text-gray-500">{new Date(file.uploadedAt).toLocaleDateString()}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    <div>
                                                        <p className="text-xs text-gray-500 uppercase font-bold mb-2">Or Upload New</p>
                                                        <input
                                                            type="file"
                                                            onChange={(e) => {
                                                                if (e.target.files?.[0]) {
                                                                    setNewAttachments({ ...newAttachments, drawing: e.target.files[0] });
                                                                    setSelectedAttachments({ ...selectedAttachments, drawing: '' });
                                                                }
                                                            }}
                                                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-300"
                                                        />
                                                        {newAttachments.drawing && <p className="text-xs text-green-600 mt-1">Selected to upload: {newAttachments.drawing.name}</p>}
                                                    </div>
                                                </div>

                                                <hr className="border-gray-200 dark:border-gray-700" />

                                                {/* Quotation Selection */}
                                                <div>
                                                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex justify-between">
                                                        <span>Quotation</span>
                                                        <span className="text-xs font-normal text-gray-500 bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded">Optional</span>
                                                    </h4>

                                                    {availableDocs.quotations.length > 0 && (
                                                        <div className="space-y-2 mb-4">
                                                            <p className="text-xs text-gray-500 uppercase font-bold">Select from Lead</p>
                                                            {availableDocs.quotations.map(file => (
                                                                <div key={file.id} className={`flex items-center p-3 border rounded-lg transition-colors ${selectedAttachments.quotation === file.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
                                                                    <input
                                                                        type="radio"
                                                                        name="quotation"
                                                                        value={file.id}
                                                                        checked={selectedAttachments.quotation === file.id}
                                                                        onChange={(e) => {
                                                                            setSelectedAttachments({ ...selectedAttachments, quotation: e.target.value });
                                                                            setNewAttachments({ ...newAttachments, quotation: null });
                                                                        }}
                                                                        className="w-4 h-4 text-blue-600"
                                                                    />
                                                                    <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300 truncate flex-1">{file.fileName}</span>
                                                                    <a
                                                                        href={file.fileUrl}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="ml-2 text-xs text-blue-600 hover:text-blue-800 hover:underline px-2"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    >
                                                                        View
                                                                    </a>
                                                                    <span className="text-xs text-gray-500">{new Date(file.uploadedAt).toLocaleDateString()}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    <div>
                                                        <p className="text-xs text-gray-500 uppercase font-bold mb-2">Or Upload New</p>
                                                        <input
                                                            type="file"
                                                            onChange={(e) => {
                                                                if (e.target.files?.[0]) {
                                                                    setNewAttachments({ ...newAttachments, quotation: e.target.files[0] });
                                                                    setSelectedAttachments({ ...selectedAttachments, quotation: '' });
                                                                }
                                                            }}
                                                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-300"
                                                        />
                                                        {newAttachments.quotation && <p className="text-xs text-green-600 mt-1">Selected to upload: {newAttachments.quotation.name}</p>}
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {currentStep === 3 && (
                                        <motion.div
                                            key="step3"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="space-y-6"
                                        >
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Organization / Client</label>
                                                    <select
                                                        value={formData.organizationId}
                                                        onChange={(e) => handleOrgChange(e.target.value)}
                                                        className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500"
                                                    >
                                                        <option value="">Select Organization</option>
                                                        {organizations.map(org => (
                                                            <option key={org.id} value={org.id}>{org.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project Name</label>
                                                    <input
                                                        type="text"
                                                        value={formData.projectName}
                                                        onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                                                        placeholder="e.g. HQ Renovation"
                                                        className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project Type</label>
                                                    <select
                                                        value={formData.projectType}
                                                        onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
                                                        className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500"
                                                    >
                                                        <option value="Office">Corporate Office</option>
                                                        <option value="Residential">Residential</option>
                                                        <option value="Commercial">Commercial/Retail</option>
                                                        <option value="Hospitality">Hospitality</option>
                                                        <option value="Educational">Educational</option>
                                                        <option value="Industrial">Industrial</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project  Location</label>
                                                    <input
                                                        type="text"
                                                        value={formData.location}
                                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                                        placeholder="Project Site Address"
                                                        className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Scope of Work</label>
                                                <textarea
                                                    value={formData.scopeOfWork}
                                                    onChange={(e) => setFormData({ ...formData, scopeOfWork: e.target.value })}
                                                    rows={4}
                                                    placeholder="Describe the high-level scope, deliverables, and goals..."
                                                    className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                        </motion.div>
                                    )}

                                    {currentStep === 4 && (
                                        <motion.div
                                            key="step4"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="space-y-6"
                                        >
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Execution Team Member</label>
                                                    <select
                                                        value={formData.projectHeadId}
                                                        onChange={(e) => setFormData({ ...formData, projectHeadId: e.target.value })}
                                                        className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500"
                                                    >
                                                        <option value="">Select Execution Team Member</option>
                                                        {executionUsers.map(u => (
                                                            <option key={u.id} value={u.id}>{u.name}</option>
                                                        ))}
                                                    </select>
                                                    <p className="text-xs text-gray-500 mt-1">Responsible for project execution and delivery.</p>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Site Engineer</label>
                                                    <select
                                                        value={formData.siteEngineerId}
                                                        onChange={(e) => setFormData({ ...formData, siteEngineerId: e.target.value })}
                                                        className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500"
                                                    >
                                                        <option value="">Select Site Engineer</option>
                                                        {siteEngineers.map(u => (
                                                            <option key={u.id} value={u.id}>{u.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Designer / Architect</label>
                                                    <select
                                                        value={formData.designerId}
                                                        onChange={(e) => setFormData({ ...formData, designerId: e.target.value })}
                                                        className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500"
                                                    >
                                                        <option value="">Select Designer</option>
                                                        {drawingTeam.map(u => (
                                                            <option key={u.id} value={u.id}>{u.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sales Representative</label>
                                                    <select
                                                        value={formData.salesPersonId}
                                                        onChange={(e) => setFormData({ ...formData, salesPersonId: e.target.value })}
                                                        className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500"
                                                    >
                                                        <option value="">Select Sales Rep</option>
                                                        {salesUsers.map(u => (
                                                            <option key={u.id} value={u.id}>{u.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {currentStep === 5 && (
                                        <motion.div
                                            key="step5"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="space-y-6"
                                        >
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                                                    <input
                                                        type="date"
                                                        value={formData.startDate}
                                                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                                        className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Deadline</label>
                                                    <input
                                                        type="date"
                                                        value={formData.deadline}
                                                        onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                                                        className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <div className="flex justify-between items-center mb-3">
                                                    <h3 className="font-medium text-gray-900 dark:text-white">Key Timeline Milestones</h3>
                                                    <button
                                                        onClick={() => setFormData({
                                                            ...formData,
                                                            timeline: [...formData.timeline, { phase: 'New Phase', date: '' }]
                                                        })}
                                                        className="flex items-center gap-1 text-sm font-bold text-blue-600 hover:text-blue-700"
                                                    >
                                                        <PlusIcon className="w-4 h-4" /> Add Phase
                                                    </button>
                                                </div>
                                                <div className="space-y-3">
                                                    {formData.timeline.map((item, idx) => (
                                                        <div key={idx} className="flex gap-4 items-center">
                                                            <input
                                                                type="text"
                                                                value={item.phase}
                                                                onChange={(e) => {
                                                                    const newTimeline = [...formData.timeline];
                                                                    newTimeline[idx].phase = e.target.value;
                                                                    setFormData({ ...formData, timeline: newTimeline });
                                                                }}
                                                                className="flex-1 p-2 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-gray-600 rounded-lg"
                                                                placeholder="Phase Name"
                                                            />
                                                            <input
                                                                type="date"
                                                                value={item.date}
                                                                onChange={(e) => {
                                                                    const newTimeline = [...formData.timeline];
                                                                    newTimeline[idx].date = e.target.value;
                                                                    setFormData({ ...formData, timeline: newTimeline });
                                                                }}
                                                                className="w-40 p-2 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-gray-600 rounded-lg"
                                                            />
                                                            <button
                                                                onClick={() => {
                                                                    const newTimeline = [...formData.timeline];
                                                                    newTimeline.splice(idx, 1);
                                                                    setFormData({ ...formData, timeline: newTimeline });
                                                                }}
                                                                className="text-gray-400 hover:text-red-500"
                                                            >
                                                                <TrashIcon className="w-5 h-5" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {currentStep === 6 && (
                                        <motion.div
                                            key="step6"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="space-y-6"
                                        >
                                            {/* GST Section - At the top */}
                                            <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-800">
                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                                    <span className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center text-sm font-bold">%</span>
                                                    GST Configuration
                                                </h3>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">GST Rate (%)</label>
                                                        <input
                                                            type="number"
                                                            value={formData.gstPercentage}
                                                            onChange={(e) => handleGSTChange(Number(e.target.value))}
                                                            className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 font-bold"
                                                            step="0.1"
                                                        />
                                                        <p className="text-xs text-gray-500 mt-1">Default: 18%</p>
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">GST Amount (₹)</label>
                                                        <input
                                                            type="text"
                                                            value={formData.gstAmount}
                                                            readOnly
                                                            className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-600 dark:text-white bg-gray-100 font-bold text-blue-600"
                                                        />
                                                        <p className="text-xs text-gray-500 mt-1">Auto-calculated</p>
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Total with GST (₹)</label>
                                                        <input
                                                            type="text"
                                                            value={formData.totalWithGST}
                                                            readOnly
                                                            className="w-full p-2.5 border-2 border-green-300 dark:border-green-700 rounded-lg dark:bg-slate-600 dark:text-white bg-green-50 font-bold text-green-700 text-lg"
                                                        />
                                                        <p className="text-xs text-gray-500 mt-1">Budget + GST</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Budget Section */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Base Budget (₹) *</label>
                                                    <input
                                                        type="number"
                                                        value={formData.budget}
                                                        onChange={(e) => handleBudgetChange(e.target.value)}
                                                        className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500"
                                                        placeholder="Budget excluding GST"
                                                    />
                                                    <p className="text-xs text-gray-500 mt-1">Enter budget without GST</p>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Advance Amount (₹)</label>
                                                    <input
                                                        type="number"
                                                        value={formData.advanceAmount}
                                                        onChange={(e) => setFormData({ ...formData, advanceAmount: e.target.value })}
                                                        className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500"
                                                    />
                                                    <p className="text-xs text-gray-500 mt-1">Initial payment received</p>
                                                </div>
                                            </div>

                                            <div>
                                                <div className="flex justify-between items-center mb-3">
                                                    <h3 className="font-medium text-gray-900 dark:text-white">Payment Schedule</h3>
                                                    <button
                                                        onClick={() => setFormData({
                                                            ...formData,
                                                            paymentTerms: [...formData.paymentTerms, { milestone: 'New Stage', percentage: 0, amount: '', dueDate: '' }]
                                                        })}
                                                        className="flex items-center gap-1 text-sm font-bold text-blue-600 hover:text-blue-700"
                                                    >
                                                        <PlusIcon className="w-4 h-4" /> Add Payment Stage
                                                    </button>
                                                </div>
                                                <div className="space-y-3">
                                                    {formData.paymentTerms.map((term, idx) => (
                                                        <div key={idx} className="flex gap-4 items-center flex-wrap md:flex-nowrap">
                                                            <input
                                                                type="text"
                                                                value={term.milestone}
                                                                onChange={(e) => {
                                                                    const newTerms = [...formData.paymentTerms];
                                                                    newTerms[idx].milestone = e.target.value;
                                                                    setFormData({ ...formData, paymentTerms: newTerms });
                                                                }}
                                                                className="flex-[2] p-2 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                                                                placeholder="Milestone Name"
                                                            />
                                                            <div className="w-24 relative">
                                                                <input
                                                                    type="number"
                                                                    value={term.percentage}
                                                                    onChange={(e) => {
                                                                        const newTerms = [...formData.paymentTerms];
                                                                        const percentage = Number(e.target.value);
                                                                        newTerms[idx].percentage = percentage;
                                                                        // Auto-calculate amount based on budget and percentage
                                                                        if (formData.budget) {
                                                                            const calculatedAmount = (Number(formData.budget) * percentage / 100).toFixed(2);
                                                                            newTerms[idx].amount = calculatedAmount;
                                                                        }
                                                                        setFormData({ ...formData, paymentTerms: newTerms });
                                                                    }}
                                                                    className="w-full p-2 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                                                                    placeholder="%"
                                                                />
                                                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">%</span>
                                                            </div>
                                                            <div className="w-32 relative">
                                                                <input
                                                                    type="text"
                                                                    value={term.amount}
                                                                    onChange={(e) => {
                                                                        const newTerms = [...formData.paymentTerms];
                                                                        newTerms[idx].amount = e.target.value;
                                                                        setFormData({ ...formData, paymentTerms: newTerms });
                                                                    }}
                                                                    className="w-full p-2 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                                                                    placeholder="Amount"
                                                                    readOnly
                                                                />
                                                            </div>
                                                            <div className="w-36">
                                                                <input
                                                                    type="date"
                                                                    value={term.dueDate}
                                                                    onChange={(e) => {
                                                                        const newTerms = [...formData.paymentTerms];
                                                                        newTerms[idx].dueDate = e.target.value;
                                                                        setFormData({ ...formData, paymentTerms: newTerms });
                                                                    }}
                                                                    className="w-full p-2 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                                                                />
                                                            </div>
                                                            <button
                                                                onClick={() => {
                                                                    const newTerms = [...formData.paymentTerms];
                                                                    newTerms.splice(idx, 1);
                                                                    setFormData({ ...formData, paymentTerms: newTerms });
                                                                }}
                                                                className="text-gray-400 hover:text-red-500"
                                                            >
                                                                <TrashIcon className="w-5 h-5" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Footer / Controls */}
                            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between bg-gray-50 dark:bg-slate-900 rounded-b-xl">
                                <button
                                    onClick={handleBack}
                                    disabled={currentStep === 1 && projectSource === 'scratch'} // Can go back to step 1 from 2, but step 1 is root
                                    className={`px-5 py-2.5 rounded-lg flex items-center gap-2 transition-colors font-medium border ${currentStep === 1
                                        ? 'text-gray-300 border-transparent cursor-not-allowed hidden'
                                        : 'text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800'
                                        }`}
                                >
                                    <ChevronLeftIcon className="w-5 h-5" /> Previous
                                </button>

                                <button
                                    onClick={handleNext}
                                    disabled={isSubmitting}
                                    className={`px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all shadow-lg shadow-blue-200 dark:shadow-blue-900/30 flex items-center gap-2 transform active:scale-95 ${isSubmitting ? 'opacity-70 cursor-wait' : ''}`}
                                >
                                    {isSubmitting ? (
                                        <>Processing...</>
                                    ) : currentStep === 6 ? (
                                        <>Create Project <CheckIcon className="w-5 h-5" /></>
                                    ) : (
                                        <>Next Step <ChevronRightIcon className="w-5 h-5" /></>
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default CreateProjectWizard;
