import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import LeadManagementPage from './LeadManagementPage';

interface LeadManagementModalProps {
  isOpen: boolean;
  leadId: string;
  onClose: () => void;
}

import Modal from '../shared/Modal';

interface LeadManagementModalProps {
  isOpen: boolean;
  leadId: string;
  onClose: () => void;
}

const LeadManagementModal: React.FC<LeadManagementModalProps> = ({ isOpen, leadId, onClose }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Lead Management"
      size="5xl"
    >
      <div className="max-h-[85vh]">
        <LeadManagementPage leadId={leadId} onClose={onClose} />
      </div>
    </Modal>
  );
};

export default LeadManagementModal;
