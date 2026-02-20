import React, { useState, useRef, useEffect } from 'react';
import { doc, updateDoc, Timestamp, arrayUnion } from 'firebase/firestore';
import { db } from '../../../../firebase';
import { Case } from '../../../../types';
import { uploadCaseDocuments, formatFileSize } from '../../../../services/storageService';
import {
    DocumentTextIcon,
    PlusIcon,
    TrashIcon,
    ArrowUpTrayIcon,
    EyeIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import { formatDate } from '../../../../constants';

interface DocumentsEditorProps {
    caseData: Case;
}

const CATEGORIES = ['Contract', 'Invoice', 'Report', 'Drawing', 'BOQ', 'Quotation', 'Other'] as const;

const DocumentsEditor: React.FC<DocumentsEditorProps> = ({ caseData }) => {
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const documents = (caseData as any).projectDocuments || [];

    const handleUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        setUploading(true);
        setUploadProgress(0);
        try {
            const fileArr = Array.from(files);
            const results = await uploadCaseDocuments(caseData.id, fileArr);

            const newDocs = results.map((r, i) => ({
                id: Date.now().toString() + i,
                name: fileArr[i].name,
                url: r.url,
                storagePath: r.path,
                size: formatFileSize(r.fileSize),
                category: 'Other',
                uploadedAt: new Date().toISOString(),
                uploadedBy: 'staff',
            }));

            const caseRef = doc(db, 'cases', caseData.id);
            for (const d of newDocs) {
                await updateDoc(caseRef, {
                    projectDocuments: arrayUnion(d),
                    updatedAt: Timestamp.now(),
                });
            }
        } catch (error) {
            console.error("Error uploading documents:", error);
            alert("Failed to upload documents.");
        } finally {
            setUploading(false);
            setUploadProgress(0);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDelete = async (docToRemove: any) => {
        if (!confirm(`Delete "${docToRemove.name}"?`)) return;
        try {
            const updated = documents.filter((d: any) => d.id !== docToRemove.id);
            const caseRef = doc(db, 'cases', caseData.id);
            await updateDoc(caseRef, {
                projectDocuments: updated,
                updatedAt: Timestamp.now(),
            });
        } catch (error) {
            console.error("Error deleting document:", error);
            alert("Failed to delete document.");
        }
    };

    const handleCategoryChange = async (docId: string, newCategory: string) => {
        try {
            const updated = documents.map((d: any) =>
                d.id === docId ? { ...d, category: newCategory } : d
            );
            const caseRef = doc(db, 'cases', caseData.id);
            await updateDoc(caseRef, {
                projectDocuments: updated,
                updatedAt: Timestamp.now(),
            });
        } catch (error) {
            console.error("Error updating category:", error);
        }
    };

    const categoryColor = (cat: string) => {
        switch (cat) {
            case 'Contract': return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'Invoice': return 'bg-green-50 text-green-700 border-green-200';
            case 'Drawing': return 'bg-pink-50 text-pink-700 border-pink-200';
            case 'BOQ': return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'Quotation': return 'bg-violet-50 text-violet-700 border-violet-200';
            case 'Report': return 'bg-cyan-50 text-cyan-700 border-cyan-200';
            default: return 'bg-slate-50 text-slate-700 border-slate-200';
        }
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex justify-between items-start mb-5">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-cyan-50 text-cyan-600">
                        <DocumentTextIcon className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Project Documents</h3>
                        <p className="text-xs text-slate-500">{documents.length} document{documents.length !== 1 ? 's' : ''}</p>
                    </div>
                </div>
                <div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.dwg"
                        className="hidden"
                        onChange={(e) => handleUpload(e.target.files)}
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    >
                        {uploading ? (
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                Uploading...
                            </span>
                        ) : (
                            <>
                                <ArrowUpTrayIcon className="w-4 h-4" /> Upload Files
                            </>
                        )}
                    </button>
                </div>
            </div>

            {documents.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl">
                    <DocumentTextIcon className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm text-slate-500 font-medium">No documents uploaded yet</p>
                    <p className="text-xs text-slate-400 mt-1">Upload contracts, drawings, BOQs, and more</p>
                </div>
            ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    {documents.map((d: any) => (
                        <div key={d.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50/50 border border-slate-100 hover:border-slate-200 transition-colors group">
                            <div className={`p-2 rounded-lg border ${categoryColor(d.category)}`}>
                                <DocumentTextIcon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-800 truncate">{d.name}</p>
                                <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                                    <span>{d.size}</span>
                                    <span>•</span>
                                    <span>{d.uploadedAt ? formatDate(new Date(d.uploadedAt)) : '—'}</span>
                                </div>
                            </div>
                            <select
                                value={d.category}
                                onChange={(e) => handleCategoryChange(d.id, e.target.value)}
                                className="text-xs border border-slate-200 rounded-md px-2 py-1 bg-white focus:ring-1 focus:ring-emerald-500"
                            >
                                {CATEGORIES.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                            <a href={d.url} target="_blank" rel="noopener noreferrer"
                                className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                                <EyeIcon className="w-4 h-4" />
                            </a>
                            <button onClick={() => handleDelete(d)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DocumentsEditor;
