import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, ChevronRightIcon, ChevronLeftIcon, CheckIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import Modal from '../../shared/Modal';
import { Project, ExecutionStage } from '../../../types';

interface ProjectSetupWizardProps {
    isOpen: boolean;
    onClose: () => void;
    project: Project;
    onComplete: (setupData: ProjectSetupData) => Promise<void>;
}

export interface ProjectSetupData {
    timeline: ExecutionStage[];
    materials: MaterialRequirement[];
    specifications: {
        laborRequired: number;
        estimatedDuration: number; // in days
        specialRequirements: string;
        safetyNotes: string;
    };
    notes: string;
}

interface MaterialRequirement {
    id: string;
    name: string;
    quantity: number;
    unit: string;
    estimatedCost: number;
    supplier?: string;
    notes?: string;
}

const STEPS = [
    { number: 1, title: 'Project Timeline' },
    { number: 2, title: 'Materials Required' },
    { number: 3, title: 'Specifications' },
    { number: 4, title: 'Review & Submit' }
];

const ProjectSetupWizard: React.FC<ProjectSetupWizardProps> = ({ isOpen, onClose, project, onComplete }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<ProjectSetupData>({
        timeline: [
            {
                id: `stage-${Date.now()}-1`,
                name: 'Site Preparation',
                deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
                status: 'Pending',
                description: ''
            },
            {
                id: `stage-${Date.now()}-2`,
                name: 'Material Procurement',
                deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
                status: 'Pending',
                description: ''
            },
            {
                id: `stage-${Date.now()}-3`,
                name: 'Execution Phase 1',
                deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
                status: 'Pending',
                description: ''
            }
        ],
        materials: [],
        specifications: {
            laborRequired: 0,
            estimatedDuration: 0,
            specialRequirements: '',
            safetyNotes: ''
        },
        notes: ''
    });

    const handleNext = () => {
        if (currentStep < 4) setCurrentStep(currentStep + 1);
        else handleSubmit();
    };

    const handleBack = () => {
        if (currentStep > 1) setCurrentStep(currentStep - 1);
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await onComplete(formData);
            onClose();
        } catch (error) {
            console.error('Failed to setup project:', error);
            alert('Failed to setup project. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const addTimelineStage = () => {
        const newStage: ExecutionStage = {
            id: `stage-${Date.now()}`,
            name: `Stage ${formData.timeline.length + 1}`,
            deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            status: 'Pending',
            description: ''
        };
        setFormData({ ...formData, timeline: [...formData.timeline, newStage] });
    };

    const removeTimelineStage = (id: string) => {
        setFormData({ ...formData, timeline: formData.timeline.filter(s => s.id !== id) });
    };

    const updateTimelineStage = (id: string, updates: Partial<ExecutionStage>) => {
        setFormData({
            ...formData,
            timeline: formData.timeline.map(s => s.id === id ? { ...s, ...updates } : s)
        });
    };

    const addMaterial = () => {
        const newMaterial: MaterialRequirement = {
            id: `mat-${Date.now()}`,
            name: '',
            quantity: 0,
            unit: 'units',
            estimatedCost: 0,
            supplier: '',
            notes: ''
        };
        setFormData({ ...formData, materials: [...formData.materials, newMaterial] });
    };

    const removeMaterial = (id: string) => {
        setFormData({ ...formData, materials: formData.materials.filter(m => m.id !== id) });
    };

    const updateMaterial = (id: string, updates: Partial<MaterialRequirement>) => {
        setFormData({
            ...formData,
            materials: formData.materials.map(m => m.id === id ? { ...m, ...updates } : m)
        });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Project Setup Wizard" size="6xl">
            <div className="flex flex-col h-[80vh]">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{project.projectName}</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Client: {project.clientName}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                                Step {currentStep} of {STEPS.length}
                            </p>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">{STEPS[currentStep - 1].title}</p>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-blue-600"
                            initial={{ width: '25%' }}
                            animate={{ width: `${(currentStep / STEPS.length) * 100}%` }}
                            transition={{ duration: 0.3 }}
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8">
                    <AnimatePresence mode="wait">
                        {/* Step 1: Timeline */}
                        {currentStep === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6">
                                    <p className="text-sm text-blue-900 dark:text-blue-100">
                                        <strong>Project Timeline Setup:</strong> Define the execution phases and their deadlines. 
                                        This will help track progress and ensure timely completion.
                                    </p>
                                </div>

                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Execution Stages</h3>
                                    <button
                                        onClick={addTimelineStage}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        <PlusIcon className="w-4 h-4" />
                                        Add Stage
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {formData.timeline.map((stage, idx) => (
                                        <div key={stage.id} className="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-gray-600">
                                            <div className="flex justify-between items-start mb-3">
                                                <h4 className="font-semibold text-gray-900 dark:text-white">Stage {idx + 1}</h4>
                                                {formData.timeline.length > 1 && (
                                                    <button
                                                        onClick={() => removeTimelineStage(stage.id)}
                                                        className="text-red-500 hover:text-red-700"
                                                    >
                                                        <TrashIcon className="w-5 h-5" />
                                                    </button>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                        Stage Name *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={stage.name}
                                                        onChange={(e) => updateTimelineStage(stage.id, { name: e.target.value })}
                                                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-600 dark:text-white"
                                                        placeholder="e.g., Foundation Work"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                        Deadline *
                                                    </label>
                                                    <input
                                                        type="date"
                                                        value={stage.deadline instanceof Date ? stage.deadline.toISOString().split('T')[0] : ''}
                                                        onChange={(e) => updateTimelineStage(stage.id, { deadline: new Date(e.target.value) })}
                                                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-600 dark:text-white"
                                                        required
                                                    />
                                                </div>
                                                <div className="col-span-2">
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                        Description
                                                    </label>
                                                    <textarea
                                                        value={stage.description || ''}
                                                        onChange={(e) => updateTimelineStage(stage.id, { description: e.target.value })}
                                                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-600 dark:text-white"
                                                        rows={2}
                                                        placeholder="Brief description of this stage..."
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Step 2: Materials */}
                        {currentStep === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg mb-6">
                                    <p className="text-sm text-green-900 dark:text-green-100">
                                        <strong>Materials Planning:</strong> List all materials required for project execution. 
                                        This helps with procurement planning and budget tracking.
                                    </p>
                                </div>

                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Material Requirements</h3>
                                    <button
                                        onClick={addMaterial}
                                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                    >
                                        <PlusIcon className="w-4 h-4" />
                                        Add Material
                                    </button>
                                </div>

                                {formData.materials.length === 0 ? (
                                    <div className="text-center py-12 bg-gray-50 dark:bg-slate-700 rounded-lg">
                                        <p className="text-gray-500 dark:text-gray-400 mb-4">No materials added yet</p>
                                        <button
                                            onClick={addMaterial}
                                            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                        >
                                            Add First Material
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {formData.materials.map((material, idx) => (
                                            <div key={material.id} className="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-gray-600">
                                                <div className="flex justify-between items-start mb-3">
                                                    <h4 className="font-semibold text-gray-900 dark:text-white">Material {idx + 1}</h4>
                                                    <button
                                                        onClick={() => removeMaterial(material.id)}
                                                        className="text-red-500 hover:text-red-700"
                                                    >
                                                        <TrashIcon className="w-5 h-5" />
                                                    </button>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div className="col-span-2">
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                            Material Name *
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={material.name}
                                                            onChange={(e) => updateMaterial(material.id, { name: e.target.value })}
                                                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-600 dark:text-white"
                                                            placeholder="e.g., Portland Cement"
                                                            required
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                            Quantity *
                                                        </label>
                                                        <input
                                                            type="number"
                                                            value={material.quantity}
                                                            onChange={(e) => updateMaterial(material.id, { quantity: Number(e.target.value) })}
                                                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-600 dark:text-white"
                                                            required
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                            Unit *
                                                        </label>
                                                        <select
                                                            value={material.unit}
                                                            onChange={(e) => updateMaterial(material.id, { unit: e.target.value })}
                                                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-600 dark:text-white"
                                                        >
                                                            <option value="units">Units</option>
                                                            <option value="kg">Kilograms</option>
                                                            <option value="tons">Tons</option>
                                                            <option value="bags">Bags</option>
                                                            <option value="sqft">Sq. Ft.</option>
                                                            <option value="sqm">Sq. M.</option>
                                                            <option value="meters">Meters</option>
                                                            <option value="pieces">Pieces</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                            Estimated Cost (₹)
                                                        </label>
                                                        <input
                                                            type="number"
                                                            value={material.estimatedCost}
                                                            onChange={(e) => updateMaterial(material.id, { estimatedCost: Number(e.target.value) })}
                                                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-600 dark:text-white"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                            Supplier
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={material.supplier || ''}
                                                            onChange={(e) => updateMaterial(material.id, { supplier: e.target.value })}
                                                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-600 dark:text-white"
                                                            placeholder="Optional"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* Step 3: Specifications */}
                        {currentStep === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg mb-6">
                                    <p className="text-sm text-purple-900 dark:text-purple-100">
                                        <strong>Project Specifications:</strong> Define labor requirements, duration estimates, 
                                        and any special considerations for this project.
                                    </p>
                                </div>

                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Labor Required (Number of Workers) *
                                            </label>
                                            <input
                                                type="number"
                                                value={formData.specifications.laborRequired}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    specifications: { ...formData.specifications, laborRequired: Number(e.target.value) }
                                                })}
                                                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white"
                                                min="1"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Estimated Duration (Days) *
                                            </label>
                                            <input
                                                type="number"
                                                value={formData.specifications.estimatedDuration}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    specifications: { ...formData.specifications, estimatedDuration: Number(e.target.value) }
                                                })}
                                                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white"
                                                min="1"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Special Requirements
                                        </label>
                                        <textarea
                                            value={formData.specifications.specialRequirements}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                specifications: { ...formData.specifications, specialRequirements: e.target.value }
                                            })}
                                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white"
                                            rows={4}
                                            placeholder="Any special tools, permits, or requirements needed..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Safety Notes & Precautions
                                        </label>
                                        <textarea
                                            value={formData.specifications.safetyNotes}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                specifications: { ...formData.specifications, safetyNotes: e.target.value }
                                            })}
                                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white"
                                            rows={4}
                                            placeholder="Safety measures, PPE requirements, hazard warnings..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Additional Notes
                                        </label>
                                        <textarea
                                            value={formData.notes}
                                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white"
                                            rows={3}
                                            placeholder="Any other important information..."
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 4: Review */}
                        {currentStep === 4 && (
                            <motion.div
                                key="step4"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6">
                                    <p className="text-sm text-blue-900 dark:text-blue-100">
                                        <strong>Review & Submit:</strong> Please review all the information before submitting. 
                                        You can edit these details later from the project dashboard.
                                    </p>
                                </div>

                                {/* Timeline Review */}
                                <div className="p-6 bg-gray-50 dark:bg-slate-700 rounded-lg">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Timeline ({formData.timeline.length} stages)</h3>
                                    <div className="space-y-3">
                                        {formData.timeline.map((stage, idx) => (
                                            <div key={stage.id} className="flex items-center gap-4 p-3 bg-white dark:bg-slate-600 rounded-lg">
                                                <div className="flex-1">
                                                    <p className="font-semibold text-gray-900 dark:text-white">{stage.name}</p>
                                                    {stage.description && <p className="text-sm text-gray-500 dark:text-gray-400">{stage.description}</p>}
                                                </div>
                                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    {stage.deadline instanceof Date ? stage.deadline.toLocaleDateString() : 'No date'}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Materials Review */}
                                <div className="p-6 bg-gray-50 dark:bg-slate-700 rounded-lg">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Materials ({formData.materials.length} items)</h3>
                                    {formData.materials.length === 0 ? (
                                        <p className="text-gray-500 dark:text-gray-400">No materials specified</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {formData.materials.map(material => (
                                                <div key={material.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-600 rounded-lg">
                                                    <div>
                                                        <p className="font-semibold text-gray-900 dark:text-white">{material.name}</p>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                                            {material.quantity} {material.unit}
                                                            {material.supplier && ` • ${material.supplier}`}
                                                        </p>
                                                    </div>
                                                    {material.estimatedCost > 0 && (
                                                        <p className="font-bold text-green-600">₹{material.estimatedCost.toLocaleString()}</p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Specifications Review */}
                                <div className="p-6 bg-gray-50 dark:bg-slate-700 rounded-lg">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Specifications</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Labor Required</p>
                                            <p className="font-bold text-gray-900 dark:text-white">{formData.specifications.laborRequired} workers</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Estimated Duration</p>
                                            <p className="font-bold text-gray-900 dark:text-white">{formData.specifications.estimatedDuration} days</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between bg-gray-50 dark:bg-slate-900">
                    <button
                        onClick={handleBack}
                        disabled={currentStep === 1 || loading}
                        className={`px-5 py-2.5 rounded-lg flex items-center gap-2 transition-colors font-medium border ${
                            currentStep === 1 || loading
                                ? 'text-gray-300 border-transparent cursor-not-allowed'
                                : 'text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                    >
                        <ChevronLeftIcon className="w-5 h-5" /> Previous
                    </button>

                    <button
                        onClick={handleNext}
                        disabled={loading}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Processing...
                            </>
                        ) : currentStep === 4 ? (
                            <>Complete Setup <CheckIcon className="w-5 h-5" /></>
                        ) : (
                            <>Next Step <ChevronRightIcon className="w-5 h-5" /></>
                        )}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ProjectSetupWizard;
