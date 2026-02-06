import React, { useState, useMemo } from 'react';
import { Lead, LeadPipelineStatus } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { useSearchParams } from 'react-router-dom';
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
    [LeadPipelineStatus.SITE_VISIT_RESCHEDULED]: { color: 'text-orange-500 bg-orange-500/10', label: 'Rescheduled' },
    [LeadPipelineStatus.WAITING_FOR_DRAWING]: { color: 'text-kurchi-gold-600 bg-kurchi-gold-400/10', label: 'Drawing' },
    [LeadPipelineStatus.DRAWING_IN_PROGRESS]: { color: 'text-blue-500 bg-blue-500/10', label: 'Refining' },
    [LeadPipelineStatus.DRAWING_REVISIONS]: { color: 'text-indigo-500 bg-indigo-500/10', label: 'Revision' },
    [LeadPipelineStatus.WAITING_FOR_QUOTATION]: { color: 'text-teal-500 bg-teal-500/10', label: 'Estimation' },
    [LeadPipelineStatus.QUOTATION_SENT]: { color: 'text-primary bg-primary/10', label: 'Quotation' },
    [LeadPipelineStatus.NEGOTIATION]: { color: 'text-amber-500 bg-amber-500/10', label: 'Negotiation' },
    [LeadPipelineStatus.IN_PROCUREMENT]: { color: 'text-purple bg-purple/10', label: 'Procurement' },
    [LeadPipelineStatus.IN_EXECUTION]: { color: 'text-accent bg-accent/10', label: 'Execution' },
    [LeadPipelineStatus.WON]: { color: 'text-secondary bg-secondary/10', label: 'Won' },
    [LeadPipelineStatus.LOST]: { color: 'text-slate-400 bg-slate-400/10', label: 'Lost' },
  }[status] || { color: 'text-text-tertiary bg-subtle-background', label: status };

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
  const [showRaiseRequestModal, setShowRaiseRequestModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStage, setActiveStage] = useState('All');
  const [searchParams, setSearchParams] = useSearchParams();

  // Handle deep linking from notifications
  React.useEffect(() => {
    const leadId = searchParams.get('openLead');
    if (leadId && leads.length > 0) {
      const lead = leads.find(l => l.id === leadId);
      if (lead) {
        setSelectedLead(lead);
        // Clear param after opening
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('openLead');
        setSearchParams(newParams, { replace: true });
      }
    }
  }, [searchParams, leads, setSearchParams]);

  // Filter leads based on search and stage
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const matchesSearch =
        lead.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.projectName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStage = activeStage === 'All' || lead.status === activeStage;

      return matchesSearch && matchesStage;
    });
  }, [leads, searchQuery, activeStage]);

  // Statistics
  const totalLeads = leads.length;
  const wonLeads = leads.filter(l => l.status === LeadPipelineStatus.WON).length;
  const conversionRate = totalLeads > 0 ? (wonLeads / totalLeads) * 100 : 0;
  const hotLeads = leads.filter(l => l.priority === 'High').length;

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-8 pb-12"
    >
      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Registry" value={totalLeads} icon={<IdentificationIcon className="w-6 h-6" />} color="primary" trend={{ value: "Current", positive: true }} />
        <StatCard title="Critical Leads" value={hotLeads} icon={<PlusIcon className="w-6 h-6" />} color="accent" />
        <StatCard title="Conversion Flow" value={`${conversionRate.toFixed(1)}%`} icon={<ChartBarIcon className="w-6 h-6" />} color="purple" />
        <StatCard title="Successful Closures" value={wonLeads} icon={<CheckCircleIcon className="w-6 h-6" />} color="secondary" />
      </div>

      <div className="space-y-6">
        {/* Controls Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-surface p-6 rounded-[2rem] border border-border/60 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            {funnelStages.map((stage) => (
              <button
                key={stage.stage}
                onClick={() => setActiveStage(stage.stage)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  activeStage === stage.stage
                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                    : "text-text-tertiary hover:text-text-primary hover:bg-subtle-background"
                )}
              >
                {stage.icon}
                {stage.stage}
              </button>
            ))}
          </div>

          <div className="relative w-full lg:w-80">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search registry..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-subtle-background rounded-2xl border border-border text-sm font-medium focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-text-tertiary/50 uppercase tracking-tighter"
            />
          </div>
        </div>

        <ContentCard className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-subtle-background/50 border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-text-secondary">Client Details</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-text-secondary">Project Scope</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-text-secondary">Funnel Stage</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-text-secondary">Project Value</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-text-secondary">Last Pulse</th>
                  <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-text-secondary">Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                <AnimatePresence mode="popLayout">
                  {filteredLeads.map((lead) => (
                    <motion.tr
                      key={lead.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="group hover:bg-primary/[0.01] cursor-pointer transition-colors"
                      onClick={() => setSelectedLead(lead)}
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-subtle-background flex items-center justify-center font-bold text-primary border border-border group-hover:bg-primary group-hover:text-white transition-all">
                            {lead.clientName[0]}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-text-primary mb-0.5">{lead.clientName}</p>
                            <p className="text-10px text-text-secondary tracking-tight font-medium uppercase opacity-60">{lead.clientMobile || 'Confidential Contact'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-xs font-bold text-text-primary uppercase tracking-tighter whitespace-nowrap">{lead.projectName}</p>
                      </td>
                      <td className="px-6 py-5">
                        <LeadStatusPill status={lead.status} />
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-xs font-black text-text-primary whitespace-nowrap">{formatLargeNumberINR(lead.value)}</p>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-text-tertiary uppercase tracking-tight">
                          <ArrowPathIcon className="w-3.5 h-3.5" />
                          {formatDateTime(
                            lead.history.length > 0
                              ? lead.history[lead.history.length - 1].timestamp
                              : lead.inquiryDate
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLeadId(lead.id);
                              setShowRaiseRequestModal(true);
                            }}
                            className="px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-sm"
                          >
                            Request Service
                          </button>
                          <ChevronRightIcon className="w-4 h-4 text-text-tertiary group-hover:text-primary transition-colors" />
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
            {filteredLeads.length === 0 && (
              <div className="text-center py-32">
                <IdentificationIcon className="w-16 h-16 mx-auto text-text-tertiary/20 mb-4" />
                <p className="text-text-tertiary font-serif italic text-lg uppercase tracking-widest opacity-40 italic">"No synchronized registry records found"</p>
              </div>
            )}
          </div>
        </ContentCard>
      </div>

      {/* Modals */}
      <LeadDetailModal
        isOpen={!!selectedLead}
        onClose={() => setSelectedLead(null)}
        caseItem={selectedLead as any}
        onUpdate={(updatedLead) => {
          onUpdateLead(updatedLead as any);
          setSelectedLead(updatedLead as any);
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
    </motion.div>
  );
};

export default MyLeadsPage;
