import React, { useState } from 'react';
import { PURCHASE_ORDERS, formatDate, formatCurrencyINR } from '../../../constants';
import { PurchaseOrder, POStatus } from '../../../types';
import { ArrowLeftIcon, PlusIcon, DocumentTextIcon, TruckIcon, CheckCircleIcon, XMarkIcon } from '../../icons/IconComponents';

const PO_STATUS_COLORS = {
    [POStatus.ISSUED]: 'bg-accent-subtle-background text-accent-subtle-text border-accent',
    [POStatus.ACCEPTED]: 'bg-primary/10 text-primary border-primary/20',
    [POStatus.IN_TRANSIT]: 'bg-amber-100 text-amber-700 border-amber-200',
    [POStatus.PARTIALLY_DELIVERED]: 'bg-orange-100 text-orange-700 border-orange-200',
    [POStatus.DELIVERED]: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    [POStatus.CANCELLED]: 'bg-rose-100 text-rose-700 border-rose-200',
};

const POManagementPage: React.FC<{ setCurrentPage: (page: string) => void }> = ({ setCurrentPage }) => {
    const [orders, setOrders] = useState(PURCHASE_ORDERS);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredOrders = orders.filter(po =>
        po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="sm:flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setCurrentPage('overview')}
                        className="flex items-center space-x-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
                    >
                        <ArrowLeftIcon className="w-5 h-5" />
                        <span>Back</span>
                    </button>
                    <h2 className="text-2xl font-serif font-bold text-text-primary uppercase tracking-tighter">Purchase Orders</h2>
                </div>
                <div className="flex items-center space-x-4">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search POs..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-4 pr-10 py-2 bg-surface border border-border rounded-full text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all w-64"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
                <table className="min-w-full divide-y divide-border">
                    <thead className="bg-subtle-background/50">
                        <tr>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-text-secondary uppercase tracking-widest">PO Details</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-text-secondary uppercase tracking-widest">Project</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-text-secondary uppercase tracking-widest">Amount</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-text-secondary uppercase tracking-widest">Expected Delivery</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-text-secondary uppercase tracking-widest">Status</th>
                            <th className="px-6 py-4 text-right text-[10px] font-black text-text-secondary uppercase tracking-widest">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-surface">
                        {filteredOrders.map((po) => (
                            <tr key={po.id} className="hover:bg-subtle-background/30 transition-colors group">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-text-primary group-hover:text-primary transition-colors">{po.poNumber}</span>
                                        <span className="text-[10px] text-text-secondary uppercase tracking-tight">Issued: {formatDate(po.issueDate)}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary font-medium">
                                    {po.projectId} {/* In a real app, link to project name */}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-text-primary">{formatCurrencyINR(po.grandTotal)}</span>
                                        <span className="text-[10px] text-text-secondary">Tax included</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center space-x-2 text-sm text-text-primary">
                                        <TruckIcon className="w-4 h-4 text-text-secondary" />
                                        <span>{formatDate(po.expectedDeliveryDate)}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${PO_STATUS_COLORS[po.status]}`}>
                                        {po.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                    <button className="text-text-secondary hover:text-primary transition-colors p-2 rounded-full hover:bg-primary/5">
                                        <DocumentTextIcon className="w-5 h-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredOrders.length === 0 && (
                    <div className="py-20 flex flex-col items-center justify-center text-text-secondary space-y-4">
                        <DocumentTextIcon className="w-12 h-12 opacity-20" />
                        <p className="text-sm uppercase tracking-widest font-bold">No purchase orders found</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default POManagementPage;
