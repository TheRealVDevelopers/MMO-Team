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
      <div className="w-full max-w-7xl mx-auto px-6 lg:px-10 py-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm mb-10 border-b border-slate-200 pb-5">
          <button
            type="button"
            onClick={onBack}
            className="font-medium text-[#111111] hover:text-green-700 transition-colors"
          >
            Organizations
          </button>
          <span className="text-slate-400">/</span>
          <span className="font-semibold text-[#111111] truncate">{orgName}</span>
        </nav>

        {/* Section 1 – Organization Hero Card (full width) */}
        <motion.section
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="bg-white rounded-[24px] border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden mb-12"
        >
          <div className="p-8 lg:p-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-10">
            {/* Left: Icon, name, contact, phone, location */}
            <div className="flex items-start gap-8">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-green-500/20">
                <BuildingOfficeIcon className="w-12 h-12 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-[24px] lg:text-[32px] font-bold text-[#111111] tracking-tight leading-tight">
                  {orgName}
                </h1>
                {org?.contactPerson && (
                  <p className="text-[#111111] text-[15px] font-semibold mt-2">
                    Contact: {org.contactPerson}
                  </p>
                )}
                <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3">
                  {(org?.phone || org?.contactPhone) && (
                    <div className="flex items-center gap-2 text-[#111111] text-[14px]">
                      <PhoneIcon className="w-4 h-4 text-green-600" />
                      <span className="font-bold">{org.phone || org.contactPhone}</span>
                    </div>
                  )}
                  {org?.address && (
                    <div className="flex items-start gap-2 text-[#111111] text-[14px]">
                      <MapPinIcon className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="font-bold">{org.address}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: 3 stat cards */}
            <div className="flex flex-wrap gap-4 lg:gap-5">
              {[
                { label: 'Total Projects', value: totalProjects, bgColor: 'bg-slate-50', textColor: 'text-[#111111]', borderColor: 'border-slate-100' },
                { label: 'Active Projects', value: activeCount, bgColor: 'bg-green-50/60', textColor: 'text-green-700', borderColor: 'border-green-100' },
                { label: 'Completed', value: completedCount, bgColor: 'bg-blue-50/60', textColor: 'text-blue-700', borderColor: 'border-blue-100' },
              ].map((stat) => (
                <motion.div
                  key={stat.label}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className={`${stat.bgColor} ${stat.borderColor} border rounded-[20px] px-8 py-6 min-w-[150px] shadow-sm hover:shadow-lg transition-all duration-300`}
                >
                  <p className={`text-[28px] font-bold ${stat.textColor} leading-none`}>{stat.value}</p>
                  <p className={`text-[13px] font-bold mt-2 ${stat.textColor} whitespace-nowrap`}>
                    {stat.label}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Section 2 – Projects Under This Organization */}
        <section className="mt-12">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="text-[20px] font-bold text-[#111111] whitespace-nowrap">
              Projects Under This Organization
            </h2>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          {projects.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-[24px] border border-slate-200 p-20 text-center shadow-sm"
            >
              <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-slate-50 flex items-center justify-center">
                <FolderIcon className="w-12 h-12 text-slate-300" />
              </div>
              <p className="text-[#111111] font-bold text-xl">No projects yet</p>
              <p className="text-[#111111] text-sm mt-3 max-w-sm mx-auto opacity-70 leading-relaxed font-medium">
                This organization doesn't have any active projects linked yet. Reach out to the team to initialize your first project.
              </p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {projects.map((proj) => {
                const completion = proj.completionPercent ?? 0;
                const variant = getProjectStatusVariant(proj.status);
                const budget = proj.financial?.totalBudget ?? proj.budget ?? 0;

                const variantStyles = {
                  waiting: {
                    badge: 'bg-blue-50 text-blue-700 border border-blue-100',
                    border: 'border-l-blue-500',
                    card: 'hover:border-blue-200 hover:shadow-blue-500/5',
                    glow: '',
                  },
                  active: {
                    badge: 'bg-green-50 text-green-700 border border-green-100',
                    border: 'border-l-green-500',
                    card: 'hover:border-green-200 hover:shadow-green-500/5',
                    glow: '',
                  },
                  delayed: {
                    badge: 'bg-amber-50 text-amber-700 border border-amber-100',
                    border: 'border-l-amber-500',
                    card: 'hover:border-amber-200 shadow-amber-500/10 shadow-xl',
                    glow: 'shadow-[0_0_20px_rgba(245,158,11,0.1)]',
                  },
                  completed: {
                    badge: 'bg-slate-100 text-slate-700 border border-slate-200',
                    border: 'border-l-slate-400',
                    card: 'bg-slate-50/50 hover:border-slate-300',
                    glow: '',
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
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -6, transition: { duration: 0.3 } }}
                    whileTap={{ scale: 0.985 }}
                    className={`text-left bg-white rounded-[24px] border border-slate-200 border-l-[6px] ${style.border} p-6 lg:p-8 shadow-sm hover:shadow-xl transition-all duration-300 group ${style.card} ${style.glow}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-[18px] lg:text-[20px] font-bold text-[#111111] truncate transition-colors group-hover:text-green-700">
                          {proj.clientName || proj.title || 'Unnamed Project'}
                        </h3>
                        <div className="flex items-center gap-3 mt-3">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${style.badge}`}>
                            {STATUS_LABELS[proj.status] || proj.status}
                          </span>
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center transition-all group-hover:bg-green-50 group-hover:translate-x-1">
                        <ArrowRightIcon className="w-5 h-5 text-slate-400 group-hover:text-green-600" />
                      </div>
                    </div>

                    <div className="mt-8 flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <div className="relative w-14 h-14 flex-shrink-0">
                          <svg className="w-14 h-14 -rotate-90" viewBox="0 0 48 48">
                            <circle cx="24" cy="24" r={r} fill="none" stroke="#f1f5f9" strokeWidth="5" />
                            <circle
                              cx="24"
                              cy="24"
                              r={r}
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="5"
                              strokeDasharray={`${strokeDash} ${circumference}`}
                              strokeLinecap="round"
                              className={`${variant === 'completed' ? 'text-slate-400' : 'text-green-500'} transition-all duration-1000`}
                            />
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center text-[12px] font-bold text-[#111111]">
                            {Math.round(completion)}%
                          </span>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[13px] font-bold text-[#111111]">Progress</p>
                          <p className="text-[15px] font-medium text-[#111111] opacity-90">{completion}% Complete</p>
                        </div>
                      </div>

                      {budget > 0 && (
                        <div className="text-right">
                          <p className="text-[13px] font-bold text-[#111111]">Budget</p>
                          <p className="text-[16px] font-bold text-[#111111] truncate max-w-[150px]">
                            {formatCurrencyINR(budget)}
                          </p>
                        </div>
                      )}
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
