import React, { useState, useMemo } from 'react';
import Modal from '../../shared/Modal';
import { USERS } from '../../../constants';
import { UserRole, Lead, User } from '../../../types';
import { MagnifyingGlassIcon, UserCircleIcon } from '../../icons/IconComponents';

const salesTeam = USERS.filter(u => u.role === UserRole.SALES_TEAM_MEMBER);

interface AssignLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  leads: Lead[];
  onAssignLead: (leadId: string, newOwnerId: string) => void;
}

const AssignLeadModal: React.FC<AssignLeadModalProps> = ({ isOpen, onClose, leads, onAssignLead }) => {
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [selectedRepId, setSelectedRepId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLeads = useMemo(() =>
    leads.filter(lead =>
      lead.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.projectName.toLowerCase().includes(searchTerm.toLowerCase())
    ), [leads, searchTerm]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadId || !selectedRepId) return;
    onAssignLead(selectedLeadId, selectedRepId);
    handleClose();
  };

  const handleClose = () => {
    setSelectedLeadId(null);
    setSelectedRepId(null);
    setSearchTerm('');
    onClose();
  }
  
  const selectedLead = useMemo(() => leads.find(l => l.id === selectedLeadId), [leads, selectedLeadId]);
  const selectedRep = useMemo(() => salesTeam.find(u => u.id === selectedRepId), [selectedRepId]);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Assign Lead" size="4xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[60vh]">
        {/* Left Panel: Leads */}
        <div className="flex flex-col border border-border rounded-lg bg-subtle-background">
          <div className="p-3 border-b border-border">
              <h3 className="font-semibold mb-2">1. Select a Lead</h3>
              <div className="relative">
                  <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"/>
                  <input
                      type="text"
                      placeholder="Search leads..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="w-full pl-9 p-2 text-sm border border-border bg-surface rounded-md"
                  />
              </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {filteredLeads.map(lead => {
                const currentOwner = USERS.find(u => u.id === lead.assignedTo);
                return (
                    <button key={lead.id} onClick={() => setSelectedLeadId(lead.id)} className={`w-full text-left p-3 rounded-md border-2 transition-colors ${selectedLeadId === lead.id ? 'bg-primary-subtle-background border-primary' : 'bg-surface border-transparent hover:border-border'}`}>
                        <p className="font-bold text-sm text-text-primary">{lead.projectName}</p>
                        <p className="text-xs text-text-secondary">{lead.clientName}</p>
                        <p className="text-xs text-text-secondary mt-1">
                            Currently: <span className="font-medium">{currentOwner?.name || 'Unassigned'}</span>
                        </p>
                    </button>
                )
            })}
          </div>
        </div>
        
        {/* Right Panel: Sales Reps */}
        <div className="flex flex-col border border-border rounded-lg bg-subtle-background">
            <div className="p-3 border-b border-border">
                <h3 className="font-semibold">2. Assign to Representative</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 gap-2 content-start">
                 {salesTeam.map(user => {
                    const leadCount = leads.filter(l => l.assignedTo === user.id).length;
                    return (
                        <button key={user.id} onClick={() => setSelectedRepId(user.id)} className={`p-3 rounded-md border-2 transition-colors text-center ${selectedRepId === user.id ? 'bg-primary-subtle-background border-primary' : 'bg-surface border-transparent hover:border-border'}`}>
                            <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full mx-auto"/>
                            <p className="font-bold text-sm mt-2 text-text-primary">{user.name}</p>
                            <p className="text-xs text-text-secondary">{leadCount} active leads</p>
                        </button>
                    )
                 })}
            </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-border flex justify-between items-center">
            <div className="text-sm text-text-secondary">
                {selectedLead && selectedRep ? (
                    <span>Assigning <span className="font-bold text-text-primary">{selectedLead.projectName}</span> to <span className="font-bold text-text-primary">{selectedRep.name}</span>.</span>
                ) : (
                    'Please select a lead and a sales representative.'
                )}
            </div>
            <div className="flex space-x-2">
                <button type="button" onClick={handleClose} className="px-4 py-2 text-sm font-medium text-text-primary bg-surface border border-border rounded-md hover:bg-subtle-background">Cancel</button>
                <button onClick={handleSubmit} disabled={!selectedLeadId || !selectedRepId} className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-secondary disabled:bg-opacity-50 disabled:cursor-not-allowed">
                    Assign Lead
                </button>
            </div>
      </div>
    </Modal>
  );
};

export default AssignLeadModal;