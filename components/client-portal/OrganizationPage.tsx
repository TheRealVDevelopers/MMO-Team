import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BuildingOfficeIcon,
  FolderIcon,
  ArrowRightIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  DocumentTextIcon,
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
      <ClientLayout onLogout={onLogout} onBack={onBack} backLabel="Back to organizations" title="Organization">
        <div className="flex-1 flex items-center justify-center p-10">
          <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout onLogout={onLogout} onBack={onBack} backLabel="Back to organizations" title="Organization">
      <div className="max-w-5xl mx-auto px-6 lg:px-10 py-8 space-y-8">
        {/* Organization info section */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
        >
          <div className="p-6 lg:p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                <BuildingOfficeIcon className="w-7 h-7 text-green-600" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">{org?.name || 'Organization'}</h1>
                {org?.contactPerson && (
                  <p className="text-gray-600 mt-1">Contact: {org.contactPerson}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              {org?.email && (
                <div className="flex items-center gap-2 text-gray-600">
                  <EnvelopeIcon className="w-5 h-5 text-gray-400" />
                  <span>{org.email}</span>
                </div>
              )}
              {(org?.phone || org?.contactPhone) && (
                <div className="flex items-center gap-2 text-gray-600">
                  <PhoneIcon className="w-5 h-5 text-gray-400" />
                  <span>{org.phone || org.contactPhone}</span>
                </div>
              )}
              {org?.address && (
                <div className="flex items-start gap-2 text-gray-600 sm:col-span-2">
                  <MapPinIcon className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <span>{org.address}</span>
                </div>
              )}
              {(org?.gst || org?.gstin) && (
                <div className="flex items-center gap-2 text-gray-600">
                  <DocumentTextIcon className="w-5 h-5 text-gray-400" />
                  <span>GST: {org.gst || org.gstin}</span>
                </div>
              )}
            </div>
            <div className="mt-6 pt-6 border-t border-gray-100 flex flex-wrap gap-4">
              <div className="bg-gray-50 rounded-xl px-4 py-2">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total projects</span>
                <p className="text-xl font-bold text-gray-900">{totalProjects}</p>
              </div>
              <div className="bg-green-50 rounded-xl px-4 py-2">
                <span className="text-xs font-medium text-green-600 uppercase tracking-wider">Active</span>
                <p className="text-xl font-bold text-green-700">{activeCount}</p>
              </div>
              <div className="bg-gray-50 rounded-xl px-4 py-2">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Completed</span>
                <p className="text-xl font-bold text-gray-900">{completedCount}</p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Projects section */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Projects</h2>
          {projects.length === 0 ? (
            <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
              <FolderIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No projects in this organization yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {projects.map((proj) => {
                const isActive = ACTIVE_STATUSES.includes(proj.status);
                const completion = proj.completionPercent ?? 0;
                return (
                  <motion.button
                    key={proj.id}
                    type="button"
                    onClick={() => onOpenProject(proj.id)}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-left bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-lg hover:border-green-200 transition-all duration-300 group"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0">
                        <h3 className="font-bold text-gray-900 truncate group-hover:text-green-700">
                          {proj.clientName || proj.title || 'Unnamed Project'}
                        </h3>
                        <span
                          className={`inline-flex mt-2 px-2.5 py-1 rounded-full text-xs font-medium ${
                            proj.status === CaseStatus.COMPLETED
                              ? 'bg-emerald-100 text-emerald-700'
                              : isActive
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {STATUS_LABELS[proj.status] || proj.status}
                        </span>
                      </div>
                      <ArrowRightIcon className="w-5 h-5 text-gray-300 group-hover:text-green-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
                    </div>
                    <div className="space-y-1 text-sm text-gray-500">
                      {proj.startDate && (
                        <p>Start: {safeDate(proj.startDate)}</p>
                      )}
                      {proj.endDate && (
                        <p>End: {safeDate(proj.endDate)}</p>
                      )}
                      {typeof completion === 'number' && (
                        <p>Completion: {completion}%</p>
                      )}
                      {proj.financial?.totalBudget > 0 && (
                        <p className="font-medium text-gray-700 mt-2">
                          Budget: {formatCurrencyINR(proj.financial.totalBudget)}
                        </p>
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
