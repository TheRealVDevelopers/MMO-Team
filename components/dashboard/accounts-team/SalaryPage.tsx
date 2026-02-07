import React, { useState } from 'react';
import { useSalarySystem, SalaryData } from '../../../hooks/useSalarySystem';
import { formatCurrencyINR } from '../../../constants';
import { User } from '../../../types';

const SalaryPage: React.FC = () => {
    const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const { salaryData, loading, error, generatePayroll } = useSalarySystem(selectedMonth);
    const [processing, setProcessing] = useState<string | null>(null);

    const handleGenerate = async (data: SalaryData) => {
        setProcessing(data.user.id);
        await generatePayroll(data);
        setProcessing(null);
        alert(`Payroll generated for ${data.user.name}`);
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Salary System</h1>
                    <p className="text-sm text-gray-500">Automated payroll based on time tracking and task completion.</p>
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">Select Month:</label>
                    <input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-gray-500">Calculating payroll data...</p>
                </div>
            ) : error ? (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Active Hrs</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Idle Hrs</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Distance (km)</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Est. Salary</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {salaryData.map((data) => (
                                <tr key={data.user.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="text-sm font-medium text-gray-900">{data.user.name}</div>
                                            <div className="ml-2 text-xs text-gray-500">({data.user.role})</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                                        {data.activeHours.toFixed(1)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-amber-600">
                                        {data.idleHours.toFixed(1)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-blue-600">
                                        {data.distanceKm.toFixed(1)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-900">
                                        {formatCurrencyINR(data.estimatedSalary)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => handleGenerate(data)}
                                            disabled={!!processing}
                                            className="text-primary hover:text-indigo-900 disabled:opacity-50"
                                        >
                                            {processing === data.user.id ? 'Saving...' : 'Generate Payroll'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {salaryData.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        No data found for this month.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default SalaryPage;
