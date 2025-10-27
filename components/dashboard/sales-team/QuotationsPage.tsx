

import React, { useState, useMemo } from 'react';
import Card from '../../shared/Card';
import { PROJECTS, USERS, formatCurrencyINR, formatDate } from '../../../constants';
import { ProjectStatus, QuotationRequest, QuotationRequestStatus, UserRole } from '../../../types';
import StatusPill from '../../shared/StatusPill';
import { useAuth } from '../../../context/AuthContext';
import { PlusIcon, ArrowLeftIcon } from '../../icons/IconComponents';
import RequestQuotationModal from './RequestQuotationModal';

const QuotationStatusPill: React.FC<{ status: QuotationRequestStatus }> = ({ status }) => {
    const color = {
        [QuotationRequestStatus.REQUESTED]: 'blue',
        [QuotationRequestStatus.IN_PROGRESS]: 'amber',
        [QuotationRequestStatus.COMPLETED]: 'green',
    }[status] as 'blue' | 'amber' | 'green';
    
    return <StatusPill color={color || 'slate'}>{status}</StatusPill>;
};

const QuotationsPage: React.FC<{ 
    setCurrentPage: (page: string) => void;
    quotationRequests: QuotationRequest[];
    onRequestQuotation: (requestData: Omit<QuotationRequest, 'id' | 'status' | 'requestDate'>) => void;
}> = ({ setCurrentPage, quotationRequests, onRequestQuotation }) => {
    const { currentUser } = useAuth();
    const [isModalOpen, setModalOpen] = useState(false);

    const myQuotationRequests = useMemo(() => {
        if (!currentUser) return [];
        return quotationRequests.filter(req => req.requesterId === currentUser.id);
    }, [currentUser, quotationRequests]);

    const myWonProjects = useMemo(() => {
        if (!currentUser) return [];
        return PROJECTS.filter(p => p.salespersonId === currentUser.id && p.status === ProjectStatus.APPROVED);
    }, [currentUser]);

    const quotationTeam = useMemo(() => USERS.filter(u => u.role === UserRole.QUOTATION_TEAM), []);

    if (!currentUser) return null;

    return (
        <>
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
                    <h2 className="text-2xl font-bold text-text-primary">My Quotation Requests</h2>
                </div>
                <button onClick={() => setModalOpen(true)} className="flex items-center space-x-2 bg-primary text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 mt-2 sm:mt-0">
                    <PlusIcon className="w-4 h-4" />
                    <span>Request New Quotation</span>
                </button>
            </div>
            <Card>
                 <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                        <thead className="bg-subtle-background">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Project / Client</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Assigned To</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Status</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Quoted Amount</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Notes</th>
                            </tr>
                        </thead>
                        <tbody className="bg-surface divide-y divide-border">
                            {myQuotationRequests.map(request => (
                                <tr key={request.id} className="cursor-pointer hover:bg-subtle-background">
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <p className="text-sm font-bold text-text-primary">{request.projectName}</p>
                                        <p className="text-xs text-text-secondary">{request.clientName}</p>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-text-secondary">{USERS.find(u => u.id === request.assigneeId)?.name || 'N/A'}</td>
                                    <td className="px-4 py-3 whitespace-nowrap"><QuotationStatusPill status={request.status} /></td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-text-primary">{request.quotedAmount ? formatCurrencyINR(request.quotedAmount) : 'Pending'}</td>
                                    <td className="px-4 py-3 text-sm text-text-secondary max-w-xs truncate">{request.notes}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
        <RequestQuotationModal 
            isOpen={isModalOpen}
            onClose={() => setModalOpen(false)}
            projects={myWonProjects}
            quotationTeam={quotationTeam}
            requesterId={currentUser.id}
            onRequest={onRequestQuotation}
        />
        </>
    );
};

export default QuotationsPage;