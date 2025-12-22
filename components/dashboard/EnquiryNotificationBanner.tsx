import React from 'react';
import { BellAlertIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { ProjectEnquiry } from '../../types';

interface EnquiryNotificationBannerProps {
    newEnquiries: ProjectEnquiry[];
    onViewEnquiries: () => void;
}

const EnquiryNotificationBanner: React.FC<EnquiryNotificationBannerProps> = ({ newEnquiries, onViewEnquiries }) => {
    if (newEnquiries.length === 0) return null;

    return (
        <div className="bg-gradient-to-r from-primary to-secondary rounded-xl shadow-lg p-4 mb-6 animate-pulse-slow">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <div className="bg-white/20 rounded-full p-3">
                        <BellAlertIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-lg">
                            {newEnquiries.length} New {newEnquiries.length === 1 ? 'Enquiry' : 'Enquiries'}
                        </h3>
                        <p className="text-white/90 text-sm">
                            {newEnquiries.length === 1
                                ? 'A new project enquiry requires your attention'
                                : `${newEnquiries.length} project enquiries are waiting to be assigned`
                            }
                        </p>
                    </div>
                </div>
                <button
                    onClick={onViewEnquiries}
                    className="bg-white text-primary px-6 py-3 rounded-lg font-bold hover:bg-text-primary hover:text-white transition-all duration-300 flex items-center space-x-2 shadow-lg"
                >
                    <EnvelopeIcon className="w-5 h-5" />
                    <span>View Enquiries</span>
                </button>
            </div>
        </div>
    );
};

export default EnquiryNotificationBanner;
