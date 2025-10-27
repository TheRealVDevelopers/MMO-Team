
import React, { useState } from 'react';
import Card from '../../shared/Card';
import { VENDOR_BILLS, formatCurrencyINR, formatDate } from '../../../constants';
import StatusPill from '../../shared/StatusPill';
import { ArrowLeftIcon } from '../../icons/IconComponents';

const BillStatusPill: React.FC<{ status: 'Pending' | 'Scheduled' | 'Paid' }> = ({ status }) => {
    const color = {
        'Pending': 'amber',
        'Scheduled': 'blue',
        'Paid': 'green',
    }[status] as 'amber' | 'blue' | 'green';
    return <StatusPill color={color}>{status}</StatusPill>;
};

const PaymentsPage: React.FC<{ setCurrentPage: (page: string) => void }> = ({ setCurrentPage }) => {
    const [activeTab, setActiveTab] = useState<'vendors' | 'payroll'>('vendors');
    
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => setCurrentPage('overview')}
                    className="flex items-center space-x-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
                >
                    <ArrowLeftIcon className="w-5 h-5" />
                    <span>Back</span>
                </button>
                <h2 className="text-2xl font-bold text-text-primary">Outgoing Payments</h2>
            </div>
            
            <Card>
                <div className="border-b border-border">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                        <button onClick={() => setActiveTab('vendors')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'vendors' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border'}`}>
                            Vendor Payments
                        </button>
                        <button onClick={() => setActiveTab('payroll')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'payroll' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border'}`}>
                            Payroll (Coming Soon)
                        </button>
                    </nav>
                </div>

                {activeTab === 'vendors' && (
                    <div className="mt-4 overflow-x-auto">
                         <table className="min-w-full divide-y divide-border">
                            <thead className="bg-subtle-background">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Vendor</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Invoice #</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Amount</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Due Date</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-surface divide-y divide-border">
                                {VENDOR_BILLS.map(bill => (
                                    <tr key={bill.id} className="hover:bg-subtle-background">
                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-text-primary">{bill.vendorName}</td>
                                        <td className="px-4 py-3 text-sm text-text-secondary">{bill.invoiceNumber}</td>
                                        <td className="px-4 py-3 text-sm font-medium text-text-primary">{formatCurrencyINR(bill.amount)}</td>
                                        <td className="px-4 py-3 text-sm text-text-secondary">{formatDate(bill.dueDate)}</td>
                                        <td className="px-4 py-3"><BillStatusPill status={bill.status} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'payroll' && (
                    <div className="text-center py-12">
                        <h3 className="text-lg font-bold text-text-primary">Payroll Management</h3>
                        <p className="mt-2 text-sm text-text-secondary">This feature is currently under development.</p>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default PaymentsPage;