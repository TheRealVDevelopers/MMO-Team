/**
 * Section 3: Approvals — Admin and Client must both approve.
 * When both true → status EXECUTION_ACTIVE, costCenter initialized if needed.
 */

import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase';
import { FIRESTORE_COLLECTIONS } from '../../../constants';
import { Case, CaseStatus, UserRole } from '../../../types';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { checkAndTransitionToExecutionActive } from '../../../services/executionStatusService';

interface Props {
  caseId: string;
  caseData: Case;
  plan: { approvals?: { admin?: boolean; client?: boolean }; [key: string]: any };
  onApproved: () => void;
}

const ExecutionApprovalsSection: React.FC<Props> = ({ caseId, caseData, plan, onApproved }) => {
  const { currentUser } = useAuth();
  const [busy, setBusy] = useState(false);
  const adminApproved = !!plan?.approvals?.admin;
  const clientApproved = !!plan?.approvals?.client;
  const bothApproved = adminApproved && clientApproved;
  const isSuperAdmin = currentUser?.role === UserRole.SUPER_ADMIN;

  const handleAdminApprove = async () => {
    if (!isSuperAdmin || adminApproved) return;
    setBusy(true);
    try {
      const caseRef = doc(db, FIRESTORE_COLLECTIONS.CASES, caseId);
      
      // Set admin approval
      await updateDoc(caseRef, {
        'executionPlan.approvals.admin': true,
        updatedAt: serverTimestamp(),
      });
      
      // Trigger automatic status transition check
      const transitioned = await checkAndTransitionToExecutionActive(caseId);
      
      onApproved();
      
      if (transitioned) {
        console.log('[Execution Approvals] Status automatically transitioned to EXECUTION_ACTIVE');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="bg-surface border border-border rounded-xl p-6">
      <h2 className="text-lg font-bold text-text-primary mb-4">3. Approvals</h2>
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 rounded-lg border border-border">
          <span className="font-medium text-text-primary">Admin</span>
          {adminApproved ? (
            <span className="flex items-center gap-2 text-green-600">
              <CheckCircleIcon className="w-5 h-5" /> Approved
            </span>
          ) : isSuperAdmin ? (
            <button
              type="button"
              onClick={handleAdminApprove}
              disabled={busy}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {busy ? '…' : 'Approve'}
            </button>
          ) : (
            <span className="text-text-tertiary">Pending</span>
          )}
        </div>
        <div className="flex items-center justify-between p-4 rounded-lg border border-border">
          <span className="font-medium text-text-primary">Client</span>
          {clientApproved ? (
            <span className="flex items-center gap-2 text-green-600">
              <CheckCircleIcon className="w-5 h-5" /> Approved
            </span>
          ) : (
            <span className="text-text-tertiary">Pending (client approves in Client Dashboard)</span>
          )}
        </div>
        {bothApproved && (
          <p className="text-sm text-green-600 font-medium">Execution unlocked. Daily log and execution are active.</p>
        )}
      </div>
    </section>
  );
};

export default ExecutionApprovalsSection;
