import React from 'react';
import Card from '../../shared/Card';
import { MATERIAL_REQUESTS } from '../../../constants';
import { MaterialRequest } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { FireIcon, ClockIcon } from '../../icons/IconComponents';
import StatusPill from '../../shared/StatusPill';

const PriorityIndicator: React.FC<{ priority: 'High' | 'Medium' | 'Low' }> = ({ priority }) => {
    if (priority === 'High') return <div className="flex items-center text-sm text-error"><FireIcon className="w-4 h-4 mr-1" /> High</div>;
    if (priority === 'Medium') return <div className="flex items-center text-sm text-accent">Medium</div>;
    return <div className="flex items-center text-sm text-text-secondary">Low</div>;
};

const KpiCard: React.FC<{ title: string; value: string; subtext?: string }> = ({ title, value, subtext }) => (
    <Card>
        <p className="text-sm font-medium text-text-secondary">{title}</p>
        <p className="text-2xl font-bold text-text-primary tracking-tight">{value}</p>
        {subtext && <p className="text-xs text-text-secondary mt-1">{subtext}</p>}
    </Card>
);

const ProcurementOverviewPage: React.FC = () => {
    const { currentUser } = useAuth();
    if (!currentUser) return null;

    const requestQueue = MATERIAL_REQUESTS.filter(r => r.status === 'RFQ Pending' || r.status === 'Bidding Open');
    const urgentRequests = requestQueue.filter(r => r.priority === 'High').length;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-text-primary">Quotation Dashboard</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard title="Requests in Queue" value={requestQueue.length.toString()} subtext={`${urgentRequests} urgent`} />
                <KpiCard title="Orders Placed (Month)" value="12" />
                <KpiCard title="Cost Savings (Month)" value="₹10,03,200" />
                <KpiCard title="Avg. Sourcing Time" value="4.2 Days" />
            </div>

            <Card>
                <h3 className="text-lg font-bold">Material Requests Queue</h3>
                <p className="text-sm text-text-secondary mt-1">New sourcing requests from project teams.</p>
                <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                        <thead className="bg-subtle-background">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Project</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Required By</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Priority</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-surface divide-y divide-border">
                            {requestQueue.length > 0 ? requestQueue.map(request => (
                                <tr key={request.id} className="cursor-pointer hover:bg-subtle-background">
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <p className="text-sm font-bold text-text-primary">{request.projectName}</p>
                                        <p className="text-xs text-text-secondary">{request.materials.map(m => m.name).join(', ')}</p>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-text-secondary">{request.requiredDate ? new Date(request.requiredDate).toLocaleDateString() : 'N/A'}</td>
                                    <td className="px-4 py-3"><PriorityIndicator priority={request.priority} /></td>
                                    <td className="px-4 py-3"><StatusPill color="blue">{request.status}</StatusPill></td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="text-center py-8 text-text-secondary">The material request queue is empty.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default ProcurementOverviewPage;