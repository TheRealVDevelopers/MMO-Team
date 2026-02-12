import React, { useState, useEffect } from 'react';
import Modal from '../../shared/Modal';
import { Case, CaseStatus } from '../../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  project: Case | null;
  onSave: (updatedData: Partial<Case>) => Promise<void>;
}

const ProjectEditModal: React.FC<Props> = ({ isOpen, onClose, project, onSave }) => {
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [siteAddress, setSiteAddress] = useState('');
  const [totalBudget, setTotalBudget] = useState(0);
  const [status, setStatus] = useState<CaseStatus>(CaseStatus.LEAD);
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (project) {
      setClientName(project.clientName || '');
      setClientEmail(project.clientEmail || '');
      setClientPhone(project.clientPhone || '');
      setSiteAddress(project.siteAddress || '');
      setTotalBudget(project.budget?.totalBudget || 0);
      setStatus(project.status || CaseStatus.LEAD);
      setTitle(project.title || '');
    }
  }, [project]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;

    setSaving(true);
    try {
      await onSave({
        clientName,
        clientEmail,
        clientPhone,
        siteAddress,
        title,
        status,
        budget: {
          totalBudget,
          allocated: project.budget?.allocated || 0,
          approved: project.budget?.approved || false,
          approvedBy: project.budget?.approvedBy,
          approvedAt: project.budget?.approvedAt
        }
      });
      onClose();
    } catch (error) {
      console.error('Error updating project:', error);
      alert('Failed to update project.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !project) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Project">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Client Name *</label>
          <input
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Phone</label>
            <input
              type="tel"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Site Address</label>
          <textarea
            value={siteAddress}
            onChange={(e) => setSiteAddress(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg"
            rows={2}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Total Budget (₹)</label>
            <input
              type="number"
              min="0"
              value={totalBudget}
              onChange={(e) => setTotalBudget(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as CaseStatus)}
              className="w-full px-3 py-2 border border-border rounded-lg"
            >
              <option value={CaseStatus.LEAD}>Lead</option>
              <option value={CaseStatus.DRAWING}>Drawing</option>
              <option value={CaseStatus.BOQ}>BOQ</option>
              <option value={CaseStatus.QUOTATION}>Quotation</option>
              <option value={CaseStatus.NEGOTIATION}>Negotiation</option>
              <option value={CaseStatus.WAITING_FOR_PAYMENT}>Waiting for Payment</option>
              <option value={CaseStatus.WAITING_FOR_PLANNING}>Waiting for Planning</option>
              <option value={CaseStatus.EXECUTION_ACTIVE}>Active</option>
              <option value={CaseStatus.COMPLETED}>Completed</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Project Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg"
            placeholder="Project title..."
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-border rounded-lg hover:bg-background"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ProjectEditModal;
