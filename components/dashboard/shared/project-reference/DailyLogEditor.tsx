import React, { useState } from 'react';
import { doc, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import { db } from '../../../../firebase';
import { Case, CaseDailyUpdate } from '../../../../types';
import { PlusIcon } from '@heroicons/react/24/outline';
import { formatDate } from '../../../../constants';

interface DailyLogEditorProps {
    caseData: Case;
}

const DailyLogEditor: React.FC<DailyLogEditorProps> = ({ caseData }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [loading, setLoading] = useState(false);

    const [newLog, setNewLog] = useState({
        workDescription: '',
        manpowerCount: 0,
        completionPercent: 0,
        blocker: ''
    });

    const handleSave = async () => {
        if (!newLog.workDescription) return alert("Description required");
        setLoading(true);
        try {
            const caseRef = doc(db, 'cases', caseData.id);

            const logEntry: CaseDailyUpdate = {
                id: Date.now().toString(), // Simple ID
                caseId: caseData.id,
                date: new Date(), // Now
                workDescription: newLog.workDescription,
                manpowerCount: Number(newLog.manpowerCount),
                completionPercent: Number(newLog.completionPercent),
                weather: '', // Optional
                photos: [], // TODO: Image upload
                createdBy: 'staff', // TODO: Get actual user ID
                createdAt: new Date(),
                blocker: newLog.blocker
            };

            // Convert to Firestore compatible object if needed, or rely on client SDK
            // For arrayUnion with custom objects, usually fine if straight JSON-like.
            // But dates need to be Dates or Timestamps. 

            await updateDoc(caseRef, {
                dailyLogs: arrayUnion(logEntry)
            });

            setIsAdding(false);
            setNewLog({ workDescription: '', manpowerCount: 0, completionPercent: 0, blocker: '' });
        } catch (error) {
            console.error("Error adding log:", error);
            alert("Failed to add log.");
        } finally {
            setLoading(false);
        }
    };

    const logs = caseData.dailyLogs || [];

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm mb-6">
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-bold text-slate-800">Daily Logs</h3>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="flex items-center gap-1 text-sm font-medium text-emerald-600 hover:underline"
                >
                    <PlusIcon className="w-4 h-4" /> Add Log
                </button>
            </div>

            {isAdding && (
                <div className="mb-6 p-4 border rounded-lg bg-slate-50 space-y-3">
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Work Description</label>
                        <textarea
                            value={newLog.workDescription}
                            onChange={(e) => setNewLog({ ...newLog, workDescription: e.target.value })}
                            className="w-full text-sm border-slate-300 rounded p-2"
                            placeholder="What happened today?"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Manpower</label>
                            <input
                                type="number"
                                value={newLog.manpowerCount}
                                onChange={(e) => setNewLog({ ...newLog, manpowerCount: Number(e.target.value) })}
                                className="w-full text-sm border-slate-300 rounded p-2"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Completion %</label>
                            <input
                                type="number"
                                value={newLog.completionPercent}
                                onChange={(e) => setNewLog({ ...newLog, completionPercent: Number(e.target.value) })}
                                className="w-full text-sm border-slate-300 rounded p-2"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setIsAdding(false)} className="px-3 py-1.5 text-sm">Cancel</button>
                        <button onClick={handleSave} disabled={loading} className="px-3 py-1.5 bg-emerald-600 text-white rounded text-sm">
                            {loading ? 'Saving...' : 'Post Update'}
                        </button>
                    </div>
                </div>
            )}

            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {logs.length === 0 ? (
                    <p className="text-sm text-slate-500 italic">No daily logs yet.</p>
                ) : (
                    logs.sort((a, b) => (b.date > a.date ? 1 : -1)).map((log, idx) => (
                        <div key={idx} className="flex gap-4 pb-4 border-b border-slate-100 last:border-0">
                            <div className="w-20 text-xs text-slate-500 pt-1">
                                {log.date instanceof Timestamp ? formatDate(log.date.toDate()) : formatDate(new Date(log.date))}
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-slate-800 whitespace-pre-wrap">{log.workDescription}</p>
                                <div className="flex gap-3 mt-1 text-xs text-slate-500">
                                    <span>👷 {log.manpowerCount} Workers</span>
                                    <span>📈 {log.completionPercent}% Complete</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default DailyLogEditor;
