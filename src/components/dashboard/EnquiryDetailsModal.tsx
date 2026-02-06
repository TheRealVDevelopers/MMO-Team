import React, { useState } from 'react';
import Modal from '../shared/Modal';
import { ProjectEnquiry, EnquiryStatus, LeadPipelineStatus, UserRole } from '../../types';
import {
    UserPlusIcon,
    KeyIcon,
    ArrowPathIcon,
    CheckCircleIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import { USERS } from '../../constants';
import { assignEnquiry, convertEnquiryToLead, markEnquiryAsViewed } from '../../hooks/useEnquiries';
import { generateRandomPassword } from '../../services/liveDataService';

interface EnquiryDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    enquiry: ProjectEnquiry;
    currentUserId: string;
}

const EnquiryDetailsModal: React.FC<EnquiryDetailsModalProps> = ({
    isOpen,
    onClose,
    enquiry,
    currentUserId
}) => {
    const [selectedSalesUser, setSelectedSalesUser] = useState('');
    const [clientPassword, setClientPassword] = useState(generateRandomPassword());
    const [isAssigning, setIsAssigning] = useState(false);
    const [isConverting, setIsConverting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    // Get all sales team members
    const salesTeamMembers = USERS.filter(u =>
        u.role === UserRole.SALES_TEAM_MEMBER || u.role === UserRole.SALES_GENERAL_MANAGER
    );

    React.useEffect(() => {
        if (isOpen && enquiry) {
            // Mark as viewed when modal opens
            markEnquiryAsViewed(enquiry.id, currentUserId);
        }
    }, [isOpen, enquiry, currentUserId]);

    const handleAssign = async () => {
        if (!selectedSalesUser) {
            alert('Please select a sales team member');
            return;
        }

        setIsAssigning(true);
        try {
            const selectedUser = USERS.find(u => u.id === selectedSalesUser);
            if (!selectedUser) return;

            await assignEnquiry(
                enquiry.id,
                selectedUser.id,
                selectedUser.name,
                clientPassword
            );

            setSuccessMessage(`Enquiry assigned to ${selectedUser.name} successfully!`);
            setShowSuccess(true);

            setTimeout(() => {
                setShowSuccess(false);
                onClose();
            }, 2000);
        } catch (error) {
            console.error('Error assigning enquiry:', error);
            alert('Failed to assign enquiry. Please try again.');
        } finally {
            setIsAssigning(false);
        }
    };

    const handleConvertToLead = async () => {
        if (enquiry.status !== EnquiryStatus.ASSIGNED) {
            alert('Please assign the enquiry to a sales member before converting to lead');
            return;
        }

        setIsConverting(true);
        try {
            const leadData = {
                clientName: enquiry.clientName,
                projectName: `${enquiry.projectType} - ${enquiry.city}`,
                status: LeadPipelineStatus.NEW_NOT_CONTACTED,
                lastContacted: 'Not yet contacted',
                assignedTo: enquiry.assignedTo || '',
                inquiryDate: enquiry.createdAt,
                value: 0,
                source: 'Project Enquiry Form',
                history: [
                    {
                        action: 'Lead Created from Enquiry',
                        user: currentUserId,
                        timestamp: new Date(),
                        notes: `Converted from Enquiry ${enquiry.enquiryId} | Budget: ${enquiry.budgetRange} | Timeline: ${enquiry.completionTimeline}`
                    }
                ],
                tasks: {},
                reminders: [],
                priority: 'High' as const,
            };

            await convertEnquiryToLead(enquiry.id, enquiry, leadData);

            setSuccessMessage('Successfully converted to lead! Client project created.');
            setShowSuccess(true);

            setTimeout(() => {
                setShowSuccess(false);
                onClose();
            }, 2000);
        } catch (error) {
            console.error('Error converting to lead:', error);
            alert('Failed to convert to lead. Please try again.');
        } finally {
            setIsConverting(false);
        }
    };

    if (showSuccess) {
        return (
            <Modal isOpen={isOpen} onClose={onClose} title="" size="2xl">
                <div className="text-center py-12">
                    <CheckCircleIcon className="w-20 h-20 text-green-500 mx-auto mb-6" />
                    <h3 className="text-2xl font-bold text-text-primary/90 mb-4">{successMessage}</h3>
                </div>
            </Modal>
        );
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Enquiry Details" size="4xl">
            <div className="space-y-6">
                {/* Enquiry Info */}
                <div className="bg-gradient-to-r from-primary/10 to-text-primary/90/10 rounded-xl p-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Enquiry ID</p>
                            <p className="text-lg font-mono font-bold text-primary-hover">{enquiry.enquiryId}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Status</p>
                            <p className="text-lg font-bold text-text-primary/90">{enquiry.status}</p>
                        </div>
                    </div>
                </div>

                {/* Client Details */}
                <div>
                    <h3 className="font-bold text-lg mb-4 text-text-primary/90">Client Information</h3>
                    <div className="grid grid-cols-2 gap-6 bg-gray-50 rounded-xl p-6">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Name</p>
                            <p className="font-bold text-text-primary/90">{enquiry.clientName}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Email</p>
                            <p className="font-bold text-text-primary/90">{enquiry.email}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Mobile</p>
                            <p className="font-bold text-text-primary/90">{enquiry.mobile}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 mb-1">City</p>
                            <p className="font-bold text-text-primary/90">{enquiry.city}</p>
                        </div>
                    </div>
                </div>

                {/* Project Details */}
                <div>
                    <h3 className="font-bold text-lg mb-4 text-text-primary/90">Project Details</h3>
                    <div className="grid grid-cols-2 gap-6 bg-gray-50 rounded-xl p-6">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Project Type</p>
                            <p className="font-bold text-text-primary/90">{enquiry.projectType}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Space Type</p>
                            <p className="font-bold text-text-primary/90">{enquiry.spaceType}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Area</p>
                            <p className="font-bold text-text-primary/90">{enquiry.area}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Budget Range</p>
                            <p className="font-bold text-text-primary/90">{enquiry.budgetRange}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Design Style</p>
                            <p className="font-bold text-text-primary/90">{enquiry.designStyle}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Timeline</p>
                            <p className="font-bold text-text-primary/90">{enquiry.completionTimeline}</p>
                        </div>
                    </div>
                </div>

                {/* Additional Notes */}
                {enquiry.additionalNotes && (
                    <div>
                        <h3 className="font-bold text-lg mb-4 text-text-primary/90">Additional Notes</h3>
                        <div className="bg-gray-50 rounded-xl p-6">
                            <p className="text-text-primary/90">{enquiry.additionalNotes}</p>
                        </div>
                    </div>
                )}

                {/* Assignment Section - Only show if status is NEW */}
                {enquiry.status === EnquiryStatus.NEW && (
                    <div className="border-t-2 border-gray-200 pt-6">
                        <h3 className="font-bold text-lg mb-4 text-text-primary/90 flex items-center space-x-2">
                            <UserPlusIcon className="w-6 h-6 text-primary" />
                            <span>Assign to Sales Member</span>
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Select Sales Team Member</label>
                                <select
                                    value={selectedSalesUser}
                                    onChange={(e) => setSelectedSalesUser(e.target.value)}
                                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-primary outline-none"
                                >
                                    <option value="">-- Select Member --</option>
                                    {salesTeamMembers.map(user => (
                                        <option key={user.id} value={user.id}>
                                            {user.name} ({user.role})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center space-x-2">
                                    <KeyIcon className="w-4 h-4" />
                                    <span>Set Client Password</span>
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={clientPassword}
                                        onChange={(e) => setClientPassword(e.target.value)}
                                        className="flex-1 p-3 border-2 border-gray-300 rounded-lg focus:border-primary outline-none"
                                        placeholder="Enter password for client portal"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setClientPassword(generateRandomPassword())}
                                        className="p-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors border-2 border-gray-300"
                                        title="Regenerate Password"
                                    >
                                        <ArrowPathIcon className="w-5 h-5 text-gray-600" />
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={handleAssign}
                                disabled={isAssigning || !selectedSalesUser}
                                className="w-full py-4 bg-text-primary/90 text-white font-bold rounded-xl hover:bg-primary transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                            >
                                {isAssigning ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        <span>Assigning...</span>
                                    </>
                                ) : (
                                    <>
                                        <UserPlusIcon className="w-5 h-5" />
                                        <span>Assign Enquiry</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Convert to Lead Section - Only show if status is ASSIGNED */}
                {enquiry.status === EnquiryStatus.ASSIGNED && (
                    <div className="border-t-2 border-gray-200 pt-6">
                        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 mb-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-lg text-green-900 mb-2">Ready to Convert</h3>
                                    <p className="text-green-700">
                                        Assigned to: <span className="font-bold">{enquiry.assignedToName}</span>
                                    </p>
                                    <p className="text-green-700 text-sm mt-1">
                                        Client Password: <span className="font-mono font-bold">{enquiry.clientPassword}</span>
                                    </p>
                                </div>
                                <button
                                    onClick={handleConvertToLead}
                                    disabled={isConverting}
                                    className="px-6 py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                                >
                                    {isConverting ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                            <span>Converting...</span>
                                        </>
                                    ) : (
                                        <>
                                            <ArrowPathIcon className="w-5 h-5" />
                                            <span>Convert to Lead</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="text-sm text-gray-600 bg-accent-subtle-background border border-accent rounded-lg p-4">
                            <p className="font-bold mb-2">What happens when you convert?</p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>Creates a new Lead in the sales pipeline</li>
                                <li>Creates a Client Project for tracking</li>
                                <li>Enables client portal access with the set password</li>
                                <li>Marks this enquiry as converted</li>
                            </ul>
                        </div>
                    </div>
                )}

                {/* Already Converted Message */}
                {enquiry.status === EnquiryStatus.CONVERTED_TO_LEAD && (
                    <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
                        <div className="flex items-center space-x-3 text-green-900">
                            <CheckCircleIcon className="w-8 h-8" />
                            <div>
                                <p className="font-bold text-lg">Already Converted to Lead</p>
                                <p className="text-green-700">This enquiry has been successfully converted to a lead.</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default EnquiryDetailsModal;
