/**
 * Section 2: Planning — day-wise, catalog-only materials.
 * Project Head only. Submit → executionPlan saved, status → PLANNING_IN_PROGRESS.
 */

import React, { useState, useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useCatalog } from '../../../hooks/useCatalog';
import { doc, updateDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { FIRESTORE_COLLECTIONS } from '../../../constants';
import { Case, CaseStatus } from '../../../types';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

export interface PlanDay {
  date: string; // YYYY-MM-DD
  workDescription: string;
  labor: { count: number; type?: string };
  materials: Array<{ catalogItemId: string; quantity: number; requiredOn: string }>;
}

interface Props {
  caseId: string;
  caseData: Case;
  existingPlan?: {
    startDate?: Date;
    endDate?: Date;
    days?: PlanDay[];
  } | null;
  onSaved: () => void;
}

const ExecutionPlanningSection: React.FC<Props> = ({ caseId, caseData, existingPlan, onSaved }) => {
  const { currentUser } = useAuth();
  const { items: catalogItems } = useCatalog();
  const [startDate, setStartDate] = useState(() => {
    if (existingPlan?.startDate) return new Date(existingPlan.startDate).toISOString().slice(0, 10);
    return '';
  });
  const [endDate, setEndDate] = useState(() => {
    if (existingPlan?.endDate) return new Date(existingPlan.endDate).toISOString().slice(0, 10);
    return '';
  });
  const [days, setDays] = useState<PlanDay[]>(() => {
    if (existingPlan?.days?.length) {
      return existingPlan.days.map((d) => ({
        date: typeof d.date === 'string' ? d.date : new Date((d as any).date).toISOString().slice(0, 10),
        workDescription: (d as any).workDescription || '',
        labor: { count: (d as any).labor?.count ?? 0, type: (d as any).labor?.type },
        materials: ((d as any).materials || []).map((m: any) => ({
          catalogItemId: m.catalogItemId || '',
          quantity: m.quantity ?? 0,
          requiredOn: m.requiredOn ? (typeof m.requiredOn === 'string' ? m.requiredOn : new Date(m.requiredOn).toISOString().slice(0, 10)) : '',
        })),
      }));
    }
    return [{ date: '', workDescription: '', labor: { count: 0 }, materials: [] }];
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isProjectHead = caseData.projectHeadId === currentUser?.id;

  const addDay = () => {
    setDays((prev) => [...prev, { date: '', workDescription: '', labor: { count: 0 }, materials: [] }]);
  };

  const removeDay = (index: number) => {
    if (days.length <= 1) return;
    setDays((prev) => prev.filter((_, i) => i !== index));
  };

  const updateDay = (index: number, field: keyof PlanDay, value: any) => {
    setDays((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addMaterialToDay = (dayIndex: number) => {
    setDays((prev) => {
      const next = [...prev];
      next[dayIndex] = {
        ...next[dayIndex],
        materials: [...next[dayIndex].materials, { catalogItemId: '', quantity: 0, requiredOn: '' }],
      };
      return next;
    });
  };

  const removeMaterialFromDay = (dayIndex: number, matIndex: number) => {
    setDays((prev) => {
      const next = [...prev];
      next[dayIndex].materials = next[dayIndex].materials.filter((_, i) => i !== matIndex);
      return next;
    });
  };

  const updateMaterial = (dayIndex: number, matIndex: number, field: string, value: any) => {
    setDays((prev) => {
      const next = [...prev];
      const mat = { ...next[dayIndex].materials[matIndex], [field]: value };
      next[dayIndex].materials[matIndex] = mat;
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!startDate || !endDate) {
      setError('Start date and end date are required.');
      return;
    }
    if (days.some((d) => !d.date.trim())) {
      setError('Every day must have a date.');
      return;
    }
    const planDays = days.map((d) => ({
      date: new Date(d.date),
      workDescription: d.workDescription.trim(),
      labor: { count: Number(d.labor.count) || 0, type: d.labor.type?.trim() || undefined },
      materials: d.materials
        .filter((m) => m.catalogItemId && m.quantity > 0)
        .map((m) => ({
          catalogItemId: m.catalogItemId,
          quantity: Number(m.quantity),
          requiredOn: new Date(m.requiredOn || d.date),
        })),
    }));
    const existingApprovals = (caseData.executionPlan as any)?.approvals;
    const approvals =
      existingApprovals && typeof existingApprovals.admin === 'boolean' && typeof existingApprovals.client === 'boolean'
        ? existingApprovals
        : { admin: false, client: false };
    setSaving(true);
    try {
      const caseRef = doc(db, FIRESTORE_COLLECTIONS.CASES, caseId);
      await updateDoc(caseRef, {
        executionPlan: {
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          days: planDays,
          approvals,
          createdBy: currentUser?.id,
        },
        status: CaseStatus.PLANNING_IN_PROGRESS,
        updatedAt: serverTimestamp(),
      });
      onSaved();
    } catch (err: any) {
      setError(err?.message || 'Failed to save plan.');
    } finally {
      setSaving(false);
    }
  };

  if (!isProjectHead) {
    return (
      <section className="bg-surface border border-border rounded-xl p-6">
        <h2 className="text-lg font-bold text-text-primary mb-4">2. Planning</h2>
        <p className="text-sm text-text-secondary">Only the Project Head can create or edit the plan.</p>
      </section>
    );
  }

  return (
    <section className="bg-surface border border-border rounded-xl p-6">
      <h2 className="text-lg font-bold text-text-primary mb-4">2. Planning</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Start date *</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-text-primary"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">End date *</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-text-primary"
              required
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-text-primary">Day-by-day plan *</label>
            <button type="button" onClick={addDay} className="flex items-center gap-1 text-sm text-primary font-medium">
              <PlusIcon className="w-4 h-4" /> Add day
            </button>
          </div>
          <div className="space-y-6">
            {days.map((day, dayIndex) => (
              <div key={dayIndex} className="p-4 rounded-xl border border-border bg-background/50 space-y-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
                    <div>
                      <label className="block text-xs font-medium text-text-tertiary mb-1">Date</label>
                      <input
                        type="date"
                        value={day.date}
                        onChange={(e) => updateDay(dayIndex, 'date', e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-text-primary text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-tertiary mb-1">Labor count</label>
                      <input
                        type="number"
                        min={0}
                        value={day.labor.count}
                        onChange={(e) =>
                          updateDay(dayIndex, 'labor', { ...day.labor, count: parseInt(e.target.value, 10) || 0 })
                        }
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-text-primary text-sm"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeDay(dayIndex)}
                    disabled={days.length <= 1}
                    className="p-2 text-error hover:bg-error/10 rounded-lg disabled:opacity-40"
                    aria-label="Remove day"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-tertiary mb-1">Work description</label>
                  <textarea
                    value={day.workDescription}
                    onChange={(e) => updateDay(dayIndex, 'workDescription', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-text-primary text-sm"
                    placeholder="What will be done this day?"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-text-tertiary">Materials (catalog only)</span>
                    <button
                      type="button"
                      onClick={() => addMaterialToDay(dayIndex)}
                      className="text-xs text-primary font-medium"
                    >
                      + Add material
                    </button>
                  </div>
                  <div className="space-y-2">
                    {day.materials.map((mat, matIndex) => (
                      <div key={matIndex} className="flex flex-wrap items-center gap-2">
                        <select
                          value={mat.catalogItemId}
                          onChange={(e) => updateMaterial(dayIndex, matIndex, 'catalogItemId', e.target.value)}
                          className="px-2 py-1.5 border border-border rounded bg-background text-text-primary text-sm min-w-[140px]"
                        >
                          <option value="">Select item</option>
                          {catalogItems.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          min={0}
                          value={mat.quantity}
                          onChange={(e) => updateMaterial(dayIndex, matIndex, 'quantity', e.target.value)}
                          className="w-20 px-2 py-1.5 border border-border rounded bg-background text-text-primary text-sm"
                          placeholder="Qty"
                        />
                        <input
                          type="date"
                          value={mat.requiredOn}
                          onChange={(e) => updateMaterial(dayIndex, matIndex, 'requiredOn', e.target.value)}
                          className="px-2 py-1.5 border border-border rounded bg-background text-text-primary text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => removeMaterialFromDay(dayIndex, matIndex)}
                          className="p-1 text-error hover:bg-error/10 rounded"
                          aria-label="Remove material"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-error">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-hover disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Submit plan for approval'}
        </button>
      </form>
    </section>
  );
};

export default ExecutionPlanningSection;
