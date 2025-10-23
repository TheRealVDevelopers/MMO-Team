import React from 'react';
import { MATERIAL_REQUESTS } from '../../../constants';
import { MaterialRequest, MaterialRequestStatus } from '../../../types';
import { ClockIcon, FireIcon } from '../../icons/IconComponents';

const KANBAN_COLUMNS: { id: string, title: string, statuses: MaterialRequestStatus[] }[] = [
    { id: 'rfq', title: 'RFQ Pending', statuses: [MaterialRequestStatus.RFQ_PENDING] },
    { id: 'bidding', title: 'Bidding Open', statuses: [MaterialRequestStatus.BIDDING_OPEN] },
    { id: 'evaluation', title: 'Under Evaluation', statuses: [MaterialRequestStatus.UNDER_EVALUATION, MaterialRequestStatus.NEGOTIATION] },
    { id: 'ordered', title: 'Order Placed', statuses: [MaterialRequestStatus.PO_READY, MaterialRequestStatus.ORDER_PLACED] },
    { id: 'delivered', title: 'Delivered', statuses: [MaterialRequestStatus.DELIVERED] },
];

const RequestCard: React.FC<{ request: MaterialRequest; }> = ({ request }) => {
    return (
        <div className="bg-surface p-3 rounded-md border border-border space-y-3 cursor-pointer hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-bold text-text-primary">{request.projectName}</p>
                    <p className="text-xs text-text-secondary">{request.materials.map(m => m.name).join(', ')}</p>
                </div>
                {request.priority === 'High' && <FireIcon className="text-error" />}
            </div>
            <div className="flex justify-between items-center text-xs text-text-secondary border-t border-border pt-2">
                <div className="flex items-center space-x-1">
                    <ClockIcon className="w-4 h-4" />
                    <span>Due: {request.requiredBy.toLocaleDateString()}</span>
                </div>
            </div>
        </div>
    );
};

const BiddingManagementPage: React.FC = () => {
    return (
        <div className="space-y-6 h-full flex flex-col">
            <h2 className="text-2xl font-bold text-text-primary">Bidding Management Board</h2>
            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
                {KANBAN_COLUMNS.map(column => (
                    <div key={column.id} className="bg-subtle-background rounded-lg p-3 flex flex-col">
                        <h3 className="font-bold text-sm mb-3 px-1">{column.title}</h3>
                        <div className="space-y-3 flex-grow overflow-y-auto pr-1">
                            {MATERIAL_REQUESTS
                                .filter(p => column.statuses.includes(p.status))
                                .map(request => (
                                    <RequestCard key={request.id} request={request} />
                                ))
                            }
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BiddingManagementPage;