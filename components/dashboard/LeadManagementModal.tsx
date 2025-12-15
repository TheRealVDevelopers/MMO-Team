import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import LeadManagementPage from './LeadManagementPage';

interface LeadManagementModalProps {
  isOpen: boolean;
  leadId: string;
  onClose: () => void;
}

const LeadManagementModal: React.FC<LeadManagementModalProps> = ({ isOpen, leadId, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div 
          className="relative bg-white dark:bg-kurchi-espresso-900 rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 bg-white dark:bg-kurchi-espresso-800 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-kurchi-espresso-700 transition-all"
          >
            <XMarkIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          </button>

          {/* Lead Management Page */}
          <div className="overflow-y-auto max-h-[90vh]">
            <LeadManagementPage leadId={leadId} onClose={onClose} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadManagementModal;
