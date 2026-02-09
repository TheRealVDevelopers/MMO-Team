import React, { useState, useMemo } from 'react';
import { useSalarySystem, SalaryData } from '../../../hooks/useSalarySystem';
import { formatCurrencyINR, DEFAULT_ORGANIZATION_ID } from '../../../constants';
import { useExpensesForOrg } from '../../../hooks/useExpensesForOrg';
import { useValidationRequests } from '../../../hooks/useValidationRequests';
import { useSalaryLedgerEntries, updateSalaryLedgerEntry, SalaryLedgerEntry } from '../../../hooks/useSalaryLedger';
import { useAuth } from '../../../context/AuthContext';
import {
    UserCircleIcon,
    ClockIcon,
    MapPinIcon,
    BanknotesIcon,
    ChevronRightIcon,
    XMarkIcon,
    CurrencyRupeeIcon,
    PencilSquareIcon
} from '@heroicons/react/24/outline';

const SalaryPage: React.FC = () => {
    const { currentUser } = useAuth();
    const orgId = currentUser?.organizationId || DEFAULT_ORGANIZATION_ID;
    const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const { salaryData, loading, error, generatePayroll } = useSalarySystem(selectedMonth);
    const { expenses: orgExpenses } = useExpensesForOrg(orgId);
    const { requests: approvedValidations } = useValidationRequests({ organizationId: orgId, status: 'APPROVED' });
    const [processing, setProcessing] = useState<string | null>(null);
    const [selectedStaff, setSelectedStaff] = useState<SalaryData | null>(null);
    const [ratePerKm, setRatePerKm] = useState<number>(10); // Editable rate per km
    const { entries: ledgerEntries, loading: ledgerLoading } = useSalaryLedgerEntries(orgId, selectedMonth);
    const [editingEntry, setEditingEntry] = useState<SalaryLedgerEntry | null>(null);
    const [editForm, setEditForm] = useState<Partial<SalaryLedgerEntry>>({});
    const [savingLedger, setSavingLedger] = useState(false);

    // Get expenses by user for the selected month
    const expensesByUser = useMemo(() => {
        const monthStart = `${selectedMonth}-01`;
        const monthEnd = `${selectedMonth}-31`;
        const result: Record<string, { total: number; items: any[] }> = {};
        
        (orgExpenses || []).forEach(exp => {
            const expDate = exp.date?.toDate ? exp.date.toDate().toISOString().slice(0, 10) : 
                           (typeof exp.date === 'string' ? exp.date : '');
            if (expDate >= monthStart && expDate <= monthEnd && exp.createdBy) {
                if (!result[exp.createdBy]) {
                    result[exp.createdBy] = { total: 0, items: [] };
                }
                result[exp.createdBy].total += exp.amount || 0;
                result[exp.createdBy].items.push(exp);
            }
        });
        return result;
    }, [orgExpenses, selectedMonth]);

    // Approved validation requests (expense/travel/leave) per user for selected month — add to salary
    const validationReimbursementByUser = useMemo(() => {
        const monthStart = `${selectedMonth}-01`;
        const monthEnd = `${selectedMonth}-31`;
        const byUser: Record<string, number> = {};
        (approvedValidations || []).forEach((r) => {
            const dateStr = r.createdAt ? r.createdAt.toISOString().slice(0, 10) : '';
            if (dateStr >= monthStart && dateStr <= monthEnd && r.userId) {
                const amt = r.amount ?? 0;
                byUser[r.userId] = (byUser[r.userId] ?? 0) + amt;
            }
        });
        return byUser;
    }, [approvedValidations, selectedMonth]);

    const handleGenerate = async (data: SalaryData & { expenseClaimed?: number; travelReimbursement?: number; validationReimbursement?: number; totalPayable?: number }) => {
        const expenseClaimed = data.expenseClaimed ?? expensesByUser[data.user.id]?.total ?? 0;
        const validationReimbursement = data.validationReimbursement ?? validationReimbursementByUser[data.user.id] ?? 0;
        const travelReimbursement = data.travelReimbursement ?? data.distanceKm * ratePerKm;
        const totalPayable = data.totalPayable ?? (data.estimatedSalary + expenseClaimed + validationReimbursement + travelReimbursement);

        const confirm = window.confirm(
            `Generate Payroll for ${data.user.name}?\n\n` +
            `Base Salary: ${formatCurrencyINR(data.estimatedSalary)}\n` +
            `Travel Reimbursement: ${formatCurrencyINR(travelReimbursement)}\n` +
            `Expense Reimbursement: ${formatCurrencyINR(expenseClaimed)}\n` +
            (validationReimbursement > 0 ? `Validation (approved): ${formatCurrencyINR(validationReimbursement)}\n` : '') +
            `─────────────────────────\n` +
            `Total Payable: ${formatCurrencyINR(totalPayable)}`
        );

        if (!confirm) return;

        setProcessing(data.user.id);
        await generatePayroll(data, {
            expenseReimbursement: expenseClaimed,
            travelReimbursement,
            totalPayable,
        });
        // Note: validation reimbursement is included in totalPayable; ledger stores expense + travel + base
        setProcessing(null);
        alert(`✅ Payroll generated for ${data.user.name}`);
    };

    const handleSaveLedgerEdit = async () => {
        if (!editingEntry || !orgId) return;
        setSavingLedger(true);
        try {
            const total = (editForm.baseSalary ?? editingEntry.baseSalary)
                + (editForm.distanceReimbursement ?? editingEntry.distanceReimbursement)
                + (editForm.expenseReimbursement ?? editingEntry.expenseReimbursement)
                + (editForm.incentives ?? editingEntry.incentives)
                - (editForm.deductions ?? editingEntry.deductions);
            await updateSalaryLedgerEntry(orgId, editingEntry.id, {
                baseSalary: editForm.baseSalary ?? editingEntry.baseSalary,
                distanceReimbursement: editForm.distanceReimbursement ?? editingEntry.distanceReimbursement,
                expenseReimbursement: editForm.expenseReimbursement ?? editingEntry.expenseReimbursement,
                incentives: editForm.incentives ?? editingEntry.incentives,
                deductions: editForm.deductions ?? editingEntry.deductions,
                totalSalary: total,
                status: editForm.status ?? editingEntry.status,
            });
            setEditingEntry(null);
            setEditForm({});
            alert('Saved.');
        } catch (e) {
            console.error(e);
            alert('Failed to save');
        } finally {
            setSavingLedger(false);
        }
    };

    const openEdit = (entry: SalaryLedgerEntry) => {
        setEditingEntry(entry);
        setEditForm({
            baseSalary: entry.baseSalary,
            distanceReimbursement: entry.distanceReimbursement,
            expenseReimbursement: entry.expenseReimbursement,
            incentives: entry.incentives,
            deductions: entry.deductions,
            totalSalary: entry.totalSalary,
            status: entry.status,
        });
    };

    // Enhanced salary calculation: expenses + approved validation reimbursements + travel
    const enhancedSalaryData = useMemo(() => {
        return salaryData.map(data => {
            const expenseClaimed = expensesByUser[data.user.id]?.total || 0;
            const validationReimbursement = validationReimbursementByUser[data.user.id] ?? 0;
            const travelReimbursement = data.distanceKm * ratePerKm;
            const totalReimbursement = expenseClaimed + validationReimbursement + travelReimbursement;
            return {
                ...data,
                expenseClaimed,
                validationReimbursement,
                travelReimbursement,
                totalPayable: data.estimatedSalary + totalReimbursement
            };
        });
    }, [salaryData, expensesByUser, validationReimbursementByUser, ratePerKm]);

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Salary System</h1>
                    <p className="text-sm text-gray-500">Automated payroll based on time tracking, tasks, and expenses.</p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700">Rate/km:</label>
                        <input
                            type="number"
                            min="0"
                            value={ratePerKm}
                            onChange={(e) => setRatePerKm(parseFloat(e.target.value) || 0)}
                            className="w-20 border border-gray-300 rounded-lg px-2 py-1 text-sm"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700">Month:</label>
                        <input
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Generated payroll (editable by accountant) */}
            {ledgerEntries.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <h3 className="text-lg font-semibold text-gray-900 px-4 py-3 border-b border-gray-200">Generated payroll — editable</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">User / Month</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Base</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Travel</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Expense</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Deductions</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {ledgerEntries.map((entry) => (
                                    <tr key={entry.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{entry.userName || entry.userId} · {entry.month}</td>
                                        <td className="px-4 py-3 text-sm text-right text-gray-700">{formatCurrencyINR(entry.baseSalary)}</td>
                                        <td className="px-4 py-3 text-sm text-right text-gray-700">{formatCurrencyINR(entry.distanceReimbursement)}</td>
                                        <td className="px-4 py-3 text-sm text-right text-gray-700">{formatCurrencyINR(entry.expenseReimbursement)}</td>
                                        <td className="px-4 py-3 text-sm text-right text-gray-700">{formatCurrencyINR(entry.deductions)}</td>
                                        <td className="px-4 py-3 text-sm font-bold text-right text-gray-900">{formatCurrencyINR(entry.totalSalary)}</td>
                                        <td className="px-4 py-3 text-center">
                                            <button type="button" onClick={() => openEdit(entry)} className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 text-gray-700" title="Edit">
                                                <PencilSquareIcon className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-xs font-medium text-gray-500 uppercase">Total Staff</h3>
                    <p className="text-2xl font-bold text-gray-900">{enhancedSalaryData.length}</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-xs font-medium text-gray-500 uppercase">Total Active Hours</h3>
                    <p className="text-2xl font-bold text-blue-600">
                        {enhancedSalaryData.reduce((sum, d) => sum + d.activeHours, 0).toFixed(1)}h
                    </p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-xs font-medium text-gray-500 uppercase">Total Distance</h3>
                    <p className="text-2xl font-bold text-green-600">
                        {enhancedSalaryData.reduce((sum, d) => sum + d.distanceKm, 0).toFixed(1)} km
                    </p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-xs font-medium text-gray-500 uppercase">Total Payable</h3>
                    <p className="text-2xl font-bold text-primary">
                        {formatCurrencyINR(enhancedSalaryData.reduce((sum, d) => sum + d.totalPayable, 0))}
                    </p>
                </div>
            </div>

            {/* Staff Cards */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-gray-500">Calculating payroll data...</p>
                </div>
            ) : error ? (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>
            ) : enhancedSalaryData.length === 0 ? (
                <div className="bg-yellow-50 border border-yellow-200 p-8 rounded-xl text-center">
                    <UserCircleIcon className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-yellow-800">No Staff Members Found</h3>
                    <p className="text-yellow-700 mt-2">
                        No staff users exist in the <code className="bg-yellow-100 px-1 rounded">staffUsers</code> collection in Firestore.
                    </p>
                    <p className="text-yellow-600 text-sm mt-2">
                        Staff members need to be created via the Admin panel or through Firebase Auth to appear here for payroll processing.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {enhancedSalaryData.map((data) => (
                        <div
                            key={data.user.id}
                            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => setSelectedStaff(data)}
                        >
                            {/* Card Header */}
                            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-3 flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                                    {data.user.avatar ? (
                                        <img src={data.user.avatar} alt={data.user.name} className="w-12 h-12 rounded-full object-cover" />
                                    ) : (
                                        <UserCircleIcon className="w-8 h-8 text-white" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-white font-bold truncate">{data.user.name}</h3>
                                    <p className="text-white/70 text-xs">{data.user.role}</p>
                                </div>
                                <ChevronRightIcon className="w-5 h-5 text-white/50" />
                            </div>

                            {/* Card Body */}
                            <div className="p-4 space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="flex items-center gap-2">
                                        <ClockIcon className="w-4 h-4 text-blue-500" />
                                        <div>
                                            <p className="text-xs text-gray-500">Active</p>
                                            <p className="text-sm font-bold text-gray-900">{data.activeHours.toFixed(1)}h</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <ClockIcon className="w-4 h-4 text-amber-500" />
                                        <div>
                                            <p className="text-xs text-gray-500">Idle</p>
                                            <p className="text-sm font-bold text-amber-600">{data.idleHours.toFixed(1)}h</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MapPinIcon className="w-4 h-4 text-green-500" />
                                        <div>
                                            <p className="text-xs text-gray-500">Distance</p>
                                            <p className="text-sm font-bold text-green-600">{data.distanceKm.toFixed(1)} km</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CurrencyRupeeIcon className="w-4 h-4 text-purple-500" />
                                        <div>
                                            <p className="text-xs text-gray-500">Expenses</p>
                                            <p className="text-sm font-bold text-purple-600">{formatCurrencyINR(data.expenseClaimed)}</p>
                                        </div>
                                    </div>
                                    {data.validationReimbursement > 0 && (
                                        <div className="flex items-center gap-2 col-span-2">
                                            <BanknotesIcon className="w-4 h-4 text-emerald-500" />
                                            <div>
                                                <p className="text-xs text-gray-500">Validation (approved)</p>
                                                <p className="text-sm font-bold text-emerald-600">{formatCurrencyINR(data.validationReimbursement)}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-3 border-t border-gray-100">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-500">Total Payable</span>
                                        <span className="text-lg font-bold text-primary">{formatCurrencyINR(data.totalPayable)}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleGenerate(data);
                                    }}
                                    disabled={!!processing}
                                    className="w-full mt-2 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                                >
                                    {processing === data.user.id ? 'Generating...' : 'Generate Payroll'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Detail Modal */}
            {selectedStaff && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelectedStaff(null)}>
                    <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                                    {selectedStaff.user.avatar ? (
                                        <img src={selectedStaff.user.avatar} alt={selectedStaff.user.name} className="w-14 h-14 rounded-full object-cover" />
                                    ) : (
                                        <UserCircleIcon className="w-10 h-10 text-white" />
                                    )}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">{selectedStaff.user.name}</h2>
                                    <p className="text-white/70">{selectedStaff.user.role} • {selectedMonth}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedStaff(null)} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                                <XMarkIcon className="w-6 h-6 text-white" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-6">
                            {/* Time Breakdown */}
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-3">Time Breakdown</h3>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="bg-blue-50 p-4 rounded-lg">
                                        <p className="text-xs text-blue-600 uppercase font-medium">Active Hours</p>
                                        <p className="text-2xl font-bold text-blue-700">{selectedStaff.activeHours.toFixed(1)}h</p>
                                    </div>
                                    <div className="bg-amber-50 p-4 rounded-lg">
                                        <p className="text-xs text-amber-600 uppercase font-medium">Idle Hours</p>
                                        <p className="text-2xl font-bold text-amber-700">{selectedStaff.idleHours.toFixed(1)}h</p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p className="text-xs text-gray-600 uppercase font-medium">Break Hours</p>
                                        <p className="text-2xl font-bold text-gray-700">{selectedStaff.breakHours.toFixed(1)}h</p>
                                    </div>
                                </div>
                            </div>

                            {/* Travel & Expenses */}
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-3">Travel & Expenses</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-green-50 p-4 rounded-lg">
                                        <p className="text-xs text-green-600 uppercase font-medium">Distance Travelled</p>
                                        <p className="text-2xl font-bold text-green-700">{selectedStaff.distanceKm.toFixed(1)} km</p>
                                        <p className="text-sm text-green-600 mt-1">
                                            Reimbursement: {formatCurrencyINR(selectedStaff.travelReimbursement)}
                                        </p>
                                    </div>
                                    <div className="bg-purple-50 p-4 rounded-lg">
                                        <p className="text-xs text-purple-600 uppercase font-medium">Expenses Claimed</p>
                                        <p className="text-2xl font-bold text-purple-700">{formatCurrencyINR(selectedStaff.expenseClaimed)}</p>
                                        <p className="text-sm text-purple-600 mt-1">
                                            {expensesByUser[selectedStaff.user.id]?.items?.length || 0} expense entries
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Expense Items */}
                            {expensesByUser[selectedStaff.user.id]?.items?.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-3">Expense Breakdown</h3>
                                    <div className="bg-gray-50 rounded-lg overflow-hidden">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-100">
                                                <tr>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {expensesByUser[selectedStaff.user.id].items.map((exp: any, idx: number) => (
                                                    <tr key={idx}>
                                                        <td className="px-4 py-2 text-sm text-gray-900">{exp.description || 'Expense'}</td>
                                                        <td className="px-4 py-2 text-sm text-gray-500">{exp.category || 'General'}</td>
                                                        <td className="px-4 py-2 text-sm text-gray-900 text-right">{formatCurrencyINR(exp.amount)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Salary Calculation */}
                            <div className="bg-indigo-50 p-4 rounded-lg">
                                <h3 className="text-lg font-bold text-indigo-900 mb-3">Salary Calculation</h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-indigo-700">Base Salary (Hours × Rate)</span>
                                        <span className="font-medium text-indigo-900">{formatCurrencyINR(selectedStaff.estimatedSalary)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-indigo-700">Travel Reimbursement ({selectedStaff.distanceKm.toFixed(1)} km × ₹{ratePerKm})</span>
                                        <span className="font-medium text-indigo-900">{formatCurrencyINR(selectedStaff.travelReimbursement)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-indigo-700">Expense Reimbursement</span>
                                        <span className="font-medium text-indigo-900">{formatCurrencyINR(selectedStaff.expenseClaimed)}</span>
                                    </div>
                                    {selectedStaff.validationReimbursement > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-indigo-700">Validation (approved)</span>
                                            <span className="font-medium text-indigo-900">{formatCurrencyINR(selectedStaff.validationReimbursement)}</span>
                                        </div>
                                    )}
                                    <hr className="border-indigo-200" />
                                    <div className="flex justify-between text-lg font-bold">
                                        <span className="text-indigo-900">Total Payable</span>
                                        <span className="text-indigo-900">{formatCurrencyINR(selectedStaff.totalPayable)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Generate Button */}
                            <button
                                onClick={() => {
                                    handleGenerate(selectedStaff);
                                    setSelectedStaff(null);
                                }}
                                disabled={!!processing}
                                className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition-colors"
                            >
                                {processing === selectedStaff.user.id ? 'Generating...' : 'Generate Payroll Entry'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit ledger entry modal — accountant can edit every field */}
            {editingEntry && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => !savingLedger && setEditingEntry(null)}>
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-gray-900">Edit payroll entry</h3>
                        <p className="text-sm text-gray-500">{editingEntry.userName || editingEntry.userId} · {editingEntry.month}</p>
                        {['baseSalary', 'distanceReimbursement', 'expenseReimbursement', 'incentives', 'deductions', 'totalSalary'].map((field) => (
                            <div key={field}>
                                <label className="block text-xs font-medium text-gray-600 mb-1">{field.replace(/([A-Z])/g, ' $1').trim()}</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={editForm[field as keyof SalaryLedgerEntry] ?? 0}
                                    onChange={(e) => setEditForm((f) => ({ ...f, [field]: parseFloat(e.target.value) || 0 }))}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                />
                            </div>
                        ))}
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                            <select
                                value={editForm.status ?? editingEntry.status}
                                onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                            >
                                <option value="DRAFT">DRAFT</option>
                                <option value="PAID">PAID</option>
                            </select>
                        </div>
                        <div className="flex gap-2 pt-2">
                            <button type="button" onClick={handleSaveLedgerEdit} disabled={savingLedger} className="flex-1 py-2 bg-primary text-white rounded-lg font-medium disabled:opacity-50">
                                {savingLedger ? 'Saving...' : 'Save'}
                            </button>
                            <button type="button" onClick={() => { setEditingEntry(null); setEditForm({}); }} className="px-4 py-2 border border-gray-300 rounded-lg">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SalaryPage;
