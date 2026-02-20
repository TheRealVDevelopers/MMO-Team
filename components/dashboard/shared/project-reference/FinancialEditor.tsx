import React, { useState } from 'react';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../../../firebase';
import { Case } from '../../../../types';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { formatCurrencyINR } from '../../../../constants';

interface FinancialEditorProps {
    caseData: Case;
}

const FinancialEditor: React.FC<FinancialEditorProps> = ({ caseData }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);

    const [installments, setInstallments] = useState<any[]>(
        caseData.financial?.installmentSchedule?.map(i => ({
            ...i,
            dueDate: i.dueDate instanceof Timestamp ? i.dueDate.toDate().toISOString().slice(0, 10) : i.dueDate ? new Date(i.dueDate).toISOString().slice(0, 10) : '',
        })) || []
    );

    const handleAdd = () => {
        setInstallments([
            ...installments,
            {
                id: Date.now().toString(),
                milestoneName: 'New Installment',
                percentage: 0,
                amount: 0,
                status: 'Pending',
                dueDate: ''
            }
        ]);
    };

    const handleRemove = (index: number) => {
        const arr = [...installments];
        arr.splice(index, 1);
        setInstallments(arr);
    };

    const handleChange = (index: number, field: string, value: any) => {
        const arr = [...installments];
        arr[index] = { ...arr[index], [field]: value };
        setInstallments(arr);
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const caseRef = doc(db, 'cases', caseData.id);

            const cleaned = installments.map(i => ({
                ...i,
                dueDate: i.dueDate ? Timestamp.fromDate(new Date(i.dueDate)) : null,
                amount: Number(i.amount),
                percentage: Number(i.percentage)
            }));

            await updateDoc(caseRef, {
                'financial.installmentSchedule': cleaned,
                'financial.totalPending': cleaned.reduce((acc, curr) => acc + (curr.status !== 'Paid' ? curr.amount : 0), 0)
            });
            setIsEditing(false);
        } catch (error) {
            console.error("Error updating financials:", error);
            alert("Failed to update.");
        } finally {
            setLoading(false);
        }
    };

    if (!isEditing) {
        return (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm mb-6">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-bold text-slate-800">Payment Schedule</h3>
                    <button
                        onClick={() => setIsEditing(true)}
                        className="text-sm font-medium text-emerald-600 hover:underline"
                    >
                        Edit Schedule
                    </button>
                </div>

                {(!caseData.financial?.installmentSchedule || caseData.financial.installmentSchedule.length === 0) ? (
                    <p className="text-sm text-slate-500 italic">No payment schedule defined.</p>
                ) : (
                    <div className="space-y-0 divide-y divide-slate-100">
                        {caseData.financial.installmentSchedule.map((inst, idx) => (
                            <div key={idx} className="py-3 flex justify-between items-center text-sm">
                                <div>
                                    <p className="font-semibold text-slate-800">{inst.milestoneName} ({inst.percentage}%)</p>
                                    <p className="text-xs text-slate-500">Due: {inst.dueDate instanceof Timestamp ? inst.dueDate.toDate().toLocaleDateString() : '—'}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-mono font-medium text-slate-700">{formatCurrencyINR(inst.amount)}</p>
                                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${inst.status === 'Paid' ? 'bg-green-100 text-green-700' :
                                        inst.status === 'Overdue' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                                        }`}>
                                        {inst.status}
                                    </span>
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
                <h3 className="text-lg font-bold text-slate-800">Edit Payment Schedule</h3>
                <div className="space-x-2">
                    <button onClick={() => setIsEditing(false)} className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded">Cancel</button>
                    <button onClick={handleSave} disabled={loading} className="px-3 py-1.5 text-sm bg-emerald-600 text-white rounded hover:bg-emerald-700">
                        {loading ? 'Saving...' : 'Save Schedule'}
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                {installments.map((inst, idx) => (
                    <div key={idx} className="p-3 border rounded-lg bg-slate-50 relative">
                        <button
                            onClick={() => handleRemove(idx)}
                            className="absolute top-2 right-2 text-red-400 hover:text-red-600"
                        >
                            <TrashIcon className="w-4 h-4" />
                        </button>
                        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 items-end">
                            <div className="col-span-2">
                                <label className="block text-xs font-medium text-slate-500 mb-1">Milestone Name</label>
                                <input
                                    type="text"
                                    value={inst.milestoneName}
                                    onChange={(e) => handleChange(idx, 'milestoneName', e.target.value)}
                                    className="w-full text-sm border-slate-300 rounded p-2"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Percentage %</label>
                                <input
                                    type="number"
                                    value={inst.percentage}
                                    onChange={(e) => handleChange(idx, 'percentage', e.target.value)}
                                    className="w-full text-sm border-slate-300 rounded p-2"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Amount</label>
                                <input
                                    type="number"
                                    value={inst.amount}
                                    onChange={(e) => handleChange(idx, 'amount', e.target.value)}
                                    className="w-full text-sm border-slate-300 rounded p-2"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
                                <select
                                    value={inst.status}
                                    onChange={(e) => handleChange(idx, 'status', e.target.value)}
                                    className="w-full text-sm border-slate-300 rounded p-2 bg-white"
                                >
                                    <option value="Pending">Pending</option>
                                    <option value="Paid">Paid</option>
                                    <option value="Overdue">Overdue</option>
                                </select>
                            </div>
                        </div>
                    </div>
                ))}

                <button
                    onClick={handleAdd}
                    className="w-full py-2 border-2 border-dashed border-slate-300 text-slate-500 rounded-lg hover:border-emerald-500 hover:text-emerald-500 flex items-center justify-center gap-2 text-sm font-medium"
                >
                    <PlusIcon className="w-4 h-4" /> Add Installment
                </button>
            </div>
        </div>
    );
};

export default FinancialEditor;
