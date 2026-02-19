/**
 * Chat messages under cases/{caseId}/messages.
 * Used for lead → project group chat (Client, Sales, SGM, Super Admin, Project Head when converted).
 */

import { useState, useEffect } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

export interface CaseMessage {
  id: string;
  caseId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'voice';
  timestamp: Date;
  readBy?: string[];
  attachmentUrl?: string;
}

function toDate(v: unknown): Date {
  if (v == null) return new Date();
  if (v instanceof Date) return v;
  if (typeof (v as any).toDate === 'function') return (v as any).toDate();
  if (typeof (v as any).seconds === 'number') return new Date((v as any).seconds * 1000);
  return new Date(v as string | number);
}

export function useCaseMessages(caseId: string | undefined) {
  const [messages, setMessages] = useState<CaseMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!db || !caseId || typeof caseId !== 'string') {
      setMessages([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const messagesRef = collection(db, 'cases', caseId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: CaseMessage[] = snapshot.docs.map((doc) => {
          const d = doc.data();
          return {
            id: doc.id,
            caseId: d.caseId ?? caseId,
            senderId: d.senderId ?? '',
            senderName: d.senderName ?? 'Unknown',
            senderRole: d.senderRole ?? 'team',
            content: d.content ?? '',
            type: d.type ?? 'text',
            timestamp: toDate(d.timestamp),
            readBy: d.readBy ?? [],
            attachmentUrl: d.attachmentUrl,
          };
        });
        setMessages(list);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [caseId]);

  return { messages, loading, error };
}

export async function sendCaseMessage(
  caseId: string,
  payload: {
    senderId: string;
    senderName: string;
    senderRole: string;
    content: string;
    type?: 'text' | 'image' | 'file' | 'voice';
    attachmentUrl?: string;
  }
): Promise<string> {
  const messagesRef = collection(db, 'cases', caseId, 'messages');
  const docRef = await addDoc(messagesRef, {
    caseId,
    senderId: payload.senderId,
    senderName: payload.senderName,
    senderRole: payload.senderRole,
    content: payload.content,
    type: payload.type ?? 'text',
    attachmentUrl: payload.attachmentUrl ?? null,
    timestamp: serverTimestamp(),
    readBy: [],
  });
  return docRef.id;
}
