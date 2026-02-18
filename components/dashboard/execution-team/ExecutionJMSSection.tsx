/**
 * Section 7: Project Closure (JMS).
 * Project Head: "Mark Execution Complete" then "Launch JMS".
 * Client fills and signs in Client Dashboard; on submit → COMPLETED, project locked.
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { doc, updateDoc, collection, addDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase';
import { FIRESTORE_COLLECTIONS } from '../../../constants';
import { Case, CaseStatus } from '../../../types';
import { CheckCircleIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { isCaseCompleted } from '../../../services/executionStatusService';

interface Props {
  caseId: string;
  caseData: Case;
  plan: { executionMarkedComplete?: boolean; [key: string]: any };
  onUpdated: () => void;
  isCompleted?: boolean;  // Added for immutability checks
}

const ExecutionJMSSection: React.FC<Props> = ({ caseId, caseData, plan, onUpdated, isCompleted = false }) => {
  const { currentUser } = useAuth();
  const [busy, setBusy] = useState(false);
  const [jmsLaunched, setJmsLaunched] = useState(false);
  const [jmsSigned, setJmsSigned] = useState(false);
  const isProjectHead = caseData.projectHeadId === currentUser?.id;
  const markedComplete = !!plan?.executionMarkedComplete;
  const completed = caseData.status === CaseStatus.COMPLETED || !!caseData.closure?.jmsSigned;

  useEffect(() => {
    if (!db || !caseId) return;
    const jmsRef = collection(db, FIRESTORE_COLLECTIONS.CASES, caseId, FIRESTORE_COLLECTIONS.JMS);
    const unsub = onSnapshot(jmsRef, (snap) => {
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const signed = docs.some((d: any) => d.status === 'signed' || d.clientSignedAt);
      const launched = docs.length > 0;
      setJmsLaunched(launched);
      setJmsSigned(signed);
    });
    return () => unsub();
  }, [caseId]);

  const handleMarkComplete = async () => {
    setBusy(true);
    try {
      await updateDoc(doc(db, FIRESTORE_COLLECTIONS.CASES, caseId), {
        'executionPlan.executionMarkedComplete': true,
        updatedAt: serverTimestamp(),
      });
      onUpdated();
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  const handleLaunchJMS = async () => {
    if (!markedComplete) return;
    setBusy(true);
    try {
      await addDoc(collection(db, FIRESTORE_COLLECTIONS.CASES, caseId, FIRESTORE_COLLECTIONS.JMS), {
        caseId,
        status: 'pending',
        launchedBy: currentUser?.id,
        launchedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      });
      onUpdated();
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  if (isCompleted) {
    return (
      <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-500 text-white text-sm font-bold">7</span>
          <h2 className="text-lg font-bold text-slate-800">Project Closure (JMS)</h2>
        </div>
        <div className="flex items-center gap-4 p-5 rounded-xl bg-slate-50 border border-slate-100">
          <LockClosedIcon className="w-5 h-5 text-slate-500" />
          <div>
            <p className="font-semibold text-slate-700">JMS Locked</p>
            <p className="text-sm text-slate-600 mt-0.5">Cannot modify JMS for completed projects.</p>
          </div>
        </div>
      </section>
    );
  }

  if (completed) {
    return (
      <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-500 text-white text-sm font-bold">7</span>
          <h2 className="text-lg font-bold text-slate-800">Project Closure (JMS)</h2>
        </div>
        <div className="flex items-center gap-4 p-5 rounded-xl bg-emerald-50 border border-emerald-200">
          <CheckCircleIcon className="w-8 h-8 text-emerald-600" />
          <div>
            <p className="font-semibold text-emerald-800">Project completed</p>
            <p className="text-sm text-emerald-700 mt-0.5">JMS signed. Project is locked.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-500 text-white text-sm font-bold">7</span>
        <h2 className="text-lg font-bold text-slate-800">Project Closure (JMS)</h2>
      </div>
      <div className="space-y-4">
        {!markedComplete && isProjectHead && (
          <div>
            <p className="text-sm text-slate-600 mb-2">Mark execution as complete before launching JMS.</p>
            <button
              type="button"
              onClick={handleMarkComplete}
              disabled={busy}
              className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors"
            >
              {busy ? '…' : 'Mark Execution Complete'}
            </button>
          </div>
        )}
        {markedComplete && !jmsLaunched && isProjectHead && (
          <div>
            <p className="text-sm text-slate-600 mb-2">Launch JMS so the client can fill and sign.</p>
            <button
              type="button"
              onClick={handleLaunchJMS}
              disabled={busy}
              className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors"
            >
              {busy ? '…' : 'Launch JMS'}
            </button>
          </div>
        )}
        {jmsLaunched && !jmsSigned && (
          <p className="text-sm text-slate-600 p-4 rounded-xl bg-slate-50 border border-slate-100">
            JMS launched. Client must fill items delivered, quantities, missing items, and sign in the Client Dashboard.
          </p>
        )}
        {jmsSigned && (
          <p className="text-sm text-emerald-600 font-medium">JMS signed. Project will be marked completed.</p>
        )}
      </div>
    </section>
  );
};

export default ExecutionJMSSection;
