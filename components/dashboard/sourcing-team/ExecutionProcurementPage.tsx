/**
 * Procurement: Execution material scheduling.
 * Only for cases with approved execution plan (EXECUTION_ACTIVE + executionPlan.days).
 * Read executionPlan.days (read-only), assign vendor + expected delivery per material, save to procurementPlans.
 * Status: PLANNED → DELIVERED (Procurement); INVOICED (Accounts).
 */
import React, { useMemo, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useCases } from '../../../hooks/useCases';
import { useProcurementPlans } from '../../../hooks/useProcurementPlans';
import { useVendors } from '../../../hooks/useVendors';
import { useCatalog } from '../../../hooks/useCatalog';
import { CaseStatus } from '../../../types';
import { ProcurementPlanStatus } from '../../../types';
import { formatDate } from '../../../constants';
import {
  TruckIcon,
  CalendarIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

interface MaterialRow {
  dayIndex: number;
  date: Date;
  workDescription: string;
  catalogItemId: string;
  itemName: string;
  quantity: number;
  requiredOn: Date;
}

const ExecutionProcurementPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { cases, loading: loadingCases } = useCases({ isProject: true });
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);

  const eligibleCases = useMemo(() => {
    return cases.filter((c) => {
      const active = c.status === CaseStatus.EXECUTION_ACTIVE || c.status === CaseStatus.ACTIVE;
      const plan = c.executionPlan as { days?: unknown[] } | undefined;
      const hasDays = plan?.days && Array.isArray(plan.days) && plan.days.length > 0;
      return c.isProject && active && hasDays;
    });
  }, [cases]);

  const selectedCase = useMemo(() => cases.find((c) => c.id === selectedCaseId), [cases, selectedCaseId]);
  const orgId = selectedCase?.organizationId ?? '';
  const { vendors } = useVendors(orgId);
  const { items: catalogItems } = useCatalog();
  const { plans, loading: loadingPlans, addPlan, setDelivered } = useProcurementPlans(selectedCaseId ?? undefined);

  const materialRows = useMemo((): MaterialRow[] => {
    if (!selectedCase?.executionPlan) return [];
    const plan = selectedCase.executionPlan as { days?: Array<{ date: any; workDescription: string; materials: Array<{ catalogItemId: string; quantity: number; requiredOn: any }> }> };
    const days = plan.days ?? [];
    const catalogMap = new Map(catalogItems.map((i) => [i.id, i.name]));
    const planKey = (p: { catalogItemId: string; quantity: number; requiredOn: Date }) =>
      `${p.catalogItemId}-${p.quantity}-${(p.requiredOn instanceof Date ? p.requiredOn : new Date(p.requiredOn)).toISOString().slice(0, 10)}`;
    const existingKeys = new Set(plans.map((p) => planKey({ catalogItemId: p.catalogItemId, quantity: p.quantity, requiredOn: p.requiredOn as Date })));
    const rows: MaterialRow[] = [];
    days.forEach((day, dayIndex) => {
      const date = day.date?.toDate?.() ?? new Date(day.date);
      (day.materials ?? []).forEach((m) => {
        const requiredOn = m.requiredOn?.toDate?.() ?? new Date(m.requiredOn);
        const key = planKey({ catalogItemId: m.catalogItemId, quantity: m.quantity, requiredOn });
        if (existingKeys.has(key)) return;
        rows.push({
          dayIndex,
          date,
          workDescription: day.workDescription ?? '',
          catalogItemId: m.catalogItemId,
          itemName: catalogMap.get(m.catalogItemId) ?? m.catalogItemId,
          quantity: m.quantity,
          requiredOn,
        });
      });
    });
    return rows;
  }, [selectedCase, catalogItems, plans]);

  const [assignments, setAssignments] = useState<Record<string, { vendorId: string; vendorName: string; expectedDelivery: string }>>({});
  const [saving, setSaving] = useState(false);
  const [deliveringId, setDeliveringId] = useState<string | null>(null);

  const handleSaveAssignments = async () => {
    if (!selectedCaseId || !selectedCase || !currentUser) return;
    const toSave = materialRows.filter((_, i) => {
      const key = `${i}`;
      const a = assignments[key];
      return a?.vendorId && a.expectedDelivery;
    });
    if (toSave.length === 0) {
      alert('Assign vendor and expected delivery for at least one row.');
      return;
    }
    setSaving(true);
    try {
      for (let i = 0; i < materialRows.length; i++) {
        const key = `${i}`;
        const a = assignments[key];
        if (!a?.vendorId || !a.expectedDelivery) continue;
        const row = materialRows[i];
        await addPlan({
          caseId: selectedCaseId,
          organizationId: selectedCase.organizationId ?? '',
          catalogItemId: row.catalogItemId,
          itemName: row.itemName,
          quantity: row.quantity,
          requiredOn: row.requiredOn,
          dayWorkDescription: row.workDescription,
          vendorId: a.vendorId,
          vendorName: a.vendorName,
          expectedDeliveryDate: new Date(a.expectedDelivery),
          createdBy: currentUser.id,
        });
      }
      setAssignments({});
    } catch (e) {
      console.error(e);
      alert('Failed to save procurement plans.');
    } finally {
      setSaving(false);
    }
  };

  const handleMarkDelivered = async (planId: string) => {
    setDeliveringId(planId);
    try {
      await setDelivered(planId);
    } catch (e) {
      console.error(e);
      alert('Failed to mark as delivered.');
    } finally {
      setDeliveringId(null);
    }
  };

  if (loadingCases) {
    return (
      <div className="p-6">
        <p className="text-text-secondary">Loading cases…</p>
      </div>
    );
  }

  if (!selectedCaseId) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-text-primary mb-2">Execution Procurement</h1>
        <p className="text-text-secondary mb-6">Material scheduling for cases with approved execution plan.</p>
        {eligibleCases.length === 0 ? (
          <div className="bg-surface rounded-xl border border-border p-8 text-center text-text-secondary">
            No cases with approved execution plan. Execution must be active and plan with days approved first.
          </div>
        ) : (
          <div className="space-y-2">
            {eligibleCases.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCaseId(c.id)}
                className="w-full flex items-center justify-between p-4 bg-surface border border-border rounded-xl hover:bg-subtle-background text-left"
              >
                <div>
                  <p className="font-semibold text-text-primary">{c.title}</p>
                  <p className="text-sm text-text-secondary">{c.clientName}</p>
                </div>
                <ChevronRightIcon className="w-5 h-5 text-text-tertiary" />
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-6">
      <button
        onClick={() => setSelectedCaseId(null)}
        className="mb-4 px-4 py-2 bg-subtle-background border border-border rounded-lg text-text-primary hover:bg-border/50"
      >
        ← Back to list
      </button>
      <h1 className="text-2xl font-bold text-text-primary mb-1">{selectedCase?.title}</h1>
      <p className="text-text-secondary mb-6">{selectedCase?.clientName}</p>

      {/* Planned materials from execution plan (read-only) */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
          <DocumentTextIcon className="w-5 h-5" />
          Planned materials (from execution plan)
        </h2>
        {materialRows.length === 0 ? (
          <p className="text-text-secondary">No materials in execution plan days.</p>
        ) : (
          <div className="overflow-x-auto border border-border rounded-xl">
            <table className="w-full text-sm">
              <thead className="bg-subtle-background">
                <tr>
                  <th className="p-3 text-left">Date</th>
                  <th className="p-3 text-left">Work</th>
                  <th className="p-3 text-left">Item</th>
                  <th className="p-3 text-right">Qty</th>
                  <th className="p-3 text-left">Required on</th>
                  <th className="p-3 text-left">Vendor</th>
                  <th className="p-3 text-left">Expected delivery</th>
                </tr>
              </thead>
              <tbody>
                {materialRows.map((row, i) => {
                  const key = `${i}`;
                  const a = assignments[key];
                  return (
                    <tr key={i} className="border-t border-border">
                      <td className="p-3">{formatDate(row.date)}</td>
                      <td className="p-3 max-w-[180px] truncate">{row.workDescription}</td>
                      <td className="p-3 font-medium">{row.itemName}</td>
                      <td className="p-3 text-right">{row.quantity}</td>
                      <td className="p-3">{formatDate(row.requiredOn)}</td>
                      <td className="p-3">
                        <select
                          value={a?.vendorId ?? ''}
                          onChange={(e) => {
                            const v = vendors.find((x) => x.id === e.target.value);
                            setAssignments((prev) => ({
                              ...prev,
                              [key]: {
                                ...prev[key],
                                vendorId: e.target.value,
                                vendorName: v?.name ?? '',
                                expectedDelivery: prev[key]?.expectedDelivery ?? '',
                              },
                            }));
                          }}
                          className="w-full max-w-[160px] p-2 border border-border rounded bg-surface text-text-primary"
                        >
                          <option value="">Select</option>
                          {vendors.map((v) => (
                            <option key={v.id} value={v.id}>{v.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3">
                        <input
                          type="date"
                          value={a?.expectedDelivery ?? ''}
                          onChange={(e) =>
                            setAssignments((prev) => ({
                              ...prev,
                              [key]: { ...prev[key], expectedDelivery: e.target.value, vendorId: prev[key]?.vendorId ?? '', vendorName: prev[key]?.vendorName ?? '' },
                            }))
                          }
                          className="p-2 border border-border rounded bg-surface text-text-primary"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {materialRows.length > 0 && (
          <button
            onClick={handleSaveAssignments}
            disabled={saving}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save procurement plans'}
          </button>
        )}
      </div>

      {/* Saved procurement plans */}
      <div>
        <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
          <TruckIcon className="w-5 h-5" />
          Procurement plans
        </h2>
        {loadingPlans ? (
          <p className="text-text-secondary">Loading…</p>
        ) : plans.length === 0 ? (
          <p className="text-text-secondary">No procurement plans saved yet.</p>
        ) : (
          <div className="overflow-x-auto border border-border rounded-xl">
            <table className="w-full text-sm">
              <thead className="bg-subtle-background">
                <tr>
                  <th className="p-3 text-left">Item</th>
                  <th className="p-3 text-right">Qty</th>
                  <th className="p-3 text-left">Vendor</th>
                  <th className="p-3 text-left">Expected delivery</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((p) => (
                  <tr key={p.id} className="border-t border-border">
                    <td className="p-3 font-medium">{p.itemName}</td>
                    <td className="p-3 text-right">{p.quantity}</td>
                    <td className="p-3">{p.vendorName}</td>
                    <td className="p-3">{p.expectedDeliveryDate ? formatDate(p.expectedDeliveryDate) : '—'}</td>
                    <td className="p-3">
                      <span
                        className={
                          p.status === ProcurementPlanStatus.INVOICED
                            ? 'text-green-600'
                            : p.status === ProcurementPlanStatus.DELIVERED
                              ? 'text-amber-600'
                              : 'text-text-secondary'
                        }
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="p-3">
                      {p.status === ProcurementPlanStatus.PLANNED && (
                        <button
                          onClick={() => handleMarkDelivered(p.id)}
                          disabled={!!deliveringId}
                          className="px-3 py-1 bg-amber-600 text-white rounded text-sm hover:bg-amber-700 disabled:opacity-50 flex items-center gap-1"
                        >
                          <CheckCircleIcon className="w-4 h-4" />
                          {deliveringId === p.id ? '…' : 'Mark delivered'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-xs text-text-tertiary mt-2">
          When status is DELIVERED, Accounts will create purchase invoice and set status to INVOICED.
        </p>
      </div>
    </div>
  );
};

export default ExecutionProcurementPage;
