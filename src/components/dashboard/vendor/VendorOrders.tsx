import React from 'react';
import { PURCHASE_ORDERS, formatDate, formatCurrencyINR } from '../../../constants';
import { useAuth } from '../../../context/AuthContext';
import { DocumentTextIcon, TruckIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { POStatus, PurchaseOrder } from '../../../types';

const STATUS_CONFIG = {
    [POStatus.ISSUED]: { color: 'text-primary bg-primary/5 border-primary/10', icon: ClockIcon, label: 'Received' },
    [POStatus.ACCEPTED]: { color: 'text-purple bg-purple/5 border-purple/10', icon: CheckCircleIcon, label: 'Accepted' },
    [POStatus.IN_TRANSIT]: { color: 'text-amber-600 bg-amber-50 border-amber-100', icon: TruckIcon, label: 'In Transit' },
    [POStatus.DELIVERED]: { color: 'text-secondary bg-secondary/5 border-secondary/10', icon: CheckCircleIcon, label: 'Delivered' },
    [POStatus.CANCELLED]: { color: 'text-error bg-error/5 border-error/10', icon: ClockIcon, label: 'Cancelled' },
};

const VendorOrders: React.FC = () => {
    const { currentVendor } = useAuth();

    const [orders] = React.useState<PurchaseOrder[]>(() => {
        const saved = localStorage.getItem('mmo_purchase_orders');
        return saved ? JSON.parse(saved) : PURCHASE_ORDERS;
    });

    const vendorOrders = orders.filter(po => po.vendorId === currentVendor?.id);

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-serif font-bold text-text-primary">Purchase Orders</h2>
                    <p className="text-text-secondary mt-1">View and manage orders from Make My Office</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {vendorOrders.map((po) => {
                    const status = STATUS_CONFIG[po.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG[POStatus.ISSUED];
                    const StatusIcon = status.icon;

                    return (
                        <div key={po.id} className="bg-surface border border-border rounded-2xl overflow-hidden hover:shadow-xl transition-all group">
                            <div className="p-6 flex flex-col md:flex-row justify-between gap-6">
                                <div className="space-y-4 flex-1">
                                    <div className="flex items-center space-x-3">
                                        <div className={`p-2 rounded-lg ${status.color}`}>
                                            <DocumentTextIcon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-text-primary">{po.poNumber}</h3>
                                            <p className="text-xs text-text-secondary uppercase tracking-widest font-bold">Issued: {formatDate(po.issueDate)}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="space-y-1">
                                            <p className="text-[10px] text-text-secondary uppercase font-black">Project</p>
                                            <p className="text-sm font-bold text-text-primary ellipsis max-w-[150px] truncate">
                                                {po.projectId === 'proj-1' || po.projectId === 'proj-104' ? 'Full Floor Fit-out' : 'Client Project'}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] text-text-secondary uppercase font-black">Total Amount</p>
                                            <p className="text-sm font-bold text-primary">{formatCurrencyINR(po.grandTotal)}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] text-text-secondary uppercase font-black">Delivery Due</p>
                                            <p className="text-sm font-bold text-text-primary">{formatDate(po.expectedDeliveryDate)}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] text-text-secondary uppercase font-black">Status</p>
                                            <div className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full border text-[10px] font-black uppercase tracking-tighter ${status.color}`}>
                                                <StatusIcon className="w-3 h-3" />
                                                <span>{status.label}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col justify-center space-y-2 md:w-48">
                                    <button className="w-full py-2 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-secondary transition-all shadow-md">
                                        View Details
                                    </button>
                                    {po.status === POStatus.ISSUED && (
                                        <button className="w-full py-2 bg-white border border-border text-text-primary text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-subtle-background transition-all">
                                            Acknowledge PO
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {vendorOrders.length === 0 && (
                    <div className="bg-surface border border-border border-dashed rounded-3xl py-20 flex flex-col items-center justify-center text-center">
                        <div className="p-4 bg-subtle-background rounded-full mb-4">
                            <DocumentTextIcon className="w-12 h-12 text-text-secondary opacity-20" />
                        </div>
                        <h3 className="text-lg font-bold text-text-primary">No orders yet</h3>
                        <p className="text-text-secondary text-sm max-w-xs mt-2">
                            When you are awarded a project, the purchase order will appear here.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VendorOrders;
