import React, { useState } from 'react';
import Card from '../../shared/Card';
import { formatCurrencyINR, formatDate } from '../../../constants';
import StatusPill from '../../shared/StatusPill';
import { ArrowLeftIcon, PlusIcon } from '../../icons/IconComponents';
import { VendorBillStatus } from '../../../types';
import VendorBillModal from './VendorBillModal';
import type { PurchaseInvoice } from '../../../hooks/usePurchaseInvoices';

const BillStatusPill: React.FC<{ status: string }> = ({ status }) => {
    const color = { 'Pending Approval': 'amber', 'Approved': 'green', 'Scheduled': 'purple', 'Paid': 'green', 'Overdue': 'red' }[status] as 'amber' | 'green' | 'purple' | 'red' | undefined;
    return <StatusPill color={color ?? 'slate'}>{status}</StatusPill>;
};

interface PurchaseInvoicesPageProps {
    setCurrentPage: (page: string) => void;
    purchaseInvoices: PurchaseInvoice[];
    onCreatePurchaseInvoice: (input: { caseId?: string; vendorName: string; invoiceNumber: string; amount: number; issueDate: Date; dueDate?: Date }) => Promise<void>;
}

const PurchaseInvoicesPage: React.FC<PurchaseInvoicesPageProps> = ({ setCurrentPage, purchaseInvoices, onCreatePurchaseInvoice }) => {
    const [activeTab, setActiveTab] = useState<'vendors' | 'payroll'>('vendors');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedBill, setSelectedBill] = useState<PurchaseInvoice | null>(null);

    const handleOpenModal = (bill: PurchaseInvoice | null) => {
        setSelectedBill(bill);
        setIsModalOpen(true);
    };

    const handleSaveBill = async (billData: any) => {
        if (billData.id) return;
        await onCreatePurchaseInvoice({
            caseId: billData.projectId || billData.caseId || undefined,
            vendorName: billData.vendorName ?? billData.vendor ?? '',
            invoiceNumber: billData.invoiceNumber ?? `PI-${Date.now()}`,
            amount: Number(billData.amount) ?? 0,
            issueDate: billData.issueDate instanceof Date ? billData.issueDate : new Date(billData.issueDate),
            dueDate: billData.dueDate ? (billData.dueDate instanceof Date ? billData.dueDate : new Date(billData.dueDate)) : undefined,
        });
        setIsModalOpen(false);
    };

    return (
        <>
            <div className="p-4 sm:p-6 lg:p-8 space-y-6">
                <div className="sm:flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setCurrentPage('my-day')}
                            className="flex items-center space-x-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
                        >
                            <ArrowLeftIcon className="w-5 h-5" />
                            <span>Back</span>
                        </button>
                        <div>
                            <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                                GROUT <span className="text-sm font-normal text-text-secondary bg-surface px-2 py-0.5 rounded-full border border-border">(In)</span>
                            </h2>
                            <p className="text-sm text-text-secondary">Manage incoming bills from vendors and payroll</p>
                        </div>
                    </div>
                    {activeTab === 'vendors' && (
                        <button onClick={() => handleOpenModal(null)} className="flex items-center space-x-2 bg-primary text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-secondary mt-2 sm:mt-0">
                            <PlusIcon className="w-4 h-4" />
                            <span>Add Vendor Bill</span>
                        </button>
                    )}
                </div>

                <Card>
                    <div className="border-b border-border">
                        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                            <button onClick={() => setActiveTab('vendors')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'vendors' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border'}`}>
                                Vendor Bills
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
                                        <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Bill #</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Amount</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Issue / Due</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Status</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-surface divide-y divide-border">
                                    {purchaseInvoices.map(bill => (
                                        <tr key={bill.id} onClick={() => handleOpenModal(bill)} className="cursor-pointer hover:bg-subtle-background group">
                                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-text-primary group-hover:text-primary">{bill.vendorName}</td>
                                            <td className="px-4 py-3 text-sm text-text-secondary font-mono">{bill.invoiceNumber}</td>
                                            <td className="px-4 py-3 text-sm font-bold text-text-primary">{formatCurrencyINR(bill.amount)}</td>
                                            <td className="px-4 py-3 text-sm text-text-secondary">{formatDate(bill.issueDate)} {bill.dueDate ? ` / ${formatDate(bill.dueDate)}` : ''}</td>
                                            <td className="px-4 py-3"><BillStatusPill status={bill.status} /></td>
                                            <td className="px-4 py-3">—</td>
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
            {isModalOpen && (
                <VendorBillModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    bill={selectedBill ? { id: selectedBill.id, vendorName: selectedBill.vendorName, invoiceNumber: selectedBill.invoiceNumber, amount: selectedBill.amount, dueDate: selectedBill.dueDate ?? new Date(), status: selectedBill.status as VendorBillStatus, projectId: selectedBill.caseId } : null}
                    onSave={handleSaveBill}
                />
            )}
        </>
    );
};

export default PurchaseInvoicesPage;
