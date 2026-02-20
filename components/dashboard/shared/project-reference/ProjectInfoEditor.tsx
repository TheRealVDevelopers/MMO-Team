import React, { useState, useEffect } from 'react';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../../../firebase';
import { Case } from '../../../../types';
import { PencilIcon, CheckIcon, XMarkIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';

interface ProjectInfoEditorProps {
    caseData: Case;
}

const ProjectInfoEditor: React.FC<ProjectInfoEditorProps> = ({ caseData }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        projectName: caseData.projectName || caseData.title || '',
        clientName: caseData.clientName || '',
        clientEmail: caseData.clientEmail || '',
        clientPhone: caseData.clientPhone || '',
        siteAddress: caseData.siteAddress || '',
        projectType: (caseData as any).projectType || 'Commercial',
        area: (caseData as any).area || '',
        consultant: caseData.assignedSales || '',
        consultantName: (caseData as any).consultantName || '',
        consultantPhone: (caseData as any).consultantPhone || '',
        consultantEmail: (caseData as any).consultantEmail || '',
    });

    useEffect(() => {
        setFormData({
            projectName: caseData.projectName || caseData.title || '',
            clientName: caseData.clientName || '',
            clientEmail: caseData.clientEmail || '',
            clientPhone: caseData.clientPhone || '',
            siteAddress: caseData.siteAddress || '',
            projectType: (caseData as any).projectType || 'Commercial',
            area: (caseData as any).area || '',
            consultant: caseData.assignedSales || '',
            consultantName: (caseData as any).consultantName || '',
            consultantPhone: (caseData as any).consultantPhone || '',
            consultantEmail: (caseData as any).consultantEmail || '',
        });
    }, [caseData]);

    const handleSave = async () => {
        setLoading(true);
        try {
            const caseRef = doc(db, 'cases', caseData.id);
            await updateDoc(caseRef, {
                projectName: formData.projectName,
                clientName: formData.clientName,
                clientEmail: formData.clientEmail,
                clientPhone: formData.clientPhone,
                siteAddress: formData.siteAddress,
                projectType: formData.projectType,
                area: formData.area,
                consultantName: formData.consultantName,
                consultantPhone: formData.consultantPhone,
                consultantEmail: formData.consultantEmail,
                updatedAt: Timestamp.now(),
            });
            setIsEditing(false);
        } catch (error) {
            console.error("Error updating project info:", error);
            alert("Failed to update project info.");
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
                        <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                            <BuildingOfficeIcon className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">Project Information</h3>
                    </div>
                    <button
                        onClick={() => setIsEditing(true)}
                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
                    >
                        <PencilIcon className="w-4 h-4" />
                    </button>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
                    <div>
                        <p className={fieldLabel}>Project Name</p>
                        <p className={fieldValue}>{formData.projectName || '—'}</p>
                    </div>
                    <div>
                        <p className={fieldLabel}>Project Type</p>
                        <p className={fieldValue}>{formData.projectType || '—'}</p>
                    </div>
                    <div>
                        <p className={fieldLabel}>Area</p>
                        <p className={fieldValue}>{formData.area || '—'}</p>
                    </div>
                    <div className="col-span-2 lg:col-span-3">
                        <p className={fieldLabel}>Site Address</p>
                        <p className={fieldValue}>{formData.siteAddress || '—'}</p>
                    </div>
                </div>

                <div className="border-t border-slate-100 mt-5 pt-5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">Client Details</p>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
                        <div>
                            <p className={fieldLabel}>Client Name</p>
                            <p className={fieldValue}>{formData.clientName || '—'}</p>
                        </div>
                        <div>
                            <p className={fieldLabel}>Client Email</p>
                            <p className={fieldValue}>{formData.clientEmail || '—'}</p>
                        </div>
                        <div>
                            <p className={fieldLabel}>Client Phone</p>
                            <p className={fieldValue}>{formData.clientPhone || '—'}</p>
                        </div>
                    </div>
                </div>

                <div className="border-t border-slate-100 mt-5 pt-5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">Relationship Manager</p>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
                        <div>
                            <p className={fieldLabel}>Name</p>
                            <p className={fieldValue}>{formData.consultantName || '—'}</p>
                        </div>
                        <div>
                            <p className={fieldLabel}>Phone</p>
                            <p className={fieldValue}>{formData.consultantPhone || '—'}</p>
                        </div>
                        <div>
                            <p className={fieldLabel}>Email</p>
                            <p className={fieldValue}>{formData.consultantEmail || '—'}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-emerald-200 p-6 shadow-sm ring-1 ring-emerald-500/20">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                        <BuildingOfficeIcon className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">Edit Project Info</h3>
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
                        <label className={fieldLabel}>Project Name</label>
                        <input type="text" value={formData.projectName} onChange={(e) => setFormData({ ...formData, projectName: e.target.value })} className={inputClass} />
                    </div>
                    <div>
                        <label className={fieldLabel}>Project Type</label>
                        <select value={formData.projectType} onChange={(e) => setFormData({ ...formData, projectType: e.target.value })} className={inputClass}>
                            <option value="Commercial">Commercial</option>
                            <option value="Residential">Residential</option>
                            <option value="Retail">Retail</option>
                            <option value="Hospitality">Hospitality</option>
                            <option value="Industrial">Industrial</option>
                        </select>
                    </div>
                    <div>
                        <label className={fieldLabel}>Area (sqft)</label>
                        <input type="text" value={formData.area} onChange={(e) => setFormData({ ...formData, area: e.target.value })} className={inputClass} placeholder="e.g. 1200 sqft" />
                    </div>
                </div>

                <div>
                    <label className={fieldLabel}>Site Address</label>
                    <textarea value={formData.siteAddress} onChange={(e) => setFormData({ ...formData, siteAddress: e.target.value })} className={`${inputClass} resize-none`} rows={2} />
                </div>

                <div className="border-t border-slate-100 pt-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">Client Details</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className={fieldLabel}>Client Name</label>
                            <input type="text" value={formData.clientName} onChange={(e) => setFormData({ ...formData, clientName: e.target.value })} className={inputClass} />
                        </div>
                        <div>
                            <label className={fieldLabel}>Client Email</label>
                            <input type="email" value={formData.clientEmail} onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })} className={inputClass} />
                        </div>
                        <div>
                            <label className={fieldLabel}>Client Phone</label>
                            <input type="tel" value={formData.clientPhone} onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })} className={inputClass} />
                        </div>
                    </div>
                </div>

                <div className="border-t border-slate-100 pt-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">Relationship Manager</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className={fieldLabel}>Name</label>
                            <input type="text" value={formData.consultantName} onChange={(e) => setFormData({ ...formData, consultantName: e.target.value })} className={inputClass} />
                        </div>
                        <div>
                            <label className={fieldLabel}>Phone</label>
                            <input type="tel" value={formData.consultantPhone} onChange={(e) => setFormData({ ...formData, consultantPhone: e.target.value })} className={inputClass} />
                        </div>
                        <div>
                            <label className={fieldLabel}>Email</label>
                            <input type="email" value={formData.consultantEmail} onChange={(e) => setFormData({ ...formData, consultantEmail: e.target.value })} className={inputClass} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectInfoEditor;
