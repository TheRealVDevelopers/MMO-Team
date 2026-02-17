/**
 * Unified Approvals Page - Admin and Sales Manager
 * Lists pending quotations and execution plan approvals (PLANNING_SUBMITTED).
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { UserRole, CaseStatus } from '../../../types';
import { useNormalizedApprovals } from '../../../hooks/useNormalizedApprovals';
import { useValidationRequests, approveValidationRequest } from '../../../hooks/useValidationRequests';
import { ContentCard, SectionHeader } from './DashboardUI';
import {
  EyeIcon,
  CheckCircleIcon,
  XMarkIcon,
  ClipboardDocumentCheckIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { formatCurrencyINR, safeDateTime } from '../../../constants';
import { DEFAULT_ORGANIZATION_ID } from '../../../constants';
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
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';
import { FIRESTORE_COLLECTIONS } from '../../../constants';
import type { NormalizedApprovalItem } from '../../../hooks/useNormalizedApprovals';

interface ExecutionPlanCase {
  id: string;
  title?: string;
  projectHeadId?: string;
  executionPlan?: { createdAt?: unknown };
  updatedAt?: unknown;
}

const TYPE_LABELS: Record<string, string> = {
  EXPENSE: 'Expense',
  TRAVEL: 'Travel',
  LEAVE: 'Leave',
  OTHER: 'Other',
};

const UnifiedApprovalsPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const orgId = currentUser?.organizationId || DEFAULT_ORGANIZATION_ID;
  const { items, loading } = useNormalizedApprovals();
  const { requests: validationRequests, loading: validationLoading } = useValidationRequests({ organizationId: orgId, status: 'PENDING' });
  const [processing, setProcessing] = useState<string | null>(null);
  const [validationProcessing, setValidationProcessing] = useState<string | null>(null);
  const [executionPlanCases, setExecutionPlanCases] = useState<ExecutionPlanCase[]>([]);
  const [executionPlanLoading, setExecutionPlanLoading] = useState(true);
  const [executionPlanProcessing, setExecutionPlanProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (!db) {
      setExecutionPlanLoading(false);
      return;
    }
    const casesRef = collection(db, FIRESTORE_COLLECTIONS.CASES);
    const q = query(casesRef, where('status', '==', CaseStatus.PLANNING_SUBMITTED));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const casesData = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as ExecutionPlanCase));
      setExecutionPlanCases(casesData);
      setExecutionPlanLoading(false);
    }, () => setExecutionPlanLoading(false));
    return () => unsubscribe();
  }, []);

  const handleExecutionPlanApprove = async (caseId: string) => {
    if (!currentUser || !window.confirm('Approve this execution plan? Project will move to Execution Active.')) return;
    setExecutionPlanProcessing(caseId);
    try {
      const caseRef = doc(db!, FIRESTORE_COLLECTIONS.CASES, caseId);
      await updateDoc(caseRef, {
        status: CaseStatus.EXECUTION_ACTIVE,
        'executionPlan.approvalStatus': 'approved',
        'executionPlan.approvedBy': currentUser.id,
        'executionPlan.approvedAt': serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      alert('Execution plan approved.');
    } catch (e) {
      console.error(e);
      alert('Failed to approve.');
    } finally {
      setExecutionPlanProcessing(null);
    }
  };

  const handleExecutionPlanReject = async (caseId: string) => {
    if (!currentUser) return;
    const reason = window.prompt('Reason for rejection (optional):');
    setExecutionPlanProcessing(caseId);
    try {
      const caseRef = doc(db!, FIRESTORE_COLLECTIONS.CASES, caseId);
      await updateDoc(caseRef, {
        status: CaseStatus.WAITING_FOR_PLANNING,
        'executionPlan.approvalStatus': 'rejected',
        updatedAt: serverTimestamp(),
        ...(reason?.trim() ? { 'executionPlan.rejectionReason': reason.trim() } : {}),
      });
      alert('Execution plan rejected.');
    } catch (e) {
      console.error(e);
      alert('Failed to reject.');
    } finally {
      setExecutionPlanProcessing(null);
    }
  };

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

  const handleValidationApprove = async (requestId: string) => {
    if (!currentUser) return;
    if (!window.confirm('Approve this validation request? It will go to Accounts for salary/reimbursement.')) return;
    setValidationProcessing(requestId);
    try {
      await approveValidationRequest(orgId, requestId, true, currentUser.id);
      alert('Approved. It will appear in Accounts for salary processing.');
    } catch (e) {
      console.error(e);
      alert('Failed to approve');
    } finally {
      setValidationProcessing(null);
    }
  };

  const handleValidationReject = async (requestId: string) => {
    if (!currentUser) return;
    const reason = window.prompt('Reason for rejection (optional):');
    setValidationProcessing(requestId);
    try {
      await approveValidationRequest(orgId, requestId, false, currentUser.id, reason || undefined);
      alert('Rejected');
    } catch (e) {
      console.error(e);
      alert('Failed to reject');
    } finally {
      setValidationProcessing(null);
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

      {/* Execution plan approval — cases with status PLANNING_SUBMITTED */}
      <SectionHeader
        title="Execution plan approval"
        subtitle="Projects with submitted execution plans. Approve to move to Execution Active."
      />
      {executionPlanLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
        </div>
      ) : executionPlanCases.length === 0 ? (
        <ContentCard>
          <div className="flex items-center gap-3 py-6 text-text-secondary">
            <DocumentTextIcon className="w-10 h-10 text-gray-300" />
            <p className="font-medium">No pending execution plan approvals</p>
          </div>
        </ContentCard>
      ) : (
        <ContentCard>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-xs font-bold uppercase text-text-tertiary">Project</th>
                  <th className="text-left py-3 px-4 text-xs font-bold uppercase text-text-tertiary">Project head</th>
                  <th className="text-left py-3 px-4 text-xs font-bold uppercase text-text-tertiary">Submitted</th>
                  <th className="text-right py-3 px-4 text-xs font-bold uppercase text-text-tertiary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {executionPlanCases.map((c) => (
                  <tr key={c.id} className="border-b border-border/50 hover:bg-subtle-background/30">
                    <td className="py-3 px-4 font-medium text-text-primary">{c.title || c.id}</td>
                    <td className="py-3 px-4 text-sm text-text-secondary">{c.projectHeadId || '—'}</td>
                    <td className="py-3 px-4 text-sm text-text-tertiary">
                      {c.executionPlan?.createdAt != null
                        ? safeDateTime(c.executionPlan.createdAt)
                        : c.updatedAt != null
                          ? safeDateTime(c.updatedAt)
                          : '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          className="p-2 rounded-lg border border-border hover:bg-surface transition-colors"
                          title="View plan"
                          onClick={() => navigate(`/project-reference?project=${c.id}`)}
                        >
                          <EyeIcon className="w-5 h-5 text-text-secondary" />
                        </button>
                        <button
                          type="button"
                          className="p-2 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50"
                          title="Approve"
                          onClick={() => handleExecutionPlanApprove(c.id)}
                          disabled={!!executionPlanProcessing}
                        >
                          <CheckCircleIcon className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          className="p-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50"
                          title="Reject"
                          onClick={() => handleExecutionPlanReject(c.id)}
                          disabled={!!executionPlanProcessing}
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

      {/* Validation Requests (expense / travel / leave) — once approved, go to Accounts */}
      <SectionHeader
        title="Request Validation"
        subtitle="Staff expense, travel, leave requests. Approve to send to Accounts for salary/reimbursement."
      />
      {validationLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
        </div>
      ) : validationRequests.length === 0 ? (
        <ContentCard>
          <div className="flex items-center gap-3 py-6 text-text-secondary">
            <ClipboardDocumentCheckIcon className="w-10 h-10 text-gray-300" />
            <p className="font-medium">No pending validation requests</p>
          </div>
        </ContentCard>
      ) : (
        <ContentCard>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-xs font-bold uppercase text-text-tertiary">Type</th>
                  <th className="text-left py-3 px-4 text-xs font-bold uppercase text-text-tertiary">User</th>
                  <th className="text-left py-3 px-4 text-xs font-bold uppercase text-text-tertiary">Description</th>
                  <th className="text-left py-3 px-4 text-xs font-bold uppercase text-text-tertiary">Amount / Details</th>
                  <th className="text-left py-3 px-4 text-xs font-bold uppercase text-text-tertiary">Date</th>
                  <th className="text-right py-3 px-4 text-xs font-bold uppercase text-text-tertiary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {validationRequests.map((r) => (
                  <tr key={r.id} className="border-b border-border/50 hover:bg-subtle-background/30">
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-primary/10 text-primary">
                        {TYPE_LABELS[r.type] || r.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-text-primary">{r.userName}</td>
                    <td className="py-3 px-4 text-sm text-text-secondary max-w-xs truncate">{r.description}</td>
                    <td className="py-3 px-4 text-sm">
                      {r.amount != null && r.amount > 0 && formatCurrencyINR(r.amount)}
                      {r.distanceKm != null && r.distanceKm > 0 && ` ${r.distanceKm} km`}
                      {r.leaveFrom && ` Leave ${r.leaveFrom} → ${r.leaveTo || '-'}`}
                      {!r.amount && !r.distanceKm && !r.leaveFrom && '—'}
                    </td>
                    <td className="py-3 px-4 text-sm text-text-tertiary">{safeDateTime(r.createdAt)}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          className="p-2 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50"
                          title="Approve"
                          onClick={() => handleValidationApprove(r.id)}
                          disabled={!!validationProcessing}
                        >
                          <CheckCircleIcon className="w-5 h-5" />
                        </button>
                        <button
                          className="p-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50"
                          title="Reject"
                          onClick={() => handleValidationReject(r.id)}
                          disabled={!!validationProcessing}
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
