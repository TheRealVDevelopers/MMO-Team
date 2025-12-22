import React, { useState } from 'react';
import Modal from '../shared/Modal';
import { ProjectEnquiry, EnquiryStatus } from '../../types';
import {
    EnvelopeIcon,
    PhoneIcon,
    MapPinIcon,
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon,
    UserPlusIcon,
    ArrowRightIcon
} from '@heroicons/react/24/outline';
import EnquiryDetailsModal from './EnquiryDetailsModal';

interface EnquiriesListModalProps {
    isOpen: boolean;
    onClose: () => void;
    enquiries: ProjectEnquiry[];
    currentUserId: string;
}

const EnquiriesListModal: React.FC<EnquiriesListModalProps> = ({
    isOpen,
    onClose,
    enquiries,
    currentUserId
}) => {
    const [selectedEnquiry, setSelectedEnquiry] = useState<ProjectEnquiry | null>(null);

    const getStatusColor = (status: EnquiryStatus) => {
        switch (status) {
            case EnquiryStatus.NEW:
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case EnquiryStatus.ASSIGNED:
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case EnquiryStatus.CONVERTED_TO_LEAD:
                return 'bg-green-100 text-green-800 border-green-200';
            case EnquiryStatus.REJECTED:
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusIcon = (status: EnquiryStatus) => {
        switch (status) {
            case EnquiryStatus.NEW:
                return <EnvelopeIcon className="w-5 h-5" />;
            case EnquiryStatus.ASSIGNED:
                return <UserPlusIcon className="w-5 h-5" />;
            case EnquiryStatus.CONVERTED_TO_LEAD:
                return <CheckCircleIcon className="w-5 h-5" />;
            case EnquiryStatus.REJECTED:
                return <XCircleIcon className="w-5 h-5" />;
            default:
                return null;
        }
    };

    const formatDate = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 60) return `${minutes} min ago`;
        if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
        return date.toLocaleDateString();
    };

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title="Project Enquiries" size="5xl">
                <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                    {enquiries.length === 0 ? (
                        <div className="text-center py-12">
                            <EnvelopeIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg">No enquiries found</p>
                        </div>
                    ) : (
                        enquiries.map((enquiry) => (
                            <div
                                key={enquiry.id}
                                className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:border-primary transition-all duration-300 cursor-pointer group"
                                onClick={() => setSelectedEnquiry(enquiry)}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        {/* Header */}
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center space-x-3">
                                                <h3 className="text-xl font-bold text-text-primary dark:text-white">
                                                    {enquiry.clientName}
                                                </h3>
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${getStatusColor(enquiry.status)} flex items-center space-x-1`}>
                                                    {getStatusIcon(enquiry.status)}
                                                    <span>{enquiry.status}</span>
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-mono text-primary dark:text-primary-hover font-bold">
                                                    {enquiry.enquiryId}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-end space-x-1 mt-1">
                                                    <ClockIcon className="w-3 h-3" />
                                                    <span>{formatDate(enquiry.createdAt)}</span>
                                                </p>
                                            </div>
                                        </div>

                                        {/* Contact Info */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                                                <EnvelopeIcon className="w-4 h-4 text-primary" />
                                                <span className="truncate">{enquiry.email}</span>
                                            </div>
                                            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                                                <PhoneIcon className="w-4 h-4 text-primary" />
                                                <span>{enquiry.mobile}</span>
                                            </div>
                                            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                                                <MapPinIcon className="w-4 h-4 text-primary" />
                                                <span>{enquiry.city}</span>
                                            </div>
                                        </div>

                                        {/* Project Details */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Project Type</p>
                                                <p className="text-sm font-bold text-text-primary dark:text-white">{enquiry.projectType}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Space</p>
                                                <p className="text-sm font-bold text-text-primary dark:text-white">{enquiry.spaceType}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Area</p>
                                                <p className="text-sm font-bold text-text-primary dark:text-white">{enquiry.area}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Budget</p>
                                                <p className="text-sm font-bold text-text-primary dark:text-white">{enquiry.budgetRange}</p>
                                            </div>
                                        </div>

                                        {/* Assigned Info */}
                                        {enquiry.status === EnquiryStatus.ASSIGNED && enquiry.assignedToName && (
                                            <div className="mt-4 flex items-center space-x-2 text-sm">
                                                <UserPlusIcon className="w-4 h-4 text-green-600" />
                                                <span className="text-gray-600 dark:text-gray-300">
                                                    Assigned to: <span className="font-bold text-text-primary dark:text-white">{enquiry.assignedToName}</span>
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Arrow Icon */}
                                    <ArrowRightIcon className="w-6 h-6 text-gray-400 group-hover:text-primary group-hover:translate-x-2 transition-all duration-300 ml-4 flex-shrink-0" />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </Modal>

            {/* Enquiry Details Modal */}
            {selectedEnquiry && (
                <EnquiryDetailsModal
                    isOpen={!!selectedEnquiry}
                    onClose={() => setSelectedEnquiry(null)}
                    enquiry={selectedEnquiry}
                    currentUserId={currentUserId}
                />
            )}
        </>
    );
};

export default EnquiriesListModal;
