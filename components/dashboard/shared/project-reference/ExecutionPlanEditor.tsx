import React, { useState } from 'react';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../../../firebase';
import { Case } from '../../../../types';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { formatDate } from '../../../../constants';

interface ExecutionPlanEditorProps {
    caseData: Case;
}

const ExecutionPlanEditor: React.FC<ExecutionPlanEditorProps> = ({ caseData }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);

    // Initialize with existing phases or empty array
    const [phases, setPhases] = useState<any[]>(
        caseData.executionPlan?.phases?.map(p => ({
            ...p,
            startDate: p.startDate instanceof Timestamp ? p.startDate.toDate().toISOString().slice(0, 10) : p.startDate ? new Date(p.startDate).toISOString().slice(0, 10) : '',
            endDate: p.endDate instanceof Timestamp ? p.endDate.toDate().toISOString().slice(0, 10) : p.endDate ? new Date(p.endDate).toISOString().slice(0, 10) : '',
        })) || []
    );

    const handleAddPhase = () => {
        setPhases([
            ...phases,
            {
                id: Date.now().toString(),
                name: 'New Phase',
                startDate: '',
                endDate: '',
                completionPercent: 0,
                status: 'pending'
            }
        ]);
    };

    const handleRemovePhase = (index: number) => {
        const newPhases = [...phases];
        newPhases.splice(index, 1);
        setPhases(newPhases);
    };

    const handleChange = (index: number, field: string, value: any) => {
        const newPhases = [...phases];
        newPhases[index] = { ...newPhases[index], [field]: value };
        setPhases(newPhases);
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const caseRef = doc(db, 'cases', caseData.id);

            // Convert dates back to Timestamps/Dates
            const cleanedPhases = phases.map(p => ({
                ...p,
                startDate: p.startDate ? Timestamp.fromDate(new Date(p.startDate)) : null,
                endDate: p.endDate ? Timestamp.fromDate(new Date(p.endDate)) : null,
            }));

            await updateDoc(caseRef, {
                'executionPlan.phases': cleanedPhases,
                'executionPlan.startDate': cleanedPhases.length > 0 ? cleanedPhases[0].startDate : null,
                'executionPlan.endDate': cleanedPhases.length > 0 ? cleanedPhases[cleanedPhases.length - 1].endDate : null,
                'executionPlan.updatedAt': Timestamp.now()
            });
            setIsEditing(false);
        } catch (error) {
            console.error("Error updating execution plan:", error);
            alert("Failed to update execution plan.");
        } finally {
            setLoading(false);
        }
    };

    if (!isEditing) {
        return (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm mb-6">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-bold text-slate-800">Execution Plan</h3>
                    <button
                        onClick={() => setIsEditing(true)}
                        className="text-sm font-medium text-emerald-600 hover:underline"
                    >
                        Edit Plan
                    </button>
                </div>

                {(!caseData.executionPlan?.phases || caseData.executionPlan.phases.length === 0) ? (
                    <p className="text-sm text-slate-500 italic">No execution phases defined.</p>
                ) : (
                    <div className="space-y-3">
                        {caseData.executionPlan.phases.map((p: any, idx) => (
                            <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <div>
                                    <p className="font-semibold text-sm text-slate-800">{p.name}</p>
                                    <p className="text-xs text-slate-500">
                                        {p.startDate instanceof Timestamp ? formatDate(p.startDate.toDate()) : '—'} - {p.endDate instanceof Timestamp ? formatDate(p.endDate.toDate()) : '—'}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className={`text-xs font-bold px-2 py-1 rounded ${p.status === 'completed' ? 'bg-green-100 text-green-700' :
                                        p.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                                        }`}>
                                        {p.status || 'Pending'}
                                    </span>
                                    <p className="text-xs font-bold mt-1 text-slate-600">{p.completionPercent || 0}%</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-emerald-200 p-6 shadow-sm mb-6 ring-1 ring-emerald-500/20">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800">Edit Execution Plan</h3>
                <div className="space-x-2">
                    <button onClick={() => setIsEditing(false)} className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded">Cancel</button>
                    <button onClick={handleSave} disabled={loading} className="px-3 py-1.5 text-sm bg-emerald-600 text-white rounded hover:bg-emerald-700">
                        {loading ? 'Saving...' : 'Save Plan'}
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                {phases.map((phase, idx) => (
                    <div key={idx} className="p-4 border rounded-lg bg-slate-50 relative">
                        <button
                            onClick={() => handleRemovePhase(idx)}
                            className="absolute top-2 right-2 text-red-400 hover:text-red-600"
                        >
                            <TrashIcon className="w-4 h-4" />
                        </button>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Phase Name</label>
                                <input
                                    type="text"
                                    value={phase.name}
                                    onChange={(e) => handleChange(idx, 'name', e.target.value)}
                                    className="w-full text-sm border-slate-300 rounded focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
                                <select
                                    value={phase.status}
                                    onChange={(e) => handleChange(idx, 'status', e.target.value)}
                                    className="w-full text-sm border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="pending">Pending</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="delayed">Delayed</option>
                                    <option value="completed">Completed</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Start Date</label>
                                <input
                                    type="date"
                                    value={phase.startDate}
                                    onChange={(e) => handleChange(idx, 'startDate', e.target.value)}
                                    className="w-full text-sm border-slate-300 rounded focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">End Date</label>
                                <input
                                    type="date"
                                    value={phase.endDate}
                                    onChange={(e) => handleChange(idx, 'endDate', e.target.value)}
                                    className="w-full text-sm border-slate-300 rounded focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>
                        </div>
                    </div>
                ))}

                <button
                    onClick={handleAddPhase}
                    className="w-full py-2 border-2 border-dashed border-slate-300 text-slate-500 rounded-lg hover:border-emerald-500 hover:text-emerald-500 flex items-center justify-center gap-2 text-sm font-medium"
                >
                    <PlusIcon className="w-4 h-4" /> Add Phase
                </button>
            </div>
        </div>
    );
};

export default ExecutionPlanEditor;
