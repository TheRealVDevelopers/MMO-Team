
import React from 'react';
import Card from '../../shared/Card';
import { VENDORS } from '../../../constants';
import { ArrowLeftIcon } from '../../icons/IconComponents';

const VendorManagementPage: React.FC<{ setCurrentPage: (page: string) => void }> = ({ setCurrentPage }) => {
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
                <h2 className="text-2xl font-bold text-text-primary">Vendor Management</h2>
            </div>
            <Card>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                        <thead className="bg-subtle-background">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Vendor Name</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Category</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Rating</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Active Orders</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">On-time %</th>
                            </tr>
                        </thead>
                        <tbody className="bg-surface divide-y divide-border">
                            {VENDORS.map(vendor => (
                                <tr key={vendor.id} className="hover:bg-subtle-background">
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-text-primary">{vendor.name}</td>
                                    <td className="px-4 py-3 text-sm text-text-secondary">{vendor.category}</td>
                                    <td className="px-4 py-3 text-sm font-medium text-accent">{vendor.rating}/5.0</td>
                                    <td className="px-4 py-3 text-sm text-text-secondary">3</td>
                                    <td className="px-4 py-3 text-sm text-secondary">98%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default VendorManagementPage;