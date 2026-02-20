/**
 * Project Reference Page – Execution control panel & full timeline.
 * Loads case from cases/{caseId}.
 * Staff Control Panel for managing project lifecycle.
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../../firebase';
import { FIRESTORE_COLLECTIONS } from '../../../constants';
import { Case } from '../../../types';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../../context/AuthContext';

// Editors
import ProjectInfoEditor from './project-reference/ProjectInfoEditor';
import ProjectHealthEditor from './project-reference/ProjectHealthEditor';
import LeadJourneyEditor from './project-reference/LeadJourneyEditor';
import ExecutionPlanEditor from './project-reference/ExecutionPlanEditor';
import FinancialEditor from './project-reference/FinancialEditor';
import TransparencyEditor from './project-reference/TransparencyEditor';
import DocumentsEditor from './project-reference/DocumentsEditor';
import DailyLogEditor from './project-reference/DailyLogEditor';
import ProjectChat from './project-reference/ProjectChat';

const ProjectReferencePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser: user } = useAuth();
  const projectId = searchParams.get('project');

  const [caseData, setCaseData] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!db || !projectId) {
      setLoading(false);
      setError(!projectId ? 'No project ID in URL' : null);
      return;
    }
    const caseRef = doc(db, FIRESTORE_COLLECTIONS.CASES, projectId);
    const unsub = onSnapshot(
      caseRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as any;
          // Normalize data
          const normalized: Case = {
            ...data,
            id: snap.id,
          };
          setCaseData(normalized);
        } else {
          setCaseData(null);
        }
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="p-6">
        <button type="button" onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-4">
          <ArrowLeftIcon className="w-5 h-5" /> Back
        </button>
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-600">
          {error || 'Project not found.'}
        </div>
      </div>
    );
  }

  // Staff User Info for Chat
  const currentUser = {
    uid: user?.id || 'staff',
    displayName: user?.name || 'Staff Member',
    role: user?.role || 'admin',
  };

  return (
    <div className="p-6 max-w-7xl mx-auto bg-slate-50 min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-2 transition-colors"
            title="Back"
          >
            <ArrowLeftIcon className="w-5 h-5" /> Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-slate-900">{caseData.title || caseData.projectName || 'Project Reference'}</h1>
          <p className="text-slate-500 mt-1">{caseData.clientName} · {caseData.siteAddress}</p>
        </div>
        <div className="text-right hidden sm:block">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Case ID</span>
          <p className="font-mono text-sm text-slate-600">{caseData.id}</p>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Left Column: All Editors */}
        <div className="xl:col-span-2 space-y-6">
          {/* Project Information (name, type, client, consultant) */}
          <ProjectInfoEditor caseData={caseData} />

          {/* Project Health & Intelligence */}
          <ProjectHealthEditor caseData={caseData} />

          {/* Timeline & Transparency (dates, delays, next action) */}
          <TransparencyEditor caseData={caseData} />

          {/* Lead Journey (always visible — tracks pre-project workflow) */}
          <LeadJourneyEditor caseData={caseData} />

          {/* Conditional: Execution plan + Financials for projects */}
          {caseData.isProject && (
            <>
              <ExecutionPlanEditor caseData={caseData} />
              <FinancialEditor caseData={caseData} />
            </>
          )}

          {/* Daily Logs */}
          <DailyLogEditor caseData={caseData} />

          {/* Documents Manager */}
          <DocumentsEditor caseData={caseData} />
        </div>

        {/* Right Column: Communication & Activity */}
        <div className="space-y-6">
          <ProjectChat caseData={caseData} currentUser={currentUser} />

          {/* Approvals View */}
          {(caseData.approvals || []).length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Approvals</h3>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {caseData.approvals?.map((a, i) => (
                  <div key={i} className={`p-3 border rounded-lg ${a.status === 'pending' ? 'bg-amber-50 border-amber-100' :
                    a.status === 'approved' ? 'bg-green-50 border-green-100' : 'bg-slate-50 border-slate-100'
                    }`}>
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-semibold text-slate-800">{a.type}</p>
                      <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${a.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        a.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>{a.status}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{a.payload?.notes || 'No notes'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ProjectReferencePage;
