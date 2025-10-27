import React, { useState, useMemo } from 'react';
import { Lead, LeadPipelineStatus, LeadHistory } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import LeadCard from './LeadCard';
import LeadDetailModal from '../../shared/LeadDetailModal';
import { PlusIcon, ChartBarIcon, FunnelIcon, CheckCircleIcon } from '../../icons/IconComponents';
import AddNewLeadModal from '../sales-manager/AddNewLeadModal';
import { USERS } from '../../../constants';

interface MyLeadsPageProps {
  leads: Lead[];
  onUpdateLead: (lead: Lead) => void;
  onAddNewLead: (lead: Lead) => void;
}

const KpiCard: React.FC<{ title: string; value: string; icon: React.ReactNode }> = ({ title, value, icon }) => (
  <div className="bg-surface p-4 rounded-lg shadow-sm flex items-center">
    <div className="p-3 rounded-full bg-primary-subtle-background text-primary mr-4">{icon}</div>
    <div>
      <p className="text-sm font-medium text-text-secondary">{title}</p>
      <p className="text-2xl font-bold text-text-primary">{value}</p>
    </div>
  </div>
);

const orderedColumnTitles: ('New Leads' | 'In Progress' | 'Won' | 'Lost')[] = [
    'New Leads',
    'In Progress',
    'Won',
    'Lost',
];

const MyLeadsPage: React.FC<MyLeadsPageProps> = ({ leads, onUpdateLead, onAddNewLead }) => {
  const { currentUser } = useAuth();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isAddLeadModalOpen, setAddLeadModalOpen] = useState(false);
  
  const inProgressStatuses: LeadPipelineStatus[] = [
    LeadPipelineStatus.CONTACTED_CALL_DONE,
    LeadPipelineStatus.SITE_VISIT_SCHEDULED,
    LeadPipelineStatus.WAITING_FOR_DRAWING,
    LeadPipelineStatus.QUOTATION_SENT,
    LeadPipelineStatus.NEGOTIATION,
    LeadPipelineStatus.IN_PROCUREMENT,
    LeadPipelineStatus.IN_EXECUTION,
  ];

  const leadsByColumn = useMemo(() => {
    const grouped: Record<string, Lead[]> = {
      'New Leads': [],
      'In Progress': [],
      'Won': [],
      'Lost': [],
    };

    leads.forEach(lead => {
      if (lead.status === LeadPipelineStatus.NEW_NOT_CONTACTED) {
        grouped['New Leads'].push(lead);
      } else if (inProgressStatuses.includes(lead.status)) {
        grouped['In Progress'].push(lead);
      } else if (lead.status === LeadPipelineStatus.WON) {
        grouped['Won'].push(lead);
      } else if (lead.status === LeadPipelineStatus.LOST) {
        grouped['Lost'].push(lead);
      }
    });

    return grouped;
  }, [leads]);

  const handleAddLead = (newLeadData: Omit<Lead, 'id' | 'status' | 'inquiryDate' | 'history' | 'lastContacted'>) => {
    const newLead: Lead = {
      ...newLeadData,
      id: `lead-${Date.now()}`,
      status: LeadPipelineStatus.NEW_NOT_CONTACTED,
      inquiryDate: new Date(),
      lastContacted: 'Just now',
      history: [
        {
          action: 'Lead Created',
          user: currentUser?.name || 'System',
          timestamp: new Date(),
          notes: `Assigned to ${USERS.find(u => u.id === newLeadData.assignedTo)?.name}`
        }
      ],
      reminders: [],
      tasks: {},
    };
    onAddNewLead(newLead);
  };
  
  // Stats calculation
  const totalLeads = leads.length;
  const wonLeads = leads.filter(l => l.status === LeadPipelineStatus.WON).length;
  const conversionRate = totalLeads > 0 ? (wonLeads / totalLeads) * 100 : 0;
  const newLeadsCount = leadsByColumn['New Leads']?.length || 0;

  return (
    <>
      <div className="flex flex-col h-full p-4 sm:p-6 lg:p-8 bg-subtle-background">
        <div className="flex-shrink-0 mb-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <h2 className="text-2xl font-bold text-text-primary">My Leads</h2>
                <button onClick={() => setAddLeadModalOpen(true)} className="flex items-center space-x-2 bg-primary text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700">
                    <PlusIcon className="w-4 h-4" />
                    <span>Add New Lead</span>
                </button>
            </div>
             <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard title="Total Leads" value={totalLeads.toString()} icon={<FunnelIcon />} />
                <KpiCard title="New Leads" value={newLeadsCount.toString()} icon={<FunnelIcon />} />
                <KpiCard title="Conversion Rate" value={`${conversionRate.toFixed(1)}%`} icon={<ChartBarIcon />} />
                <KpiCard title="Deals Won" value={wonLeads.toString()} icon={<CheckCircleIcon />} />
            </div>
        </div>
        
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 overflow-x-auto min-h-0 pb-4">
          {orderedColumnTitles.map((title) => {
            const columnLeads = leadsByColumn[title] || [];
            return (
              <div key={title} className="bg-background rounded-lg flex flex-col min-w-[300px]">
                <div className="flex justify-between items-center p-3 border-b border-border sticky top-0 bg-background z-10">
                  <h3 className="font-bold text-sm text-text-primary">{title}</h3>
                  <span className="text-xs font-semibold bg-primary-subtle-background text-primary-subtle-text px-2 py-0.5 rounded-full">{columnLeads.length}</span>
                </div>
                <div className="p-3 space-y-3 overflow-y-auto">
                  {columnLeads.map(lead => (
                    <LeadCard key={lead.id} lead={lead} onClick={() => setSelectedLead(lead)} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
      {selectedLead && (
        <LeadDetailModal
          isOpen={!!selectedLead}
          onClose={() => setSelectedLead(null)}
          lead={selectedLead}
          onUpdate={(updatedLead) => {
            onUpdateLead(updatedLead);
            setSelectedLead(updatedLead);
          }}
        />
      )}
      <AddNewLeadModal
        isOpen={isAddLeadModalOpen}
        onClose={() => setAddLeadModalOpen(false)}
        onAddLead={handleAddLead}
      />
    </>
  );
};

export default MyLeadsPage;
