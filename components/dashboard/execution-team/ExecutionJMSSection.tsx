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
import { CheckCircleIcon } from '@heroicons/react/24/outline';

interface Props {
  caseId: string;
  caseData: Case;
  plan: { executionMarkedComplete?: boolean; [key: string]: any };
  onUpdated: () => void;
}

const ExecutionJMSSection: React.FC<Props> = ({ caseId, caseData, plan, onUpdated }) => {
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

  if (completed) {
    return (
      <section className="bg-surface border border-border rounded-xl p-6">
        <h2 className="text-lg font-bold text-text-primary mb-4">7. Project Closure (JMS)</h2>
        <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <CheckCircleIcon className="w-8 h-8 text-green-600" />
          <div>
            <p className="font-semibold text-green-800 dark:text-green-200">Project completed</p>
            <p className="text-sm text-green-700 dark:text-green-300">JMS signed. Project is locked.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-surface border border-border rounded-xl p-6">
      <h2 className="text-lg font-bold text-text-primary mb-4">7. Project Closure (JMS)</h2>
      <div className="space-y-4">
        {!markedComplete && isProjectHead && (
          <div>
            <p className="text-sm text-text-secondary mb-2">Mark execution as complete before launching JMS.</p>
            <button
              type="button"
              onClick={handleMarkComplete}
              disabled={busy}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {busy ? '…' : 'Mark Execution Complete'}
            </button>
          </div>
        )}
        {markedComplete && !jmsLaunched && isProjectHead && (
          <div>
            <p className="text-sm text-text-secondary mb-2">Launch JMS so the client can fill and sign.</p>
            <button
              type="button"
              onClick={handleLaunchJMS}
              disabled={busy}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {busy ? '…' : 'Launch JMS'}
            </button>
          </div>
        )}
        {jmsLaunched && !jmsSigned && (
          <p className="text-sm text-text-secondary">
            JMS launched. Client must fill items delivered, quantities, missing items, and sign in the Client Dashboard.
          </p>
        )}
        {jmsSigned && (
          <p className="text-sm text-green-600">JMS signed. Project will be marked completed.</p>
        )}
      </div>
    </section>
  );
};

export default ExecutionJMSSection;
