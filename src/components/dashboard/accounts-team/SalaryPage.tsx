import React, { useState } from 'react';
import Card from '../../shared/Card';
import { useProjects } from '../../../hooks/useProjects';
import { useUsers } from '../../../hooks/useUsers';
import { User, UserRole } from '../../../types';

const SalaryPage: React.FC = () => {
    const { projects } = useProjects();
    const { users, loading: usersLoading } = useUsers();
    const [openPaymentModal, setOpenPaymentModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);
    const [selectedProject, setSelectedProject] = useState<string>('');
    const [paymentAmount, setPaymentAmount] = useState<string>('');
    const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);

    const handlePayment = async () => {
        if (!selectedEmployee || !paymentAmount || !paymentDate || !selectedProject) {
            alert("Please select an employee, enter amount, date and select a project.");
            return;
        }

        try {
            // Import dynamically
            const { recordOutflow } = await import('../../../services/financeService');

            // 1. Record Salary Outflow against Project
            await recordOutflow(
                selectedProject,
                Number(paymentAmount),
                'Salary',
                selectedEmployee.id || 'unknown',
                `Salary Payment - ${selectedEmployee.name} - ${new Date(paymentDate).toLocaleString('default', { month: 'long' })}`
            );

            alert(`Salary recorded successfully for ${selectedEmployee.name}`);
            setOpenPaymentModal(false);
            setPaymentAmount('');
            setSelectedProject('');
            setSelectedEmployee(null);

        } catch (error) {
            console.error("Error processing salary:", error);
            alert("Failed to process salary payment");
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            <h2 className="text-2xl font-bold text-text-primary">Salary Management</h2>

            <Card className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="font-bold text-lg text-text-primary">Process Salaries</h3>
                        <p className="text-sm text-text-secondary">Record salary payments to assign labor costs to projects.</p>
                    </div>
                    <button
                        onClick={() => setOpenPaymentModal(true)}
                        className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-secondary transition-colors"
                    >
                        Process New Payment
                    </button>
                </div>

                <div className="bg-subtle-background p-4 rounded-lg border border-border text-center">
                    <p className="text-text-secondary">
                        Comprehensive payroll history and management features coming soon.
                        Use the <span className="font-bold">Process New Payment</span> button above to record immediate salary outflows to projects.
                    </p>
                </div>
            </Card>

            {/* Payment Modal */}
            {openPaymentModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-surface p-6 rounded-lg w-full max-w-md space-y-4 shadow-xl border border-border">
                        <h3 className="text-lg font-bold text-text-primary">Record Salary Payment</h3>

                        <div>
                            <label className="block text-sm font-bold text-text-secondary mb-1">Select Employee</label>
                            <select
                                className="w-full p-2 border border-border rounded bg-subtle-background"
                                onChange={e => {
                                    const emp = users.find(u => u.id === e.target.value);
                                    setSelectedEmployee(emp || null);
                                }}
                                disabled={usersLoading}
                            >
                                <option value="">{usersLoading ? 'Loading employees...' : '-- Choose Employee --'}</option>
                                {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-text-secondary mb-1">Project Source (Cost Center)</label>
                            <p className="text-xs text-text-secondary mb-1">Select the project this salary should be billed to.</p>
                            <select
                                className="w-full p-2 border border-border rounded bg-subtle-background"
                                value={selectedProject}
                                onChange={e => setSelectedProject(e.target.value)}
                            >
                                <option value="">-- Choose Project --</option>
                                {projects.map(p => <option key={p.id} value={p.id}>{p.projectName} ({p.clientName})</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-text-secondary mb-1">Amount</label>
                            <input
                                type="number"
                                value={paymentAmount}
                                onChange={e => setPaymentAmount(e.target.value)}
                                className="w-full p-2 border border-border rounded bg-subtle-background"
                                placeholder="Enter Amount"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-text-secondary mb-1">Payment Date</label>
                            <input
                                type="date"
                                value={paymentDate}
                                onChange={e => setPaymentDate(e.target.value)}
                                className="w-full p-2 border border-border rounded bg-subtle-background"
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <button onClick={() => setOpenPaymentModal(false)} className="text-text-secondary hover:text-text-primary px-3 py-2">Cancel</button>
                            <button onClick={handlePayment} className="bg-primary text-white px-4 py-2 rounded hover:bg-secondary">Confirm Payment</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SalaryPage;
