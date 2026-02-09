/**
 * Unified Approvals Page - Admin and Sales Manager
 * Lists ALL pending approvals in a single normalized table.
 * No type-specific UI branching.
 */
import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { UserRole } from '../../../types';
import { useNormalizedApprovals } from '../../../hooks/useNormalizedApprovals';
import { ContentCard, SectionHeader } from './DashboardUI';
import {
  EyeIcon,
  CheckCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { formatCurrencyINR, safeDateTime } from '../../../constants';
import { db } from '../../../firebase';
import {
  doc,
  updateDoc,
  addDoc,
  collection,
  serverTimestamp,
  getDocs,
  query,
  where,
  writeBatch,
} from 'firebase/firestore';
import { FIRESTORE_COLLECTIONS } from '../../../constants';
import type { NormalizedApprovalItem } from '../../../hooks/useNormalizedApprovals';

const UnifiedApprovalsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { items, loading } = useNormalizedApprovals();
  const [processing, setProcessing] = useState<string | null>(null);

  const handleApprove = async (item: NormalizedApprovalItem) => {
    if (!currentUser || item.type !== 'quotation') return;
    if (!window.confirm(`Approve quotation for ${item.caseName}?`)) return;

    setProcessing(item.id);
    try {
      const batch = writeBatch(db!);
      const quotRef = doc(db!, FIRESTORE_COLLECTIONS.CASES, item.caseId, FIRESTORE_COLLECTIONS.QUOTATIONS, item.sourceRef.id);
      batch.update(quotRef, { auditStatus: 'approved', auditedBy: currentUser.id, auditedAt: serverTimestamp() });

      if (item.documentUrl) {
        const docRef = doc(collection(db!, FIRESTORE_COLLECTIONS.CASES, item.caseId, FIRESTORE_COLLECTIONS.DOCUMENTS));
        batch.set(docRef, {
          type: 'quotation',
          caseId: item.caseId,
          name: `Quotation - ${item.caseName}`,
          url: item.documentUrl,
          fileUrl: item.documentUrl,
          visibleToClient: true,
          uploadedBy: currentUser.id,
          uploadedAt: serverTimestamp(),
          quotationId: item.sourceRef.id,
          amount: item.metadata?.grandTotal,
        });
      }

      const activityRef = doc(collection(db!, FIRESTORE_COLLECTIONS.CASES, item.caseId, FIRESTORE_COLLECTIONS.ACTIVITIES));
      batch.set(activityRef, {
        caseId: item.caseId,
        action: `Quotation approved (₹${((item.metadata?.grandTotal as number) || 0).toLocaleString('en-IN')})`,
        by: currentUser.id,
        timestamp: serverTimestamp(),
      });

      const boqId = item.metadata?.boqId as string | undefined;
      if (boqId?.trim()) {
        const boqRef = doc(db!, FIRESTORE_COLLECTIONS.CASES, item.caseId, FIRESTORE_COLLECTIONS.BOQ, boqId);
        batch.update(boqRef, { locked: true, referencedByQuotation: item.sourceRef.id });
      }

      await batch.commit();

      const tasksRef = collection(db!, FIRESTORE_COLLECTIONS.CASES, item.caseId, FIRESTORE_COLLECTIONS.TASKS);
      const taskSnap = await getDocs(query(tasksRef, where('type', '==', 'procurement_audit')));
      for (const t of taskSnap.docs) {
        const data = t.data();
        if (data.status === 'pending' || data.status === 'started') {
          await updateDoc(t.ref, { status: 'completed', completedAt: serverTimestamp() });
        }
      }
      alert('Approved successfully');
    } catch (e) {
      console.error(e);
      alert('Failed to approve');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (item: NormalizedApprovalItem) => {
    if (!currentUser || item.type !== 'quotation') return;
    const reason = window.prompt('Enter reason for rejection:');
    if (!reason?.trim()) return;

    setProcessing(item.id);
    try {
      await updateDoc(
        doc(db!, FIRESTORE_COLLECTIONS.CASES, item.caseId, FIRESTORE_COLLECTIONS.QUOTATIONS, item.sourceRef.id),
        { auditStatus: 'rejected', auditedBy: currentUser.id, auditedAt: serverTimestamp(), rejectionReason: reason }
      );
      await addDoc(collection(db!, FIRESTORE_COLLECTIONS.CASES, item.caseId, FIRESTORE_COLLECTIONS.ACTIVITIES), {
        caseId: item.caseId,
        action: `Quotation rejected. Reason: ${reason}`,
        by: currentUser.id,
        timestamp: serverTimestamp(),
      });
      alert('Rejected');
    } catch (e) {
      console.error(e);
      alert('Failed to reject');
    } finally {
      setProcessing(null);
    }
  };

  const hasAccess =
    currentUser?.role === UserRole.SUPER_ADMIN ||
    currentUser?.role === UserRole.ADMIN ||
    currentUser?.role === UserRole.SALES_GENERAL_MANAGER;

  if (!hasAccess) {
    return (
      <div className="p-8">
        <p className="text-text-secondary">You do not have access to the Approvals page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Approvals"
        subtitle="Pending quotations, BOQs, drawings, invoices. Approve or reject with remarks."
      />

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      ) : items.length === 0 ? (
        <ContentCard>
          <div className="text-center py-12">
            <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <p className="text-text-secondary font-medium">No pending approvals</p>
            <p className="text-sm text-text-tertiary mt-1">All items are up to date.</p>
          </div>
        </ContentCard>
      ) : (
        <ContentCard>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-xs font-bold uppercase text-text-tertiary">Type</th>
                  <th className="text-left py-3 px-4 text-xs font-bold uppercase text-text-tertiary">Case</th>
                  <th className="text-left py-3 px-4 text-xs font-bold uppercase text-text-tertiary">Submitted By</th>
                  <th className="text-left py-3 px-4 text-xs font-bold uppercase text-text-tertiary">Date</th>
                  <th className="text-left py-3 px-4 text-xs font-bold uppercase text-text-tertiary">Amount</th>
                  <th className="text-right py-3 px-4 text-xs font-bold uppercase text-text-tertiary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={`${item.sourceRef.path}-${item.sourceRef.id}`} className="border-b border-border/50 hover:bg-subtle-background/30">
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-primary/10 text-primary capitalize">
                        {item.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-text-primary">{item.caseName}</td>
                    <td className="py-3 px-4 text-sm text-text-secondary">{item.submittedBy}</td>
                    <td className="py-3 px-4 text-sm text-text-tertiary">{safeDateTime(item.submittedAt)}</td>
                    <td className="py-3 px-4 text-sm">
                      {(item.metadata?.grandTotal as number) != null
                        ? formatCurrencyINR(item.metadata.grandTotal as number)
                        : '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        {item.documentUrl && (
                          <a
                            href={item.documentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg border border-border hover:bg-surface transition-colors"
                            title="Open PDF"
                          >
                            <EyeIcon className="w-5 h-5 text-text-secondary" />
                          </a>
                        )}
                        <button
                          className="p-2 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors disabled:opacity-50"
                          title="Approve"
                          onClick={() => handleApprove(item)}
                          disabled={!!processing}
                        >
                          <CheckCircleIcon className="w-5 h-5" />
                        </button>
                        <button
                          className="p-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors disabled:opacity-50"
                          title="Reject"
                          onClick={() => handleReject(item)}
                          disabled={!!processing}
                        >
                          <XMarkIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ContentCard>
      )}
    </div>
  );
};

export default UnifiedApprovalsPage;
