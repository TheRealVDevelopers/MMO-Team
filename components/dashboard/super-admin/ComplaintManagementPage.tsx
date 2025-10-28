import React, { useState } from 'react';
import Card from '../../shared/Card';
import { COMPLAINTS, formatDate } from '../../../constants';
import { Complaint, ComplaintStatus } from '../../../types';
import { ArrowLeftIcon } from '../../icons/IconComponents';
import StatusPill from '../../shared/StatusPill';
import ComplaintDetailModal from './ComplaintDetailModal';

const getStatusPillColor = (status: ComplaintStatus): 'blue' | 'amber' | 'green' | 'red' | 'slate' | 'purple' => {
    switch(status) {
        case ComplaintStatus.SUBMITTED: return 'blue';
        case ComplaintStatus.UNDER_REVIEW: return 'amber';
        case ComplaintStatus.INVESTIGATION: return 'purple';
        case ComplaintStatus.RESOLVED: return 'green';
        case ComplaintStatus.ESCALATED: return 'red';
        default: return 'slate';
    }
};

const ComplaintManagementPage: React.FC<{ setCurrentPage: (page: string) => void }> = ({ setCurrentPage }) => {
    const [complaints, setComplaints] = useState<Complaint[]>(COMPLAINTS);
    const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

    const handleUpdateStatus = (complaintId: string, newStatus: ComplaintStatus) => {
        setComplaints(prev => prev.map(c => c.id === complaintId ? { ...c, status: newStatus } : c));
    };

    const stats = complaints.reduce((acc, curr) => {
        acc[curr.status] = (acc[curr.status] || 0) + 1;
        return acc;
    }, {} as Record<ComplaintStatus, number>);
    
    const activeComplaints = (stats[ComplaintStatus.SUBMITTED] || 0) + (stats[ComplaintStatus.UNDER_REVIEW] || 0) + (stats[ComplaintStatus.INVESTIGATION] || 0);
    const highPriority = complaints.filter(c => c.priority === 'High' || c.priority === 'Critical').length;

    return (
        <>
            <div className="p-4 sm:p-6 lg:p-8 space-y-6">
                <div className="flex items-center gap-4">
                     <button
                        onClick={() => setCurrentPage('overview')}
                        className="flex items-center space-x-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
                    >
                        <ArrowLeftIcon className="w-5 h-5" />
                        <span>Back</span>
                    </button>
                    <h2 className="text-2xl font-bold text-text-primary">Complaint Management Center</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card><p className="text-sm text-text-secondary">Active Complaints</p><p className="text-2xl font-bold">{activeComplaints}</p></Card>
                    <Card><p className="text-sm text-text-secondary">High/Critical Priority</p><p className="text-2xl font-bold text-error">{highPriority}</p></Card>
                    <Card><p className="text-sm text-text-secondary">Resolved This Week</p><p className="text-2xl font-bold text-secondary">8</p></Card>
                </div>

                <Card>
                    <h3 className="text-lg font-bold">All Submitted Complaints</h3>
                    <div className="overflow-x-auto mt-4">
                        <table className="min-w-full divide-y divide-border">
                            <thead className="bg-subtle-background">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Date</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Type</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Against</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-surface divide-y divide-border">
                                {complaints.map(complaint => (
                                    <tr key={complaint.id} onClick={() => setSelectedComplaint(complaint)} className="cursor-pointer hover:bg-subtle-background">
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-text-secondary">{formatDate(complaint.submissionDate)}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-text-primary">{complaint.type}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-text-secondary">{complaint.against}</td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <StatusPill color={getStatusPillColor(complaint.status)}>{complaint.status}</StatusPill>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
            <ComplaintDetailModal
                isOpen={!!selectedComplaint}
                onClose={() => setSelectedComplaint(null)}
                complaint={selectedComplaint}
                onUpdateStatus={handleUpdateStatus}
            />
        </>
    );
};

export default ComplaintManagementPage;
