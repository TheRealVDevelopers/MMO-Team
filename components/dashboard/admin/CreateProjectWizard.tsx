import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, ChevronRightIcon, ChevronLeftIcon, CheckIcon, BuildingOfficeIcon, UserIcon, CalendarIcon, CurrencyRupeeIcon } from '@heroicons/react/24/outline';
import { PROJECT_TEMPLATES, USERS } from '../../../constants';
import { UserRole, Organization } from '../../../types';

interface CreateProjectWizardProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (projectData: any) => void;
    preselectedOrgId?: string;
    organizations: Organization[]; // NEW PROP
}

const STEPS = [
    { number: 1, title: 'Project Basics' },
    { number: 2, title: 'Team Assignment' },
    { number: 3, title: 'Timeline & Budget' }
];

const CreateProjectWizard: React.FC<CreateProjectWizardProps> = ({ isOpen, onClose, onSubmit, preselectedOrgId, organizations }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        organizationId: preselectedOrgId || '',
        projectName: '',
        projectType: 'Office',
        clientName: '', // Auto-filled from Org
        projectHeadId: '',
        salesPersonId: '',
        startDate: '',
        deadline: '',
        budget: '',
        advanceAmount: '',
        paymentTerms: [
            { milestone: 'Project Kickoff (Advance)', percentage: 50, amount: 0 },
            { milestone: 'Material Delivery', percentage: 30, amount: 0 },
            { milestone: 'Completion & Handover', percentage: 20, amount: 0 }
        ]
    });

    const handleOrgChange = (orgId: string) => {
        const org = organizations.find(o => o.id === orgId);
        setFormData({
            ...formData,
            organizationId: orgId,
            clientName: org?.name || ''
        });
    };

    const handleNext = () => {
        if (currentStep < 3) setCurrentStep(currentStep + 1);
        else handleSubmit();
    };

    const handleBack = () => {
        if (currentStep > 1) setCurrentStep(currentStep - 1);
    };

    const handleSubmit = () => {
        onSubmit(formData);
        onClose();
    };

    const salesUsers = USERS.filter(u => u.role === UserRole.SALES_TEAM_MEMBER);
    const executionUsers = USERS.filter(u => u.role === UserRole.EXECUTION_TEAM);

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
                        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                            {/* Header */}
                            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create New Project</h2>
                                    <p className="text-sm text-gray-500">Step {currentStep} of 3: {STEPS[currentStep - 1].title}</p>
                                </div>
                                <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                                    <XMarkIcon className="w-6 h-6 text-gray-500" />
                                </button>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full bg-gray-100 dark:bg-gray-700 h-1">
                                <motion.div
                                    className="h-full bg-primary" // Changed from bg-blue-600
                                    initial={{ width: '33%' }}
                                    animate={{ width: `${(currentStep / 3) * 100}%` }}
                                    transition={{ duration: 0.3 }}
                                />
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-8">
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
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Organization</label>
                                                    <select
                                                        value={formData.organizationId}
                                                        onChange={(e) => handleOrgChange(e.target.value)}
                                                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white"
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
                                                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project Type</label>
                                                    <div className="flex gap-2">
                                                        <select
                                                            value={formData.projectType}
                                                            onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
                                                            className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white"
                                                        >
                                                            <option value="Office">Corporate Office</option>
                                                            <option value="Residential">Residential</option>
                                                            <option value="Commercial">Commercial/Retail</option>
                                                            <option value="Hospitality">Hospitality</option>
                                                            <option value="Educational">Educational</option>
                                                            <option value="Other">Other (Custom)</option>
                                                        </select>
                                                        {formData.projectType === 'Other' && (
                                                            <input
                                                                type="text"
                                                                placeholder="Type..."
                                                                className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white"
                                                                onChange={(e) => setFormData({ ...formData, projectType: e.target.value })} // In real app, manage separate state for custom input then merge
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
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
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project Head (Execution Lead)</label>
                                                    <select
                                                        value={formData.projectHeadId}
                                                        onChange={(e) => setFormData({ ...formData, projectHeadId: e.target.value })}
                                                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white"
                                                    >
                                                        <option value="">Select Project Head</option>
                                                        {executionUsers.map(u => (
                                                            <option key={u.id} value={u.id}>{u.name}</option>
                                                        ))}
                                                    </select>
                                                    <p className="text-xs text-gray-500 mt-1">Responsible for end-to-end execution and daily updates.</p>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sales Representative</label>
                                                    <select
                                                        value={formData.salesPersonId}
                                                        onChange={(e) => setFormData({ ...formData, salesPersonId: e.target.value })}
                                                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white"
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
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Total Budget (₹)</label>
                                                    <input
                                                        type="number"
                                                        value={formData.budget}
                                                        onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                                                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Advance Amount Received (₹)</label>
                                                    <input
                                                        type="number"
                                                        value={formData.advanceAmount}
                                                        onChange={(e) => setFormData({ ...formData, advanceAmount: e.target.value })}
                                                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                                                    <input
                                                        type="date"
                                                        value={formData.startDate}
                                                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Deadline</label>
                                                    <input
                                                        type="date"
                                                        value={formData.deadline}
                                                        onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                                                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <div className="flex justify-between items-center mb-3">
                                                    <h3 className="font-medium text-gray-900 dark:text-white">Payment Terms</h3>
                                                    <button
                                                        onClick={() => setFormData({
                                                            ...formData,
                                                            paymentTerms: [...formData.paymentTerms, { milestone: 'New Stage', percentage: 0, amount: 0 }]
                                                        })}
                                                        className="text-xs font-bold text-primary hover:text-primary/80"
                                                    >
                                                        + Add Stage
                                                    </button>
                                                </div>
                                                <div className="space-y-3">
                                                    {formData.paymentTerms.map((term, idx) => (
                                                        <div key={idx} className="flex gap-4 items-center">
                                                            <input
                                                                type="text"
                                                                value={term.milestone}
                                                                onChange={(e) => {
                                                                    const newTerms = [...formData.paymentTerms];
                                                                    newTerms[idx].milestone = e.target.value;
                                                                    setFormData({ ...formData, paymentTerms: newTerms });
                                                                }}
                                                                className="flex-1 p-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                                                            />
                                                            <div className="w-24 relative">
                                                                <input
                                                                    type="number"
                                                                    value={term.percentage}
                                                                    onChange={(e) => {
                                                                        const newTerms = [...formData.paymentTerms];
                                                                        newTerms[idx].percentage = Number(e.target.value);
                                                                        setFormData({ ...formData, paymentTerms: newTerms });
                                                                    }}
                                                                    className="w-full p-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                                                                />
                                                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">%</span>
                                                            </div>
                                                            <button
                                                                onClick={() => {
                                                                    const newTerms = [...formData.paymentTerms];
                                                                    newTerms.splice(idx, 1);
                                                                    setFormData({ ...formData, paymentTerms: newTerms });
                                                                }}
                                                                className="text-gray-400 hover:text-red-500"
                                                            >
                                                                <XMarkIcon className="w-4 h-4" />
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
                            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between">
                                <button
                                    onClick={handleBack}
                                    disabled={currentStep === 1}
                                    className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${currentStep === 1
                                        ? 'text-gray-400 cursor-not-allowed'
                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    <ChevronLeftIcon className="w-5 h-5" /> Back
                                </button>

                                <button
                                    onClick={handleNext}
                                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                                >
                                    {currentStep === 3 ? (
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
