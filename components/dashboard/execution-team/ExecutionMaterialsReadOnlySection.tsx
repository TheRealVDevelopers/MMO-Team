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
    <section className="bg-surface border border-border rounded-xl p-6">
      <h2 className="text-lg font-bold text-text-primary mb-4">5. Materials Tracker</h2>
      <p className="text-sm text-text-secondary mb-4">Planned materials from execution plan. &quot;Used&quot; will be available after procurement integration.</p>
      {planned.length === 0 ? (
        <p className="text-sm text-text-tertiary">No planned materials.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 font-medium text-text-primary">Item</th>
                <th className="text-right py-2 font-medium text-text-primary">Planned qty</th>
                <th className="text-left py-2 font-medium text-text-primary">Required on</th>
              </tr>
            </thead>
            <tbody>
              {planned.map((row) => (
                <tr key={row.catalogItemId} className="border-b border-border/60">
                  <td className="py-2 text-text-primary">{row.name}</td>
                  <td className="text-right py-2 text-text-primary">{row.quantity}</td>
                  <td className="py-2 text-text-secondary">{row.requiredOn}</td>
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
