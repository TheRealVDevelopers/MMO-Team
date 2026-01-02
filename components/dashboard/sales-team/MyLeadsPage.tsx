import React, { useState, useMemo } from 'react';
import { Lead, LeadPipelineStatus } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import LeadDetailModal from '../../shared/LeadDetailModal';
import LeadManagementModal from '../LeadManagementModal';
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
import AddNewLeadModal from '../sales-manager/AddNewLeadModal';
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
  const [showManagementModal, setShowManagementModal] = useState(false);
  const [isAddLeadModalOpen, setAddLeadModalOpen] = useState(false);
  const [selectedStage, setSelectedStage] = useState<string>('All');

  const pipelineCounts = useMemo(() => {
    return leads.reduce((acc, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [leads]);

  const filteredLeads = useMemo(() => {
    if (selectedStage === 'All') return leads;
    return leads.filter(lead => lead.status === selectedStage);
  }, [leads, selectedStage]);

  const totalLeads = leads.length;
  const wonLeads = leads.filter(l => l.status === LeadPipelineStatus.WON).length;
  const conversionRate = totalLeads > 0 ? (wonLeads / totalLeads) * 100 : 0;
  const newLeadsCount = pipelineCounts[LeadPipelineStatus.NEW_NOT_CONTACTED] || 0;

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-8 pb-12"
    >
      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Active Registry" value={totalLeads} icon={<IdentificationIcon />} type="primary" trend={{ value: 12, isPositive: true }} />
        <StatCard title="New Opportunities" value={newLeadsCount} icon={<PlusIcon />} type="accent" />
        <StatCard title="Conversion Efficiency" value={`${conversionRate.toFixed(1)}%`} icon={<ChartBarIcon />} type="purple" trend={{ value: 4, isPositive: true }} />
        <StatCard title="Successful Closures" value={wonLeads} icon={<CheckCircleIcon />} type="secondary" />
      </div>

      {/* Funnel Navigation */}
      <ContentCard className="overflow-hidden p-1.5 bg-subtle-background/30 border-transparent shadow-none">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {funnelStages.map((config) => (
            <button
              key={config.stage}
              onClick={() => setSelectedStage(config.stage)}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-bold transition-all whitespace-nowrap",
                selectedStage === config.stage
                  ? "bg-surface text-primary shadow-sm border border-primary/10"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface/50"
              )}
            >
              <span className={cn("p-1.5 rounded-lg", selectedStage === config.stage ? "bg-primary/10 text-primary" : "bg-transparent text-text-secondary")}>
                {config.icon}
              </span>
              {config.stage}
              <span className={cn(
                "ml-2 px-2 py-0.5 rounded-full text-[10px]",
                selectedStage === config.stage ? "bg-primary text-white" : "bg-border text-text-secondary"
              )}>
                {config.stage === 'All' ? totalLeads : (pipelineCounts[config.stage] || 0)}
              </span>
            </button>
          ))}
        </div>
      </ContentCard>

      {/* Registry Table */}
      <ContentCard className="p-0 overflow-hidden">
        <div className="p-6 border-b border-border flex justify-between items-center bg-surface">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <IdentificationIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-serif font-bold text-text-primary">Opportunity Registry</h3>
              <p className="text-xs text-text-secondary font-light">Listing {filteredLeads.length} active engagements</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2.5 text-text-secondary hover:text-primary transition-colors rounded-xl border border-border bg-background">
              <MagnifyingGlassIcon className="w-4 h-4" />
            </button>
            <button className="p-2.5 text-text-secondary hover:text-primary transition-colors rounded-xl border border-border bg-background">
              <AdjustmentsHorizontalIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-subtle-background/50 border-b border-border">
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-text-secondary">Engagement Client</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-text-secondary">Financial Value</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-text-secondary">Current Status</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-text-secondary">Last Interaction</th>
                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-text-secondary">Management</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              <AnimatePresence mode="popLayout">
                {filteredLeads.map((lead) => (
                  <motion.tr
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    key={lead.id}
                    className="group hover:bg-primary/[0.02] cursor-pointer transition-all"
                  >
                    <td className="px-6 py-5" onClick={() => setSelectedLead(lead)}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-subtle-background flex items-center justify-center font-bold text-primary border border-border group-hover:border-primary/20 transition-all">
                          {lead.clientName[0]}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-text-primary group-hover:text-primary transition-colors">{lead.clientName}</p>
                          <p className="text-[10px] text-text-secondary uppercase tracking-tighter mt-0.5">{lead.projectName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-sm font-bold text-text-primary">
                        {formatLargeNumberINR(lead.value)}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <LeadStatusPill status={lead.status} />
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-xs text-text-secondary">
                        <ArrowPathIcon className="w-3 h-3 text-primary/40" />
                        {lead.history.length > 0 ? formatDateTime(lead.history[lead.history.length - 1].timestamp) : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLeadId(lead.id);
                          setShowManagementModal(true);
                        }}
                        className="px-4 py-2 bg-background border border-border rounded-xl text-[10px] font-black uppercase tracking-widest text-text-secondary hover:bg-primary hover:text-white hover:border-primary transition-all flex items-center gap-2 ml-auto group/btn"
                      >
                        Manage Hub
                        <ChevronRightIcon className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        {filteredLeads.length === 0 && (
          <div className="text-center py-20 bg-surface">
            <div className="w-16 h-16 bg-subtle-background rounded-2xl flex items-center justify-center mx-auto mb-4 border border-border">
              <IdentificationIcon className="w-8 h-8 text-text-secondary/20" />
            </div>
            <p className="text-sm text-text-secondary font-medium uppercase tracking-widest">No matching Registry Entries found</p>
          </div>
        )}
      </ContentCard>

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
      <LeadManagementModal
        isOpen={showManagementModal}
        leadId={selectedLeadId!}
        onClose={() => {
          setShowManagementModal(false);
          setSelectedLeadId(null);
        }}
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
