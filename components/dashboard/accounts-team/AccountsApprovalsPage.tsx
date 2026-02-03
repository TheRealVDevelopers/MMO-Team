import React, { useState } from 'react';
import { useFinanceRequests } from '../../../hooks/useFinanceRequests';
import { useProjects } from '../../../hooks/useProjects';
import Card from '../../shared/Card';
import StatusPill from '../../shared/StatusPill';
import { formatCurrencyINR, formatDate } from '../../../constants';
import { CheckCircleIcon, XCircleIcon, ClockIcon, BuildingOfficeIcon, UserIcon } from '@heroicons/react/24/outline';
import { FinanceRequest } from '../../../types';

const AccountsApprovalsPage: React.FC = () => {
    const { requests, approveRequest, rejectRequest, loading } = useFinanceRequests();
    const { projects } = useProjects();

    // Only show requests waiting for ACCOUNTS approval
    const pendingRequests = requests.filter(r => r.status === 'Pending Accounts');
    const historyRequests = requests.filter(r => r.status !== 'Pending Accounts' && r.status !== 'Pending Admin');

    const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
    const [selectedRequest, setSelectedRequest] = useState<FinanceRequest | null>(null);
    const [auditProjectId, setAuditProjectId] = useState<string>('');

    const handleOpenAudit = (request: FinanceRequest) => {
        setSelectedRequest(request);
        // Pre-select project if proposed
        setAuditProjectId(request.projectId || '');
    };

    const handleConfirmApproval = () => {
        if (!selectedRequest || !auditProjectId) return;

        approveRequest(selectedRequest.id, auditProjectId, 'current_user_id'); // Mock User ID
        setSelectedRequest(null);
        setAuditProjectId('');
    };

    if (loading) return <div className="p-8">Loading Requests...</div>;

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-text-primary">Payment Approvals</h1>
                <p className="text-text-secondary">Validate requests and allocate funds from Project Cost Centers.</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`pb-2 border-b-2 px-4 font-medium transition-colors ${activeTab === 'pending' ? 'border-primary text-primary' : 'border-transparent text-text-secondary'}`}
                >
                    Pending Action ({pendingRequests.length})
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`pb-2 border-b-2 px-4 font-medium transition-colors ${activeTab === 'history' ? 'border-primary text-primary' : 'border-transparent text-text-secondary'}`}
                >
                    History
                </button>
            </div>

            <div className="grid gap-4">
                {(activeTab === 'pending' ? pendingRequests : historyRequests).map(request => (
                    <Card key={request.id} className="hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                            <div className="flex gap-4">
                                <div className="bg-primary/10 p-3 rounded-full h-fit">
                                    <UserIcon className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-text-primary">{request.requesterName}</h3>
                                    <p className="text-sm text-text-secondary flex items-center gap-1">
                                        <span className="font-semibold text-primary">{request.requesterRole}</span>
                                        <span>•</span>
                                        <span>{request.type}</span>
                                    </p>
                                    <p className="mt-2 text-text-primary">{request.description}</p>

                                    {request.adminApproval && (
                                        <div className="mt-2 flex items-center gap-2 text-xs bg-green-50 text-green-700 px-2 py-1 rounded w-fit">
                                            <CheckCircleIcon className="w-4 h-4" />
                                            Approved by {request.adminApproval.approvedBy} on {formatDate(request.adminApproval.approvedAt)}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="text-right">
                                <p className="text-xl font-bold text-text-primary mb-2">{formatCurrencyINR(request.amount)}</p>
                                <StatusPill color={
                                    request.status === 'Approved' ? 'green' :
                                        request.status === 'Rejected' ? 'red' : 'amber'
                                }>
                                    {request.status}
                                </StatusPill>
                                <p className="text-xs text-text-secondary mt-1 flex items-center justify-end gap-1">
                                    <ClockIcon className="w-3 h-3" />
                                    {formatDate(request.createdAt)}
                                </p>
                            </div>
                        </div>

                        {activeTab === 'pending' && (
                            <div className="mt-6 flex justify-end gap-3 border-t pt-4">
                                <button
                                    onClick={() => rejectRequest(request.id, 'Rejected by Accounts')}
                                    className="px-4 py-2 text-red-600 font-medium hover:bg-red-50 rounded-lg flex items-center gap-2"
                                >
                                    <XCircleIcon className="w-5 h-5" />
                                    Reject
                                </button>
                                <button
                                    onClick={() => handleOpenAudit(request)}
                                    className="px-6 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark shadow-sm flex items-center gap-2"
                                >
                                    <CheckCircleIcon className="w-5 h-5" />
                                    Review & Pay
                                </button>
                            </div>
                        )}

                        {activeTab === 'history' && request.accountsApproval && (
                            <div className="mt-4 pt-4 border-t text-sm">
                                <span className="text-text-secondary">Debited from Project: </span>
                                <span className="font-bold text-text-primary">
                                    {projects.find(p => p.id === request.accountsApproval?.assignedProjectId)?.projectName || 'Unknown Project'}
                                </span>
                            </div>
                        )}
                    </Card>
                ))}

                {((activeTab === 'pending' ? pendingRequests : historyRequests).length === 0) && (
                    <div className="text-center py-12 text-text-secondary italic">
                        No {activeTab} requests found.
                    </div>
                )}
            </div>

            {/* Approval Modal */}
            {selectedRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-surface w-full max-w-lg rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b bg-subtle-background">
                            <h3 className="text-xl font-bold">Approve Payment</h3>
                            <p className="text-sm text-text-secondary">Select the source project for cost allocation.</p>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="bg-blue-50 p-4 rounded-lg flex justify-between items-center border border-blue-100">
                                <span className="text-blue-800 font-medium">Request Amount</span>
                                <span className="text-2xl font-bold text-blue-900">{formatCurrencyINR(selectedRequest.amount)}</span>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-text-secondary">Debiting from Project (Cost Center)</label>
                                <select
                                    value={auditProjectId}
                                    onChange={(e) => setAuditProjectId(e.target.value)}
                                    className="w-full p-3 border rounded-lg bg-white focus:ring-2 focus:ring-primary outline-none"
                                >
                                    <option value="">-- Select Project --</option>
                                    {projects.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.projectName} (Balance: ₹{(p.budget * 0.4).toLocaleString()}) {/* Mock Balance */}
                                        </option>
                                    ))}
                                </select>
                                {auditProjectId && (
                                    <p className="text-xs text-green-600 flex items-center gap-1">
                                        <BuildingOfficeIcon className="w-3 h-3" />
                                        This amount will be deducted from the project budget.
                                    </p>
                                )}
                            </div>

                            <div className="bg-gray-50 p-3 rounded text-xs text-text-secondary">
                                Note: Approving this request will generate a PAY_OUT transaction linked to the selected project and mark the request as paid.
                            </div>
                        </div>

                        <div className="p-6 bg-gray-50 border-t flex justify-end gap-3">
                            <button
                                onClick={() => setSelectedRequest(null)}
                                className="px-4 py-2 text-text-secondary font-medium hover:text-text-primary"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmApproval}
                                disabled={!auditProjectId}
                                className="px-6 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                Confirm Payment
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AccountsApprovalsPage;
