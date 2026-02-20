import React, { useState } from 'react';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../../../firebase';
import { Case } from '../../../../types';
import { PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface ProjectHealthEditorProps {
    caseData: Case;
}

const ProjectHealthEditor: React.FC<ProjectHealthEditorProps> = ({ caseData }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        status: caseData.health?.status ?? 'On Track',
        riskLevel: caseData.health?.riskLevel ?? 'Low',
        completionPercentage: caseData.health?.completionPercentage ?? 0,
        totalBudget: caseData.financial?.totalBudget ?? 0,
    });

    const handleSave = async () => {
        setLoading(true);
        try {
            const caseRef = doc(db, 'cases', caseData.id);
            await updateDoc(caseRef, {
                'health.status': formData.status,
                'health.riskLevel': formData.riskLevel,
                'health.completionPercentage': Number(formData.completionPercentage),
                'health.lastUpdated': Timestamp.now(),
                // Update financial total safely without wiping other fields
                'financial.totalBudget': Number(formData.totalBudget),
            });
            setIsEditing(false);
        } catch (error) {
            console.error("Error updating project health:", error);
            alert("Failed to update project health.");
        } finally {
            setLoading(false);
        }
    };

    if (!isEditing) {
        return (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm mb-6">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-bold text-slate-800">Project Intelligence</h3>
                    <button
                        onClick={() => setIsEditing(true)}
                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
                    >
                        <PencilIcon className="w-4 h-4" />
                    </button>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    <div>
                        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Health Status</p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
              ${formData.status === 'On Track' ? 'bg-emerald-100 text-emerald-800' :
                                formData.status === 'Minor Delay' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>
                            {formData.status}
                        </span>
                    </div>

                    <div>
                        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Risk Level</p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
              ${formData.riskLevel === 'Low' ? 'bg-slate-100 text-slate-700' :
                                formData.riskLevel === 'Medium' ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'}`}>
                            {formData.riskLevel}
                        </span>
                    </div>

                    <div>
                        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Completion</p>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden w-24">
                                <div
                                    className="h-full bg-emerald-600 rounded-full"
                                    style={{ width: `${formData.completionPercentage}%` }}
                                />
                            </div>
                            <span className="text-sm font-bold text-slate-900">{formData.completionPercentage}%</span>
                        </div>
                    </div>

                    <div>
                        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Total Value</p>
                        <p className="text-sm font-bold text-slate-900">
                            ₹{(formData.totalBudget / 100000).toFixed(2)} Lakhs
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-emerald-200 p-6 shadow-sm mb-6 ring-1 ring-emerald-500/20">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800">Edit Project Intelligence</h3>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsEditing(false)}
                        className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"
                        disabled={loading}
                    >
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
                        disabled={loading}
                    >
                        {loading ? 'Saving...' : <><CheckIcon className="w-4 h-4" /> Save Changes</>}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Status */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Health Status</label>
                        <select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                            className="w-full rounded-lg border-slate-200 bg-white p-2.5 text-sm"
                        >
                            <option value="On Track">On Track</option>
                            <option value="Minor Delay">Minor Delay</option>
                            <option value="At Risk">At Risk</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Risk Level</label>
                        <select
                            value={formData.riskLevel}
                            onChange={(e) => setFormData({ ...formData, riskLevel: e.target.value as any })}
                            className="w-full rounded-lg border-slate-200 bg-white p-2.5 text-sm"
                        >
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                        </select>
                    </div>
                </div>

                {/* Metrics */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Completion Percentage ({formData.completionPercentage}%)
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            step="1"
                            value={formData.completionPercentage}
                            onChange={(e) => setFormData({ ...formData, completionPercentage: Number(e.target.value) })}
                            className="w-full accent-emerald-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Total Project Value (₹)</label>
                        <input
                            type="number"
                            value={formData.totalBudget}
                            onChange={(e) => setFormData({ ...formData, totalBudget: Number(e.target.value) })}
                            className="w-full rounded-lg border-slate-200 bg-white p-2.5 text-sm"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectHealthEditor;
