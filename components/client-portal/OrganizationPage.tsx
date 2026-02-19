import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BuildingOfficeIcon,
  FolderIcon,
  ArrowRightIcon,
  PhoneIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';
import { db } from '../../firebase';
import { doc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { FIRESTORE_COLLECTIONS, formatCurrencyINR, safeDate } from '../../constants';
import { CaseStatus } from '../../types';
import ClientLayout from '../layout/ClientLayout';

const STATUS_LABELS: Record<string, string> = {
  [CaseStatus.LEAD]: 'Lead',
  [CaseStatus.CONTACTED]: 'Contacted',
  [CaseStatus.SITE_VISIT]: 'Site Visit',
  [CaseStatus.DRAWING]: 'Drawing',
  [CaseStatus.BOQ]: 'BOQ',
  [CaseStatus.QUOTATION]: 'Quotation',
  [CaseStatus.NEGOTIATION]: 'Negotiation',
  [CaseStatus.WAITING_FOR_PAYMENT]: 'Waiting for Payment',
  [CaseStatus.WAITING_FOR_PLANNING]: 'Waiting for Planning',
  [CaseStatus.PLANNING_SUBMITTED]: 'Planning Submitted',
  [CaseStatus.EXECUTION_ACTIVE]: 'Execution Active',
  [CaseStatus.COMPLETED]: 'Completed',
};

const ACTIVE_STATUSES: string[] = [
  CaseStatus.EXECUTION_ACTIVE,
  CaseStatus.PLANNING_SUBMITTED,
  CaseStatus.DRAWING,
  CaseStatus.BOQ,
  CaseStatus.QUOTATION,
  CaseStatus.NEGOTIATION,
  CaseStatus.WAITING_FOR_PAYMENT,
  CaseStatus.WAITING_FOR_PLANNING,
];

function getProjectStatusVariant(status: string): 'waiting' | 'active' | 'delayed' | 'completed' {
  if (status === CaseStatus.COMPLETED) return 'completed';
  if (ACTIVE_STATUSES.includes(status)) {
    if (status === CaseStatus.EXECUTION_ACTIVE) return 'active';
    return 'waiting';
  }
  return 'delayed';
}

interface OrganizationPageProps {
  orgId: string;
  onBack: () => void;
  onOpenProject: (caseId: string) => void;
  onLogout: () => void;
}

const OrganizationPage: React.FC<OrganizationPageProps> = ({
  orgId,
  onBack,
  onOpenProject,
  onLogout,
}) => {
  const [org, setOrg] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db || !orgId?.trim()) return;
    const unsubOrg = onSnapshot(
      doc(db, FIRESTORE_COLLECTIONS.ORGANIZATIONS, orgId),
      (snap) => {
        if (snap.exists()) setOrg({ id: snap.id, ...snap.data() });
      }
    );
    const q = query(
      collection(db, FIRESTORE_COLLECTIONS.CASES),
      where('organizationId', '==', orgId),
      where('isProject', '==', true)
    );
    const unsubCases = onSnapshot(q, (snap) => {
      setProjects(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => {
      unsubOrg();
      unsubCases();
    };
  }, [orgId]);

  const { totalProjects, activeCount, completedCount } = useMemo(() => {
    const active = projects.filter((p) => ACTIVE_STATUSES.includes(p.status));
    const completed = projects.filter((p) => p.status === CaseStatus.COMPLETED);
    return {
      totalProjects: projects.length,
      activeCount: active.length,
      completedCount: completed.length,
    };
  }, [projects]);

  if (loading && !org) {
    return (
      <ClientLayout onLogout={onLogout} onBack={onBack} backLabel="Back to Organizations" title="Organization">
        <div className="flex-1 flex items-center justify-center p-10">
          <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
        </div>
      </ClientLayout>
    );
  }

  const orgName = org?.name || 'Organization';

  return (
    <ClientLayout onLogout={onLogout} onBack={onBack} backLabel="Back to Organizations" title="Organization">
      <div className="w-full max-w-6xl mx-auto px-6 lg:px-10 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm mb-6 border-b border-slate-200 pb-4">
          <button type="button" onClick={onBack} className="font-medium text-[#111111] hover:text-green-600 transition-colors">
            Organizations
          </button>
          <span className="text-slate-400">/</span>
          <span className="font-semibold text-[#111111] truncate">{orgName}</span>
        </nav>

        {/* Section 1 – Organization Hero Card (full width) */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-[20px] border border-slate-200/80 shadow-md overflow-hidden mb-10"
        >
          <div className="p-6 lg:p-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            {/* Left: Icon, name, contact, phone, location */}
            <div className="flex items-start gap-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-green-500/20">
                <BuildingOfficeIcon className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-[28px] font-bold text-[#111111] tracking-tight">{orgName}</h1>
                {org?.contactPerson && (
                  <p className="text-[#111111] text-sm font-medium mt-1">Contact: {org.contactPerson}</p>
                )}
                <div className="mt-4 space-y-2">
                  {(org?.phone || org?.contactPhone) && (
                    <div className="flex items-center gap-2 text-[#111111] text-[13px]">
                      <PhoneIcon className="w-4 h-4 text-slate-500" />
                      <span>{org.phone || org.contactPhone}</span>
                    </div>
                  )}
                  {org?.address && (
                    <div className="flex items-start gap-2 text-[#111111] text-[13px]">
                      <MapPinIcon className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                      <span>{org.address}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: 3 stat cards */}
            <div className="flex flex-wrap gap-4 lg:gap-6">
              {[
                { label: 'Total Projects', value: totalProjects, bg: 'bg-slate-50', labelCls: 'text-[#111111]', valueCls: 'text-[#111111]' },
                { label: 'Active', value: activeCount, bg: 'bg-green-50', labelCls: 'text-green-700', valueCls: 'text-green-800' },
                { label: 'Completed', value: completedCount, bg: 'bg-slate-50', labelCls: 'text-[#111111]', valueCls: 'text-[#111111]' },
              ].map((stat) => (
                <motion.div
                  key={stat.label}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className={`${stat.bg} rounded-2xl px-6 py-5 min-w-[140px] shadow-sm hover:shadow-md transition-shadow border border-slate-100`}
                >
                  <p className={`text-[22px] font-bold ${stat.valueCls}`}>{stat.value}</p>
                  <p className={`text-[13px] font-medium mt-1 ${stat.labelCls}`}>{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Section 2 – Projects Under This Organization */}
        <section className="mt-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1 bg-slate-200" />
            <h2 className="text-lg font-semibold text-[#111111] whitespace-nowrap">Projects Under This Organization</h2>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          {projects.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-[20px] border-2 border-dashed border-slate-200 p-16 text-center"
            >
              <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-slate-100 flex items-center justify-center">
                <FolderIcon className="w-10 h-10 text-slate-400" />
              </div>
              <p className="text-[#111111] font-semibold text-lg">No projects yet</p>
              <p className="text-[#111111] text-sm mt-2 max-w-sm mx-auto opacity-90">
                Projects linked to this organization will appear here. Ask your team to add a project to get started.
              </p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {projects.map((proj) => {
                const isActive = ACTIVE_STATUSES.includes(proj.status);
                const completion = proj.completionPercent ?? 0;
                const variant = getProjectStatusVariant(proj.status);
                const budget = proj.financial?.totalBudget ?? proj.budget ?? 0;

                const variantStyles = {
                  waiting: {
                    badge: 'bg-blue-100 text-blue-800',
                    border: 'border-l-blue-500',
                    card: 'hover:border-blue-200',
                  },
                  active: {
                    badge: 'bg-green-100 text-green-800',
                    border: 'border-l-green-500',
                    card: 'hover:border-green-200',
                  },
                  delayed: {
                    badge: 'bg-amber-100 text-amber-800',
                    border: 'border-l-amber-500',
                    card: 'hover:border-amber-200',
                  },
                  completed: {
                    badge: 'bg-slate-100 text-[#111111]',
                    border: 'border-l-slate-400',
                    card: 'hover:border-slate-300',
                  },
                };
                const style = variantStyles[variant];

                const r = 20;
                const circumference = 2 * Math.PI * r;
                const strokeDash = (Math.min(100, Math.max(0, completion)) / 100) * circumference;

                return (
                  <motion.button
                    key={proj.id}
                    type="button"
                    onClick={() => onOpenProject(proj.id)}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -2, transition: { duration: 0.2 } }}
                    whileTap={{ scale: 0.99 }}
                    className={`text-left bg-white rounded-[20px] border border-slate-200 border-l-4 ${style.border} p-6 shadow-sm hover:shadow-lg transition-all duration-300 group ${style.card}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-[#111111] truncate text-lg group-hover:text-green-700 transition-colors">
                          {proj.clientName || proj.title || 'Unnamed Project'}
                        </h3>
                        <span className={`inline-flex mt-2 px-3 py-1 rounded-full text-xs font-medium ${style.badge}`}>
                          {STATUS_LABELS[proj.status] || proj.status}
                        </span>
                      </div>
                      <ArrowRightIcon className="w-5 h-5 text-slate-400 group-hover:text-green-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
                    </div>

                    <div className="mt-5 flex items-center gap-4">
                      <div className="relative w-12 h-12 flex-shrink-0">
                        <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                          <circle cx="24" cy="24" r={r} fill="none" stroke="#e2e8f0" strokeWidth="4" />
                          <circle
                            cx="24"
                            cy="24"
                            r={r}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="4"
                            strokeDasharray={`${strokeDash} ${circumference}`}
                            strokeLinecap="round"
                            className="text-green-500"
                          />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-[#111111]">
                          {Math.min(100, Math.max(0, completion))}%
                        </span>
                      </div>
                      <div className="space-y-0.5 text-[13px] text-[#111111] min-w-0">
                        <p>Completion: {completion}%</p>
                        {budget > 0 && (
                          <p className="font-medium">Budget: {formatCurrencyINR(budget)}</p>
                        )}
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </ClientLayout>
  );
};

export default OrganizationPage;
