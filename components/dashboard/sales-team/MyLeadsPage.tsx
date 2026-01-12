import React, { useState, useMemo } from 'react';
import { Lead, LeadPipelineStatus } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import LeadDetailModal from '../../shared/LeadDetailModal';


import {
  PlusIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  IdentificationIcon,
  ArrowPathIcon,
  BriefcaseIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';
import RaiseRequestModal from './RaiseRequestModal';


import { USERS, formatDateTime, formatLargeNumberINR } from '../../../constants';
import {
  StatCard,
  ContentCard,
  PrimaryButton,
  cn,
  staggerContainer
} from '../shared/DashboardUI';
import { motion, AnimatePresence } from 'framer-motion';

interface MyLeadsPageProps {
  leads: Lead[];
  onUpdateLead: (lead: Lead) => void;
  onAddNewLead: (lead: Lead) => void;
}

const LeadStatusPill: React.FC<{ status: LeadPipelineStatus }> = ({ status }) => {
  const statusConfig = {
    [LeadPipelineStatus.NEW_NOT_CONTACTED]: { color: 'text-error bg-error/10', label: 'New' },
    [LeadPipelineStatus.CONTACTED_CALL_DONE]: { color: 'text-accent bg-accent/10', label: 'Contacted' },
    [LeadPipelineStatus.SITE_VISIT_SCHEDULED]: { color: 'text-purple bg-purple/10', label: 'Site Visit' },
    [LeadPipelineStatus.WAITING_FOR_DRAWING]: { color: 'text-kurchi-gold-600 bg-kurchi-gold-400/10', label: 'Drawing' },
    [LeadPipelineStatus.QUOTATION_SENT]: { color: 'text-primary bg-primary/10', label: 'Quotation' },
    [LeadPipelineStatus.NEGOTIATION]: { color: 'text-amber-500 bg-amber-500/10', label: 'Negotiation' },
    [LeadPipelineStatus.IN_PROCUREMENT]: { color: 'text-purple bg-purple/10', label: 'Procurement' },
    [LeadPipelineStatus.IN_EXECUTION]: { color: 'text-accent bg-accent/10', label: 'Execution' },
    [LeadPipelineStatus.WON]: { color: 'text-secondary bg-secondary/10', label: 'Won' },
    [LeadPipelineStatus.LOST]: { color: 'text-slate-400 bg-slate-400/10', label: 'Lost' },
  }[status];

  return (
    <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider", statusConfig.color)}>
      {statusConfig.label}
    </span>
  );
};

const funnelStages = [
  { stage: 'All', icon: <IdentificationIcon className="w-4 h-4" /> },
  { stage: LeadPipelineStatus.NEW_NOT_CONTACTED, icon: <PlusIcon className="w-4 h-4" /> },
  { stage: LeadPipelineStatus.CONTACTED_CALL_DONE, icon: <ArrowPathIcon className="w-4 h-4" /> },
  { stage: LeadPipelineStatus.SITE_VISIT_SCHEDULED, icon: <MagnifyingGlassIcon className="w-4 h-4" /> },
  { stage: LeadPipelineStatus.QUOTATION_SENT, icon: <BriefcaseIcon className="w-4 h-4" /> },
  { stage: LeadPipelineStatus.WON, icon: <CheckCircleIcon className="w-4 h-4" /> },
];

const MyLeadsPage: React.FC<MyLeadsPageProps> = ({ leads, onUpdateLead, onAddNewLead }) => {
  const { currentUser } = useAuth();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [showRaiseRequestModal, setShowRaiseRequestModal] = useState(false); // Restored state
  const [isAddLeadModalOpen, setAddLeadModalOpen] = useState(false);

  // Divide leads into two categories
  const newLeads = useMemo(() => {
    return leads.filter(lead =>
      [
        LeadPipelineStatus.NEW_NOT_CONTACTED,
        LeadPipelineStatus.CONTACTED_CALL_DONE,
        LeadPipelineStatus.SITE_VISIT_SCHEDULED,
        LeadPipelineStatus.WAITING_FOR_DRAWING,
        LeadPipelineStatus.QUOTATION_SENT,
        LeadPipelineStatus.NEGOTIATION
      ].includes(lead.status)
    );
  }, [leads]);

  const ongoingProjects = useMemo(() => {
    return leads.filter(lead =>
      [
        LeadPipelineStatus.IN_PROCUREMENT,
        LeadPipelineStatus.IN_EXECUTION,
        LeadPipelineStatus.WON,
        LeadPipelineStatus.LOST // Optionally include lost here or separate
      ].includes(lead.status)
    );
  }, [leads]);

  // Statistics
  const totalLeads = leads.length;
  const wonLeads = leads.filter(l => l.status === LeadPipelineStatus.WON).length;
  const conversionRate = totalLeads > 0 ? (wonLeads / totalLeads) * 100 : 0;
  const newLeadsCount = newLeads.length;

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-8 pb-12"
    >
      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Active Registry" value={totalLeads} icon={<IdentificationIcon className="w-6 h-6" />} color="primary" trend={{ value: "12%", positive: true }} />
        <StatCard title="New Opportunities" value={newLeadsCount} icon={<PlusIcon className="w-6 h-6" />} color="accent" />
        <StatCard title="Conversion Efficiency" value={`${conversionRate.toFixed(1)}%`} icon={<ChartBarIcon className="w-6 h-6" />} color="purple" trend={{ value: "4%", positive: true }} />
        <StatCard title="Successful Closures" value={wonLeads} icon={<CheckCircleIcon className="w-6 h-6" />} color="secondary" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Column 1: New Leads */}
        <ContentCard className="p-0 overflow-hidden h-full flex flex-col">
          <div className="p-6 border-b border-border bg-surface sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center text-accent">
                <PlusIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-serif font-bold text-text-primary">New Leads</h3>
                <p className="text-xs text-text-secondary font-light">Not yet in active project</p>
              </div>
            </div>
          </div>
          <div className="overflow-y-auto flex-1 min-h-[400px] max-h-[800px]">
            {newLeads.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-sm text-text-secondary">No new leads pending interaction.</p>
              </div>
            ) : (
              <table className="w-full">
                <tbody className="divide-y divide-border/60">
                  {newLeads.map(lead => (
                    <tr key={lead.id} className="group hover:bg-primary/[0.02] cursor-pointer transition-all" onClick={() => setSelectedLead(lead)}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-subtle-background flex items-center justify-center font-bold text-accent text-xs border border-border">
                            {lead.clientName[0]}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-text-primary group-hover:text-accent transition-colors">{lead.clientName}</p>
                            <p className="text-[10px] text-text-secondary">{lead.mobile || 'No Contact'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <LeadStatusPill status={lead.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLeadId(lead.id);
                            setShowRaiseRequestModal(true);
                          }}
                          className="p-2 text-text-secondary hover:text-accent transition-colors"
                          title="Raise Request"
                        >
                          <ChevronRightIcon className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </ContentCard>

        {/* Column 2: Ongoing Projects */}
        <ContentCard className="p-0 overflow-hidden h-full flex flex-col">
          <div className="p-6 border-b border-border bg-surface sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                <BriefcaseIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-serif font-bold text-text-primary">Ongoing Projects</h3>
                <p className="text-xs text-text-secondary font-light">Active execution & monitoring</p>
              </div>
            </div>
          </div>
          <div className="overflow-y-auto flex-1 min-h-[400px] max-h-[800px]">
            {ongoingProjects.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-sm text-text-secondary">No active projects currently.</p>
              </div>
            ) : (
              <table className="w-full">
                <tbody className="divide-y divide-border/60">
                  {ongoingProjects.map(lead => (
                    <tr key={lead.id} className="group hover:bg-primary/[0.02] cursor-pointer transition-all" onClick={() => setSelectedLead(lead)}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-subtle-background flex items-center justify-center font-bold text-primary text-xs border border-border">
                            {lead.clientName[0]}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-text-primary group-hover:text-primary transition-colors">{lead.clientName}</p>
                            <p className="text-[10px] text-text-secondary uppercase tracking-tighter">{lead.projectName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <LeadStatusPill status={lead.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLeadId(lead.id);
                            setShowRaiseRequestModal(true);
                          }}
                          className="px-3 py-1.5 bg-background border border-border rounded-lg text-[10px] font-bold uppercase text-text-secondary hover:bg-primary hover:text-white hover:border-primary transition-all flex items-center gap-1 ml-auto"
                        >
                          Request
                          <ChevronRightIcon className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </ContentCard>

      </div>

      {/* Modals */}
      <LeadDetailModal
        isOpen={!!selectedLead}
        onClose={() => setSelectedLead(null)}
        lead={selectedLead!}
        onUpdate={(updatedLead) => {
          onUpdateLead(updatedLead);
          setSelectedLead(updatedLead);
        }}
      />

      <RaiseRequestModal
        isOpen={showRaiseRequestModal}
        onClose={() => {
          setShowRaiseRequestModal(false);
          setSelectedLeadId(null);
        }}
        leadId={selectedLead?.id || selectedLeadId || undefined}
        clientName={selectedLead?.clientName || leads.find(l => l.id === selectedLeadId)?.clientName}
        projectId={selectedLead?.projectName || leads.find(l => l.id === selectedLeadId)?.projectName}
      />

      <AddNewLeadModal
        isOpen={isAddLeadModalOpen}
        onClose={() => setAddLeadModalOpen(false)}
        onAddLead={(data, reminder) => {
          const newLead: Lead = {
            ...data,
            id: `lead-${Date.now()}`,
            status: LeadPipelineStatus.NEW_NOT_CONTACTED,
            inquiryDate: new Date(),
            lastContacted: 'Just now',
            history: [{ action: 'Lead Created', user: currentUser?.name || 'System', timestamp: new Date(), notes: 'Initial Registry' }],
            reminders: reminder ? [{ id: `rem-${Date.now()}`, date: new Date(reminder.date), notes: reminder.notes, completed: false }] : [],
            tasks: {},
          };
          onAddNewLead(newLead);
          setAddLeadModalOpen(false);
        }}
      />
    </motion.div>
  );
};

export default MyLeadsPage;
