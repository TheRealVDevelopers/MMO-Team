/**
 * cases/{caseId}/procurementPlans - execution material scheduling (read executionPlan.days, assign vendor, status PLANNED → DELIVERED → INVOICED)
 */
import { useState, useEffect } from 'react';
import {
  collection,
  collectionGroup,
  doc,
  addDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { FIRESTORE_COLLECTIONS } from '../constants';
import { ProcurementPlanStatus, type ProcurementPlanDoc } from '../types';

function toPlanDoc(docId: string, data: Record<string, unknown>): ProcurementPlanDoc {
  const d = data as any;
  return {
    id: docId,
    caseId: d.caseId ?? '',
    organizationId: d.organizationId ?? '',
    catalogItemId: d.catalogItemId ?? '',
    itemName: d.itemName ?? '',
    quantity: d.quantity ?? 0,
    requiredOn: d.requiredOn?.toDate?.() ?? d.requiredOn,
    dayWorkDescription: d.dayWorkDescription,
    vendorId: d.vendorId ?? '',
    vendorName: d.vendorName ?? '',
    expectedDeliveryDate: d.expectedDeliveryDate?.toDate?.() ?? d.expectedDeliveryDate,
    status: (d.status as ProcurementPlanStatus) ?? ProcurementPlanStatus.PLANNED,
    deliveredAt: d.deliveredAt?.toDate?.() ?? d.deliveredAt,
    purchaseInvoiceId: d.purchaseInvoiceId,
    createdBy: d.createdBy,
    createdAt: d.createdAt?.toDate?.() ?? d.createdAt,
    updatedAt: d.updatedAt?.toDate?.() ?? d.updatedAt,
  };
}

export interface AddProcurementPlanInput {
  caseId: string;
  organizationId: string;
  catalogItemId: string;
  itemName: string;
  quantity: number;
  requiredOn: Date;
  dayWorkDescription?: string;
  vendorId: string;
  vendorName: string;
  expectedDeliveryDate: Date;
  createdBy?: string;
}

export function useProcurementPlans(caseId: string | undefined) {
  const [plans, setPlans] = useState<ProcurementPlanDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!db || !caseId) {
      setPlans([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const ref = collection(db, FIRESTORE_COLLECTIONS.CASES, caseId, FIRESTORE_COLLECTIONS.PROCUREMENT_PLANS);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        setPlans(snap.docs.map((d) => toPlanDoc(d.id, d.data())));
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [caseId]);

  const addPlan = async (input: AddProcurementPlanInput) => {
    if (!db || !caseId) throw new Error('Missing db or caseId');
    const ref = collection(db, FIRESTORE_COLLECTIONS.CASES, caseId, FIRESTORE_COLLECTIONS.PROCUREMENT_PLANS);
    await addDoc(ref, {
      caseId: input.caseId,
      organizationId: input.organizationId,
      catalogItemId: input.catalogItemId,
      itemName: input.itemName,
      quantity: input.quantity,
      requiredOn: input.requiredOn instanceof Date ? Timestamp.fromDate(input.requiredOn) : input.requiredOn,
      dayWorkDescription: input.dayWorkDescription ?? null,
      vendorId: input.vendorId,
      vendorName: input.vendorName,
      expectedDeliveryDate: input.expectedDeliveryDate instanceof Date ? Timestamp.fromDate(input.expectedDeliveryDate) : input.expectedDeliveryDate,
      status: ProcurementPlanStatus.PLANNED,
      createdBy: input.createdBy ?? null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  };

  const setDelivered = async (planId: string) => {
    if (!db || !caseId) throw new Error('Missing db or caseId');
    const planRef = doc(db, FIRESTORE_COLLECTIONS.CASES, caseId, FIRESTORE_COLLECTIONS.PROCUREMENT_PLANS, planId);
    await updateDoc(planRef, {
      status: ProcurementPlanStatus.DELIVERED,
      deliveredAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  };

  return { plans, loading, error, addPlan, setDelivered };
}

/** CollectionGroup: all procurement plans (e.g. for vendor portal or Accounts "delivered pending invoice") */
export function useProcurementPlansByVendor(vendorId: string | undefined) {
  const [plans, setPlans] = useState<ProcurementPlanDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!db || !vendorId) {
      setPlans([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const ref = collectionGroup(db, FIRESTORE_COLLECTIONS.PROCUREMENT_PLANS);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const list = snap.docs
          .map((d) => toPlanDoc(d.id, d.data()))
          .filter((p) => p.vendorId === vendorId);
        setPlans(list);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [vendorId]);

  return { plans, loading, error };
}

/** CollectionGroup: plans with status DELIVERED and no purchaseInvoiceId (for Accounts) */
export function useDeliveredPlansPendingInvoice() {
  const [plans, setPlans] = useState<ProcurementPlanDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const ref = collectionGroup(db, FIRESTORE_COLLECTIONS.PROCUREMENT_PLANS);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const list = snap.docs
          .map((d) => toPlanDoc(d.id, d.data()))
          .filter((p) => p.status === ProcurementPlanStatus.DELIVERED && !p.purchaseInvoiceId);
        setPlans(list);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  return { plans, loading, error };
}

/** Mark plan as INVOICED and set purchaseInvoiceId (called by Accounts after creating invoice) */
export async function markProcurementPlanInvoiced(
  caseId: string,
  planId: string,
  purchaseInvoiceId: string
): Promise<void> {
  if (!db) throw new Error('DB not initialized');
  const planRef = doc(db, FIRESTORE_COLLECTIONS.CASES, caseId, FIRESTORE_COLLECTIONS.PROCUREMENT_PLANS, planId);
  await updateDoc(planRef, {
    status: ProcurementPlanStatus.INVOICED,
    purchaseInvoiceId,
    updatedAt: serverTimestamp(),
  });
}

export default useProcurementPlans;
