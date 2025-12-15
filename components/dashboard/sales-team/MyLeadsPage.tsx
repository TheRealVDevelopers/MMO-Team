import React, { useState, useMemo } from 'react';
import { Lead, LeadPipelineStatus, LeadHistory } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import LeadDetailModal from '../../shared/LeadDetailModal';
import LeadManagementModal from '../LeadManagementModal';
import { PlusIcon, ChartBarIcon, FunnelIcon, CheckCircleIcon, ChevronRightIcon } from '../../icons/IconComponents';
import AddNewLeadModal from '../sales-manager/AddNewLeadModal';
import { USERS, formatDateTime, formatLargeNumberINR } from '../../../constants';
import StatusPill from '../../shared/StatusPill';

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

const LeadStatusPill: React.FC<{ status: LeadPipelineStatus }> = ({ status }) => {
    const color = {
        [LeadPipelineStatus.NEW_NOT_CONTACTED]: 'red',
        [LeadPipelineStatus.CONTACTED_CALL_DONE]: 'amber',
        [LeadPipelineStatus.SITE_VISIT_SCHEDULED]: 'purple',
        [LeadPipelineStatus.WAITING_FOR_DRAWING]: 'slate',
        [LeadPipelineStatus.QUOTATION_SENT]: 'blue',
        [LeadPipelineStatus.NEGOTIATION]: 'amber',
        [LeadPipelineStatus.IN_PROCUREMENT]: 'purple',
        [LeadPipelineStatus.IN_EXECUTION]: 'amber',
        [LeadPipelineStatus.WON]: 'green',
        [LeadPipelineStatus.LOST]: 'slate',
    }[status] as 'red' | 'amber' | 'purple' | 'slate' | 'blue' | 'green';
    return <StatusPill color={color}>{status}</StatusPill>;
};

const PriorityPill: React.FC<{ priority: 'High' | 'Medium' | 'Low' }> = ({ priority }) => {
    const color = {
        High: 'red',
        Medium: 'amber',
        Low: 'slate',
    }[priority] as 'red' | 'amber' | 'slate';
    return <StatusPill color={color}>{priority}</StatusPill>;
};

const funnelStages: LeadPipelineStatus[] = [
    LeadPipelineStatus.NEW_NOT_CONTACTED,
    LeadPipelineStatus.CONTACTED_CALL_DONE,
    LeadPipelineStatus.SITE_VISIT_SCHEDULED,
    LeadPipelineStatus.WAITING_FOR_DRAWING,
    LeadPipelineStatus.QUOTATION_SENT,
    LeadPipelineStatus.NEGOTIATION,
];

const FunnelStage: React.FC<{ stage: LeadPipelineStatus, count: number, isActive: boolean, onClick: () => void }> = ({ stage, count, isActive, onClick }) => {
    const colorClasses: Record<LeadPipelineStatus, { bg: string, border: string, text: string }> = {
        [LeadPipelineStatus.NEW_NOT_CONTACTED]: { bg: 'bg-error/10', border: 'border-error', text: 'text-error' },
        [LeadPipelineStatus.CONTACTED_CALL_DONE]: { bg: 'bg-accent/10', border: 'border-accent', text: 'text-accent' },
        [LeadPipelineStatus.SITE_VISIT_SCHEDULED]: { bg: 'bg-purple/10', border: 'border-purple', text: 'text-purple' },
        [LeadPipelineStatus.WAITING_FOR_DRAWING]: { bg: 'bg-slate-500/10', border: 'border-slate-500', text: 'text-slate-500' },
        [LeadPipelineStatus.QUOTATION_SENT]: { bg: 'bg-primary/10', border: 'border-primary', text: 'text-primary' },
        [LeadPipelineStatus.NEGOTIATION]: { bg: 'bg-accent/10', border: 'border-accent', text: 'text-accent' },
        [LeadPipelineStatus.IN_PROCUREMENT]: { bg: 'bg-purple/10', border: 'border-purple', text: 'text-purple' },
        [LeadPipelineStatus.IN_EXECUTION]: { bg: 'bg-accent/10', border: 'border-accent', text: 'text-accent' },
        [LeadPipelineStatus.WON]: { bg: 'bg-secondary/10', border: 'border-secondary', text: 'text-secondary' },
        [LeadPipelineStatus.LOST]: { bg: 'bg-slate-400/10', border: 'border-slate-400', text: 'text-slate-400' },
    };

    const classes = colorClasses[stage] || { bg: 'bg-gray-100', border: 'border-gray-400', text: 'text-gray-600' };

    return (
        <button
            onClick={onClick}
            className={`flex-shrink-0 p-3 rounded-lg border-2 text-center transition-colors w-40 ${isActive ? `${classes.bg} ${classes.border}` : 'bg-surface border-border hover:border-gray-300'}`}
        >
            <div className={`text-2xl font-bold ${isActive ? classes.text : 'text-text-primary'}`}>{count}</div>
            <div className={`text-xs font-semibold truncate ${isActive ? classes.text : 'text-text-secondary'}`}>{stage}</div>
        </button>
    );
};


const MyLeadsPage: React.FC<MyLeadsPageProps> = ({ leads, onUpdateLead, onAddNewLead }) => {
  const { currentUser } = useAuth();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [showManagementModal, setShowManagementModal] = useState(false);
  const [isAddLeadModalOpen, setAddLeadModalOpen] = useState(false);
  const [selectedStage, setSelectedStage] = useState<LeadPipelineStatus | 'All'>('All');
  
  const handleAddLead = (
    newLeadData: Omit<Lead, 'id' | 'status' | 'inquiryDate' | 'history' | 'lastContacted'>,
    reminder?: { date: string; notes: string }
  ) => {
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

    if (reminder && reminder.date && reminder.notes) {
        newLead.reminders = [{
            id: `rem-${Date.now()}`,
            date: new Date(reminder.date),
            notes: reminder.notes,
            completed: false,
        }];
        newLead.history.push({
            action: 'Reminder set upon creation',
            user: currentUser?.name || 'System',
            timestamp: new Date(),
            notes: `For ${new Date(reminder.date).toLocaleString()}: ${reminder.notes}`
        });
    }

    onAddNewLead(newLead);
  };
  
  const pipelineCounts = useMemo(() => {
    return leads.reduce((acc, lead) => {
        acc[lead.status] = (acc[lead.status] || 0) + 1;
        return acc;
    }, {} as Record<LeadPipelineStatus, number>);
  }, [leads]);

  const filteredLeads = useMemo(() => {
    if (selectedStage === 'All') return leads;
    return leads.filter(lead => lead.status === selectedStage);
  }, [leads, selectedStage]);

  // Stats calculation
  const totalLeads = leads.length;
  const wonLeads = leads.filter(l => l.status === LeadPipelineStatus.WON).length;
  const conversionRate = totalLeads > 0 ? (wonLeads / totalLeads) * 100 : 0;
  const newLeadsCount = pipelineCounts[LeadPipelineStatus.NEW_NOT_CONTACTED] || 0;

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
        
        <div className="mb-6 bg-surface p-4 rounded-lg shadow-sm">
            <div className="flex items-center overflow-x-auto pb-2 space-x-2">
                <button 
                    onClick={() => setSelectedStage('All')}
                    className={`flex-shrink-0 p-3 rounded-lg border-2 text-center transition-colors w-40 ${selectedStage === 'All' ? 'bg-primary/10 border-primary' : 'bg-surface border-border hover:border-gray-300'}`}
                >
                    <div className={`text-2xl font-bold ${selectedStage === 'All' ? 'text-primary' : 'text-text-primary'}`}>{leads.length}</div>
                    <div className={`text-xs font-semibold truncate ${selectedStage === 'All' ? 'text-primary' : 'text-text-secondary'}`}>All Leads</div>
                </button>
                <ChevronRightIcon className="w-5 h-5 text-text-secondary/50 flex-shrink-0" />
                
                {funnelStages.map((stage, index) => (
                    <React.Fragment key={stage}>
                        <FunnelStage
                            stage={stage}
                            count={pipelineCounts[stage] || 0}
                            isActive={selectedStage === stage}
                            onClick={() => setSelectedStage(stage)}
                        />
                        {index < funnelStages.length - 1 && <ChevronRightIcon className="w-5 h-5 text-text-secondary/50 flex-shrink-0" />}
                    </React.Fragment>
                ))}
                
                <ChevronRightIcon className="w-5 h-5 text-text-secondary/50 flex-shrink-0" />
                
                <div className="flex flex-col space-y-2">
                    <FunnelStage
                        stage={LeadPipelineStatus.WON}
                        count={pipelineCounts[LeadPipelineStatus.WON] || 0}
                        isActive={selectedStage === LeadPipelineStatus.WON}
                        onClick={() => setSelectedStage(LeadPipelineStatus.WON)}
                    />
                    <FunnelStage
                        stage={LeadPipelineStatus.LOST}
                        count={pipelineCounts[LeadPipelineStatus.LOST] || 0}
                        isActive={selectedStage === LeadPipelineStatus.LOST}
                        onClick={() => setSelectedStage(LeadPipelineStatus.LOST)}
                    />
                </div>
            </div>
        </div>

        <div className="bg-surface rounded-lg shadow-sm flex-1 flex flex-col min-h-0">
            <h3 className="text-lg font-bold p-4 border-b border-border">
                {selectedStage === 'All' ? 'All My Leads' : `Leads: ${selectedStage}`} ({filteredLeads.length})
            </h3>
            <div className="overflow-auto">
                <table className="min-w-full divide-y divide-border">
                    <thead className="bg-subtle-background sticky top-0">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Client / Project</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Priority</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Value</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Status</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Last Activity</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-surface divide-y divide-border">
                        {filteredLeads.map(lead => (
                            <tr key={lead.id} className="hover:bg-subtle-background">
                                <td className="px-4 py-3 whitespace-nowrap cursor-pointer" onClick={() => setSelectedLead(lead)}>
                                    <p className="text-sm font-bold text-text-primary">{lead.clientName}</p>
                                    <p className="text-xs text-text-secondary">{lead.projectName}</p>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap"><PriorityPill priority={lead.priority} /></td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-text-primary">{formatLargeNumberINR(lead.value)}</td>
                                <td className="px-4 py-3 whitespace-nowrap"><LeadStatusPill status={lead.status} /></td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-text-secondary">{lead.history.length > 0 ? formatDateTime(lead.history[lead.history.length - 1].timestamp) : 'N/A'}</td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                    <button
                                        onClick={() => {
                                            setSelectedLeadId(lead.id);
                                            setShowManagementModal(true);
                                        }}
                                        className="bg-kurchi-gold-500 text-white px-3 py-1 rounded-lg text-xs font-semibold hover:bg-kurchi-gold-600 transition-all"
                                    >
                                        Manage
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {filteredLeads.length === 0 && <div className="text-center py-10 text-text-secondary">No leads in this stage.</div>}
            </div>
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
      {selectedLeadId && (
        <LeadManagementModal
          isOpen={showManagementModal}
          leadId={selectedLeadId}
          onClose={() => {
            setShowManagementModal(false);
            setSelectedLeadId(null);
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