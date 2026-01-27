import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, ChevronRightIcon, ChevronLeftIcon, CheckIcon, CalendarIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { USERS } from '../../../constants';
import { UserRole, Organization } from '../../../types';
import { useUsers } from '../../../hooks/useUsers';

interface CreateProjectWizardProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (projectData: any) => void;
    preselectedOrgId?: string;
    organizations: Organization[];
}

const STEPS = [
    { number: 1, title: 'Basics & Scope' },
    { number: 2, title: 'Team Composition' },
    { number: 3, title: 'Schedule & Timeline' },
    { number: 4, title: 'Financials' }
];

const CreateProjectWizard: React.FC<CreateProjectWizardProps> = ({ isOpen, onClose, onSubmit, preselectedOrgId, organizations }) => {
    const { users: realUsers } = useUsers();
    // Use real users if available, otherwise fallback to mock constants
    const users = realUsers.length > 0 ? realUsers : USERS;

    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        // Basics
        organizationId: preselectedOrgId || '',
        projectName: '',
        projectType: 'Office',
        clientName: '',
        location: '',
        scopeOfWork: '',

        // Team
        projectHeadId: '',
        salesPersonId: '',
        siteEngineerId: '',
        designerId: '',

        // Schedule
        startDate: '',
        deadline: '',
        timeline: [
            { phase: 'Project Kickoff', date: '' },
            { phase: 'Design Finalization', date: '' },
            { phase: 'Execution Start', date: '' }
        ],

        // Financials
        budget: '',
        advanceAmount: '',
        paymentTerms: [
            { milestone: 'Project Kickoff (Advance)', percentage: 50, amount: 0, dueDate: '' },
            { milestone: 'Material Delivery', percentage: 30, amount: 0, dueDate: '' },
            { milestone: 'Completion & Handover', percentage: 20, amount: 0, dueDate: '' }
        ]
    });

    const handleOrgChange = (orgId: string) => {
        const org = organizations.find(o => o.id === orgId);
        setFormData({
            ...formData,
            organizationId: orgId,
            clientName: org?.name || '',
            location: org?.address || '' // Auto-fill location if available
        });
    };

    const handleNext = () => {
        if (currentStep < 4) setCurrentStep(currentStep + 1);
        else handleSubmit();
    };

    const handleBack = () => {
        if (currentStep > 1) setCurrentStep(currentStep - 1);
    };

    const handleSubmit = () => {
        // Here you would typically validate and format the data before submitting
        onSubmit(formData);
        onClose();
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
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Topic / Location</label>
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
                                                        className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500"
                                                    >
                                                        <option value="">Select Project Head</option>
                                                        {executionUsers.map(u => (
                                                            <option key={u.id} value={u.id}>{u.name}</option>
                                                        ))}
                                                    </select>
                                                    <p className="text-xs text-gray-500 mt-1">Responsible for end-to-end delivery.</p>
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
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Total Budget (₹)</label>
                                                    <input
                                                        type="number"
                                                        value={formData.budget}
                                                        onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                                                        className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Advance Amount (₹)</label>
                                                    <input
                                                        type="number"
                                                        value={formData.advanceAmount}
                                                        onChange={(e) => setFormData({ ...formData, advanceAmount: e.target.value })}
                                                        className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <div className="flex justify-between items-center mb-3">
                                                    <h3 className="font-medium text-gray-900 dark:text-white">Payment Schedule</h3>
                                                    <button
                                                        onClick={() => setFormData({
                                                            ...formData,
                                                            paymentTerms: [...formData.paymentTerms, { milestone: 'New Stage', percentage: 0, amount: 0, dueDate: '' }]
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
                                                                        newTerms[idx].percentage = Number(e.target.value);
                                                                        setFormData({ ...formData, paymentTerms: newTerms });
                                                                    }}
                                                                    className="w-full p-2 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                                                                    placeholder="%"
                                                                />
                                                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">%</span>
                                                            </div>
                                                            <div className="w-32 relative">
                                                                <input
                                                                    type="number"
                                                                    value={term.amount}
                                                                    onChange={(e) => {
                                                                        const newTerms = [...formData.paymentTerms];
                                                                        newTerms[idx].amount = Number(e.target.value);
                                                                        setFormData({ ...formData, paymentTerms: newTerms });
                                                                    }}
                                                                    className="w-full p-2 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                                                                    placeholder="Amount"
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
                                    disabled={currentStep === 1}
                                    className={`px-5 py-2.5 rounded-lg flex items-center gap-2 transition-colors font-medium border ${currentStep === 1
                                        ? 'text-gray-300 border-transparent cursor-not-allowed hidden'
                                        : 'text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800'
                                        }`}
                                >
                                    <ChevronLeftIcon className="w-5 h-5" /> Previous
                                </button>

                                <button
                                    onClick={handleNext}
                                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all shadow-lg shadow-blue-200 dark:shadow-blue-900/30 flex items-center gap-2 transform active:scale-95"
                                >
                                    {currentStep === 4 ? (
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
