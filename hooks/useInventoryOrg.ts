/**
 * Accounts Team — Inventory
 * Path: organizations/{orgId}/inventory
 * Read-only listing for Accounts; GR IN (purchase) updates inventory in its own transaction.
 */

import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { FIRESTORE_COLLECTIONS } from '../constants';

export interface InventoryItemOrg {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  averageCost: number;
  lastUpdated: Date;
}

export function useInventoryOrg(organizationId: string | undefined) {
  const [items, setItems] = useState<InventoryItemOrg[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!organizationId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, FIRESTORE_COLLECTIONS.ORGANIZATIONS, organizationId, FIRESTORE_COLLECTIONS.INVENTORY),
      orderBy('name', 'asc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setItems(
          snapshot.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              name: data.name ?? '',
              quantity: data.quantity ?? 0,
              unit: data.unit ?? 'pcs',
              averageCost: data.averageCost ?? data.avgCost ?? 0,
              lastUpdated: data.lastUpdated?.toDate?.() ?? new Date(),
            } as InventoryItemOrg;
          })
        );
        setLoading(false);
      },
      (err) => {
        console.error('useInventoryOrg error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [organizationId]);

  /** Inventory value = sum(qty × avgCost) per plan. */
  const inventoryValue = items.reduce((sum, i) => sum + i.quantity * i.averageCost, 0);

  return { items, loading, error, inventoryValue };
}
