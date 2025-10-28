import React, { useState, useEffect } from 'react';
import Modal from '../../shared/Modal';
import { Complaint, ComplaintStatus } from '../../../types';
import { USERS } from '../../../constants';
import { formatDate } from '../../../constants';
import StatusPill from '../../shared/StatusPill';

interface ComplaintDetailModalProps {
    complaint: Complaint | null;
    isOpen: boolean;
    onClose: () => void;
    onUpdateStatus: (complaintId: string, newStatus: ComplaintStatus) => void;
}

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

const DetailItem: React.FC<{ label: string, value?: string | string[] }> = ({ label, value }) => (
    <div>
        <h4 className="text-xs font-bold text-text-secondary uppercase">{label}</h4>
        {Array.isArray(value) ? (
            <ul className="list-disc pl-5 mt-1 text-sm text-text-primary">
                {value.map((v, i) => <li key={i}>{v}</li>)}
            </ul>
        ) : (
             <p className="text-sm text-text-primary mt-1">{value || 'N/A'}</p>
        )}
    </div>
);

const ComplaintDetailModal: React.FC<ComplaintDetailModalProps> = ({ complaint, isOpen, onClose, onUpdateStatus }) => {
    const [currentStatus, setCurrentStatus] = useState<ComplaintStatus | undefined>(undefined);

    useEffect(() => {
        if (complaint) {
            setCurrentStatus(complaint.status);
        }
    }, [complaint]);
    
    if (!complaint) return null;

    const submittedByUser = USERS.find(u => u.id === complaint.submittedBy);

    const handleUpdate = () => {
        if (currentStatus) {
            onUpdateStatus(complaint.id, currentStatus);
        }
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Complaint Details: #${complaint.id.slice(0, 8)}`} size="2xl">
            <div className="space-y-4">
                <div className="p-4 bg-subtle-background rounded-lg grid grid-cols-2 md:grid-cols-4 gap-4 text-center md:text-left">
                    <div>
                        <p className="text-xs text-text-secondary">Submitted By</p>
                        <p className="font-bold text-text-primary">{submittedByUser?.name || 'Unknown'}</p>
                    </div>
                     <div>
                        <p className="text-xs text-text-secondary">Against</p>
                        <p className="font-bold text-text-primary">{complaint.against}</p>
                    </div>
                     <div>
                        <p className="text-xs text-text-secondary">Date</p>
                        <p className="font-bold text-text-primary">{formatDate(complaint.submissionDate)}</p>
                    </div>
                     <div>
                        <p className="text-xs text-text-secondary">Priority</p>
                        <p className={`font-bold ${complaint.priority === 'Critical' || complaint.priority === 'High' ? 'text-error' : 'text-accent'}`}>{complaint.priority}</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <DetailItem label="Complaint Type" value={complaint.type} />
                    <DetailItem label="Project Context" value={complaint.projectContext} />
                    <DetailItem label="Description" value={complaint.description} />
                    <DetailItem label="Evidence (Notes)" value={complaint.evidence} />
                    <DetailItem label="Resolution Attempts" value={complaint.resolutionAttempts} />
                    <DetailItem label="Desired Resolution" value={complaint.desiredResolution} />
                </div>

                <div className="pt-4 border-t border-border">
                    <h4 className="font-bold text-text-primary mb-2">Manage Status</h4>
                     <div className="flex items-center gap-4">
                        <select 
                            value={currentStatus} 
                            onChange={(e) => setCurrentStatus(e.target.value as ComplaintStatus)}
                            className="flex-grow p-2 border-border bg-surface rounded-md shadow-sm focus:ring-primary focus:border-primary"
                        >
                            {Object.values(ComplaintStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <button onClick={handleUpdate} className="bg-primary text-white px-4 py-2 rounded-md hover:bg-blue-700">
                            Update Status
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default ComplaintDetailModal;
