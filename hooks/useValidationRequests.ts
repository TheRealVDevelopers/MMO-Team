/**
 * Validation requests: staff submit expense/travel/leave for validation
 * → Admin approves → Accounts see approved and add to salary
 */

import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  addDoc,
  updateDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  getDocs,
} from 'firebase/firestore';
import { db } from '../firebase';
import { FIRESTORE_COLLECTIONS, DEFAULT_ORGANIZATION_ID } from '../constants';
import { useAuth } from '../context/AuthContext';
import type { ValidationRequest, ValidationRequestStatus, ValidationRequestType } from '../types';

const safeDate = (v: unknown): Date | undefined => {
  if (!v) return undefined;
  if (v instanceof Date) return v;
  if (typeof (v as any).toDate === 'function') return (v as any).toDate();
  if (typeof v === 'string') return new Date(v);
  return undefined;
};

/** Submit a new validation request (any staff) */
export function useSubmitValidationRequest() {
  const { currentUser } = useAuth();
  const orgId = currentUser?.organizationId || DEFAULT_ORGANIZATION_ID;
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(
    async (data: {
      type: ValidationRequestType;
      amount?: number;
      distanceKm?: number;
      description: string;
      receiptUrl?: string;
      leaveFrom?: string;
      leaveTo?: string;
    }) => {
      if (!db || !currentUser || !orgId) {
        setError('Not authenticated or organization missing');
        return null;
      }
      setSubmitting(true);
      setError(null);
      try {
        const col = collection(
          db,
          FIRESTORE_COLLECTIONS.ORGANIZATIONS,
          orgId,
          FIRESTORE_COLLECTIONS.VALIDATION_REQUESTS
        );
        const docRef = await addDoc(col, {
          type: data.type,
          userId: currentUser.id,
          userName: currentUser.name,
          userEmail: currentUser.email,
          organizationId: orgId,
          amount: data.amount ?? null,
          distanceKm: data.distanceKm ?? null,
          description: data.description,
          receiptUrl: data.receiptUrl ?? null,
          leaveFrom: data.leaveFrom ?? null,
          leaveTo: data.leaveTo ?? null,
          status: 'PENDING',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        return docRef.id;
      } catch (e: any) {
        setError(e.message || 'Failed to submit');
        return null;
      } finally {
        setSubmitting(false);
      }
    },
    [currentUser, orgId]
  );

  return { submit, submitting, error };
}

/** List validation requests: for current user (my requests) or for admin (pending) or for accounts (approved) */
export function useValidationRequests(options: {
  organizationId?: string;
  userId?: string;   // only my requests
  status?: ValidationRequestStatus; // PENDING | APPROVED | REJECTED
}) {
  const { currentUser } = useAuth();
  const orgId = options.organizationId || currentUser?.organizationId || DEFAULT_ORGANIZATION_ID;
  const [requests, setRequests] = useState<ValidationRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db || !orgId) {
      setLoading(false);
      return;
    }

    const col = collection(
      db,
      FIRESTORE_COLLECTIONS.ORGANIZATIONS,
      orgId,
      FIRESTORE_COLLECTIONS.VALIDATION_REQUESTS
    );

    const constraints: any[] = [];
    if (options.userId) constraints.push(where('userId', '==', options.userId));
    if (options.status) constraints.push(where('status', '==', options.status));
    constraints.push(orderBy('createdAt', 'desc'));

    const q = query(col, ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: ValidationRequest[] = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            type: data.type,
            userId: data.userId,
            userName: data.userName,
            userEmail: data.userEmail,
            organizationId: data.organizationId,
            amount: data.amount,
            distanceKm: data.distanceKm,
            description: data.description,
            receiptUrl: data.receiptUrl,
            leaveFrom: data.leaveFrom,
            leaveTo: data.leaveTo,
            status: data.status,
            createdAt: safeDate(data.createdAt) || new Date(),
            updatedAt: safeDate(data.updatedAt),
            approvedBy: data.approvedBy,
            approvedAt: safeDate(data.approvedAt),
            rejectedBy: data.rejectedBy,
            rejectedAt: safeDate(data.rejectedAt),
            rejectionReason: data.rejectionReason,
            salaryLedgerId: data.salaryLedgerId,
          } as ValidationRequest;
        });
        setRequests(list);
        setLoading(false);
      },
      (err) => {
        console.error('useValidationRequests:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [orgId, options.userId, options.status]);

  return { requests, loading };
}

/** Admin: approve or reject a validation request */
export async function approveValidationRequest(
  organizationId: string,
  requestId: string,
  approved: boolean,
  userId: string,
  rejectionReason?: string
): Promise<void> {
  if (!db) throw new Error('Database not initialized');
  const ref = doc(
    db,
    FIRESTORE_COLLECTIONS.ORGANIZATIONS,
    organizationId,
    FIRESTORE_COLLECTIONS.VALIDATION_REQUESTS,
    requestId
  );
  if (approved) {
    await updateDoc(ref, {
      status: 'APPROVED',
      approvedBy: userId,
      approvedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } else {
    await updateDoc(ref, {
      status: 'REJECTED',
      rejectedBy: userId,
      rejectedAt: serverTimestamp(),
      rejectionReason: rejectionReason || null,
      updatedAt: serverTimestamp(),
    });
  }
}

/** Accounts: mark request as added to salary (optional) */
export async function linkValidationRequestToSalary(
  organizationId: string,
  requestId: string,
  salaryLedgerId: string
): Promise<void> {
  if (!db) throw new Error('Database not initialized');
  const ref = doc(
    db,
    FIRESTORE_COLLECTIONS.ORGANIZATIONS,
    organizationId,
    FIRESTORE_COLLECTIONS.VALIDATION_REQUESTS,
    requestId
  );
  await updateDoc(ref, { salaryLedgerId, updatedAt: serverTimestamp() });
}
