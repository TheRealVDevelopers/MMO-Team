import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { FIRESTORE_COLLECTIONS } from '../constants';

export interface JMSDoc {
  id: string;
  caseId: string;
  status: string;
  launchedAt?: unknown;
  clientSignedAt?: unknown;
  clientSignature?: string;
  itemsDelivered?: string;
  quantitiesReceived?: string;
  missingItems?: string;
}

interface UsePendingJMSReturn {
  pendingDoc: JMSDoc | null;
  signedDoc: JMSDoc | null;
  loading: boolean;
}

/** Listens to cases/{caseId}/jms and returns the pending JMS doc (if any) and whether any is signed. */
export function usePendingJMS(caseId: string | undefined): UsePendingJMSReturn {
  const [pendingDoc, setPendingDoc] = useState<JMSDoc | null>(null);
  const [signedDoc, setSignedDoc] = useState<JMSDoc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db || !caseId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const jmsRef = collection(db, FIRESTORE_COLLECTIONS.CASES, caseId, FIRESTORE_COLLECTIONS.JMS);
    const q = query(jmsRef);
    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as JMSDoc));
      const pending = docs.find((d) => d.status === 'pending');
      const signed = docs.find((d) => d.status === 'signed' || d.clientSignedAt);
      setPendingDoc(pending ?? null);
      setSignedDoc(signed ?? null);
      setLoading(false);
    }, (err) => {
      console.error('usePendingJMS:', err);
      setLoading(false);
    });
    return () => unsub();
  }, [caseId]);

  return { pendingDoc, signedDoc, loading };
}

export default usePendingJMS;
