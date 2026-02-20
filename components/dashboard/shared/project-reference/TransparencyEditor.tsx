import React, { useState, useEffect } from 'react';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../../../firebase';
import { Case } from '../../../../types';
import { PencilIcon, CheckIcon, XMarkIcon, ShieldCheckIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { formatDate } from '../../../../constants';

interface TransparencyEditorProps {
    caseData: Case;
}

const TransparencyEditor: React.FC<TransparencyEditorProps> = ({ caseData }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);

    const execPlan = (caseData as any).executionPlan || {};
    const health = caseData.health || {};

    const [formData, setFormData] = useState({
        startDate: execPlan.startDate instanceof Timestamp ? execPlan.startDate.toDate().toISOString().split('T')[0] : execPlan.startDate ? new Date(execPlan.startDate).toISOString().split('T')[0] : '',
        endDate: execPlan.endDate instanceof Timestamp ? execPlan.endDate.toDate().toISOString().split('T')[0] : execPlan.endDate ? new Date(execPlan.endDate).toISOString().split('T')[0] : '',
        daysRemaining: (health as any).daysRemaining ?? 0,
        healthReason: (health as any).reason || '',
        nextActionActor: (caseData as any).nextAction?.actor || 'company',
        nextActionDescription: (caseData as any).nextAction?.action || '',
        delays: (caseData as any).delays || [] as Array<{ stageName: string; days: number; reason: string }>,
    });

    useEffect(() => {
        const ep = (caseData as any).executionPlan || {};
        const h = caseData.health || {};
        setFormData({
            startDate: ep.startDate instanceof Timestamp ? ep.startDate.toDate().toISOString().split('T')[0] : ep.startDate ? new Date(ep.startDate).toISOString().split('T')[0] : '',
            endDate: ep.endDate instanceof Timestamp ? ep.endDate.toDate().toISOString().split('T')[0] : ep.endDate ? new Date(ep.endDate).toISOString().split('T')[0] : '',
            daysRemaining: (h as any).daysRemaining ?? 0,
            healthReason: (h as any).reason || '',
            nextActionActor: (caseData as any).nextAction?.actor || 'company',
            nextActionDescription: (caseData as any).nextAction?.action || '',
            delays: (caseData as any).delays || [],
        });
    }, [caseData]);

    const handleAddDelay = () => {
        setFormData({
            ...formData,
            delays: [...formData.delays, { stageName: '', days: 0, reason: '' }],
        });
    };

    const handleRemoveDelay = (idx: number) => {
        setFormData({
            ...formData,
            delays: formData.delays.filter((_: any, i: number) => i !== idx),
        });
    };

    const handleDelayChange = (idx: number, field: string, value: any) => {
        const updated = [...formData.delays];
        (updated[idx] as any)[field] = value;
        setFormData({ ...formData, delays: updated });
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const caseRef = doc(db, 'cases', caseData.id);
            await updateDoc(caseRef, {
                'executionPlan.startDate': formData.startDate ? Timestamp.fromDate(new Date(formData.startDate)) : null,
                'executionPlan.endDate': formData.endDate ? Timestamp.fromDate(new Date(formData.endDate)) : null,
                'health.daysRemaining': Number(formData.daysRemaining),
                'health.reason': formData.healthReason,
                nextAction: {
                    actor: formData.nextActionActor,
                    action: formData.nextActionDescription,
                },
                delays: formData.delays,
                updatedAt: Timestamp.now(),
            });
            setIsEditing(false);
        } catch (error) {
            console.error("Error updating transparency:", error);
            alert("Failed to update transparency data.");
        } finally {
            setLoading(false);
        }
    };

    const fieldLabel = "block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5";
    const fieldValue = "text-sm font-semibold text-slate-900";
    const inputClass = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all";

    if (!isEditing) {
        return (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <div className="flex justify-between items-start mb-5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                            <ShieldCheckIcon className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">Timeline & Transparency</h3>
                    </div>
                    <button onClick={() => setIsEditing(true)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
                        <PencilIcon className="w-4 h-4" />
                    </button>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-5">
                    <div>
                        <p className={fieldLabel}>Start Date</p>
                        <p className={fieldValue}>{formData.startDate ? formatDate(new Date(formData.startDate)) : '—'}</p>
                    </div>
                    <div>
                        <p className={fieldLabel}>End Date</p>
                        <p className={fieldValue}>{formData.endDate ? formatDate(new Date(formData.endDate)) : '—'}</p>
                    </div>
                    <div>
                        <p className={fieldLabel}>Days Remaining</p>
                        <p className={fieldValue}>{formData.daysRemaining}</p>
                    </div>
                    <div>
                        <p className={fieldLabel}>Health Note</p>
                        <p className="text-sm text-slate-600">{formData.healthReason || '—'}</p>
                    </div>
                </div>

                {formData.nextActionDescription && (
                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg mb-4">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600 mb-1">Next Action ({formData.nextActionActor})</p>
                        <p className="text-sm font-medium text-blue-800">{formData.nextActionDescription}</p>
                    </div>
                )}

                {formData.delays.length > 0 && (
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Known Delays</p>
                        <div className="space-y-2">
                            {formData.delays.map((d: any, i: number) => (
                                <div key={i} className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm">
                                    <span className="font-bold text-red-800">{d.stageName}</span> — {d.days} days: {d.reason}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-emerald-200 p-6 shadow-sm ring-1 ring-emerald-500/20">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                        <ShieldCheckIcon className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">Edit Timeline & Transparency</h3>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500" disabled={loading}>
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                    <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors" disabled={loading}>
                        {loading ? 'Saving...' : <><CheckIcon className="w-4 h-4" /> Save</>}
                    </button>
                </div>
            </div>

            <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className={fieldLabel}>Project Start Date</label>
                        <input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className={inputClass} />
                    </div>
                    <div>
                        <label className={fieldLabel}>Expected End Date</label>
                        <input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} className={inputClass} />
                    </div>
                    <div>
                        <label className={fieldLabel}>Days Remaining</label>
                        <input type="number" value={formData.daysRemaining} onChange={(e) => setFormData({ ...formData, daysRemaining: Number(e.target.value) })} className={inputClass} />
                    </div>
                </div>

                <div>
                    <label className={fieldLabel}>Health Note / Reason</label>
                    <textarea value={formData.healthReason} onChange={(e) => setFormData({ ...formData, healthReason: e.target.value })} className={`${inputClass} resize-none`} rows={2} placeholder="E.g., Material delivery pending from vendor..." />
                </div>

                <div className="border-t border-slate-100 pt-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">Next Action</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className={fieldLabel}>Actor</label>
                            <select value={formData.nextActionActor} onChange={(e) => setFormData({ ...formData, nextActionActor: e.target.value })} className={inputClass}>
                                <option value="company">Company</option>
                                <option value="client">Client</option>
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className={fieldLabel}>Action Description</label>
                            <input type="text" value={formData.nextActionDescription} onChange={(e) => setFormData({ ...formData, nextActionDescription: e.target.value })} className={inputClass} placeholder="E.g., Submit revised quotation" />
                        </div>
                    </div>
                </div>

                <div className="border-t border-slate-100 pt-4">
                    <div className="flex justify-between items-center mb-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Delays</p>
                        <button onClick={handleAddDelay} className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:underline">
                            <PlusIcon className="w-3.5 h-3.5" /> Add Delay
                        </button>
                    </div>
                    <div className="space-y-3">
                        {formData.delays.map((d: any, idx: number) => (
                            <div key={idx} className="grid grid-cols-12 gap-3 items-start p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <div className="col-span-4">
                                    <input type="text" value={d.stageName} onChange={(e) => handleDelayChange(idx, 'stageName', e.target.value)} className={inputClass} placeholder="Stage name" />
                                </div>
                                <div className="col-span-2">
                                    <input type="number" value={d.days} onChange={(e) => handleDelayChange(idx, 'days', Number(e.target.value))} className={inputClass} placeholder="Days" />
                                </div>
                                <div className="col-span-5">
                                    <input type="text" value={d.reason} onChange={(e) => handleDelayChange(idx, 'reason', e.target.value)} className={inputClass} placeholder="Reason for delay" />
                                </div>
                                <div className="col-span-1 flex items-center justify-center">
                                    <button onClick={() => handleRemoveDelay(idx)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TransparencyEditor;
