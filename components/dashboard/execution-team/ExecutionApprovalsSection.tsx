/**
 * Section 3: Approvals — Super Admin approves execution plan. No client approval.
 * On Approve: approvalStatus = approved, status = EXECUTION_ACTIVE.
 */

import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase';
import { FIRESTORE_COLLECTIONS } from '../../../constants';
import { Case, CaseStatus, UserRole } from '../../../types';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

interface Props {
  caseId: string;
  caseData: Case;
  plan: { approvalStatus?: string; approvedBy?: string; approvedAt?: unknown; [key: string]: any };
  onApproved: () => void;
}

const ExecutionApprovalsSection: React.FC<Props> = ({ caseId, caseData, plan, onApproved }) => {
  const { currentUser } = useAuth();
  const [busy, setBusy] = useState(false);
  const approved = plan?.approvalStatus === 'approved';
  const isSuperAdmin = currentUser?.role === UserRole.SUPER_ADMIN;

  const handleAdminApprove = async () => {
    if (!isSuperAdmin || approved) return;
    setBusy(true);
    try {
      const caseRef = doc(db, FIRESTORE_COLLECTIONS.CASES, caseId);
      await updateDoc(caseRef, {
        'executionPlan.approvalStatus': 'approved',
        'executionPlan.approvedBy': currentUser!.id,
        'executionPlan.approvedAt': serverTimestamp(),
        status: CaseStatus.EXECUTION_ACTIVE,
        updatedAt: serverTimestamp(),
      });
      onApproved();
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
          <span className="font-medium text-text-primary">Super Admin</span>
          {approved ? (
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
        {approved && (
          <p className="text-sm text-green-600 font-medium">Execution unlocked. Daily log and execution are active.</p>
        )}
      </div>
    </section>
  );
};

export default ExecutionApprovalsSection;
