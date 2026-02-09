/**
 * cases/{caseId}/quotationBids - vendor bidding after quotation approval
 */
import { useState, useEffect } from 'react';
import { collection, collectionGroup, query, where, doc, getDoc, addDoc, updateDoc, onSnapshot, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { FIRESTORE_COLLECTIONS } from '../constants';
import type { QuotationBidDoc, VendorBidEntry, QuotationBidLine } from '../types';

function toBidDoc(docId: string, data: Record<string, unknown>): QuotationBidDoc {
  const d = data as any;
  return {
    id: docId,
    caseId: d.caseId ?? '',
    quotationId: d.quotationId ?? '',
    itemLines: (d.itemLines ?? []) as QuotationBidLine[],
    invitedVendorIds: d.invitedVendorIds ?? [],
    bids: (d.bids ?? []).map((b: any) => ({
      ...b,
      submittedAt: b.submittedAt?.toDate?.() ?? b.submittedAt,
    })) as VendorBidEntry[],
    status: d.status ?? 'open',
    selectedVendorId: d.selectedVendorId,
    selectedBidAt: d.selectedBidAt?.toDate?.() ?? d.selectedBidAt,
    adminApprovedAt: d.adminApprovedAt?.toDate?.() ?? d.adminApprovedAt,
    adminApprovedBy: d.adminApprovedBy,
    lockedAt: d.lockedAt?.toDate?.() ?? d.lockedAt,
    createdBy: d.createdBy ?? '',
    createdAt: d.createdAt?.toDate?.() ?? d.createdAt,
    updatedAt: d.updatedAt?.toDate?.() ?? d.updatedAt,
  };
}

export function useQuotationBids(caseId: string | undefined) {
  const [bids, setBids] = useState<QuotationBidDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!db || !caseId) {
      setBids([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const ref = collection(db, FIRESTORE_COLLECTIONS.CASES, caseId, FIRESTORE_COLLECTIONS.QUOTATION_BIDS);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        setBids(snap.docs.map((d) => toBidDoc(d.id, d.data())));
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [caseId]);

  const createBidRound = async (params: {
    quotationId: string;
    itemLines: QuotationBidLine[];
    invitedVendorIds: string[];
    createdBy: string;
  }) => {
    if (!db || !caseId) throw new Error('Missing db or caseId');
    const ref = collection(db, FIRESTORE_COLLECTIONS.CASES, caseId, FIRESTORE_COLLECTIONS.QUOTATION_BIDS);
    const docRef = await addDoc(ref, {
      caseId,
      quotationId: params.quotationId,
      itemLines: params.itemLines,
      invitedVendorIds: params.invitedVendorIds,
      bids: [],
      status: 'open',
      createdBy: params.createdBy,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  };

  const addOrUpdateVendorBid = async (bidDocId: string, entry: Omit<VendorBidEntry, 'submittedAt'>) => {
    if (!db || !caseId) throw new Error('Missing db or caseId');
    const bidRef = doc(db, FIRESTORE_COLLECTIONS.CASES, caseId, FIRESTORE_COLLECTIONS.QUOTATION_BIDS, bidDocId);
    const current = bids.find((b) => b.id === bidDocId);
    const newBids = (current?.bids ?? []).filter((b) => b.vendorId !== entry.vendorId);
    newBids.push({ ...entry, submittedAt: new Date() });
    await updateDoc(bidRef, {
      bids: newBids.map((b) => ({
        ...b,
        submittedAt: b.submittedAt instanceof Date ? Timestamp.fromDate(b.submittedAt) : b.submittedAt,
      })),
      updatedAt: serverTimestamp(),
    });
  };

  const selectVendor = async (bidDocId: string, vendorId: string) => {
    if (!db || !caseId) throw new Error('Missing db or caseId');
    const bidRef = doc(db, FIRESTORE_COLLECTIONS.CASES, caseId, FIRESTORE_COLLECTIONS.QUOTATION_BIDS, bidDocId);
    await updateDoc(bidRef, {
      selectedVendorId: vendorId,
      selectedBidAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  };

  const setAdminApproval = async (bidDocId: string, adminUserId: string) => {
    if (!db || !caseId) throw new Error('Missing db or caseId');
    const bidRef = doc(db, FIRESTORE_COLLECTIONS.CASES, caseId, FIRESTORE_COLLECTIONS.QUOTATION_BIDS, bidDocId);
    await updateDoc(bidRef, {
      adminApprovedAt: serverTimestamp(),
      adminApprovedBy: adminUserId,
      updatedAt: serverTimestamp(),
    });
  };

  const lockVendor = async (bidDocId: string) => {
    if (!db || !caseId) throw new Error('Missing db or caseId');
    const bidRef = doc(db, FIRESTORE_COLLECTIONS.CASES, caseId, FIRESTORE_COLLECTIONS.QUOTATION_BIDS, bidDocId);
    await updateDoc(bidRef, {
      lockedAt: serverTimestamp(),
      status: 'closed',
      updatedAt: serverTimestamp(),
    });
  };

  const closeBidding = async (bidDocId: string) => {
    if (!db || !caseId) throw new Error('Missing db or caseId');
    const bidRef = doc(db, FIRESTORE_COLLECTIONS.CASES, caseId, FIRESTORE_COLLECTIONS.QUOTATION_BIDS, bidDocId);
    await updateDoc(bidRef, {
      status: 'closed',
      updatedAt: serverTimestamp(),
    });
  };

  return {
    bids,
    loading,
    error,
    createBidRound,
    addOrUpdateVendorBid,
    selectVendor,
    setAdminApproval,
    lockVendor,
    closeBidding,
  };
}

/** CollectionGroup: bid rounds where this vendor is invited (for vendor portal) */
export function useQuotationBidsForVendor(vendorId: string | undefined) {
  const [bids, setBids] = useState<QuotationBidDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!db || !vendorId) {
      setBids([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const ref = collectionGroup(db, FIRESTORE_COLLECTIONS.QUOTATION_BIDS);
    const q = query(ref, where('invitedVendorIds', 'array-contains', vendorId));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setBids(snap.docs.map((d) => toBidDoc(d.id, d.data())));
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [vendorId]);

  return { bids, loading, error };
}

/** Standalone: add or update vendor bid (for vendor portal when caseId comes from bid doc) */
export async function submitVendorBid(
  caseId: string,
  bidDocId: string,
  entry: Omit<VendorBidEntry, 'submittedAt'>
): Promise<void> {
  if (!db) throw new Error('DB not initialized');
  const bidRef = doc(db, FIRESTORE_COLLECTIONS.CASES, caseId, FIRESTORE_COLLECTIONS.QUOTATION_BIDS, bidDocId);
  const snap = await getDoc(bidRef);
  if (!snap.exists()) throw new Error('Bid round not found');
  const data = snap.data();
  const bids: VendorBidEntry[] = (data.bids ?? []).map((b: any) => ({
    ...b,
    submittedAt: b.submittedAt?.toDate?.() ?? b.submittedAt,
  }));
  const filtered = bids.filter((b) => b.vendorId !== entry.vendorId);
  filtered.push({ ...entry, submittedAt: new Date() });
  await updateDoc(bidRef, {
    bids: filtered.map((b) => ({
      ...b,
      submittedAt: b.submittedAt instanceof Date ? Timestamp.fromDate(b.submittedAt) : b.submittedAt,
    })),
    updatedAt: serverTimestamp(),
  });
}
export default useQuotationBids;
