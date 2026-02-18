/**
 * Section 5: Materials Tracker — read-only.
 * Planned = from executionPlan.days. Used = optional (future).
 */

import React, { useMemo } from 'react';
import { useCatalog } from '../../../hooks/useCatalog';

interface PlanMaterial {
  catalogItemId: string;
  quantity: number;
  requiredOn: Date;
}

interface Props {
  planDays?: Array<{ materials?: PlanMaterial[] }>;
}

const ExecutionMaterialsReadOnlySection: React.FC<Props> = ({ planDays = [] }) => {
  const { items: catalogItems } = useCatalog();
  const planned = useMemo(() => {
    const map = new Map<string, { quantity: number; requiredOn: string }>();
    planDays.forEach((day) => {
      (day.materials || []).forEach((m: PlanMaterial) => {
        if (!m.catalogItemId) return;
        const key = m.catalogItemId;
        const existing = map.get(key);
        const qty = (existing?.quantity ?? 0) + (m.quantity ?? 0);
        const req = m.requiredOn ? (typeof m.requiredOn === 'string' ? m.requiredOn : new Date(m.requiredOn).toISOString().slice(0, 10)) : '';
        map.set(key, { quantity: qty, requiredOn: req || (existing?.requiredOn ?? '') });
      });
    });
    return Array.from(map.entries()).map(([catalogItemId, { quantity, requiredOn }]) => ({
      catalogItemId,
      name: catalogItems.find((c) => c.id === catalogItemId)?.name ?? catalogItemId,
      quantity,
      requiredOn,
    }));
  }, [planDays, catalogItems]);

  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary text-white text-sm font-bold">5</span>
        <h2 className="text-lg font-bold text-slate-800">Materials Tracker</h2>
      </div>
      <p className="text-sm text-slate-600 mb-4">Planned materials from execution plan. &quot;Used&quot; will be available after procurement integration.</p>
      {planned.length === 0 ? (
        <p className="text-sm text-slate-500">No planned materials.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80">
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Item</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-700">Planned qty</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Required on</th>
              </tr>
            </thead>
            <tbody>
              {planned.map((row) => (
                <tr key={row.catalogItemId} className="border-b border-slate-100 last:border-0">
                  <td className="py-3 px-4 text-slate-800">{row.name}</td>
                  <td className="text-right py-3 px-4 text-slate-800">{row.quantity}</td>
                  <td className="py-3 px-4 text-slate-600">{row.requiredOn}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default ExecutionMaterialsReadOnlySection;
